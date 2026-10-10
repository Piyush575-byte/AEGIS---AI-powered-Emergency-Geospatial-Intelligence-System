import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"
ROOT_URL = "http://localhost:8000"

def log(msg, success=True):
    symbol = "[OK]" if success else "[FAIL]"
    print(f"{symbol} {msg}")

def run_tests():
    print("=================================================================")
    print("AEGIS OPERATIONAL ACTION & AUDIT VERIFICATION SUITE")
    print("=================================================================\n")
    
    # 0. Health check
    try:
        r = requests.get(f"{ROOT_URL}/health", timeout=5)
        assert r.status_code == 200, f"Health returned {r.status_code}"
        log(f"Backend healthy: {r.json().get('status')}")
    except Exception as e:
        log(f"Backend not responding: {e}", False)
        sys.exit(1)
        
    # Reset to baseline
    print("\n--- Phase 1: Reset to baseline ---")
    r = requests.post(f"{BASE_URL}/simulate/reset")
    assert r.status_code == 200, f"Reset failed: {r.text}"
    log("Reset baseline state successful")
    
    # Verify baseline state
    r = requests.get(f"{BASE_URL}/simulate/state")
    assert r.status_code == 200
    state = r.json()
    active_plan = state.get("active_plan", {})
    assert active_plan.get("version") == 1 or "V1" in active_plan.get("plan_code", ""), f"Unexpected plan: {active_plan}"
    log(f"Active plan is Plan V1 ({active_plan.get('plan_code')}, status={active_plan.get('status')})")
    
    # 1. Simulate R1 bridge failure
    print("\n--- Phase 2: Simulate R1 Bridge Failure ---")
    r = requests.post(f"{BASE_URL}/simulate/route", json={
        "corridor_code": "R1",
        "status": "blocked",
        "reason": "bridge_failure",
        "description": "Bridge failure on Route R1"
    })
    assert r.status_code == 200, f"Simulate route failed: {r.text}"
    log("Simulated R1 bridge failure successfully")
    
    # Fetch active recommendation
    r = requests.get(f"{BASE_URL}/recommendations/latest")
    assert r.status_code == 200, f"Failed to get latest recommendation: {r.text}"
    rec = r.json()
    rec_id = rec["recommendation_id"]
    log(f"Active recommendation generated: ID={rec_id}, target_shelter={rec.get('recommended_shelter', {}).get('name')}, route={rec.get('recommended_route', {}).get('code')}")
    
    # 2. Review recommendation & technical evidence inspection
    print("\n--- Phase 3: Inspect Recommendation & Technical Evidence ---")
    affected_pop = rec.get("affected_habitation", {}).get("population")
    assert affected_pop == 120, f"Expected 120 affected, got {affected_pop}"
    target_route = rec.get("recommended_route", {}).get("code")
    assert target_route == "R4", f"Expected R4 route, got {target_route}"
    evaluations = rec.get("evaluations") or []
    mcda = rec.get("mcda_ranking") or {}
    route_details = rec.get("route_details") or {}
    log(f"Technical evidence: {len(evaluations)} shelter evaluations, MCDA ranking keys: {list(mcda.keys()) if isinstance(mcda, dict) else 'none'}")
    log(f"Route details for recommended R4: {route_details.get('route_code', 'R4')} (Distance: {route_details.get('distance_km')}km, Feasible: {route_details.get('feasible')})")
    
    # 3. Request Changes action
    print("\n--- Phase 4: Action: Request Changes ---")
    req_changes_payload = {
        "requested_by": "District Collector & Chairman, DDMA Wayanad",
        "reason": "Verify alternate corridor clearance and fuel availability before approval."
    }
    r = requests.post(f"{BASE_URL}/recommendations/{rec_id}/request-changes", json=req_changes_payload)
    assert r.status_code == 200, f"Request changes failed: {r.text}"
    req_changes_resp = r.json()
    log(f"Request changes response: status={req_changes_resp.get('status')}")
    assert req_changes_resp.get("status") == "CHANGES_REQUESTED"
    
    # Verify audit contains CHANGES_REQUESTED
    r = requests.get(f"{BASE_URL}/audit")
    assert r.status_code == 200
    audit_data = r.json()
    events = audit_data.get("events", [])
    changes_req_audit = next((a for a in events if a.get("event_type") == "CHANGES_REQUESTED"), None)
    assert changes_req_audit is not None, "CHANGES_REQUESTED audit event not found!"
    log(f"Verified CHANGES_REQUESTED audit record: seq={changes_req_audit.get('sequence_num')}, reason={changes_req_audit.get('payload', {}).get('reason')}")
    
    # Verify Plan V2 was NOT created yet
    r = requests.get(f"{BASE_URL}/simulate/state")
    state = r.json()
    active_plan = state.get("active_plan", {})
    assert active_plan.get("version") == 1 or "V1" in active_plan.get("plan_code", ""), f"Plan V2 was prematurely created: {active_plan}"
    log("Verified Plan V2 was NOT created during changes requested (Plan V1 remains intact)")

    # 4. Reject Recommendation test on fresh cycle
    print("\n--- Phase 5: Action: Reject Recommendation ---")
    # Reset and trigger fresh incident to test reject
    r = requests.post(f"{BASE_URL}/simulate/reset")
    assert r.status_code == 200
    r = requests.post(f"{BASE_URL}/simulate/route", json={
        "corridor_code": "R1",
        "status": "blocked",
        "reason": "bridge_failure"
    })
    assert r.status_code == 200
    r = requests.get(f"{BASE_URL}/recommendations/latest")
    fresh_rec = r.json()
    fresh_rec_id = fresh_rec["recommendation_id"]
    
    # Reject recommendation
    reject_payload = {
        "rejected_by": "District Collector & Chairman, DDMA Wayanad",
        "rejection_reason": "Road safety inspection team reports active rockfall near Vythiri corridor."
    }
    r = requests.post(f"{BASE_URL}/recommendations/{fresh_rec_id}/reject", json=reject_payload)
    assert r.status_code == 200, f"Reject failed: {r.text}"
    reject_resp = r.json()
    assert reject_resp.get("status") == "REJECTED"
    log(f"Recommendation rejected successfully: ID={fresh_rec_id}")
    
    # Verify RECOMMENDATION_REJECTED audit record
    r = requests.get(f"{BASE_URL}/audit")
    events = r.json().get("events", [])
    reject_audit = next((a for a in events if a.get("event_type") == "RECOMMENDATION_REJECTED"), None)
    assert reject_audit is not None, "RECOMMENDATION_REJECTED audit event not found!"
    log(f"Verified RECOMMENDATION_REJECTED audit record: seq={reject_audit.get('sequence_num')}, reason={reject_audit.get('payload', {}).get('reason')}")
    
    # Verify trying to approve a rejected recommendation fails
    r = requests.post(f"{BASE_URL}/recommendations/{fresh_rec_id}/approve", json={
        "approved_by": "Officer",
        "authority_role": "DDMA",
        "notes": "Attempting invalid approve"
    })
    assert r.status_code == 400, f"Expected 400 for approving rejected recommendation, got {r.status_code}"
    log(f"Verified protection: Cannot approve rejected recommendation (HTTP 400: {r.json().get('detail')})")
    
    # 5. Full Approval Flow -> Plan V2 creation
    print("\n--- Phase 6: Action: Approve Recommendation & Plan V2 Creation ---")
    # Reset and trigger incident for the official approval flow
    r = requests.post(f"{BASE_URL}/simulate/reset")
    assert r.status_code == 200
    r = requests.post(f"{BASE_URL}/simulate/route", json={
        "corridor_code": "R1",
        "status": "blocked",
        "reason": "bridge_failure"
    })
    assert r.status_code == 200
    r = requests.get(f"{BASE_URL}/recommendations/latest")
    final_rec = r.json()
    final_rec_id = final_rec["recommendation_id"]
    
    # Approve recommendation
    approve_payload = {
        "approved_by": "District Collector & Chairman, DDMA Wayanad",
        "authority_role": "District Disaster Management Authority",
        "notes": "Approved alternate corridor R4 to Vythiri GHSS under Disaster Management Act 2005"
    }
    r = requests.post(f"{BASE_URL}/recommendations/{final_rec_id}/approve", json=approve_payload)
    assert r.status_code == 200, f"Approve failed: {r.text}"
    approve_resp = r.json()
    log(f"Approval successful: new_plan_id={approve_resp.get('plan_v2', {}).get('id')}, plan_code={approve_resp.get('plan_v2', {}).get('plan_code')}")
    
    # Verify active plan is now Plan V2
    r = requests.get(f"{BASE_URL}/simulate/state")
    assert r.status_code == 200
    state = r.json()
    plan_v2 = state.get("active_plan", {})
    assert plan_v2.get("version") == 2 or "V2" in plan_v2.get("plan_code", ""), f"Expected Plan V2, got: {plan_v2}"
    log(f"Active plan is now Plan V2 ({plan_v2.get('plan_code')}, status={plan_v2.get('status')})")
    
    # Verify Plan V1 is preserved in historical plans
    r = requests.get(f"{BASE_URL}/plans")
    assert r.status_code == 200
    plans = r.json()
    v1_in_history = any("V1" in p.get("plan_code", "") for p in plans)
    v2_in_plans = any("V2" in p.get("plan_code", "") for p in plans)
    assert v1_in_history, "Plan V1 missing from plans history!"
    assert v2_in_plans, "Plan V2 missing from plans list!"
    log(f"Plan history verified: Plan V1 preserved and Plan V2 added (Total versions: {len(plans)})")
        
    # Verify assignments updated
    assignments = plan_v2.get("assignments", [])
    log(f"Plan V2 active assignments: {len(assignments)}")
    vythiri_assigned = [a for a in assignments if a.get("shelter_code") == "SH-GAMMA" or "Vythiri" in a.get("shelter", "")]
    assert len(vythiri_assigned) > 0, "No assignment to Vythiri GHSS found!"
    log(f"Reassigned evacuees: {vythiri_assigned[0].get('population')} people -> {vythiri_assigned[0].get('shelter')} via {vythiri_assigned[0].get('route')}")

    # 6. Idempotency & Double Click Protection
    print("\n--- Phase 7: Action: Double-Click / Duplicate Protection ---")
    r_dup = requests.post(f"{BASE_URL}/recommendations/{final_rec_id}/approve", json=approve_payload)
    assert r_dup.status_code == 200, f"Expected 200 with idempotent response, got {r_dup.status_code}"
    dup_resp = r_dup.json()
    log(f"Idempotent double-click approval response: {dup_resp.get('message')}")
    
    # Verify rejecting an already approved recommendation fails
    r_rej_approved = requests.post(f"{BASE_URL}/recommendations/{final_rec_id}/reject", json={
        "rejected_by": "Officer",
        "rejection_reason": "Late rejection attempt"
    })
    assert r_rej_approved.status_code == 400, f"Expected 400 for rejecting approved rec, got {r_rej_approved.status_code}"
    log(f"Protection: Cannot reject an already approved recommendation (HTTP 400: {r_rej_approved.json().get('detail')})")

    # 7. Audit Trail Integrity and SHA-256 Chain
    print("\n--- Phase 8: Cryptographic SHA-256 Audit Chain Verification ---")
    r = requests.get(f"{BASE_URL}/audit")
    assert r.status_code == 200
    audit_data = r.json()
    entries = audit_data.get("events", [])
    chain_valid = audit_data.get("chain_valid")
    log(f"Total audit records retrieved: {len(entries)}")
    log(f"Cryptographic SHA-256 chain verification: {audit_data.get('validation_message')}")
    assert chain_valid is True, f"Audit chain verification failed: {audit_data.get('validation_errors')}"
    
    for e in entries[-5:]:
        log(f"  Seq #{e.get('sequence_num')}: {e.get('event_type')} | hash={e.get('curr_hash')[:16]}... | actor={e.get('actor')}")
            
    print("\n=================================================================")
    print("ALL VERIFICATION SUITE CHECKS PASSED SUCCESSFULLY!")
    print("=================================================================")

if __name__ == "__main__":
    run_tests()
