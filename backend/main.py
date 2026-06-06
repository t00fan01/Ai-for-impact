from dotenv import load_dotenv
import logging

load_dotenv()

# Configure simple logging for easier debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("career_mitra")

import io
import json
import os
import re
import secrets
import hashlib
import time
from datetime import UTC, datetime, timedelta
from typing import Any, List
from urllib.parse import urlparse

from pypdf import PdfReader

# Prefer the maintained google-genai SDK. If unavailable, fall back to older packages.
genai = None
try:
    # new genai package
    import google.genai as genai
    from google.genai import types as genai_types
    logger.info("Using google.genai package")
except Exception:
    try:
        import google.generativeai as genai  # deprecated
        logger.info("Using google.generativeai package (deprecated)")
    except Exception:
        genai = None
        logger.warning("No Google GenAI client library found. LLM endpoints will be disabled.")

# Optional Redis client for caching and rate-limiting if installed
try:
    import redis
    redis_client = None
except Exception:
    redis = None
    redis_client = None
import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, HttpUrl, ValidationError

app = FastAPI(title="AI Employability Backend", version="1.0.0")


@app.middleware("http")
async def log_requests(request, call_next):
    start = time.time()
    logger.info("Incoming request %s %s", request.method, request.url.path)
    response = await call_next(request)
    elapsed = (time.time() - start) * 1000
    logger.info("Completed %s %s in %.2fms status=%s", request.method, request.url.path, elapsed, response.status_code)
    return response

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
genai_client = None
if GEMINI_API_KEY and genai is not None:
    try:
        # google.genai client
        if hasattr(genai, "TextGenerationClient") or hasattr(genai, "client"):
            try:
                # configure via client library
                from google.genai import TextGenerationClient

                genai_client = TextGenerationClient()
                logger.info("Configured google.genai TextGenerationClient")
            except Exception:
                # fallback: set env var; some libs read it
                os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
                logger.info("Set GEMINI_API_KEY in environment for genai package")
        elif hasattr(genai, "configure"):
            # older deprecated library
            genai.configure(api_key=GEMINI_API_KEY)
            genai_client = genai
            logger.info("Configured deprecated google.generativeai client")
    except Exception as exc:
        logger.warning(f"Failed to configure Gemini client: {exc}")
elif GEMINI_API_KEY and genai is None:
    logger.warning("GEMINI_API_KEY present but no genai client library is installed.")

SESSION_STORE: dict[str, dict[str, str]] = {}

# Simple in-memory cache for recent analysis results (key -> normalized dict)
ANALYSIS_CACHE: dict[str, dict] = {}
CACHE_MAX_ITEMS = 200

# Simple rate limiting: max analyses per hour per session
RATE_LIMIT_PER_HOUR = 60



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
        reader = PdfReader(io.BytesIO(file_bytes))
        page_text_chunks: List[str] = []

        for page in reader.pages:
            try:
                extracted = page.extract_text() or ""
            except Exception:
                # pypdf may throw on some pages; skip safely
                extracted = ""
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


def _rate_limit_ok(session_token: str) -> bool:
    key = f"rate:{session_token}"
    now = int(time.time())
    window_start = now - 3600
    history = SESSION_STORE.get(key, [])
    # prune
    history = [t for t in history if t >= window_start]
    if len(history) >= RATE_LIMIT_PER_HOUR:
        return False
    history.append(now)
    SESSION_STORE[key] = history
    return True


@app.get("/models")
def list_models() -> dict:
    """Best-effort endpoint to list available models from the installed GenAI client."""
    if genai is None:
        raise HTTPException(status_code=501, detail="LLM client library not installed on server.")

    try:
        # Older client may expose a list_models helper
        if hasattr(genai, "list_models"):
            models = [m for m in genai.list_models()]
        else:
            # Best-effort: return configured default model
            models = [GEMINI_MODEL]
        return {"models": models}
    except Exception as exc:
        logger.exception("Failed to list models: %s", exc)
        raise HTTPException(status_code=502, detail=f"Could not list models: {exc}") from exc


