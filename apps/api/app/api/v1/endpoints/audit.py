from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import AuditLedger

router = APIRouter()

@router.get("")
def get_audit_trail(db: Session = Depends(get_db)):
    """
    Part 8: Forensic Audit Trail
    Returns chronological decision ledger and validates SHA-256 cryptographic chain integrity.
    """
    events = db.query(AuditLedger).order_by(AuditLedger.sequence_num.asc()).all()

    chain_valid = True
    validation_notes = []
    prev_hash = None

    for idx, ev in enumerate(events):
        # 1. Verify previous hash linkage
        if ev.prev_hash != prev_hash:
            chain_valid = False
            validation_notes.append(f"Broken link at block #{ev.sequence_num}: prev_hash does not match preceding curr_hash.")

        # 2. Recompute and verify current hash
        expected_hash = AuditLedger.compute_hash(
            sequence_num=ev.sequence_num,
            event_type=ev.event_type,
            actor=ev.actor,
            prev_hash=ev.prev_hash,
            payload=ev.payload
        )
        if expected_hash != ev.curr_hash:
            chain_valid = False
            validation_notes.append(f"Cryptographic tampering detected at block #{ev.sequence_num}: stored hash does not match computed hash.")

        prev_hash = ev.curr_hash

    return {
        "chain_valid": chain_valid,
        "total_events": len(events),
        "validation_message": "Cryptographic SHA-256 ledger integrity verified. All causal blocks intact." if chain_valid else "Chain verification failed.",
        "tamper_detected": not chain_valid,
        "validation_errors": validation_notes,
        "events": [
            {
                "id": str(e.id),
                "sequence_num": e.sequence_num,
                "event_type": e.event_type,
                "actor": e.actor,
                "prev_hash": e.prev_hash,
                "curr_hash": e.curr_hash,
                "payload": e.payload,
                "timestamp": e.timestamp.isoformat()
            }
            for e in events
        ]
    }

@router.get("/verify")
def verify_audit_trail(db: Session = Depends(get_db)):
    res = get_audit_trail(db)
    return {
        "is_valid": res["chain_valid"],
        "total_entries": res["total_events"],
        "message": res["validation_message"],
        "errors": res["validation_errors"]
    }
