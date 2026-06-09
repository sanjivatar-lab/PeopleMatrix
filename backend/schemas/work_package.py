from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class WorkPackageOwnerOut(BaseModel):
    id: int
    emp_id: int
    employee_name: str
    model_config = ConfigDict(from_attributes=True)


class WorkPackageAssignmentCreate(BaseModel):
    emp_id: int
    start_date: date
    end_date: Optional[date] = None


class WorkPackageAssignmentUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class WorkPackageAssignmentOut(BaseModel):
    id: int
    work_package_id: int
    emp_id: int
    employee_name: str
    start_date: date
    end_date: Optional[date] = None
    model_config = ConfigDict(from_attributes=True)


class WorkPackageCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    owner_emp_ids: List[int]
    status: Optional[str] = None


class WorkPackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    owner_emp_ids: Optional[List[int]] = None
    status: Optional[str] = None


class WorkPackageOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    owners: List[WorkPackageOwnerOut]
    model_config = ConfigDict(from_attributes=True)


# ── Activities ────────────────────────────────────────────────────────────────

class ActivityCreate(BaseModel):
    description: str
    status: str = "To Do"


class ActivityUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[str] = None


class ActivityOut(BaseModel):
    id: int
    work_package_id: int
    description: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ── Blockers ──────────────────────────────────────────────────────────────────

class BlockerCreate(BaseModel):
    description: str
    raised_on: Optional[date] = None


class BlockerUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[str] = None
    raised_on: Optional[date] = None
    resolved_on: Optional[date] = None


class BlockerOut(BaseModel):
    id: int
    work_package_id: int
    description: str
    status: str
    raised_on: Optional[date] = None
    resolved_on: Optional[date] = None
    model_config = ConfigDict(from_attributes=True)
