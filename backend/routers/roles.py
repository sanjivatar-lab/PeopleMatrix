from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from database.database import get_db
from schemas.role import RoleCreate, RoleOut, RoleAssign, EmployeeRoleOut
from services import role_service
from models.role import Role, EmployeeRole
from models.employee import Employee

router = APIRouter()


@router.get("/", response_model=List[RoleOut])
def get_roles(db: Session = Depends(get_db)):
    return role_service.get_all_roles(db)


@router.post("/", response_model=RoleOut, status_code=201)
def create_role(payload: RoleCreate, db: Session = Depends(get_db)):
    return role_service.create_role(db, payload)


@router.post("/assign")
def assign_role(payload: RoleAssign, db: Session = Depends(get_db)):
    return role_service.assign_role(db, payload)


@router.get("/potential-owners")
def get_potential_owners(db: Session = Depends(get_db)):
    """Return employees whose role is Platform Owner or Supervisor."""
    rows = (
        db.query(Employee, Role.name)
        .join(EmployeeRole, Employee.emp_id == EmployeeRole.emp_id)
        .join(Role, EmployeeRole.role_id == Role.id)
        .filter(Role.name.in_(["Platform Owner", "Supervisor"]))
        .all()
    )
    return [
        {"emp_id": emp.emp_id, "full_name": emp.full_name, "role_name": role_name}
        for emp, role_name in rows
    ]


@router.get("/employee/{emp_id}")
def get_employee_role(emp_id: int, db: Session = Depends(get_db)):
    return role_service.get_employee_role(db, emp_id)
