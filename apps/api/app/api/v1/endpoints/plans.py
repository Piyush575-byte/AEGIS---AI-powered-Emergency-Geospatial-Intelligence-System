import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import RelocationPlan, PlanAssignment

router = APIRouter()

@router.get("/plans")
def list_plans(db: Session = Depends(get_db)):
    """
    Returns all evacuation relocation plans (historical and active).
    """
    plans = db.query(RelocationPlan).order_by(RelocationPlan.version.desc()).all()
    return [
        {
            "id": str(p.id),
            "plan_code": p.plan_code,
            "version": p.version,
            "status": p.status,
            "total_evacuees": p.total_evacuees,
            "approved_by": p.approved_by,
            "approved_at": p.approved_at.isoformat() if p.approved_at else None,
            "invalidated_at": p.invalidated_at.isoformat() if p.invalidated_at else None,
            "invalidation_reason": p.invalidation_reason,
            "decision_context": p.decision_context
        }
        for p in plans
    ]

@router.get("/plans/diff")
def compare_plans(db: Session = Depends(get_db)):
    """
    Part 7: Plan Version Diff
    Compares Plan V1 (baseline) vs Plan V2 (resilient replanned).
    Highlights shelter change, route change, and invalidation cause.
    """
    p1 = db.query(RelocationPlan).filter_by(version=1).first()
    p2 = db.query(RelocationPlan).filter_by(version=2).first()

    if not p1:
        raise HTTPException(status_code=404, detail="Plan V1 not found in database.")

    p1_assign = db.query(PlanAssignment).filter_by(plan_id=p1.id).first()
    p2_assign = db.query(PlanAssignment).filter_by(plan_id=p2.id).first() if p2 else None

    return {
        "has_v2": p2 is not None,
        "plan_v1": {
            "plan_code": p1.plan_code,
            "version": 1,
            "status": p1.status,
            "habitation": p1_assign.habitation.name if p1_assign else "Chooralmala",
            "shelter_code": p1_assign.shelter.code if p1_assign else "SH-ALPHA",
            "shelter_name": p1_assign.shelter.name if p1_assign else "Meppadi Community Hall (Shelter Alpha)",
            "route_code": p1_assign.route.code if p1_assign else "R1",
            "route_name": p1_assign.route.name if p1_assign else "Chooralmala-Meppadi Main Arterial",
            "route_status": p1_assign.route.status if p1_assign else "clear",
            "allocated_population": p1_assign.allocated_population if p1_assign else 120,
            "approved_by": p1.approved_by,
            "invalidation_reason": p1.invalidation_reason
        },
        "plan_v2": {
            "plan_code": p2.plan_code if p2 else "AEGIS-PLAN-WAYANAD-V2 (Pending Approval)",
            "version": 2,
            "status": p2.status if p2 else "pending_generation",
            "habitation": p2_assign.habitation.name if p2_assign else "Chooralmala",
            "shelter_code": p2_assign.shelter.code if p2_assign else "SH-GAMMA",
            "shelter_name": p2_assign.shelter.name if p2_assign else "Vythiri Government Higher Secondary School (Shelter Gamma)",
            "route_code": p2_assign.route.code if p2_assign else "R4",
            "route_name": p2_assign.route.name if p2_assign else "Chooralmala-Vythiri Resilient Bypass Corridor",
            "route_status": p2_assign.route.status if p2_assign else "clear",
            "allocated_population": p2_assign.allocated_population if p2_assign else 120,
            "approved_by": p2.approved_by if p2 else None,
            "approved_at": p2.approved_at.isoformat() if (p2 and p2.approved_at) else None
        },
        "differences": {
            "shelter_changed": True if p2 else False,
            "previous_shelter": p1_assign.shelter.name if p1_assign else "Meppadi Community Hall",
            "new_shelter": p2_assign.shelter.name if p2_assign else "Vythiri GHSS",
            "route_changed": True if p2 else False,
            "previous_route": p1_assign.route.code if p1_assign else "R1",
            "new_route": p2_assign.route.code if p2_assign else "R4",
            "cause": "Route R1 bridge washed out at KM 4.2; Shelter Alpha severed; Vythiri GHSS selected via MCDA Rank #1 over clear corridor R4.",
            "population_reconciled": (p1.total_evacuees == (p2.total_evacuees if p2 else p1.total_evacuees))
        }
    }

@router.get("/assignments")
def get_assignments(
    plan_id: Optional[uuid.UUID] = Query(None, description="UUID of specific plan. If omitted, returns latest plan."),
    db: Session = Depends(get_db)
):
    """
    Returns evacuation plan assignments, indicating current status (active or invalidated).
    """
    if plan_id:
        plan = db.query(RelocationPlan).filter(RelocationPlan.id == plan_id).first()
    else:
        plan = db.query(RelocationPlan).order_by(RelocationPlan.version.desc()).first()

    if not plan:
        raise HTTPException(status_code=404, detail="No relocation plan found.")

    assignments = db.query(PlanAssignment).filter(PlanAssignment.plan_id == plan.id).all()
    
    return {
        "plan_id": str(plan.id),
        "plan_code": plan.plan_code,
        "version": plan.version,
        "plan_status": plan.status,
        "total_evacuees": plan.total_evacuees,
        "assignments": [
            {
                "id": str(a.id),
                "habitation_code": a.habitation.code,
                "habitation_name": a.habitation.name,
                "shelter_code": a.shelter.code,
                "shelter_name": a.shelter.name,
                "route_code": a.route.code,
                "route_name": a.route.name,
                "allocated_population": a.allocated_population,
                "priority_order": a.priority_order,
                "status": a.status
            }
            for a in assignments
        ]
    }
