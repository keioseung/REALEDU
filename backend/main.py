from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import ai_info, quiz, user_progress, prompt, base_content
from app.database import engine
from app.models import Base

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Mastery Hub API",
    description="AI 학습 플랫폼을 위한 REST API",
    version="1.0.0"
)

# CORS 설정 (운영 도메인으로 수정)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(ai_info.router, prefix="/api/ai-info", tags=["AI Info"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["Quiz"])
app.include_router(user_progress.router, prefix="/api/user-progress", tags=["User Progress"])
app.include_router(prompt.router, prefix="/api/prompt", tags=["Prompt"])
app.include_router(base_content.router, prefix="/api/base-content", tags=["Base Content"])

@app.get("/")
async def root():
    return {"message": "AI Mastery Hub API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
