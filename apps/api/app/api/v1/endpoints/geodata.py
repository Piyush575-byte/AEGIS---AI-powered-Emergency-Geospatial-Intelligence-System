from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
import json

from app.core.database import get_db

router = APIRouter()

@router.get("/summary")
def get_geodata_summary(db: Session = Depends(get_db)):
    """
    Returns PostGIS state/district spatial aggregates across 10,000+ habitations and shelters.
    Used for clean, uncluttered high-level map views.
    """
    hab_agg_query = text("""
        SELECT 
            COALESCE(metadata_json->>'district', 'Wayanad') as district,
            COUNT(*) as total_habitations,
            COALESCE(SUM(population), 0) as total_population,
            COUNT(*) FILTER (WHERE risk_level IN ('critical', 'high')) as at_risk_zones,
            ROUND(AVG(ST_Y(geom))::numeric, 4) as center_lat,
            ROUND(AVG(ST_X(geom))::numeric, 4) as center_lng
        FROM habitations
        GROUP BY COALESCE(metadata_json->>'district', 'Wayanad')
        ORDER BY total_population DESC;
    """)
    hab_rows = db.execute(hab_agg_query).fetchall()

    sh_agg_query = text("""
        SELECT 
            COALESCE(metadata_json->>'district', 'Wayanad') as district,
            COUNT(*) as total_shelters,
            COALESCE(SUM(total_capacity), 0) as total_capacity,
            COALESCE(SUM(occupied_capacity), 0) as occupied_capacity
        FROM shelters
        GROUP BY COALESCE(metadata_json->>'district', 'Wayanad');
    """)
    sh_rows = {r[0]: {"total_shelters": r[1], "total_capacity": r[2], "available_capacity": max(0, r[2] - r[3])} for r in db.execute(sh_agg_query).fetchall()}

    districts = []
    for r in hab_rows:
        dist_name = r[0]
        sh_info = sh_rows.get(dist_name, {"total_shelters": 0, "total_capacity": 0, "available_capacity": 0})
        districts.append({
            "district": dist_name,
            "total_habitations": r[1],
            "total_population": r[2],
            "at_risk_zones": r[3],
            "center": [float(r[4]), float(r[5])],
            "shelters_count": sh_info["total_shelters"],
            "total_capacity": sh_info["total_capacity"],
            "available_capacity": sh_info["available_capacity"]
        })

    return {
        "status": "SUCCESS",
        "total_districts": len(districts),
        "districts": districts
    }

