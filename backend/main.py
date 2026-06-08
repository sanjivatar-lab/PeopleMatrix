from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.database import engine, SessionLocal, Base
import models  # registers all ORM models

from routers import employees, roles, supervisor, competencies, upload, work_packages, reports
from models.role import Role
from models.competency import Competency


def _seed(db):
    default_roles = ["Platform Owner", "Supervisor", "Team Member"]
    for name in default_roles:
        if not db.query(Role).filter(Role.name == name).first():
            db.add(Role(name=name))

    default_competencies = [
        ("Frontend - Angular", "Frontend"),
        ("Frontend - ReactJs", "Frontend"),
        ("Backend - Python", "Backend"),
        ("Backend - Java", "Backend"),
        ("Backend - Node.js", "Backend"),
        ("UX", "Design"),
        ("Generative AI", "AI"),
        ("Agentic AI", "AI"),
        ("DevOps", "Infrastructure"),
        ("Database - SQL", "Database"),
    ]
    for name, category in default_competencies:
        if not db.query(Competency).filter(Competency.name == name).first():
            db.add(Competency(name=name, category=category))

    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _seed(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="PeopleMatrix API",
    version="2.0.0",
    description="PeopleMatrix — employees, roles, supervisors, competencies",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employees.router, prefix="/employees", tags=["Employees"])
app.include_router(upload.router, prefix="/employees", tags=["Bulk Upload"])
app.include_router(roles.router, prefix="/roles", tags=["Roles"])
app.include_router(supervisor.router, prefix="/supervisor", tags=["Supervisor"])
app.include_router(competencies.router, prefix="/competencies", tags=["Competencies"])
app.include_router(work_packages.router, prefix="/work-packages", tags=["Work Packages"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])


@app.get("/", tags=["Health"])
def root():
    return {"message": "PeopleMatrix API v2.0", "docs": "/docs"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
