import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models import (
    Incident,
    Route,
    Shelter,
    Habitation,
    RelocationPlan,
    PlanAssignment,
    Recommendation,
    AuditLedger
)
from app.services.change_detection import detect_and_apply_changes, ChangeDetectionResult
from app.services.affected_detection import identify_affected_assignments, AffectedAssignmentResult
from app.services.constraint_filtering import filter_shelter_constraints
from app.services.router import WayanadAStarRouter
from app.services.mcda import rank_shelters_mcda

def run_decision_cycle(
    db: Session,
    incident_type: str = "bridge_failure",
    description: str = "Field incident reported",
    corridor_code: Optional[str] = None,
    plan_id: Optional[uuid.UUID] = None,
    # Extended simulator parameters
    change_type: str = "route",
    route_status: Optional[str] = None,
    route_reason: Optional[str] = None,
    shelter_code: Optional[str] = None,
    new_capacity: Optional[int] = None,
    shelter_status: Optional[str] = None,
    medical_support: Optional[bool] = None,
    hazard_code: Optional[str] = None,
    hazard_action: Optional[str] = None,
    radius_km_delta: Optional[float] = None,
    lat_offset: Optional[float] = None,
    lon_offset: Optional[float] = None,
    habitation_code: Optional[str] = None,
    population_delta: Optional[int] = None,
    source_name: str = "Field Team 07",
    batch_events: Optional[List[dict]] = None
) -> Dict[str, Any]:
    """
    Core AEGIS Decision Engine Cycle:
    External Ground Event -> Structured Change Ingestion -> PostGIS Spatial Impact Analysis
    -> Plan Invalidation Detection -> Constraint Filtering -> A* Routing -> Weighted MCDA
    -> Statutory Advisory Recommendation (Pending Human Approval) -> Cryptographic SHA-256 Audit Trail.
    """
    # 1. Step 1: Detect and apply changes to PostgreSQL / PostGIS world state
    change_res = detect_and_apply_changes(
        db=db,
        incident_type=incident_type,
        description=description,
        corridor_code=corridor_code,
        severity="critical",
        raw_payload={"corridor": corridor_code, "simulation_trigger": True},
        change_type=change_type,
        route_status=route_status,
        route_reason=route_reason,
        shelter_code=shelter_code,
        new_capacity=new_capacity,
        shelter_status=shelter_status,
        medical_support=medical_support,
        hazard_code=hazard_code,
        hazard_action=hazard_action,
        radius_km_delta=radius_km_delta,
        lat_offset=lat_offset,
        lon_offset=lon_offset,
        habitation_code=habitation_code,
        population_delta=population_delta,
        source_name=source_name,
        batch_events=batch_events
    )

    # 2. Step 2: Identify affected plan assignments in current approved relocation plan
    affected_res = identify_affected_assignments(
        db=db,
        affected_routes=change_res.affected_routes,
        affected_shelters=change_res.affected_shelters,
        affected_habitations=change_res.affected_habitations,
        plan_id=plan_id
    )

    # 3. Handle Recovery / Reopening or No Direct Invalidation
    if not affected_res.affected_assignments:
        is_reopen = (route_status == "clear" or route_reason == "reopened")
        latest_audit = db.query(AuditLedger).order_by(AuditLedger.sequence_num.desc()).first()
        prev_hash = latest_audit.curr_hash if latest_audit else None
        next_seq = (latest_audit.sequence_num + 1) if latest_audit else 1

        audit_payload = {
            "event": "ROUTE_REOPENED_EVALUATED" if is_reopen else "GROUND_CONDITION_UPDATE_STABLE",
            "incident_id": str(change_res.incident.id),
            "source": source_name,
            "change_type": change_type,
            "details": change_res.details,
            "operational_status": "EXISTING_PLAN_FEASIBLE"
        }
        audit_hash = AuditLedger.compute_hash(next_seq, audit_payload["event"], "AEGIS Decision Engine", prev_hash, audit_payload)
        audit_entry = AuditLedger(
            sequence_num=next_seq,
            event_type=audit_payload["event"],
            actor="AEGIS Decision Engine",
            prev_hash=prev_hash,
            curr_hash=audit_hash,
            payload=audit_payload,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(audit_entry)
        db.commit()

        message = (
            f"Corridor {corridor_code or 'R1'} reopened and verified CLEAR. Current evacuation plan remains feasible and safe."
            if is_reopen else
            "Reported event processed. Current evacuation assignments remain operational and feasible."
        )

        return {
            "status": "RECOVERED" if is_reopen else "NO_IMPACT",
            "message": message,
            "what_changed": change_res.details,
            "what_is_affected": "Zero active assignments severed. System monitoring network integrity.",
            "is_plan_feasible": True,
            "human_approval_required": False,
            "incident": {
                "id": str(change_res.incident.id),
                "type": change_res.incident.incident_type,
                "description": change_res.incident.description,
                "affected_corridors": [r.code for r in change_res.affected_routes],
                "affected_shelters": [s.code for s in change_res.affected_shelters]
            },
            "affected": None,
            "recommendation": None,
            "audit": {
                "sequence_num": next_seq,
                "prev_hash": prev_hash,
                "curr_hash": audit_hash
            }
        }

    # 4. Primary affected assignment (e.g. Chooralmala with 120 evacuees)
    primary_assignment = affected_res.affected_assignments[0]
    affected_hab = primary_assignment.habitation
    required_capacity = primary_assignment.allocated_population
    invalidation_reason = affected_res.invalidation_reasons.get(str(primary_assignment.id), "Infrastructure or shelter severed.")

    # 5. Step 3: Hard constraint and capacity filtering on all shelters
    # Exclude currently severed/compromised shelters
    exclude_ids = [primary_assignment.shelter_id]
    for s in change_res.affected_shelters:
        if s.status in ("unavailable", "closed"):
            exclude_ids.append(s.id)

    evaluations = filter_shelter_constraints(
        db=db,
        required_capacity=required_capacity,
        exclude_shelter_ids=exclude_ids
    )

    # 6. Step 4: Deterministic A* route feasibility search for all candidate shelters
    router = WayanadAStarRouter(db=db)
    routing_results = {}
    for ev in evaluations:
        route_res = router.find_shortest_path(
            origin_hab_code=affected_hab.code,
            dest_shelter_code=ev.shelter.code
        )
        routing_results[ev.shelter.code] = route_res

    # 7. Step 5: Weighted MCDA Ranking
    mcda_ranks = rank_shelters_mcda(
        evaluations=evaluations,
        routing_results=routing_results
    )

    # Select top-ranked feasible alternative
    top_candidate = next((s for s in mcda_ranks if s.is_feasible and s.rank == 1), None)
    
    rec_shelter = None
    rec_route = None
    route_details = None

    if top_candidate:
        rec_shelter = db.query(Shelter).filter(Shelter.code == top_candidate.shelter_code).first()
        best_route_info = routing_results.get(top_candidate.shelter_code)
        if best_route_info and best_route_info.primary_route_code:
            rec_route = db.query(Route).filter(Route.code == best_route_info.primary_route_code).first()
            route_details = best_route_info.to_dict()

    # Formulate clear rationale summary
    if change_type == "shelter":
        summary_text = (
            f"Shelter {primary_assignment.shelter.name} capacity/status modification invalidated relocation assignment for "
            f"{affected_hab.name} ({required_capacity} evacuees). "
            f"Recommended re-allocation to {rec_shelter.name if rec_shelter else 'N/A'} "
            f"via corridor {rec_route.code if rec_route else 'N/A'} based on capacity surplus (Rank 1 in MCDA)."
        )
    elif change_type == "hazard":
        summary_text = (
            f"Hazard zone {hazard_code or 'active zone'} spatial expansion compromised primary evacuation path for "
            f"{affected_hab.name} ({required_capacity} evacuees). PostGIS spatial analysis detected corridor severance. "
            f"Recommended detour to {rec_shelter.name if rec_shelter else 'N/A'} via corridor {rec_route.code if rec_route else 'N/A'}."
        )
    elif change_type == "population":
        summary_text = (
            f"Population surge at {affected_hab.name} (+{population_delta or 0} evacuees, total {affected_hab.population}) "
            f"exceeded headroom at {primary_assignment.shelter.name}. "
            f"Recommended diversion of evacuees to {rec_shelter.name if rec_shelter else 'N/A'} via {rec_route.code if rec_route else 'N/A'}."
        )
    elif change_type == "cascade":
        summary_text = (
            f"Multi-Hazard Cascade event triggered simultaneous corridor blockage and shelter disruption. "
            f"Assignment for {affected_hab.name} ({required_capacity} evacuees) invalidated. "
            f"Recommended safe resilient routing to {rec_shelter.name if rec_shelter else 'N/A'} via {rec_route.code if rec_route else 'N/A'}."
        )
    else:
        summary_text = (
            f"Route {corridor_code or primary_assignment.route.code} failure severed evacuation corridor for "
            f"{affected_hab.name} ({required_capacity} evacuees). "
            f"Recommended re-routing to {rec_shelter.name if rec_shelter else 'N/A'} "
            f"via corridor {rec_route.code if rec_route else 'N/A'} based on capacity surplus (Rank 1 in MCDA)."
        )

    # 8. Step 6: Persist Recommendation (Always marked pending_human_approval!)
    recommendation = Recommendation(
        incident_id=change_res.incident.id,
        plan_id=affected_res.plan.id,
        status="pending_human_approval",
        affected_habitation_id=affected_hab.id,
        affected_population=required_capacity,
        recommended_shelter_id=rec_shelter.id if rec_shelter else None,
        recommended_route_id=rec_route.id if rec_route else None,
        summary=summary_text,
        evaluations_json=[e.to_dict() for e in evaluations],
        mcda_scores_json=[m.to_dict() for m in mcda_ranks],
        route_details_json=route_details
    )
    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)

    # 9. Step 7: Record Audit Ledger Event in SHA-256 Chain
    latest_audit = db.query(AuditLedger).order_by(AuditLedger.sequence_num.desc()).first()
    prev_hash = latest_audit.curr_hash if latest_audit else None
    next_seq = (latest_audit.sequence_num + 1) if latest_audit else 1

    audit_payload = {
        "event": "RECOMMENDATION_GENERATED",
        "source": source_name,
        "change_type": change_type,
        "incident_id": str(change_res.incident.id),
        "recommendation_id": str(recommendation.id),
        "affected_corridor": corridor_code or (primary_assignment.route.code if primary_assignment.route else None),
        "affected_habitation": affected_hab.name,
        "affected_population": required_capacity,
        "invalidation_reason": invalidation_reason,
        "recommended_shelter": rec_shelter.name if rec_shelter else None,
        "recommended_route": rec_route.code if rec_route else None,
        "status": "pending_human_approval"
    }

    audit_hash = AuditLedger.compute_hash(
        sequence_num=next_seq,
        event_type="RECOMMENDATION_GENERATED",
        actor="AEGIS Decision Engine",
        prev_hash=prev_hash,
        payload=audit_payload
    )

    audit_entry = AuditLedger(
        sequence_num=next_seq,
        event_type="RECOMMENDATION_GENERATED",
        actor="AEGIS Decision Engine",
        prev_hash=prev_hash,
        curr_hash=audit_hash,
        payload=audit_payload,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit_entry)
    db.commit()

    # Broadcast state change to connected dashboards (Laptop A DDMA etc)
    try:
        from app.core.ws import manager
        manager.broadcast_sync({
            "event": "CRITICAL_INCIDENT_DETECTED",
            "incident_type": incident_type,
            "corridor_code": corridor_code,
            "incident_id": str(change_res.incident.id),
            "recommendation_id": str(recommendation.id),
            "affected_population": required_capacity,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception:
        pass

    # Filtered rejected candidates summary for explainability
    rejected_candidates = [
        {"shelter": e.shelter.name, "code": e.shelter.code, "reason": e.rejection_reason}
        for e in evaluations if not e.is_feasible
    ]

    return {
        "status": "RECOMMENDATION_READY",
        "change_event_id": str(change_res.incident.id),
        "recommendation_id": str(recommendation.id),
        "plan_id": str(affected_res.plan.id),
        "plan_code": affected_res.plan.plan_code,
        "human_approval_required": True,
        "what_changed": change_res.details,
        "what_is_affected": {
            "habitation": affected_hab.name,
            "population": required_capacity,
            "compromised_assignment": f"{affected_hab.name} -> {primary_assignment.shelter.name} via {primary_assignment.route.code}",
            "reason": invalidation_reason
        },
        "is_plan_feasible": False,
        "filtered_options": rejected_candidates[:5], # Top 5 rejection rationales
        "incident": {
            "id": str(change_res.incident.id),
            "type": change_res.incident.incident_type,
            "description": change_res.incident.description,
            "affected_corridors": [r.code for r in change_res.affected_routes],
            "affected_shelters": [s.code for s in change_res.affected_shelters],
            "affected_habitations": [h.code for h in change_res.affected_habitations]
        },
        "affected": {
            "habitation_code": affected_hab.code,
            "habitation_name": affected_hab.name,
            "affected_population": required_capacity,
            "previous_shelter": primary_assignment.shelter.name,
            "previous_route": primary_assignment.route.code,
            "assignment_status": primary_assignment.status,
            "invalidation_reason": invalidation_reason
        },
        "recommendation": {
            "id": str(recommendation.id),
            "status": recommendation.status,
            "recommended_shelter_code": rec_shelter.code if rec_shelter else None,
            "recommended_shelter_name": rec_shelter.name if rec_shelter else None,
            "recommended_route_code": rec_route.code if rec_route else None,
            "summary": summary_text,
            "route_details": route_details,
            "mcda_ranking": [m.to_dict() for m in mcda_ranks[:6]],
            "shelter_evaluations": [e.to_dict() for e in evaluations[:6]]
        },
        "audit": {
            "sequence_num": next_seq,
            "prev_hash": prev_hash,
            "curr_hash": audit_hash
        }
    }
