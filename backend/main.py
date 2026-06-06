from dotenv import load_dotenv

load_dotenv()

import io
import json
import os
import re
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any, List
from urllib.parse import urlparse

import PyPDF2
import google.generativeai as genai
import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, HttpUrl, ValidationError

app = FastAPI(title="AI Employability Backend", version="1.0.0")

# Enable CORS for frontend integration.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_RESUME_MB = 10
MAX_RESUME_BYTES = MAX_RESUME_MB * 1024 * 1024
MAX_PROMPT_CHARS = 25000
MIN_JD_CHARS = 40
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-pro")
SESSION_TTL_HOURS = 12
HTTP_USER_AGENT = "CareerMitraAI/1.0 (+hackathon-project)"

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

SESSION_STORE: dict[str, dict[str, str]] = {}


class AnalysisResponse(BaseModel):
    match_score: int = Field(ge=0, le=100)
    scam_probability_score: int = Field(ge=0, le=100)
    scam_red_flags: List[str]
    missing_skills: List[str]
    study_recommendations: List[str]


class SessionResponse(BaseModel):
    token: str
    user_id: str
    expires_at: str


class SessionMeResponse(BaseModel):
    user_id: str
    expires_at: str


class ParseJobUrlRequest(BaseModel):
    url: HttpUrl


class ParseJobUrlResponse(BaseModel):
    source_url: str
    source_domain: str
    title: str
    job_description: str


SYSTEM_PROMPT = """You are an expert Technical Recruiter and Cybersecurity Analyst.
You evaluate a candidate resume against a job description for employability fit and scam risk.

Rules:
1) Return ONLY valid JSON. No markdown, no code fences, no extra commentary.
2) All scores must be integers from 0 to 100.
3) Keep each list item concise and practical.
4) If evidence is weak, be explicit in red flags and keep confidence moderate.
5) Focus on measurable, job-relevant missing skills and study actions.

Output schema (exact keys):
{
  "match_score": 0,
  "scam_probability_score": 0,
  "scam_red_flags": ["string"],
  "missing_skills": ["string"],
  "study_recommendations": ["string"]
}
"""


def _truncate(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars]


def _clean_string_list(values: Any) -> List[str]:
    if not isinstance(values, list):
        return []

    cleaned: List[str] = []
    for item in values:
        if isinstance(item, str):
            normalized = " ".join(item.split()).strip()
            if normalized:
                cleaned.append(normalized)
    return cleaned


def _parse_llm_json(raw_text: str) -> dict:
    if not raw_text:
        raise HTTPException(status_code=502, detail="Empty response from AI model.")

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", raw_text)
        if not match:
            raise HTTPException(status_code=502, detail="Model returned invalid JSON format.")

        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=502, detail=f"Could not parse model JSON output: {exc}") from exc


def _normalize_analysis(payload: dict) -> AnalysisResponse:
    normalized = {
        "match_score": payload.get("match_score", 0),
        "scam_probability_score": payload.get("scam_probability_score", 0),
        "scam_red_flags": _clean_string_list(payload.get("scam_red_flags", [])),
        "missing_skills": _clean_string_list(payload.get("missing_skills", [])),
        "study_recommendations": _clean_string_list(payload.get("study_recommendations", [])),
    }
    try:
        return AnalysisResponse(**normalized)
    except ValidationError as exc:
        raise HTTPException(status_code=502, detail=f"Model output did not match expected schema: {exc}") from exc


def _extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        page_text_chunks: List[str] = []

        for page in reader.pages:
            extracted = page.extract_text() or ""
            extracted = extracted.strip()
            if extracted:
                page_text_chunks.append(extracted)

        text = "\n".join(page_text_chunks).strip()
        if not text:
            raise HTTPException(status_code=400, detail="No extractable text found in this PDF. Please upload a text-based resume.")
        return text
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {exc}") from exc


def _build_analysis_prompt(job_description: str, resume_text: str) -> str:
    return f"""{SYSTEM_PROMPT}

Job Description:
{job_description}

Candidate Resume:
{resume_text}
"""


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _create_guest_session() -> SessionResponse:
    token = secrets.token_urlsafe(32)
    user_id = f"guest_{secrets.token_hex(6)}"
    expires_at = _utc_now() + timedelta(hours=SESSION_TTL_HOURS)

    SESSION_STORE[token] = {
        "user_id": user_id,
        "expires_at": expires_at.isoformat(),
    }

    return SessionResponse(
        token=token,
        user_id=user_id,
        expires_at=expires_at.isoformat(),
    )


