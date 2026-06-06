<div align="center">

# 🚀 Career Mitra 

**Your AI companion for Resume Fit, Skill Gap Analysis & Job Scam Detection**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](#)
[![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)](#)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](#)

<br/>

<img src="https://via.placeholder.com/800x400/f8fafc/0f172a?text=Career+Mitra+Dashboard" alt="Career Mitra UI Preview" width="800" style="border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);"/>

<br/>
<br/>

An intelligent, completely free applicant tracking system (ATS) analyzer that ensures your resume passes automated scans and secures you interviews faster.

[Explore Features](#-features-that-get-you-hired) • [Installation](#-installation--local-setup) • [Tech Stack](#-tech-stack)

</div>

---

## ✨ Features That Get You Hired

### 🛡️ Job Scam Detection
Don't fall victim to fake job postings! Our sophisticated AI engine reads between the lines of Job Descriptions to spot requests for money, overly generic phrasing, and classic scam red flags. You'll receive a **definitive Scam Probability Score** before you even apply.

### 📊 Comprehensive ATS Scoring
Just drag and drop your Resume and Job Description. We parse everything securely (supporting PDF, DOCX, PNG, and JPG formats) and immediately generate an **ATS Match Score (0-100%)**.

### 🎯 Skill Gap Analysis
Stop guessing what recruiters want. Career Mitra performs a **Line-by-Line Analysis** to show you the exact core keywords and hard skills missing from your resume, visually highlighted so you can quickly update your CV.

### 💡 Personalized Recommendations
If you lack a critical skill for your dream job, we don't just tell you—we help you learn it. Our AI automatically fetches relevant study materials and links so you can bridge the gap fast.

### 🎨 Stunning Modern UI
Experience a blazing fast, professional, side-by-side comparison interface featuring glassmorphism and clean typography. Built for ease of use.

---

## 💻 Tech Stack

- **Frontend:** React, Vite, Vanilla CSS (Premium Light Theme)
- **Backend:** Python, FastAPI, Uvicorn
- **AI Brain:** Google Gemini SDK (`gemini-2.5-flash`)
- **Document Parsers:** `PyPDF2`, `python-docx`, `Pillow`

---

## 🚀 Installation & Local Setup

Get Career Mitra running on your local machine in seconds. You will need Node.js and Python 3.10+ installed.

### 1. Clone the repository
```bash
git clone https://github.com/t00fan01/Ai-for-impact.git
cd Ai-for-impact
```

### 2. Launch the Backend API
```bash
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Set your Gemini API Key
$env:GEMINI_API_KEY="YOUR_KEY_HERE"

# Start FastAPI Server
uvicorn main:app --reload
```
> The API will be active at `http://localhost:8000`

### 3. Launch the Frontend
Open a **new** terminal window:
```bash
cd frontend

# Install Node modules
npm install

# Start Vite Development Server
npm run dev
```
> The beautiful UI is now live at `http://localhost:5173` 🎉

---

<div align="center">
  <b>Built for Hackathon | Built to make an Impact</b><br>
  Crafted with ❤️ by t00fan01
</div>
