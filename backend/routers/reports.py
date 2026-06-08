from datetime import date as _date
from fastapi import APIRouter, Depends
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from database.database import get_db
from models.employee import Employee
from models.role import Role, EmployeeRole
from models.supervisor import SupervisorMapping
from models.work_package import WorkPackage, WorkPackageAssignment

router = APIRouter()


@router.get("/unassigned-team-members")
def unassigned_team_members(db: Session = Depends(get_db)):
    """Team Members who have no active (current or future) work package assignment."""
    active_emp_ids = (
        db.query(WorkPackageAssignment.emp_id)
        .filter(
            or_(
                WorkPackageAssignment.end_date.is_(None),
                WorkPackageAssignment.end_date >= _date.today(),
            )
        )
        .distinct()
        .subquery()
    )

    employees = (
        db.query(Employee)
        .join(EmployeeRole, Employee.emp_id == EmployeeRole.emp_id)
        .join(Role, EmployeeRole.role_id == Role.id)
        .filter(Role.name == "Team Member")
        .filter(Employee.emp_id.notin_(db.query(active_emp_ids.c.emp_id)))
        .order_by(Employee.first_name, Employee.last_name)
        .all()
    )

    return [
        {"emp_id": e.emp_id, "full_name": e.full_name, "email": e.email}
        for e in employees
    ]


@router.get("/employees-without-supervisor")
def employees_without_supervisor(db: Session = Depends(get_db)):
    """Employees who have no current (open) supervisor mapping."""
    supervised_emp_ids = (
        db.query(SupervisorMapping.employee_emp_id)
        .filter(SupervisorMapping.end_date.is_(None))
        .distinct()
        .subquery()
    )

    employees = (
        db.query(Employee)
        .join(EmployeeRole, Employee.emp_id == EmployeeRole.emp_id)
        .join(Role, EmployeeRole.role_id == Role.id)
        .filter(Role.name == "Team Member")
        .filter(Employee.emp_id.notin_(db.query(supervised_emp_ids.c.employee_emp_id)))
        .order_by(Employee.first_name, Employee.last_name)
        .all()
    )

    return [
        {"emp_id": e.emp_id, "full_name": e.full_name, "email": e.email, "role_name": "Team Member"}
        for e in employees
    ]


@router.get("/supervisor-team-summary")
def supervisor_team_summary(db: Session = Depends(get_db)):
    """Each supervisor/platform-owner with their current team member count."""
    rows = (
        db.query(Employee, func.count(SupervisorMapping.employee_emp_id).label("team_count"))
        .join(EmployeeRole, Employee.emp_id == EmployeeRole.emp_id)
        .join(Role, EmployeeRole.role_id == Role.id)
        .filter(Role.name.in_(["Supervisor", "Platform Owner"]))
        .outerjoin(
            SupervisorMapping,
            and_(
                SupervisorMapping.supervisor_emp_id == Employee.emp_id,
                SupervisorMapping.end_date.is_(None),
            ),
        )
        .group_by(Employee.emp_id)
        .order_by(Employee.first_name, Employee.last_name)
        .all()
    )

    return [
        {"emp_id": e.emp_id, "full_name": e.full_name, "email": e.email, "team_count": team_count}
        for e, team_count in rows
    ]
