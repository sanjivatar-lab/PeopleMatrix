from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from database.database import get_db
from utils.bulk_upload import process_bulk_upload

router = APIRouter()


@router.post("/upload")
async def bulk_upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    return process_bulk_upload(db, content, file.filename or "")