@router.get("")
def get_all_geodata(
    zoom: Optional[int] = Query(None, description="Current map zoom level (e.g. 9 to 18)"),
    min_lon: Optional[float] = Query(None),
    min_lat: Optional[float] = Query(None),
    max_lon: Optional[float] = Query(None),
    max_lat: Optional[float] = Query(None),
    limit: Optional[int] = Query(None, description="Max background objects to return"),
    db: Session = Depends(get_db)
):
    """
    Returns Wayanad disaster response spatial layers as GeoJSON FeatureCollections.
    Supports zoom-aware and viewport (bounding box) filtering via PostGIS.
    Always includes canonical operational objects (Chooralmala, Shelters Alpha/Beta/Delta/Gamma, Routes R1-R4).
    """
    has_bbox = min_lon is not None and min_lat is not None and max_lon is not None and max_lat is not None

    # Determine background limit based on zoom level:
    # zoom < 11: state level (only canonical objects, visual clustering handles aggregates)
    # 11 <= zoom < 14: district level (canonical + moderate background sample)
    # zoom >= 14: local operational level (canonical + bbox filtered)
    if limit is not None:
        hab_limit = limit
        sh_limit = limit
        rt_limit = limit
    elif zoom is not None and zoom < 11:
        hab_limit = 20
        sh_limit = 10
        rt_limit = 10
    elif zoom is not None and zoom < 14:
        hab_limit = 250
        sh_limit = 80
        rt_limit = 60
    else:
        hab_limit = 400
        sh_limit = 150
        rt_limit = 120

    # 1. Habitations
    hab_where = "WHERE (code = 'HAB-CHOORALMALA' OR metadata_json->>'is_canonical' = 'true')"
    if has_bbox:
        hab_where = f"WHERE (code = 'HAB-CHOORALMALA' OR metadata_json->>'is_canonical' = 'true' OR ST_Intersects(geom, ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326)))"
    
    hab_query = text(f"""
        (
            SELECT id, code, name, population, households, risk_level, metadata_json, ST_AsGeoJSON(geom) as geojson, 1 as prio
            FROM habitations
            WHERE code = 'HAB-CHOORALMALA' OR metadata_json->>'is_canonical' = 'true'
        )
        UNION ALL
        (
            SELECT id, code, name, population, households, risk_level, metadata_json, ST_AsGeoJSON(geom) as geojson, 2 as prio
            FROM habitations
            {hab_where} AND NOT (code = 'HAB-CHOORALMALA' OR metadata_json->>'is_canonical' = 'true')
            LIMIT :hab_limit
        )
        ORDER BY prio ASC;
    """)
    params = {"hab_limit": hab_limit}
    if has_bbox:
        params.update({"min_lon": min_lon, "min_lat": min_lat, "max_lon": max_lon, "max_lat": max_lat})

    hab_rows = db.execute(hab_query, params).fetchall()
    habitations_features = [
        {
            "type": "Feature",
            "geometry": json.loads(r[7]) if r[7] else None,
            "properties": {
                "id": str(r[0]),
                "code": r[1],
                "name": r[2],
                "population": r[3],
                "households": r[4],
                "risk_level": r[5],
                "metadata": r[6]
            }
        }
        for r in hab_rows
    ]

    # 2. Shelters
    sh_where = "WHERE (code IN ('SH-ALPHA', 'SH-BETA', 'SH-DELTA', 'SH-GAMMA') OR metadata_json->>'is_canonical' = 'true')"
    if has_bbox:
        sh_where = f"WHERE (code IN ('SH-ALPHA', 'SH-BETA', 'SH-DELTA', 'SH-GAMMA') OR metadata_json->>'is_canonical' = 'true' OR ST_Intersects(geom, ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326)))"

    sh_query = text(f"""
        (
            SELECT id, code, name, total_capacity, occupied_capacity, medical_support, status, metadata_json, ST_AsGeoJSON(geom) as geojson, 1 as prio
            FROM shelters
            WHERE code IN ('SH-ALPHA', 'SH-BETA', 'SH-DELTA', 'SH-GAMMA') OR metadata_json->>'is_canonical' = 'true'
        )
        UNION ALL
        (
            SELECT id, code, name, total_capacity, occupied_capacity, medical_support, status, metadata_json, ST_AsGeoJSON(geom) as geojson, 2 as prio
            FROM shelters
            {sh_where} AND NOT (code IN ('SH-ALPHA', 'SH-BETA', 'SH-DELTA', 'SH-GAMMA') OR metadata_json->>'is_canonical' = 'true')
            LIMIT :sh_limit
        )
        ORDER BY prio ASC;
    """)
    sh_params = {"sh_limit": sh_limit}
    if has_bbox:
        sh_params.update({"min_lon": min_lon, "min_lat": min_lat, "max_lon": max_lon, "max_lat": max_lat})

    sh_rows = db.execute(sh_query, sh_params).fetchall()
    shelters_features = [
        {
            "type": "Feature",
            "geometry": json.loads(r[8]) if r[8] else None,
            "properties": {
                "id": str(r[0]),
                "code": r[1],
                "name": r[2],
                "total_capacity": r[3],
                "occupied_capacity": r[4],
                "available_capacity": max(0, r[3] - r[4]),
                "medical_support": r[5],
                "status": r[6],
                "metadata": r[7]
            }
        }
        for r in sh_rows
    ]

    # 3. Routes
    rt_where = "WHERE (code IN ('R1', 'R2', 'R3', 'R4') OR metadata_json->>'is_canonical' = 'true')"
    if has_bbox:
        rt_where = f"WHERE (code IN ('R1', 'R2', 'R3', 'R4') OR metadata_json->>'is_canonical' = 'true' OR ST_Intersects(geom, ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326)))"

    rt_query = text(f"""
        (
            SELECT id, code, name, status, distance_km, capacity_pax_hour, metadata_json, ST_AsGeoJSON(geom) as geojson, 1 as prio
            FROM routes
            WHERE code IN ('R1', 'R2', 'R3', 'R4') OR metadata_json->>'is_canonical' = 'true'
        )
        UNION ALL
        (
            SELECT id, code, name, status, distance_km, capacity_pax_hour, metadata_json, ST_AsGeoJSON(geom) as geojson, 2 as prio
            FROM routes
            {rt_where} AND NOT (code IN ('R1', 'R2', 'R3', 'R4') OR metadata_json->>'is_canonical' = 'true')
            LIMIT :rt_limit
        )
        ORDER BY prio ASC;
    """)
    rt_params = {"rt_limit": rt_limit}
    if has_bbox:
        rt_params.update({"min_lon": min_lon, "min_lat": min_lat, "max_lon": max_lon, "max_lat": max_lat})

    rt_rows = db.execute(rt_query, rt_params).fetchall()
    routes_features = [
        {
            "type": "Feature",
            "geometry": json.loads(r[7]) if r[7] else None,
            "properties": {
                "id": str(r[0]),
                "code": r[1],
                "name": r[2],
                "status": r[3],
                "distance_km": r[4],
                "capacity_pax_hour": r[5],
                "metadata": r[6]
            }
        }
        for r in rt_rows
    ]

    # 4. Hazard Zones
    hz_query = text("""
        SELECT 
            id, code, name, hazard_type, severity, rainfall_24h_mm, slope_saturation_pct, metadata_json,
            ST_AsGeoJSON(geom) as geojson
        FROM hazard_zones;
    """)
    hz_rows = db.execute(hz_query).fetchall()
    hazard_features = [
        {
            "type": "Feature",
            "geometry": json.loads(r[8]) if r[8] else None,
            "properties": {
                "id": str(r[0]),
                "code": r[1],
                "name": r[2],
                "hazard_type": r[3],
                "severity": r[4],
                "rainfall_24h_mm": r[5],
                "slope_saturation_pct": r[6],
                "metadata": r[7]
            }
        }
        for r in hz_rows
    ]

    return {
        "habitations": {
            "type": "FeatureCollection",
            "features": habitations_features
        },
        "shelters": {
            "type": "FeatureCollection",
            "features": shelters_features
        },
        "routes": {
            "type": "FeatureCollection",
            "features": routes_features
        },
        "hazard_zones": {
            "type": "FeatureCollection",
            "features": hazard_features
        }
    }
