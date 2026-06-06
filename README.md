# 🚀 Career Mitra

<div align="center">
  <h3>Your AI companion for Resume Fit, Skill Gap Analysis & Job Scam Detection</h3>
  <p>An intelligent, free applicant tracking system (ATS) analyzer and career coach that ensures your resume passes automated scans and secures you interviews faster.</p>
</div>

---

## 🌟 Features

*   **🛡️ Job Scam Detection:** Don't fall victim to fake job postings! Our AI analyzes the Job Description for requests for money, generic phrasing, and scam red flags, providing you with a definitive scam probability score.
*   **📊 Comprehensive ATS Scoring:** Upload your Resume and a Job Description. We read the data directly (supporting PDF, DOCX, PNG, JPG) and generate a definitive Match Score (0-100%).
*   **🎯 Skill Gap Analysis:** We highlight exactly which core keywords and skills you are missing from the job description.
*   **💡 Personalized Study Recommendations:** If you lack a skill, Career Mitra automatically provides relevant learning links so you can bridge the gap.
*   **✨ Modern Light Theme UI:** A blazing fast, professional, side-by-side comparison interface built on React & Vite.

## 🛠️ Technology Stack

*   **Frontend:** React, Vite, Vanilla CSS
*   **Backend:** Python, FastAPI, Uvicorn
*   **AI Engine:** Google Gemini SDK (`gemini-2.5-flash`)
*   **Parsers:** `PyPDF2`, `python-docx`, `Pillow`

## 🚀 Getting Started

To run this application locally, you will need Node.js and Python 3.10+ installed.

### 1. Clone the repository
```bash
git clone https://github.com/t00fan01/Ai-for-impact.git
cd "Ai-for-impact"
```

### 2. Backend Setup
```bash
# Navigate to backend folder
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set your Gemini API Key in the environment
# Windows PowerShell:
$env:GEMINI_API_KEY="YOUR_KEY"

# Start the FastAPI Server
uvicorn main:app --reload
```
The backend API will run on `http://localhost:8000`.

### 3. Frontend Setup
Open a **new** terminal window:
```bash
# Navigate to frontend folder
cd frontend

# Install packages
npm install

# Start development server
npm run dev
```
The Frontend UI will be accessible at `http://localhost:5173`.

---

<div align="center">
  <b>Built for Hackathon | Built to make an Impact</b>
</div>
