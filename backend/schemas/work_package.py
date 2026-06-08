from datetime import date
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


class WorkPackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    owner_emp_ids: Optional[List[int]] = None


class WorkPackageOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    owners: List[WorkPackageOwnerOut]
    model_config = ConfigDict(from_attributes=True)
