from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)

    employee_roles = relationship("EmployeeRole", back_populates="role")


class EmployeeRole(Base):
    __tablename__ = "employee_roles"

    id = Column(Integer, primary_key=True, index=True)
    emp_id = Column(
        Integer, ForeignKey("employees.emp_id", ondelete="CASCADE"), nullable=False
    )
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="role_assignments")
    role = relationship("Role", back_populates="employee_roles")
