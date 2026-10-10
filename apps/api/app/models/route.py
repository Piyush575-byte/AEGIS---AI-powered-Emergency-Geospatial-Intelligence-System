import uuid
from sqlalchemy import Column, String, Float, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geometry
from app.core.database import Base
from app.models.base import TimestampMixin

class Route(Base, TimestampMixin):
    __tablename__ = "routes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False, index=True) # e.g. R1, R2, R3, R4
    name = Column(String(150), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="clear") # clear, blocked, degraded
    distance_km = Column(Float, nullable=False, default=0.0)
    capacity_pax_hour = Column(Integer, nullable=False, default=200)
    metadata_json = Column(JSONB, nullable=True)

    # LineString geometry in WGS84 (SRID 4326)
    geom = Column(Geometry(geometry_type="LINESTRING", srid=4326, spatial_index=True), nullable=False)

    def __repr__(self):
        return f"<Route {self.code} ({self.name}) status={self.status}>"
