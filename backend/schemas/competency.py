from pydantic import BaseModel, ConfigDict
from typing import Optional, List


class CompetencyCreate(BaseModel):
    name: str
    category: Optional[str] = None


class CompetencyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: Optional[str] = None


class CompetencyAssign(BaseModel):
    emp_id: int
    competency_ids: List[int]


class EmployeeCompetencyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    emp_id: int
    competency_id: int
    competency_name: str
