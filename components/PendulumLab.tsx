
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Save, Settings, Info, Loader2, Sparkles, X } from 'lucide-react';
import { calculateLargeAnglePeriod, calculateEnergy, stepPendulumRK4 } from '../services/physics';
import { analyzeExperimentData } from '../services/gemini';
import { Material, DataPoint } from '../types';

// Materials DB
const MATERIALS: Material[] = [
  { id: 'steel', name: 'Steel', density: 7850, frictionCoeff: 0.002, color: '#94a3b8' },
  { id: 'wood', name: 'Wood', density: 700, frictionCoeff: 0.01, color: '#d97706' },
  { id: 'plastic', name: 'Plastic', density: 950, frictionCoeff: 0.005, color: '#ef4444' }
];

export const PendulumLab: React.FC = () => {
  // --- STATE ---
  // Input Parameters
  const [length, setLength] = useState(1.5); // meters
  const [mass, setMass] = useState(1.0); // kg
  const [initialAngle, setInitialAngle] = useState(30); // degrees
  const [materialId, setMaterialId] = useState('steel');
  const [damping, setDamping] = useState(0.1); // air resistance

  // Sim State
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [angle, setAngle] = useState(initialAngle * (Math.PI / 180));
  const [velocity, setVelocity] = useState(0);
  const [slowMo, setSlowMo] = useState(false);

  // Data
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Refs
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Derived Values
  const currentMaterial = MATERIALS.find(m => m.id === materialId) || MATERIALS[0];
  const energy = calculateEnergy(mass, length, angle, velocity);
  const period = calculateLargeAnglePeriod(length, 9.81, initialAngle * (Math.PI / 180));

  // --- PHYSICS LOOP ---
  const animate = (timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;

    const deltaTime = (timestamp - lastTimeRef.current) / 1000; // seconds
    lastTimeRef.current = timestamp;

    // Physics Step
    // Slow motion factor
    const dt = slowMo ? deltaTime * 0.2 : deltaTime;
    
    // Apply RK4
    // Damping model: b / m. Simplified linear damping.
    const effectiveDamping = damping + currentMaterial.frictionCoeff * 10;
    
    const newState = stepPendulumRK4(angle, velocity, dt, length, effectiveDamping);
    
    setAngle(newState.theta);
    setVelocity(newState.omega);
    setTime(t => t + dt);

    // Data Logging (throttle to ~10Hz)
    if (Math.random() < 0.2) { // crude throttling for demo
       setDataPoints(prev => {
         const newPts = [...prev, { time: time, value: newState.theta, secondaryValue: newState.omega }];
         return newPts.slice(-100); // keep last 100 points
       });
    }

    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isRunning) {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, slowMo, angle, velocity, length, damping, currentMaterial]); // Dependencies for closure state capture if needed, though Refs handle time

  // Need to update state refs or use functional updates in animate to avoid stale closures? 
  // Actually, in the `animate` function above, I am using state values `angle` etc which are closed over. 
  // This is a classic React Hook pitfall. 
  // BETTER APPROACH: Use refs for physics state to avoid re-render loop dependency issues, 
  // then sync to React state for render.
  
  const physicsState = useRef({ theta: initialAngle * (Math.PI / 180), omega: 0 });

  useEffect(() => {
    physicsState.current = { theta: initialAngle * (Math.PI / 180), omega: 0 };
    setAngle(initialAngle * (Math.PI / 180));
    setVelocity(0);
    setTime(0);
    setDataPoints([]);
  }, [initialAngle, length, mass]); // Reset when params change

  const animateRef = (timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dtReal = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    const dt = slowMo ? dtReal * 0.2 : dtReal;
    // Cap dt to prevent explosion on tab switch
    const safeDt = Math.min(dt, 0.1); 

    const effectiveDamping = damping + currentMaterial.frictionCoeff * 10;

    const next = stepPendulumRK4(physicsState.current.theta, physicsState.current.omega, safeDt, length, effectiveDamping);
    physicsState.current = next;

    // Sync to UI
    setAngle(next.theta);
    setVelocity(next.omega);
    setTime(t => t + safeDt);

    // Log
    if (Math.floor(timestamp) % 5 === 0) { // Log occasionally
       setDataPoints(prev => {
          const newPts = [...prev, { time: performance.now(), value: next.theta }]; // simplifying time for chart
          return newPts.slice(-50);
       });
    }

    if (isRunning) {
      requestRef.current = requestAnimationFrame(animateRef);
    }
  };
  
  // Re-bind animation loop when running state changes
  useEffect(() => {
    if (isRunning) {
       lastTimeRef.current = performance.now();
       requestRef.current = requestAnimationFrame(animateRef);
    } else {
       cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, slowMo, length, damping, currentMaterial]);


  const handleReset = () => {
    setIsRunning(false);
    physicsState.current = { theta: initialAngle * (Math.PI / 180), omega: 0 };
    setAngle(initialAngle * (Math.PI / 180));
    setVelocity(0);
    setTime(0);
    setDataPoints([]);
    setAiAnalysis('');
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const summary = `
      Max Angle: ${initialAngle} deg. 
      Length: ${length} m. 
      Observed Period (approx): ${period.toFixed(3)}s. 
      Final Energy: ${energy.total.toFixed(3)} J.
    `;
    const result = await analyzeExperimentData("Simple Pendulum", { length, mass, initialAngle, damping }, summary);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  // --- RENDER ---
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
      
      {/* COLUMN 1: CONTROL PANEL (3 cols) */}
      <div className="lg:col-span-3 bg-lab-card border border-slate-700 rounded-2xl p-4 flex flex-col gap-6 overflow-y-auto">
        <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
          <Settings size={20} /> Experiment Setup
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <div>
            <label className="flex justify-between text-sm text-slate-400 mb-1">
              Length (L) <span>{length.toFixed(2)} m</span>
            </label>
            <input 
              type="range" min="0.1" max="5.0" step="0.1" 
              value={length} onChange={(e) => setLength(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <label className="flex justify-between text-sm text-slate-400 mb-1">
              Mass (m) <span>{mass.toFixed(1)} kg</span>
            </label>
            <input 
              type="range" min="0.1" max="10.0" step="0.1" 
              value={mass} onChange={(e) => setMass(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div>
            <label className="flex justify-between text-sm text-slate-400 mb-1">
              Initial Angle (&theta;₀) <span>{initialAngle}&deg;</span>
            </label>
            <input 
              type="range" min="5" max="90" step="1" 
              value={initialAngle} onChange={(e) => setInitialAngle(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            {initialAngle > 15 && (
               <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                 <Info size={10} /> Large angle approximation active
               </p>
            )}
          </div>

          <div>
             <label className="block text-sm text-slate-400 mb-2">Bob Material</label>
             <div className="grid grid-cols-3 gap-2">
               {MATERIALS.map(m => (
                 <button
                   key={m.id}
                   onClick={() => setMaterialId(m.id)}
                   className={`p-2 rounded-lg border text-xs font-bold transition-all ${materialId === m.id ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                 >
                   {m.name}
                 </button>
               ))}
             </div>
          </div>

          <div>
            <label className="flex justify-between text-sm text-slate-400 mb-1">
              Air Resistance <span>{(damping * 100).toFixed(0)}%</span>
            </label>
            <input 
              type="range" min="0" max="0.5" step="0.01" 
              value={damping} onChange={(e) => setDamping(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
        </div>

        {/* Theoretical Stats */}
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 space-y-2">
           <div className="flex justify-between text-xs">
             <span className="text-slate-500">Ideal Period (T₀)</span>
             <span className="text-slate-300 font-mono">{(2 * Math.PI * Math.sqrt(length/9.81)).toFixed(3)} s</span>
           </div>
           <div className="flex justify-between text-xs">
             <span className="text-slate-500">Actual Period (T)</span>
             <span className="text-teal-400 font-mono font-bold">{period.toFixed(3)} s</span>
           </div>
        </div>
      </div>

      {/* COLUMN 2: SIMULATION VIEWPORT (6 cols) */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        {/* Viewport */}
        <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-700 relative overflow-hidden flex items-center justify-center">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            {/* Pendulum Visualization */}
            <div className="relative w-full h-full flex justify-center pt-10 origin-top">
                <svg width="100%" height="100%" viewBox="-150 -50 300 400" className="overflow-visible">
                    {/* Ceiling */}
                    <line x1="-50" y1="0" x2="50" y2="0" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                    
                    {/* String */}
                    <line 
                      x1="0" y1="0" 
                      x2={Math.sin(angle) * (length * 60)} 
                      y2={Math.cos(angle) * (length * 60)} 
                      stroke="#475569" 
                      strokeWidth="2" 
                    />
                    
                    {/* Bob */}
                    <circle 
                      cx={Math.sin(angle) * (length * 60)} 
                      cy={Math.cos(angle) * (length * 60)} 
                      r={mass * 5 + 5} 
                      fill={currentMaterial.color} 
                      stroke="white"
                      strokeWidth="2"
                    />

                    {/* Vector Overlay (Velocity) */}
                    <line 
                      x1={Math.sin(angle) * (length * 60)} 
                      y1={Math.cos(angle) * (length * 60)}
                      x2={Math.sin(angle) * (length * 60) + Math.cos(angle) * velocity * 10}
                      y2={Math.cos(angle) * (length * 60) - Math.sin(angle) * velocity * 10}
                      stroke="#10b981"
                      strokeWidth="2"
                      markerEnd="url(#arrow)"
                      opacity="0.6"
                    />
                    <defs>
                      <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
                      </marker>
                    </defs>
                </svg>
            </div>
            
            {/* Controls */}
            <div className="absolute bottom-6 flex items-center gap-4 bg-slate-800/80 backdrop-blur p-2 rounded-full border border-slate-600 shadow-xl">
               <button onClick={() => setIsRunning(!isRunning)} className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors">
                  {isRunning ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
               </button>
               <button onClick={handleReset} className="p-2 text-slate-400 hover:text-white transition-colors">
                  <RotateCcw size={20} />
               </button>
               <div className="h-6 w-px bg-slate-600 mx-1"></div>
               <button 
                 onClick={() => setSlowMo(!slowMo)} 
                 className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${slowMo ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}
               >
                 SLOW
               </button>
            </div>
        </div>
      </div>

      {/* COLUMN 3: DATA & AI (3 cols) */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        {/* Data Logger / Charts */}
        <div className="bg-lab-card border border-slate-700 rounded-2xl p-4 flex-1 overflow-hidden flex flex-col">
           <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2">
             <Save size={16} /> Real-time Data
           </h3>
           
           {/* Simple Chart */}
           <div className="h-32 bg-slate-900 rounded-lg border border-slate-800 mb-4 relative overflow-hidden flex items-end">
              {dataPoints.map((pt, i) => (
                 <div 
                   key={i} 
                   className="w-1 bg-blue-500/50" 
                   style={{ height: `${Math.abs(pt.value) * 100}%`, margin: '0 1px' }} // crude visualization
                 ></div>
              ))}
              <div className="absolute bottom-1 right-2 text-[10px] text-slate-500 font-mono">Angle vs Time</div>
           </div>

           {/* Energy Bars */}
           <div className="space-y-2 mb-4">
             <div>
               <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                 <span>Kinetic (KE)</span> <span>{energy.ke.toFixed(2)} J</span>
               </div>
               <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-green-500 transition-all duration-75" style={{ width: `${Math.min((energy.ke / 5) * 100, 100)}%` }}></div>
               </div>
             </div>
             <div>
               <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                 <span>Potential (PE)</span> <span>{energy.pe.toFixed(2)} J</span>
               </div>
               <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 transition-all duration-75" style={{ width: `${Math.min((energy.pe / 5) * 100, 100)}%` }}></div>
               </div>
             </div>
           </div>

           {/* AI Assistant Context */}
           <div className="mt-auto border-t border-slate-700 pt-4">
              {aiAnalysis ? (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-3 text-sm text-slate-200 relative">
                  <button onClick={() => setAiAnalysis('')} className="absolute top-2 right-2 text-slate-500 hover:text-white"><X size={14}/></button>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed">{aiAnalysis}</p>
                </div>
              ) : (
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  Analyze Results with AI
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
