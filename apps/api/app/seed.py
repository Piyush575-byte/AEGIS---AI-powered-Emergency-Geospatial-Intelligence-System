import json
import os
import sys
import uuid
from datetime import datetime, timezone
from geoalchemy2.elements import WKTElement
from sqlalchemy import text
from sqlalchemy.orm import Session

# Add current path
sys.path.insert(0, os.path.abspath("."))
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from app.core.database import SessionLocal, engine, Base
from app.models import (
    Habitation,
    Shelter,
    Route,
    HazardZone,
    Incident,
    RelocationPlan,
    PlanAssignment,
    AuditLedger
)

def run_seed():
    seed_file_path = os.path.join("..", "..", "seed", "wayanad_seed.json")
    if not os.path.exists(seed_file_path):
        # Fallback to local path if run from project root
        seed_file_path = os.path.join("seed", "wayanad_seed.json")
    
    if not os.path.exists(seed_file_path):
        # Try absolute path
        seed_file_path = r"C:\Users\piyus\.gemini\antigravity-ide\scratch\aegis\seed\wayanad_seed.json"

    with open(seed_file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    db: Session = SessionLocal()
    try:
        print("🌱 Seeding AEGIS Wayanad synthetic data...")

        # Check if large dataset is already seeded
        hab_count = db.execute(text("SELECT count(*) FROM habitations;")).scalar() or 0
        if hab_count < 500:
            print("📦 Large dataset not detected. Triggering full large dataset seeder...")
            from app.seed_large import seed_large_dataset
            db.close()
            seed_large_dataset()
            return

        # Large dataset is present: clean and reset canonical records idempotently
        print("🔄 Large synthetic dataset detected. Resetting canonical Wayanad baseline...")
        db.query(PlanAssignment).delete()
        db.query(RelocationPlan).delete()
        db.execute(text("DELETE FROM recommendations;"))
        db.execute(text("DELETE FROM audit_ledger;"))
        db.execute(text("DELETE FROM incidents WHERE (raw_payload->>'is_synthetic')::boolean IS NOT TRUE OR incident_type IN ('bridge_failure', 'road_block');"))

        # Clean all records that match the seed data IDs, codes, or are canonical
        hab_ids = [uuid.UUID(h["id"]) for h in data.get("habitations", [])]
        hab_codes = [h["code"] for h in data.get("habitations", [])]
        if hab_ids:
            db.query(Habitation).filter(Habitation.id.in_(hab_ids)).delete(synchronize_session=False)
        if hab_codes:
            db.query(Habitation).filter(Habitation.code.in_(hab_codes)).delete(synchronize_session=False)
        db.execute(text("DELETE FROM habitations WHERE (metadata_json->>'is_canonical')::boolean = true;"))

        shelter_ids = [uuid.UUID(s["id"]) for s in data.get("shelters", [])]
        shelter_codes = [s["code"] for s in data.get("shelters", [])]
        if shelter_ids:
            db.query(Shelter).filter(Shelter.id.in_(shelter_ids)).delete(synchronize_session=False)
        if shelter_codes:
            db.query(Shelter).filter(Shelter.code.in_(shelter_codes)).delete(synchronize_session=False)
        db.execute(text("DELETE FROM shelters WHERE (metadata_json->>'is_canonical')::boolean = true;"))

        route_ids = [uuid.UUID(r["id"]) for r in data.get("routes", [])]
        route_codes = [r["code"] for r in data.get("routes", [])]
        if route_ids:
            db.query(Route).filter(Route.id.in_(route_ids)).delete(synchronize_session=False)
        if route_codes:
            db.query(Route).filter(Route.code.in_(route_codes)).delete(synchronize_session=False)
        db.execute(text("DELETE FROM routes WHERE (metadata_json->>'is_canonical')::boolean = true;"))

        hazard_ids = [uuid.UUID(hz["id"]) for hz in data.get("hazard_zones", [])]
        hazard_codes = [hz["code"] for hz in data.get("hazard_zones", [])]
        if hazard_ids:
            db.query(HazardZone).filter(HazardZone.id.in_(hazard_ids)).delete(synchronize_session=False)
        if hazard_codes:
            db.query(HazardZone).filter(HazardZone.code.in_(hazard_codes)).delete(synchronize_session=False)
        db.execute(text("DELETE FROM hazard_zones WHERE (metadata_json->>'is_canonical')::boolean = true;"))

        db.commit()

        # 1. Seed Habitations
        hab_map = {}
        for h in data["habitations"]:
            wkt = f"POINT({h['longitude']} {h['latitude']})"
            hab = Habitation(
                id=uuid.UUID(h["id"]),
                code=h["code"],
                name=h["name"],
                population=h["population"],
                households=h["households"],
                risk_level=h["risk_level"],
                metadata_json=h.get("metadata"),
                geom=WKTElement(wkt, srid=4326)
            )
            db.add(hab)
            hab_map[h["code"]] = hab
        db.flush()
        print(f"✅ Seeded {len(hab_map)} Habitations (Chooralmala: 120 pax)")

        # 2. Seed Shelters (Alpha, Beta, Delta, Gamma/Vythiri)
        shelter_map = {}
        for s in data["shelters"]:
            wkt = f"POINT({s['longitude']} {s['latitude']})"
            shelter = Shelter(
                id=uuid.UUID(s["id"]),
                code=s["code"],
                name=s["name"],
                total_capacity=s["total_capacity"],
                occupied_capacity=s["occupied_capacity"],
                medical_support=s["medical_support"],
                status=s["status"],
                metadata_json=s.get("metadata"),
                geom=WKTElement(wkt, srid=4326)
            )
            db.add(shelter)
            shelter_map[s["code"]] = shelter
        db.flush()
        print(f"✅ Seeded {len(shelter_map)} Shelters (Alpha, Beta, Delta, Gamma)")

        # 3. Seed Routes (R1, R2, R3, R4)
        route_map = {}
        for r in data["routes"]:
            coords_str = ", ".join([f"{lon} {lat}" for lon, lat in r["coordinates"]])
            wkt = f"LINESTRING({coords_str})"
            route = Route(
                id=uuid.UUID(r["id"]),
                code=r["code"],
                name=r["name"],
                status=r["status"],
                distance_km=r["distance_km"],
                capacity_pax_hour=r["capacity_pax_hour"],
                metadata_json=r.get("metadata"),
                geom=WKTElement(wkt, srid=4326)
            )
            db.add(route)
            route_map[r["code"]] = route
        db.flush()
        print(f"✅ Seeded {len(route_map)} Routes (R1, R2, R3, R4)")

        # 4. Seed Hazard Zones
        for hz in data["hazard_zones"]:
            coords_str = ", ".join([f"{lon} {lat}" for lon, lat in hz["polygon"]])
            wkt = f"POLYGON(({coords_str}))"
            hazard = HazardZone(
                id=uuid.UUID(hz["id"]),
                code=hz["code"],
                name=hz["name"],
                hazard_type=hz["hazard_type"],
                severity=hz["severity"],
                rainfall_24h_mm=hz["rainfall_24h_mm"],
                slope_saturation_pct=hz["slope_saturation_pct"],
                metadata_json=hz.get("metadata"),
                geom=WKTElement(wkt, srid=4326)
            )
            db.add(hazard)
        db.flush()
        print(f"✅ Seeded Hazard Zones")

        # 5. Seed Plan V1
        pv1 = data["plan_v1"]
        plan = RelocationPlan(
            id=uuid.UUID(pv1["id"]),
            plan_code=pv1["plan_code"],
            version=pv1["version"],
            status=pv1["status"],
            total_evacuees=pv1["total_evacuees"],
            approved_by=pv1["approved_by"],
            approved_at=datetime.now(timezone.utc),
            decision_context=pv1["decision_context"]
        )
        db.add(plan)
        db.flush()

        # 6. Seed Plan V1 Assignments
        for assign in pv1["assignments"]:
            hab = hab_map[assign["habitation_code"]]
            sh = shelter_map[assign["shelter_code"]]
            rt = route_map[assign["route_code"]]
            assignment = PlanAssignment(
                id=uuid.UUID(assign["id"]),
                plan_id=plan.id,
                habitation_id=hab.id,
                shelter_id=sh.id,
                route_id=rt.id,
                allocated_population=assign["allocated_population"],
                priority_order=assign["priority_order"]
            )
            db.add(assignment)
        db.flush()
        print(f"✅ Seeded Plan V1 (Chooralmala -> Meppadi Hall Alpha via R1: 120 people)")

        # 7. Seed Genesis Audit Record
        genesis_payload = {
            "action": "SYSTEM_INITIALIZATION",
            "scenario": "Wayanad Kerala Emergency Relocation Plan V1",
            "plan_id": str(plan.id),
            "plan_code": plan.plan_code,
            "version": plan.version,
            "evacuees": plan.total_evacuees,
            "status": plan.status,
            "approved_by": plan.approved_by
        }
        genesis_hash = AuditLedger.compute_hash(
            sequence_num=1,
            event_type="GENESIS_PLAN_V1_ESTABLISHED",
            actor="District Collector / DDMA Wayanad",
            prev_hash=None,
            payload=genesis_payload
        )
        genesis_ledger = AuditLedger(
            sequence_num=1,
            event_type="GENESIS_PLAN_V1_ESTABLISHED",
            actor="District Collector / DDMA Wayanad",
            prev_hash=None,
            curr_hash=genesis_hash,
            payload=genesis_payload,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(genesis_ledger)
        db.commit()
        print(f"✅ Seeded Genesis Audit Record (Hash: {genesis_hash[:16]}...)")
        print("🎉 Wayanad synthetic seed completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
