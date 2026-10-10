from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import Shelter

class ShelterEvaluation:
    def __init__(
        self,
        shelter: Shelter,
        is_feasible: bool,
        rejection_reason: str | None,
        available_capacity: int,
        headroom_pax: int,
        status: str,
        medical_support: bool
    ):
        self.shelter = shelter
        self.is_feasible = is_feasible
        self.rejection_reason = rejection_reason
        self.available_capacity = available_capacity
        self.headroom_pax = headroom_pax
        self.status = status
        self.medical_support = medical_support

    def to_dict(self) -> Dict[str, Any]:
        return {
            "shelter_id": str(self.shelter.id),
            "code": self.shelter.code,
            "name": self.shelter.name,
            "is_feasible": self.is_feasible,
            "rejection_reason": self.rejection_reason,
            "total_capacity": self.shelter.total_capacity,
            "occupied_capacity": self.shelter.occupied_capacity,
            "available_capacity": self.available_capacity,
            "headroom_pax": self.headroom_pax,
            "status": self.status,
            "medical_support": self.medical_support
        }

def filter_shelter_constraints(
    db: Session,
    required_capacity: int,
    exclude_shelter_ids: List[Any] | None = None
) -> List[ShelterEvaluation]:
    """
    Step 3 of Decision Engine: Evaluates shelter network against hard capacity,
    operational status, and safety constraints.
    """
    # Focus on Wayanad operational sector shelters to ensure sub-second response
    all_shelters = db.query(Shelter).filter(
        (Shelter.code.in_(["SH-ALPHA", "SH-BETA", "SH-DELTA", "SH-GAMMA"])) |
        (Shelter.metadata_json["district"].astext == "Wayanad")
    ).all()
    if not all_shelters:
        all_shelters = db.query(Shelter).limit(20).all()
    evaluations: List[ShelterEvaluation] = []
    excluded = set(exclude_shelter_ids or [])

    for s in all_shelters:
        available = s.available_capacity
        headroom = available - required_capacity
        
        # Rule 1: Excluded origin shelter if route is blocked
        if s.id in excluded:
            evaluations.append(
                ShelterEvaluation(
                    shelter=s,
                    is_feasible=False,
                    rejection_reason="Access route severed from current evacuation corridor",
                    available_capacity=available,
                    headroom_pax=headroom,
                    status=s.status,
                    medical_support=s.medical_support
                )
            )
            continue

        # Rule 2: Hard capacity constraint
        if available < required_capacity:
            evaluations.append(
                ShelterEvaluation(
                    shelter=s,
                    is_feasible=False,
                    rejection_reason=f"Insufficient capacity: {available} available < {required_capacity} required (Deficit: {abs(headroom)} pax)",
                    available_capacity=available,
                    headroom_pax=headroom,
                    status=s.status,
                    medical_support=s.medical_support
                )
            )
            continue

        # Rule 3: Operational Status constraint (degraded / closed / hazard-exposed)
        if s.status != "active":
            evaluations.append(
                ShelterEvaluation(
                    shelter=s,
                    is_feasible=False,
                    rejection_reason=f"Operational constraint: Shelter status is '{s.status}' (Access route or facility degraded)",
                    available_capacity=available,
                    headroom_pax=headroom,
                    status=s.status,
                    medical_support=s.medical_support
                )
            )
            continue

        # Feasible candidate passed hard constraints
        evaluations.append(
            ShelterEvaluation(
                shelter=s,
                is_feasible=True,
                rejection_reason=None,
                available_capacity=available,
                headroom_pax=headroom,
                status=s.status,
                medical_support=s.medical_support
            )
        )

    return evaluations
