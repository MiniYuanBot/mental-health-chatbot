#!/usr/bin/env python3
import hashlib
import html
import json
import secrets
import sqlite3
import sys
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Callable, Literal, TypeAlias
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

Emotion: TypeAlias = Literal[
    "anxiety",
    "stress",
    "depression",
    "anger",
    "fatigue",
    "loneliness",
    "positive",
    "neutral",
    "crisis",
]
RiskLevel: TypeAlias = Literal["low", "medium", "high"]

KEYWORDS: dict[Emotion, list[str]] = {
    "anxiety": ["焦虑", "担心", "害怕", "紧张", "心慌", "不安", "恐惧", "怕"],
    "stress": ["压力", "作业", "论文", "考试", "复习", "ddl", "deadline", "绩点", "gpa", "科研", "来不及"],
    "depression": ["难过", "伤心", "低落", "沮丧", "崩溃", "没意义", "失眠", "绝望", "撑不住", "想哭"],
    "anger": ["生气", "愤怒", "烦", "讨厌", "气死", "火大", "不爽"],
    "fatigue": ["累", "困", "疲惫", "疲劳", "熬夜", "没睡", "睡不够", "没精神"],
    "loneliness": ["孤独", "孤单", "没人理解", "一个人", "没人陪", "被孤立"],
    "positive": ["开心", "高兴", "顺利", "放松", "谢谢", "好多了", "有希望"],
    "crisis": ["自杀", "不想活", "伤害自己", "自残", "死了算了", "想死", "活不下去", "结束生命"],
    "neutral": [],
}
PRIORITY: list[Emotion] = ["crisis", "depression", "anxiety",
                           "stress", "fatigue", "loneliness", "anger", "positive"]
INTENSIFIERS = ["非常", "特别", "真的", "很", "太", "一直", "完全", "严重", "快要", "快"]
MEDIUM_RISK: set[Emotion] = {"depression", "anxiety", "stress"}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def is_pku_email(email: str) -> bool:
    normalized = email.strip().lower()
    return normalized.endswith("@pku.edu.cn") or normalized.endswith("@stu.pku.edu.cn")


def hash_password(password: str, salt: str) -> str:
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(
        "utf-8"), salt.encode("utf-8"), 160_000)
    return digest.hex()


def connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    sys.path.insert(0, str(DATA_DIR))
    from init_db import init_db as initialize

    initialize(DB_PATH)


def clean_text(value: str, limit: int) -> str:
    text = html.escape(value.strip(), quote=True)
    if len(text) > limit:
        raise ApiError(400, f"输入长度不能超过 {limit} 个字符。")
    return text


def analyze_emotion(text: str) -> dict[str, Any]:
    normalized = "".join(text.lower().split())
    matches: list[tuple[Emotion, int]] = []
    for emotion, keywords in KEYWORDS.items():
        count = sum(1 for keyword in keywords if keyword.lower() in normalized)
        if count > 0:
            matches.append((emotion, count))
    if any(emotion == "crisis" for emotion, _ in matches):
        return {"emotion": "crisis", "score": 10, "risk_level": "high"}
    if not matches:
        return {"emotion": "neutral", "score": 3, "risk_level": "low"}
    matches.sort(
        key=lambda item: (-item[1], PRIORITY.index(item[0]) if item[0] in PRIORITY else 999))
    emotion = matches[0][0]
    has_intensifier = any(keyword in normalized for keyword in INTENSIFIERS)
    base = 4 if emotion == "positive" else 5
    score = min(10, base + matches[0][1] * 2 + int(has_intensifier) +
                int(len(matches) > 1) + int(len(text) > 50))
    risk_level: RiskLevel = "medium" if emotion in MEDIUM_RISK or score >= 8 else "low"
    return {"emotion": emotion, "score": score, "risk_level": risk_level}


def normalize_client_analysis(payload: dict[str, Any], content: str) -> dict[str, Any]:
    fallback = analyze_emotion(content)
    emotion = str(payload.get("emotion", fallback["emotion"])).strip().lower()
    risk_level = str(payload.get("riskLevel", fallback["risk_level"])).strip().lower()
    try:
        score = int(payload.get("score", fallback["score"]))
    except (TypeError, ValueError):
        score = int(fallback["score"])
    if emotion not in KEYWORDS:
        emotion = str(fallback["emotion"])
    if risk_level not in {"low", "medium", "high"}:
        risk_level = str(fallback["risk_level"])
    score = min(10, max(1, score))
    if emotion == "crisis":
        score = 10
        risk_level = "high"
    return {"emotion": emotion, "score": score, "risk_level": risk_level}


