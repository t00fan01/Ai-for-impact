import { useState } from 'react'
import { UploadCloud, FileText, Loader2, AlertCircle } from 'lucide-react'
import { ResultsView } from './ResultsView'

export function Dashboard() {
  const [file, setFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile)
      } else {
        setError("Only PDF files are supported.")
      }
    }
  }

  const handleAnalyze = async () => {
    if (!file || !jobDescription.trim()) {
      setError("Please provide both a resume PDF and a job description.")
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('resume', file)
    formData.append('job_description', jobDescription)

    try {
      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || "Failed to analyze.")
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (results) {
    return <ResultsView results={results} onReset={() => setResults(null)} />
  }

  return (
    <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4 text-slate-900">Start Your Analysis</h2>
        <p className="text-slate-600">Upload your PDF resume and paste the job description below.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-100 border border-rose-300 rounded-xl flex items-start gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* File Upload Zone */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 ml-1">Your Resume (PDF)</label>
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`glass-panel border-2 border-dashed ${file ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'} h-64 flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer group`}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <input 
              id="file-upload" 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              onChange={handleFileChange}
            />
            {file ? (
              <>
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8" />
                </div>
                <p className="font-medium text-slate-900 truncate w-full px-4">{file.name}</p>
                <p className="text-sm text-indigo-600 mt-2">Click to change</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 group-hover:scale-110 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="font-medium text-slate-700 mb-1">Drag & Drop your PDF here</p>
                <p className="text-sm text-slate-500">or click to browse files</p>
              </>
            )}
          </div>
        </div>

        {/* Job Description Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700 ml-1">Job Description</label>
          <textarea 
            className="input-field h-64 resize-none glass-panel"
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          ></textarea>
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <button 
          onClick={handleAnalyze}
          disabled={loading || !file || !jobDescription.trim()}
          className="btn-primary w-full md:w-auto md:min-w-[200px] flex items-center justify-center gap-2 text-lg py-4"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" /> Analyzing Match...
            </>
          ) : (
            'Analyze Compatibility'
          )}
        </button>
      </div>
    </div>
  )
}
