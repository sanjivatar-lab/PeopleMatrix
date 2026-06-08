# HR Management System

Full-stack HR application — FastAPI backend + React TypeScript frontend.

## Features

| Feature | Description |
|---|---|
| Employee CRUD | Create, read, update, delete employees with search & pagination |
| Bulk Upload | Upload `.xlsx` / `.csv` to insert or update employees in bulk |
| Role Management | Assign Platform Owner / Supervisor / Team Member roles |
| Supervisor Mapping | Track current and historical supervisor relationships |
| Competency Management | Assign multiple technical competencies per employee |

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**

---

## Running the Backend

```bash
cd backend

# Create & activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at **http://localhost:8000/docs**

---

## Running the Frontend

```bash
cd frontend

npm install
npm run dev
```

App available at **http://localhost:3000**

---

## Project Structure

```
HRApp/
├── backend/
│   ├── main.py                  # FastAPI app, CORS, lifespan seed
│   ├── requirements.txt
│   ├── database/
│   │   └── database.py          # SQLAlchemy engine + Base + get_db
│   ├── models/
│   │   ├── employee.py          # Employee ORM model
│   │   ├── role.py              # Role + EmployeeRole
│   │   ├── supervisor.py        # SupervisorMapping
│   │   └── competency.py       # Competency + EmployeeCompetency
│   ├── schemas/                 # Pydantic v2 request/response models
│   ├── routers/                 # FastAPI route handlers
│   ├── services/                # Business logic layer
│   └── utils/
│       └── bulk_upload.py       # pandas-based Excel/CSV parser
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   │   └── Layout.tsx       # MUI Drawer + AppBar shell
    │   ├── pages/               # One component per feature page
    │   ├── services/            # Axios API wrappers
    │   └── types/               # TypeScript interfaces
    ├── package.json
    └── vite.config.ts
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| POST | /employees/ | Create employee |
| GET | /employees/ | List with pagination & search |
| GET | /employees/{id} | Get by ID |
| PUT | /employees/{id} | Update |
| DELETE | /employees/{id} | Delete |
| POST | /employees/upload | Bulk upload (xlsx/csv) |
| GET | /roles/ | List roles |
| POST | /roles/assign | Assign role to employee |
| GET | /roles/employee/{id} | Get employee's role |
| POST | /supervisor/assign | Assign supervisor |
| GET | /supervisor/{id} | Supervisor history for employee |
| GET | /supervisor/team/{id} | Current team under a supervisor |
| GET | /competencies/ | List all competencies |
| POST | /competencies/ | Create competency |
| POST | /competencies/assign | Assign competencies to employee |
| GET | /competencies/{id} | Competencies for employee |
| DELETE | /competencies/{emp_id}/{comp_id} | Remove competency from employee |

---

## Bulk Upload Template

Download the CSV template from the app or create one with these columns:

```
first_name, last_name, email, mobile_number, native_place, years_of_experience
```

`email` is the unique key — existing records are updated, new ones are inserted.
