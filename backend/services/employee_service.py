from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException
from typing import Optional, Tuple, List

from models.employee import Employee
from schemas.employee import EmployeeCreate, EmployeeUpdate


def _to_dict(emp: Employee) -> dict:
    return {
        "emp_id": emp.emp_id,
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "full_name": emp.full_name,
        "email": emp.email,
        "mobile_number": emp.mobile_number,
        "native_place": emp.native_place,
        "years_of_experience": emp.years_of_experience,
        "blood_group": emp.blood_group,
    }


def create_employee(db: Session, payload: EmployeeCreate) -> dict:
    if db.query(Employee).filter(Employee.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    emp = Employee(**payload.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return _to_dict(emp)


def get_employee(db: Session, emp_id: int) -> Employee:
    emp = db.query(Employee).filter(Employee.emp_id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


def get_employee_dict(db: Session, emp_id: int) -> dict:
    return _to_dict(get_employee(db, emp_id))


def list_employees(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = None,
    blood_group: Optional[str] = None,
) -> Tuple[int, List[dict]]:
    query = db.query(Employee)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Employee.first_name.ilike(term),
                Employee.last_name.ilike(term),
                Employee.email.ilike(term),
                Employee.native_place.ilike(term),
            )
        )
    if blood_group:
        query = query.filter(Employee.blood_group == blood_group.upper())
    total = query.count()
    employees = query.order_by(Employee.emp_id).offset(skip).limit(limit).all()
    return total, [_to_dict(e) for e in employees]


def update_employee(db: Session, emp_id: int, payload: EmployeeUpdate) -> dict:
    emp = get_employee(db, emp_id)
    updates = payload.model_dump(exclude_unset=True)

    if "email" in updates:
        conflict = (
            db.query(Employee)
            .filter(Employee.email == updates["email"], Employee.emp_id != emp_id)
            .first()
        )
        if conflict:
            raise HTTPException(status_code=400, detail="Email already in use")

    for key, value in updates.items():
        setattr(emp, key, value)

    db.commit()
    db.refresh(emp)
    return _to_dict(emp)


def delete_employee(db: Session, emp_id: int) -> None:
    emp = get_employee(db, emp_id)
    db.delete(emp)
    db.commit()
