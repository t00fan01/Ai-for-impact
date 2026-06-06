# CareerMitra — AI Employability Toolkit

CareerMitra is an AI-driven web application that evaluates candidate resumes against job descriptions, highlights missing skills, flags potential job scams, and provides actionable, prioritized study recommendations.

This repository contains:
- `backend/`: FastAPI service with AI integration
- `frontend/`: React + Vite UX

Why this project
- Rapid, structured feedback for jobseekers
- Exportable analysis for interviews and coaching
- Extensible design for production readiness

Repository layout
```
CareerMitra/
├─ backend/                # FastAPI application and tests
├─ frontend/               # React + Vite application
├─ .github/workflows/      # CI workflows
├─ LICENSE
└─ README.md
```

Quick start (development)

Prerequisites
- Python 3.11 (pyenv recommended)
- Node.js 18+ and npm

Backend (macOS / zsh)

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
# Add your Gemini API key to backend/.env or export GEMINI_API_KEY in your shell
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Visit the health endpoint: http://127.0.0.1:8000/health

Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite will print the local dev URL (for example http://localhost:5174).

API summary
- GET /health — { status, gemini_configured, model }
- POST /auth/guest-login — create guest session
- POST /parse-job-url — extract JD from URL
- POST /analyze — multipart/form-data: job_description + resume (PDF). Header: X-Session-Token
- POST /analyze/demo — quick demo using raw resume text
- GET /analysis/export — return last analysis for session
- GET /models — best-effort list of available models

AnalysisResponse (returned by /analyze)
```json
{
  "match_score": 0,
  "scam_probability_score": 0,
  "scam_red_flags": ["string"],
  "missing_skills": ["string"],
  "study_recommendations": ["string"]
}
```

Environment variables
- GEMINI_API_KEY — required for AI features (set in `backend/.env` or export in shell)
- GEMINI_MODEL — optional (defaults to `gemini-pro`)

Testing

```bash
cd backend
source .venv/bin/activate
pytest
```

Continuous Integration

A GitHub Actions workflow is included to run backend tests and build the frontend on pushes and pull requests. See `.github/workflows/ci.yml`.

Migration & production
- Migrate in-memory cache and sessions to Redis for production.
- Replace `google-generativeai` with `google-genai`.
- Replace `PyPDF2` with `pypdf` to avoid deprecation warnings.

Contributing

Open issues for bugs or feature requests. For code changes, create a PR and ensure tests pass.

If you'd like, I can add CONTRIBUTING.md, a Dockerfile, or a deploy pipeline next — tell me which and I'll implement it.
