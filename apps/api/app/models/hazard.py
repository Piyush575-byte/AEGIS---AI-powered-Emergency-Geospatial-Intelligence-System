import uuid
from sqlalchemy import Column, String, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geometry
from app.core.database import Base
from app.models.base import TimestampMixin

class HazardZone(Base, TimestampMixin):
    __tablename__ = "hazard_zones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    hazard_type = Column(String(50), nullable=False) # landslide, flood, flash_flood
    severity = Column(String(50), nullable=False, default="high") # critical, high, medium, low
    rainfall_24h_mm = Column(Float, nullable=False, default=0.0)
    slope_saturation_pct = Column(Float, nullable=False, default=0.0)
    metadata_json = Column(JSONB, nullable=True)

    # Polygon geometry in WGS84 (SRID 4326)
    geom = Column(Geometry(geometry_type="POLYGON", srid=4326, spatial_index=True), nullable=False)

    def __repr__(self):
        return f"<HazardZone {self.code} ({self.hazard_type}:{self.severity})>"
