import os
import sys
import uuid
from sqlalchemy.orm import Session

# Add current path
sys.path.insert(0, os.path.abspath("."))
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from app.core.database import SessionLocal
from app.models import Route, RelocationPlan, PlanAssignment, Recommendation, AuditLedger, Shelter
from app.seed import run_seed
from app.services.decision_engine import run_decision_cycle

def test_phase2_decision_engine():
    print("=" * 65)
    print("AEGIS PHASE 2 DECISION ENGINE & SCENARIO VERIFICATION")
    print("=" * 65)

    # 1. Reset database to clean Plan V1 baseline
    print("\n[STEP 1] Re-initializing seed state (Plan V1 baseline)...")
    run_seed()

    db: Session = SessionLocal()
    errors = []

    try:
        # 2. Verify Baseline Plan V1
        print("\n[STEP 2] Verifying Baseline Plan V1 State...")
        plan_v1 = db.query(RelocationPlan).filter_by(plan_code="AEGIS-PLAN-WAYANAD-V1").first()
        assert plan_v1 is not None, "Plan V1 must exist"
        assignment = db.query(PlanAssignment).filter_by(plan_id=plan_v1.id).first()
        assert assignment is not None, "Plan V1 assignment must exist"
        print(f"  ✓ Plan V1 Active: {plan_v1.plan_code} (Status: {plan_v1.status})")
        print(f"  ✓ Initial Assignment: {assignment.habitation.name} -> {assignment.shelter.name} via {assignment.route.code}")
        print(f"  ✓ Initial Assignment Status: {assignment.status} (Allocated: {assignment.allocated_population} pax)")

        # Verify initial route R1 is clear
        r1_init = db.query(Route).filter_by(code="R1").first()
        assert r1_init.status == "clear", "Route R1 must initially be clear"
        print(f"  ✓ Initial Route R1 Status: {r1_init.status}")

        # 3. Trigger Core Incident / Simulation
        print("\n[STEP 3] Triggering Route R1 Block Incident (Bridge Failure KM 4.2)...")
        incident_description = "CRITICAL FIELD REPORT: Heavy landslide debris washed out bridge on Route R1 at KM 4.2. Passage completely cut off."
        
        result = run_decision_cycle(
            db=db,
            incident_type="bridge_failure",
            description=incident_description,
            corridor_code="R1",
            plan_id=plan_v1.id
        )

        print("  ✓ Decision Engine Cycle executed successfully.")

        # 4. Verify Route R1 Status
        print("\n[STEP 4] Verifying Route R1 Status in Database...")
        db.refresh(r1_init)
        if r1_init.status == "blocked":
            print("  ✓ Verification PASSED: Route R1 status is now 'blocked'.")
        else:
            msg = f"Expected R1 status 'blocked', got '{r1_init.status}'"
            print(f"  ✗ {msg}")
            errors.append(msg)

        # 5. Verify Affected Assignment Detection & Population Count
        print("\n[STEP 5] Verifying Affected Assignment & Affected Population Count...")
        db.refresh(assignment)
        if assignment.status == "invalidated":
            print(f"  ✓ Verification PASSED: Assignment status updated to '{assignment.status}'.")
        else:
            msg = f"Expected assignment status 'invalidated', got '{assignment.status}'"
            print(f"  ✗ {msg}")
            errors.append(msg)

        affected_pax = result["affected"]["affected_population"]
        if affected_pax == 120:
            print(f"  ✓ Verification PASSED: Exactly {affected_pax} affected evacuees identified from Chooralmala.")
        else:
            msg = f"Expected exactly 120 affected evacuees, got {affected_pax}"
            print(f"  ✗ {msg}")
            errors.append(msg)

        # 6. Verify Constraint Filtering on Shelters
        print("\n[STEP 6] Verifying Constraint Filtering on Shelters...")
        shelter_evals = {e["code"]: e for e in result["recommendation"]["shelter_evaluations"]}
        
        # Check Beta (Capacity failure: 60 < 120)
        beta_eval = shelter_evals.get("SH-BETA")
        if beta_eval and not beta_eval["is_feasible"] and "Insufficient capacity" in (beta_eval["rejection_reason"] or ""):
            print(f"  ✓ Verification PASSED: Shelter Beta (SH-BETA) rejected due to insufficient capacity.")
            print(f"    - Reason: {beta_eval['rejection_reason']}")
        else:
            msg = f"Shelter Beta constraint check failed: {beta_eval}"
            print(f"  ✗ {msg}")
            errors.append(msg)

        # Check Delta (Access degraded)
        delta_eval = shelter_evals.get("SH-DELTA")
        if delta_eval and not delta_eval["is_feasible"] and "Operational constraint" in (delta_eval["rejection_reason"] or ""):
            print(f"  ✓ Verification PASSED: Shelter Delta (SH-DELTA) rejected due to degraded access track.")
            print(f"    - Reason: {delta_eval['rejection_reason']}")
        else:
            msg = f"Shelter Delta constraint check failed: {delta_eval}"
            print(f"  ✗ {msg}")
            errors.append(msg)

        # Check Alpha (Severed origin destination)
        alpha_eval = shelter_evals.get("SH-ALPHA")
        if alpha_eval and not alpha_eval["is_feasible"] and "severed" in (alpha_eval["rejection_reason"] or "").lower():
            print(f"  ✓ Verification PASSED: Shelter Alpha (SH-ALPHA) rejected because direct route R1 is severed.")
            print(f"    - Reason: {alpha_eval['rejection_reason']}")
        else:
            msg = f"Shelter Alpha constraint check failed: {alpha_eval}"
            print(f"  ✗ {msg}")
            errors.append(msg)

        # Check Gamma (Feasible)
        gamma_eval = shelter_evals.get("SH-GAMMA")
        if gamma_eval and gamma_eval["is_feasible"]:
            print(f"  ✓ Verification PASSED: Shelter Gamma (SH-GAMMA / Vythiri GHSS) is FEASIBLE.")
            print(f"    - Available Capacity: {gamma_eval['available_capacity']} beds (Headroom: +{gamma_eval['headroom_pax']} beds)")
            print(f"    - Medical Support: {gamma_eval['medical_support']}")
        else:
            msg = f"Shelter Gamma constraint check failed: {gamma_eval}"
            print(f"  ✗ {msg}")
            errors.append(msg)

        # 7. Verify A* Routing
        print("\n[STEP 7] Verifying Deterministic A* Route Feasibility...")
        route_details = result["recommendation"]["route_details"]
        if route_details and route_details["primary_route_code"] == "R4" and route_details["is_reachable"]:
            print(f"  ✓ Verification PASSED: A* selected resilient bypass corridor R4 ({route_details['total_distance_km']} km).")
            print(f"    - Path nodes: {' -> '.join(route_details['path_nodes'])}")
        else:
            msg = f"A* routing failed to select R4: {route_details}"
            print(f"  ✗ {msg}")
            errors.append(msg)

        # 8. Verify Weighted MCDA Ranking
        print("\n[STEP 8] Verifying Weighted MCDA Score Breakdown...")
        mcda_ranks = result["recommendation"]["mcda_ranking"]
        rank1 = next((m for m in mcda_ranks if m["rank"] == 1), None)
        
        if rank1 and rank1["shelter_code"] == "SH-GAMMA":
            print(f"  ✓ Verification PASSED: Vythiri GHSS (SH-GAMMA) ranked #1 in MCDA.")
            print(f"    - Composite Score: {rank1['score_breakdown']['composite_score']}")
            print(f"    - Distance Score (35%): {rank1['score_breakdown']['distance_score_35pct']}")
            print(f"    - Headroom Score (30%): {rank1['score_breakdown']['headroom_score_30pct']}")
            print(f"    - Route Safety (20%): {rank1['score_breakdown']['route_safety_score_20pct']}")
            print(f"    - Medical Support (15%): {rank1['score_breakdown']['medical_support_score_15pct']}")
            print(f"    - Rationale: {rank1['rationale']}")
        else:
            msg = f"MCDA Rank 1 mismatch: expected SH-GAMMA, got {rank1}"
            print(f"  ✗ {msg}")
            errors.append(msg)

        # 9. Verify Recommendation Persisted with Correct Guardrails
        print("\n[STEP 9] Verifying Recommendation Persistence & Human Approval Boundary...")
        rec_id = uuid.UUID(result["recommendation_id"])
        rec_db = db.query(Recommendation).filter_by(id=rec_id).first()
        
        if rec_db:
            print(f"  ✓ Stored Recommendation Found in DB: {rec_db.id}")
            print(f"    - Target Habitation: {rec_db.affected_habitation.name} ({rec_db.affected_population} pax)")
            print(f"    - Recommended Shelter: {rec_db.recommended_shelter.name}")
            print(f"    - Recommended Route: {rec_db.recommended_route.code}")
            
            # Guardrail Check: Must NOT be automatically approved
            if rec_db.status == "pending_human_approval":
                print(f"  ✓ Verification PASSED: Status is '{rec_db.status}' (Human approval boundary preserved).")
            else:
                msg = f"Guardrail breach! Status is '{rec_db.status}', should be 'pending_human_approval'"
                print(f"  ✗ {msg}")
                errors.append(msg)
        else:
            msg = "Recommendation not found in database!"
            print(f"  ✗ {msg}")
            errors.append(msg)

        # 10. Verify Audit Trail Linked Event
        print("\n[STEP 10] Verifying Audit Trail Chain...")
        audit_events = db.query(AuditLedger).order_by(AuditLedger.sequence_num.asc()).all()
        print(f"  ✓ Audit ledger contains {len(audit_events)} cryptographically linked events:")
        for ev in audit_events:
            print(f"    - #{ev.sequence_num} [{ev.event_type}] Actor: {ev.actor} | Hash: {ev.curr_hash[:16]}...")
        
        # Verify sequence #2 links to sequence #1
        if len(audit_events) >= 2:
            assert audit_events[1].prev_hash == audit_events[0].curr_hash, "Hash chain link must match!"
            print("  ✓ Verification PASSED: Event #2 previous_hash matches Event #1 current_hash.")

        print("\n" + "=" * 65)
        if errors:
            print(f"❌ PHASE 2 VERIFICATION FAILED WITH {len(errors)} ERRORS:")
            for err in errors:
                print(f"   - {err}")
            return False
        else:
            print("🎉 ALL PHASE 2 VERIFICATION CHECKS PASSED WITH ZERO ERRORS!")
            print("=" * 65)
            return True

    except Exception as e:
        print(f"❌ Exception during Phase 2 verification: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_phase2_decision_engine()
    sys.exit(0 if success else 1)
