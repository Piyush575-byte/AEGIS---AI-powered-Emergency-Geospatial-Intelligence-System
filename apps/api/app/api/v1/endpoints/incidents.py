from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.services.decision_engine import run_decision_cycle

router = APIRouter()

class IncidentCreateRequest(BaseModel):
    incident_type: str = "bridge_blocked"
    description: str = "Bridge collapsed on Route R1 near Chooralmala KM 4.2"
    corridor_code: str = "R1"
    severity: str = "critical"
    auto_reassess: bool = True

@router.get("")
def list_incidents(db: Session = Depends(get_db)):
    """
    Returns list of recent reported disaster/ground incidents.
    """
    from app.models import Incident
    incidents = db.query(Incident).order_by(Incident.reported_at.desc()).limit(20).all()
    return [
        {
            "id": str(i.id),
            "incident_type": i.incident_type,
            "description": i.description,
            "status": i.status,
            "severity": i.severity,
            "source": (i.raw_payload or {}).get("source", "Simulation / External Field Feed"),
            "raw_payload": i.raw_payload,
            "reported_at": i.reported_at.isoformat() if i.reported_at else None
        }
        for i in incidents
    ]

@router.get("/latest")
def get_latest_incident(db: Session = Depends(get_db)):
    """
    Returns the most recently reported ground incident.
    """
    from app.models import Incident
    inc = db.query(Incident).order_by(Incident.reported_at.desc()).first()
    if not inc:
        return {"incident": None, "message": "No active incidents reported."}
    return {
        "id": str(inc.id),
        "incident_type": inc.incident_type,
        "description": inc.description,
        "status": inc.status,
        "severity": inc.severity,
        "source": (inc.raw_payload or {}).get("source", "Simulation / External Field Feed"),
        "raw_payload": inc.raw_payload,
        "reported_at": inc.reported_at.isoformat() if inc.reported_at else None
    }

@router.post("")

def create_incident(req: IncidentCreateRequest, db: Session = Depends(get_db)):
    """
    Ingests an incident and triggers change detection.
    If auto_reassess is True, runs the AEGIS decision engine cycle.
    """
    try:
        result = run_decision_cycle(
            db=db,
            incident_type=req.incident_type,
            description=req.description,
            corridor_code=req.corridor_code
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