def create_reply(analysis: dict[str, Any]) -> str:
    emotion = str(analysis["emotion"])
    replies: dict[str, str] = {
        "crisis": "我很重视你刚才表达的危险信号。请现在立刻联系身边可信任的人、辅导员、学校心理咨询中心或当地紧急求助电话；如果你可能马上伤害自己，请不要独处，尽快前往有人陪伴和能获得帮助的地方。",
        "depression": "这些感受听起来很沉重。你不需要立刻把自己变好，也不需要否定现在的难过。可以先联系一位可信任的人，让对方知道你今天状态不好。",
        "anxiety": "我能感受到你的担心。先慢慢吸气 4 秒、呼气 6 秒，重复几轮；然后把担心写下来，区分哪些是现在能做的，哪些暂时无法控制。",
        "stress": "听起来你现在承受了不少学习和任务压力。可以先把最紧急的一件事写下来，拆成 20 分钟内能完成的小步骤，再给自己安排一次短暂休息。",
        "anger": "生气时先暂停一下是有用的。你可以暂时离开刺激源，用几句话写下“发生了什么、我在意什么、我希望怎样被对待”。",
        "fatigue": "你可能真的需要休息，而不是继续硬撑。可以先降低任务强度，安排 15 到 30 分钟恢复时间，今晚尽量给睡眠留出空间。",
        "loneliness": "一个人扛着这些感受会很辛苦。可以从低压力的连接开始，比如给朋友发一句“最近想找人聊聊”，或参加一次社团/班级活动。",
        "positive": "听到你有这样的积极感受很好。可以把今天顺利的原因记录下来，之后压力大的时候它会成为可参考的经验。",
        "neutral": "谢谢你愿意分享。你可以继续说说今天最占据你注意力的一件事，我会尽量帮你一起梳理。",
    }
    return f"{replies.get(emotion, replies['neutral'])}\n\n提醒：我不能进行医学诊断，也不能替代专业心理咨询；如果状态持续影响生活，请及时寻求现实中的专业支持。"


