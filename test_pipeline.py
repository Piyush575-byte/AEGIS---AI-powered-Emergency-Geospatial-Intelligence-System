import json
import sys
import httpx

BASE_URL = "http://localhost:8000/api/v1"
ROOT_URL = "http://localhost:8000"

def log(msg, success=True):
    symbol = "[OK]" if success else "[FAIL]"
    print(f"{symbol} {msg}", flush=True)

def test_pipeline():
    print("=================================================================", flush=True)
    print("AEGIS OPERATIONAL ACTION & AUDIT VERIFICATION SUITE", flush=True)
    print("=================================================================\n", flush=True)
    
    with httpx.Client(timeout=60.0) as client:
        # Phase 1: Reset to baseline
        print("--- Phase 1: Reset Database to Clean Baseline ---", flush=True)
        r = client.post(f"{BASE_URL}/simulate/reset")
        assert r.status_code == 200, f"Reset failed: {r.text}"
        log("Reset baseline state successful")

        # Verify Plan V1 is active
        r = client.get(f"{BASE_URL}/simulate/state")
        assert r.status_code == 200
        state = r.json()
        assert state.get("active_plan", {}).get("version") == 1
        log("Baseline Plan V1 is active")

        # Phase 2: Trigger Route R1 Bridge Failure
        print("\n--- Phase 2: Simulate R1 Bridge Failure ---", flush=True)
        r = client.post(f"{BASE_URL}/simulate/route-block")
        assert r.status_code == 200, f"Route block failed: {r.text}"
        log("Simulated R1 bridge failure successfully")

        # Phase 3: Review Technical Evidence
        print("\n--- Phase 3: Inspect Recommendation & Technical Evidence ---", flush=True)
        r = client.get(f"{BASE_URL}/recommendations/latest")
        assert r.status_code == 200
        rec = r.json()
        rec_id = rec.get("recommendation_id")
        log(f"Active Recommendation Generated: ID={rec_id}")
        log(f"Evidence Summary: {rec.get('summary')}")
        log(f"Recommended Target Shelter: {rec.get('recommended_shelter', {}).get('name')}")
        log(f"Recommended Corridor: {rec.get('recommended_route', {}).get('code')}")
        assert rec.get("recommended_route", {}).get("code") == "R4"
        assert rec.get("affected_habitation", {}).get("population") == 120
        log(f"Affected Population: {rec.get('affected_habitation', {}).get('population')} evacuees")
        log(f"Evaluations & MCDA Ranking documented: {len(rec.get('evaluations', []))} alternatives evaluated")

        # Phase 4: Test Request Changes
        print("\n--- Phase 4: Action: REQUEST CHANGES ---", flush=True)
        payload_changes = {
            "requested_by": "District Collector & Chairman, DDMA Wayanad",
            "reason": "Verify alternate corridor clearance and fuel availability before approval."
        }
        r = client.post(f"{BASE_URL}/recommendations/{rec_id}/request-changes", json=payload_changes)
        assert r.status_code == 200, f"Request changes failed: {r.text}"
        res_changes = r.json()
        log(f"Request Changes Response: {res_changes.get('status')} - {res_changes.get('message')}")
        assert res_changes.get("status") == "CHANGES_REQUESTED"

        # Verify audit contains CHANGES_REQUESTED
        r = client.get(f"{BASE_URL}/audit")
        assert r.status_code == 200
        audit_data = r.json()
        events = audit_data.get("events", [])
        changes_event = next((e for e in events if e.get("event_type") == "CHANGES_REQUESTED"), None)
        assert changes_event is not None, "CHANGES_REQUESTED missing from audit!"
        log(f"Audit verified CHANGES_REQUESTED: seq={changes_event.get('sequence_num')}, hash={changes_event.get('curr_hash')[:16]}...")
        assert audit_data.get("chain_valid") is True, "Audit chain broken after CHANGES_REQUESTED"
        log("Cryptographic SHA-256 chain is VALID after CHANGES_REQUESTED")

        # Verify Plan V1 is still active (Plan V2 not created)
        r = client.get(f"{BASE_URL}/simulate/state")
        state = r.json()
        assert state.get("active_plan", {}).get("version") == 1
        log("Verified Plan V1 remains intact (Plan V2 not created on request changes)")

        # Phase 5: Test Reject Flow on a separate incident cycle
        print("\n--- Phase 5: Action: REJECT RECOMMENDATION ---", flush=True)
        # Reset and re-block to test rejection on a fresh recommendation
        client.post(f"{BASE_URL}/simulate/reset")
        client.post(f"{BASE_URL}/simulate/route-block")
        r = client.get(f"{BASE_URL}/recommendations/latest")
        fresh_rec = r.json()
        fresh_rec_id = fresh_rec.get("recommendation_id")

        payload_reject = {
            "rejected_by": "District Collector & Chairman, DDMA Wayanad",
            "rejection_reason": "Road safety inspection team reports active rockfall near Vythiri corridor."
        }
        r = client.post(f"{BASE_URL}/recommendations/{fresh_rec_id}/reject", json=payload_reject)
        assert r.status_code == 200, f"Reject failed: {r.text}"
        res_reject = r.json()
        log(f"Reject Response: {res_reject.get('status')} - {res_reject.get('message')}")
        assert res_reject.get("status") == "REJECTED"

        # Verify audit contains RECOMMENDATION_REJECTED
        r = client.get(f"{BASE_URL}/audit")
        events = r.json().get("events", [])
        reject_event = next((e for e in events if e.get("event_type") == "RECOMMENDATION_REJECTED"), None)
        assert reject_event is not None, "RECOMMENDATION_REJECTED missing from audit!"
        log(f"Audit verified RECOMMENDATION_REJECTED: seq={reject_event.get('sequence_num')}, hash={reject_event.get('curr_hash')[:16]}...")
        assert r.json().get("chain_valid") is True, "Audit chain broken after RECOMMENDATION_REJECTED"
        log("Cryptographic SHA-256 chain is VALID after RECOMMENDATION_REJECTED")

        # Verify rejected recommendation CANNOT be approved (HTTP 400)
        r = client.post(f"{BASE_URL}/recommendations/{fresh_rec_id}/approve", json={
            "approved_by": "Officer",
            "authority_role": "DDMA",
            "notes": "Attempting invalid approve"
        })
        assert r.status_code == 400, f"Expected 400 for approving rejected rec, got {r.status_code}"
        log(f"Verified protection: Cannot approve rejected recommendation (detail: {r.json().get('detail')})")

        # Phase 6: Approve Recommendation -> Commit Plan V2
        print("\n--- Phase 6: Action: APPROVE RECOMMENDATION (COMMIT PLAN V2) ---", flush=True)
        # Reset and re-block for official approval test
        client.post(f"{BASE_URL}/simulate/reset")
        client.post(f"{BASE_URL}/simulate/route-block")
        r = client.get(f"{BASE_URL}/recommendations/latest")
        actionable_rec = r.json()
        actionable_rec_id = actionable_rec.get("recommendation_id")

        payload_approve = {
            "approved_by": "District Collector & Chairman, DDMA Wayanad",
            "authority_role": "District Disaster Management Authority",
            "notes": "Statutory concurrence granted following Route R1 bridge failure. Plan V2 executed."
        }
        r = client.post(f"{BASE_URL}/recommendations/{actionable_rec_id}/approve", json=payload_approve)
        assert r.status_code == 200, f"Approve failed: {r.text}"
        res_approve = r.json()
        log(f"Approval Response: {res_approve.get('message')}")
        assert res_approve.get("status") == "SUCCESS"
        plan_v2 = res_approve.get("plan_v2", {})
        assert plan_v2.get("version") == 2
        assert plan_v2.get("plan_code") == "AEGIS-PLAN-WAYANAD-V2"
        log(f"Plan V2 committed: code={plan_v2.get('plan_code')}, evacuees={plan_v2.get('assignment', {}).get('population')}")
        log(f"Reassigned to: {plan_v2.get('assignment', {}).get('shelter')} via {plan_v2.get('assignment', {}).get('route')}")

        # Verify Plan V1 is preserved in historical list
        r = client.get(f"{BASE_URL}/plans")
        assert r.status_code == 200
        plans = r.json()
        v1 = next((p for p in plans if p.get("version") == 1), None)
        v2 = next((p for p in plans if p.get("version") == 2), None)
        assert v1 is not None, "Plan V1 missing from plans!"
        assert v2 is not None, "Plan V2 missing from plans!"
        log(f"Plan history: V1 status={v1.get('status')}, V2 status={v2.get('status')}")
        assert v1.get("status") == "invalidated", "Plan V1 was not marked invalidated!"
        assert v2.get("status") == "approved", "Plan V2 was not marked approved!"

        # Phase 7: Double-Click / Idempotency Protection
        print("\n--- Phase 7: Action: DOUBLE-CLICK / IDEMPOTENCY PROTECTION ---", flush=True)
        r = client.post(f"{BASE_URL}/recommendations/{actionable_rec_id}/approve", json=payload_approve)
        assert r.status_code == 200
        dup_res = r.json()
        log(f"Duplicate approval handled gracefully: {dup_res.get('message')}")
        assert dup_res.get("plan_code") == "AEGIS-PLAN-WAYANAD-V2"

        # Cannot reject an approved recommendation
        r = client.post(f"{BASE_URL}/recommendations/{actionable_rec_id}/reject", json=payload_reject)
        assert r.status_code == 400
        log(f"Protection: Cannot reject approved recommendation (detail: {r.json().get('detail')})")

        # Phase 8: Cryptographic Audit Lineage Verification
        print("\n--- Phase 8: Cryptographic Audit Trail Verification ---", flush=True)
        r = client.get(f"{BASE_URL}/audit")
        assert r.status_code == 200
        audit_data = r.json()
        assert audit_data.get("chain_valid") is True, f"Audit chain invalid: {audit_data.get('validation_errors')}"
        events = audit_data.get("events", [])
        log(f"Cryptographic SHA-256 ledger integrity verified! Total audited blocks: {len(events)}")
        for e in events[-6:]:
            log(f"  Seq #{e.get('sequence_num')}: {e.get('event_type')} | Actor={e.get('actor')} | hash={e.get('curr_hash')[:16]}...")

    print("\n=================================================================", flush=True)
    print("ALL AEGIS OPERATIONAL ACTIONS & AUDIT INTEGRATIONS VERIFIED 100%")
    print("=================================================================", flush=True)

if __name__ == "__main__":
    test_pipeline()
