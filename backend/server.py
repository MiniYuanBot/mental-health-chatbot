#!/usr/bin/env python3
import hashlib
import json
import secrets
import sqlite3
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "mental_health_demo.sqlite3"
HOST = "127.0.0.1"
PORT = 8000
ALLOWED_ORIGINS = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://0.0.0.0:5173",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def is_pku_email(email: str) -> bool:
    normalized = email.strip().lower()
    return normalized.endswith("@pku.edu.cn") or normalized.endswith("@stu.pku.edu.cn")


def hash_password(password: str, salt: str) -> str:
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000)
    return digest.hex()


def connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                student_id TEXT NOT NULL,
                nickname TEXT NOT NULL DEFAULT '匿名同学',
                password_hash TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                auth_token TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_token ON users(auth_token)")


def user_payload(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "email": row["email"],
        "studentId": row["student_id"],
        "nickname": row["nickname"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


class ApiError(Exception):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


class Handler(BaseHTTPRequestHandler):
    server_version = "PKUMentalHealthDemo/0.1"

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[{now_iso()}] {self.address_string()} {format % args}")

    def end_headers(self) -> None:
        origin = self.headers.get("Origin")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
        else:
            self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:5173")
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Credentials", "false")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:
        self.handle_request()

    def do_POST(self) -> None:
        self.handle_request()

    def do_PUT(self) -> None:
        self.handle_request()

    def handle_request(self) -> None:
        try:
            parsed = urlparse(self.path)
            if parsed.path == "/api/health" and self.command == "GET":
                self.write_json({"ok": True, "database": str(DB_PATH)})
                return
            if parsed.path == "/api/signup" and self.command == "POST":
                self.signup()
                return
            if parsed.path == "/api/login" and self.command == "POST":
                self.login()
                return
            if parsed.path == "/api/profile" and self.command == "GET":
                self.get_profile()
                return
            if parsed.path == "/api/profile" and self.command == "PUT":
                self.update_profile()
                return
            raise ApiError(404, "接口不存在。")
        except ApiError as error:
            self.write_json({"error": error.message}, error.status)
        except Exception as error:
            print(f"Unexpected error: {error}")
            self.write_json({"error": "服务器内部错误。"}, 500)

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            raise ApiError(400, "请求体必须是 JSON。")
        if not isinstance(payload, dict):
            raise ApiError(400, "请求体必须是 JSON 对象。")
        return payload

    def write_json(self, payload: dict[str, Any], status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def require_user(self) -> sqlite3.Row:
        auth_header = self.headers.get("Authorization", "")
        token = auth_header.removeprefix("Bearer ").strip()
        if not token:
            raise ApiError(401, "缺少登录凭证。")
        with connect() as conn:
            row = conn.execute("SELECT * FROM users WHERE auth_token = ?", (token,)).fetchone()
        if row is None:
            raise ApiError(401, "登录已失效，请重新登录。")
        return row

    def signup(self) -> None:
        payload = self.read_json()
        email = str(payload.get("email", "")).strip().lower()
        student_id = str(payload.get("studentId", "")).strip()
        password = str(payload.get("password", ""))
        nickname = str(payload.get("nickname", "")).strip() or "匿名同学"

        if not is_pku_email(email):
            raise ApiError(400, "邮箱必须以 @pku.edu.cn 或 @stu.pku.edu.cn 结尾。")
        if not student_id:
            raise ApiError(400, "学号不能为空。")
        if len(password) < 6:
            raise ApiError(400, "密码至少需要 6 位。")
        if len(nickname) > 24:
            raise ApiError(400, "昵称不能超过 24 个字符。")

        user_id = secrets.token_hex(12)
        token = secrets.token_urlsafe(32)
        salt = secrets.token_hex(16)
        password_hash = hash_password(password, salt)
        timestamp = now_iso()

        try:
            with connect() as conn:
                conn.execute(
                    """
                    INSERT INTO users (
                        id, email, student_id, nickname, password_hash,
                        password_salt, auth_token, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        user_id,
                        email,
                        student_id,
                        nickname,
                        password_hash,
                        salt,
                        token,
                        timestamp,
                        timestamp,
                    ),
                )
                row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        except sqlite3.IntegrityError:
            raise ApiError(409, "该邮箱已注册，请直接登录。")

        self.write_json({"token": token, "user": user_payload(row)}, 201)

    def login(self) -> None:
        payload = self.read_json()
        email = str(payload.get("email", "")).strip().lower()
        password = str(payload.get("password", ""))

        if not email or not password:
            raise ApiError(400, "邮箱和密码不能为空。")

        with connect() as conn:
            row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            if row is None:
                raise ApiError(401, "邮箱或密码错误。")
            password_hash = hash_password(password, row["password_salt"])
            if not secrets.compare_digest(password_hash, row["password_hash"]):
                raise ApiError(401, "邮箱或密码错误。")
            token = secrets.token_urlsafe(32)
            timestamp = now_iso()
            conn.execute(
                "UPDATE users SET auth_token = ?, updated_at = ? WHERE id = ?",
                (token, timestamp, row["id"]),
            )
            updated = conn.execute("SELECT * FROM users WHERE id = ?", (row["id"],)).fetchone()

        self.write_json({"token": token, "user": user_payload(updated)})

    def get_profile(self) -> None:
        row = self.require_user()
        self.write_json({"user": user_payload(row)})

    def update_profile(self) -> None:
        row = self.require_user()
        payload = self.read_json()
        nickname = str(payload.get("nickname", "")).strip() or "匿名同学"
        if len(nickname) > 24:
            raise ApiError(400, "昵称不能超过 24 个字符。")

        with connect() as conn:
            conn.execute(
                "UPDATE users SET nickname = ?, updated_at = ? WHERE id = ?",
                (nickname, now_iso(), row["id"]),
            )
            updated = conn.execute("SELECT * FROM users WHERE id = ?", (row["id"],)).fetchone()

        self.write_json({"user": user_payload(updated)})


def main() -> None:
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Backend API running at http://{HOST}:{PORT}")
    print(f"SQLite database: {DB_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
