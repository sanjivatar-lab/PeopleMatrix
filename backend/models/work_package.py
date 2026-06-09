from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.database import Base


class WorkPackage(Base):
    __tablename__ = "work_packages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    status = Column(String(50), nullable=True)

    owners = relationship("WorkPackageOwner", back_populates="work_package", cascade="all, delete-orphan")
    assignments = relationship("WorkPackageAssignment", back_populates="work_package", cascade="all, delete-orphan")
    activities = relationship("WorkPackageActivity", back_populates="work_package", cascade="all, delete-orphan")
    blockers = relationship("WorkPackageBlocker", back_populates="work_package", cascade="all, delete-orphan")


class WorkPackageOwner(Base):
    __tablename__ = "work_package_owners"

    id = Column(Integer, primary_key=True, index=True)
    work_package_id = Column(Integer, ForeignKey("work_packages.id"), nullable=False)
    emp_id = Column(Integer, ForeignKey("employees.emp_id"), nullable=False)

    work_package = relationship("WorkPackage", back_populates="owners")
    employee = relationship("Employee")


class WorkPackageAssignment(Base):
    __tablename__ = "work_package_assignments"

    id = Column(Integer, primary_key=True, index=True)
    work_package_id = Column(Integer, ForeignKey("work_packages.id"), nullable=False)
    emp_id = Column(Integer, ForeignKey("employees.emp_id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)

    work_package = relationship("WorkPackage", back_populates="assignments")
    employee = relationship("Employee")


class WorkPackageActivity(Base):
    __tablename__ = "work_package_activities"

    id = Column(Integer, primary_key=True, index=True)
    work_package_id = Column(Integer, ForeignKey("work_packages.id"), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="To Do")
    created_at = Column(DateTime, default=datetime.utcnow)

    work_package = relationship("WorkPackage", back_populates="activities")


class WorkPackageBlocker(Base):
    __tablename__ = "work_package_blockers"

    id = Column(Integer, primary_key=True, index=True)
    work_package_id = Column(Integer, ForeignKey("work_packages.id"), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="Open")
    raised_on = Column(Date, nullable=True)
    resolved_on = Column(Date, nullable=True)

    work_package = relationship("WorkPackage", back_populates="blockers")
