import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, rider, vehicles, bookings, admin, content
from app.seed.seed_data import seed_database



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist & seed default data
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    # Shutdown logic if any


app = FastAPI(
    title="EVSMITH Mobility Services API",
    description="Enterprise-grade REST API for EV Scooter Rentals, KYC, Booking Lifecycle & Super Admin Operations.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For mobile development & Expo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
static_dir = os.path.join(backend_dir, "static")
upload_dir = os.path.join(static_dir, "uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Mount API Routers
app.include_router(auth.router)
app.include_router(rider.router)
app.include_router(vehicles.router)
app.include_router(bookings.router)
app.include_router(admin.router)
app.include_router(content.router)



@app.get("/", tags=["Health"])
def root():
    return {
        "platform": "EVSMITH Mobility Services",
        "tagline": "Power Your Journey. Ride Electric.",
        "version": "1.0.0",
        "status": "ONLINE",
        "docs_url": "/docs"
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy", "service": "evsmith-api"}
