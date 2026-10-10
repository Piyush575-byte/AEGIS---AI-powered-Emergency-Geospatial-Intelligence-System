import uuid
from sqlalchemy import Column, String, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geometry
from app.core.database import Base
from app.models.base import TimestampMixin

class Shelter(Base, TimestampMixin):
    __tablename__ = "shelters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False, index=True)
    total_capacity = Column(Integer, nullable=False)
    occupied_capacity = Column(Integer, nullable=False, default=0)
    medical_support = Column(Boolean, nullable=False, default=False)
    status = Column(String(50), nullable=False, default="active") # active, degraded_access, full, closed
    metadata_json = Column(JSONB, nullable=True)

    # Point geometry in WGS84 (SRID 4326)
    geom = Column(Geometry(geometry_type="POINT", srid=4326, spatial_index=True), nullable=False)

    @property
    def available_capacity(self) -> int:
        return max(0, self.total_capacity - self.occupied_capacity)

    def __repr__(self):
        return f"<Shelter {self.code} ({self.name}) cap={self.total_capacity} occ={self.occupied_capacity}>"
