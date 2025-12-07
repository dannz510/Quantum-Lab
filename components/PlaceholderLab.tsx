
import React from 'react';
import { Settings, Save, AlertCircle, Hammer, Construction, CircuitBoard } from 'lucide-react';

interface PlaceholderLabProps {
  title?: string;
}

export const PlaceholderLab: React.FC<PlaceholderLabProps> = ({ title = "Lab Under Construction" }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-900 relative overflow-hidden">
      {/* Background Grid Animation */}
      <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', 
          backgroundSize: '50px 50px',
          animation: 'pulse 4s infinite' 
      }}></div>

      <div className="relative z-10 max-w-2xl text-center space-y-8 p-12 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl">
         <div className="relative">
             <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse"></div>
             <div className="w-24 h-24 bg-slate-900 border-2 border-dashed border-blue-500/50 rounded-full flex items-center justify-center mx-auto relative z-10">
                <CircuitBoard size={48} className="text-blue-400 animate-spin-slow" />
             </div>
         </div>

         <div className="space-y-4">
             <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
             <p className="text-slate-400 text-lg">
               This simulation module is currently in the <strong>Quantum Development Pipeline</strong>. 
               Our physics engine requires calibration for this specific phenomenon.
             </p>
         </div>

         <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 text-left">
                 <div className="text-xs text-slate-500 uppercase font-bold mb-1">Status</div>
                 <div className="text-yellow-400 font-mono flex items-center gap-2"><Construction size={14}/> Engineering</div>
             </div>
             <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 text-left">
                 <div className="text-xs text-slate-500 uppercase font-bold mb-1">ETA</div>
                 <div className="text-blue-400 font-mono">Coming Soon</div>
             </div>
         </div>
         
         <div className="pt-4 border-t border-slate-700/50">
             <p className="text-xs text-slate-600 font-mono">SYSTEM ID: DEV-MOD-404 // ASSETS COMPILING...</p>
         </div>
      </div>
    </div>
  );
};
