from datetime import date as _date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from database.database import get_db
from models.employee import Employee
from models.role import Role, EmployeeRole
from models.supervisor import SupervisorMapping
from models.work_package import (
    WorkPackage, WorkPackageAssignment,
    WorkPackageOwner, WorkPackageActivity, WorkPackageBlocker,
    WorkPackageWeekPlan,
)
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


@router.get("/work-package/{wp_id}")
def work_package_detail_report(wp_id: int, db: Session = Depends(get_db)):
    """Comprehensive report for a single work package: summary KPIs, team, week plans, activities, blockers."""
    today = _date.today()
    wp = db.query(WorkPackage).filter(WorkPackage.id == wp_id).first()
    if not wp:
        raise HTTPException(status_code=404, detail="Work package not found")

    owners = [{"emp_id": o.emp_id, "full_name": o.employee.full_name} for o in wp.owners]

    assignments = []
    for a in sorted(wp.assignments, key=lambda x: x.start_date):
        is_active = a.start_date <= today and (a.end_date is None or a.end_date >= today)
        assignments.append({
            "emp_id": a.emp_id,
            "full_name": a.employee.full_name,
            "start_date": a.start_date,
            "end_date": a.end_date,
            "is_active": is_active,
        })

    activities = [
        {"id": a.id, "description": a.description, "status": a.status, "created_at": a.created_at}
        for a in sorted(wp.activities, key=lambda x: x.created_at, reverse=True)
    ]

    blockers = [
        {"id": b.id, "description": b.description, "status": b.status,
         "raised_on": b.raised_on, "resolved_on": b.resolved_on}
        for b in sorted(wp.blockers, key=lambda x: x.id, reverse=True)
    ]

    week_plans = []
    total_tasks = done_tasks = blocked_tasks = 0
    total_effort = done_effort = 0.0

    for p in sorted(wp.week_plans, key=lambda x: x.week_start):
        tasks = []
        for t in p.tasks:
            dep_ids = [d.depends_on_task_id for d in t.dependencies]
            tasks.append({
                "id": t.id,
                "description": t.description,
                "assignee_name": t.assignee.full_name if t.assignee else None,
                "status": t.status,
                "effort_hours": t.effort_hours,
                "dependency_ids": dep_ids,
            })
            total_tasks += 1
            if t.status == "Done":
                done_tasks += 1
                done_effort += t.effort_hours or 0
            if t.status == "Blocked":
                blocked_tasks += 1
            total_effort += t.effort_hours or 0

        week_plans.append({
            "id": p.id,
            "week_start": p.week_start,
            "goal": p.goal,
            "external_dependencies": p.external_dependencies,
            "tasks": tasks,
            "task_counts": {
                "total": len(tasks),
                "done": sum(1 for t in tasks if t["status"] == "Done"),
                "in_progress": sum(1 for t in tasks if t["status"] == "In Progress"),
                "blocked": sum(1 for t in tasks if t["status"] == "Blocked"),
                "planned": sum(1 for t in tasks if t["status"] == "Planned"),
            },
        })

    open_blockers = sum(1 for b in blockers if b["status"] == "Open")
    done_activities = sum(1 for a in activities if a["status"] == "Done")

    return {
        "id": wp.id,
        "name": wp.name,
        "description": wp.description,
        "status": wp.status,
        "start_date": wp.start_date,
        "end_date": wp.end_date,
        "owners": owners,
        "assignments": assignments,
        "activities": activities,
        "blockers": blockers,
        "week_plans": week_plans,
        "summary_stats": {
            "total_tasks": total_tasks,
            "done_tasks": done_tasks,
            "blocked_tasks": blocked_tasks,
            "total_effort_hours": round(total_effort, 1),
            "done_effort_hours": round(done_effort, 1),
            "open_blockers": open_blockers,
            "total_activities": len(activities),
            "done_activities": done_activities,
            "active_members": sum(1 for a in assignments if a["is_active"]),
        },
    }
