from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from database.database import get_db
from schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut, EmployeeListResponse
from services import employee_service
from models.work_package import WorkPackageAssignment, WorkPackage

router = APIRouter()


@router.post("/", response_model=EmployeeOut, status_code=201)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    return employee_service.create_employee(db, payload)


@router.get("/", response_model=EmployeeListResponse)
def list_employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=1000),
    search: Optional[str] = Query(None),
    blood_group: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * page_size
    total, employees = employee_service.list_employees(db, skip, page_size, search, blood_group)
    return {"total": total, "page": page, "page_size": page_size, "employees": employees}


@router.get("/{emp_id}", response_model=EmployeeOut)
def get_employee(emp_id: int, db: Session = Depends(get_db)):
    return employee_service.get_employee_dict(db, emp_id)


@router.put("/{emp_id}", response_model=EmployeeOut)
def update_employee(emp_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)):
    return employee_service.update_employee(db, emp_id, payload)


@router.delete("/{emp_id}", status_code=204)
def delete_employee(emp_id: int, db: Session = Depends(get_db)):
    employee_service.delete_employee(db, emp_id)


@router.get("/{emp_id}/wp-assignments")
def get_employee_wp_assignments(emp_id: int, db: Session = Depends(get_db)):
    """All work package assignments for a given employee, with WP details."""
    employee_service.get_employee(db, emp_id)  # 404 if not found
    rows = (
        db.query(WorkPackageAssignment, WorkPackage)
        .join(WorkPackage, WorkPackageAssignment.work_package_id == WorkPackage.id)
        .filter(WorkPackageAssignment.emp_id == emp_id)
        .order_by(WorkPackageAssignment.start_date)
        .all()
    )
    return [
        {
            "id": a.id,
            "work_package_id": wp.id,
            "work_package_name": wp.name,
            "work_package_status": wp.status,
            "start_date": a.start_date,
            "end_date": a.end_date,
        }
        for a, wp in rows
    ]
