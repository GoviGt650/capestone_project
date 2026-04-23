from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import DATABASE_URL
import time

engine = None

# 🔥 Retry logic (IMPORTANT)
for i in range(10):
    try:
        print(f"🔄 Trying DB connection... {i+1}")
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        conn = engine.connect()
        conn.close()
        print("✅ Connected to MySQL")
        break
    except Exception as e:
        print("❌ DB not ready:", e)
        time.sleep(3)

# ❌ If still not connected
if engine is None:
    raise Exception("❌ Could not connect to MySQL")

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()