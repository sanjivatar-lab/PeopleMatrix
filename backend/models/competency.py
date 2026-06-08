from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database.database import Base


class Competency(Base):
    __tablename__ = "competencies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    category = Column(String(100), nullable=True)

    employee_competencies = relationship(
        "EmployeeCompetency", back_populates="competency"
    )


class EmployeeCompetency(Base):
    __tablename__ = "employee_competencies"

    id = Column(Integer, primary_key=True, index=True)
    emp_id = Column(
        Integer, ForeignKey("employees.emp_id", ondelete="CASCADE"), nullable=False
    )
    competency_id = Column(
        Integer, ForeignKey("competencies.id", ondelete="CASCADE"), nullable=False
    )

    employee = relationship("Employee", back_populates="competency_assignments")
    competency = relationship("Competency", back_populates="employee_competencies")
