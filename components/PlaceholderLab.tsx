
import React from 'react';
import { Settings, Save, AlertCircle, Hammer } from 'lucide-react';

interface PlaceholderLabProps {
  title: string;
}

export const PlaceholderLab: React.FC<PlaceholderLabProps> = ({ title }) => {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
      
      {/* COLUMN 1: CONTROL PANEL */}
      <div className="lg:col-span-3 bg-lab-card border border-slate-700 rounded-2xl p-4 flex flex-col gap-6 opacity-50 pointer-events-none select-none">
        <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
          <Settings size={20} /> Experiment Setup
        </div>
        <div className="space-y-4">
            <div className="h-8 bg-slate-800 rounded w-full"></div>
            <div className="h-8 bg-slate-800 rounded w-3/4"></div>
            <div className="h-20 bg-slate-800 rounded w-full"></div>
        </div>
      </div>

      {/* COLUMN 2: MAIN VIEWPORT */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-700 relative overflow-hidden flex flex-col items-center justify-center text-center p-8">
             <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Hammer size={40} className="text-slate-500" />
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
             <p className="text-slate-400 max-w-md">
               This simulation module is currently under active development. The physics engine and visualization assets are being compiled.
             </p>
             <div className="mt-8 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                <span>Status: Unlocked / Construction</span>
             </div>
        </div>
      </div>

      {/* COLUMN 3: DATA */}
      <div className="lg:col-span-3 flex flex-col gap-4 opacity-50 pointer-events-none select-none">
        <div className="bg-lab-card border border-slate-700 rounded-2xl p-4 flex-1 overflow-hidden flex flex-col">
           <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2">
             <Save size={16} /> Data Logger
           </h3>
           <div className="flex-1 bg-slate-800/50 rounded-xl"></div>
        </div>
      </div>

    </div>
  );
};
