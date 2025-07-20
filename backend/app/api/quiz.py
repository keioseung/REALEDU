from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Quiz
from ..schemas import QuizCreate, QuizResponse

router = APIRouter()

@router.get("/topics", response_model=List[str])
def get_all_quiz_topics(db: Session = Depends(get_db)):
    topics = list(set([row.topic for row in db.query(Quiz).all()]))
    return topics

@router.get("/{topic}", response_model=List[QuizResponse])
def get_quiz_by_topic(topic: str, db: Session = Depends(get_db)):
    quizzes = db.query(Quiz).filter(Quiz.topic == topic).all()
    return quizzes

@router.post("/", response_model=QuizResponse)
def add_quiz(quiz_data: QuizCreate, db: Session = Depends(get_db)):
    db_quiz = Quiz(
        topic=quiz_data.topic,
        question=quiz_data.question,
        option1=quiz_data.option1,
        option2=quiz_data.option2,
        option3=quiz_data.option3,
        option4=quiz_data.option4,
        correct=quiz_data.correct,
        explanation=quiz_data.explanation
    )
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz

@router.put("/{quiz_id}", response_model=QuizResponse)
def update_quiz(quiz_id: int, quiz_data: QuizCreate, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    quiz.topic = quiz_data.topic
    quiz.question = quiz_data.question
    quiz.option1 = quiz_data.option1
    quiz.option2 = quiz_data.option2
    quiz.option3 = quiz_data.option3
    quiz.option4 = quiz_data.option4
    quiz.correct = quiz_data.correct
    quiz.explanation = quiz_data.explanation
    
    db.commit()
    db.refresh(quiz)
    return quiz

@router.delete("/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted successfully"}

@router.options("/")
def options_quiz():
    return Response(status_code=200)

@router.get("/generate/{topic}")
def generate_quiz(topic: str):
    """주제에 따른 퀴즈를 생성합니다."""
    # 간단한 퀴즈 생성 로직 (실제로는 더 복잡한 로직이 필요)
    quiz_templates = {
        "AI": {
            "question": "인공지능(AI)의 정의로 가장 적절한 것은?",
            "options": [
                "컴퓨터가 인간처럼 생각하는 기술",
                "인간의 지능을 모방하는 컴퓨터 시스템",
                "자동화된 기계 시스템",
                "데이터 처리 프로그램"
            ],
            "correct": 1,
            "explanation": "AI는 인간의 지능을 모방하여 학습하고 추론하는 컴퓨터 시스템입니다."
        },
        "머신러닝": {
            "question": "머신러닝의 주요 특징은?",
            "options": [
                "사전에 정의된 규칙만 사용",
                "데이터로부터 패턴을 학습",
                "인간의 개입이 필요 없음",
                "결과가 항상 정확함"
            ],
            "correct": 1,
            "explanation": "머신러닝은 데이터로부터 패턴을 학습하여 예측이나 분류를 수행합니다."
        }
    }
    
    if topic in quiz_templates:
        return quiz_templates[topic]
    else:
        return {
            "question": f"{topic}에 대한 기본 퀴즈",
            "options": ["옵션 1", "옵션 2", "옵션 3", "옵션 4"],
            "correct": 0,
            "explanation": "기본 설명입니다."
        } 