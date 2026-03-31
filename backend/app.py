"""FastAPI server — login + timetable generation endpoints."""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from scheduler import cleanup_workdir, run_scheduling

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
load_dotenv()

ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")
SECRET_KEY: str = os.getenv("SECRET_KEY", "fallback-insecure-key")
ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 24

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Timetable Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str


def _create_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS)
    return jwt.encode({"sub": username, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def _verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Dependency that extracts and validates the JWT from the Authorization header."""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/login", response_model=LoginResponse)
def login(body: LoginRequest):
    if body.username != ADMIN_USERNAME or body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return LoginResponse(token=_create_token(body.username))


@app.post("/api/generate")
def generate_timetable(
    courses: UploadFile = File(...),
    rooms: UploadFile = File(...),
    _user: str = Depends(_verify_token),
):
    """Accept two .xlsx uploads, run the scheduler, return a zip of outputs."""
    # Basic file-type check
    for f in (courses, rooms):
        if not f.filename or not f.filename.endswith(".xlsx"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Expected .xlsx file, got '{f.filename}'",
            )

    try:
        courses_bytes = courses.file.read()
        rooms_bytes = rooms.file.read()
        zip_path = run_scheduling(courses_bytes, rooms_bytes)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scheduling failed: {exc}",
        )

    return FileResponse(
        path=str(zip_path),
        media_type="application/zip",
        filename="timetables.zip",
        background=lambda: cleanup_workdir(zip_path),
    )
