import psycopg2
import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

def fix_database():
    # 데이터베이스 연결 정보
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/ai_mastery_hub')
    
    try:
        # 데이터베이스 연결
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # SQL 스크립트 실행
        sql_commands = [
            "ALTER TABLE ai_info ADD COLUMN IF NOT EXISTS info1_terms TEXT DEFAULT '[]'",
            "ALTER TABLE ai_info ADD COLUMN IF NOT EXISTS info2_terms TEXT DEFAULT '[]'",
            "ALTER TABLE ai_info ADD COLUMN IF NOT EXISTS info3_terms TEXT DEFAULT '[]'",
            "UPDATE ai_info SET info1_terms = '[]' WHERE info1_terms IS NULL",
            "UPDATE ai_info SET info2_terms = '[]' WHERE info2_terms IS NULL",
            "UPDATE ai_info SET info3_terms = '[]' WHERE info3_terms IS NULL"
        ]
        
        for sql in sql_commands:
            print(f"Executing: {sql}")
            cursor.execute(sql)
        
        # 변경사항 커밋
        conn.commit()
        print("Database updated successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    fix_database() 