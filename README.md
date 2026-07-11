# PeopleMatrix — HR Management System

Full-stack HR application built with **FastAPI + SQLite** (backend) and **React 18 + TypeScript + Material UI** (frontend).

---

## Features

### Employee Management
| Feature | Description |
|---|---|
| Employee CRUD | Create, read, update, delete employees with search, pagination, and blood-group filter |
| Bulk Upload | Upload `.xlsx` / `.csv` to insert or update employees in bulk |
| Role Assignment | Assign Platform Owner / Supervisor / Team Member roles |
| Supervisor Mapping | Track current and historical supervisor relationships |
| Competency Management | Assign multiple technical competencies per employee (Frontend, Backend, AI, DevOps, etc.) |

### Work Package Management
| Feature | Description |
|---|---|
| Work Package CRUD | Create and manage work packages with name, description, date range, owners, and status |
| Status Tracking | Colored status pill — Not Started / In Progress / On Hold / At Risk / Completed / Cancelled |
| Team Assignments | Assign team members to a work package with start/end dates |
| Activities | Track activities per work package with To Do / In Progress / Done status |
| Blockers | Log blockers with raised-on / resolved-on dates and Open / Resolved status |
| Week-wise Plan | Define a structured week-by-week execution plan per work package |
| Weekly Goals | Set a sprint-style goal for each week |
| Weekly Tasks | Add tasks per week with assignee, status (Planned / In Progress / Done / Blocked), and effort hours |
| Task Dependencies | Link tasks to their prerequisites; dependency chips are color-coded by status |
| External Dependencies | Free-text field per week to capture external blockers (vendors, other teams, sign-offs) |

### Reports
| Report | Description |
|---|---|
| Work Package Detail | Comprehensive report per WP: KPI cards, activities table, blockers table, team assignments, week-wise execution plan with tasks |
| Unassigned Team Members | Lists team members with no active work package assignment; assign directly from the report |
| Employees Without Supervisor | Lists team members with no supervisor mapping |
| Supervisor Team Summary | Shows each supervisor with their current team count; drill down to view the team |
| Team Members by Competency | Filter team members by one or more competencies |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10+, FastAPI, SQLAlchemy ORM, Pydantic v2, SQLite |
| Frontend | React 18, TypeScript, Vite, Material UI v5, Axios |
| Container | Docker, Docker Compose, Nginx (frontend reverse proxy) |

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- (Optional) **Docker** and **Docker Compose** for containerised deployment

---

## Running Locally

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs: **http://localhost:8000/docs**

### Frontend

```bash
cd frontend

npm install
npm run dev
```

App: **http://localhost:3000**

> The Vite dev server proxies all `/api/*` requests to `http://127.0.0.1:8000`, so no CORS configuration is needed during development.

---

## Running with Docker

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend (Nginx) | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## Project Structure

