from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from app.core.config import settings
from app.api.v1.api import api_router

from app.core.ws import manager


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep-alive heartbeat listener
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "system": "AEGIS — Adaptive Emergency Geospatial Intelligence System",
        "phase": 3,
        "environment": settings.ENVIRONMENT,
        "websocket_active": len(manager.active_connections)
    }

@app.get(f"{settings.API_V1_STR}/info")
def get_system_info():
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0-phase3",
        "decision_boundary": "Advisory only — statutory authority rests with DDMA / Human Authority",
        "scenario": "Wayanad, Kerala (Chooralmala — Meppadi Corridor)"
    }
