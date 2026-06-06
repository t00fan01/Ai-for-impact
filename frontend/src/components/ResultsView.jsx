import { jsPDF } from 'jspdf'
import { ArrowLeft, CheckCircle2, AlertTriangle, BookOpen, XCircle, Target, Download } from 'lucide-react'

export function ResultsView({ results, onReset }) {
  const {
    match_score,
    scam_probability_score,
    scam_red_flags,
    missing_skills,
    study_recommendations
  } = results

  const getMatchColor = (score) => {
    if (score >= 80) return 'text-emerald-700 border-emerald-300 bg-emerald-50'
    if (score >= 60) return 'text-yellow-700 border-yellow-300 bg-yellow-50'
    return 'text-rose-700 border-rose-300 bg-rose-50'
  }

  const getScamColor = (score) => {
    if (score >= 70) return 'text-rose-700 border-rose-300 bg-rose-50'
    if (score >= 30) return 'text-yellow-700 border-yellow-300 bg-yellow-50'
    return 'text-emerald-700 border-emerald-300 bg-emerald-50'
  }

  const getScamLabel = (score) => {
    if (score >= 70) return 'High Risk'
    if (score >= 30) return 'Moderate Risk'
    return 'Low Risk'
  }

  const getMatchLabel = (score) => {
    if (score >= 80) return 'Strong Fit'
    if (score >= 60) return 'Potential Fit'
    return 'Needs Upskilling'
  }

  const improvementBullets = (missing_skills || [])
    .slice(0, 5)
    .map((skill) => `Demonstrated hands-on experience with ${skill} through project-based delivery, testing, and measurable outcomes.`)

  const exportReportPdf = () => {
    const doc = new jsPDF()
    let y = 16

    const addHeading = (text) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text(text, 14, y)
      y += 8
    }

    const addBody = (text) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const lines = doc.splitTextToSize(text, 180)
      doc.text(lines, 14, y)
      y += lines.length * 5 + 2
      if (y > 275) {
        doc.addPage()
        y = 16
      }
    }

    addHeading('CareerMitra AI - Employability Report')
    addBody(`Generated: ${new Date().toLocaleString()}`)
    addBody(`Match Score: ${match_score}%`) 
    addBody(`Scam Probability Score: ${scam_probability_score}% (${getScamLabel(scam_probability_score)})`)

    addHeading('Scam Red Flags')
    if ((scam_red_flags || []).length === 0) {
      addBody('No red flags identified.')
    } else {
      scam_red_flags.forEach((item, index) => addBody(`${index + 1}. ${item}`))
    }

    addHeading('Missing Skills')
    if ((missing_skills || []).length === 0) {
      addBody('No missing skills identified.')
    } else {
      missing_skills.forEach((item, index) => addBody(`${index + 1}. ${item}`))
    }

    addHeading('Study Recommendations')
    if ((study_recommendations || []).length === 0) {
      addBody('No specific study recommendations.')
    } else {
      study_recommendations.forEach((item, index) => addBody(`${index + 1}. ${item}`))
    }

    addHeading('Resume Improvement Bullets')
    if (improvementBullets.length === 0) {
      addBody('No improvement bullets required.')
    } else {
      improvementBullets.forEach((item, index) => addBody(`${index + 1}. ${item}`))
    }

    doc.save(`employability-report-${Date.now()}.pdf`)
  }

  return (
    <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <button
          onClick={exportReportPdf}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold"
        >
          <Download className="w-4 h-4" /> Export PDF Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Match Score Card */}
        <div className={`glass-panel p-8 border-2 flex flex-col items-center justify-center text-center ${getMatchColor(match_score)}`}>
          <h3 className="text-lg font-bold mb-2 opacity-80">Match Score</h3>
          <div className="text-6xl font-black mb-4">{match_score}%</div>
          <div className="w-full max-w-xs h-3 rounded-full bg-white/70 border border-white/60 overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-700"
              style={{ width: `${Math.max(0, Math.min(match_score, 100))}%` }}
            />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-white/80 border border-current/20 mb-3">
            {getMatchLabel(match_score)}
          </span>
          <p className="text-sm font-medium opacity-90">
            {match_score >= 80 ? 'Excellent match! You are highly qualified.' : 
             match_score >= 60 ? 'Good match. You meet most requirements.' : 
             'Low match. Consider upskilling.'}
          </p>
        </div>

        {/* Scam Detection Card */}
        <div className={`glass-panel p-8 border-2 flex flex-col items-center justify-center text-center ${getScamColor(scam_probability_score)}`}>
          <h3 className="text-lg font-bold mb-2 opacity-80">Scam Probability</h3>
          <div className="text-6xl font-black mb-4">{scam_probability_score}%</div>
          <div className="w-full max-w-xs h-3 rounded-full bg-white/70 border border-white/60 overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-700"
              style={{ width: `${Math.max(0, Math.min(scam_probability_score, 100))}%` }}
            />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-white/80 border border-current/20 mb-3">
            {getScamLabel(scam_probability_score)}
          </span>
          <p className="text-sm font-medium opacity-90">
            {scam_probability_score >= 70 ? 'High Risk! Proceed with extreme caution.' : 
             scam_probability_score >= 30 ? 'Moderate Risk. Verify company details.' : 
             'Low Risk. Looks like a legitimate posting.'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Scam Red Flags */}
        {scam_red_flags && scam_red_flags.length > 0 && (
          <div className="glass-panel p-6 border-2 border-rose-200">
            <h3 className="text-xl font-bold text-rose-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-rose-600 w-6 h-6" /> 
              Potential Red Flags
            </h3>
            <ul className="space-y-3">
              {scam_red_flags.map((flag, i) => (
                <li key={i} className="flex items-start gap-3 text-rose-900">
                  <XCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Skills */}
        <div className="glass-panel p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Target className="text-indigo-600 w-6 h-6" /> 
            Missing Skills (Gap Analysis)
          </h3>
          {missing_skills && missing_skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {missing_skills.map((skill, i) => (
                <span key={i} className="px-4 py-2 rounded-full bg-white border border-slate-300 text-slate-700 text-sm font-medium shadow-sm">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-emerald-600 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> You have all the required skills mentioned!
            </p>
          )}
        </div>

        {/* Study Recommendations */}
        <div className="glass-panel p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BookOpen className="text-purple-600 w-6 h-6" /> 
            Actionable Study Plan
          </h3>
          <ul className="space-y-4">
            {study_recommendations && study_recommendations.length > 0 ? (
              study_recommendations.map((rec, i) => (
                <li key={i} className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 shadow-sm">
                  {rec}
                </li>
              ))
            ) : (
              <p className="text-slate-500">No specific study recommendations needed.</p>
            )}
          </ul>
        </div>

        {/* Resume Improvement Bullets */}
        <div className="glass-panel p-6 border-2 border-indigo-200">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Target className="text-indigo-600 w-6 h-6" />
            Resume Improvement Bullets
          </h3>
          {improvementBullets.length > 0 ? (
            <ul className="space-y-3">
              {improvementBullets.map((bullet, index) => (
                <li key={index} className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm">
                  {bullet}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No missing skills detected. Your resume already aligns well with the role requirements.</p>
          )}
        </div>
      </div>
    </div>
  )
}
