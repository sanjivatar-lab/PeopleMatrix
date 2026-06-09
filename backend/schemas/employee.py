from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List


VALID_BLOOD_GROUPS = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}

class EmployeeBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    mobile_number: Optional[str] = None
    native_place: Optional[str] = None
    years_of_experience: float = Field(default=0.0, ge=0)
    blood_group: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    mobile_number: Optional[str] = None
    native_place: Optional[str] = None
    years_of_experience: Optional[float] = Field(None, ge=0)
    blood_group: Optional[str] = None


class EmployeeOut(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

    emp_id: int
    full_name: str


class EmployeeListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    employees: List[EmployeeOut]
