from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.jzfwqunitwpczhartwdh:rhdqngo123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres")

engine = create_engine(DATABASE_URL)

def migrate_database():
    """데이터베이스 스키마를 마이그레이션합니다."""
    with engine.connect() as conn:
        try:
            # user_progress 테이블에 created_at 컬럼 추가
            conn.execute(text("""
                ALTER TABLE user_progress 
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            """))
            
            # ai_info 테이블에 created_at 컬럼 추가
            conn.execute(text("""
                ALTER TABLE ai_info 
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            """))
            
            # quiz 테이블에 created_at 컬럼 추가
            conn.execute(text("""
                ALTER TABLE quiz 
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            """))
            
            # prompt 테이블에 created_at 컬럼 추가
            conn.execute(text("""
                ALTER TABLE prompt 
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            """))
            
            # base_content 테이블에 created_at 컬럼 추가
            conn.execute(text("""
                ALTER TABLE base_content 
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            """))
            
            # term 테이블에 created_at 컬럼 추가
            conn.execute(text("""
                ALTER TABLE term 
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            """))
            
            conn.commit()
            print("✅ 데이터베이스 마이그레이션이 성공적으로 완료되었습니다!")
            
        except Exception as e:
            print(f"❌ 마이그레이션 중 오류 발생: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate_database() 