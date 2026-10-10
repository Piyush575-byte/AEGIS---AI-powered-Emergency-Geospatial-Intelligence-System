import uuid
from sqlalchemy import Column, String, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geometry
from app.core.database import Base
from app.models.base import TimestampMixin

class Habitation(Base, TimestampMixin):
    __tablename__ = "habitations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False, index=True)
    population = Column(Integer, nullable=False, default=0)
    households = Column(Integer, nullable=False, default=0)
    risk_level = Column(String(50), nullable=False, default="safe") # critical, high, warning, safe
    metadata_json = Column(JSONB, nullable=True)
    
    # Point geometry in WGS84 (SRID 4326)
    geom = Column(Geometry(geometry_type="POINT", srid=4326, spatial_index=True), nullable=False)

    def __repr__(self):
        return f"<Habitation {self.code} ({self.name}) pop={self.population}>"
