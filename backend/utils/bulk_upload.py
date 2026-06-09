import io
import pandas as pd
from sqlalchemy.orm import Session
from fastapi import HTTPException

from models.employee import Employee


def process_bulk_upload(db: Session, content: bytes, filename: str) -> dict:
    try:
        if filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(content), engine="openpyxl")
        elif filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Only .xlsx and .csv files are supported")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot read file: {e}")

    df.columns = [str(c).lower().strip().replace(" ", "_") for c in df.columns]

    required = {"first_name", "last_name", "email"}
    missing = required - set(df.columns)
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {sorted(missing)}")

    results = {"created": 0, "updated": 0, "errors": []}

    for idx, row in df.iterrows():
        try:
            email = str(row.get("email", "")).strip()
            first_name = str(row.get("first_name", "")).strip()
            last_name = str(row.get("last_name", "")).strip()

            if not email or email == "nan":
                results["errors"].append(f"Row {idx + 2}: missing email")
                continue
            if not first_name or not last_name:
                results["errors"].append(f"Row {idx + 2}: missing first_name or last_name")
                continue

            mobile = str(row.get("mobile_number", "") or "").strip() or None
            native = str(row.get("native_place", "") or "").strip() or None
            exp_raw = row.get("years_of_experience", 0)
            exp = float(exp_raw) if pd.notna(exp_raw) else 0.0
            blood_group = str(row.get("blood_group", "") or "").strip().upper() or None

            existing = db.query(Employee).filter(Employee.email == email).first()
            if existing:
                existing.first_name = first_name
                existing.last_name = last_name
                existing.mobile_number = mobile
                existing.native_place = native
                existing.years_of_experience = exp
                existing.blood_group = blood_group
                results["updated"] += 1
            else:
                db.add(Employee(
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    mobile_number=mobile,
                    native_place=native,
                    years_of_experience=exp,
                    blood_group=blood_group,
                ))
                results["created"] += 1

        except Exception as e:
            db.rollback()
            results["errors"].append(f"Row {idx + 2}: {e}")
            continue

    db.commit()
    return results
