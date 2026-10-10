import uuid
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, get_utc_now

class RelocationPlan(Base, TimestampMixin):
    __tablename__ = "relocation_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_code = Column(String(50), unique=True, nullable=False, index=True) # e.g. AEGIS-PLAN-WAYANAD-V1
    version = Column(Integer, nullable=False, default=1, index=True)
    status = Column(String(50), nullable=False, default="proposed", index=True) # proposed, approved, invalidated, superseded
    total_evacuees = Column(Integer, nullable=False, default=0)
    
    # Statutory authority boundary fields
    approved_by = Column(String(150), nullable=True) # e.g. "District Collector / Chairman, DDMA Wayanad"
    approved_at = Column(DateTime(timezone=True), nullable=True)
    invalidated_at = Column(DateTime(timezone=True), nullable=True)
    invalidation_reason = Column(Text, nullable=True)
    
    # Contextual evidence rationale, saturation, telemetry
    decision_context = Column(JSONB, nullable=True)

    # Relationships
    assignments = relationship("PlanAssignment", back_populates="plan", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<RelocationPlan {self.plan_code} v{self.version} status={self.status} evacuees={self.total_evacuees}>"


class PlanAssignment(Base, TimestampMixin):
    __tablename__ = "plan_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("relocation_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    habitation_id = Column(UUID(as_uuid=True), ForeignKey("habitations.id", ondelete="RESTRICT"), nullable=False, index=True)
    shelter_id = Column(UUID(as_uuid=True), ForeignKey("shelters.id", ondelete="RESTRICT"), nullable=False, index=True)
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    allocated_population = Column(Integer, nullable=False, default=0)
    priority_order = Column(Integer, nullable=False, default=1)
    status = Column(String(50), nullable=False, default="active", index=True) # active, at_risk, invalidated

    # Relationships
    plan = relationship("RelocationPlan", back_populates="assignments")
    habitation = relationship("Habitation")
    shelter = relationship("Shelter")
    route = relationship("Route")

    def __repr__(self):
        return f"<PlanAssignment plan={self.plan_id} hab={self.habitation_id} -> shelter={self.shelter_id} (pax={self.allocated_population})>"
