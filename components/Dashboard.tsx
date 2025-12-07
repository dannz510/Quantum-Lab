
import React from 'react';
import { PieChart, TrendingUp, Zap, ChevronRight, Activity, BookOpen, Star } from 'lucide-react';
import { AppMode } from '../types';

interface DashboardProps {
  setMode: (mode: AppMode) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setMode }) => {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* Welcome & Focus Card */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, Scientist</h1>
          <p className="text-slate-400">Your laboratory is ready. Today is a great day to explore dynamics.</p>
        </div>
        
        {/* Focus Card (AI Driven Recommendation) */}
        <div className="flex-1 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden group cursor-pointer hover:border-blue-400/50 transition-all"
             onClick={() => setMode(AppMode.SIM_SELECTOR)}>
           <div className="absolute top-0 right-0 p-24 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
           <div className="relative z-10">
             <div className="flex items-center gap-2 text-blue-300 font-bold uppercase text-xs tracking-wider mb-2">
               <Star size={12} className="fill-blue-300" /> Recommended Focus
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Mechanics Mastery</h3>
             <p className="text-slate-300 text-sm mb-4">You've mastered static friction. Now, let's test your knowledge on large-angle pendulum dynamics.</p>
             <button className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20">
               Go to Simulator <ChevronRight size={16} />
             </button>
           </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-lab-card p-6 rounded-2xl border border-slate-700/50 flex flex-col items-center text-center">
           <div className="w-24 h-24 rounded-full border-4 border-slate-700 border-t-green-500 border-r-green-500 mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">75%</span>
           </div>
           <h3 className="font-semibold text-white">Mechanics</h3>
           <p className="text-xs text-slate-500 mt-1">Advanced proficiency</p>
        </div>

        <div className="bg-lab-card p-6 rounded-2xl border border-slate-700/50 flex flex-col items-center text-center">
           <div className="w-24 h-24 rounded-full border-4 border-slate-700 border-t-amber-500 mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">30%</span>
           </div>
           <h3 className="font-semibold text-white">Electronics</h3>
           <p className="text-xs text-slate-500 mt-1">Intermediate learner</p>
        </div>

        <div className="bg-lab-card p-6 rounded-2xl border border-slate-700/50 flex flex-col items-center text-center">
           <div className="w-24 h-24 rounded-full border-4 border-slate-700 border-t-purple-500 border-l-purple-500 mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">50%</span>
           </div>
           <h3 className="font-semibold text-white">Quantum</h3>
           <p className="text-xs text-slate-500 mt-1">Growing rapidly</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <button onClick={() => setMode(AppMode.SIM_SELECTOR)} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl text-left transition-colors border border-transparent hover:border-slate-600">
              <Activity className="text-teal-400 mb-2" />
              <div className="font-medium text-white">Lab Simulator</div>
              <div className="text-xs text-slate-500">Start new experiment</div>
           </button>
           <button onClick={() => setMode(AppMode.DEEP_THINK)} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl text-left transition-colors border border-transparent hover:border-slate-600">
              <Zap className="text-purple-400 mb-2" />
              <div className="font-medium text-white">Deep Thinker</div>
              <div className="text-xs text-slate-500">Solve complex problems</div>
           </button>
           <button onClick={() => setMode(AppMode.CHAT_TUTOR)} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl text-left transition-colors border border-transparent hover:border-slate-600">
              <BookOpen className="text-blue-400 mb-2" />
              <div className="font-medium text-white">My Tutor</div>
              <div className="text-xs text-slate-500">Review concepts</div>
           </button>
           <button onClick={() => setMode(AppMode.SEARCH_GROUND)} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl text-left transition-colors border border-transparent hover:border-slate-600">
              <TrendingUp className="text-emerald-400 mb-2" />
              <div className="font-medium text-white">Research</div>
              <div className="text-xs text-slate-500">Live physics news</div>
           </button>
        </div>
      </div>

    </div>
  );
};