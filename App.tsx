
import React, { useState, useEffect } from 'react';
import { MessageSquare, Film, Brain, Search, LayoutDashboard, ChevronRight, X, Globe } from 'lucide-react';
import { VeoLab } from './components/VeoLab';
import { ChatTutor } from './components/ChatTutor';
import { DeepThinker } from './components/DeepThinker';
import { SearchGround } from './components/SearchGround';
import { Dashboard } from './components/Dashboard';
import { SimSelector } from './components/SimSelector';
import { PendulumLab } from './components/PendulumLab';
import { MechanicsLab } from './components/MechanicsLab';
import { ElectronicsLab } from './components/ElectronicsLab';
import { QuantumLab } from './components/QuantumLab';
import { WaveLab } from './components/WaveLab';
import { MouldLab } from './components/MouldLab';
import { BlackHoleLab } from './components/BlackHoleLab';
import { SimpleWaveLab } from './components/SimpleWaveLab';
import { OpticsLab } from './components/OpticsLab'; 
import { ThermodynamicsLab } from './components/ThermodynamicsLab';
import { PlaceholderLab } from './components/PlaceholderLab';
import { QuantumParticles } from './components/QuantumParticles'; // Import the animation
import { LabHeader } from './components/LabHeader'; // Import the header
import { AppMode, Language } from './types';
import { SoundEngine } from './services/sound';

