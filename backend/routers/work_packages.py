from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from schemas.work_package import (
    WorkPackageCreate, WorkPackageUpdate,
    WorkPackageAssignmentCreate, WorkPackageAssignmentUpdate,
)
import services.work_package_service as svc

router = APIRouter()


@router.get("/")
def list_wps(db: Session = Depends(get_db)):
    return svc.list_work_packages(db)


@router.post("/", status_code=201)
def create_wp(data: WorkPackageCreate, db: Session = Depends(get_db)):
    return svc.create_work_package(db, data)


@router.get("/{wp_id}")
def get_wp(wp_id: int, db: Session = Depends(get_db)):
    return svc.get_work_package(db, wp_id)


@router.put("/{wp_id}")
def update_wp(wp_id: int, data: WorkPackageUpdate, db: Session = Depends(get_db)):
    return svc.update_work_package(db, wp_id, data)


@router.delete("/{wp_id}", status_code=204)
def delete_wp(wp_id: int, db: Session = Depends(get_db)):
    svc.delete_work_package(db, wp_id)


@router.get("/{wp_id}/assignments")
def list_assignments(wp_id: int, db: Session = Depends(get_db)):
    return svc.list_assignments(db, wp_id)


@router.post("/{wp_id}/assignments", status_code=201)
def assign_member(wp_id: int, data: WorkPackageAssignmentCreate, db: Session = Depends(get_db)):
    return svc.assign_member(db, wp_id, data)


@router.put("/{wp_id}/assignments/{assignment_id}")
def update_assignment(wp_id: int, assignment_id: int, data: WorkPackageAssignmentUpdate, db: Session = Depends(get_db)):
    return svc.update_assignment(db, wp_id, assignment_id, data)


@router.delete("/{wp_id}/assignments/{assignment_id}", status_code=204)
def remove_assignment(wp_id: int, assignment_id: int, db: Session = Depends(get_db)):
    svc.remove_assignment(db, wp_id, assignment_id)
