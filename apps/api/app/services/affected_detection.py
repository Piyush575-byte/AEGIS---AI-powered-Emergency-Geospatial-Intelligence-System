import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import RelocationPlan, PlanAssignment, Route, Shelter, Habitation

class AffectedAssignmentResult:
    def __init__(
        self,
        plan: RelocationPlan,
        affected_assignments: List[PlanAssignment],
        total_affected_people: int,
        affected_habitations: List[Habitation],
        invalidation_reasons: Optional[Dict[str, str]] = None
    ):
        self.plan = plan
        self.affected_assignments = affected_assignments
        self.total_affected_people = total_affected_people
        self.affected_habitations = affected_habitations
        self.invalidation_reasons = invalidation_reasons or {}

def identify_affected_assignments(
    db: Session,
    affected_routes: Optional[List[Route]] = None,
    affected_shelters: Optional[List[Shelter]] = None,
    affected_habitations: Optional[List[Habitation]] = None,
    plan_id: Optional[uuid.UUID] = None
) -> AffectedAssignmentResult:
    """
    Step 2 of AEGIS Decision Engine:
    Evaluates current approved evacuation plan assignments against compromised infrastructure,
    shelter capacity deficits, and hazard encroachment to identify stranded populations.
    """
    # 1. Target approved plan (either specified plan_id or current active approved plan)
    plan_query = db.query(RelocationPlan).filter(RelocationPlan.status == "approved")
    if plan_id:
        plan_query = plan_query.filter(RelocationPlan.id == plan_id)
    
    plan = plan_query.order_by(RelocationPlan.version.desc()).first()
    if not plan:
        raise ValueError("No active approved evacuation plan found to evaluate.")

    affected_route_ids = {r.id for r in (affected_routes or []) if r.status in ("blocked", "degraded")}
    affected_shelter_ids = {s.id for s in (affected_shelters or []) if s.status in ("unavailable", "closed")}
    affected_hab_ids = {h.id for h in (affected_habitations or [])}
    
    all_assignments = db.query(PlanAssignment).filter(PlanAssignment.plan_id == plan.id).all()
    affected_assignments: List[PlanAssignment] = []
    affected_habitations_set: Dict[Any, Habitation] = {}
    invalidation_reasons: Dict[str, str] = {}
    total_affected_people = 0

    for assignment in all_assignments:
        is_affected = False
        reason = ""

        # Check 1: Route severed or marked blocked
        if assignment.route_id in affected_route_ids or (assignment.route and assignment.route.status == "blocked"):
            is_affected = True
            reason = f"Evacuation corridor {assignment.route.code} is blocked or impassable."

        # Check 2: Assigned Shelter compromised or unavailable
        elif assignment.shelter_id in affected_shelter_ids or (assignment.shelter and assignment.shelter.status in ("unavailable", "closed")):
            is_affected = True
            reason = f"Destination shelter {assignment.shelter.name} ({assignment.shelter.code}) is unavailable."

        # Check 3: Shelter Capacity Deficit (Assigned evacuees exceed available shelter capacity)
        elif assignment.shelter and assignment.shelter.available_capacity < assignment.allocated_population:
            is_affected = True
            deficit = assignment.allocated_population - assignment.shelter.available_capacity
            reason = f"Shelter {assignment.shelter.name} capacity reduced: available {assignment.shelter.available_capacity} < allocated {assignment.allocated_population} (deficit of {deficit} beds)."

        # Check 4: Habitation population surge or hazard encroachment
        elif assignment.habitation_id in affected_hab_ids:
            current_hab = assignment.habitation
            if current_hab and current_hab.population > assignment.allocated_population:
                # Check if shelter can accommodate the population surge
                surge = current_hab.population - assignment.allocated_population
                if assignment.shelter and assignment.shelter.available_capacity < current_hab.population:
                    is_affected = True
                    reason = f"Population surge in {current_hab.name} (+{surge} pax) exceeds capacity headroom at {assignment.shelter.name}."

        if is_affected:
            assignment.status = "invalidated"
            affected_assignments.append(assignment)
            total_affected_people += assignment.allocated_population
            affected_habitations_set[assignment.habitation_id] = assignment.habitation
            invalidation_reasons[str(assignment.id)] = reason

    db.commit()

    return AffectedAssignmentResult(
        plan=plan,
        affected_assignments=affected_assignments,
        total_affected_people=total_affected_people,
        affected_habitations=list(affected_habitations_set.values()),
        invalidation_reasons=invalidation_reasons
    )
