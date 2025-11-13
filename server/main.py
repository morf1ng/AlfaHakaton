import os
import re
import smtplib
import ssl
from datetime import datetime, timedelta
from email.message import EmailMessage
from typing import Dict, List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-r1-0528-qwen3-8b:free")
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://127.0.0.1:8000").split(",")
REFERER = os.getenv("OPENROUTER_SITE_URL", "http://127.0.0.1:8000")
APP_NAME = os.getenv("OPENROUTER_APP_NAME", "SMB Assistant")

SMTP_HOST = os.getenv("SMTP_HOST") or os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", os.getenv("SMTP_SERVER_PORT", "587")))
SMTP_USERNAME = os.getenv("SMTP_USERNAME") or os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") or os.getenv("SMTP_PASS")
SMTP_FROM_EMAIL = (
    os.getenv("SMTP_FROM_EMAIL")
    or os.getenv("EMAIL_FROM")
    or SMTP_USERNAME
)
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "SMB Assistant")
AUTH_CODE_TTL = int(os.getenv("AUTH_CODE_TTL", "600"))  # seconds

if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY is required. Provide it via environment or .env file")

SYSTEM_PROMPT = (
    "Ты – эксперт-консультант для малого и среднего бизнеса. "
    "Отвечай на вопросы по юридическим задачам, маркетингу, финансовому планированию, "
    "операционному управлению и мерам господдержки. Используй понятный язык, давай "
    "конкретные рекомендации, на шаги и чек-листы. Если данных не хватает – объясни, как их получить."
)

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.[A-Za-z]{2,}$")


class Message(BaseModel):
    role: str
    content: str

    @validator("role")
    def validate_role(cls, value: str) -> str:
        allowed = {"user", "assistant", "system"}
        if value not in allowed:
            raise ValueError(f"role must be one of {allowed}")
        return value


class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    messages: List[Message]

    @validator("messages")
    def validate_messages(cls, value: List[Message]) -> List[Message]:
        if not value:
            raise ValueError("messages cannot be empty")
        return value


class ChatResponse(BaseModel):
    reply: str
    conversation_id: Optional[str] = None


class RequestCodePayload(BaseModel):
    email: str

    @validator("email")
    def validate_email(cls, value: str) -> str:
        if not EMAIL_REGEX.match(value):
            raise ValueError("Invalid email format")
        return value.lower()


class VerifyCodePayload(BaseModel):
    email: str
    code: str

    @validator("email")
    def validate_email(cls, value: str) -> str:
        if not EMAIL_REGEX.match(value):
            raise ValueError("Invalid email format")
        return value.lower()

    @validator("code")
    def validate_code(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned.isdigit() or len(cleaned) != 6:
            raise ValueError("Code must be 6 digits")
        return cleaned


def ensure_email_configured() -> None:
    if not (SMTP_HOST and SMTP_USERNAME and SMTP_PASSWORD and SMTP_FROM_EMAIL):
        raise HTTPException(status_code=500, detail="SMTP configuration is missing on the server")


PENDING_CODES: Dict[str, Dict[str, datetime]] = {}


def generate_code() -> str:
    from secrets import randbelow

    return f"{randbelow(1000000):06d}"


def store_code(email: str, code: str) -> None:
    expires_at = datetime.utcnow() + timedelta(seconds=AUTH_CODE_TTL)
    PENDING_CODES[email] = {"code": code, "expires": expires_at}


def verify_stored_code(email: str, code: str) -> bool:
    stored = PENDING_CODES.get(email)
    if not stored:
        return False
    if stored["expires"] < datetime.utcnow():
        PENDING_CODES.pop(email, None)
        return False
    if stored["code"] != code:
        return False
    PENDING_CODES.pop(email, None)
    return True


def build_email_message(email: str, code: str) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = "Ваш код подтверждения"
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    msg["To"] = email
    body = (
        "Здравствуйте!\n\n"
        f"Ваш код подтверждения: {code}\n"
        f"Код действителен {AUTH_CODE_TTL // 60} минут.\n\n"
        "Если вы не запрашивали код, просто проигнорируйте это письмо."
    )
    msg.set_content(body)
    return msg


def send_email_sync(email: str, code: str) -> None:
    msg = build_email_message(email, code)
    context = ssl.create_default_context()
    try:
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls(context=context)
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to send email: {exc}") from exc


async def send_email_async(email: str, code: str) -> None:
    import asyncio

    await asyncio.to_thread(send_email_sync, email, code)


app = FastAPI(title="SMB Assistant Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def call_openrouter(messages: List[Message]) -> str:
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": REFERER,
        "X-Title": APP_NAME,
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            *[message.dict() for message in messages],
        ],
        "temperature": 0.4,
        "max_tokens": 700,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(url, headers=headers, json=payload)
        if response.status_code >= 400:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        data = response.json()
        if not data.get("choices"):
            raise HTTPException(status_code=502, detail="OpenRouter returned empty response")

        reply = data["choices"][0]["message"]["content"].strip()
        return reply


@app.get("/health", tags=["meta"])
async def health_check():
    return {"status": "ok"}


@app.post("/auth/request-code", tags=["auth"])
async def request_code(payload: RequestCodePayload):
    ensure_email_configured()
    code = generate_code()
    store_code(payload.email, code)
    try:
        await send_email_async(payload.email, code)
    except HTTPException:
        PENDING_CODES.pop(payload.email, None)
        raise
    except Exception as exc:
        PENDING_CODES.pop(payload.email, None)
        raise HTTPException(status_code=502, detail=f"Failed to send email: {exc}") from exc
    return {"detail": "Verification code sent"}


@app.post("/auth/verify-code", tags=["auth"])
async def verify_code(payload: VerifyCodePayload):
    if verify_stored_code(payload.email, payload.code):
        return {"detail": "Verified"}
    raise HTTPException(status_code=400, detail="Invalid or expired code")


@app.post("/chat", response_model=ChatResponse, tags=["chat"])
async def chat_endpoint(request: ChatRequest):
    reply_text = await call_openrouter(request.messages)
    return ChatResponse(reply=reply_text, conversation_id=request.conversation_id)
