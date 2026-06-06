import { ArrowRight, ShieldCheck, Target, Zap } from 'lucide-react'

export function LandingPage({ onStart }) {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700 pt-10 md:pt-20">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 text-sm font-medium mb-8">
        <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
        AI-Powered Job Success
      </div>
      
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-slate-900">
        Land Your Dream Job <br className="hidden md:block" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600">
          Without the Guesswork
        </span>
      </h1>
      
      <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
        Upload your resume and the job description. Our AI evaluates your fit, generates a personalized study plan to close skill gaps, and scans the job posting for potential scams.
      </p>
      
      <button 
        onClick={onStart}
        className="group relative px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl text-lg overflow-hidden shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
      >
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <span className="relative flex items-center gap-2 text-white transition-colors duration-300">
          Analyze My Resume Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </button>

      {/* Feature Grid */}
      <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full text-left">
        <div className="glass-panel p-6 hover:border-indigo-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Match Analysis</h3>
          <p className="text-slate-600 text-sm">Get a precise compatibility score based on technical requirements and soft skills mentioned in the JD.</p>
        </div>
        
        <div className="glass-panel p-6 hover:border-emerald-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Skill Gap Roadmap</h3>
          <p className="text-slate-600 text-sm">Don't just get rejected. We provide actionable study recommendations to bridge your missing skills instantly.</p>
        </div>
        
        <div className="glass-panel p-6 hover:border-rose-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Scam Detection</h3>
          <p className="text-slate-600 text-sm">Our AI acts as a cybersecurity analyst, flagging suspicious job postings so you can apply safely.</p>
        </div>
      </div>
    </div>
  )
}
