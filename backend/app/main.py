from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import ai_info, quiz, prompt, base_content, term

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_info.router, prefix="/api/ai-info")
app.include_router(quiz.router, prefix="/api/quiz")
app.include_router(prompt.router, prefix="/api/prompt")
app.include_router(base_content.router, prefix="/api/base-content")
app.include_router(term.router, prefix="/api/term") 