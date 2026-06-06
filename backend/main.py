import os
from typing import List
from fastapi import FastAPI, UploadFile, Form, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import PyPDF2
from pydantic import BaseModel
import json

app = FastAPI(title="AI Employability Backend")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini API Configuration
# Get API key from environment, fallback to a placeholder or error if not set
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY environment variable not set.")

class AnalysisResponse(BaseModel):
    match_score: int
    scam_probability_score: int
    scam_red_flags: List[str]
    missing_skills: List[str]
    study_recommendations: List[str]

def extract_text_from_pdf(file: UploadFile) -> str:
    try:
        pdf_reader = PyPDF2.PdfReader(file.file)
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")

SYSTEM_PROMPT = """You are an expert Technical Recruiter and Cybersecurity Analyst.
Your task is to analyze a candidate's resume against a provided job description.
You will evaluate the match, identify skill gaps, provide actionable study recommendations, and critically assess the job description for any potential scam indicators.

You MUST respond strictly in the following JSON format. Do not include any markdown formatting like ```json or any other text outside the JSON structure:
{
  "match_score": <integer 0-100 representing how well the resume matches the JD>,
  "scam_probability_score": <integer 0-100 representing the likelihood the JD is a scam>,
  "scam_red_flags": [<list of strings detailing specific warnings or red flags found in the JD>],
  "missing_skills": [<list of strings of critical skills required by the JD that are absent from the resume>],
  "study_recommendations": [<list of strings with actionable advice and topics to learn to bridge the skill gap>]
}"""

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_resume_job(
    job_description: str = Form(...),
    resume: UploadFile = File(...)
):
    if not resume.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is missing on the server.")

    # 1. Extract Text
    resume_text = extract_text_from_pdf(resume)

    # 2. Call Gemini API
    try:
        model = genai.GenerativeModel('gemini-3.5-flash', generation_config={"response_mime_type": "application/json"})
        
        prompt = f"""{SYSTEM_PROMPT}

Job Description:
{job_description}

Candidate Resume:
{resume_text}
"""
        response = model.generate_content(prompt)
        
        # 3. Parse JSON response
        result_json = json.loads(response.text)
        return result_json

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing Error: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "AI Employability Backend is running!"}
