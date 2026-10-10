from typing import List, Dict, Any
from app.services.constraint_filtering import ShelterEvaluation
from app.services.router import RoutePathResult

class MCDAShelterScore:
    def __init__(
        self,
        shelter_code: str,
        shelter_name: str,
        is_feasible: bool,
        rejection_reason: str | None,
        distance_km: float,
        headroom_pax: int,
        medical_support: bool,
        route_safety: float, # 0.0 to 1.0
        distance_score: float, # 0.0 to 1.0
        headroom_score: float, # 0.0 to 1.0
        medical_score: float, # 0.0 or 1.0
        composite_score: float, # 0.0 to 1.0
        rank: int,
        rationale: str
    ):
        self.shelter_code = shelter_code
        self.shelter_name = shelter_name
        self.is_feasible = is_feasible
        self.rejection_reason = rejection_reason
        self.distance_km = distance_km
        self.headroom_pax = headroom_pax
        self.medical_support = medical_support
        self.route_safety = route_safety
        self.distance_score = distance_score
        self.headroom_score = headroom_score
        self.medical_score = medical_score
        self.composite_score = composite_score
        self.rank = rank
        self.rationale = rationale

    def to_dict(self) -> Dict[str, Any]:
        return {
            "shelter_code": self.shelter_code,
            "shelter_name": self.shelter_name,
            "is_feasible": self.is_feasible,
            "rejection_reason": self.rejection_reason,
            "distance_km": round(self.distance_km, 2),
            "headroom_pax": self.headroom_pax,
            "medical_support": self.medical_support,
            "score_breakdown": {
                "distance_score_35pct": round(self.distance_score, 3),
                "headroom_score_30pct": round(self.headroom_score, 3),
                "route_safety_score_20pct": round(self.route_safety, 3),
                "medical_support_score_15pct": round(self.medical_score, 3),
                "composite_score": round(self.composite_score, 4),
            },
            "rank": self.rank,
            "rationale": self.rationale
        }

def rank_shelters_mcda(
    evaluations: List[ShelterEvaluation],
    routing_results: Dict[str, RoutePathResult],
    weights: Dict[str, float] = None
) -> List[MCDAShelterScore]:
    """
    Step 4 of Decision Engine: Weighted Multi-Criteria Decision Analysis (MCDA)
    for ranking feasible relocation destination alternatives.
    """
    if weights is None:
        weights = {
            "distance": 0.35,
            "headroom": 0.30,
            "route_safety": 0.20,
            "medical": 0.15
        }

    # Extract feasible candidates with viable paths
    feasible_items = []
    infeasible_scores = []

    for ev in evaluations:
        code = ev.shelter.code
        route_res = routing_results.get(code)
        
        # Check if route is reachable
        if not route_res or not route_res.is_reachable:
            infeasible_scores.append(
                MCDAShelterScore(
                    shelter_code=code,
                    shelter_name=ev.shelter.name,
                    is_feasible=False,
                    rejection_reason=ev.rejection_reason or "No viable route corridor available (access severed)",
                    distance_km=0.0,
                    headroom_pax=ev.headroom_pax,
                    medical_support=ev.medical_support,
                    route_safety=0.0,
                    distance_score=0.0,
                    headroom_score=0.0,
                    medical_score=0.0,
                    composite_score=0.0,
                    rank=999,
                    rationale=ev.rejection_reason or "No viable route corridor available"
                )
            )
            continue

        if not ev.is_feasible:
            infeasible_scores.append(
                MCDAShelterScore(
                    shelter_code=code,
                    shelter_name=ev.shelter.name,
                    is_feasible=False,
                    rejection_reason=ev.rejection_reason,
                    distance_km=route_res.total_distance_km,
                    headroom_pax=ev.headroom_pax,
                    medical_support=ev.medical_support,
                    route_safety=0.0,
                    distance_score=0.0,
                    headroom_score=0.0,
                    medical_score=0.0,
                    composite_score=0.0,
                    rank=999,
                    rationale=ev.rejection_reason or "Rejected by operational constraint filter"
                )
            )
            continue

        feasible_items.append((ev, route_res))

    if not feasible_items:
        return sorted(infeasible_scores, key=lambda x: x.shelter_code)

    # Calculate normalization boundaries among feasible candidates
    distances = [r.total_distance_km for _, r in feasible_items]
    headrooms = [ev.headroom_pax for ev, _ in feasible_items]

    min_dist, max_dist = min(distances), max(distances)
    min_head, max_head = min(headrooms), max(headrooms)

    scored_feasible: List[MCDAShelterScore] = []

    for ev, r_res in feasible_items:
        dist = r_res.total_distance_km
        headroom = ev.headroom_pax

        # Normalized Distance score (shorter is better: 1.0 for min_dist)
        if max_dist == min_dist:
            dist_score = 1.0
        else:
            dist_score = 1.0 - ((dist - min_dist) / (max_dist - min_dist))

        # Normalized Headroom score (higher surplus is better: 1.0 for max_head)
        if max_head == min_head:
            head_score = 1.0
        else:
            head_score = (headroom - min_head) / (max_head - min_head)

        # Route safety score (highway bypass corridor R4 gets 1.0, local tracks 0.5)
        route_safety_score = 1.0 if r_res.primary_route_code == "R4" else 0.6

        # Medical support score
        med_score = 1.0 if ev.medical_support else 0.0

        # Weighted Composite Score
        composite = (
            weights["distance"] * dist_score +
            weights["headroom"] * head_score +
            weights["route_safety"] * route_safety_score +
            weights["medical"] * med_score
        )

        rationale = (
            f"Feasible alternative: {round(dist, 1)} km transit via corridor {r_res.primary_route_code}, "
            f"{headroom} bed surplus headroom, medical triage: {'YES' if ev.medical_support else 'NO'}."
        )

        scored_feasible.append(
            MCDAShelterScore(
                shelter_code=ev.shelter.code,
                shelter_name=ev.shelter.name,
                is_feasible=True,
                rejection_reason=None,
                distance_km=dist,
                headroom_pax=headroom,
                medical_support=ev.medical_support,
                route_safety=route_safety_score,
                distance_score=dist_score,
                headroom_score=head_score,
                medical_score=med_score,
                composite_score=composite,
                rank=1, # Updated below after sorting
                rationale=rationale
            )
        )

    # Sort feasible by composite score descending
    scored_feasible.sort(key=lambda s: s.composite_score, reverse=True)
    for idx, item in enumerate(scored_feasible, 1):
        item.rank = idx

    return scored_feasible + infeasible_scores
