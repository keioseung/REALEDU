from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import BaseContent
from ..schemas import BaseContentCreate, BaseContentResponse

router = APIRouter()

@router.get("/", response_model=List[BaseContentResponse])
def get_all_base_contents(db: Session = Depends(get_db)):
    contents = db.query(BaseContent).order_by(BaseContent.created_at.desc()).all()
    return contents

@router.options("/")
def options_base_content():
    return Response(status_code=200)

@router.post("/", response_model=BaseContentResponse)
def add_base_content(content_data: BaseContentCreate, db: Session = Depends(get_db)):
    from datetime import datetime
    
    db_content = BaseContent(
        title=content_data.title,
        content=content_data.content,
        category=content_data.category,
        created_at=datetime.now()
    )
    db.add(db_content)
    db.commit()
    db.refresh(db_content)
    return db_content

@router.put("/{content_id}", response_model=BaseContentResponse)
def update_base_content(content_id: int, content_data: BaseContentCreate, db: Session = Depends(get_db)):
    content = db.query(BaseContent).filter(BaseContent.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Base content not found")
    
    content.title = content_data.title
    content.content = content_data.content
    content.category = content_data.category
    
    db.commit()
    db.refresh(content)
    return content

@router.delete("/{content_id}")
def delete_base_content(content_id: int, db: Session = Depends(get_db)):
    content = db.query(BaseContent).filter(BaseContent.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Base content not found")
    
    db.delete(content)
    db.commit()
    return {"message": "Base content deleted successfully"}

@router.get("/category/{category}", response_model=List[BaseContentResponse])
def get_base_contents_by_category(category: str, db: Session = Depends(get_db)):
    contents = db.query(BaseContent).filter(BaseContent.category == category).all()
    return contents 