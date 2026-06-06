import { ArrowRight, ShieldCheck, Target, Zap } from 'lucide-react'

export function LandingPage({ onStart }) {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700 pt-10 md:pt-20">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
        <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
        AI-Powered Job Success
      </div>
      
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
        Land Your Dream Job <br className="hidden md:block" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
          Without the Guesswork
        </span>
      </h1>
      
      <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        Upload your resume and the job description. Our AI evaluates your fit, generates a personalized study plan to close skill gaps, and scans the job posting for potential scams.
      </p>
      
      <button 
        onClick={onStart}
        className="group relative px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl text-lg overflow-hidden shadow-xl shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
      >
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <span className="relative flex items-center gap-2 group-hover:text-white transition-colors duration-300">
          Analyze My Resume Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </button>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full text-left">
        <div className="glass-panel p-6 hover:border-indigo-500/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Match Analysis</h3>
          <p className="text-slate-400 text-sm">Get a precise compatibility score based on technical requirements and soft skills mentioned in the JD.</p>
        </div>
        
        <div className="glass-panel p-6 hover:border-emerald-500/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Skill Gap Roadmap</h3>
          <p className="text-slate-400 text-sm">Don't just get rejected. We provide actionable study recommendations to bridge your missing skills instantly.</p>
        </div>
        
        <div className="glass-panel p-6 hover:border-rose-500/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Scam Detection</h3>
          <p className="text-slate-400 text-sm">Our AI acts as a cybersecurity analyst, flagging suspicious job postings so you can apply safely.</p>
        </div>
      </div>
    </div>
  )
}
