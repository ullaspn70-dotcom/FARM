import os
import uuid
from pathlib import Path

import aiofiles
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import ValidationAppError
from app.models.file_upload import FileUpload


async def save_upload_file(db, upload: UploadFile) -> FileUpload:
    if not upload.filename:
        raise ValidationAppError("File name is required.")

    content = await upload.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise ValidationAppError(f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit.")

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(upload.filename).suffix
    stored_name = f"{uuid.uuid4().hex}{ext}"
    file_path = upload_dir / stored_name

    async with aiofiles.open(file_path, "wb") as out_file:
        await out_file.write(content)

    file_url = f"{settings.STORAGE_BASE_URL.rstrip('/')}/{stored_name}"
    record = FileUpload(
        file_name=upload.filename,
        file_path=str(file_path),
        file_url=file_url,
        mime_type=upload.content_type,
        size_bytes=len(content),
    )
    db.add(record)
    db.flush()
    return record