```
PeopleMatrix/
├── backend/
│   ├── main.py                        # FastAPI app, CORS, lifespan migrations & seed
│   ├── requirements.txt
│   ├── database/
│   │   └── database.py                # SQLAlchemy engine, Base, get_db
│   ├── models/
│   │   ├── employee.py                # Employee ORM model
│   │   ├── role.py                    # Role + EmployeeRole
│   │   ├── supervisor.py              # SupervisorMapping
│   │   ├── competency.py              # Competency + EmployeeCompetency
│   │   └── work_package.py            # WorkPackage, Assignments, Activities, Blockers,
│   │                                  # WeekPlans, WeekTasks, TaskDependencies
│   ├── schemas/                       # Pydantic v2 request/response schemas
│   ├── routers/                       # FastAPI route handlers
│   │   ├── employees.py
│   │   ├── roles.py
│   │   ├── supervisor.py
│   │   ├── competencies.py
│   │   ├── work_packages.py           # WP + assignments + activities + blockers + week plans
│   │   ├── reports.py                 # All report endpoints
│   │   └── upload.py                  # Bulk upload
│   ├── services/                      # Business logic layer
│   └── utils/
│       └── bulk_upload.py             # pandas-based Excel/CSV parser
├── frontend/
│   ├── src/
│   │   ├── App.tsx                    # Routes
│   │   ├── components/
│   │   │   └── Layout.tsx             # MUI Drawer + AppBar shell
│   │   ├── pages/
│   │   │   ├── EmployeeList.tsx
│   │   │   ├── EmployeeForm.tsx
│   │   │   ├── BulkUpload.tsx
│   │   │   ├── RoleAssignment.tsx
│   │   │   ├── SupervisorMapping.tsx
│   │   │   ├── CompetencyManagement.tsx
│   │   │   ├── WorkPackageList.tsx
│   │   │   ├── WorkPackageForm.tsx
│   │   │   ├── WorkPackageAssignments.tsx
│   │   │   ├── WorkPackageStatusModal.tsx
│   │   │   ├── WorkPackageWeekPlanModal.tsx
│   │   │   ├── ReportsDashboard.tsx
│   │   │   ├── WorkPackageReport.tsx
│   │   │   ├── UnassignedTeamMembers.tsx
│   │   │   ├── EmployeesWithoutSupervisor.tsx
│   │   │   ├── SupervisorTeamSummary.tsx
│   │   │   └── CompetencyReport.tsx
│   │   ├── services/                  # Axios API wrappers
│   │   └── types/                     # TypeScript interfaces
│   ├── .env.development               # VITE_API_URL=/api (dev proxy)
│   ├── vite.config.ts                 # Dev + preview proxy → localhost:8000
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## API Reference

### Employees
| Method | Path | Description |
|---|---|---|
| GET | `/employees/` | List with pagination, search, blood-group filter |
| POST | `/employees/` | Create employee |
| GET | `/employees/{id}` | Get by ID |
| PUT | `/employees/{id}` | Update employee |
| DELETE | `/employees/{id}` | Delete employee |
| POST | `/employees/upload` | Bulk upload (xlsx / csv) |
| GET | `/employees/{id}/wp-assignments` | All WP assignments for an employee |

### Roles
| Method | Path | Description |
|---|---|---|
| GET | `/roles/` | List all roles |
| POST | `/roles/assign` | Assign role to employee |
| GET | `/roles/employee/{id}` | Get employee's current role |
| GET | `/roles/potential-owners` | Employees eligible to own a work package |

### Supervisors
| Method | Path | Description |
|---|---|---|
| POST | `/supervisor/assign` | Assign supervisor |
| GET | `/supervisor/{id}` | Supervisor history for employee |
| GET | `/supervisor/team/{id}` | Current team under a supervisor |

### Competencies
| Method | Path | Description |
|---|---|---|
| GET | `/competencies/` | List all competencies |
| POST | `/competencies/` | Create competency |
| POST | `/competencies/assign` | Assign competencies to employee |
| GET | `/competencies/{emp_id}` | Competencies for employee |
| DELETE | `/competencies/{emp_id}/{comp_id}` | Remove competency from employee |

### Work Packages
| Method | Path | Description |
|---|---|---|
| GET | `/work-packages/` | List all work packages |
| POST | `/work-packages/` | Create work package |
| GET | `/work-packages/{id}` | Get by ID |
| PUT | `/work-packages/{id}` | Update (name, dates, owners, status) |
| DELETE | `/work-packages/{id}` | Delete |
| GET | `/work-packages/{id}/assignments` | List team assignments |
| POST | `/work-packages/{id}/assignments` | Add team member assignment |
| PUT | `/work-packages/{id}/assignments/{aId}` | Update assignment dates |
| DELETE | `/work-packages/{id}/assignments/{aId}` | Remove assignment |
| GET | `/work-packages/{id}/activities` | List activities |
| POST | `/work-packages/{id}/activities` | Add activity |
| PUT | `/work-packages/{id}/activities/{actId}` | Update activity |
| DELETE | `/work-packages/{id}/activities/{actId}` | Delete activity |
| GET | `/work-packages/{id}/blockers` | List blockers |
| POST | `/work-packages/{id}/blockers` | Add blocker |
| PUT | `/work-packages/{id}/blockers/{bId}` | Update blocker |
| DELETE | `/work-packages/{id}/blockers/{bId}` | Delete blocker |
| GET | `/work-packages/{id}/week-plans` | List week plans |
| POST | `/work-packages/{id}/week-plans` | Upsert week plan (goal + external dependencies) |
| POST | `/work-packages/{id}/week-plans/{pId}/tasks` | Add task to week |
| PUT | `/work-packages/{id}/week-plans/{pId}/tasks/{tId}` | Update task |
| DELETE | `/work-packages/{id}/week-plans/{pId}/tasks/{tId}` | Delete task |

### Reports
| Method | Path | Description |
|---|---|---|
| GET | `/reports/work-package/{id}` | Full WP report: KPIs, team, activities, blockers, week plans |
| GET | `/reports/unassigned-team-members` | Team members with no active WP assignment |
| GET | `/reports/employees-without-supervisor` | Employees with no supervisor |
| GET | `/reports/supervisor-team-summary` | Supervisor headcount summary |
| GET | `/reports/competency-team-members` | Filter employees by competency |

---

## Bulk Upload Template

Columns accepted in the Excel/CSV:

```
first_name, last_name, email, mobile_number, native_place, years_of_experience, blood_group
```

`email` is the unique key — existing records are updated, new ones are inserted.

---

## Database

SQLite file is created automatically at `backend/hr.db` on first run. Schema migrations (new columns) are applied at startup via `ALTER TABLE` — no manual migration step is needed.
