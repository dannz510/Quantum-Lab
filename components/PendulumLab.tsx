
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Loader2, Sparkles, X, Activity, Ruler, ArrowUpRight, TrendingUp } from 'lucide-react';
import { calculateLargeAnglePeriod, calculateEnergy, stepPendulumRK4, calculatePendulumForces } from '../services/physics';
import { analyzeExperimentData } from '../services/gemini';
import { Material, DataPoint, Language } from '../types';
import { SoundEngine } from '../services/sound';

interface PendulumLabProps {
  lang: Language;
}

// Materials DB with Gradient IDs
const MATERIALS: Material[] = [
  { id: 'steel', name: 'Steel', density: 7850, frictionCoeff: 0.002, color: 'url(#gradSteel)' },
  { id: 'wood', name: 'Wood', density: 700, frictionCoeff: 0.01, color: 'url(#gradWood)' },
  { id: 'gold', name: 'Gold', density: 19300, frictionCoeff: 0.002, color: 'url(#gradGold)' }
];

export const PendulumLab: React.FC<PendulumLabProps> = ({ lang }) => {
  const t = (en: string, vi: string) => lang === 'vi' ? vi : en;

  // --- STATE ---
  const [length, setLength] = useState(1.5); // meters
  const [mass, setMass] = useState(1.0); // kg
  const [initialAngle, setInitialAngle] = useState(30); // degrees
  const [materialId, setMaterialId] = useState('steel');
  const [damping, setDamping] = useState(0.02); // air resistance

  // Sim State
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [angle, setAngle] = useState(initialAngle * (Math.PI / 180));
  const [velocity, setVelocity] = useState(0);
  const [simSpeed, setSimSpeed] = useState(1.0); 

  // Visualization Options
  const [showVectors, setShowVectors] = useState(false);
  const [showTrace, setShowTrace] = useState(true);
  const [showRuler, setShowRuler] = useState(false);
  const [traceHistory, setTraceHistory] = useState<{x: number, y: number}[]>([]);

  // Data
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Refs
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const physicsState = useRef({ theta: initialAngle * (Math.PI / 180), omega: 0 });
  const graphCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Sound
  const whooshRef = useRef<any>(null);

  // Derived Values
  const currentMaterial = MATERIALS.find(m => m.id === materialId) || MATERIALS[0];
  const energy = calculateEnergy(mass, length, angle, velocity);
  const forces = calculatePendulumForces(mass, length, angle, velocity);
  const periodIdeal = 2 * Math.PI * Math.sqrt(length/9.81);
  const periodReal = calculateLargeAnglePeriod(length, 9.81, initialAngle * (Math.PI / 180));

  // Reset Physics on param change
  useEffect(() => {
    handleReset();
  }, [initialAngle, length, mass, materialId]);

  // Main Loop
  const animateRef = (timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dtReal = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    const dt = Math.min(dtReal, 0.1) * simSpeed; 

    // Physics Step
    const effectiveDamping = damping + currentMaterial.frictionCoeff * 5;
    const next = stepPendulumRK4(physicsState.current.theta, physicsState.current.omega, dt, length, effectiveDamping);
    physicsState.current = next;

    setAngle(next.theta);
    setVelocity(next.omega);
    setTime(t => t + dt);
    
    // SOUND UPDATE
    if (whooshRef.current) {
        whooshRef.current.update(Math.abs(next.omega * length)); // Pass linear speed
    }

    // Update Trace
    if (showTrace && Math.floor(timestamp) % 3 === 0) { // Throttle trace updates
       const scale = 200 / 3; // Approx scale relative to viewbox
       const x = Math.sin(next.theta) * (length * scale);
       const y = Math.cos(next.theta) * (length * scale);
       setTraceHistory(prev => [...prev.slice(-100), {x, y}]); // Keep last 100 points
    }

    // Data Logging & Graph Drawing
    if (isRunning) {
        const point = { time: timestamp/1000, value: next.theta, secondaryValue: next.omega };
        setDataPoints(prev => {
            const newPts = [...prev, point];
            return newPts.slice(-300); // Keep last 300 pts for AI/Phase Space
        });
        drawRealtimeGraph(point);
    }

    if (isRunning) {
      requestRef.current = requestAnimationFrame(animateRef);
    }
  };
  
  useEffect(() => {
    if (isRunning) {
       lastTimeRef.current = performance.now();
       if (!whooshRef.current) whooshRef.current = SoundEngine.createWhoosh();
       requestRef.current = requestAnimationFrame(animateRef);
    } else {
       cancelAnimationFrame(requestRef.current);
       if (whooshRef.current) {
           whooshRef.current.stop();
           whooshRef.current = null;
       }
    }
    return () => {
        cancelAnimationFrame(requestRef.current);
        if (whooshRef.current) whooshRef.current.stop();
    };
  }, [isRunning, simSpeed, length, damping, currentMaterial, showTrace]);

  const drawRealtimeGraph = (newPoint: DataPoint) => {
      const canvas = graphCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      
      const imageData = ctx.getImageData(1, 0, w - 1, h);
      ctx.putImageData(imageData, 0, 0);
      ctx.clearRect(w - 1, 0, 1, h); 

      ctx.fillStyle = '#334155';
      ctx.fillRect(w-1, h/2, 1, 1);

      const yAngle = h/2 - (newPoint.value / (Math.PI/2)) * (h/2) * 0.8;
      ctx.fillStyle = '#34d399'; 
      ctx.fillRect(w-1, yAngle, 2, 2);

      const yVel = h/2 - (newPoint.secondaryValue! / 5) * (h/2) * 0.8;
      ctx.fillStyle = '#60a5fa'; 
      ctx.fillRect(w-1, yVel, 2, 2);
  };

  const handleReset = () => {
    setIsRunning(false);
    physicsState.current = { theta: initialAngle * (Math.PI / 180), omega: 0 };
    setAngle(initialAngle * (Math.PI / 180));
    setVelocity(0);
    setTime(0);
    setDataPoints([]);
    setTraceHistory([]);
    setAiAnalysis('');
    if (whooshRef.current) {
       whooshRef.current.stop();
       whooshRef.current = null;
    }
    const canvas = graphCanvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const summary = `
      Initial Angle: ${initialAngle} deg. 
      Length: ${length} m. Mass: ${mass} kg.
      Theoretical Period (Small Angle): ${periodIdeal.toFixed(3)}s.
      Theoretical Period (Large Angle): ${periodReal.toFixed(3)}s.
      Observation: Amplitude decaying due to damping (${damping}).
      Max Velocity observed: ${Math.max(...dataPoints.map(p => Math.abs(p.secondaryValue || 0))).toFixed(3)} rad/s.
    `;
    const result = await analyzeExperimentData("Simple Pendulum", { length, mass, initialAngle, damping }, summary, lang);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden bg-slate-950 text-slate-100">
      
      {/* SVG DEFINITIONS for Realistic Materials */}
      <svg width="0" height="0">
        <defs>
          <radialGradient id="gradSteel" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#475569" />
          </radialGradient>
          <radialGradient id="gradWood" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
          <radialGradient id="gradGold" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ca8a04" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* COLUMN 1: CONTROL PANEL */}
      <div className="lg:col-span-3 bg-lab-card border border-slate-700 rounded-2xl p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar shadow-lg">
        <div className="flex items-center gap-2 text-slate-200 font-bold border-b border-slate-700 pb-3 text-lg">
          <Settings size={20} className="text-teal-400"/> {t('Laboratory Controls', 'Bảng Điều Khiển Lab')}
        </div>

        <div className="space-y-6">
          {/* Physical Params */}
          <div className="space-y-4">
             <div className="flex justify-between items-center text-sm font-semibold text-slate-300">
                <label>{t('Length (L)', 'Chiều Dài (L)')}</label>
                <span className="bg-slate-800 px-2 py-1 rounded text-teal-400">{length.toFixed(2)} m</span>
             </div>
             <input type="range" min="0.5" max="3.0" step="0.1" value={length} onChange={(e) => setLength(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />

             <div className="flex justify-between items-center text-sm font-semibold text-slate-300">
                <label>{t('Initial Angle', 'Góc Lệch')}</label>
                <span className="bg-slate-800 px-2 py-1 rounded text-amber-400">{initialAngle}°</span>
             </div>
             <input type="range" min="5" max="90" step="1" value={initialAngle} onChange={(e) => setInitialAngle(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
             
             <div className="flex justify-between items-center text-sm font-semibold text-slate-300">
                <label>{t('Mass (m)', 'Khối Lượng')}</label>
                <span className="bg-slate-800 px-2 py-1 rounded text-blue-400">{mass.toFixed(1)} kg</span>
             </div>
             <input type="range" min="0.1" max="5.0" step="0.1" value={mass} onChange={(e) => setMass(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>

          {/* Material & Damping */}
          <div>
             <label className="block text-sm font-semibold text-slate-400 mb-2">{t('Material & Environment', 'Vật Liệu & Môi Trường')}</label>
             <div className="flex gap-2 mb-3">
               {MATERIALS.map(m => (
                 <button key={m.id} onClick={() => setMaterialId(m.id)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${materialId === m.id ? 'bg-slate-700 border-teal-500 text-white shadow-[0_0_10px_rgba(20,184,166,0.3)]' : 'bg-slate-800 border-transparent text-slate-500 hover:bg-slate-700'}`}>
                   {m.name}
                 </button>
               ))}
             </div>
             <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Damping</span>
                <input type="range" min="0" max="0.1" step="0.001" value={damping} onChange={(e) => setDamping(parseFloat(e.target.value))} className="flex-1 h-1.5 bg-slate-700 rounded-lg accent-red-500" />
             </div>
          </div>

          {/* Tools Toggles */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 space-y-2">
             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Tools', 'Công Cụ')}</label>
             <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShowVectors(!showVectors)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${showVectors ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                   <ArrowUpRight size={14}/> Vectors
                </button>
                <button onClick={() => setShowTrace(!showTrace)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${showTrace ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                   <Activity size={14}/> Trace
                </button>
                <button onClick={() => setShowRuler(!showRuler)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${showRuler ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                   <Ruler size={14}/> Ruler
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* COLUMN 2: MAIN VISUALIZER */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-700 relative overflow-hidden flex items-center justify-center shadow-2xl">
            {/* Dynamic Grid Background */}
            <div className="absolute inset-0 opacity-20" style={{ 
                backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', 
                backgroundSize: '40px 40px',
                transform: `translateY(${Math.sin(time)*5}px)` // Subtle float effect
            }}></div>
            
            {/* SVG SCENE */}
            <div className="relative w-full h-full flex justify-center origin-top pt-12">
                <svg width="100%" height="100%" viewBox="-200 -50 400 500" className="overflow-visible z-10">
                    {/* Ceiling */}
                    <line x1="-100" y1="0" x2="100" y2="0" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
                    <rect x="-10" y="-10" width="20" height="20" fill="#64748b" rx="2" />

                    {/* Trace Path */}
                    {showTrace && (
                       <polyline 
                         points={traceHistory.map(p => `${p.x},${p.y}`).join(' ')}
                         fill="none"
                         stroke="#34d399"
                         strokeWidth="2"
                         strokeOpacity="0.3"
                         strokeDasharray="4 4"
                       />
                    )}

                    {/* String */}
                    <line 
                      x1="0" y1="0" 
                      x2={Math.sin(angle) * (length * 100)} 
                      y2={Math.cos(angle) * (length * 100)} 
                      stroke="#cbd5e1" 
                      strokeWidth="2" 
                    />

                    {/* The Bob */}
                    <g transform={`translate(${Math.sin(angle) * (length * 100)}, ${Math.cos(angle) * (length * 100)})`}>
                        {/* Vectors Overlay */}
                        {showVectors && (
                           <>
                             {/* Gravity (mg) - Always down */}
                             <line x1="0" y1="0" x2="0" y2={forces.Fg * 5} stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrowRed)"/>
                             {/* Tension - Up along string */}
                             <line x1="0" y1="0" x2={-Math.sin(angle) * forces.Tension * 2} y2={-Math.cos(angle) * forces.Tension * 2} stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrowYellow)"/>
                             {/* Velocity - Tangential */}
                             <line x1="0" y1="0" x2={Math.cos(angle) * velocity * 20} y2={-Math.sin(angle) * velocity * 20} stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowBlue)"/>
                           </>
                        )}

                        {/* Bob Circle with Gradient */}
                        <circle 
                          r={Math.min(30, mass * 8 + 10)} 
                          fill={currentMaterial.color} 
                          stroke="rgba(255,255,255,0.5)"
                          strokeWidth="2"
                          filter="url(#glow)"
                        />
                        {/* Shine reflection */}
                        <ellipse cx="-5" cy="-5" rx="8" ry="4" fill="white" opacity="0.3" transform="rotate(-45)" />
                    </g>

                    {/* Ruler Overlay */}
                    {showRuler && (
                        <g opacity="0.5">
                           <line x1="-150" y1="300" x2="150" y2="300" stroke="white" strokeWidth="1" />
                           <text x="160" y="305" fill="white" fontSize="12" fontFamily="monospace">3m</text>
                           <line x1="-150" y1="200" x2="150" y2="200" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                           <text x="160" y="205" fill="white" fontSize="12" fontFamily="monospace">2m</text>
                           <line x1="-150" y1="100" x2="150" y2="100" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                           <text x="160" y="105" fill="white" fontSize="12" fontFamily="monospace">1m</text>
                        </g>
                    )}

                    {/* Angle Arc */}
                    <path 
                       d={`M 0 40 A 40 40 0 0 ${angle > 0 ? 1 : 0} ${Math.sin(angle)*40} ${Math.cos(angle)*40}`}
                       fill="none"
                       stroke="#fbbf24"
                       strokeWidth="2"
                       strokeDasharray="2 2"
                    />
                    <text x={Math.sin(angle/2)*50} y={Math.cos(angle/2)*50 + 10} fill="#fbbf24" fontSize="12" textAnchor="middle">{ (angle * 180 / Math.PI).toFixed(0) }°</text>

                    {/* Defs for Arrows */}
                    <defs>
                      <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444" /></marker>
                      <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" /></marker>
                      <marker id="arrowYellow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" /></marker>
                    </defs>
                </svg>
            </div>
            
            {/* Floating Controls */}
            <div className="absolute bottom-6 flex items-center gap-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-full border border-slate-600 shadow-2xl z-20">
               <button onClick={handleReset} className="p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors">
                  <RotateCcw size={20} />
               </button>
               <button onClick={() => setIsRunning(!isRunning)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isRunning ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-teal-500 hover:bg-teal-600 text-white'}`}>
                  {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
               </button>
               <div className="flex flex-col items-center w-24 px-2">
                  <span className="text-[10px] text-slate-400 font-bold mb-1">SPEED x{simSpeed.toFixed(1)}</span>
                  <input type="range" min="0.1" max="2.0" step="0.1" value={simSpeed} onChange={e => setSimSpeed(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-white" />
               </div>
            </div>
        </div>
      </div>

      {/* COLUMN 3: ANALYSIS & GRAPHS */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        
        {/* Real-time Graphs */}
        <div className="bg-lab-card border border-slate-700 rounded-2xl p-4 shadow-lg">
           <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-300 uppercase">
              <TrendingUp size={14} /> Real-time Telemetry
           </div>
           <div className="relative h-24 bg-slate-900 rounded border border-slate-800 overflow-hidden">
              <canvas ref={graphCanvasRef} width={300} height={96} className="w-full h-full" />
              <div className="absolute top-1 left-2 text-[10px] text-green-400">Angle θ</div>
              <div className="absolute bottom-1 left-2 text-[10px] text-blue-400">Velocity ω</div>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <div className="text-[10px] text-slate-400">Period (T)</div>
              <div className="text-lg font-mono text-teal-300">{periodReal.toFixed(2)}s</div>
              <div className="text-[10px] text-slate-500">Ideal: {periodIdeal.toFixed(2)}s</div>
           </div>
           <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <div className="text-[10px] text-slate-400">Total Energy</div>
              <div className="text-lg font-mono text-amber-300">{energy.total.toFixed(3)}J</div>
              <div className="text-[10px] text-slate-500">KE: {energy.ke.toFixed(2)}</div>
           </div>
        </div>

        {/* Phase Space */}
        <div className="bg-lab-card border border-slate-700 rounded-2xl p-4 flex-1 overflow-hidden flex flex-col shadow-lg">
           <h3 className="font-bold text-slate-300 mb-2 flex items-center gap-2 text-xs uppercase">
             <Activity size={14} /> Phase Portrait
           </h3>
           <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center opacity-50">
                 <svg width="100%" height="100%" viewBox="-150 -100 300 200">
                    <line x1="-150" y1="0" x2="150" y2="0" stroke="#334155" strokeWidth="1" />
                    <line x1="0" y1="-100" x2="0" y2="100" stroke="#334155" strokeWidth="1" />
                    <path 
                      d={`M ${dataPoints.map(p => `${p.value * 50} ${-(p.secondaryValue || 0) * 25}`).join(' L ')}`}
                      fill="none"
                      stroke="#f472b6"
                      strokeWidth="1.5"
                    />
                    <circle cx={angle * 50} cy={-velocity * 25} r="3" fill="white" />
                 </svg>
              </div>
           </div>

           {/* AI Analysis with Scrollbar */}
           <div className="mt-4 pt-4 border-t border-slate-700">
              {aiAnalysis ? (
                <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-3 text-sm text-slate-200 relative animate-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center mb-2">
                     <div className="flex items-center gap-2 text-purple-400 text-xs font-bold"><Sparkles size={12}/> AI Insight</div>
                     <button onClick={() => setAiAnalysis('')} className="text-slate-500 hover:text-white transition-colors"><X size={14}/></button>
                  </div>
                  {/* ADDED SCROLLBAR HERE */}
                  <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                     <p className="whitespace-pre-wrap text-xs leading-relaxed">{aiAnalysis}</p>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                  {t('Analyze Physics', 'Phân Tích Vật Lý')}
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
