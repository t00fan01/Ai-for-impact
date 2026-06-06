import { useState } from 'react'
import './index.css'

function App() {
  const [file, setFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [jobDescriptionFile, setJobDescriptionFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('careerMitraHistory')
    return saved ? JSON.parse(saved) : []
  })
  const [showHistory, setShowHistory] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || (!jobDescription && !jobDescriptionFile)) {
      setError("Please provide both a Resume and a Job Description.")
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append("resume", file)
    if (jobDescription) formData.append("job_description_text", jobDescription)
    if (jobDescriptionFile) formData.append("job_description_file", jobDescriptionFile)

    try {
      const response = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        let errorMsg = response.statusText;
        try {
          const errData = await response.json();
          if (errData.detail) errorMsg = errData.detail;
        } catch (err) {}
        throw new Error(errorMsg)
      }

      const data = await response.json()
      setResults(data)

      const historyItem = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        jobSnippet: jobDescription ? jobDescription.substring(0, 40) + '...' : (jobDescriptionFile ? jobDescriptionFile.name : 'Job Description'),
        match_score: data.match_score,
        data: data
      }
      const newHistory = [historyItem, ...history]
      setHistory(newHistory)
      localStorage.setItem('careerMitraHistory', JSON.stringify(newHistory))

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getScoreClass = (score) => {
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  return (
    <>
      <nav className="navbar">
        <div className="logo" onClick={() => { setResults(null); setShowHistory(false); window.scrollTo({top: 0, behavior: 'smooth'}); }} style={{cursor: 'pointer'}}>
          <img src="/logo.png" alt="Career Mitra Logo" style={{height: '36px', width: '36px', objectFit: 'contain', borderRadius: '8px'}} />
          Career Mitra
        </div>
        <div className="nav-links">
          <span onClick={() => { setResults(null); setShowHistory(true); window.scrollTo(0,0); }}>History</span>
          <span onClick={() => alert("Magic Resume Editor is coming soon!")}>Magic Editor</span>
          <span onClick={() => alert("Career Mitra is 100% Free!")}>Pricing</span>
          <span onClick={() => document.getElementById('faq')?.scrollIntoView({behavior: 'smooth'})}>FAQ</span>
        </div>
        <div className="nav-buttons">
          <button onClick={() => { setResults(null); setShowHistory(false); window.scrollTo({top: 0, behavior: 'smooth'}); }}>Scan your Resume</button>
        </div>
      </nav>

      <div className="container">
        {showHistory && !results && !loading && (
          <div className="history-container">
            <div className="results-header">
              <h2>Your Past Scans</h2>
              <button className="reset-btn" onClick={() => setShowHistory(false)}>← Back to Scanner</button>
            </div>
            {history.length === 0 ? (
              <p style={{color: 'var(--text-muted)'}}>No past scans found yet. Scan a resume to see it here!</p>
            ) : (
              <div className="history-grid">
                {history.map((item) => (
                  <div key={item.id} className="history-card" onClick={() => { setResults(item.data); setShowHistory(false); }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <h4 style={{margin: '0 1rem 0.5rem 0', color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0}} title={item.jobSnippet}>{item.jobSnippet}</h4>
                      <div className={`score-badge ${getScoreClass(item.match_score)}`}>{item.match_score}%</div>
                    </div>
                    <p style={{margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)'}}>{item.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!showHistory && !results && !loading && (
          <>
            <div className="hero">
              <h1>🚀 Get Hired Faster with <span>Career Mitra!</span></h1>
              <p>
                Check and compare your resume and the job description with our Free ATS Friendly Resume checker now. 
                Our AI powered ATS Resume Checker will definitively enhance your chances of getting filtered through Applicant Tracking Systems (ATS).
              </p>
            </div>

            <form className="upload-container" onSubmit={handleSubmit}>
              {error && <div style={{color: 'var(--danger)', marginBottom: '1rem', fontWeight: 'bold'}}>{error}</div>}
              
              <h2 style={{marginTop: 0}}>Select your Resume / CV & Job Description:</h2>
              
              <div className="upload-grid">
                {/* Left Side: Resume */}
                <div className="upload-box">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    1. Upload Resume
                  </h3>
                  <div className="file-input-wrapper">
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) setFile(e.target.files[0])
                      }} 
                    />
                  </div>
                  <p style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>(Max: 5 MB | *.pdf *.png *.doc *.docx)</p>
                </div>

                {/* Right Side: Job Description */}
                <div className="upload-box">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                    2. Job Description
                  </h3>
                  <textarea 
                    placeholder="Paste the full job description or requirements here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                  <div className="file-input-wrapper">
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) setJobDescriptionFile(e.target.files[0])
                      }} 
                    />
                  </div>
                  <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.5rem 0 0'}}>Paste text OR upload JD file</p>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={!file || (!jobDescription && !jobDescriptionFile)}>
                Start Scan
              </button>
            </form>

            <div className="features-header">
              <h2>Why <span>Career Mitra</span> Resume Checker?</h2>
              <p style={{color: 'var(--text-muted)', lineHeight: '1.6'}}>
                Worrying about getting no responses from employers after applying? You are not alone. The job market today is highly competitive, and the first step to getting noticed by employers is to have an ATS Friendly Resume.
              </p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🔍</div>
                <h3>Comprehensive Analysis</h3>
                <p>Our Free ATS Resume Checker analyzes your resume against the job description, extracting keywords and hard skills.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📝</div>
                <h3>Line by Line Analysis</h3>
                <p>Our AI goes through your resume line by line, providing a detailed report on how well your resume aligns with the job.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💡</div>
                <h3>Personalized Recommendations</h3>
                <p>Get personalized recommendations after scanning your resume. Our AI provides targeted suggestions to enhance effectiveness.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🛡️</div>
                <h3>Job Scam Detection</h3>
                <p>Protect yourself from fake job postings. Our AI analyzes the JD for red flags, requests for money, and generic phrasing to keep you safe.</p>
              </div>
            </div>
          </>
        )}

        {loading && (
          <div className="loader-container">
            <div className="loader"></div>
            <h2>Running AI ATS Scan...</h2>
            <p style={{color: 'var(--text-muted)'}}>Please wait while we match your resume to the job description.</p>
          </div>
        )}

        {results && !loading && (
          <div className="results-container">
            <div className="results-header">
              <h2>Your ATS Match Report</h2>
              <button className="reset-btn" onClick={() => setResults(null)}>
                ← Scan Another Resume
              </button>
            </div>
            
            {results.scam_red_flags && results.scam_red_flags.length > 0 && (
               <div className="scam-alert">
                  <h4>⚠️ Warning: High Scam Probability</h4>
                  <ul>
                    {results.scam_red_flags.map((flag, idx) => (
                      <li key={idx}>{flag}</li>
                    ))}
                  </ul>
               </div>
            )}

            <div className="report-card">
              <div className="score-header" style={{flexWrap: 'wrap', gap: '2rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '2rem', flex: '1 1 min-content'}}>
                  <div className={`score-circle ${getScoreClass(results.match_score)}`}>
                    {results.match_score}%
                  </div>
                  <div className="score-details">
                    <h3>Overall ATS Match Score</h3>
                    <p>This score indicates how well your resume matches the required skills, experience, and qualifications found in the job description.</p>
                  </div>
                </div>

                <div style={{background: 'var(--bg-color)', padding: '1.25rem 2rem', borderRadius: '12px', border: '1px solid var(--border-color)', minWidth: '250px'}}>
                  <h4 style={{margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.1rem'}}>Fake Job Detection</h4>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem', color: results.scam_probability_score > 40 ? 'var(--danger)' : 'var(--success)'}}>
                    {results.scam_probability_score > 40 ? '⚠️ High Risk' : '✅ Safe'}
                    <span style={{color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.9rem'}}>({results.scam_probability_score}% Scam Probability)</span>
                  </div>
                </div>
              </div>

              <div style={{marginBottom: '2rem'}}>
                <h3 style={{color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <span style={{display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--danger)'}}></span> 
                  Missing Keywords & Skills
                </h3>
                <p style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>
                  These keywords were found in the job description but appear to be missing from your resume. Adding these (if you have the experience) will boost your score.
                </p>
                <div className="pill-container">
                  {results.missing_skills.length > 0 ? (
                    results.missing_skills.map((skill, index) => (
                      <span key={index} className="pill missing">{skill}</span>
                    ))
                  ) : (
                    <span style={{color: 'var(--success)', fontWeight: 'bold'}}>No missing core skills detected!</span>
                  )}
                </div>
              </div>

              <div>
                <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <span style={{display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)'}}></span> 
                  Study & Improvement Recommendations
                </h3>
                <ul style={{color: 'var(--text-main)', lineHeight: '1.6', paddingLeft: '1.5rem'}}>
                  {results.study_recommendations.map((rec, index) => {
                    const urlMatch = rec.match(/(https?:\/\/[^\s]+)/);
                    if (urlMatch) {
                      const url = urlMatch[0];
                      const text = rec.replace(url, '').trim();
                      return (
                        <li key={index}>
                          {text} <br/> <a href={url} target="_blank" rel="noreferrer" style={{color: 'var(--primary)'}}>Learn More →</a>
                        </li>
                      )
                    }
                    return <li key={index}>{rec}</li>
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {!showHistory && !loading && !results && (
        <div id="faq" className="container" style={{paddingTop: '2rem', paddingBottom: '4rem'}}>
          <div className="features-header" style={{marginTop: '2rem', textAlign: 'center'}}>
            <h2>Frequently Asked Questions <span>(FAQ)</span></h2>
          </div>
          
          <div className="faq-list" style={{maxWidth: '800px', margin: '0 auto'}}>
            <div className="faq-item">
              <h4>What is an ATS-Friendly Resume?</h4>
              <p>An ATS-friendly resume is formatted to pass seamlessly through Applicant Tracking Systems. Career Mitra ensures your keywords and formatting match what these robots look for.</p>
            </div>
            <div className="faq-item">
              <h4>How do I know if my resume is ATS Compliant?</h4>
              <p>By using Career Mitra! Our scanner performs a deep analysis and gives you an exact match score against the job description.</p>
            </div>
            <div className="faq-item">
              <h4>How does Fake Job Detection work?</h4>
              <p>Career Mitra uses advanced AI to scan job descriptions for common scam indicators, such as requests for payment, overly generic roles, or suspicious email domains. We give you a scam probability score so you can apply safely!</p>
            </div>
            <div className="faq-item">
              <h4>Is Career Mitra free?</h4>
              <p>Yes, Career Mitra is 100% free to use for job seekers. We believe everyone deserves a fair chance at landing their dream job.</p>
            </div>
          </div>
        </div>
      )}

      {!showHistory && !loading && !results && (
        <footer>
          <p>© 2026 Career Mitra. Built for Hackathon.</p>
        </footer>
      )}
    </>
  )
}

export default App
