from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class RoleCreate(BaseModel):
    name: str


class RoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class RoleAssign(BaseModel):
    emp_id: int
    role_id: int


class EmployeeRoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    emp_id: int
    role_id: int
    role_name: str
    assigned_at: datetime
