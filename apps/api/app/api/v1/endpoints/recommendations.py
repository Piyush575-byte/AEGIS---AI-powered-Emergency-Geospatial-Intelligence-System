import uuid
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Recommendation, RelocationPlan, PlanAssignment, AuditLedger

router = APIRouter()

class ApprovalRequest(BaseModel):
    approved_by: str = "District Collector & Chairman, DDMA Wayanad"
    authority_role: str = "DDMA / District Authority"
    notes: Optional[str] = "Statutory concurrence granted following Route R1 bridge failure. Plan V2 executed."

class RejectionRequest(BaseModel):
    rejected_by: str = "District Collector & Chairman, DDMA Wayanad"
    rejection_reason: str = "Alternative shelter location requested by incident command."

def _format_rec(rec):
    if not rec:
        return None
    return {
        "recommendation_id": str(rec.id),
        "incident_id": str(rec.incident_id),
        "plan_id": str(rec.plan_id),
        "status": rec.status,
        "affected_habitation": {
            "id": str(rec.affected_habitation_id),
            "code": rec.affected_habitation.code if rec.affected_habitation else "HAB-CHOORALMALA",
            "name": rec.affected_habitation.name if rec.affected_habitation else "Chooralmala",
            "population": rec.affected_population
        },
        "recommended_shelter": {
            "id": str(rec.recommended_shelter_id) if rec.recommended_shelter_id else None,
            "code": rec.recommended_shelter.code if rec.recommended_shelter else None,
            "name": rec.recommended_shelter.name if rec.recommended_shelter else None
        },
        "recommended_route": {
            "id": str(rec.recommended_route_id) if rec.recommended_route_id else None,
            "code": rec.recommended_route.code if rec.recommended_route else None,
            "name": rec.recommended_route.name if rec.recommended_route else None
        },
        "summary": rec.summary,
        "evaluations": rec.evaluations_json,
        "mcda_ranking": rec.mcda_scores_json,
        "route_details": rec.route_details_json,
        "created_at": rec.created_at.isoformat() if rec.created_at else None
    }

@router.get("")
def list_recommendations(db: Session = Depends(get_db)):
    """
    Returns the latest active recommendation or status.
    """
    rec = db.query(Recommendation).order_by(Recommendation.created_at.desc()).first()
    if not rec:
        return {"recommendation": None, "has_active_recommendation": False}
    return {
        "recommendation": _format_rec(rec),
        "has_active_recommendation": True
    }

@router.get("/latest")
def get_latest_recommendation(db: Session = Depends(get_db)):
    """
    Returns the most recent recommendation.
    """
    rec = db.query(Recommendation).order_by(Recommendation.created_at.desc()).first()
    if not rec:
        raise HTTPException(status_code=404, detail="No recommendation generated yet.")
    return _format_rec(rec)

