from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.models import Shelter

router = APIRouter()

@router.get("")
def list_shelters(db: Session = Depends(get_db)):
    """
    Returns all registered emergency shelters with occupancy, headroom, and coordinates.
    """
    query = text("""
        SELECT 
            id, code, name, total_capacity, occupied_capacity, 
            medical_support, status, metadata_json,
            ST_X(geom::geometry) as longitude,
            ST_Y(geom::geometry) as latitude
        FROM shelters
        ORDER BY code;
    """)
    rows = db.execute(query).fetchall()

    return [
        {
            "id": str(r[0]),
            "code": r[1],
            "name": r[2],
            "total_capacity": r[3],
            "occupied_capacity": r[4],
            "available_capacity": max(0, r[3] - r[4]),
            "medical_support": r[5],
            "status": r[6],
            "metadata": r[7],
            "coordinates": {"longitude": r[8], "latitude": r[9]}
        }
        for r in rows
    ]
