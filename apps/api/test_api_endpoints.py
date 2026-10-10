import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath("."))
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from main import app

def test_api_endpoints():
    print("=" * 60)
    print("AEGIS FASTAPI REST ENDPOINTS INTEGRATION TEST")
    print("=" * 60)

    client = TestClient(app)

    # 1. Health check
    print("\n[API 1] GET /health")
    res = client.get("/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print(f"  ✓ Response: {res.json()}")

    # 2. List Routes
    print("\n[API 2] GET /api/v1/routes")
    res = client.get("/api/v1/routes")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    routes = res.json()
    assert len(routes) >= 4, "Expected at least 4 routes"
    print(f"  ✓ Retrieved {len(routes)} evacuation routes.")
    for r in routes:
        print(f"    - {r['code']}: {r['name']} ({r['distance_km']} km, Status: {r['status']})")

    # 3. List Shelters
    print("\n[API 3] GET /api/v1/shelters")
    res = client.get("/api/v1/shelters")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    shelters = res.json()
    assert len(shelters) >= 4, "Expected at least 4 shelters"
    print(f"  ✓ Retrieved {len(shelters)} shelters.")
    for s in shelters:
        print(f"    - {s['code']}: {s['name']} (Available: {s['available_capacity']}/{s['total_capacity']}, Status: {s['status']})")

    # 4. Get Assignments
    print("\n[API 4] GET /api/v1/assignments")
    res = client.get("/api/v1/assignments")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert "assignments" in data, "Must contain assignments"
    print(f"  ✓ Retrieved Plan {data['plan_code']} assignments count: {len(data['assignments'])}")
    for a in data["assignments"]:
        print(f"    - {a['habitation_name']} ({a['allocated_population']} pax) -> {a['shelter_name']} (Status: {a['status']})")

    # 5. POST Simulate Route-Block
    print("\n[API 5] POST /api/v1/simulate/route-block")
    sim_payload = {
        "corridor_code": "R1",
        "description": "API SIMULATION: Bridge collapsed on Route R1 near Chooralmala KM 4.2",
        "incident_type": "bridge_failure"
    }
    res = client.post("/api/v1/simulate/route-block", json=sim_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    sim_result = res.json()
    change_event_id = sim_result["change_event_id"]
    print(f"  ✓ Route-block simulated successfully.")
    print(f"    - Change Event ID: {change_event_id}")
    print(f"    - Affected Population: {sim_result['affected']['affected_population']} pax")
    print(f"    - Recommended Shelter: {sim_result['recommendation']['recommended_shelter_name']}")
    print(f"    - Recommended Route: {sim_result['recommendation']['recommended_route_code']}")
    print(f"    - Recommendation Status: {sim_result['recommendation']['status']}")

    # 6. GET Recommendation by change_event_id
    print(f"\n[API 6] GET /api/v1/recommendations/{change_event_id}")
    res = client.get(f"/api/v1/recommendations/{change_event_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    rec_data = res.json()
    print(f"  ✓ Fetched stored recommendation.")
    print(f"    - Summary: {rec_data['summary']}")
    print(f"    - Status: {rec_data['status']}")
    print(f"    - Candidates evaluated: {len(rec_data['evaluations'])}")
    print(f"    - MCDA Rank 1: {rec_data['mcda_ranking'][0]['shelter_name']} (Score: {rec_data['mcda_ranking'][0]['score_breakdown']['composite_score']})")

    print("\n" + "=" * 60)
    print("✅ ALL 6 API ENDPOINTS VERIFIED AND RESPONDING 200 OK!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    test_api_endpoints()
