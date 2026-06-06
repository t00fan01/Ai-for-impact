import { ArrowLeft, CheckCircle2, AlertTriangle, BookOpen, XCircle } from 'lucide-react'

export function ResultsView({ results, onReset }) {
  const {
    match_score,
    scam_probability_score,
    scam_red_flags,
    missing_skills,
    study_recommendations
  } = results

  const getMatchColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
    if (score >= 60) return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
    return 'text-rose-400 border-rose-400/30 bg-rose-400/10'
  }

  const getScamColor = (score) => {
    if (score >= 70) return 'text-rose-500 border-rose-500/30 bg-rose-500/10'
    if (score >= 30) return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
    return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
  }

  return (
    <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onReset}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Match Score Card */}
        <div className={`glass-panel p-8 border-2 flex flex-col items-center justify-center text-center ${getMatchColor(match_score)}`}>
          <h3 className="text-lg font-semibold mb-2 opacity-80">Match Score</h3>
          <div className="text-6xl font-bold mb-4">{match_score}%</div>
          <p className="text-sm opacity-80">
            {match_score >= 80 ? 'Excellent match! You are highly qualified.' : 
             match_score >= 60 ? 'Good match. You meet most requirements.' : 
             'Low match. Consider upskilling.'}
          </p>
        </div>

        {/* Scam Detection Card */}
        <div className={`glass-panel p-8 border-2 flex flex-col items-center justify-center text-center ${getScamColor(scam_probability_score)}`}>
          <h3 className="text-lg font-semibold mb-2 opacity-80">Scam Probability</h3>
          <div className="text-6xl font-bold mb-4">{scam_probability_score}%</div>
          <p className="text-sm opacity-80">
            {scam_probability_score >= 70 ? 'High Risk! Proceed with extreme caution.' : 
             scam_probability_score >= 30 ? 'Moderate Risk. Verify company details.' : 
             'Low Risk. Looks like a legitimate posting.'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Scam Red Flags */}
        {scam_red_flags && scam_red_flags.length > 0 && (
          <div className="glass-panel p-6 border border-rose-500/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="text-rose-500 w-6 h-6" /> 
              Potential Red Flags
            </h3>
            <ul className="space-y-3">
              {scam_red_flags.map((flag, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300">
                  <XCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Skills */}
        <div className="glass-panel p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Target className="text-indigo-400 w-6 h-6" /> 
            Missing Skills (Gap Analysis)
          </h3>
          {missing_skills && missing_skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {missing_skills.map((skill, i) => (
                <span key={i} className="px-4 py-2 rounded-full bg-[#0f172a] border border-white/10 text-slate-300 text-sm">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> You have all the required skills mentioned!
            </p>
          )}
        </div>

        {/* Study Recommendations */}
        <div className="glass-panel p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="text-purple-400 w-6 h-6" /> 
            Actionable Study Plan
          </h3>
          <ul className="space-y-4">
            {study_recommendations && study_recommendations.length > 0 ? (
              study_recommendations.map((rec, i) => (
                <li key={i} className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 text-slate-300">
                  {rec}
                </li>
              ))
            ) : (
              <p className="text-slate-400">No specific study recommendations needed.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

// Ensure Target icon is imported for the Missing Skills section if not already
import { Target } from 'lucide-react'
