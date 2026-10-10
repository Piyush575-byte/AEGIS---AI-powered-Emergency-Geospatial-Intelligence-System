import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Route, Shelter, HazardZone, Habitation, RelocationPlan, PlanAssignment, Recommendation, AuditLedger
from app.services.decision_engine import run_decision_cycle

router = APIRouter()

# -------------------------------------------------------------
# Request Schemas
# -------------------------------------------------------------
class RouteBlockSimulationRequest(BaseModel):
    corridor_code: str = "R1"
    description: str = "SIMULATION EVENT: Landslide surge severed bridge on primary evacuation corridor R1 at KM 4.2"
    incident_type: str = "bridge_failure"
    source: str = "Field Team 07"

class RouteSimulationRequest(BaseModel):
    corridor_code: str = "R1"
    status: str = "blocked" # blocked, degraded, clear
    reason: str = "bridge_failure" # bridge_failure, flooding, landslide, debris, road_damage, reopened
    description: Optional[str] = None
    source: str = "Field Team 07"

class ShelterSimulationRequest(BaseModel):
    shelter_code: str = "SH-ALPHA"
    new_capacity: Optional[int] = None # e.g. 80 (reduced from 300)
    status: Optional[str] = None # active, full, unavailable, closed, degraded_access
    medical_support: Optional[bool] = None
    reason: Optional[str] = "capacity_reduction" # capacity_reduction, shelter_full, shelter_damaged, access_degraded
    description: Optional[str] = None
    source: str = "Shelter Registry"

class HazardSimulationRequest(BaseModel):
    hazard_code: str = "HZ-CHOORALMALA-SLOPE"
    action: str = "expand" # expand, move, change_severity, activate, deactivate
    radius_km_delta: Optional[float] = 1.5 # buffer in km
    lat_offset: Optional[float] = None
    lon_offset: Optional[float] = None
    severity: Optional[str] = "critical"
    description: Optional[str] = None
    source: str = "GIS Remote Sensing"

class PopulationSimulationRequest(BaseModel):
    habitation_code: str = "HAB-CHOORALMALA"
    population_delta: int = 80 # +80 people
    risk_level: Optional[str] = "critical"
    description: Optional[str] = None
    source: str = "District EOC"

class IncidentReportRequest(BaseModel):
    incident_type: str = "bridge_failure" # bridge_failure, landslide, flooding, road_block, debris_flow, shelter_damage, access_interruption
    location: str = "Route R1 KM 4.2"
    severity: str = "critical" # critical, major, minor
    description: str = "Structural bridge failure reported on main evacuation corridor"
    reported_by: str = "Field Team 07"
    source: str = "Incident Report"
    corridor_code: Optional[str] = "R1"

class CascadeSimulationRequest(BaseModel):
    title: str = "MULTI-HAZARD CASCADE"
    events: List[Dict[str, Any]]
    source: str = "Integrated District EOC"

class StructuredEventRequest(BaseModel):
    event_type: str = "route" # route, shelter, hazard, population, incident, cascade
    payload: Dict[str, Any]
    source: str = "Field Ingestion Client"

# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------

