import os
import sys
import uuid
from sqlalchemy import text
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.abspath("."))
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from app.core.database import SessionLocal, engine
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

def run_phase1_verification():
    print("=" * 60)
    print("AEGIS PHASE 1 VERIFICATION SUITE")
    print("=" * 60)

    db: Session = SessionLocal()
    errors = []
    
    try:
        # Check 1: PostGIS Extension
        print("\n[CHECK 1] Verifying PostGIS Extension...")
        postgis_ver = db.execute(text("SELECT PostGIS_Full_Version();")).scalar()
        print(f"  ✓ PostGIS Active: {postgis_ver[:80]}...")

        # Check 2: Database Tables in Schema
        print("\n[CHECK 2] Verifying Created Tables...")
        tables_query = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        existing_tables = [row[0] for row in db.execute(tables_query).fetchall()]
        required_tables = [
            "audit_ledger",
            "habitations",
            "hazard_zones",
            "incidents",
            "plan_assignments",
            "relocation_plans",
            "routes",
            "shelters"
        ]
        for t in required_tables:
            if t in existing_tables:
                print(f"  ✓ Table exists: {t}")
            else:
                msg = f"Missing required table: {t}"
                print(f"  ✗ {msg}")
                errors.append(msg)

        # Check 3: Spatial GIST Indexes
        print("\n[CHECK 3] Verifying Spatial GIST Indexes...")
        index_query = text("""
            SELECT indexname, tablename, indexdef 
            FROM pg_indexes 
            WHERE schemaname = 'public' AND indexdef LIKE '%gist%'
            ORDER BY tablename;
        """)
        gist_indexes = db.execute(index_query).fetchall()
        for idx in gist_indexes:
            print(f"  ✓ GIST Index on {idx[1]}: {idx[0]}")
        
        if len(gist_indexes) < 4:
            errors.append(f"Expected at least 4 GIST spatial indexes, found {len(gist_indexes)}")

        # Check 4: Query Habitations (Chooralmala with 120 people)
        print("\n[CHECK 4] Verifying Habitation Data...")
        chooralmala = db.query(Habitation).filter(Habitation.code == "HAB-CHOORALMALA").first()
        if chooralmala:
            print(f"  ✓ Found Habitation: {chooralmala.name} (Code: {chooralmala.code})")
            print(f"    - Population: {chooralmala.population} (Expected: 120)")
            print(f"    - Households: {chooralmala.households}")
            print(f"    - Risk Level: {chooralmala.risk_level}")
            if chooralmala.population != 120:
                errors.append(f"Chooralmala population mismatch: expected 120, got {chooralmala.population}")
        else:
            msg = "Chooralmala habitation not found!"
            print(f"  ✗ {msg}")
            errors.append(msg)

        # Check 5: Query Shelters (Alpha, Beta, Delta, Gamma)
        print("\n[CHECK 5] Verifying Shelters...")
        shelters = db.query(Shelter).order_by(Shelter.code).all()
        for s in shelters:
            print(f"  ✓ Shelter {s.code}: {s.name}")
            print(f"    - Total Cap: {s.total_capacity}, Occupied: {s.occupied_capacity}, Available: {s.available_capacity}")
            print(f"    - Status: {s.status}, Medical Support: {s.medical_support}")

        shelter_codes = {s.code for s in shelters}
        for expected in ["SH-ALPHA", "SH-BETA", "SH-DELTA", "SH-GAMMA"]:
            if expected not in shelter_codes:
                errors.append(f"Missing expected shelter: {expected}")

        # Check 6: Query Routes R1-R4
        print("\n[CHECK 6] Verifying Evacuation Routes R1–R4...")
        routes = db.query(Route).order_by(Route.code).all()
        for r in routes:
            print(f"  ✓ Route {r.code}: {r.name}")
            print(f"    - Distance: {r.distance_km} km, Status: {r.status}, Capacity: {r.capacity_pax_hour} pax/hr")
        
        route_codes = {r.code for r in routes}
        for expected in ["R1", "R2", "R3", "R4"]:
            if expected not in route_codes:
                errors.append(f"Missing expected route: {expected}")

        # Check 7: Plan V1 and Assignment
        print("\n[CHECK 7] Verifying Plan V1 & Assignments...")
        plan_v1 = db.query(RelocationPlan).filter(RelocationPlan.plan_code == "AEGIS-PLAN-WAYANAD-V1").first()
        if plan_v1:
            print(f"  ✓ Plan V1 Found: {plan_v1.plan_code}")
            print(f"    - Version: {plan_v1.version}")
            print(f"    - Status: {plan_v1.status}")
            print(f"    - Total Evacuees: {plan_v1.total_evacuees} (Expected: 120)")
            print(f"    - Approved By: {plan_v1.approved_by}")
            
            assignments = db.query(PlanAssignment).filter(PlanAssignment.plan_id == plan_v1.id).all()
            print(f"    - Assignments Count: {len(assignments)}")
            for a in assignments:
                print(f"      * Habitation: {a.habitation.name} -> Shelter: {a.shelter.name} via Route: {a.route.code} (Pax: {a.allocated_population})")
                if a.allocated_population != 120:
                    errors.append(f"Assignment population mismatch: expected 120, got {a.allocated_population}")
                if a.shelter.code != "SH-ALPHA":
                    errors.append(f"Plan V1 expected shelter SH-ALPHA, got {a.shelter.code}")
                if a.route.code != "R1":
                    errors.append(f"Plan V1 expected route R1, got {a.route.code}")
        else:
            msg = "Plan V1 not found in database!"
            print(f"  ✗ {msg}")
            errors.append(msg)

        # Check 8: PostGIS Spatial Queries
        print("\n[CHECK 8] Executing PostGIS Spatial Functions...")
        spatial_query = text("""
            SELECT 
                h.name as habitation,
                s.name as shelter,
                s.code as shelter_code,
                ROUND(ST_Distance(h.geom::geography, s.geom::geography)::numeric / 1000, 2) as geodesic_distance_km
            FROM habitations h
            CROSS JOIN shelters s
            WHERE h.code = 'HAB-CHOORALMALA'
            ORDER BY geodesic_distance_km;
        """)
        distances = db.execute(spatial_query).fetchall()
        print("  ✓ Spatial Distances from Chooralmala (ST_Distance geodesic):")
        for row in distances:
            print(f"    - To {row[2]} ({row[1]}): {row[3]} km")

        # Route Length via PostGIS
        route_len_query = text("""
            SELECT code, name, ROUND(ST_Length(geom::geography)::numeric / 1000, 2) as calculated_km
            FROM routes
            ORDER BY code;
        """)
        route_lengths = db.execute(route_len_query).fetchall()
        print("  ✓ Calculated Route Lengths (ST_Length geodesic):")
        for rl in route_lengths:
            print(f"    - {rl[0]}: {rl[2]} km")

        # Check 9: Audit Ledger Genesis Record
        print("\n[CHECK 9] Verifying Audit Ledger Genesis Block...")
        genesis = db.query(AuditLedger).filter(AuditLedger.sequence_num == 1).first()
        if genesis:
            print(f"  ✓ Genesis Block #{genesis.sequence_num}: {genesis.event_type}")
            print(f"    - Actor: {genesis.actor}")
            print(f"    - Prev Hash: {genesis.prev_hash}")
            print(f"    - Curr Hash: {genesis.curr_hash}")
            
            # Recalculate hash to verify integrity
            expected_hash = AuditLedger.compute_hash(
                sequence_num=genesis.sequence_num,
                event_type=genesis.event_type,
                actor=genesis.actor,
                prev_hash=genesis.prev_hash,
                payload=genesis.payload
            )
            if expected_hash == genesis.curr_hash:
                print("    ✓ Cryptographic SHA-256 Chain Verification: VALID")
            else:
                errors.append(f"Audit hash mismatch: stored {genesis.curr_hash}, computed {expected_hash}")
        else:
            errors.append("Genesis audit record missing!")

        print("\n" + "=" * 60)
        if errors:
            print(f"❌ VERIFICATION FAILED WITH {len(errors)} ERRORS:")
            for err in errors:
                print(f"   - {err}")
            return False
        else:
            print("✅ ALL PHASE 1 CHECKS PASSED PERFECTLY!")
            print("=" * 60)
            return True

    except Exception as e:
        print(f"❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = run_phase1_verification()
    sys.exit(0 if success else 1)
