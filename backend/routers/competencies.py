from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from schemas.competency import CompetencyCreate, CompetencyOut, CompetencyAssign
from services import competency_service

router = APIRouter()


@router.get("/", response_model=List[CompetencyOut])
def get_competencies(db: Session = Depends(get_db)):
    return competency_service.get_all_competencies(db)


@router.post("/", response_model=CompetencyOut, status_code=201)
def create_competency(payload: CompetencyCreate, db: Session = Depends(get_db)):
    return competency_service.create_competency(db, payload)


@router.post("/assign")
def assign_competencies(payload: CompetencyAssign, db: Session = Depends(get_db)):
    return competency_service.assign_competencies(db, payload)


@router.get("/{emp_id}")
def get_employee_competencies(emp_id: int, db: Session = Depends(get_db)):
    return competency_service.get_employee_competencies(db, emp_id)


@router.delete("/{emp_id}/{competency_id}", status_code=204)
def remove_competency(emp_id: int, competency_id: int, db: Session = Depends(get_db)):
    competency_service.remove_competency(db, emp_id, competency_id)
