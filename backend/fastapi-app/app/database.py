import os
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# 🔥 Retry DB connection
for i in range(10):
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        conn = engine.connect()
        conn.close()
        print("✅ Connected to MySQL")
        break
    except Exception as e:
        print(f"❌ DB not ready: {e}")
        time.sleep(3)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()