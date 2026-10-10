import json
import os
import sys
import uuid
import random
from datetime import datetime, timezone, timedelta
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

from app.core.database import SessionLocal, engine
from app.models import AuditLedger

# District center points & bounding boxes for realistic geography
DISTRICT_PROFILES = [
    {
        "district": "Wayanad",
        "center": (11.65, 76.15),
        "lat_range": (11.45, 11.85),
        "lon_range": (75.95, 76.35),
        "num_habitations": 4500,
        "num_shelters": 210,
        "num_routes": 520,
        "num_incidents": 220,
        "taluks": ["Vythiri", "Mananthavady", "Sulthan Bathery"],
        "villages": ["Meppadi", "Chooralmala", "Mundakkai", "Vellarmala", "Kalpetta", "Vythiri", "Pozhuthana", "Thavinhal", "Padinjarathara"]
    },
    {
        "district": "Idukki",
        "center": (9.95, 77.05),
        "lat_range": (9.65, 10.25),
        "lon_range": (76.75, 77.30),
        "num_habitations": 2500,
        "num_shelters": 120,
        "num_routes": 300,
        "num_incidents": 120,
        "taluks": ["Devikulam", "Udumbanchola", "Peerumade", "Thodupuzha"],
        "villages": ["Munnar", "Chinnakanal", "Marayoor", "Vattavada", "Kattappana", "Nedumkandam", "Kumily"]
    },
    {
        "district": "Malappuram",
        "center": (11.05, 76.10),
        "lat_range": (10.85, 11.30),
        "lon_range": (75.85, 76.35),
        "num_habitations": 1500,
        "num_shelters": 80,
        "num_routes": 200,
        "num_incidents": 80,
        "taluks": ["Nilambur", "Eranad", "Perinthalmanna"],
        "villages": ["Kavalappara", "Pothukal", "Nilambur", "Mampad", "Edakkara", "Chungathara", "Vazhikkadavu"]
    },
    {
        "district": "Kozhikode",
        "center": (11.40, 75.90),
        "lat_range": (11.20, 11.60),
        "lon_range": (75.75, 76.05),
        "num_habitations": 1000,
        "num_shelters": 60,
        "num_routes": 130,
        "num_incidents": 50,
        "taluks": ["Thamarassery", "Koyilandy", "Vadakara"],
        "villages": ["Kodenchery", "Thiruvambady", "Puthuppadi", "Engapuzha", "Kakkadampoyil"]
    },
    {
        "district": "Palakkad",
        "center": (10.85, 76.55),
        "lat_range": (10.65, 11.05),
        "lon_range": (76.35, 76.75),
        "num_habitations": 800,
        "num_shelters": 50,
        "num_routes": 100,
        "num_incidents": 40,
        "taluks": ["Mannarkkad", "Attappady", "Palakkad"],
        "villages": ["Agali", "Pudur", "Sholayur", "Kanjirapuzha", "Alanallur"]
    }
]

