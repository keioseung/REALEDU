from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# AI Info Schemas
class TermItem(BaseModel):
    term: str
    description: str

class AIInfoItem(BaseModel):
    title: str
    content: str
    terms: Optional[List[TermItem]] = []

class AIInfoCreate(BaseModel):
    date: str
    infos: List[AIInfoItem]

class AIInfoResponse(BaseModel):
    id: int
    date: str
    infos: List[AIInfoItem]
    created_at: str

    class Config:
        from_attributes = True

# Quiz Schemas
class QuizCreate(BaseModel):
    topic: str
    question: str
    option1: str
    option2: str
    option3: str
    option4: str
    correct: int
    explanation: str

class QuizResponse(BaseModel):
    id: int
    topic: str
    question: str
    option1: str
    option2: str
    option3: str
    option4: str
    correct: int
    explanation: str
    created_at: datetime

    class Config:
        from_attributes = True

# User Progress Schemas
class UserProgressCreate(BaseModel):
    session_id: str
    date: str
    learned_info: List[int]
    stats: Optional[dict] = None

class UserProgressResponse(BaseModel):
    id: int
    session_id: str
    date: str
    learned_info: List[int]
    stats: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True

# Prompt Schemas
class PromptCreate(BaseModel):
    title: str
    content: str
    category: str

class PromptResponse(BaseModel):
    id: int
    title: str
    content: str
    category: str
    created_at: datetime

    class Config:
        from_attributes = True

# Base Content Schemas
class BaseContentCreate(BaseModel):
    title: str
    content: str
    category: str

class BaseContentResponse(BaseModel):
    id: int
    title: str
    content: str
    category: str
    created_at: str

    class Config:
        from_attributes = True 

# Term Schemas
class TermResponse(BaseModel):
    id: int
    term: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True 