def user_payload(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "email": row["email"],
        "studentId": row["student_id"],
        "nickname": row["nickname"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def message_payload(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "role": row["role"],
        "content": row["content"],
        "emotion": row["emotion"],
        "score": row["score"],
        "riskLevel": row["risk_level"],
        "time": row["created_at"],
    }


def emotion_payload(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "content": row["note"],
        "emotion": row["emotion_type"],
        "score": row["score"],
        "riskLevel": row["risk_level"],
        "time": row["created_at"],
        "analysisSource": "server",
        "analysisModel": "local-keyword-fallback",
    }


class ApiError(Exception):
    def __init__(self, status: int, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.message = message


def protected(handler: Callable[["Handler", sqlite3.Row], None]) -> Callable[["Handler"], None]:
    def wrapper(self: "Handler") -> None:
        handler(self, self.require_user())

    return wrapper


class Handler(BaseHTTPRequestHandler):
    server_version = "PKUMentalHealthDemo/1.0"

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[{now_iso()}] {self.address_string()} {format % args}")

    def end_headers(self) -> None:
        origin = self.headers.get("Origin")
        self.send_header("Access-Control-Allow-Origin",
                         origin if origin in ALLOWED_ORIGINS else "http://127.0.0.1:5173")
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
        routes: dict[tuple[str, str], Callable[[], None]] = {
            ("GET", "/api/health"): self.health,
            ("POST", "/api/signup"): self.signup,
            ("POST", "/api/login"): self.login,
            ("GET", "/api/profile"): protected(Handler.get_profile).__get__(self, Handler),
            ("PUT", "/api/profile"): protected(Handler.update_profile).__get__(self, Handler),
            ("POST", "/api/chat"): protected(Handler.chat).__get__(self, Handler),
            ("GET", "/api/emotion-history"): protected(Handler.emotion_history).__get__(self, Handler),
        }
        try:
            parsed = urlparse(self.path)
            route = routes.get((self.command, parsed.path))
            if route is None:
                raise ApiError(404, "接口不存在。")
            route()
        except ApiError as error:
            self.write_json(
                {"error": error.message, "code": error.status}, error.status)
        except Exception as error:
            print(f"Unexpected error: {error}")
            self.write_json({"error": "服务器内部错误。", "code": 500}, 500)

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        if length > 32_768:
            raise ApiError(413, "请求体过大。")
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
            row = conn.execute(
                "SELECT * FROM users WHERE auth_token = ?", (token,)).fetchone()
        if row is None:
            raise ApiError(401, "登录已失效，请重新登录。")
        return row

    def health(self) -> None:
        self.write_json({"ok": True, "database": str(DB_PATH)})

    def signup(self) -> None:
        payload = self.read_json()
        email = str(payload.get("email", "")).strip().lower()
        student_id = clean_text(str(payload.get("studentId", "")), 32)
        password = str(payload.get("password", ""))
        nickname = clean_text(str(payload.get("nickname", "匿名同学")) or "匿名同学", 24)
        if not is_pku_email(email):
            raise ApiError(400, "邮箱必须以 @pku.edu.cn 或 @stu.pku.edu.cn 结尾。")
        if not student_id:
            raise ApiError(400, "学号不能为空。")
        if len(password) < 6 or len(password) > 128:
            raise ApiError(400, "密码长度需为 6 到 128 位。")

        user_id = uuid.uuid4().hex
        token = uuid.uuid4().hex
        salt = secrets.token_hex(16)
        timestamp = now_iso()
        try:
            with connect() as conn:
                conn.execute(
                    """
                    INSERT INTO users (id, email, student_id, password_hash, password_salt, nickname, auth_token, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (user_id, email, student_id, hash_password(password, salt),
                     salt, nickname, token, timestamp, timestamp),
                )
                row = conn.execute("SELECT * FROM users WHERE id = ?",
                                   (user_id,)).fetchone()
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
            row = conn.execute("SELECT * FROM users WHERE email = ?",
                               (email,)).fetchone()
            if row is None or not secrets.compare_digest(hash_password(password, row["password_salt"]), row["password_hash"]):
                raise ApiError(401, "邮箱或密码错误。")
            token = uuid.uuid4().hex
            conn.execute("UPDATE users SET auth_token = ?, updated_at = ? WHERE id = ?",
                         (token, now_iso(), row["id"]))
            updated = conn.execute(
                "SELECT * FROM users WHERE id = ?", (row["id"],)).fetchone()
        self.write_json({"token": token, "user": user_payload(updated)})

    def get_profile(self, user: sqlite3.Row) -> None:
        self.write_json({"user": user_payload(user)})

    def update_profile(self, user: sqlite3.Row) -> None:
        payload = self.read_json()
        nickname = clean_text(str(payload.get("nickname", "匿名同学")) or "匿名同学", 24)
        with connect() as conn:
            conn.execute("UPDATE users SET nickname = ?, updated_at = ? WHERE id = ?",
                         (nickname, now_iso(), user["id"]))
            updated = conn.execute(
                "SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
        self.write_json({"user": user_payload(updated)})

    def chat(self, user: sqlite3.Row) -> None:
        payload = self.read_json()
        content = clean_text(str(payload.get("message", "")), 2000)
        if not content:
            raise ApiError(400, "消息不能为空。")
        analysis = normalize_client_analysis(payload, content)
        reply = clean_text(str(payload.get("reply", "")),
                           4000) or create_reply(analysis)
        timestamp = now_iso()
        ai_timestamp = now_iso()
        user_message_id = uuid.uuid4().hex
        ai_message_id = uuid.uuid4().hex
        record_id = uuid.uuid4().hex
        with connect() as conn:
            conn.execute(
                "INSERT INTO chat_messages (id, user_id, role, content, emotion, score, risk_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (user_message_id, user["id"], "user", content, analysis["emotion"],
                 analysis["score"], analysis["risk_level"], timestamp),
            )
            conn.execute(
                "INSERT INTO chat_messages (id, user_id, role, content, emotion, score, risk_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (ai_message_id, user["id"], "ai",
                 reply, None, None, None, ai_timestamp),
            )
            conn.execute(
                "INSERT INTO emotion_records (id, user_id, emotion_type, score, risk_level, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (record_id, user["id"], analysis["emotion"], analysis["score"],
                 analysis["risk_level"], content, timestamp),
            )
        self.write_json(
            {
                "reply": reply,
                "analysis": {"emotion": analysis["emotion"], "score": analysis["score"], "riskLevel": analysis["risk_level"]},
                "messages": [
                    {"id": user_message_id, "role": "user", "content": content, "time": timestamp,
                        "emotion": analysis["emotion"], "score": analysis["score"], "riskLevel": analysis["risk_level"]},
                    {"id": ai_message_id, "role": "ai",
                        "content": reply, "time": ai_timestamp},
                ],
                "record": {"id": record_id, "content": content, "emotion": analysis["emotion"], "score": analysis["score"], "riskLevel": analysis["risk_level"], "time": timestamp, "analysisSource": "server", "analysisModel": "local-keyword-fallback"},
            }
        )

    def emotion_history(self, user: sqlite3.Row) -> None:
        with connect() as conn:
            records = conn.execute(
                "SELECT * FROM emotion_records WHERE user_id = ? ORDER BY created_at ASC LIMIT 200",
                (user["id"],),
            ).fetchall()
            messages = conn.execute(
                "SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT 200",
                (user["id"],),
            ).fetchall()
        self.write_json({"records": [emotion_payload(row) for row in records], "messages": [
                        message_payload(row) for row in messages]})


def main() -> None:
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Backend API running at http://{HOST}:{PORT}")
    print(f"SQLite database: {DB_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
