# AI for Employability - Goated Workflow Plan

## 1) Competition-First Requirements (Non-Negotiable)
Each submission must clearly show all 3:
1. Specific user persona.
2. Multi-step workflow.
3. Useful measurable output.

### Persona (Final)
- Primary persona: Final-year student or early-career job seeker applying to technical roles.
- Pain points: unclear resume fit, hidden skill gaps, fake/scam postings.
- Success metric: higher interview conversion and safer job applications.

### Multi-Step Workflow (Final)
1. User uploads resume PDF.
2. User pastes job description.
3. Backend extracts resume text.
4. Gemini evaluates resume-job match + scam risk.
5. App returns structured JSON.
6. UI visualizes scores + flags + missing skills + study plan.
7. User iterates resume and retries.

### Useful Outputs (Final)
- `match_score` (0-100)
- `scam_probability_score` (0-100)
- `scam_red_flags` (list)
- `missing_skills` (list)
- `study_recommendations` (list)

---

## 2) Priority Task List (In Order)

## P0 (Do First - Demo Critical)
- [x] Build stable FastAPI backend endpoint `POST /analyze`.
- [x] Enforce strict JSON schema from Gemini.
- [x] Add PDF validation and extraction error handling.
- [x] Add CORS for frontend communication.
- [x] Add backend health endpoint (`GET /health`) for quick troubleshooting.

## P1 (High Impact UX + Trust)
- [x] Add dashboard validations (PDF type/size, JD minimum length).
- [x] Add request timeout + friendly retry UX in frontend.
- [x] Add progress bars for score visualization.
- [x] Add risk labels: Low/Moderate/High for scam probability.

## P2 (Hackathon Differentiators)
- [x] Save recent analyses locally (browser history panel).
- [x] Add JD trust checklist (domain email, compensation realism, urgency language).
- [x] Add "resume improvement bullets" generated from missing skills.

## P3 (If Time Remains)
- [x] Export report as PDF.
- [x] Add auth + user sessions.
- [x] Add real job posting URL parsing pipeline.

---

## 3) Backend Architecture (Current)
- FastAPI app with CORS.
- `POST /analyze` accepts multipart form:
  - `resume` (PDF file)
  - `job_description` (text)
- PDF extraction with `PyPDF2`.
- Gemini call with `response_mime_type=application/json`.
- Strict response validation via Pydantic schema.
- Health endpoint for deployment checks.

---

## 4) Exact Gemini System Prompt (Use This)

```text
You are an expert Technical Recruiter and Cybersecurity Analyst.
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
```

---

## 5) Setup Commands (Fresh Run)

## Backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:GEMINI_API_KEY="your_api_key_here"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend
```bash
cd frontend
npm install
# Optional if backend URL differs:
# setx VITE_API_URL "http://127.0.0.1:8000"
npm run dev
```

---

## 6) Demo Runbook (2-Minute Flow)
1. Open app landing page and state persona.
2. Upload resume + paste JD.
3. Show generated match score and scam probability.
4. Explain at least 2 red flags and 3 missing skills.
5. Show study recommendations as action plan.
6. Re-run after JD tweak to show workflow depth.

---

## 7) Judging Alignment Checklist
- [x] Clear persona.
- [x] Multi-step workflow.
- [x] Useful measurable outputs.
- [x] Technical depth beyond simple chatbot wrapper.
- [x] Final polish: visuals, loading micro-interactions, report framing.
