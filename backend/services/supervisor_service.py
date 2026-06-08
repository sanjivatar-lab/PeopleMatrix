from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import date
from typing import List

from models.supervisor import SupervisorMapping
from models.employee import Employee
from schemas.supervisor import SupervisorAssign


def _fmt(db: Session, m: SupervisorMapping) -> dict:
    emp = db.query(Employee).filter(Employee.emp_id == m.employee_emp_id).first()
    sup = db.query(Employee).filter(Employee.emp_id == m.supervisor_emp_id).first()
    return {
        "id": m.id,
        "employee_emp_id": m.employee_emp_id,
        "employee_name": emp.full_name if emp else "Unknown",
        "supervisor_emp_id": m.supervisor_emp_id,
        "supervisor_name": sup.full_name if sup else "Unknown",
        "start_date": m.start_date,
        "end_date": m.end_date,
    }


def assign_supervisor(db: Session, payload: SupervisorAssign) -> dict:
    if not db.query(Employee).filter(Employee.emp_id == payload.employee_emp_id).first():
        raise HTTPException(status_code=404, detail="Employee not found")
    if not db.query(Employee).filter(Employee.emp_id == payload.supervisor_emp_id).first():
        raise HTTPException(status_code=404, detail="Supervisor not found")
    if payload.employee_emp_id == payload.supervisor_emp_id:
        raise HTTPException(status_code=400, detail="Employee cannot be their own supervisor")

    # Close open mapping
    current = (
        db.query(SupervisorMapping)
        .filter(
            SupervisorMapping.employee_emp_id == payload.employee_emp_id,
            SupervisorMapping.end_date.is_(None),
        )
        .first()
    )
    if current:
        current.end_date = date.today()

    mapping = SupervisorMapping(
        employee_emp_id=payload.employee_emp_id,
        supervisor_emp_id=payload.supervisor_emp_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    return _fmt(db, mapping)


def get_history(db: Session, emp_id: int) -> List[dict]:
    mappings = (
        db.query(SupervisorMapping)
        .filter(SupervisorMapping.employee_emp_id == emp_id)
        .order_by(SupervisorMapping.start_date.desc())
        .all()
    )
    return [_fmt(db, m) for m in mappings]


def get_team(db: Session, supervisor_emp_id: int) -> List[dict]:
    mappings = (
        db.query(SupervisorMapping)
        .filter(
            SupervisorMapping.supervisor_emp_id == supervisor_emp_id,
            SupervisorMapping.end_date.is_(None),
        )
        .all()
    )
    return [_fmt(db, m) for m in mappings]