def _validate_session_token(session_token: str | None, required: bool = False) -> dict[str, str] | None:
    if not session_token:
        if required:
            raise HTTPException(status_code=401, detail="Missing session token.")
        return None

    session = SESSION_STORE.get(session_token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session token.")

    expires_at = datetime.fromisoformat(session["expires_at"])
    if expires_at <= _utc_now():
        SESSION_STORE.pop(session_token, None)
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")

    return session


def _extract_job_text_from_html(html: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "noscript", "svg", "footer", "nav"]):
        tag.decompose()

    title = (soup.title.string.strip() if soup.title and soup.title.string else "Job Posting")

    candidates: List[str] = []
    for selector in ["main", "article", "section", "body"]:
        for node in soup.select(selector):
            text = " ".join(node.get_text(" ", strip=True).split())
            if len(text) > 200:
                candidates.append(text)

    if not candidates:
        fallback = " ".join(soup.get_text(" ", strip=True).split())
        candidates = [fallback] if fallback else []

    if not candidates:
        raise HTTPException(status_code=422, detail="Could not extract meaningful text from the URL.")

    job_text = max(candidates, key=len)
    return title, job_text[:20000]


@app.get("/")
def read_root() -> dict:
    return {"message": "AI Employability Backend is running!"}


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "gemini_configured": bool(GEMINI_API_KEY),
        "model": GEMINI_MODEL,
    }


@app.post("/auth/guest-login", response_model=SessionResponse)
def guest_login() -> SessionResponse:
    return _create_guest_session()


@app.get("/auth/me", response_model=SessionMeResponse)
def auth_me(x_session_token: str = Header(..., alias="X-Session-Token")) -> SessionMeResponse:
    session = _validate_session_token(x_session_token, required=True)
    assert session is not None
    return SessionMeResponse(user_id=session["user_id"], expires_at=session["expires_at"])


@app.post("/auth/logout")
def auth_logout(x_session_token: str = Header(..., alias="X-Session-Token")) -> dict:
    _validate_session_token(x_session_token, required=True)
    SESSION_STORE.pop(x_session_token, None)
    return {"ok": True}


@app.post("/parse-job-url", response_model=ParseJobUrlResponse)
def parse_job_url(payload: ParseJobUrlRequest, x_session_token: str | None = Header(default=None, alias="X-Session-Token")) -> ParseJobUrlResponse:
    _validate_session_token(x_session_token, required=True)

    try:
        response = requests.get(
            str(payload.url),
            timeout=12,
            headers={"User-Agent": HTTP_USER_AGENT},
            allow_redirects=True,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=400, detail=f"Unable to fetch the provided URL: {exc}") from exc

    title, jd_text = _extract_job_text_from_html(response.text)
    return ParseJobUrlResponse(
        source_url=str(payload.url),
        source_domain=urlparse(str(payload.url)).netloc,
        title=title,
        job_description=jd_text,
    )


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_resume_job(
    job_description: str = Form(...),
    resume: UploadFile = File(...),
    x_session_token: str | None = Header(default=None, alias="X-Session-Token"),
) -> AnalysisResponse:
    _validate_session_token(x_session_token, required=True)

    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key is missing on server.")

    filename = (resume.filename or "").lower()
    if not filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported.")

    jd = job_description.strip()
    if len(jd) < MIN_JD_CHARS:
        raise HTTPException(status_code=400, detail=f"Job description is too short. Provide at least {MIN_JD_CHARS} characters.")

    file_bytes = await resume.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded resume is empty.")
    if len(file_bytes) > MAX_RESUME_BYTES:
        raise HTTPException(status_code=400, detail=f"Resume exceeds {MAX_RESUME_MB} MB limit.")

    resume_text = _extract_text_from_pdf_bytes(file_bytes)
    prompt = _build_analysis_prompt(
        job_description=_truncate(jd, MAX_PROMPT_CHARS),
        resume_text=_truncate(resume_text, MAX_PROMPT_CHARS),
    )

    try:
        model = genai.GenerativeModel(
            GEMINI_MODEL,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.2,
            },
        )
        response = model.generate_content(prompt)
        parsed = _parse_llm_json(getattr(response, "text", ""))
        return _normalize_analysis(parsed)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI processing failed: {exc}") from exc