@router.post("/route-block")
def simulate_route_block(
    req: RouteBlockSimulationRequest = RouteBlockSimulationRequest(),
    db: Session = Depends(get_db)
):
    """
    Backwards-compatible Core Demo Trigger:
    Simulates Route R1 bridge failure, detects affected Chooralmala evacuees (120 pax),
    runs A* routing and Weighted MCDA, and generates an explainable recommendation.
    """
    try:
        result = run_decision_cycle(
            db=db,
            incident_type=req.incident_type,
            description=req.description,
            corridor_code=req.corridor_code,
            change_type="route",
            route_status="blocked",
            route_reason=req.incident_type,
            source_name=req.source
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/route")
def simulate_route(
    req: RouteSimulationRequest,
    db: Session = Depends(get_db)
):
    """
    Simulate road network changes: blocked, degraded, or reopened with specific reasons.
    """
    try:
        desc = req.description or f"Route {req.corridor_code} condition update: {req.status.upper()} ({req.reason})"
        result = run_decision_cycle(
            db=db,
            incident_type=req.reason,
            description=desc,
            corridor_code=req.corridor_code,
            change_type="route",
            route_status=req.status,
            route_reason=req.reason,
            source_name=req.source
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/shelter")
def simulate_shelter(
    req: ShelterSimulationRequest,
    db: Session = Depends(get_db)
):
    """
    Simulate shelter changes: capacity reductions, closure, medical support status.
    AEGIS determines if existing allocations exceed remaining capacity and finds alternatives.
    """
    try:
        desc = req.description or f"Shelter {req.shelter_code} condition updated by {req.source}."
        result = run_decision_cycle(
            db=db,
            incident_type="shelter_capacity_loss" if req.new_capacity is not None else "shelter_status_change",
            description=desc,
            change_type="shelter",
            shelter_code=req.shelter_code,
            new_capacity=req.new_capacity,
            shelter_status=req.status,
            medical_support=req.medical_support,
            source_name=req.source
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/hazard")
def simulate_hazard(
    req: HazardSimulationRequest,
    db: Session = Depends(get_db)
):
    """
    Simulate hazard zone manipulation: spatial buffer expansion (+km), movement, severity.
    PostGIS spatial queries calculate intersections with routes, shelters, and habitations.
    """
    try:
        desc = req.description or f"Hazard {req.hazard_code} spatial expansion (+{req.radius_km_delta} km) recorded by {req.source}."
        result = run_decision_cycle(
            db=db,
            incident_type="hazard_expansion",
            description=desc,
            change_type="hazard",
            hazard_code=req.hazard_code,
            hazard_action=req.action,
            radius_km_delta=req.radius_km_delta,
            lat_offset=req.lat_offset,
            lon_offset=req.lon_offset,
            source_name=req.source
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/population")
def simulate_population(
    req: PopulationSimulationRequest,
    db: Session = Depends(get_db)
):
    """
    Simulate population surge or habitation risk escalation.
    """
    try:
        desc = req.description or f"Population estimate adjusted: {req.habitation_code} (+{req.population_delta} affected residents)."
        result = run_decision_cycle(
            db=db,
            incident_type="population_surge",
            description=desc,
            change_type="population",
            habitation_code=req.habitation_code,
            population_delta=req.population_delta,
            source_name=req.source
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/incident")
def simulate_incident(
    req: IncidentReportRequest,
    db: Session = Depends(get_db)
):
    """
    Ingest field incident reports directly into the operational pipeline.
    """
    try:
        result = run_decision_cycle(
            db=db,
            incident_type=req.incident_type,
            description=f"FIELD REPORT [{req.reported_by}]: {req.description} at {req.location}",
            corridor_code=req.corridor_code,
            change_type="route" if req.corridor_code else "incident",
            route_status="blocked" if req.severity == "critical" else "degraded",
            route_reason=req.incident_type,
            source_name=req.source
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cascade")
def simulate_cascade(
    req: CascadeSimulationRequest,
    db: Session = Depends(get_db)
):
    """
    Simulate multiple simultaneous ground disruptions (Multi-Hazard Cascade).
    Applies all changes and runs unified AEGIS decision cycle.
    """
    try:
        result = run_decision_cycle(
            db=db,
            incident_type="multi_hazard_cascade",
            description=f"Multi-Hazard Cascade: {len(req.events)} simultaneous field disruptions applied.",
            change_type="cascade",
            batch_events=req.events,
            source_name=req.source
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/event")
def simulate_generic_event(
    req: StructuredEventRequest,
    db: Session = Depends(get_db)
):
    """
    Universal structured event ingestion endpoint for the AEGIS simulator client.
    """
    try:
        result = run_decision_cycle(
            db=db,
            incident_type=req.payload.get("incident_type", "ground_update"),
            description=req.payload.get("description", "Ground simulation event transmitted"),
            corridor_code=req.payload.get("corridor_code"),
            change_type=req.event_type,
            route_status=req.payload.get("route_status"),
            route_reason=req.payload.get("route_reason"),
            shelter_code=req.payload.get("shelter_code"),
            new_capacity=req.payload.get("new_capacity"),
            shelter_status=req.payload.get("shelter_status"),
            medical_support=req.payload.get("medical_support"),
            hazard_code=req.payload.get("hazard_code"),
            hazard_action=req.payload.get("hazard_action"),
            radius_km_delta=req.payload.get("radius_km_delta"),
            habitation_code=req.payload.get("habitation_code"),
            population_delta=req.payload.get("population_delta"),
            batch_events=req.payload.get("batch_events"),
            source_name=req.source
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/state")
def get_simulation_state(db: Session = Depends(get_db)):
    """
    Returns current snapshot of simulated world state:
    Routes, Shelters, Hazards, Active Plan, and latest Recommendation.
    """
    routes = db.query(Route).all()
    shelters = db.query(Shelter).all()
    hazards = db.query(HazardZone).all()
    plan = db.query(RelocationPlan).filter(RelocationPlan.status == "approved").order_by(RelocationPlan.version.desc()).first()
    rec = db.query(Recommendation).order_by(Recommendation.created_at.desc()).first()

    return {
        "active_plan": {
            "id": str(plan.id) if plan else None,
            "plan_code": plan.plan_code if plan else "N/A",
            "version": plan.version if plan else 1,
            "status": plan.status if plan else "proposed",
            "total_evacuees": plan.total_evacuees if plan else 0,
            "approved_by": plan.approved_by if plan else None,
            "assignments": [
                {
                    "habitation": a.habitation.name if a.habitation else "N/A",
                    "habitation_code": a.habitation.code if a.habitation else "N/A",
                    "shelter": a.shelter.name if a.shelter else "N/A",
                    "shelter_code": a.shelter.code if a.shelter else "N/A",
                    "route": a.route.code if a.route else "N/A",
                    "population": a.allocated_population,
                    "status": a.status
                }
                for a in (plan.assignments if plan else [])
            ]
        },
        "routes": [
            {"code": r.code, "name": r.name, "status": r.status, "distance_km": r.distance_km}
            for r in routes if r.code in ("R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8") or getattr(r, 'metadata_json', {}).get("is_canonical")
        ],
        "shelters": [
            {
                "code": s.code,
                "name": s.name,
                "total_capacity": s.total_capacity,
                "occupied_capacity": s.occupied_capacity,
                "available_capacity": s.available_capacity,
                "status": s.status,
                "medical_support": s.medical_support
            }
            for s in shelters if s.code in ("SH-ALPHA", "SH-BETA", "SH-DELTA", "SH-GAMMA") or getattr(s, 'metadata_json', {}).get("is_canonical")
        ],
        "hazards": [
            {"code": h.code, "name": h.name, "severity": h.severity, "type": h.hazard_type}
            for h in hazards
        ],
        "latest_recommendation": {
            "id": str(rec.id) if rec else None,
            "status": rec.status if rec else None,
            "summary": rec.summary if rec else None,
            "shelter": rec.recommended_shelter.name if (rec and rec.recommended_shelter) else None,
            "route": rec.recommended_route.code if (rec and rec.recommended_route) else None
        } if rec else None
    }

@router.post("/reset")
def reset_simulation():
    """
    Resets the database to clean baseline Plan V1 (Chooralmala -> Meppadi Hall Alpha via R1).
    Allows judges and operators to replay the demo scenario from scratch.
    """
    try:
        from app.seed import run_seed
        run_seed()
        try:
            from app.core.ws import manager
            manager.broadcast_sync({
                "event": "SIMULATION_RESET",
                "timestamp": "now"
            })
        except Exception:
            pass
        return {
            "status": "RESET_SUCCESS",
            "message": "Database successfully restored to Baseline Plan V1 (Chooralmala 120 -> Meppadi Hall via Route R1: CLEAR)."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset scenario: {str(e)}")
