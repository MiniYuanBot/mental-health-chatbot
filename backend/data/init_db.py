#!/usr/bin/env python3
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent
DB_PATH = DATA_DIR / "mental_health_demo.sqlite3"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db(db_path: Path = DB_PATH) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                student_id TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                nickname TEXT NOT NULL,
                auth_token TEXT UNIQUE,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_token ON users(auth_token)")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'ai')),
                content TEXT NOT NULL,
                emotion TEXT,
                score INTEGER,
                risk_level TEXT CHECK(risk_level IS NULL OR risk_level IN ('low', 'medium', 'high')),
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_chat_user_created ON chat_messages(user_id, created_at)")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS emotion_records (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                emotion_type TEXT NOT NULL,
                score INTEGER NOT NULL,
                risk_level TEXT NOT NULL CHECK(risk_level IN ('low', 'medium', 'high')),
                note TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_emotion_user_created ON emotion_records(user_id, created_at)")


if __name__ == "__main__":
    init_db()
    print(f"Initialized SQLite database at {DB_PATH}")