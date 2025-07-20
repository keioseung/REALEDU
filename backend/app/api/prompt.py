from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Prompt
from ..schemas import PromptCreate, PromptResponse

router = APIRouter()

@router.get("/", response_model=List[PromptResponse])
def get_all_prompts(db: Session = Depends(get_db)):
    prompts = db.query(Prompt).order_by(Prompt.created_at.desc()).all()
    return prompts

@router.post("/", response_model=PromptResponse)
def add_prompt(prompt_data: PromptCreate, db: Session = Depends(get_db)):
    from datetime import datetime
    
    db_prompt = Prompt(
        title=prompt_data.title,
        content=prompt_data.content,
        category=prompt_data.category,
        created_at=datetime.now()
    )
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

@router.put("/{prompt_id}", response_model=PromptResponse)
def update_prompt(prompt_id: int, prompt_data: PromptCreate, db: Session = Depends(get_db)):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    prompt.title = prompt_data.title
    prompt.content = prompt_data.content
    prompt.category = prompt_data.category
    
    db.commit()
    db.refresh(prompt)
    return prompt

@router.delete("/{prompt_id}")
def delete_prompt(prompt_id: int, db: Session = Depends(get_db)):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    db.delete(prompt)
    db.commit()
    return {"message": "Prompt deleted successfully"}

@router.get("/category/{category}", response_model=List[PromptResponse])
def get_prompts_by_category(category: str, db: Session = Depends(get_db)):
    prompts = db.query(Prompt).filter(Prompt.category == category).all()
    return prompts 

@router.options("/")
def options_prompt():
    return Response(status_code=200) 