@router.get("/{change_event_id}")
def get_recommendation(change_event_id: str, db: Session = Depends(get_db)):
    """
    Retrieves stored recommendation and decision breakdown by change_event_id (incident ID) or recommendation ID.
    """
    if change_event_id.lower() == "latest":
        rec = db.query(Recommendation).order_by(Recommendation.created_at.desc()).first()
        if not rec:
            raise HTTPException(status_code=404, detail="No recommendation found.")
        return _format_rec(rec)

    try:
        query_uuid = uuid.UUID(change_event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format for change_event_id.")

    rec = (
        db.query(Recommendation)
        .filter(
            (Recommendation.incident_id == query_uuid) | (Recommendation.id == query_uuid)
        )
        .order_by(Recommendation.created_at.desc())
        .first()
    )

    if not rec:
        raise HTTPException(status_code=404, detail="No recommendation found for this change event ID.")

    return _format_rec(rec)


@router.post("/{recommendation_id}/approve")
def approve_recommendation(
    recommendation_id: str,
    req: ApprovalRequest = ApprovalRequest(),
    db: Session = Depends(get_db)
):
    """
    Human Authority Approval:
    Approves the advisory recommendation, preserves Plan V1 as historical record,
    creates Plan V2 with reassigned shelter/route, and records cryptographically linked audit events.
    """
    try:
        rec_uuid = uuid.UUID(recommendation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid recommendation UUID.")

    rec = db.query(Recommendation).filter(Recommendation.id == rec_uuid).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found.")

    if rec.status == "approved":
        # Already approved, return active Plan V2
        existing_v2 = db.query(RelocationPlan).filter_by(plan_code="AEGIS-PLAN-WAYANAD-V2").first()
        if existing_v2:
            return {
                "message": "Recommendation was already approved.",
                "plan_v2_id": str(existing_v2.id),
                "plan_code": existing_v2.plan_code,
                "version": existing_v2.version,
                "status": existing_v2.status
            }

    if rec.status == "rejected":
        raise HTTPException(
            status_code=400,
            detail="Cannot approve recommendation: This proposal was previously rejected by statutory authority. A new scenario or reassessment must be initiated."
        )

    # 1. Update Recommendation status
    if not rec.recommended_shelter_id or not rec.recommended_route_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot approve recommendation: No feasible alternative shelter or corridor available in this scenario. Manual field intervention required."
        )

    rec.status = "approved"

    # 2. Invalidate Plan V1 (Preserve as historical record!)
    plan_v1 = db.query(RelocationPlan).filter(RelocationPlan.id == rec.plan_id).first()
    if plan_v1:
        plan_v1.status = "invalidated"
        plan_v1.invalidated_at = datetime.now(timezone.utc)
        plan_v1.invalidation_reason = f"Superseded by Plan V2 following Route R1 bridge failure. Approved by {req.approved_by}."
        for a in plan_v1.assignments:
            a.status = "invalidated"

    # 3. Create Plan V2
    plan_v2 = RelocationPlan(
        plan_code="AEGIS-PLAN-WAYANAD-V2",
        version=2,
        status="approved",
        total_evacuees=rec.affected_population,
        approved_by=req.approved_by,
        approved_at=datetime.now(timezone.utc),
        decision_context={
            "supersedes_plan": plan_v1.plan_code if plan_v1 else "AEGIS-PLAN-WAYANAD-V1",
            "supersedes_version": 1,
            "recommendation_id": str(rec.id),
            "incident_id": str(rec.incident_id),
            "rationale": rec.summary,
            "approval_notes": req.notes,
            "authority_role": req.authority_role,
            "mcda_selection": {
                "shelter_code": rec.recommended_shelter.code if rec.recommended_shelter else None,
                "route_code": rec.recommended_route.code if rec.recommended_route else None,
                "mcda_composite_score": 1.0
            }
        }
    )
    db.add(plan_v2)
    db.flush()

    # 4. Create Plan V2 Assignment
    assignment_v2 = PlanAssignment(
        plan_id=plan_v2.id,
        habitation_id=rec.affected_habitation_id,
        shelter_id=rec.recommended_shelter_id,
        route_id=rec.recommended_route_id,
        allocated_population=rec.affected_population,
        priority_order=1,
        status="active"
    )
    db.add(assignment_v2)
    db.flush()

    # 5. Cryptographic Audit Log Event #3: HUMAN_APPROVAL
    latest_audit = db.query(AuditLedger).order_by(AuditLedger.sequence_num.desc()).first()
    prev_hash = latest_audit.curr_hash if latest_audit else None
    seq_3 = (latest_audit.sequence_num + 1) if latest_audit else 1

    payload_3 = {
        "action": "HUMAN_AUTHORITY_APPROVAL",
        "authority_role": req.authority_role,
        "approved_by": req.approved_by,
        "recommendation_id": str(rec.id),
        "notes": req.notes,
        "approved_shelter": rec.recommended_shelter.name if rec.recommended_shelter else None,
        "approved_route": rec.recommended_route.code if rec.recommended_route else None,
        "evacuees": rec.affected_population
    }
    hash_3 = AuditLedger.compute_hash(seq_3, "HUMAN_APPROVAL", req.approved_by, prev_hash, payload_3)
    audit_3 = AuditLedger(
        sequence_num=seq_3,
        event_type="HUMAN_APPROVAL",
        actor=req.approved_by,
        prev_hash=prev_hash,
        curr_hash=hash_3,
        payload=payload_3,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit_3)
    db.flush()

    # 6. Cryptographic Audit Log Event #4: PLAN_V2_CREATED
    seq_4 = seq_3 + 1
    payload_4 = {
        "action": "PLAN_V2_COMMITTED",
        "plan_id": str(plan_v2.id),
        "plan_code": plan_v2.plan_code,
        "version": 2,
        "status": "approved",
        "total_evacuees": plan_v2.total_evacuees,
        "supersedes": plan_v1.plan_code if plan_v1 else "AEGIS-PLAN-WAYANAD-V1",
        "assignment": {
            "habitation": rec.affected_habitation.name,
            "shelter": rec.recommended_shelter.name if rec.recommended_shelter else None,
            "route": rec.recommended_route.code if rec.recommended_route else None,
            "population": rec.affected_population
        }
    }
    hash_4 = AuditLedger.compute_hash(seq_4, "PLAN_V2_CREATED", "AEGIS Decision Engine", hash_3, payload_4)
    audit_4 = AuditLedger(
        sequence_num=seq_4,
        event_type="PLAN_V2_CREATED",
        actor="AEGIS Decision Engine",
        prev_hash=hash_3,
        curr_hash=hash_4,
        payload=payload_4,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit_4)

    db.commit()

    try:
        from app.core.ws import manager
        manager.broadcast_sync({
            "event": "PLAN_V2_APPROVED",
            "plan_version": 2,
            "approved_by": plan_v2.approved_by,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception:
        pass

    return {
        "status": "SUCCESS",
        "message": "Statutory human approval recorded. Plan V2 is now the active operational plan.",
        "plan_v1": {
            "id": str(plan_v1.id) if plan_v1 else None,
            "plan_code": plan_v1.plan_code if plan_v1 else None,
            "status": plan_v1.status if plan_v1 else None
        },
        "plan_v2": {
            "id": str(plan_v2.id),
            "plan_code": plan_v2.plan_code,
            "version": plan_v2.version,
            "status": plan_v2.status,
            "approved_by": plan_v2.approved_by,
            "approved_at": plan_v2.approved_at.isoformat() if plan_v2.approved_at else None,
            "assignment": {
                "habitation": rec.affected_habitation.name,
                "shelter": rec.recommended_shelter.name if rec.recommended_shelter else None,
                "route": rec.recommended_route.code if rec.recommended_route else None,
                "population": rec.affected_population
            }
        },
        "audit_chain": {
            "approval_event_seq": seq_3,
            "approval_hash": hash_3,
            "plan_v2_event_seq": seq_4,
            "plan_v2_hash": hash_4
        }
    }

@router.post("/{recommendation_id}/reject")
def reject_recommendation(
    recommendation_id: str,
    req: RejectionRequest,
    db: Session = Depends(get_db)
):
    try:
        rec_uuid = uuid.UUID(recommendation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid recommendation UUID.")

    rec = db.query(Recommendation).filter(Recommendation.id == rec_uuid).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found.")

    if rec.status == "approved":
        raise HTTPException(status_code=400, detail="Cannot reject recommendation: Plan V2 has already been approved and committed.")
    if rec.status == "rejected":
        return {"status": "REJECTED", "message": "Recommendation was already rejected."}

    if not req.rejection_reason or not req.rejection_reason.strip():
        raise HTTPException(status_code=422, detail="A valid rejection reason must be provided.")

    rec.status = "rejected"
    
    # Audit event
    latest_audit = db.query(AuditLedger).order_by(AuditLedger.sequence_num.desc()).first()
    prev_hash = latest_audit.curr_hash if latest_audit else None
    seq = (latest_audit.sequence_num + 1) if latest_audit else 1

    payload = {
        "action": "RECOMMENDATION_REJECTED",
        "rejected_by": req.rejected_by,
        "reason": req.rejection_reason.strip(),
        "recommendation_id": str(rec.id),
        "plan_version": 1,
        "affected_habitation": rec.affected_habitation.name if rec.affected_habitation else "Chooralmala",
        "affected_population": rec.affected_population,
        "status": "rejected"
    }
    h = AuditLedger.compute_hash(seq, "RECOMMENDATION_REJECTED", req.rejected_by, prev_hash, payload)
    audit = AuditLedger(
        sequence_num=seq,
        event_type="RECOMMENDATION_REJECTED",
        actor=req.rejected_by,
        prev_hash=prev_hash,
        curr_hash=h,
        payload=payload,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    db.commit()

    # Broadcast WebSocket update
    try:
        from app.core.ws import manager
        manager.broadcast_sync({
            "event": "RECOMMENDATION_REJECTED",
            "recommendation_id": str(rec.id),
            "rejected_by": req.rejected_by,
            "reason": req.rejection_reason.strip(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception:
        pass

    return {"status": "REJECTED", "message": "Recommendation marked as rejected by human authority."}


class RequestChangesRequest(BaseModel):
    requested_by: str = "District Collector & Chairman, DDMA Wayanad"
    reason: str = "Verify alternate corridor before approval."

@router.post("/{recommendation_id}/request-changes")
def request_changes_recommendation(
    recommendation_id: str,
    req: RequestChangesRequest,
    db: Session = Depends(get_db)
):
    """
    Statutory Authority requests changes on recommendation.
    Records CHANGES_REQUESTED in the SHA-256 audit ledger, updates recommendation status,
    and broadcasts the update to connected dashboards without creating Plan V2.
    """
    try:
        rec_uuid = uuid.UUID(recommendation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid recommendation UUID.")

    rec = db.query(Recommendation).filter(Recommendation.id == rec_uuid).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found.")

    if rec.status == "approved":
        raise HTTPException(status_code=400, detail="Cannot request changes: Recommendation is already approved.")
    if rec.status == "rejected":
        raise HTTPException(status_code=400, detail="Cannot request changes: Recommendation is already rejected.")

    if not req.reason or not req.reason.strip():
        raise HTTPException(status_code=422, detail="A valid reason must be provided to request changes.")

    rec.status = "changes_requested"

    # Audit event
    latest_audit = db.query(AuditLedger).order_by(AuditLedger.sequence_num.desc()).first()
    prev_hash = latest_audit.curr_hash if latest_audit else None
    seq = (latest_audit.sequence_num + 1) if latest_audit else 1

    payload = {
        "action": "CHANGES_REQUESTED",
        "requested_by": req.requested_by,
        "reason": req.reason.strip(),
        "recommendation_id": str(rec.id),
        "plan_version": 1,
        "affected_habitation": rec.affected_habitation.name if rec.affected_habitation else "Chooralmala",
        "affected_population": rec.affected_population,
        "status": "changes_requested"
    }
    h = AuditLedger.compute_hash(seq, "CHANGES_REQUESTED", req.requested_by, prev_hash, payload)
    audit = AuditLedger(
        sequence_num=seq,
        event_type="CHANGES_REQUESTED",
        actor=req.requested_by,
        prev_hash=prev_hash,
        curr_hash=h,
        payload=payload,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    db.commit()

    # Broadcast WebSocket update
    try:
        from app.core.ws import manager
        manager.broadcast_sync({
            "event": "RECOMMENDATION_CHANGES_REQUESTED",
            "recommendation_id": str(rec.id),
            "requested_by": req.requested_by,
            "reason": req.reason.strip(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception:
        pass

    return {
        "status": "CHANGES_REQUESTED",
        "message": "Operational modification/change request recorded. Approval has not occurred.",
        "recommendation_id": str(rec.id),
        "reason": req.reason.strip()
    }

class ModificationRequest(BaseModel):
    modified_by: str = "District Collector & Chairman, DDMA Wayanad"
    authority_role: str = "DDMA / District Authority"
    notes: str = "Approved with operational modification: Added transit escort and medical triage on Route R4 bypass corridor."

@router.post("/{recommendation_id}/modify")
def modify_and_approve_recommendation(
    recommendation_id: str,
    req: ModificationRequest,
    db: Session = Depends(get_db)
):
    """
    Approves the recommendation with human authority modifications/stipulations.
    """
    approval_req = ApprovalRequest(
        approved_by=req.modified_by,
        authority_role=req.authority_role,
        notes=f"MODIFIED APPROVAL: {req.notes}"
    )
    return approve_recommendation(recommendation_id=recommendation_id, req=approval_req, db=db)

