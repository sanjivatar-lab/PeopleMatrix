from sqlalchemy.orm import Session
from fastapi import HTTPException

from models.work_package import WorkPackage, WorkPackageOwner, WorkPackageAssignment
from models.employee import Employee
from schemas.work_package import (
    WorkPackageCreate, WorkPackageUpdate, WorkPackageAssignmentCreate,
)


def _serialize_wp(wp: WorkPackage) -> dict:
    return {
        "id": wp.id,
        "name": wp.name,
        "description": wp.description,
        "start_date": wp.start_date,
        "end_date": wp.end_date,
        "owners": [
            {"id": o.id, "emp_id": o.emp_id, "employee_name": o.employee.full_name}
            for o in wp.owners
        ],
        "assignment_count": len(wp.assignments),
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


def _get_wp_or_404(db: Session, wp_id: int) -> WorkPackage:
    wp = db.query(WorkPackage).filter(WorkPackage.id == wp_id).first()
    if not wp:
        raise HTTPException(status_code=404, detail="Work package not found")
    return wp


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
    if wp.end_date and not end_date:
        pass  # open-ended assignments are allowed even when WP has an end date
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
