from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Float, ForeignKey
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
    week_plans = relationship("WorkPackageWeekPlan", back_populates="work_package", cascade="all, delete-orphan")


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


class WorkPackageWeekPlan(Base):
    __tablename__ = "wp_week_plans"

    id = Column(Integer, primary_key=True, index=True)
    work_package_id = Column(Integer, ForeignKey("work_packages.id"), nullable=False)
    week_start = Column(Date, nullable=False)
    goal = Column(Text, nullable=True)

    external_dependencies = Column(Text, nullable=True)

    work_package = relationship("WorkPackage", back_populates="week_plans")
    tasks = relationship(
        "WorkPackageWeekTask",
        back_populates="week_plan",
        cascade="all, delete-orphan",
        order_by="WorkPackageWeekTask.id",
    )


class WorkPackageWeekTask(Base):
    __tablename__ = "wp_week_tasks"

    id = Column(Integer, primary_key=True, index=True)
    week_plan_id = Column(Integer, ForeignKey("wp_week_plans.id"), nullable=False)
    description = Column(Text, nullable=False)
    assigned_emp_id = Column(Integer, ForeignKey("employees.emp_id"), nullable=True)
    status = Column(String(50), nullable=False, default="Planned")
    effort_hours = Column(Float, nullable=True)

    week_plan = relationship("WorkPackageWeekPlan", back_populates="tasks")
    assignee = relationship("Employee", foreign_keys=[assigned_emp_id])
    dependencies = relationship(
        "WorkPackageTaskDependency",
        foreign_keys="WorkPackageTaskDependency.task_id",
        cascade="all, delete-orphan",
    )


class WorkPackageTaskDependency(Base):
    __tablename__ = "wp_task_dependencies"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("wp_week_tasks.id"), nullable=False)
    depends_on_task_id = Column(Integer, ForeignKey("wp_week_tasks.id"), nullable=False)
