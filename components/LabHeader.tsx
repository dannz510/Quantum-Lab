
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';

interface LabHeaderProps {
  onBack: () => void;
  title: string;
  lang: 'en' | 'vi';
}

export const LabHeader: React.FC<LabHeaderProps> = ({ onBack, title, lang }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-50">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-bold">{lang === 'vi' ? 'Quay Lại' : 'Back'}</span>
      </button>

      <h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest hidden md:block">
        {title}
      </h2>

      <div className="flex items-center gap-2 text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
        <Clock size={14} className="text-blue-400" />
        <span className="text-xs font-mono">
          {time.toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour12: false })}
        </span>
      </div>
    </div>
  );
};
