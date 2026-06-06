import { useEffect, useMemo, useState } from 'react'
import { UploadCloud, FileText, Loader2, AlertCircle, X, History, ShieldAlert, ShieldCheck, Trash2, Link2, Sparkles } from 'lucide-react'
import { ResultsView } from './ResultsView'

const MAX_FILE_MB = 10
const MIN_JD_CHARS = 40
const REQUEST_TIMEOUT_MS = 45000
const MAX_RETRIES = 1
const HISTORY_STORAGE_KEY = 'careerMitra.analysisHistory.v1'
const SESSION_STORAGE_KEY = 'careerMitra.sessionToken.v1'
const MAX_HISTORY_ITEMS = 8
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const FREE_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'proton.me',
  'aol.com',
  'icloud.com',
]

export function Dashboard() {
  const [file, setFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [attemptLabel, setAttemptLabel] = useState('')
  const [historyItems, setHistoryItems] = useState([])
  const [sessionToken, setSessionToken] = useState('')
  const [sessionUserId, setSessionUserId] = useState('')
  const [sessionLoading, setSessionLoading] = useState(true)
  const [jobUrl, setJobUrl] = useState('')
  const [parsingUrl, setParsingUrl] = useState(false)

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (!savedHistory) {
        return
      }
      const parsed = JSON.parse(savedHistory)
      if (Array.isArray(parsed)) {
        setHistoryItems(parsed)
      }
    } catch {
      localStorage.removeItem(HISTORY_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    const bootstrapSession = async () => {
      setSessionLoading(true)
      try {
        const cachedToken = localStorage.getItem(SESSION_STORAGE_KEY)
        if (cachedToken) {
          const meResponse = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'X-Session-Token': cachedToken,
            },
          })
          if (meResponse.ok) {
            const meData = await meResponse.json()
            setSessionToken(cachedToken)
            setSessionUserId(meData.user_id || 'guest')
            return
          }
        }

        const loginResponse = await fetch(`${API_URL}/auth/guest-login`, {
          method: 'POST',
        })
        if (!loginResponse.ok) {
          throw new Error('Could not create guest session.')
        }

        const loginData = await loginResponse.json()
        localStorage.setItem(SESSION_STORAGE_KEY, loginData.token)
        setSessionToken(loginData.token)
        setSessionUserId(loginData.user_id || 'guest')
      } catch {
        setError('Could not establish session. Backend may be offline.')
      } finally {
        setSessionLoading(false)
      }
    }

    bootstrapSession()
  }, [])

  const trustSignals = useMemo(() => {
    const text = jobDescription.trim()
    if (!text) {
      return []
    }

    const lowerText = text.toLowerCase()
    const emails = lowerText.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g) || []
    const hasFreeEmail = emails.some((email) => FREE_EMAIL_DOMAINS.includes(email.split('@')[1]))

    return [
      {
        label: 'Company Identity Is Mentioned',
        status: /(company|inc\.?|llc|ltd\.?|about us|organization|headquarters)/i.test(text) ? 'pass' : 'warn',
        help: 'Legit postings usually mention employer identity and context.',
      },
      {
        label: 'Contact Method Looks Professional',
        status: emails.length === 0 ? 'warn' : hasFreeEmail ? 'warn' : 'pass',
        help: 'Corporate domain emails are typically safer than free email providers.',
      },
      {
        label: 'Compensation Details Included',
        status: /(salary|compensation|ctc|lpa|per annum|benefits|bonus|stipend|usd|inr|rs\.?)/i.test(text) ? 'pass' : 'warn',
        help: 'Clear pay/benefits can be a quality signal for job legitimacy.',
      },
      {
        label: 'No High-Pressure Scam Language',
        status: /(registration fee|pay fee|processing fee|whatsapp only|telegram only|urgent immediate join|pay to apply|security deposit)/i.test(lowerText) ? 'danger' : 'pass',
        help: 'Requests for payment or off-platform urgency are major scam red flags.',
      },
    ]
  }, [jobDescription])

  const trustSummary = useMemo(() => {
    const dangerous = trustSignals.filter((signal) => signal.status === 'danger').length
    const warnings = trustSignals.filter((signal) => signal.status === 'warn').length
    if (dangerous > 0) {
      return { label: 'High Caution', tone: 'text-rose-700 bg-rose-50 border-rose-200' }
    }
    if (warnings > 1) {
      return { label: 'Moderate Caution', tone: 'text-amber-700 bg-amber-50 border-amber-200' }
    }
    return { label: 'Looks Reasonable', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  }, [trustSignals])

  const persistHistory = (item) => {
    setHistoryItems((previousItems) => {
      const next = [item, ...previousItems].slice(0, MAX_HISTORY_ITEMS)
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const clearHistory = () => {
    setHistoryItems([])
    localStorage.removeItem(HISTORY_STORAGE_KEY)
  }

  const validateResume = (candidateFile) => {
    if (!candidateFile) {
      return 'Please upload a resume PDF.'
    }

    const isPdfByMime = candidateFile.type === 'application/pdf'
    const isPdfByName = candidateFile.name?.toLowerCase().endsWith('.pdf')
    if (!isPdfByMime && !isPdfByName) {
      return 'Only PDF files are supported.'
    }

    if (candidateFile.size > MAX_FILE_MB * 1024 * 1024) {
      return `Resume size must be ${MAX_FILE_MB} MB or less.`
    }

    return null
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const fileError = validateResume(selectedFile)
      if (fileError) {
        setFile(null)
        setError(fileError)
        return
      }
      setError(null)
      setFile(selectedFile)
    }
  }

  const removeFile = (e) => {
    e.stopPropagation()
    setFile(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      const fileError = validateResume(droppedFile)
      if (fileError) {
        setFile(null)
        setError(fileError)
        return
      }
      setError(null)
      setFile(droppedFile)
    }
  }

  const fetchWithTimeout = async (url, options, timeoutMs) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }
  }

  const parseJobFromUrl = async () => {
    const trimmedUrl = jobUrl.trim()
    if (!trimmedUrl) {
      setError('Please enter a job posting URL to auto-fetch details.')
      return
    }

    if (!sessionToken) {
      setError('Session is not ready yet. Please wait a moment and retry.')
      return
    }

    setParsingUrl(true)
    setError(null)
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/parse-job-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken,
          },
          body: JSON.stringify({ url: trimmedUrl }),
        },
        REQUEST_TIMEOUT_MS,
      )

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to parse job URL.')
      }

      const data = await response.json()
      setJobDescription(data.job_description || '')
      setAttemptLabel('Job description imported from URL successfully.')
      setTimeout(() => setAttemptLabel(''), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setParsingUrl(false)
    }
  }

  const handleAnalyze = async () => {
    const fileError = validateResume(file)
    if (fileError) {
      setError(fileError)
      return
    }

    if (!sessionToken) {
      setError('Session is not ready yet. Please wait a moment and retry.')
      return
    }

    const trimmedJD = jobDescription.trim()
    if (!trimmedJD) {
      setError("Please provide both a resume PDF and a job description.")
      return
    }
    if (trimmedJD.length < MIN_JD_CHARS) {
      setError(`Job description must be at least ${MIN_JD_CHARS} characters.`)
      return
    }

    setLoading(true)
    setError(null)
    setAttemptLabel('Preparing request...')

    const formData = new FormData()
    formData.append('resume', file)
    formData.append('job_description', trimmedJD)

    try {
      let finalResponse = null
      let lastError = null

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        try {
          setAttemptLabel(attempt === 0 ? 'Analyzing your profile...' : 'Retrying to stabilize connection...')
          const response = await fetchWithTimeout(
            `${API_URL}/analyze`,
            {
              method: 'POST',
              body: formData,
              headers: {
                'X-Session-Token': sessionToken,
              },
            },
            REQUEST_TIMEOUT_MS,
          )

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            throw new Error(errData.detail || 'Failed to analyze.')
          }

          finalResponse = response
          break
        } catch (err) {
          lastError = err
          const isAbort = err?.name === 'AbortError'
          if (attempt >= MAX_RETRIES) {
            if (isAbort) {
              throw new Error('Request timed out. Please try again in a moment.')
            }
            throw err
          }
        }
      }

      if (!finalResponse) {
        throw lastError || new Error('Failed to analyze.')
      }

      const data = await finalResponse.json()
      setResults(data)
      persistHistory({
        id: Date.now(),
        createdAt: new Date().toISOString(),
        resumeName: file.name,
        jobDescriptionPreview: trimmedJD.slice(0, 120),
        result: data,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setAttemptLabel('')
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
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 text-xs text-slate-600">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          {sessionLoading ? 'Connecting secure guest session...' : `Session active: ${sessionUserId || 'guest'}`}
        </div>
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
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8" />
                  </div>
                  <button 
                    onClick={removeFile}
                    className="absolute -top-2 -right-2 bg-rose-100 text-rose-600 rounded-full p-1 hover:bg-rose-200 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="font-medium text-slate-900 truncate w-full px-4" title={file.name}>{file.name}</p>
                <p className="text-sm text-indigo-600 mt-2 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
          <div className="flex justify-between items-end ml-1">
            <label className="text-sm font-semibold text-slate-700">Job Description</label>
            {jobDescription && (
              <button 
                onClick={() => setJobDescription('')}
                className="text-xs text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <textarea 
            className="input-field h-64 resize-none glass-panel"
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          ></textarea>

          <div className="glass-panel p-3 border border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">Or auto-import from job posting URL</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className="input-field pl-9"
                  placeholder="https://company.com/careers/job-posting"
                />
              </div>
              <button
                onClick={parseJobFromUrl}
                disabled={parsingUrl || sessionLoading}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                {parsingUrl ? 'Fetching...' : 'Fetch'}
              </button>
            </div>
          </div>

          {trustSignals.length > 0 && (
            <div className="glass-panel p-4 mt-2 border-2 border-slate-200">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-600" /> JD Trust Checklist
                </h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${trustSummary.tone}`}>
                  {trustSummary.label}
                </span>
              </div>
              <ul className="space-y-2">
                {trustSignals.map((signal, index) => (
                  <li key={index} className="text-xs">
                    <div className="flex items-start gap-2 text-slate-700">
                      {signal.status === 'pass' ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      ) : signal.status === 'danger' ? (
                        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold">{signal.label}</p>
                        <p className="text-slate-500">{signal.help}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <button
          onClick={handleAnalyze}
          disabled={loading || sessionLoading || !file || !jobDescription.trim() || jobDescription.trim().length < MIN_JD_CHARS}
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

      <div className="mt-4 text-center min-h-6">
        {loading && attemptLabel && <p className="text-sm text-slate-600 animate-pulse">{attemptLabel}</p>}
        {!loading && <p className="text-xs text-slate-500">Tip: Better JD detail usually gives better gap-analysis quality.</p>}
      </div>

      <div className="mt-8 glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" /> Recent Analyses
          </h3>
          <button
            onClick={clearHistory}
            className="text-xs px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-600 flex items-center gap-1"
            disabled={historyItems.length === 0}
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>

        {historyItems.length === 0 ? (
          <p className="text-sm text-slate-500">No previous analysis yet. Run your first scan to create quick demo history.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {historyItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setResults(item.result)}
                className="text-left p-3 rounded-xl border border-slate-200 bg-white/60 hover:border-indigo-300 hover:bg-white transition-colors"
              >
                <p className="text-xs text-slate-500 mb-1">{new Date(item.createdAt).toLocaleString()}</p>
                <p className="text-sm font-semibold text-slate-800 truncate mb-2" title={item.resumeName}>{item.resumeName}</p>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.jobDescriptionPreview}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Match {item.result?.match_score ?? 0}%
                  </span>
                  <span className="px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    Scam {item.result?.scam_probability_score ?? 0}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
