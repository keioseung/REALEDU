from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from .database import Base

class AIInfo(Base):
    __tablename__ = "ai_info"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    info1_title = Column(Text)
    info1_content = Column(Text)
    info1_terms = Column(Text)  # JSON 직렬화된 용어 리스트
    info2_title = Column(Text)
    info2_content = Column(Text)
    info2_terms = Column(Text)  # JSON 직렬화된 용어 리스트
    info3_title = Column(Text)
    info3_content = Column(Text)
    info3_terms = Column(Text)  # JSON 직렬화된 용어 리스트
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Quiz(Base):
    __tablename__ = "quiz"
    
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, index=True)
    question = Column(Text)
    option1 = Column(Text)
    option2 = Column(Text)
    option3 = Column(Text)
    option4 = Column(Text)
    correct = Column(Integer)
    explanation = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    date = Column(String, index=True)
    learned_info = Column(Text)  # JSON 직렬화 문자열
    stats = Column(Text)         # JSON 직렬화 문자열
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Prompt(Base):
    __tablename__ = "prompt"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text)
    category = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BaseContent(Base):
    __tablename__ = "base_content"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text)
    category = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now()) 

class Term(Base):
    __tablename__ = "term"
    id = Column(Integer, primary_key=True, index=True)
    term = Column(String, unique=True, index=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now()) 