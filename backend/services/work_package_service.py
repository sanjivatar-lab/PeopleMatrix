from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from models.work_package import (
    WorkPackage, WorkPackageOwner, WorkPackageAssignment,
    WorkPackageActivity, WorkPackageBlocker,
    WorkPackageWeekPlan, WorkPackageWeekTask, WorkPackageTaskDependency,
)
from models.employee import Employee
from schemas.work_package import (
    WorkPackageCreate, WorkPackageUpdate, WorkPackageAssignmentCreate,
    ActivityCreate, ActivityUpdate, BlockerCreate, BlockerUpdate,
    WeekPlanUpsert, WeekTaskCreate, WeekTaskUpdate,
)


# ── Serializers ───────────────────────────────────────────────────────────────

def _serialize_wp(wp: WorkPackage) -> dict:
    return {
        "id": wp.id,
        "name": wp.name,
        "description": wp.description,
        "start_date": wp.start_date,
        "end_date": wp.end_date,
        "status": wp.status,
        "owners": [
            {"id": o.id, "emp_id": o.emp_id, "employee_name": o.employee.full_name}
            for o in wp.owners
        ],
        "assignment_count": len(wp.assignments),
        "activity_count": len(wp.activities),
        "blocker_count": len(wp.blockers),
    }


def _serialize_assignment(a: WorkPackageAssignment) -> dict:
    return {
        "id": a.id,
        "work_package_id": a.work_package_id,
        "emp_id": a.emp_id,
        "employee_name": a.employee.full_name,
        "start_date": a.start_date,
        "end_date": a.end_date,
    }


def _serialize_activity(a: WorkPackageActivity) -> dict:
    return {
        "id": a.id,
        "work_package_id": a.work_package_id,
        "description": a.description,
        "status": a.status,
        "created_at": a.created_at,
    }


def _serialize_blocker(b: WorkPackageBlocker) -> dict:
    return {
        "id": b.id,
        "work_package_id": b.work_package_id,
        "description": b.description,
        "status": b.status,
        "raised_on": b.raised_on,
        "resolved_on": b.resolved_on,
    }


def _get_wp_or_404(db: Session, wp_id: int) -> WorkPackage:
    wp = db.query(WorkPackage).filter(WorkPackage.id == wp_id).first()
    if not wp:
        raise HTTPException(status_code=404, detail="Work package not found")
    return wp


# ── Work Package CRUD ─────────────────────────────────────────────────────────

def list_work_packages(db: Session) -> list:
    return [_serialize_wp(wp) for wp in db.query(WorkPackage).order_by(WorkPackage.id).all()]


def get_work_package(db: Session, wp_id: int) -> dict:
    return _serialize_wp(_get_wp_or_404(db, wp_id))


def create_work_package(db: Session, data: WorkPackageCreate) -> dict:
    if not data.owner_emp_ids:
        raise HTTPException(status_code=400, detail="At least one owner is required")

    wp = WorkPackage(
        name=data.name,
        description=data.description,
        start_date=data.start_date,
        end_date=data.end_date,
    )
    db.add(wp)
    db.flush()

    for emp_id in data.owner_emp_ids:
        if not db.query(Employee).filter(Employee.emp_id == emp_id).first():
            raise HTTPException(status_code=404, detail=f"Employee {emp_id} not found")
        db.add(WorkPackageOwner(work_package_id=wp.id, emp_id=emp_id))

    db.commit()
    db.refresh(wp)
    return _serialize_wp(wp)


def update_work_package(db: Session, wp_id: int, data: WorkPackageUpdate) -> dict:
    wp = _get_wp_or_404(db, wp_id)

    for field, val in data.model_dump(exclude_unset=True, exclude={"owner_emp_ids"}).items():
        setattr(wp, field, val)

    if data.owner_emp_ids is not None:
        if not data.owner_emp_ids:
            raise HTTPException(status_code=400, detail="At least one owner is required")
        db.query(WorkPackageOwner).filter(WorkPackageOwner.work_package_id == wp_id).delete()
        for emp_id in data.owner_emp_ids:
            if not db.query(Employee).filter(Employee.emp_id == emp_id).first():
                raise HTTPException(status_code=404, detail=f"Employee {emp_id} not found")
            db.add(WorkPackageOwner(work_package_id=wp_id, emp_id=emp_id))

    db.commit()
    db.refresh(wp)
    return _serialize_wp(wp)


def delete_work_package(db: Session, wp_id: int) -> None:
    wp = _get_wp_or_404(db, wp_id)
    db.delete(wp)
    db.commit()


# ── Assignments ───────────────────────────────────────────────────────────────

def list_assignments(db: Session, wp_id: int) -> list:
    _get_wp_or_404(db, wp_id)
    rows = (
        db.query(WorkPackageAssignment)
        .filter(WorkPackageAssignment.work_package_id == wp_id)
        .order_by(WorkPackageAssignment.start_date)
        .all()
    )
    return [_serialize_assignment(a) for a in rows]


