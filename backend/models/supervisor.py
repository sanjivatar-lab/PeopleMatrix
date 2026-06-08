from sqlalchemy import Column, Integer, ForeignKey, Date
from sqlalchemy.orm import relationship
from database.database import Base


class SupervisorMapping(Base):
    __tablename__ = "supervisor_mappings"

    id = Column(Integer, primary_key=True, index=True)
    employee_emp_id = Column(
        Integer, ForeignKey("employees.emp_id", ondelete="CASCADE"), nullable=False
    )
    supervisor_emp_id = Column(
        Integer, ForeignKey("employees.emp_id", ondelete="CASCADE"), nullable=False
    )
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    employee = relationship(
        "Employee",
        foreign_keys=[employee_emp_id],
        back_populates="supervisor_mappings",
    )
    supervisor = relationship(
        "Employee",
        foreign_keys=[supervisor_emp_id],
        back_populates="supervised_employees",
    )
