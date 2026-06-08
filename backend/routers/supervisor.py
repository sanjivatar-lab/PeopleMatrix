from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from schemas.supervisor import SupervisorAssign
from services import supervisor_service

router = APIRouter()


@router.post("/assign")
def assign_supervisor(payload: SupervisorAssign, db: Session = Depends(get_db)):
    return supervisor_service.assign_supervisor(db, payload)


@router.get("/team/{supervisor_emp_id}")
def get_team(supervisor_emp_id: int, db: Session = Depends(get_db)):
    return supervisor_service.get_team(db, supervisor_emp_id)


@router.get("/{emp_id}")
def get_history(emp_id: int, db: Session = Depends(get_db)):
    return supervisor_service.get_history(db, emp_id)
