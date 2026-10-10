import uuid
import hashlib
import json
from sqlalchemy import Column, String, BigInteger, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base
from app.models.base import get_utc_now

class AuditLedger(Base):
    __tablename__ = "audit_ledger"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sequence_num = Column(BigInteger, unique=True, nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True) # e.g. GENESIS, PLAN_APPROVED, INCIDENT_DETECTED, PLAN_INVALIDATED
    actor = Column(String(150), nullable=False) # e.g. "AEGIS System", "District Collector Wayanad"
    prev_hash = Column(String(64), nullable=True) # SHA-256 of preceding block (null for genesis)
    curr_hash = Column(String(64), nullable=False, index=True) # SHA-256 hash of (sequence_num + event_type + actor + prev_hash + payload)
    payload = Column(JSONB, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)

    @staticmethod
    def compute_hash(sequence_num: int, event_type: str, actor: str, prev_hash: str | None, payload: dict) -> str:
        serialized_payload = json.dumps(payload, sort_keys=True, default=str)
        raw_string = f"{sequence_num}|{event_type}|{actor}|{prev_hash or ''}|{serialized_payload}"
        return hashlib.sha256(raw_string.encode("utf-8")).hexdigest()

    def __repr__(self):
        return f"<AuditLedger #{self.sequence_num} event={self.event_type} hash={self.curr_hash[:8]}...>"
