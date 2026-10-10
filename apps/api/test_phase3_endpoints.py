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

def test_phase3_endpoints():
    print("=" * 60, flush=True)
    print("AEGIS PHASE 3 COMPREHENSIVE END-TO-END TEST", flush=True)
    print("=" * 60, flush=True)

    client = TestClient(app)

    # 1. Reset database to clean Plan V1 baseline
    print("\n[STEP 1] POST /api/v1/simulate/reset", flush=True)
    res = client.post("/api/v1/simulate/reset")
    assert res.status_code == 200, f"Reset failed: {res.text}"
    print("  ✓ Database reset to Baseline Plan V1 (Chooralmala 120 -> Alpha via R1: CLEAR).", flush=True)

    # 2. Verify Plan V1 and Route R1 clear
    print("\n[STEP 2] GET /api/v1/assignments & GET /api/v1/routes", flush=True)
    res = client.get("/api/v1/assignments")
    assert res.status_code == 200
    assign_data = res.json()
    assert assign_data["version"] == 1
    assert assign_data["assignments"][0]["status"] == "active"
    print(f"  ✓ Plan V1 Active: {assign_data['assignments'][0]['habitation_name']} -> {assign_data['assignments'][0]['shelter_name']} (Route: {assign_data['assignments'][0]['route_code']})", flush=True)

    res = client.get("/api/v1/routes")
    assert res.status_code == 200
    r1 = next(r for r in res.json() if r["code"] == "R1")
    assert r1["status"] == "clear", f"R1 should be clear initially, got {r1['status']}"
    print(f"  ✓ Route R1 status confirmed: {r1['status']}", flush=True)

    # 3. Simulate Route R1 Bridge Failure
    print("\n[STEP 3] POST /api/v1/simulate/route-block", flush=True)
    sim_res = client.post("/api/v1/simulate/route-block", json={
        "corridor_code": "R1",
        "description": "DEMO: Landslide surge severed bridge on Route R1 near Chooralmala KM 4.2",
        "incident_type": "bridge_failure"
    })
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["affected"]["affected_population"] == 120
    assert sim_data["recommendation"]["recommended_shelter_code"] == "SH-GAMMA"
    assert sim_data["recommendation"]["recommended_route_code"] == "R4"
    assert sim_data["recommendation"]["status"] == "pending_human_approval"
    rec_id = sim_data["recommendation"]["id"]
    print(f"  ✓ Bridge failure triggered. Affected evacuees: {sim_data['affected']['affected_population']}", flush=True)
    print(f"  ✓ Advisory Recommendation generated: {sim_data['recommendation']['recommended_shelter_name']} via {sim_data['recommendation']['recommended_route_code']}", flush=True)
    print(f"  ✓ Recommendation status: {sim_data['recommendation']['status']}", flush=True)

    # 4. GET Geodata for Leaflet Map
    print("\n[STEP 4] GET /api/v1/geodata", flush=True)
    geo_res = client.get("/api/v1/geodata")
    assert geo_res.status_code == 200
    geo_data = geo_res.json()
    assert len(geo_data["habitations"]["features"]) >= 1
    assert len(geo_data["shelters"]["features"]) == 4
    assert len(geo_data["routes"]["features"]) == 4
    assert len(geo_data["hazard_zones"]["features"]) >= 1
    r1_geo = next(f for f in geo_data["routes"]["features"] if f["properties"]["code"] == "R1")
    assert r1_geo["properties"]["status"] == "blocked"
    print("  ✓ Geodata returns valid GeoJSON feature collections from PostGIS.", flush=True)
    print("  ✓ PostGIS confirmed Route R1 status is now BLOCKED.", flush=True)

    # 5. Verify Latest Recommendation
    print("\n[STEP 5] GET /api/v1/recommendations/latest", flush=True)
    rec_res = client.get("/api/v1/recommendations/latest")
    assert rec_res.status_code == 200
    latest_rec = rec_res.json()
    assert latest_rec["status"] == "pending_human_approval"
    print(f"  ✓ Retrieved latest recommendation: {latest_rec['summary'][:80]}...", flush=True)

    # 6. Human Approval by DDMA Authority
    print("\n[STEP 6] POST /api/v1/recommendations/{id}/approve", flush=True)
    approval_res = client.post(f"/api/v1/recommendations/{rec_id}/approve", json={
        "approved_by": "District Collector & Chairman, DDMA Wayanad",
        "authority_role": "DDMA / District Authority",
        "notes": "Emergency relocation concurrence granted. Execute Plan V2 via R4 bypass corridor."
    })
    assert approval_res.status_code == 200
    approval_data = approval_res.json()
    assert approval_data["status"] == "SUCCESS"
    assert approval_data["plan_v2"]["version"] == 2
    assert approval_data["plan_v2"]["status"] == "approved"
    assert approval_data["plan_v1"]["status"] == "invalidated"
    print(f"  ✓ Human authority approval recorded for Plan V2.", flush=True)
    print(f"  ✓ Plan V1 preserved as historical record (Status: {approval_data['plan_v1']['status']}).", flush=True)
    print(f"  ✓ Plan V2 active: {approval_data['plan_v2']['assignment']['habitation']} -> {approval_data['plan_v2']['assignment']['shelter']} via {approval_data['plan_v2']['assignment']['route']}", flush=True)

    # 7. GET Plan Diff (V1 vs V2)
    print("\n[STEP 7] GET /api/v1/plans/diff", flush=True)
    diff_res = client.get("/api/v1/plans/diff")
    assert diff_res.status_code == 200
    diff_data = diff_res.json()
    assert diff_data["has_v2"] is True
    assert diff_data["differences"]["shelter_changed"] is True
    assert diff_data["differences"]["route_changed"] is True
    print(f"  ✓ Plan Diff successfully generated:", flush=True)
    print(f"    - V1 Shelter: {diff_data['plan_v1']['shelter_name']} (Status: {diff_data['plan_v1']['status']})")
    print(f"    - V2 Shelter: {diff_data['plan_v2']['shelter_name']} (Status: {diff_data['plan_v2']['status']})")
    print(f"    - V1 Route: {diff_data['plan_v1']['route_code']} -> V2 Route: {diff_data['plan_v2']['route_code']}")

    # 8. Cryptographic Audit Ledger & Chain Integrity
    print("\n[STEP 8] GET /api/v1/audit", flush=True)
    audit_res = client.get("/api/v1/audit")
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    assert audit_data["chain_valid"] is True
    assert audit_data["total_events"] >= 4
    print(f"  ✓ Cryptographic Audit Trail intact: {audit_data['total_events']} causal blocks.", flush=True)
    print(f"  ✓ SHA-256 Chain Valid: {audit_data['chain_valid']} (Tamper Detected: {audit_data['tamper_detected']})")
    for ev in audit_data["events"]:
        print(f"    - Block #{ev['sequence_num']}: {ev['event_type']} | Actor: {ev['actor']} | Hash: {ev['curr_hash'][:16]}...")

    print("\n" + "=" * 60, flush=True)
    print("🎉 ALL PHASE 3 BACKEND APIS & WORKFLOWS VERIFIED 100% SUCCEEDED!", flush=True)
    print("=" * 60, flush=True)

if __name__ == "__main__":
    test_phase3_endpoints()