function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [showChatWidget, setShowChatWidget] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  
  // Statistics State
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [labVisits, setLabVisits] = useState<Record<string, number>>({});

  // Play sound on mode change
  useEffect(() => {
    SoundEngine.playNav();
  }, [mode]);

  // Session Timer
  useEffect(() => {
    const timer = setInterval(() => {
        setSessionSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Init audio on first click
  useEffect(() => {
    const initAudio = () => {
        SoundEngine.init();
        window.removeEventListener('click', initAudio);
        window.removeEventListener('touchstart', initAudio);
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('touchstart', initAudio);
    return () => {
        window.removeEventListener('click', initAudio);
        window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  // Wrap setMode to track visits
  const handleSetMode = (newMode: AppMode) => {
      setMode(newMode);
      // Track lab visits (approximate based on mode name)
      if (newMode.startsWith('SIM_RUN_')) {
          setLabVisits(prev => ({
              ...prev,
              [newMode]: (prev[newMode] || 0) + 1
          }));
      }
  };

  const handleBackToLib = () => {
      setMode(AppMode.SIM_SELECTOR);
  };

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en;

  const NavItem = ({ m, icon: Icon, label, desc }: { m: AppMode, icon: any, label: string, desc?: string }) => (
    <button
      onClick={() => handleSetMode(m)}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group text-left ${mode === m ? 'bg-lab-accent text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      <div className={`p-2 rounded-lg ${mode === m ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{label}</h3>
        {desc && <p className="text-xs opacity-70 mt-0.5 line-clamp-1">{desc}</p>}
      </div>
      {mode === m && <ChevronRight size={16} />}
    </button>
  );

  // Render Lab Wrapper to inject Header
  const renderLab = (Component: React.FC<any>, props: any, title: string) => (
      <div className="flex flex-col h-full">
          <LabHeader onBack={handleBackToLib} title={title} lang={lang} />
          <div className="flex-1 overflow-hidden relative">
            <Component {...props} />
          </div>
      </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-lab-dark text-slate-200 font-sans selection:bg-lab-accent/30 relative">
      
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900/50 border-r border-slate-800 flex flex-col hidden md:flex backdrop-blur-xl">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/50">
          {/* Replaced Icon with QuantumParticles */}
          <div className="relative w-12 h-12 rounded-lg overflow-hidden shadow-lg shadow-blue-500/20 border border-slate-700">
             <QuantumParticles />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Quantum Lab</h1>
            <p className="text-xs text-slate-500 font-mono">v5.2 PRO</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="text-xs font-bold text-slate-500 px-4 py-2 uppercase tracking-wider">{t("Laboratory", "Phòng Lab")}</div>
          <NavItem m={AppMode.DASHBOARD} icon={LayoutDashboard} label={t("Dashboard", "Bảng Điều Khiển")} desc={t("Overview", "Tổng Quan")} />
          <NavItem m={AppMode.SIM_SELECTOR} icon={LayoutDashboard} label={t("Lab Simulator", "Mô Phỏng Lab")} desc={t("Interactive Experiments", "Thí Nghiệm Tương Tác")} />
          <NavItem m={AppMode.SEARCH_GROUND} icon={Search} label={t("Research", "Nghiên Cứu")} desc={t("Live Data", "Dữ Liệu Sống")} />
          
          <div className="text-xs font-bold text-slate-500 px-4 py-2 mt-6 uppercase tracking-wider">{t("Intelligence", "Trí Tuệ")}</div>
          <NavItem m={AppMode.DEEP_THINK} icon={Brain} label={t("Deep Thinking", "Suy Nghĩ Sâu")} desc={t("Problem Solving", "Giải Quyết Vấn Đề")} />
          <NavItem m={AppMode.CHAT_TUTOR} icon={MessageSquare} label={t("AI Tutor", "Gia Sư AI")} desc={t("Chat Assistant", "Trợ Lý Chat")} />
        </nav>

        <div className="p-4 border-t border-slate-800/50">
           <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
             <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
               <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
               {t("System Operational", "Hệ Thống Sẵn Sàng")}
             </div>
             <p className="text-xs text-slate-500">Gemini 3 Pro Active</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Top Bar - Only show on Dashboard/Selectors, Labs have their own header now */}
        {(mode === AppMode.DASHBOARD || mode === AppMode.SIM_SELECTOR || mode === AppMode.CHAT_TUTOR || mode === AppMode.DEEP_THINK || mode === AppMode.SEARCH_GROUND) && (
            <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-lab-dark/80 backdrop-blur-md sticky top-0 z-10">
            <h2 className="text-xl font-semibold text-white">
                {mode === AppMode.DASHBOARD ? t("Laboratory Dashboard", "Bảng Điều Khiển") : t("Physics Simulation", "Mô Phỏng Vật Lý")}
            </h2>
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-full border border-slate-600 transition-colors"
                >
                    <Globe size={14} className="text-blue-400" />
                    <span className="text-xs font-bold">{lang === 'en' ? 'EN' : 'VI'}</span>
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 shadow-md"></div>
            </div>
            </header>
        )}

        {/* Viewport */}
        <div className="flex-1 overflow-hidden relative">
          {mode === AppMode.DASHBOARD && <Dashboard setMode={handleSetMode} sessionSeconds={sessionSeconds} labVisits={labVisits} lang={lang}/>}
          {mode === AppMode.SIM_SELECTOR && <SimSelector setMode={handleSetMode} lang={lang} />}
          
          {/* Active Labs wrapped with Header */}
          {mode === AppMode.SIM_RUN_PENDULUM && renderLab(PendulumLab, { lang }, "Pendulum Dynamics")}
          {mode === AppMode.SIM_RUN_VEO && renderLab(VeoLab, {}, "Veo Generative Lab")}
          
          {/* Mechanics Labs */}
          {(mode === AppMode.SIM_RUN_INCLINED || 
            mode === AppMode.SIM_RUN_FLUIDS || 
            mode === AppMode.SIM_RUN_ORBITS ||
            mode === AppMode.SIM_RUN_PROJECTILE ||
            mode === AppMode.SIM_RUN_COLLISIONS ||
            mode === AppMode.SIM_RUN_SPRINGS) && 
            renderLab(MechanicsLab, { mode, lang }, "Mechanics Suite")}

          {/* Electronics Labs */}
          {(mode === AppMode.SIM_RUN_CIRCUIT || 
            mode === AppMode.SIM_RUN_OSCILLOSCOPE || 
            mode === AppMode.SIM_RUN_INDUCTION) && 
            renderLab(ElectronicsLab, { mode, lang }, "Electronics Suite")}
            
          {/* Quantum Labs */}
          {(mode === AppMode.SIM_RUN_SLIT || 
            mode === AppMode.SIM_RUN_SPECTRUM || 
            mode === AppMode.SIM_RUN_TUNNELING ||
            mode === AppMode.SIM_RUN_RUTHERFORD) && 
            renderLab(QuantumLab, { mode, lang }, "Quantum Suite")}
            
          {/* Wave Labs */}
          {(mode === AppMode.SIM_RUN_RIPPLE || 
            mode === AppMode.SIM_RUN_DOPPLER) && 
            renderLab(WaveLab, { mode, lang }, "Wave Dynamics")}
            
          {/* New Modern Labs */}
          {mode === AppMode.SIM_RUN_MOULD && renderLab(MouldLab, { lang }, "Mould Effect")}
          {mode === AppMode.SIM_RUN_BLACKHOLE && renderLab(BlackHoleLab, { lang }, "General Relativity")}
          {mode === AppMode.SIM_RUN_SIMPLE_WAVE && renderLab(SimpleWaveLab, {}, "Simple Waves")}
          
          {/* Thermodynamics */}
          {(mode === AppMode.SIM_RUN_GAS || 
            mode === AppMode.SIM_RUN_STATES || 
            mode === AppMode.SIM_RUN_HEAT) && 
            renderLab(ThermodynamicsLab, { mode: mode === AppMode.SIM_RUN_GAS ? 'gas' : mode === AppMode.SIM_RUN_STATES ? 'states' : 'friction_heat', lang }, "Thermodynamics")}

          {/* Optics */}
          {(mode === AppMode.SIM_RUN_OPTICS ||
            mode === AppMode.SIM_RUN_LENSES ||
            mode === AppMode.SIM_RUN_COLOR) && 
            renderLab(OpticsLab, { mode, lang }, "Optics Suite")}
          
          {/* Placeholder for others */}
          {mode === AppMode.SIM_PLACEHOLDER && <PlaceholderLab />}

          {/* AI Tools */}
          {mode === AppMode.CHAT_TUTOR && <ChatTutor />}
          {mode === AppMode.DEEP_THINK && <DeepThinker />}
          {mode === AppMode.SEARCH_GROUND && <SearchGround />}
        </div>
      </main>

      {/* Global Chat Widget (Bottom Right) */}
      {mode !== AppMode.CHAT_TUTOR && (
        <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end">
          {showChatWidget ? (
            <div className="w-96 h-[500px] bg-lab-card border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300">
               <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                  <span className="font-bold text-white flex items-center gap-2"><MessageSquare size={16}/> {t("Quantum Helper", "Trợ Lý Quantum")}</span>
                  <button onClick={() => setShowChatWidget(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
               </div>
               <div className="flex-1 overflow-hidden relative">
                  <ChatTutor /> 
               </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowChatWidget(true)}
              className="w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-900/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 group"
            >
              <MessageSquare size={24} className="group-hover:animate-bounce" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
