from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List, Optional

from models.role import Role, EmployeeRole
from models.employee import Employee
from schemas.role import RoleCreate, RoleAssign


def get_all_roles(db: Session) -> List[Role]:
    return db.query(Role).order_by(Role.id).all()


def create_role(db: Session, payload: RoleCreate) -> Role:
    if db.query(Role).filter(Role.name == payload.name).first():
        raise HTTPException(status_code=400, detail="Role already exists")
    role = Role(name=payload.name)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def assign_role(db: Session, payload: RoleAssign) -> dict:
    if not db.query(Employee).filter(Employee.emp_id == payload.emp_id).first():
        raise HTTPException(status_code=404, detail="Employee not found")

    role = db.query(Role).filter(Role.id == payload.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # One role at a time — remove existing
    db.query(EmployeeRole).filter(EmployeeRole.emp_id == payload.emp_id).delete()

    emp_role = EmployeeRole(emp_id=payload.emp_id, role_id=payload.role_id)
    db.add(emp_role)
    db.commit()
    db.refresh(emp_role)

    return {
        "id": emp_role.id,
        "emp_id": emp_role.emp_id,
        "role_id": emp_role.role_id,
        "role_name": role.name,
        "assigned_at": emp_role.assigned_at,
    }


def get_employee_role(db: Session, emp_id: int) -> Optional[dict]:
    er = db.query(EmployeeRole).filter(EmployeeRole.emp_id == emp_id).first()
    if not er:
        return None
    role = db.query(Role).filter(Role.id == er.role_id).first()
    return {
        "id": er.id,
        "emp_id": er.emp_id,
        "role_id": er.role_id,
        "role_name": role.name if role else "Unknown",
        "assigned_at": er.assigned_at,
    }
