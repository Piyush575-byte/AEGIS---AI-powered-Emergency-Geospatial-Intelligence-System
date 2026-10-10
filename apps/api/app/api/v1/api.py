from fastapi import APIRouter

from app.api.v1.endpoints import (
    incidents,
    simulation,
    plans,
    shelters,
    routes,
    recommendations,
    audit,
    geodata,
)

api_router = APIRouter()

api_router.include_router(incidents.router, prefix="/incidents", tags=["Incidents"])
api_router.include_router(simulation.router, prefix="/simulate", tags=["Simulation"])
api_router.include_router(plans.router, tags=["Plans & Assignments"])
api_router.include_router(shelters.router, prefix="/shelters", tags=["Shelters"])
api_router.include_router(routes.router, prefix="/routes", tags=["Routes"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit Ledger"])
api_router.include_router(geodata.router, prefix="/geodata", tags=["Geospatial Data"])

