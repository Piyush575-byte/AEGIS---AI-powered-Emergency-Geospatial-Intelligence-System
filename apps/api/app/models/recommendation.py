import uuid
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, get_utc_now

class Recommendation(Base, TimestampMixin):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("relocation_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="pending_human_approval", index=True) # pending_human_approval, approved, rejected
    
    affected_habitation_id = Column(UUID(as_uuid=True), ForeignKey("habitations.id", ondelete="RESTRICT"), nullable=False)
    affected_population = Column(Integer, nullable=False, default=0)
    
    recommended_shelter_id = Column(UUID(as_uuid=True), ForeignKey("shelters.id", ondelete="RESTRICT"), nullable=True)
    recommended_route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="RESTRICT"), nullable=True)
    
    summary = Column(Text, nullable=False)
    evaluations_json = Column(JSONB, nullable=False) # shelter constraint evaluations (Beta, Delta, Gamma, etc.)
    mcda_scores_json = Column(JSONB, nullable=False) # MCDA criteria weights, normalized values, rank
    route_details_json = Column(JSONB, nullable=True) # A* path, distance, waypoints

    # Relationships
    incident = relationship("Incident")
    plan = relationship("RelocationPlan")
    affected_habitation = relationship("Habitation", foreign_keys=[affected_habitation_id])
    recommended_shelter = relationship("Shelter", foreign_keys=[recommended_shelter_id])
    recommended_route = relationship("Route", foreign_keys=[recommended_route_id])

    def __repr__(self):
        return f"<Recommendation {self.id} for Incident={self.incident_id} (Status={self.status})>"
