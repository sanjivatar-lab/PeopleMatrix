from datetime import date as _date
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from database.database import get_db
from models.employee import Employee
from models.role import Role, EmployeeRole
from models.supervisor import SupervisorMapping
from models.work_package import WorkPackage, WorkPackageAssignment
from models.competency import EmployeeCompetency

router = APIRouter()


@router.get("/unassigned-team-members")
def unassigned_team_members(db: Session = Depends(get_db)):
    """Team Members with no currently active work package assignment.

    An assignment is active today only when:
        start_date <= today AND (end_date IS NULL OR end_date >= today)
    Members whose every assignment is either in the past or not yet started
    are also included in this report.
    """
    today = _date.today()

    active_rows = (
        db.query(WorkPackageAssignment.emp_id)
        .filter(
            WorkPackageAssignment.start_date <= today,
            or_(
                WorkPackageAssignment.end_date.is_(None),
                WorkPackageAssignment.end_date >= today,
            ),
        )
        .distinct()
        .all()
    )
    active_emp_ids = [r[0] for r in active_rows]

    query = (
        db.query(Employee)
        .join(EmployeeRole, Employee.emp_id == EmployeeRole.emp_id)
        .join(Role, EmployeeRole.role_id == Role.id)
        .filter(Role.name == "Team Member")
        .order_by(Employee.first_name, Employee.last_name)
    )
    if active_emp_ids:
        query = query.filter(Employee.emp_id.notin_(active_emp_ids))

    return [
        {"emp_id": e.emp_id, "full_name": e.full_name, "email": e.email}
        for e in query.all()
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


@router.get("/competency-team-members")
def competency_team_members(
    competency_ids: List[int] = Query(default=[]),
    db: Session = Depends(get_db),
):
    """Employees who have at least one of the given competencies."""
    if not competency_ids:
        return []

    # Step 1: find all emp_ids that have at least one matching competency
    rows = (
        db.query(EmployeeCompetency.emp_id)
        .filter(EmployeeCompetency.competency_id.in_(competency_ids))
        .distinct()
        .all()
    )
    emp_id_list = [r[0] for r in rows]
    if not emp_id_list:
        return []

    # Step 2: load those employees (no role filter — employees without a role
    # assignment still appear; we show their role separately)
    employees = (
        db.query(Employee)
        .filter(Employee.emp_id.in_(emp_id_list))
        .order_by(Employee.first_name, Employee.last_name)
        .all()
    )

    # Step 3: build a role lookup for each emp_id
    role_rows = (
        db.query(EmployeeRole.emp_id, Role.name)
        .join(Role, EmployeeRole.role_id == Role.id)
        .filter(EmployeeRole.emp_id.in_(emp_id_list))
        .all()
    )
    role_map = {r.emp_id: r.name for r in role_rows}

    comp_id_set = set(competency_ids)
    result = []
    for emp in employees:
        all_comps = [
            {"id": ec.competency_id, "name": ec.competency.name, "category": ec.competency.category}
            for ec in emp.competency_assignments
        ]
        matched = [c for c in all_comps if c["id"] in comp_id_set]
        result.append({
            "emp_id": emp.emp_id,
            "full_name": emp.full_name,
            "email": emp.email,
            "role": role_map.get(emp.emp_id, "Unassigned"),
            "matched_competencies": matched,
            "all_competencies": all_comps,
        })
    return result
