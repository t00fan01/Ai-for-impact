import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import PyPDF2
from typing import Optional

app = FastAPI(title="Career Mitra API")

# Configure CORS so the React frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Placeholder for Gemini API Key. The user will need to set this in their environment.
# genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

class AnalysisResponse(BaseModel):
    match_score: int
    scam_probability_score: int
    scam_red_flags: list[str]
    missing_skills: list[str]
    study_recommendations: list[str]

@app.get("/")
def read_root():
    return {"message": "Welcome to Career Mitra API"}

async def parse_file(file: UploadFile, label: str):
    filename = file.filename.lower()
    allowed_exts = ('.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx')
    if not filename.endswith(allowed_exts):
        raise HTTPException(status_code=400, detail=f"Invalid file type: {file.filename}. Supported formats are PDF, PNG, JPG, DOC, DOCX.")
    
    content = []
    try:
        if filename.endswith('.pdf'):
            pdf_reader = PyPDF2.PdfReader(file.file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            content.append(f"{label} Text:\n{text}")
            
        elif filename.endswith(('.png', '.jpg', '.jpeg')):
            import PIL.Image
            import io
            image_data = await file.read()
            image = PIL.Image.open(io.BytesIO(image_data))
            content.append(f"{label} Image:")
            content.append(image)
            
        elif filename.endswith(('.doc', '.docx')):
            import docx
            import io
            doc_data = await file.read()
            doc = docx.Document(io.BytesIO(doc_data))
            text = "\n".join([para.text for para in doc.paragraphs])
            content.append(f"{label} Text:\n{text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse {label}: {str(e)}")
    return content

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_job_fit(
    job_description_text: Optional[str] = Form(None),
    job_description_file: Optional[UploadFile] = File(None),
    resume: UploadFile = File(...)
):
    resume_content = await parse_file(resume, "Resume")
    
    if not job_description_text and (not job_description_file or not job_description_file.filename):
        raise HTTPException(status_code=400, detail="Must provide either job description text or a job description file.")
        
    jd_content = []
    if job_description_text:
        jd_content.append(f"Job Description Text:\n{job_description_text}")
    if job_description_file and job_description_file.filename:
        jd_content.extend(await parse_file(job_description_file, "Job Description"))

    # Call Gemini API
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return AnalysisResponse(
            match_score=75,
            scam_probability_score=10,
            scam_red_flags=["WARNING: GEMINI_API_KEY not set. This is mock data."],
            missing_skills=["React Native", "GraphQL"],
            study_recommendations=[
                "Learn React Native basics: https://reactnative.dev/",
                "Understand GraphQL queries: https://graphql.org/"
            ]
        )
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash', generation_config={"response_mime_type": "application/json"})
    
    prompt = f"""
    You are an expert Technical Recruiter and Cybersecurity Analyst. 
    Analyze the following Resume and Job Description provided.
    
    Return a JSON object with EXACTLY the following structure:
    {{
        "match_score": <int 0-100>,
        "scam_probability_score": <int 0-100, based on generic descriptions, requests for money, suspicious emails>,
        "scam_red_flags": [<list of strings detailing suspicious elements>],
        "missing_skills": [<list of strings detailing required skills missing from the resume>],
        "study_recommendations": [<list of actionable study resources or topics to bridge the gap>]
    }}
    """
    
    content_to_send = [prompt] + jd_content + resume_content
    
    try:
        response = model.generate_content(content_to_send)
        import json
        result = json.loads(response.text)
        return AnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Analysis Failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
