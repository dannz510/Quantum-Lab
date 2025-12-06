
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Play, Pause, RotateCcw, Sparkles, Loader2, X } from 'lucide-react';
import { calculateInclinedForces } from '../services/physics';
import { analyzeExperimentData } from '../services/gemini';
import { AppMode, Language } from '../types';

interface MechanicsLabProps {
  mode: AppMode;
  lang: Language;
}

export const MechanicsLab: React.FC<MechanicsLabProps> = ({ mode, lang }) => {
  const t = (en: string, vi: string) => lang === 'vi' ? vi : en;

  // Common State
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Inclined Plane State
  const [angle, setAngle] = useState(30);
  const [mass, setMass] = useState(5);
  const [friction, setFriction] = useState(0.3);
  const [blockPos, setBlockPos] = useState(0); 

  // Fluids State
  const [densityObj, setDensityObj] = useState(800); 
  const [densityFluid, setDensityFluid] = useState(1000); 
  const [submergedDepth, setSubmergedDepth] = useState(0);

  // Orbits State
  const [orbitRadius, setOrbitRadius] = useState(150);
  const [starMass, setStarMass] = useState(1000);
  const [planetAngle, setPlanetAngle] = useState(0);
  const [orbitTrail, setOrbitTrail] = useState<{x: number, y: number}[]>([]);

  const reqRef = useRef<number>(0);

  useEffect(() => {
    // Reset trail when setup changes
    setOrbitTrail([]);
    setPlanetAngle(0);
  }, [orbitRadius, starMass]);

  useEffect(() => {
    if (!isRunning) return;

    const animate = () => {
      setTime(t => t + 0.016);

      if (mode === AppMode.SIM_RUN_INCLINED) {
        const physics = calculateInclinedForces(mass, angle, friction);
        if (physics.acceleration > 0) {
           setBlockPos(p => Math.min(p + physics.acceleration * 0.5, 100));
        }
      } else if (mode === AppMode.SIM_RUN_FLUIDS) {
        const targetDepth = Math.min(1, densityObj / densityFluid);
        setSubmergedDepth(curr => curr + (targetDepth - curr) * 0.05);
      } else if (mode === AppMode.SIM_RUN_ORBITS) {
         const speed = Math.sqrt(starMass / orbitRadius) * 0.5;
         setPlanetAngle(a => {
            const newAngle = a + speed * 0.016;
            // Add trail point occasionally
            if (Math.random() < 0.1) {
               setOrbitTrail(prev => [...prev, {
                  x: Math.cos(newAngle) * orbitRadius,
                  y: Math.sin(newAngle) * orbitRadius
               }].slice(-50)); // Keep last 50 points
            }
            return newAngle;
         });
      }

      reqRef.current = requestAnimationFrame(animate);
    };
    reqRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(reqRef.current!);
  }, [isRunning, mode, mass, angle, friction, densityObj, densityFluid, starMass, orbitRadius]);

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setBlockPos(0);
    setPlanetAngle(0);
    setSubmergedDepth(0);
    setOrbitTrail([]);
    setAiAnalysis('');
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    let summary = "";
    if (mode === AppMode.SIM_RUN_INCLINED) {
       const f = calculateInclinedForces(mass, angle, friction);
       summary = `Inclined Plane: Angle=${angle}, Mass=${mass}, Friction=${friction}, Accel=${f.acceleration.toFixed(2)}`;
    } else if (mode === AppMode.SIM_RUN_FLUIDS) {
       summary = `Fluids: Obj Density=${densityObj}, Fluid Density=${densityFluid}, Floating=${densityObj < densityFluid}`;
    } else {
       summary = `Orbits: Radius=${orbitRadius}, Star Mass=${starMass}`;
    }
    
    const result = await analyzeExperimentData("Mechanics Lab", { mode }, summary, lang);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const renderInclinedPlane = () => {
    const forces = calculateInclinedForces(mass, angle, friction);
    return (
      <div className="flex flex-col h-full">
         <div className="flex-1 relative flex items-center justify-center bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-inner shadow-black/50">
            {/* Ramp */}
            <div className="relative w-96 h-64 border-b-4 border-slate-500">
               <div 
                 className="absolute bottom-0 left-0 h-2 bg-slate-500 origin-bottom-left w-[120%]"
                 style={{ transform: `rotate(-${angle}deg)` }}
               ></div>
               {/* Block */}
               <div 
                 className="absolute bottom-0 left-0 w-16 h-16 bg-blue-500 rounded border border-blue-400 flex items-center justify-center text-xs font-bold text-white shadow-lg transition-transform z-10"
                 style={{ 
                   transform: `rotate(-${angle}deg) translateX(${blockPos * 3}px) translateY(-100%)`, 
                   transformOrigin: 'bottom left'
                 }}
               >
                 {mass}kg
                 {/* FBD Vectors on block */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     {/* Normal Force */}
                     <div className="absolute bottom-1/2 left-1/2 w-0.5 h-12 bg-green-400 origin-bottom" style={{ transform: 'translate(-50%, 0) rotate(0deg)' }}></div> 
                     {/* Gravity Component */}
                     <div className="absolute top-1/2 left-1/2 w-0.5 h-12 bg-purple-400 origin-top" style={{ transform: 'translate(-50%, 0) rotate(0deg)' }}></div>
                     {/* Friction */}
                     <div className="absolute top-1/2 left-1/2 w-10 h-0.5 bg-red-400 origin-left" style={{ transform: 'translate(0, -50%) rotate(180deg)' }}></div>
                 </div>
               </div>
            </div>
            {/* Force Vectors Overlay Legend */}
            <div className="absolute top-4 right-4 bg-slate-800/80 p-4 rounded-lg text-xs space-y-2 pointer-events-none backdrop-blur-sm border border-slate-600 shadow-xl">
               <div className="font-bold text-slate-300 mb-1 border-b border-slate-600 pb-1">Real-time Vectors</div>
               <div className="flex items-center gap-2 text-green-400"><span className="w-4 h-0.5 bg-green-400"></span> Parallel: {forces.parallel.toFixed(1)} N</div>
               <div className="flex items-center gap-2 text-red-400"><span className="w-4 h-0.5 bg-red-400"></span> Friction: {Math.min(forces.parallel, forces.frictionMax).toFixed(1)} N</div>
               <div className="flex items-center gap-2 text-white font-bold">Net Force: {forces.netForce.toFixed(1)} N</div>
               <div className="text-blue-300">Accel: {forces.acceleration.toFixed(2)} m/s²</div>
            </div>
         </div>
      </div>
    );
  };

  const renderFluids = () => {
    const isFloating = densityObj < densityFluid;
    return (
       <div className="flex flex-col h-full">
          <div className="flex-1 flex items-center justify-center bg-slate-900 rounded-xl border border-slate-700 relative">
             <div className="w-64 h-80 border-4 border-slate-500 border-t-0 rounded-b-xl relative bg-blue-900/10 overflow-hidden backdrop-blur-sm">
                <div className="absolute bottom-0 left-0 right-0 bg-blue-500/30 border-t border-blue-400 transition-all duration-500" style={{ height: '70%' }}>
                   <div className="absolute top-2 right-2 text-blue-300 text-xs font-bold">Fluid: {densityFluid} kg/m³</div>
                </div>
                
                <div 
                  className="absolute left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-600 rounded border border-amber-500 flex items-center justify-center text-white font-bold shadow-xl transition-all duration-700 ease-out"
                  style={{ bottom: isRunning ? (isFloating ? '60%' : '5%') : '80%' }} 
                >
                   <div>
                     <div>{densityObj} kg/m³</div>
                     <div className="text-xs font-normal opacity-80">{isFloating ? 'Floating' : 'Sinking'}</div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    );
  };

  const renderOrbits = () => {
    return (
       <div className="flex flex-col h-full">
         <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
             {/* Star */}
             <div className="absolute w-16 h-16 bg-yellow-400 rounded-full shadow-[0_0_50px_rgba(250,204,21,0.5)] flex items-center justify-center z-10">
               <span className="text-black font-bold text-xs">Star</span>
             </div>
             
             {/* Trail */}
             <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <g transform={`translate(${window.innerWidth > 1024 ? 400 : 200}, 250)`}> {/* Approximate center, better to use measure ref */}
                  {orbitTrail.map((p, i) => (
                     <circle key={i} cx={p.x} cy={p.y} r={1 + i/20} fill="#22d3ee" opacity={i/50} />
                  ))}
                </g>
             </svg>

             {/* Planet */}
             <div 
               className="absolute w-6 h-6 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)] z-20"
               style={{ 
                 transform: `translate(${Math.cos(planetAngle) * orbitRadius}px, ${Math.sin(planetAngle) * orbitRadius}px)`
               }}
             ></div>
         </div>
       </div>
    );
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
      <div className="lg:col-span-3 bg-lab-card border border-slate-700 rounded-2xl p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
         <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
            <Settings size={20} /> {t('Setup', 'Thiết Lập')}
         </div>
         
         <div className="space-y-4">
           {mode === AppMode.SIM_RUN_INCLINED && (
             <>
               <div>
                 <label className="text-sm text-slate-400">{t('Ramp Angle', 'Góc Nghiêng')} ({angle}°)</label>
                 <input type="range" min="0" max="60" value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-blue-500" />
               </div>
               <div>
                 <label className="text-sm text-slate-400">{t('Mass', 'Khối Lượng')} ({mass}kg)</label>
                 <input type="range" min="1" max="20" value={mass} onChange={(e) => setMass(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-blue-500" />
               </div>
               <div>
                 <label className="text-sm text-slate-400">{t('Friction Coeff', 'Hệ Số Ma Sát')} ({friction})</label>
                 <input type="range" min="0" max="1" step="0.1" value={friction} onChange={(e) => setFriction(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-blue-500" />
               </div>
             </>
           )}

           {mode === AppMode.SIM_RUN_FLUIDS && (
             <>
                <div>
                 <label className="text-sm text-slate-400">{t('Object Density', 'KLR Vật Thể')}</label>
                 <input type="range" min="200" max="2000" step="50" value={densityObj} onChange={(e) => setDensityObj(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-amber-500" />
               </div>
               <div>
                 <label className="text-sm text-slate-400">{t('Fluid Density', 'KLR Chất Lỏng')}</label>
                 <input type="range" min="500" max="1500" step="50" value={densityFluid} onChange={(e) => setDensityFluid(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-blue-500" />
               </div>
             </>
           )}

           {mode === AppMode.SIM_RUN_ORBITS && (
             <>
                <div>
                 <label className="text-sm text-slate-400">{t('Orbit Radius', 'Bán Kính Quỹ Đạo')}</label>
                 <input type="range" min="50" max="250" value={orbitRadius} onChange={(e) => setOrbitRadius(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-cyan-500" />
               </div>
               <div>
                 <label className="text-sm text-slate-400">{t('Star Mass', 'Khối Lượng Sao')}</label>
                 <input type="range" min="500" max="5000" value={starMass} onChange={(e) => setStarMass(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-yellow-500" />
               </div>
             </>
           )}
         </div>

         <div className="mt-auto flex flex-col gap-4">
            <div className="flex gap-2">
                <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2">
                {isRunning ? <Pause size={18} /> : <Play size={18} />} {isRunning ? t('Pause', 'Dừng') : t('Start', 'Bắt đầu')}
                </button>
                <button onClick={handleReset} className="bg-slate-700 hover:bg-slate-600 p-3 rounded-xl text-white">
                <RotateCcw size={18} />
                </button>
            </div>

            {/* AI Analysis */}
            {aiAnalysis ? (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-3 text-sm text-slate-200 relative animate-in slide-in-from-bottom-2 flex flex-col">
                  <div className="flex justify-between items-start mb-2 sticky top-0">
                     <div className="flex items-center gap-2 text-purple-400 text-xs font-bold"><Sparkles size={12}/> AI Analysis</div>
                     <button onClick={() => setAiAnalysis('')} className="text-slate-500 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"><X size={14}/></button>
                  </div>
                  <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                     <p className="whitespace-pre-wrap text-xs leading-relaxed">{aiAnalysis}</p>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-300 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                  {t('AI Insight', 'Phân Tích AI')}
                </button>
              )}
         </div>
      </div>

      <div className="lg:col-span-9 h-full">
         {mode === AppMode.SIM_RUN_INCLINED && renderInclinedPlane()}
         {mode === AppMode.SIM_RUN_FLUIDS && renderFluids()}
         {mode === AppMode.SIM_RUN_ORBITS && renderOrbits()}
      </div>
    </div>
  );
};
