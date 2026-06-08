# HR Management Application — Project Context

## Overview

Full-stack HR Management System built with FastAPI (Python) backend and React TypeScript frontend.

- **User:** Sanjib Pal Chaudhuri (sanjib.p@tcs.com)
- **Working Directory:** `c:\Code\HRApp`
- **Date Started:** 2026-06-08

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Material UI v5, Axios, React Router v6, Vite |
| Backend | FastAPI, SQLAlchemy ORM, Pydantic v2, Uvicorn |
| Database | SQLite (`hrapp.db`) — file-based, lives in `backend/` |
| Bulk Upload | pandas + openpyxl |

---

## Project Structure

```
c:\Code\HRApp\
├── README.md                        # Setup & run instructions
├── CONTEXT.md                       # This file
├── backend/
│   ├── main.py                      # FastAPI app, CORS, lifespan seed
│   ├── requirements.txt             # Python dependencies (no hard version pins)
│   ├── hrapp.db                     # SQLite database (auto-created on first run)
│   ├── .env/                        # Python virtual environment
│   ├── database/
│   │   ├── database.py              # Engine, Base, SessionLocal, get_db
│   │   ├── __init__.py              # Re-exports from database.py
│   │   └── session.py               # Backward-compat re-export of database.py
│   ├── models/
│   │   ├── employee.py              # Employee ORM model (emp_id PK)
│   │   ├── role.py                  # Role + EmployeeRole models
│   │   ├── supervisor.py            # SupervisorMapping model
│   │   ├── competency.py            # Competency + EmployeeCompetency models
│   │   ├── employee_role.py         # Re-export shim → role.py
│   │   ├── supervisor_mapping.py    # Re-export shim → supervisor.py
│   │   ├── employee_competency.py   # Re-export shim → competency.py
│   │   └── __init__.py              # Imports all models (required for create_all)
│   ├── schemas/
│   │   ├── employee.py              # EmployeeCreate, EmployeeUpdate, EmployeeOut, EmployeeListResponse
│   │   ├── role.py                  # RoleCreate, RoleOut, RoleAssign, EmployeeRoleOut
│   │   ├── supervisor.py            # SupervisorAssign, SupervisorMappingOut
│   │   ├── competency.py            # CompetencyCreate, CompetencyOut, CompetencyAssign
│   │   └── __init__.py
│   ├── routers/
│   │   ├── employees.py             # CRUD endpoints for /employees/
│   │   ├── roles.py                 # /roles/ endpoints
│   │   ├── supervisor.py            # /supervisor/ endpoints
│   │   ├── competencies.py          # /competencies/ endpoints
│   │   ├── upload.py                # POST /employees/upload (bulk)
│   │   └── __init__.py
│   ├── services/
│   │   ├── employee_service.py      # Employee business logic
│   │   ├── role_service.py          # Role business logic
│   │   ├── supervisor_service.py    # Supervisor mapping logic
│   │   └── competency_service.py    # Competency logic
│   └── utils/
│       └── bulk_upload.py           # pandas-based .xlsx / .csv parser
└── frontend/
    ├── package.json
    ├── vite.config.ts               # Dev server port 3000, proxy /api → :8000
    ├── tsconfig.json
    ├── index.html
    ├── .env                         # VITE_API_URL=http://localhost:8000
    └── src/
        ├── App.tsx                  # Router + MUI ThemeProvider
        ├── main.tsx
        ├── index.css
        ├── types/index.ts           # All TypeScript interfaces
        ├── services/
        │   ├── api.ts               # Axios instance with error interceptor
        │   ├── employeeService.ts
        │   ├── roleService.ts
        │   ├── supervisorService.ts
        │   └── competencyService.ts
        ├── components/
        │   └── Layout.tsx           # MUI Drawer sidebar + AppBar shell
        └── pages/
            ├── EmployeeList.tsx     # Table with search, pagination, edit/delete
            ├── EmployeeForm.tsx     # Add / Edit employee form
            ├── BulkUpload.tsx       # Drag-and-drop .xlsx/.csv upload
            ├── RoleAssignment.tsx   # Assign roles to employees
            ├── SupervisorMapping.tsx # Assign supervisors, view history
            └── CompetencyManagement.tsx # Create and assign competencies
```

---

## Database Schema

| Table | Key Columns |
|---|---|
| `employees` | `emp_id` (PK), `first_name`, `last_name`, `email` (unique), `mobile_number`, `native_place`, `years_of_experience` |
| `roles` | `id`, `name` (unique) |
| `employee_roles` | `id`, `emp_id` (FK), `role_id` (FK), `assigned_at` — one role per employee |
| `supervisor_mappings` | `id`, `employee_emp_id` (FK), `supervisor_emp_id` (FK), `start_date`, `end_date` (nullable = current) |
| `competencies` | `id`, `name` (unique), `category` |
| `employee_competencies` | `id`, `emp_id` (FK), `competency_id` (FK) — many-to-many |

