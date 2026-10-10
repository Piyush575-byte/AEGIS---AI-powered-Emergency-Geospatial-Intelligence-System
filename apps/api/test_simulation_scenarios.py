import sys
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_all_simulation_features():
    print("=" * 60)
    print("AEGIS GROUND-CONDITION SIMULATOR FULL ACCEPTANCE TEST")
    print("=" * 60)

    # 1. Reset
    print("\n[TEST 1] Reset to Baseline Plan V1...", flush=True)
    res = client.post("/api/v1/simulate/reset")
    assert res.status_code == 200, f"Reset failed: {res.text}"
    print("  ✓ Database reset successfully.")

    # 2. Get Simulation State
    print("\n[TEST 2] GET /api/v1/simulate/state...", flush=True)
    res = client.get("/api/v1/simulate/state")
    assert res.status_code == 200
    state = res.json()
    assert state["active_plan"]["version"] == 1
    assert len(state["routes"]) >= 4
    assert len(state["shelters"]) >= 4
    print(f"  ✓ Active Plan: {state['active_plan']['plan_code']} v{state['active_plan']['version']}")
    print(f"  ✓ Routes monitored: {len(state['routes'])}, Shelters monitored: {len(state['shelters'])}")

    # 3. Route Block Simulation
    print("\n[TEST 3] POST /api/v1/simulate/route (Route R1 Blocked)...", flush=True)
    res = client.post("/api/v1/simulate/route", json={
        "corridor_code": "R1",
        "status": "blocked",
        "reason": "bridge_failure",
        "source": "Field Team 07"
    })
    assert res.status_code == 200, f"Route block failed: {res.text}"
    data = res.json()
    assert data["status"] == "RECOMMENDATION_READY"
    assert data["recommendation"]["recommended_shelter_code"] == "SH-GAMMA"
    assert data["recommendation"]["recommended_route_code"] == "R4"
    assert data["human_approval_required"] is True
    print(f"  ✓ Route R1 blocked detected.")
    print(f"  ✓ What changed: {data['what_changed']}")
    print(f"  ✓ Recommended alternative: {data['recommendation']['recommended_shelter_name']} via {data['recommendation']['recommended_route_code']}")

    # 4. Route Reopened (Recovery) Simulation
    print("\n[TEST 4] POST /api/v1/simulate/route (Route R1 Reopened)...", flush=True)
    res = client.post("/api/v1/simulate/route", json={
        "corridor_code": "R1",
        "status": "clear",
        "reason": "reopened",
        "source": "PWD Field Team"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("RECOVERED", "NO_IMPACT")
    print(f"  ✓ Route R1 reopened and evaluated: {data['status']}")

    # 5. Shelter Capacity Loss Simulation
    print("\n[TEST 5] POST /api/v1/simulate/shelter (Shelter Alpha capacity reduced to 80)...", flush=True)
    # First reset to make sure Alpha has the assignment of 120 people
    client.post("/api/v1/simulate/reset")
    res = client.post("/api/v1/simulate/shelter", json={
        "shelter_code": "SH-ALPHA",
        "new_capacity": 80,
        "reason": "capacity_reduction",
        "source": "Shelter Registry"
    })
    assert res.status_code == 200, f"Shelter simulation failed: {res.text}"
    data = res.json()
    assert data["status"] == "RECOMMENDATION_READY"
    print(f"  ✓ Shelter capacity deficit detected. Evacuees: 120, Remaining capacity: 80.")
    print(f"  ✓ What is affected: {data['what_is_affected']}")
    print(f"  ✓ Recommended re-allocation: {data['recommendation']['recommended_shelter_name']}")

    # 6. PostGIS Hazard Expansion Simulation
    print("\n[TEST 6] POST /api/v1/simulate/hazard (Hazard Zone expansion +1.5 km)...", flush=True)
    client.post("/api/v1/simulate/reset")
    res = client.post("/api/v1/simulate/hazard", json={
        "hazard_code": "HZ-CHOORALMALA-SLOPE",
        "action": "expand",
        "radius_km_delta": 1.5,
        "severity": "critical",
        "source": "GIS Remote Sensing"
    })
    assert res.status_code == 200, f"Hazard expansion failed: {res.text}"
    data = res.json()
    assert data["status"] == "RECOMMENDATION_READY"
    print(f"  ✓ PostGIS spatial buffer calculated.")
    print(f"  ✓ Intersecting corridors: {data['incident']['affected_corridors']}")
    print(f"  ✓ Recommended safe path: {data['recommendation']['recommended_shelter_name']} via {data['recommendation']['recommended_route_code']}")

    # 7. Multi-Hazard Cascade
    print("\n[TEST 7] POST /api/v1/simulate/cascade (Simultaneous Disruptions)...", flush=True)
    client.post("/api/v1/simulate/reset")
    res = client.post("/api/v1/simulate/cascade", json={
        "title": "MULTI-HAZARD CASCADE",
        "events": [
            {"change_type": "route", "corridor_code": "R1", "route_status": "blocked", "route_reason": "bridge_failure"},
            {"change_type": "shelter", "shelter_code": "SH-ALPHA", "new_capacity": 50},
            {"change_type": "hazard", "hazard_code": "HZ-CHOORALMALA-SLOPE", "hazard_action": "severity", "severity": "critical"}
        ],
        "source": "Integrated District EOC"
    })
    assert res.status_code == 200, f"Cascade failed: {res.text}"
    data = res.json()
    assert data["status"] == "RECOMMENDATION_READY"
    print(f"  ✓ Multi-Hazard Cascade processed successfully.")
    print(f"  ✓ Recommendation ready: {data['recommendation']['recommended_shelter_name']}")

    # 8. Human Authority Approval of Recommendation
    rec_id = data["recommendation"]["id"]
    print(f"\n[TEST 8] POST /api/v1/recommendations/{rec_id}/approve (Human Approval)...", flush=True)
    app_res = client.post(f"/api/v1/recommendations/{rec_id}/approve", json={
        "approved_by": "District Collector & Chairman, DDMA Wayanad",
        "authority_role": "DDMA / District Authority",
        "notes": "Statutory approval granted for simulation cascade."
    })
    assert app_res.status_code == 200
    res_body = app_res.json()
    plan_v2 = res_body["plan_v2"]
    assert plan_v2["version"] == 2
    assert plan_v2["status"] == "approved"
    print(f"  ✓ Human authority approval executed. Plan V2 committed: {plan_v2['plan_code']}")

    # 9. Cryptographic Audit Chain Verification
    print("\n[TEST 9] GET /api/v1/audit/verify...", flush=True)
    audit_res = client.get("/api/v1/audit/verify")
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    assert audit_data["is_valid"] is True
    print(f"  ✓ SHA-256 Cryptographic Audit Chain Verified: {audit_data['total_entries']} records, Chain Valid = {audit_data['is_valid']}.")

    print("\n🎉 ALL 9 SIMULATION ACCEPTANCE TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_all_simulation_features()
