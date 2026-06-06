import { useState } from 'react'
import { LandingPage } from './components/LandingPage'
import { Dashboard } from './components/Dashboard'

function App() {
  const [started, setStarted] = useState(false)

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans overflow-x-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px]" />
      </div>
      
      <div className="relative z-10 w-full h-full min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full py-6 px-8 flex items-center justify-between border-b border-slate-200 backdrop-blur-md bg-white/80 sticky top-0 z-50">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStarted(false)}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              CareerMitra AI
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">How it works</a>
            <button className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-800">
              Sign In
            </button>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {!started ? (
            <LandingPage onStart={() => setStarted(true)} />
          ) : (
            <Dashboard />
          )}
        </main>
        
        {/* Footer */}
        <footer className="w-full py-6 text-center text-sm text-slate-500 border-t border-slate-200 mt-auto bg-white/50 backdrop-blur-sm">
          Built for the AI for Employability Hackathon &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  )
}

export default App
