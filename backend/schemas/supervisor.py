from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date


class SupervisorAssign(BaseModel):
    employee_emp_id: int
    supervisor_emp_id: int
    start_date: date
    end_date: Optional[date] = None


class SupervisorMappingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_emp_id: int
    employee_name: str
    supervisor_emp_id: int
    supervisor_name: str
    start_date: date
    end_date: Optional[date] = None