def _validate_assignment_dates(wp: WorkPackage, start_date, end_date) -> None:
    if start_date < wp.start_date:
        raise HTTPException(
            status_code=400,
            detail=f"Assignment start date ({start_date}) cannot be before work package start date ({wp.start_date})",
        )
    if wp.end_date and end_date and end_date > wp.end_date:
        raise HTTPException(
            status_code=400,
            detail=f"Assignment end date ({end_date}) cannot be after work package end date ({wp.end_date})",
        )
    if end_date and start_date and end_date < start_date:
        raise HTTPException(status_code=400, detail="Assignment end date cannot be before start date")


def assign_member(db: Session, wp_id: int, data: WorkPackageAssignmentCreate) -> dict:
    wp = _get_wp_or_404(db, wp_id)
    if not db.query(Employee).filter(Employee.emp_id == data.emp_id).first():
        raise HTTPException(status_code=404, detail="Employee not found")

    _validate_assignment_dates(wp, data.start_date, data.end_date)

    assignment = WorkPackageAssignment(
        work_package_id=wp_id,
        emp_id=data.emp_id,
        start_date=data.start_date,
        end_date=data.end_date,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return _serialize_assignment(assignment)


def update_assignment(db: Session, wp_id: int, assignment_id: int, data) -> dict:
    wp = _get_wp_or_404(db, wp_id)
    a = (
        db.query(WorkPackageAssignment)
        .filter(WorkPackageAssignment.id == assignment_id, WorkPackageAssignment.work_package_id == wp_id)
        .first()
    )
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")

    updates = data.model_dump(exclude_unset=True)
    new_start = updates.get("start_date", a.start_date)
    new_end = updates.get("end_date", a.end_date)
    _validate_assignment_dates(wp, new_start, new_end)

    for field, val in updates.items():
        setattr(a, field, val)
    db.commit()
    db.refresh(a)
    return _serialize_assignment(a)


def remove_assignment(db: Session, wp_id: int, assignment_id: int) -> None:
    a = (
        db.query(WorkPackageAssignment)
        .filter(WorkPackageAssignment.id == assignment_id, WorkPackageAssignment.work_package_id == wp_id)
        .first()
    )
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(a)
    db.commit()


# ── Activities ────────────────────────────────────────────────────────────────

def list_activities(db: Session, wp_id: int) -> list:
    _get_wp_or_404(db, wp_id)
    rows = (
        db.query(WorkPackageActivity)
        .filter(WorkPackageActivity.work_package_id == wp_id)
        .order_by(WorkPackageActivity.created_at.desc())
        .all()
    )
    return [_serialize_activity(a) for a in rows]


def add_activity(db: Session, wp_id: int, data: ActivityCreate) -> dict:
    _get_wp_or_404(db, wp_id)
    a = WorkPackageActivity(
        work_package_id=wp_id,
        description=data.description.strip(),
        status=data.status,
        created_at=datetime.utcnow(),
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return _serialize_activity(a)


def update_activity(db: Session, wp_id: int, act_id: int, data: ActivityUpdate) -> dict:
    a = (
        db.query(WorkPackageActivity)
        .filter(WorkPackageActivity.id == act_id, WorkPackageActivity.work_package_id == wp_id)
        .first()
    )
    if not a:
        raise HTTPException(status_code=404, detail="Activity not found")
    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(a, field, val)
    db.commit()
    db.refresh(a)
    return _serialize_activity(a)


def delete_activity(db: Session, wp_id: int, act_id: int) -> None:
    a = (
        db.query(WorkPackageActivity)
        .filter(WorkPackageActivity.id == act_id, WorkPackageActivity.work_package_id == wp_id)
        .first()
    )
    if not a:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete(a)
    db.commit()


# ── Blockers ──────────────────────────────────────────────────────────────────

def list_blockers(db: Session, wp_id: int) -> list:
    _get_wp_or_404(db, wp_id)
    rows = (
        db.query(WorkPackageBlocker)
        .filter(WorkPackageBlocker.work_package_id == wp_id)
        .order_by(WorkPackageBlocker.id.desc())
        .all()
    )
    return [_serialize_blocker(b) for b in rows]


def add_blocker(db: Session, wp_id: int, data: BlockerCreate) -> dict:
    _get_wp_or_404(db, wp_id)
    b = WorkPackageBlocker(
        work_package_id=wp_id,
        description=data.description.strip(),
        status="Open",
        raised_on=data.raised_on,
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return _serialize_blocker(b)


def update_blocker(db: Session, wp_id: int, blocker_id: int, data: BlockerUpdate) -> dict:
    b = (
        db.query(WorkPackageBlocker)
        .filter(WorkPackageBlocker.id == blocker_id, WorkPackageBlocker.work_package_id == wp_id)
        .first()
    )
    if not b:
        raise HTTPException(status_code=404, detail="Blocker not found")
    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(b, field, val)
    db.commit()
    db.refresh(b)
    return _serialize_blocker(b)


def delete_blocker(db: Session, wp_id: int, blocker_id: int) -> None:
    b = (
        db.query(WorkPackageBlocker)
        .filter(WorkPackageBlocker.id == blocker_id, WorkPackageBlocker.work_package_id == wp_id)
        .first()
    )
    if not b:
        raise HTTPException(status_code=404, detail="Blocker not found")
    db.delete(b)
    db.commit()


# ── Week Plans ────────────────────────────────────────────────────────────────

def _sync_task_dependencies(db: Session, task_id: int, dependency_ids: list) -> None:
    db.query(WorkPackageTaskDependency).filter(
        WorkPackageTaskDependency.task_id == task_id
    ).delete(synchronize_session=False)
    seen = set()
    for dep_id in dependency_ids:
        if dep_id != task_id and dep_id not in seen:
            seen.add(dep_id)
            db.add(WorkPackageTaskDependency(task_id=task_id, depends_on_task_id=dep_id))


def _serialize_week_task(t: WorkPackageWeekTask) -> dict:
    return {
        "id": t.id,
        "week_plan_id": t.week_plan_id,
        "description": t.description,
        "assigned_emp_id": t.assigned_emp_id,
        "assignee_name": t.assignee.full_name if t.assignee else None,
        "status": t.status,
        "effort_hours": t.effort_hours,
        "dependency_ids": [d.depends_on_task_id for d in t.dependencies],
    }


def _serialize_week_plan(p: WorkPackageWeekPlan) -> dict:
    return {
        "id": p.id,
        "work_package_id": p.work_package_id,
        "week_start": p.week_start,
        "goal": p.goal,
        "external_dependencies": p.external_dependencies,
        "tasks": [_serialize_week_task(t) for t in p.tasks],
    }


def list_week_plans(db: Session, wp_id: int) -> list:
    _get_wp_or_404(db, wp_id)
    plans = (
        db.query(WorkPackageWeekPlan)
        .filter(WorkPackageWeekPlan.work_package_id == wp_id)
        .order_by(WorkPackageWeekPlan.week_start)
        .all()
    )
    return [_serialize_week_plan(p) for p in plans]


def upsert_week_plan(db: Session, wp_id: int, data: WeekPlanUpsert) -> dict:
    _get_wp_or_404(db, wp_id)
    plan = (
        db.query(WorkPackageWeekPlan)
        .filter(
            WorkPackageWeekPlan.work_package_id == wp_id,
            WorkPackageWeekPlan.week_start == data.week_start,
        )
        .first()
    )
    if plan:
        plan.goal = data.goal
        plan.external_dependencies = data.external_dependencies
    else:
        plan = WorkPackageWeekPlan(
            work_package_id=wp_id,
            week_start=data.week_start,
            goal=data.goal,
            external_dependencies=data.external_dependencies,
        )
        db.add(plan)
    db.commit()
    db.refresh(plan)
    return _serialize_week_plan(plan)


def add_week_task(db: Session, wp_id: int, plan_id: int, data: WeekTaskCreate) -> dict:
    plan = (
        db.query(WorkPackageWeekPlan)
        .filter(WorkPackageWeekPlan.id == plan_id, WorkPackageWeekPlan.work_package_id == wp_id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Week plan not found")
    task = WorkPackageWeekTask(
        week_plan_id=plan_id,
        description=data.description.strip(),
        assigned_emp_id=data.assigned_emp_id,
        status=data.status,
        effort_hours=data.effort_hours,
    )
    db.add(task)
    db.flush()
    _sync_task_dependencies(db, task.id, data.dependency_ids)
    db.commit()
    db.refresh(task)
    return _serialize_week_task(task)


def update_week_task(db: Session, wp_id: int, plan_id: int, task_id: int, data: WeekTaskUpdate) -> dict:
    task = (
        db.query(WorkPackageWeekTask)
        .join(WorkPackageWeekPlan)
        .filter(
            WorkPackageWeekTask.id == task_id,
            WorkPackageWeekTask.week_plan_id == plan_id,
            WorkPackageWeekPlan.work_package_id == wp_id,
        )
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    updates = data.model_dump(exclude_unset=True)
    dep_ids = updates.pop("dependency_ids", None)
    for field, val in updates.items():
        setattr(task, field, val)
    if dep_ids is not None:
        _sync_task_dependencies(db, task.id, dep_ids)
    db.commit()
    db.refresh(task)
    return _serialize_week_task(task)


def delete_week_task(db: Session, wp_id: int, plan_id: int, task_id: int) -> None:
    task = (
        db.query(WorkPackageWeekTask)
        .join(WorkPackageWeekPlan)
        .filter(
            WorkPackageWeekTask.id == task_id,
            WorkPackageWeekTask.week_plan_id == plan_id,
            WorkPackageWeekPlan.work_package_id == wp_id,
        )
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
