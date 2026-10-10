import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models import Incident, Route, Shelter, Habitation, HazardZone

class ChangeDetectionResult:
    def __init__(
        self,
        incident: Incident,
        affected_routes: List[Route],
        affected_shelters: Optional[List[Shelter]] = None,
        affected_habitations: Optional[List[Habitation]] = None,
        affected_hazards: Optional[List[HazardZone]] = None,
        change_type: str = "route_change",
        details: Optional[dict] = None
    ):
        self.incident = incident
        self.affected_routes = affected_routes
        self.affected_shelters = affected_shelters or []
        self.affected_habitations = affected_habitations or []
        self.affected_hazards = affected_hazards or []
        self.change_type = change_type
        self.details = details or {}

def detect_and_apply_changes(
    db: Session,
    incident_type: str = "bridge_failure",
    description: str = "Field condition change reported",
    corridor_code: Optional[str] = None,
    affected_route_id: Optional[uuid.UUID] = None,
    severity: str = "critical",
    raw_payload: Optional[dict] = None,
    # Extended simulator parameters
    change_type: str = "route",
    route_status: Optional[str] = None, # blocked, degraded, clear
    route_reason: Optional[str] = None,
    shelter_code: Optional[str] = None,
    new_capacity: Optional[int] = None,
    shelter_status: Optional[str] = None,
    medical_support: Optional[bool] = None,
    hazard_code: Optional[str] = None,
    hazard_action: Optional[str] = None, # expand, move, severity
    radius_km_delta: Optional[float] = None,
    lat_offset: Optional[float] = None,
    lon_offset: Optional[float] = None,
    habitation_code: Optional[str] = None,
    population_delta: Optional[int] = None,
    source_name: str = "Field Team 07",
    batch_events: Optional[List[dict]] = None
) -> ChangeDetectionResult:
    """
    AEGIS Data Ingestion & Ground Change Detection:
    Receives structured external/field simulator inputs, updates PostgreSQL/PostGIS world state,
    and returns detected topological & spatial changes.
    """
    affected_routes: List[Route] = []
    affected_shelters: List[Shelter] = []
    affected_habitations: List[Habitation] = []
    affected_hazards: List[HazardZone] = []
    details: Dict[str, Any] = {"source": source_name, "change_type": change_type}

    payload = dict(raw_payload or {})
    payload["source"] = source_name
    payload["change_type"] = change_type

    # -------------------------------------------------------------
    # 1. ROUTE CHANGE (Block, Degrade, Reopen)
    # -------------------------------------------------------------
    if change_type == "route" or corridor_code or affected_route_id:
        target_route: Optional[Route] = None
        if affected_route_id:
            target_route = db.query(Route).filter(Route.id == affected_route_id).first()
        elif corridor_code:
            target_route = db.query(Route).filter(Route.code == corridor_code).first()

        new_st = route_status or ("clear" if route_reason == "reopened" else "blocked")
        if target_route:
            target_route.status = new_st
            affected_routes.append(target_route)
            details["route"] = {
                "code": target_route.code,
                "name": target_route.name,
                "new_status": new_st,
                "reason": route_reason or incident_type
            }

    # -------------------------------------------------------------
    # 2. SHELTER CHANGE (Capacity reduction, closure, medical toggle)
    # -------------------------------------------------------------
    elif change_type == "shelter" and shelter_code:
        target_shelter = db.query(Shelter).filter(Shelter.code == shelter_code).first()
        if target_shelter:
            if new_capacity is not None:
                target_shelter.total_capacity = max(0, new_capacity)
            if shelter_status:
                target_shelter.status = shelter_status
            if medical_support is not None:
                target_shelter.medical_support = medical_support

            affected_shelters.append(target_shelter)
            details["shelter"] = {
                "code": target_shelter.code,
                "name": target_shelter.name,
                "total_capacity": target_shelter.total_capacity,
                "occupied_capacity": target_shelter.occupied_capacity,
                "available_capacity": target_shelter.available_capacity,
                "status": target_shelter.status,
                "medical_support": target_shelter.medical_support
            }

    # -------------------------------------------------------------
    # 3. HAZARD ZONE CHANGE (PostGIS geometry buffer, move, severity)
    # -------------------------------------------------------------
    elif change_type == "hazard" and hazard_code:
        target_hz = db.query(HazardZone).filter(HazardZone.code == hazard_code).first()
        if target_hz:
            affected_hazards.append(target_hz)
            if hazard_action == "expand" and radius_km_delta:
                buffer_m = float(radius_km_delta) * 1000.0
                # PostGIS spatial buffer expansion
                db.execute(
                    text("""
                        UPDATE hazard_zones
                        SET geom = ST_Buffer(geom::geography, :buf_m)::geometry,
                            updated_at = NOW()
                        WHERE code = :code
                    """),
                    {"buf_m": buffer_m, "code": hazard_code}
                )
                db.commit()
                db.refresh(target_hz)
            elif hazard_action == "move" and (lat_offset or lon_offset):
                dx = float(lon_offset or 0.0)
                dy = float(lat_offset or 0.0)
                # PostGIS spatial translation
                db.execute(
                    text("""
                        UPDATE hazard_zones
                        SET geom = ST_Translate(geom, :dx, :dy),
                            updated_at = NOW()
                        WHERE code = :code
                    """),
                    {"dx": dx, "dy": dy, "code": hazard_code}
                )
                db.commit()
                db.refresh(target_hz)

            if severity:
                target_hz.severity = severity

            intersecting_routes = []
            proximity_shelters = []
            intersecting_habs = []

            # Compute PostGIS spatial relationships from geometry only on spatial mutation:
            if hazard_action in ("expand", "move"):
                # 1) Routes intersecting hazard polygon
                intersecting_routes = db.query(Route).filter(
                    text("ST_Intersects(routes.geom, (SELECT geom FROM hazard_zones WHERE code = :hz_code))").bindparams(hz_code=hazard_code)
                ).all()
                for r in intersecting_routes:
                    r.status = "blocked"
                    affected_routes.append(r)

                # 2) Shelters within 500m proximity to hazard polygon
                proximity_shelters = db.query(Shelter).filter(
                    text("ST_DWithin(shelters.geom::geography, (SELECT geom FROM hazard_zones WHERE code = :hz_code)::geography, 500)").bindparams(hz_code=hazard_code)
                ).all()
                for s in proximity_shelters:
                    s.status = "unavailable"
                    affected_shelters.append(s)

                # 3) Habitations intersecting hazard zone
                intersecting_habs = db.query(Habitation).filter(
                    text("ST_Intersects(habitations.geom, (SELECT geom FROM hazard_zones WHERE code = :hz_code))").bindparams(hz_code=hazard_code)
                ).all()
                for h in intersecting_habs:
                    h.risk_level = "critical"
                    affected_habitations.append(h)

            details["hazard"] = {
                "code": target_hz.code,
                "name": target_hz.name,
                "severity": target_hz.severity,
                "intersecting_routes": [r.code for r in intersecting_routes],
                "compromised_shelters": [s.code for s in proximity_shelters],
                "threatened_habitations": [h.code for h in intersecting_habs]
            }

    # -------------------------------------------------------------
    # 4. HABITATION / POPULATION SURGE
    # -------------------------------------------------------------
    elif change_type == "population" and habitation_code:
        target_hab = db.query(Habitation).filter(Habitation.code == habitation_code).first()
        if target_hab:
            if population_delta:
                target_hab.population += int(population_delta)
            if severity:
                target_hab.risk_level = severity
            affected_habitations.append(target_hab)
            details["habitation"] = {
                "code": target_hab.code,
                "name": target_hab.name,
                "new_population": target_hab.population,
                "delta": population_delta,
                "risk_level": target_hab.risk_level
            }

    # -------------------------------------------------------------
    # 5. MULTI-HAZARD CASCADE BATCH
    # -------------------------------------------------------------
    elif change_type == "cascade" and batch_events:
        cascade_details = []
        for ev in batch_events:
            ev_type = ev.get("change_type", "route")
            sub_res = detect_and_apply_changes(
                db=db,
                incident_type=ev.get("incident_type", incident_type),
                description=ev.get("description", description),
                corridor_code=ev.get("corridor_code"),
                route_status=ev.get("route_status"),
                route_reason=ev.get("route_reason"),
                shelter_code=ev.get("shelter_code"),
                new_capacity=ev.get("new_capacity"),
                shelter_status=ev.get("shelter_status"),
                hazard_code=ev.get("hazard_code"),
                hazard_action=ev.get("hazard_action"),
                radius_km_delta=ev.get("radius_km_delta"),
                habitation_code=ev.get("habitation_code"),
                population_delta=ev.get("population_delta"),
                change_type=ev_type,
                source_name=source_name
            )
            affected_routes.extend(sub_res.affected_routes)
            affected_shelters.extend(sub_res.affected_shelters)
            affected_habitations.extend(sub_res.affected_habitations)
            affected_hazards.extend(sub_res.affected_hazards)
            cascade_details.append(sub_res.details)
        details["cascade_events"] = cascade_details

    # -------------------------------------------------------------
    # 6. PERSIST INCIDENT RECORD
    # -------------------------------------------------------------
    incident = Incident(
        incident_type=incident_type,
        description=description,
        status="active",
        severity=severity,
        affected_route_id=affected_routes[0].id if affected_routes else None,
        raw_payload=payload
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    details["incident_id"] = str(incident.id)
    details["incident_type"] = incident.incident_type
    details["affected_corridors"] = [r.code for r in affected_routes]
    details["affected_shelters"] = [s.code for s in affected_shelters]
    details["affected_habitations"] = [h.code for h in affected_habitations]

    return ChangeDetectionResult(
        incident=incident,
        affected_routes=list({r.id: r for r in affected_routes}.values()),
        affected_shelters=list({s.id: s for s in affected_shelters}.values()),
        affected_habitations=list({h.id: h for h in affected_habitations}.values()),
        affected_hazards=list({hz.id: hz for hz in affected_hazards}.values()),
        change_type=change_type,
        details=details
    )
