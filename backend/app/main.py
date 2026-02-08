"""
Main FastAPI application entry point.
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import data_router, playback_router
from .api.news import router as news_router
from .api.stock_search import router as stock_search_router
from .api.trading import router as trading_router
from .config import settings

# Setup logging
logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API for LLM Stock Trader Trainer",
    debug=settings.debug,
)

# Setup CORS
cors_origins = list(settings.cors_origins)
if settings.cors_extra_origin:
    cors_origins.append(settings.cors_extra_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(data_router)
app.include_router(playback_router)
app.include_router(trading_router)
app.include_router(news_router)
app.include_router(stock_search_router)


@app.get("/")
async def root() -> dict:
    """Root endpoint."""
    return {
        "message": "LLM Stock Trader Trainer API",
        "version": settings.app_version,
        "status": "running",
    }


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