@app.get("/analysis/export")
def export_last_analysis(x_session_token: str = Header(..., alias="X-Session-Token")) -> dict:
    _validate_session_token(x_session_token, required=True)
    last = SESSION_STORE.get(f"last:{x_session_token}", {}).get("analysis")
    if not last:
        raise HTTPException(status_code=404, detail="No analysis found for this session.")
    return {"analysis": last}



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

    # Create a stable cache key from prompt to avoid repeated LLM calls
    cache_key = hashlib.sha256(prompt.encode("utf-8")).hexdigest()
    # return cached result if available
    if cache_key in ANALYSIS_CACHE:
        logger.info("Returning cached analysis result")
        # also store a reference to last analysis for session
        if x_session_token:
            SESSION_STORE.setdefault(f"last:{x_session_token}", {})["analysis"] = ANALYSIS_CACHE[cache_key]
        return ANALYSIS_CACHE[cache_key]

    # rate limit per session
    if x_session_token and not _rate_limit_ok(x_session_token):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")

    if genai is None:
        raise HTTPException(status_code=501, detail="LLM client library not installed on server.")

    try:
        raw_text = None
        # Prefer initialized client
        if genai_client is not None and hasattr(genai_client, "generate"):
            logger.info("Generating with configured genai client for model %s", GEMINI_MODEL)
            # New google.genai client typically supports generate(model=..., prompt=...)
            try:
                res = genai_client.generate(model=GEMINI_MODEL, prompt=prompt)
                # attempt common attributes
                raw_text = getattr(res, "content", None) or getattr(res, "text", None) or str(res)
            except Exception as exc:
                logger.exception("Error while calling genai_client.generate: %s", exc)

        # Fallbacks for different installed packages
        if not raw_text:
            # old generativeai package
            if hasattr(genai, "GenerativeModel"):
                logger.info("Generating with generativeai.GenerativeModel %s", GEMINI_MODEL)
                model = genai.GenerativeModel(
                    GEMINI_MODEL,
                    generation_config={
                        "response_mime_type": "application/json",
                        "temperature": 0.2,
                    },
                )
                response = model.generate_content(prompt)
                raw_text = getattr(response, "text", None) or getattr(response, "response", None) or str(response)
            else:
                # try a direct generate on genai if present
                if hasattr(genai, "generate"):
                    res = genai.generate(model=GEMINI_MODEL, prompt=prompt)
                    raw_text = getattr(res, "text", None) or getattr(res, "content", None) or str(res)

        if not raw_text:
            raise HTTPException(status_code=502, detail="Empty response from AI model.")

        if not raw_text:
            raise HTTPException(status_code=502, detail="Empty response from AI model.")

        parsed = _parse_llm_json(raw_text)
        normalized = _normalize_analysis(parsed)
        # cache and remember for session
        ANALYSIS_CACHE[cache_key] = normalized.dict()
        # prune if needed
        if len(ANALYSIS_CACHE) > CACHE_MAX_ITEMS:
            # simple LRU: pop arbitrary item (not perfect but keeps memory bounded)
            ANALYSIS_CACHE.pop(next(iter(ANALYSIS_CACHE)))
        if x_session_token:
            SESSION_STORE.setdefault(f"last:{x_session_token}", {})["analysis"] = ANALYSIS_CACHE[cache_key]
        return normalized
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("AI generation failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"AI processing failed: {exc}") from exc


@app.post("/analyze/demo", response_model=AnalysisResponse)
async def analyze_demo(
    job_description: str = Form(...),
    resume_text: str = Form(...),
    x_session_token: str | None = Header(default=None, alias="X-Session-Token"),
) -> AnalysisResponse:
    """Lightweight demo endpoint that accepts raw resume text (no file upload) for quick testing."""
    _validate_session_token(x_session_token, required=False)

    jd = job_description.strip()
    if len(jd) < MIN_JD_CHARS:
        raise HTTPException(status_code=400, detail=f"Job description is too short. Provide at least {MIN_JD_CHARS} characters.")

    prompt = _build_analysis_prompt(job_description=_truncate(jd, MAX_PROMPT_CHARS), resume_text=_truncate(resume_text, MAX_PROMPT_CHARS))

    # use same generation logic as analyze_resume_job but without file checks
    cache_key = hashlib.sha256(prompt.encode("utf-8")).hexdigest()
    if cache_key in ANALYSIS_CACHE:
        logger.info("Returning cached demo analysis result")
        return ANALYSIS_CACHE[cache_key]

    if x_session_token and not _rate_limit_ok(x_session_token):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")

    if genai is None:
        raise HTTPException(status_code=501, detail="LLM client library not installed on server.")

    try:
        raw_text = None
        if genai_client is not None and hasattr(genai_client, "generate"):
            try:
                res = genai_client.generate(model=GEMINI_MODEL, prompt=prompt)
                raw_text = getattr(res, "content", None) or getattr(res, "text", None) or str(res)
            except Exception as exc:
                logger.exception("Error while calling genai_client.generate (demo): %s", exc)

        if not raw_text:
            if hasattr(genai, "GenerativeModel"):
                model = genai.GenerativeModel(GEMINI_MODEL, generation_config={"response_mime_type": "application/json", "temperature": 0.2})
                response = model.generate_content(prompt)
                raw_text = getattr(response, "text", None) or getattr(response, "response", None) or str(response)
            elif hasattr(genai, "generate"):
                res = genai.generate(model=GEMINI_MODEL, prompt=prompt)
                raw_text = getattr(res, "text", None) or getattr(res, "content", None) or str(res)
            else:
                raise HTTPException(status_code=501, detail="Unsupported genai client API for demo endpoint.")

        if not raw_text:
            raise HTTPException(status_code=502, detail="Empty response from AI model.")

        parsed = _parse_llm_json(raw_text)
        normalized = _normalize_analysis(parsed)
        ANALYSIS_CACHE[cache_key] = normalized.dict()
        if x_session_token:
            SESSION_STORE.setdefault(f"last:{x_session_token}", {})["analysis"] = ANALYSIS_CACHE[cache_key]
        return normalized
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Demo AI generation failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"AI processing failed: {exc}") from exc