**Auto-seeded on startup:**
- Roles: Platform Owner, Supervisor, Team Member
- Competencies: Frontend - Angular, Frontend - ReactJs, Backend - Python, Backend - Java, Backend - Node.js, UX, Generative AI, Agentic AI, DevOps, Database - SQL

---

## API Reference

| Method | Path | Description |
|---|---|---|
| GET | `/` | Health / welcome |
| GET | `/health` | Health check |
| POST | `/employees/` | Create employee |
| GET | `/employees/` | List with pagination (`page`, `page_size` up to 1000) & `search` |
| GET | `/employees/{id}` | Get by emp_id |
| PUT | `/employees/{id}` | Update |
| DELETE | `/employees/{id}` | Delete |
| POST | `/employees/upload` | Bulk upload (.xlsx or .csv) |
| GET | `/roles/` | List all roles |
| POST | `/roles/` | Create role |
| POST | `/roles/assign` | Assign role to employee (replaces existing) |
| GET | `/roles/employee/{id}` | Get current role of employee |
| POST | `/supervisor/assign` | Assign supervisor (closes previous open mapping) |
| GET | `/supervisor/{id}` | Full supervisor history for employee |
| GET | `/supervisor/team/{id}` | Current direct reports of a supervisor |
| GET | `/competencies/` | List all competencies |
| POST | `/competencies/` | Create competency |
| POST | `/competencies/assign` | Assign competencies to employee (additive) |
| GET | `/competencies/{id}` | Employee's assigned competencies |
| DELETE | `/competencies/{emp_id}/{comp_id}` | Remove a competency from employee |

---

## Running the Application

### Backend
```bash
cd c:\Code\HRApp\backend
.env\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
API Docs: http://localhost:8000/docs

### Frontend
```bash
cd c:\Code\HRApp\frontend
npm run dev
```
App: http://localhost:3000

---

## Bugs Fixed

### 1. Python 3.13 incompatibility (`pydantic-core` build failure)
- **Problem:** `requirements.txt` pinned `pydantic==2.7.1` which requires `pydantic-core==2.18.2`. That package uses PyO3 0.21.1 which only supports Python ≤ 3.12 and has no pre-built wheel for Python 3.13. Pip tried to compile from source and failed.
- **Fix:** Changed `pydantic[email]==2.7.1` → `pydantic[email]>=2.10.0` in `requirements.txt`. Pydantic 2.10+ ships pre-built wheels for Python 3.13.

### 2. Employee dropdown empty on Role/Supervisor/Competency pages
- **Problem:** `RoleAssignment`, `SupervisorMapping`, and `CompetencyManagement` pages all call `employeeService.getAll(1, 200)`. The backend had `page_size` capped at `le=100`, so FastAPI returned a 422 validation error. There was no `.catch()` handler on those calls, so the error was silently dropped and the employee list stayed empty.
- **Fix (backend):** `routers/employees.py` — raised `le=100` → `le=1000`.
- **Fix (frontend):** Added `.catch((e) => setError(...))` on the initial employee-load `useEffect` in all three pages so errors surface visibly.

---

## Key Design Decisions

- **Pydantic v2** — uses `ConfigDict(from_attributes=True)` (not the v1 `orm_mode = True`)
- **`full_name`** is a `@property` on the SQLAlchemy model (not stored), computed as `f"{first_name} {last_name}"`; routers manually build dicts to include it in responses
- **`emp_id`** is the primary key (not `id`) to match HR domain naming
- **Supervisor history** — assigning a new supervisor sets `end_date = today` on the previous open mapping rather than deleting it, preserving full history
- **Role assignment** — one role per employee; assigning a new role deletes the old `employee_roles` row first
- **Competency assignment** — additive (does not clear existing); individual removal via DELETE endpoint
- **Bulk upload** — email is the unique key; existing records are updated, new ones inserted
- **Re-export shims** — `employee_role.py`, `supervisor_mapping.py`, `employee_competency.py` are kept as thin re-exports from canonical files for backward compatibility with the original partial code

---

## Environment Notes

- **OS:** Windows 11 Enterprise
- **Python:** 3.13 (via `.env` venv inside `backend/`)
- **Node:** 18+
- **Virtual env path:** `c:\Code\HRApp\backend\.env\`
- **SQLite DB path:** `c:\Code\HRApp\backend\hrapp.db`
- **Frontend port:** 3000 (Vite)
- **Backend port:** 8000 (Uvicorn)
