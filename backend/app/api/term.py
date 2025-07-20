from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Term
from ..schemas import TermResponse
import random

router = APIRouter()

@router.get("/random", response_model=TermResponse)
def get_random_term(db: Session = Depends(get_db)):
    terms = db.query(Term).all()
    if not terms:
        raise HTTPException(status_code=404, detail="No terms found")
    term = random.choice(terms)
    return term

@router.get("/all", response_model=list[TermResponse])
def get_all_terms(db: Session = Depends(get_db)):
    return db.query(Term).all() 