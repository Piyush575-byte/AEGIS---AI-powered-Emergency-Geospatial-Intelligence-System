import uuid
from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.core.database import Base
from app.models.base import TimestampMixin, get_utc_now

class Incident(Base, TimestampMixin):
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_type = Column(String(50), nullable=False) # bridge_failure, road_block, debris_flow
    description = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="active") # active, investigating, cleared
    severity = Column(String(50), nullable=False, default="critical") # critical, major, minor
    
    # Nullable foreign key linking to a route if a route corridor is severed
    affected_route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="SET NULL"), nullable=True, index=True)
    raw_payload = Column(JSONB, nullable=True)
    
    # Point or Polygon geometry of the incident
    geom = Column(Geometry(geometry_type="GEOMETRY", srid=4326, spatial_index=True), nullable=True)
    reported_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)

    # Relationships
    affected_route = relationship("Route", foreign_keys=[affected_route_id])

    def __repr__(self):
        return f"<Incident {self.incident_type} status={self.status} severity={self.severity}>"