def seed_large_dataset():
    # Use deterministic random seed
    random.seed(42)
    db: Session = SessionLocal()

    try:
        print("🌱 Starting AEGIS Large-Scale Deterministic Synthetic Dataset Seeder...")
        start_time = datetime.now(timezone.utc)

        # 1. Clean existing records idempotently
        print("🧹 Clearing previous demo data...")
        db.execute(text("DELETE FROM audit_ledger;"))
        db.execute(text("DELETE FROM recommendations;"))
        db.execute(text("DELETE FROM plan_assignments;"))
        db.execute(text("DELETE FROM relocation_plans;"))
        db.execute(text("DELETE FROM incidents;"))
        db.execute(text("DELETE FROM routes;"))
        db.execute(text("DELETE FROM shelters;"))
        db.execute(text("DELETE FROM habitations;"))
        db.execute(text("DELETE FROM hazard_zones;"))
        db.commit()

        # 2. Insert Canonical Plan V1 Seed Data from wayanad_seed.json
        seed_file_path = os.path.join("..", "..", "seed", "wayanad_seed.json")
        if not os.path.exists(seed_file_path):
            seed_file_path = os.path.join("seed", "wayanad_seed.json")
        if not os.path.exists(seed_file_path):
            seed_file_path = r"C:\Users\piyus\.gemini\antigravity-ide\scratch\aegis\seed\wayanad_seed.json"

        with open(seed_file_path, "r", encoding="utf-8") as f:
            seed_data = json.load(f)

        print("📍 Seeding canonical Wayanad baseline records (3 habitations, 12 shelters, 12 routes, 21 hazard zones)...")
        # Canonical Habitations
        for h in seed_data["habitations"]:
            meta = dict(h.get("metadata") or {})
            meta["district"] = "Wayanad"
            meta["is_canonical"] = True
            db.execute(
                text("""
                    INSERT INTO habitations (id, code, name, population, households, risk_level, metadata_json, geom, created_at, updated_at)
                    VALUES (:id, :code, :name, :population, :households, :risk_level, :meta, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), NOW(), NOW())
                """),
                {
                    "id": h["id"],
                    "code": h["code"],
                    "name": h["name"],
                    "population": h["population"],
                    "households": h["households"],
                    "risk_level": h["risk_level"],
                    "meta": json.dumps(meta),
                    "lon": h["longitude"],
                    "lat": h["latitude"]
                }
            )

        # Canonical Shelters
        for s in seed_data["shelters"]:
            meta = dict(s.get("metadata") or {})
            meta["district"] = "Wayanad"
            meta["is_canonical"] = True
            db.execute(
                text("""
                    INSERT INTO shelters (id, code, name, total_capacity, occupied_capacity, medical_support, status, metadata_json, geom, created_at, updated_at)
                    VALUES (:id, :code, :name, :total_capacity, :occupied_capacity, :medical_support, :status, :meta, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), NOW(), NOW())
                """),
                {
                    "id": s["id"],
                    "code": s["code"],
                    "name": s["name"],
                    "total_capacity": s["total_capacity"],
                    "occupied_capacity": s["occupied_capacity"],
                    "medical_support": s["medical_support"],
                    "status": s["status"],
                    "meta": json.dumps(meta),
                    "lon": s["longitude"],
                    "lat": s["latitude"]
                }
            )

        # Canonical Routes
        for r in seed_data["routes"]:
            meta = dict(r.get("metadata") or {})
            meta["district"] = "Wayanad"
            meta["is_canonical"] = True
            coords_str = ", ".join([f"{lon} {lat}" for lon, lat in r["coordinates"]])
            wkt = f"LINESTRING({coords_str})"
            db.execute(
                text("""
                    INSERT INTO routes (id, code, name, status, distance_km, capacity_pax_hour, metadata_json, geom, created_at, updated_at)
                    VALUES (:id, :code, :name, :status, :distance_km, :capacity_pax_hour, :meta, ST_GeomFromText(:wkt, 4326), NOW(), NOW())
                """),
                {
                    "id": r["id"],
                    "code": r["code"],
                    "name": r["name"],
                    "status": r["status"],
                    "distance_km": r["distance_km"],
                    "capacity_pax_hour": r["capacity_pax_hour"],
                    "meta": json.dumps(meta),
                    "wkt": wkt
                }
            )

        # Canonical Hazard Zones
        for hz in seed_data["hazard_zones"]:
            coords_str = ", ".join([f"{lon} {lat}" for lon, lat in hz["polygon"]])
            wkt = f"POLYGON(({coords_str}))"
            meta = dict(hz.get("metadata") or {})
            meta["district"] = "Wayanad"
            db.execute(
                text("""
                    INSERT INTO hazard_zones (id, code, name, hazard_type, severity, rainfall_24h_mm, slope_saturation_pct, metadata_json, geom, created_at, updated_at)
                    VALUES (:id, :code, :name, :hazard_type, :severity, :rainfall_24h_mm, :slope_saturation_pct, :meta, ST_GeomFromText(:wkt, 4326), NOW(), NOW())
                """),
                {
                    "id": hz["id"],
                    "code": hz["code"],
                    "name": hz["name"],
                    "hazard_type": hz["hazard_type"],
                    "severity": hz["severity"],
                    "rainfall_24h_mm": hz["rainfall_24h_mm"],
                    "slope_saturation_pct": hz["slope_saturation_pct"],
                    "meta": json.dumps(meta),
                    "wkt": wkt
                }
            )

        # Canonical Plan V1
        pv1 = seed_data["plan_v1"]
        db.execute(
            text("""
                INSERT INTO relocation_plans (id, plan_code, version, status, total_evacuees, approved_by, approved_at, decision_context, created_at, updated_at)
                VALUES (:id, :plan_code, :version, :status, :total_evacuees, :approved_by, NOW(), :decision_context, NOW(), NOW())
            """),
            {
                "id": pv1["id"],
                "plan_code": pv1["plan_code"],
                "version": pv1["version"],
                "status": pv1["status"],
                "total_evacuees": pv1["total_evacuees"],
                "approved_by": pv1["approved_by"],
                "decision_context": json.dumps(pv1["decision_context"])
            }
        )

        for assign in pv1["assignments"]:
            db.execute(
                text("""
                    INSERT INTO plan_assignments (id, plan_id, habitation_id, shelter_id, route_id, allocated_population, priority_order, status, created_at, updated_at)
                    VALUES (
                        :id, :plan_id,
                        (SELECT id FROM habitations WHERE code = :hab_code),
                        (SELECT id FROM shelters WHERE code = :sh_code),
                        (SELECT id FROM routes WHERE code = :rt_code),
                        :allocated_pop, :priority_order, 'active', NOW(), NOW()
                    )
                """),
                {
                    "id": assign["id"],
                    "plan_id": pv1["id"],
                    "hab_code": assign["habitation_code"],
                    "sh_code": assign["shelter_code"],
                    "rt_code": assign["route_code"],
                    "allocated_pop": assign["allocated_population"],
                    "priority_order": assign["priority_order"]
                }
            )

        # Genesis Audit record
        genesis_payload = {
            "action": "SYSTEM_INITIALIZATION",
            "scenario": "Wayanad Kerala Emergency Relocation Plan V1",
            "plan_id": pv1["id"],
            "plan_code": pv1["plan_code"],
            "version": pv1["version"],
            "evacuees": pv1["total_evacuees"],
            "status": pv1["status"],
            "approved_by": pv1["approved_by"]
        }
        genesis_hash = AuditLedger.compute_hash(
            sequence_num=1,
            event_type="GENESIS_PLAN_V1_ESTABLISHED",
            actor="District Collector / DDMA Wayanad",
            prev_hash=None,
            payload=genesis_payload
        )
        db.execute(
            text("""
                INSERT INTO audit_ledger (id, sequence_num, event_type, actor, prev_hash, curr_hash, payload, timestamp)
                VALUES (:id, :seq, :event_type, :actor, NULL, :curr_hash, :payload, NOW())
            """),
            {
                "id": str(uuid.uuid4()),
                "seq": 1,
                "event_type": "GENESIS_PLAN_V1_ESTABLISHED",
                "actor": "District Collector / DDMA Wayanad",
                "curr_hash": genesis_hash,
                "payload": json.dumps(genesis_payload)
            }
        )
        db.commit()
        print("✅ Canonical records seeded successfully.")

        # -------------------------------------------------------------
        # 3. GENERATE 10,000+ SYNTHETIC HABITATIONS
        # -------------------------------------------------------------
        print("🌍 Synthesizing 10,000+ Habitations across Kerala districts...")
        hab_batch = []
        hab_counter = 1
        for dist in DISTRICT_PROFILES:
            d_name = dist["district"]
            lat_min, lat_max = dist["lat_range"]
            lon_min, lon_max = dist["lon_range"]
            count = dist["num_habitations"]
            taluks = dist["taluks"]
            villages = dist["villages"]

            for i in range(count):
                hab_id = str(uuid.uuid4())
                code = f"HAB-{d_name[:3].upper()}-{hab_counter:05d}"
                village = random.choice(villages)
                ward = random.randint(1, 24)
                name = f"{village} Ward {ward} ({d_name[:3].upper()}-{i+1})"
                pop = random.randint(25, 480)
                households = max(5, int(pop / random.uniform(3.2, 4.8)))
                
                # Risk level distribution: 60% safe, 25% warning, 12% high, 3% critical
                rnd = random.random()
                if rnd < 0.60:
                    risk = "safe"
                elif rnd < 0.85:
                    risk = "warning"
                elif rnd < 0.97:
                    risk = "high"
                else:
                    risk = "critical"

                lat = round(random.uniform(lat_min, lat_max), 6)
                lon = round(random.uniform(lon_min, lon_max), 6)
                slope = round(random.uniform(15.0, 96.5), 1)

                meta = {
                    "district": d_name,
                    "taluk": random.choice(taluks),
                    "panchayath": village,
                    "ward": f"Ward {ward}",
                    "slope_saturation_pct": slope,
                    "is_synthetic": True
                }

                hab_batch.append({
                    "id": hab_id,
                    "code": code,
                    "name": name,
                    "population": pop,
                    "households": households,
                    "risk_level": risk,
                    "meta": json.dumps(meta),
                    "lon": lon,
                    "lat": lat
                })
                hab_counter += 1

                if len(hab_batch) >= 1000:
                    db.execute(
                        text("""
                            INSERT INTO habitations (id, code, name, population, households, risk_level, metadata_json, geom, created_at, updated_at)
                            VALUES (:id, :code, :name, :population, :households, :risk_level, :meta, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), NOW(), NOW())
                        """),
                        hab_batch
                    )
                    db.commit()
                    hab_batch.clear()

        if hab_batch:
            db.execute(
                text("""
                    INSERT INTO habitations (id, code, name, population, households, risk_level, metadata_json, geom, created_at, updated_at)
                    VALUES (:id, :code, :name, :population, :households, :risk_level, :meta, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), NOW(), NOW())
                """),
                hab_batch
            )
            db.commit()
            hab_batch.clear()
        print(f"✅ Total Habitations generated: {hab_counter}")

        # -------------------------------------------------------------
        # 4. GENERATE 500+ SYNTHETIC SHELTERS
        # -------------------------------------------------------------
        print("🏠 Synthesizing 500+ Relief Shelters...")
        shelter_batch = []
        shelter_counter = 1
        shelter_types = ["Grama Panchayath Hall", "GHSS School", "Community Centre", "St. Marys Auditorium", "Town Hall", "Model Residential School", "College Auditorium"]
        for dist in DISTRICT_PROFILES:
            d_name = dist["district"]
            lat_min, lat_max = dist["lat_range"]
            lon_min, lon_max = dist["lon_range"]
            count = dist["num_shelters"]
            villages = dist["villages"]

            for i in range(count):
                sh_id = str(uuid.uuid4())
                code = f"SH-{d_name[:3].upper()}-{shelter_counter:04d}"
                stype = random.choice(shelter_types)
                village = random.choice(villages)
                name = f"{village} {stype} ({d_name[:3].upper()}-{i+1})"
                
                total_cap = random.choice([150, 200, 250, 300, 400, 500, 650])
                # Occ capacity 10% to 70%
                occ_cap = int(total_cap * random.uniform(0.1, 0.7))
                med_support = random.choice([True, False, False, True]) # 50%
                
                status_rnd = random.random()
                if status_rnd < 0.78:
                    status = "active"
                elif status_rnd < 0.90:
                    status = "degraded_access"
                elif status_rnd < 0.97:
                    status = "full"
                else:
                    status = "closed"

                lat = round(random.uniform(lat_min, lat_max), 6)
                lon = round(random.uniform(lon_min, lon_max), 6)

                meta = {
                    "district": d_name,
                    "village": village,
                    "facility_type": stype,
                    "generator_backup": random.choice([True, False]),
                    "water_storage_liters": random.choice([5000, 10000, 20000]),
                    "is_synthetic": True
                }

                shelter_batch.append({
                    "id": sh_id,
                    "code": code,
                    "name": name,
                    "total_capacity": total_cap,
                    "occupied_capacity": occ_cap,
                    "medical_support": med_support,
                    "status": status,
                    "meta": json.dumps(meta),
                    "lon": lon,
                    "lat": lat
                })
                shelter_counter += 1

                if len(shelter_batch) >= 500:
                    db.execute(
                        text("""
                            INSERT INTO shelters (id, code, name, total_capacity, occupied_capacity, medical_support, status, metadata_json, geom, created_at, updated_at)
                            VALUES (:id, :code, :name, :total_capacity, :occupied_capacity, :medical_support, :status, :meta, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), NOW(), NOW())
                        """),
                        shelter_batch
                    )
                    db.commit()
                    shelter_batch.clear()

        if shelter_batch:
            db.execute(
                text("""
                    INSERT INTO shelters (id, code, name, total_capacity, occupied_capacity, medical_support, status, metadata_json, geom, created_at, updated_at)
                    VALUES (:id, :code, :name, :total_capacity, :occupied_capacity, :medical_support, :status, :meta, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), NOW(), NOW())
                """),
                shelter_batch
            )
            db.commit()
            shelter_batch.clear()
        print(f"✅ Total Shelters generated: {shelter_counter}")

        # -------------------------------------------------------------
        # 5. GENERATE 1,200+ SYNTHETIC ROUTE SEGMENTS
        # -------------------------------------------------------------
        print("🛣️ Synthesizing 1,200+ Evacuation & Road Segments...")
        route_batch = []
        route_counter = 1
        road_prefixes = ["NH-766 Bypass", "SH-54 Arterial", "Grama Road", "Forest Link Corridor", "Ghat Sector Road", "Hill Highway Segment"]
        for dist in DISTRICT_PROFILES:
            d_name = dist["district"]
            lat_min, lat_max = dist["lat_range"]
            lon_min, lon_max = dist["lon_range"]
            count = dist["num_routes"]
            villages = dist["villages"]

            for i in range(count):
                rt_id = str(uuid.uuid4())
                code = f"RT-{d_name[:3].upper()}-{route_counter:04d}"
                prefix = random.choice(road_prefixes)
                v1, v2 = random.sample(villages, 2)
                name = f"{v1}-{v2} {prefix} ({route_counter})"

                status_rnd = random.random()
                if status_rnd < 0.82:
                    status = "clear"
                elif status_rnd < 0.94:
                    status = "degraded"
                else:
                    status = "blocked"

                # Generate 2 to 4 linestring vertices
                lat1 = random.uniform(lat_min, lat_max)
                lon1 = random.uniform(lon_min, lon_max)
                lat2 = lat1 + random.uniform(-0.04, 0.04)
                lon2 = lon1 + random.uniform(-0.04, 0.04)
                lat3 = lat2 + random.uniform(-0.03, 0.03)
                lon3 = lon2 + random.uniform(-0.03, 0.03)
                
                coords = [f"{lon1:.6f} {lat1:.6f}", f"{lon2:.6f} {lat2:.6f}", f"{lon3:.6f} {lat3:.6f}"]
                wkt = f"LINESTRING({', '.join(coords)})"
                dist_km = round(random.uniform(2.5, 22.0), 1)
                pax_hr = random.choice([200, 350, 500, 800, 1200])

                meta = {
                    "district": d_name,
                    "origin": v1,
                    "destination": v2,
                    "is_synthetic": True
                }

                route_batch.append({
                    "id": rt_id,
                    "code": code,
                    "name": name,
                    "status": status,
                    "distance_km": dist_km,
                    "capacity_pax_hour": pax_hr,
                    "meta": json.dumps(meta),
                    "wkt": wkt
                })
                route_counter += 1

                if len(route_batch) >= 500:
                    db.execute(
                        text("""
                            INSERT INTO routes (id, code, name, status, distance_km, capacity_pax_hour, metadata_json, geom, created_at, updated_at)
                            VALUES (:id, :code, :name, :status, :distance_km, :capacity_pax_hour, :meta, ST_GeomFromText(:wkt, 4326), NOW(), NOW())
                        """),
                        route_batch
                    )
                    db.commit()
                    route_batch.clear()

        if route_batch:
            db.execute(
                text("""
                    INSERT INTO routes (id, code, name, status, distance_km, capacity_pax_hour, metadata_json, geom, created_at, updated_at)
                    VALUES (:id, :code, :name, :status, :distance_km, :capacity_pax_hour, :meta, ST_GeomFromText(:wkt, 4326), NOW(), NOW())
                """),
                route_batch
            )
            db.commit()
            route_batch.clear()
        print(f"✅ Total Routes generated: {route_counter}")

        # -------------------------------------------------------------
        # 6. GENERATE 500+ SYNTHETIC INCIDENTS
        # -------------------------------------------------------------
        print("⚠️ Synthesizing 500+ Operational Incidents across districts...")
        incident_batch = []
        incident_counter = 1
        incident_types = [
            ("debris_flow", "Debris flow obstruction across carriage-way", "critical"),
            ("bridge_failure", "Structural abutment failure or culvert overflow", "critical"),
            ("road_block", "Fallen timber and power transmission cables", "major"),
            ("flash_flood", "Riverbank water overflow onto evacuation corridor", "major"),
            ("culvert_collapse", "Culvert damage with vehicle movement stopped", "critical"),
            ("slope_failure", "Toe failure on cutting slope along hill highway", "major"),
            ("water_logging", "Low-lying settlement inundation (0.8m depth)", "minor")
        ]

        now_utc = datetime.now(timezone.utc)
        for dist in DISTRICT_PROFILES:
            d_name = dist["district"]
            lat_min, lat_max = dist["lat_range"]
            lon_min, lon_max = dist["lon_range"]
            count = dist["num_incidents"]
            villages = dist["villages"]

            for i in range(count):
                inc_id = str(uuid.uuid4())
                itype, base_desc, base_sev = random.choice(incident_types)
                village = random.choice(villages)
                desc = f"{d_name} - {village}: {base_desc} (Sector {random.randint(1, 12)})"
                
                # 75% active, 15% investigating, 10% cleared
                srnd = random.random()
                if srnd < 0.75:
                    status = "active"
                elif srnd < 0.90:
                    status = "investigating"
                else:
                    status = "cleared"

                lat = round(random.uniform(lat_min, lat_max), 6)
                lon = round(random.uniform(lon_min, lon_max), 6)
                # Random report time in past 24 hours
                rep_time = now_utc - timedelta(minutes=random.randint(5, 1440))

                payload = {
                    "district": d_name,
                    "reported_by": random.choice(["Field Squad Bravo", "Kerala Police Control", "Fire & Rescue Meppadi", "NDRF 04 Bn", "KSEB Substation"]),
                    "is_synthetic": True
                }

                incident_batch.append({
                    "id": inc_id,
                    "incident_type": itype,
                    "description": desc,
                    "status": status,
                    "severity": base_sev,
                    "payload": json.dumps(payload),
                    "lon": lon,
                    "lat": lat,
                    "reported_at": rep_time
                })
                incident_counter += 1

                if len(incident_batch) >= 500:
                    db.execute(
                        text("""
                            INSERT INTO incidents (id, incident_type, description, status, severity, raw_payload, geom, reported_at, created_at, updated_at)
                            VALUES (:id, :incident_type, :description, :status, :severity, :payload, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), :reported_at, NOW(), NOW())
                        """),
                        incident_batch
                    )
                    db.commit()
                    incident_batch.clear()

        if incident_batch:
            db.execute(
                text("""
                    INSERT INTO incidents (id, incident_type, description, status, severity, raw_payload, geom, reported_at, created_at, updated_at)
                    VALUES (:id, :incident_type, :description, :status, :severity, :payload, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), :reported_at, NOW(), NOW())
                """),
                incident_batch
            )
            db.commit()
            incident_batch.clear()
        print(f"✅ Total Incidents generated: {incident_counter}")

        # -------------------------------------------------------------
        # 7. ADD DISTRICT POLYGONS / HAZARDS ACROSS KERALA
        # -------------------------------------------------------------
        print("🗺️ Synthesizing Regional Hazard Polygons...")
        # Add high-susceptibility zones for Idukki and Malappuram
        regional_hazards = [
            {
                "id": str(uuid.uuid4()),
                "code": "HZ-IDUKKI-MUNNAR-SLOPE",
                "name": "Munnar-Devikulam High Vulnerability Landslide Corridor",
                "hazard_type": "landslide",
                "severity": "critical",
                "rainfall_24h_mm": 218.0,
                "slope_saturation_pct": 92.4,
                "polygon": [[77.02, 10.05], [77.12, 10.05], [77.14, 10.15], [77.04, 10.15], [77.02, 10.05]],
                "meta": {"district": "Idukki", "is_synthetic": True}
            },
            {
                "id": str(uuid.uuid4()),
                "code": "HZ-MALAPPURAM-KAVALAPPARA",
                "name": "Kavalappara-Pothukal High Inundation & Slope Slip Belt",
                "hazard_type": "landslide",
                "severity": "high",
                "rainfall_24h_mm": 182.5,
                "slope_saturation_pct": 87.8,
                "polygon": [[76.22, 11.20], [76.32, 11.20], [76.35, 11.28], [76.24, 11.28], [76.22, 11.20]],
                "meta": {"district": "Malappuram", "is_synthetic": True}
            }
        ]
        for rhz in regional_hazards:
            coords_str = ", ".join([f"{lon} {lat}" for lon, lat in rhz["polygon"]])
            wkt = f"POLYGON(({coords_str}))"
            db.execute(
                text("""
                    INSERT INTO hazard_zones (id, code, name, hazard_type, severity, rainfall_24h_mm, slope_saturation_pct, metadata_json, geom, created_at, updated_at)
                    VALUES (:id, :code, :name, :hazard_type, :severity, :rainfall_24h_mm, :slope_saturation_pct, :meta, ST_GeomFromText(:wkt, 4326), NOW(), NOW())
                """),
                {
                    "id": rhz["id"],
                    "code": rhz["code"],
                    "name": rhz["name"],
                    "hazard_type": rhz["hazard_type"],
                    "severity": rhz["severity"],
                    "rainfall_24h_mm": rhz["rainfall_24h_mm"],
                    "slope_saturation_pct": rhz["slope_saturation_pct"],
                    "meta": json.dumps(rhz["meta"]),
                    "wkt": wkt
                }
            )
        db.commit()

        duration = (datetime.now(timezone.utc) - start_time).total_seconds()
        print(f"🎉 Large synthetic dataset generated successfully in {duration:.1f}s!")

        # Verify summary stats
        h_cnt = db.execute(text("SELECT count(*) FROM habitations")).scalar()
        s_cnt = db.execute(text("SELECT count(*) FROM shelters")).scalar()
        r_cnt = db.execute(text("SELECT count(*) FROM routes")).scalar()
        i_cnt = db.execute(text("SELECT count(*) FROM incidents")).scalar()
        hz_cnt = db.execute(text("SELECT count(*) FROM hazard_zones")).scalar()
        print(f"📊 Final DB Totals:")
        print(f"   - Habitations: {h_cnt:,}")
        print(f"   - Shelters:    {s_cnt:,}")
        print(f"   - Routes:      {r_cnt:,}")
        print(f"   - Incidents:   {i_cnt:,}")
        print(f"   - Hazard Zones:{hz_cnt:,}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during large dataset seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_large_dataset()
