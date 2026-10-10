from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.models import Route

router = APIRouter()

@router.get("")
def list_routes(db: Session = Depends(get_db)):
    """
    Returns all evacuation corridors with status, length, and GeoJSON geometry.
    """
    query = text("""
        SELECT 
            id, code, name, status, distance_km, capacity_pax_hour, metadata_json,
            ST_AsGeoJSON(geom) as geojson
        FROM routes
        ORDER BY code;
    """)
    rows = db.execute(query).fetchall()

    import json
    return [
        {
            "id": str(r[0]),
            "code": r[1],
            "name": r[2],
            "status": r[3],
            "distance_km": r[4],
            "capacity_pax_hour": r[5],
            "metadata": r[6],
            "geometry": json.loads(r[7]) if r[7] else None
        }
        for r in rows
    ]
