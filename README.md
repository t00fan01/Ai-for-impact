# CareerMitra AI - Resume to Job Analyzer + Scam Detector

CareerMitra AI is a full-stack AI for Employability project built for hackathon execution speed and demo reliability.

It helps job seekers:
- Evaluate resume-job fit.
- Detect potential scam signals in job descriptions.
- Identify missing skills.
- Generate actionable study recommendations.
- Export a polished PDF report.

## Tech Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: FastAPI
- AI: Gemini via `google-generativeai`
- PDF Parsing: PyPDF2

## Key Features
- Resume-to-JD analysis with strict structured JSON output.
- Scam probability scoring and red flag explanations.
- Skill gap detection and study plan generation.
- URL-based JD extraction pipeline (`/parse-job-url`).
- Guest auth session flow (`/auth/guest-login`, `/auth/me`).
- Local analysis history in browser.
- One-click PDF export from results view.

## Project Structure
- `backend/` FastAPI app, AI logic, URL parser endpoints.
- `frontend/` React app, dashboard, results, export UX.

## Prerequisites
- Python 3.11+
- Node.js 20+
- Gemini API key

## Environment
Create backend env values (example already included):
- `backend/.env.example`

Set on shell before backend startup:
- `GEMINI_API_KEY=...`
- Optional: `GEMINI_MODEL=gemini-1.5-flash`

## Local Run
### 1) Backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:GEMINI_API_KEY="your_api_key_here"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend
```bash
cd frontend
npm install
# Optional if backend URL differs:
# setx VITE_API_URL "http://127.0.0.1:8000"
npm run dev
```

## API Endpoints
- `GET /` backend status message
- `GET /health` health check + model/config visibility
- `POST /auth/guest-login` create guest session
- `GET /auth/me` validate active session (requires `X-Session-Token`)
- `POST /auth/logout` invalidate session (requires `X-Session-Token`)
- `POST /parse-job-url` fetch + parse JD content from URL (requires `X-Session-Token`)
- `POST /analyze` run resume/JD analysis (requires `X-Session-Token`)

## Frontend Build Commands
```bash
cd frontend
npm run lint
npm run build
npm run preview
```

## CI
GitHub Actions workflow added at:
- `.github/workflows/ci.yml`

It runs:
- Backend dependency install + syntax compile check
- Frontend install + lint + build

## GitHub Readiness Checklist
- [x] Root README with architecture and setup
- [x] License file
- [x] Backend env example
- [x] Hardened `.gitignore`
- [x] CI workflow for backend/frontend
- [x] Reproducible dependency entrypoints

## Notes
- Backend sessions are in-memory (sufficient for hackathon/demo).
- For production, migrate sessions and analysis history to a persistent store.
