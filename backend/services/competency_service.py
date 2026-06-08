from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List

from models.competency import Competency, EmployeeCompetency
from models.employee import Employee
from schemas.competency import CompetencyCreate, CompetencyAssign


def get_all_competencies(db: Session) -> List[Competency]:
    return db.query(Competency).order_by(Competency.id).all()


def create_competency(db: Session, payload: CompetencyCreate) -> Competency:
    if db.query(Competency).filter(Competency.name == payload.name).first():
        raise HTTPException(status_code=400, detail="Competency already exists")
    c = Competency(name=payload.name, category=payload.category)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def assign_competencies(db: Session, payload: CompetencyAssign) -> List[dict]:
    if not db.query(Employee).filter(Employee.emp_id == payload.emp_id).first():
        raise HTTPException(status_code=404, detail="Employee not found")

    added = []
    for comp_id in payload.competency_ids:
        comp = db.query(Competency).filter(Competency.id == comp_id).first()
        if not comp:
            raise HTTPException(status_code=404, detail=f"Competency {comp_id} not found")

        already = (
            db.query(EmployeeCompetency)
            .filter(
                EmployeeCompetency.emp_id == payload.emp_id,
                EmployeeCompetency.competency_id == comp_id,
            )
            .first()
        )
        if not already:
            ec = EmployeeCompetency(emp_id=payload.emp_id, competency_id=comp_id)
            db.add(ec)
            added.append({"comp": comp, "ec": ec})

    db.commit()

    result = []
    for item in added:
        db.refresh(item["ec"])
        result.append({
            "id": item["ec"].id,
            "emp_id": item["ec"].emp_id,
            "competency_id": item["ec"].competency_id,
            "competency_name": item["comp"].name,
        })
    return result


def get_employee_competencies(db: Session, emp_id: int) -> List[dict]:
    ecs = (
        db.query(EmployeeCompetency)
        .filter(EmployeeCompetency.emp_id == emp_id)
        .all()
    )
    result = []
    for ec in ecs:
        comp = db.query(Competency).filter(Competency.id == ec.competency_id).first()
        result.append({
            "id": ec.id,
            "emp_id": ec.emp_id,
            "competency_id": ec.competency_id,
            "competency_name": comp.name if comp else "Unknown",
        })
    return result


def remove_competency(db: Session, emp_id: int, competency_id: int) -> None:
    ec = (
        db.query(EmployeeCompetency)
        .filter(
            EmployeeCompetency.emp_id == emp_id,
            EmployeeCompetency.competency_id == competency_id,
        )
        .first()
    )
    if not ec:
        raise HTTPException(status_code=404, detail="Competency assignment not found")
    db.delete(ec)
    db.commit()
