from app.database import engine
from app.models import Base

def update_database():
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created/updated successfully!")
    except Exception as e:
        print(f"Error updating database: {e}")

if __name__ == "__main__":
    update_database() 