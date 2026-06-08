from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from database.database import get_db
from schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut, EmployeeListResponse
from services import employee_service

router = APIRouter()


@router.post("/", response_model=EmployeeOut, status_code=201)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    return employee_service.create_employee(db, payload)


@router.get("/", response_model=EmployeeListResponse)
def list_employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=1000),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * page_size
    total, employees = employee_service.list_employees(db, skip, page_size, search)
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
