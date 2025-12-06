
import React, { useState } from 'react';
import { Atom, MessageSquare, Film, Brain, Search, LayoutDashboard, ChevronRight, X } from 'lucide-react';
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
import { AppMode } from './types';

function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [showChatWidget, setShowChatWidget] = useState(false);

  const NavItem = ({ m, icon: Icon, label, desc }: { m: AppMode, icon: any, label: string, desc?: string }) => (
    <button
      onClick={() => setMode(m)}
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

  const getHeaderTitle = (m: AppMode) => {
    switch (m) {
      case AppMode.DASHBOARD: return "Laboratory Dashboard";
      case AppMode.SIM_SELECTOR: return "Select Experiment";
      case AppMode.SIM_RUN_PENDULUM: return "Simple Pendulum Lab";
      case AppMode.SIM_RUN_VEO: return "Veo Generative Lab";
      case AppMode.SIM_RUN_CIRCUIT: return "RLC Circuit Builder";
      case AppMode.SIM_RUN_SLIT: return "Double Slit Experiment";
      case AppMode.SIM_RUN_INCLINED: return "Inclined Plane Dynamics";
      case AppMode.SIM_RUN_FLUIDS: return "Archimedes Fluid Lab";
      case AppMode.SIM_RUN_ORBITS: return "Gravitational Orbits";
      case AppMode.SIM_RUN_OSCILLOSCOPE: return "Virtual Oscilloscope";
      case AppMode.SIM_RUN_INDUCTION: return "Faraday's Law Induction";
      case AppMode.SIM_RUN_SPECTRUM: return "Atomic Spectrum Analysis";
      case AppMode.SIM_RUN_TUNNELING: return "Quantum Tunneling";
      case AppMode.SIM_RUN_RIPPLE: return "Ripple Tank 3D";
      case AppMode.SIM_RUN_DOPPLER: return "Doppler Effect";
      case AppMode.CHAT_TUTOR: return "AI Physics Tutor";
      case AppMode.DEEP_THINK: return "Deep Reasoning Engine";
      case AppMode.SEARCH_GROUND: return "Live Research Terminal";
      default: return "Quantum Lab AI";
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-lab-dark text-slate-200 font-sans selection:bg-lab-accent/30 relative">
      
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900/50 border-r border-slate-800 flex flex-col hidden md:flex backdrop-blur-xl">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/50">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-lg shadow-lg shadow-blue-500/20">
            <Atom className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Quantum Lab</h1>
            <p className="text-xs text-slate-500 font-mono">v3.1 AI-SIM</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-bold text-slate-500 px-4 py-2 uppercase tracking-wider">Laboratory</div>
          <NavItem m={AppMode.DASHBOARD} icon={LayoutDashboard} label="Dashboard" desc="Overview" />
          <NavItem m={AppMode.SIM_SELECTOR} icon={Atom} label="Lab Simulator" desc="Interactive Experiments" />
          <NavItem m={AppMode.SEARCH_GROUND} icon={Search} label="Research" desc="Live Data" />
          
          <div className="text-xs font-bold text-slate-500 px-4 py-2 mt-6 uppercase tracking-wider">Intelligence</div>
          <NavItem m={AppMode.DEEP_THINK} icon={Brain} label="Deep Thinking" desc="Problem Solving" />
          <NavItem m={AppMode.CHAT_TUTOR} icon={MessageSquare} label="AI Tutor" desc="Chat Assistant" />
        </nav>

        <div className="p-4 border-t border-slate-800/50">
           <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
             <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
               <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
               System Operational
             </div>
             <p className="text-xs text-slate-500">Gemini Pro Active</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-lab-dark/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-white">
            {getHeaderTitle(mode)}
          </h2>
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 shadow-md"></div>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-hidden relative">
          {mode === AppMode.DASHBOARD && <Dashboard setMode={setMode} />}
          {mode === AppMode.SIM_SELECTOR && <SimSelector setMode={setMode} />}
          
          {/* Active Labs */}
          {mode === AppMode.SIM_RUN_PENDULUM && <PendulumLab />}
          {mode === AppMode.SIM_RUN_VEO && <VeoLab />}
          
          {/* Mechanics Labs */}
          {(mode === AppMode.SIM_RUN_INCLINED || 
            mode === AppMode.SIM_RUN_FLUIDS || 
            mode === AppMode.SIM_RUN_ORBITS) && 
            <MechanicsLab mode={mode} />}

          {/* Electronics Labs */}
          {(mode === AppMode.SIM_RUN_CIRCUIT || 
            mode === AppMode.SIM_RUN_OSCILLOSCOPE || 
            mode === AppMode.SIM_RUN_INDUCTION) && 
            <ElectronicsLab mode={mode} />}
            
          {/* Quantum Labs */}
          {(mode === AppMode.SIM_RUN_SLIT || 
            mode === AppMode.SIM_RUN_SPECTRUM || 
            mode === AppMode.SIM_RUN_TUNNELING) && 
            <QuantumLab mode={mode} />}
            
          {/* Wave Labs */}
          {(mode === AppMode.SIM_RUN_RIPPLE || 
            mode === AppMode.SIM_RUN_DOPPLER) && 
            <WaveLab mode={mode} />}

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
                  <span className="font-bold text-white flex items-center gap-2"><MessageSquare size={16}/> Quantum Helper</span>
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
