from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from database.database import Base


class Employee(Base):
    __tablename__ = "employees"

    emp_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, nullable=False, index=True)
    mobile_number = Column(String(20), nullable=True)
    native_place = Column(String(200), nullable=True)
    years_of_experience = Column(Float, default=0.0)
    blood_group = Column(String(10), nullable=True)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    role_assignments = relationship(
        "EmployeeRole",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    competency_assignments = relationship(
        "EmployeeCompetency",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    supervisor_mappings = relationship(
        "SupervisorMapping",
        foreign_keys="SupervisorMapping.employee_emp_id",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    supervised_employees = relationship(
        "SupervisorMapping",
        foreign_keys="SupervisorMapping.supervisor_emp_id",
        back_populates="supervisor",
    )
