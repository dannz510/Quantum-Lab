import React from 'react';
import { PieChart, TrendingUp, Zap, ChevronRight, Activity, BookOpen, Star, Clock, Trophy } from 'lucide-react';
import { AppMode, Language } from '../types';

interface DashboardProps {
  setMode: (mode: AppMode) => void;
  sessionSeconds: number;
  labVisits: Record<string, number>;
  lang: Language;
}

export const Dashboard: React.FC<DashboardProps> = ({ setMode, sessionSeconds, labVisits, lang }) => {
  
  const formatTime = (totalSeconds: number) => {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTopLabs = () => {
      // Safety check to prevent Object.entries from crashing on undefined
      const visits = labVisits || {};
      const entries = Object.entries(visits);
      
      // Sort by visit count descending
      const sorted = entries.sort((a, b) => {
          const countA = a[1] || 0;
          const countB = b[1] || 0;
          return countB - countA;
      });

      return sorted.slice(0, 3).map((entry, idx) => {
          const key = entry[0];
          const count = entry[1];
          // Simple map from key to name (simplified)
          const name = key.replace('SIM_RUN_', '').replace('_', ' ');
          return { name, count, rank: idx + 1 };
      });
  };

  const topLabs = getTopLabs();
  const t = (en: string, vi: string) => lang === 'vi' ? vi : en;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* Welcome & Focus Card */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">{t("Welcome back, Scientist", "Chào mừng trở lại, Nhà khoa học")}</h1>
          <p className="text-slate-400">{t("Your laboratory is ready.", "Phòng thí nghiệm đã sẵn sàng.")}</p>
          
          <div className="flex items-center gap-4 mt-4">
             <div className="bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-3">
                 <div className="bg-blue-500/20 p-1.5 rounded text-blue-400"><Clock size={16}/></div>
                 <div>
                     <div className="text-[10px] text-slate-500 uppercase font-bold">{t("Session Time", "Thời gian phiên")}</div>
                     <div className="text-xl font-mono font-bold text-white">{formatTime(sessionSeconds)}</div>
                 </div>
             </div>
          </div>
        </div>
        
        {/* Focus Card (AI Driven Recommendation) */}
        <div className="flex-1 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden group cursor-pointer hover:border-blue-400/50 transition-all"
             onClick={() => setMode(AppMode.SIM_SELECTOR)}>
           <div className="absolute top-0 right-0 p-24 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
           <div className="relative z-10">
             <div className="flex items-center gap-2 text-blue-300 font-bold uppercase text-xs tracking-wider mb-2">
               <Star size={12} className="fill-blue-300" /> {t("Recommended Focus", "Đề Xuất")}
             </div>
             <h3 className="text-xl font-bold text-white mb-2">{t("Mechanics Mastery", "Làm Chủ Cơ Học")}</h3>
             <p className="text-slate-300 text-sm mb-4">{t("You've mastered static friction. Now, let's test your knowledge on large-angle pendulum dynamics.", "Bạn đã nắm vững ma sát tĩnh. Bây giờ hãy thử sức với động lực học con lắc góc lớn.")}</p>
             <button className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20">
               {t("Go to Simulator", "Vào Mô Phỏng")} <ChevronRight size={16} />
             </button>
           </div>
        </div>
      </div>

      {/* Stats & Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Ranking Column */}
        <div className="md:col-span-1 bg-gradient-to-b from-slate-800 to-slate-900 p-5 rounded-2xl border border-slate-700/50 shadow-lg">
            <div className="flex items-center gap-2 text-yellow-400 font-bold mb-4">
                <Trophy size={18} /> {t("Top Visited Labs", "Top Lab Truy Cập")}
            </div>
            <div className="space-y-3">
                {topLabs.length > 0 ? topLabs.map((lab) => (
                    <div key={lab.name} className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${lab.rank === 1 ? 'bg-yellow-500 text-black' : lab.rank === 2 ? 'bg-slate-400 text-black' : 'bg-orange-700 text-white'}`}>
                            {lab.rank}
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-white truncate capitalize">{lab.name.toLowerCase()}</div>
                            <div className="text-[10px] text-slate-500">{lab.count} {t("visits", "lượt")}</div>
                        </div>
                    </div>
                )) : (
                    <div className="text-xs text-slate-500 italic p-2">{t("No data yet. Start exploring!", "Chưa có dữ liệu.")}</div>
                )}
            </div>
        </div>

        {/* Categories Stats */}
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-lab-card p-6 rounded-2xl border border-slate-700/50 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full border-4 border-slate-700 border-t-green-500 border-r-green-500 mb-4 flex items-center justify-center relative">
                <span className="text-2xl font-bold text-white">75%</span>
                <Activity className="absolute bottom-0 right-0 text-green-500 bg-slate-900 rounded-full p-1 border border-slate-700" size={24}/>
            </div>
            <h3 className="font-semibold text-white">{t("Mechanics", "Cơ Học")}</h3>
            <p className="text-xs text-slate-500 mt-1">{t("Advanced proficiency", "Thành thạo nâng cao")}</p>
            </div>

            <div className="bg-lab-card p-6 rounded-2xl border border-slate-700/50 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full border-4 border-slate-700 border-t-amber-500 mb-4 flex items-center justify-center relative">
                <span className="text-2xl font-bold text-white">30%</span>
                <Zap className="absolute bottom-0 right-0 text-amber-500 bg-slate-900 rounded-full p-1 border border-slate-700" size={24}/>
            </div>
            <h3 className="font-semibold text-white">{t("Electronics", "Điện Tử")}</h3>
            <p className="text-xs text-slate-500 mt-1">{t("Intermediate learner", "Trình độ trung cấp")}</p>
            </div>

            <div className="bg-lab-card p-6 rounded-2xl border border-slate-700/50 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full border-4 border-slate-700 border-t-purple-500 border-l-purple-500 mb-4 flex items-center justify-center relative">
                <span className="text-2xl font-bold text-white">50%</span>
                <TrendingUp className="absolute bottom-0 right-0 text-purple-500 bg-slate-900 rounded-full p-1 border border-slate-700" size={24}/>
            </div>
            <h3 className="font-semibold text-white">{t("Quantum", "Lượng Tử")}</h3>
            <p className="text-xs text-slate-500 mt-1">{t("Growing rapidly", "Tăng trưởng nhanh")}</p>
            </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">{t("Quick Access", "Truy Cập Nhanh")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <button onClick={() => setMode(AppMode.SIM_SELECTOR)} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl text-left transition-colors border border-transparent hover:border-slate-600 group">
              <Activity className="text-teal-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-medium text-white">{t("Lab Simulator", "Mô Phỏng Lab")}</div>
              <div className="text-xs text-slate-500">{t("Start new experiment", "Bắt đầu thí nghiệm")}</div>
           </button>
           <button onClick={() => setMode(AppMode.DEEP_THINK)} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl text-left transition-colors border border-transparent hover:border-slate-600 group">
              <Zap className="text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-medium text-white">{t("Deep Thinker", "Suy Nghĩ Sâu")}</div>
              <div className="text-xs text-slate-500">{t("Solve complex problems", "Giải quyết vấn đề")}</div>
           </button>
           <button onClick={() => setMode(AppMode.CHAT_TUTOR)} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl text-left transition-colors border border-transparent hover:border-slate-600 group">
              <BookOpen className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-medium text-white">{t("My Tutor", "Gia Sư")}</div>
              <div className="text-xs text-slate-500">{t("Review concepts", "Ôn tập khái niệm")}</div>
           </button>
           <button onClick={() => setMode(AppMode.SEARCH_GROUND)} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-xl text-left transition-colors border border-transparent hover:border-slate-600 group">
              <TrendingUp className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-medium text-white">{t("Research", "Nghiên Cứu")}</div>
              <div className="text-xs text-slate-500">{t("Live physics news", "Tin tức vật lý")}</div>
           </button>
        </div>
      </div>

    </div>
  );
};