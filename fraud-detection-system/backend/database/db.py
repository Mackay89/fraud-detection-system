from sqlalchemy import create_engine, Column, Integer, Float, Boolean, String, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/frauddb")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=True)
    amount = Column(Float, nullable=False)
    time_of_day = Column(Float, nullable=False)
    transaction_type = Column(Integer, nullable=False)  # 0=online, 1=pos, 2=atm
    merchant_category = Column(Integer, nullable=False)
    distance_from_home = Column(Float, nullable=False)
    is_fraud = Column(Boolean, nullable=False)
    confidence = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False)
    action = Column(String(200), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
