import sys
import os
from pathlib import Path

# Add src directory to Python path
sys.path.append(str(Path(__file__).parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import prediksi, admin, auth
from config.settings import settings
from config.connection import test_connection
import logging

# Setup logging
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL.upper()))
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="RelaxaID API - Sistem Prediksi Stres Digital",
    description="API untuk prediksi tingkat stres berdasarkan aktivitas digital menggunakan Random Forest",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include routers
app.include_router(prediksi.router, prefix="/prediksi")  # Prefix untuk endpoints prediksi
app.include_router(admin.router, prefix="/admin")       # Prefix untuk endpoints admin
app.include_router(auth.router, prefix="/auth")         # Prefix untuk endpoints auth

# Health check endpoint
@app.get("/")
def health_check():
    return {
        "message": "RelaxaID API aktif dan berjalan!",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
def detailed_health_check():
    """Detailed health check including database connectivity"""
    db_status = test_connection()
    return {
        "api": "healthy",
        "database": "connected" if db_status else "disconnected",
        "version": "1.0.0"
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting RelaxaID API...")
    logger.info(f"API Host: {settings.API_HOST}:{settings.API_PORT}")
    logger.info(f"Debug Mode: {settings.DEBUG}")
    
    # Test database connection
    if test_connection():
        logger.info("Database connection successful")
    else:
        logger.warning("Database connection failed - check your configuration")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD,
        log_level=settings.LOG_LEVEL
    )
