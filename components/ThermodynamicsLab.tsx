
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Thermometer, Wind, Box, Flame, Snowflake, Activity, ArrowRight, Loader2, Sparkles, X } from 'lucide-react';
import { analyzeExperimentData } from '../services/gemini';
import { Language } from '../types';

interface ThermodynamicsLabProps {
  mode: 'gas' | 'states' | 'friction_heat';
  lang: Language;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
}

export const ThermodynamicsLab: React.FC<ThermodynamicsLabProps> = ({ mode, lang }) => {
  const [isRunning, setIsRunning] = useState(true);
  const [temperature, setTemperature] = useState(300); // Kelvin
  const [volume, setVolume] = useState(50); // % of container width
  const [particleCount, setParticleCount] = useState(mode === 'gas' ? 100 : 200);
  const [pressure, setPressure] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  
  // Physics Constants
  const k_B = 1.38e-23; // Real physics constant (scaled for sim)
  
  // Initialize Particles
  useEffect(() => {
    const initParticles = () => {
        const p: Particle[] = [];
        const speedBase = Math.sqrt(temperature) * 0.2;
        
        for(let i=0; i<particleCount; i++) {
            p.push({
                x: Math.random() * 750,
                y: Math.random() * 450,
                vx: (Math.random() - 0.5) * speedBase,
                vy: (Math.random() - 0.5) * speedBase,
                r: mode === 'states' ? 4 : 2,
                color: mode === 'states' ? '#60a5fa' : '#fcd34d'
            });
        }
        particlesRef.current = p;
    };
    initParticles();
  }, [particleCount, mode]);

  // Physics Loop
  const updatePhysics = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;
    const wallX = (volume / 100) * width; // Movable piston wall

    let currentPressure = 0;
    const speedFactor = Math.sqrt(temperature) * 0.02; // Coupling Temp to Speed

    particlesRef.current.forEach((p, idx) => {
        // Temperature coupling (Thermostat)
        // Nudge velocity towards target temperature speed
        const currentSpeed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        const targetSpeed = Math.sqrt(temperature) * 0.3; // Scaling factor
        const adjustment = 0.05; // Thermal conductivity rate
        
        if (mode !== 'friction_heat') {
             p.vx += (p.vx / currentSpeed) * (targetSpeed - currentSpeed) * adjustment;
             p.vy += (p.vy / currentSpeed) * (targetSpeed - currentSpeed) * adjustment;
        }

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wall Collisions
        if (p.x < p.r) { p.x = p.r; p.vx *= -1; currentPressure += Math.abs(p.vx); }
        if (p.x > wallX - p.r) { p.x = wallX - p.r; p.vx *= -1; currentPressure += Math.abs(p.vx); }
        if (p.y < p.r) { p.y = p.r; p.vy *= -1; currentPressure += Math.abs(p.vy); }
        if (p.y > height - p.r) { p.y = height - p.r; p.vy *= -1; currentPressure += Math.abs(p.vy); }

        // Inter-particle forces (Lennard-Jones for States of Matter)
        if (mode === 'states') {
            for(let j=idx+1; j<particlesRef.current.length; j++) {
                const p2 = particlesRef.current[j];
                const dx = p2.x - p.x;
                const dy = p2.y - p.y;
                const distSq = dx*dx + dy*dy;
                
                if (distSq < 1600 && distSq > 0) { // Interaction range
                    const dist = Math.sqrt(distSq);
                    // Attraction/Repulsion force
                    // F ~ 1/r^13 - 1/r^7 (Simplified)
                    // High temp overrides attraction (Boiling)
                    const bondStrength = 1000 / (temperature + 100); 
                    const force = (dist - 20) * 0.01 * bondStrength; 
                    
                    const fx = (dx/dist) * force;
                    const fy = (dy/dist) * force;
                    
                    p.vx += fx; p.vy += fy;
                    p2.vx -= fx; p2.vy -= fy;
                }
            }
        }
        
        // Color based on Speed (Heat map)
        const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        if (speed < 1) p.color = '#3b82f6'; // Cold Blue
        else if (speed < 3) p.color = '#10b981'; // Med Green
        else if (speed < 5) p.color = '#f59e0b'; // Hot Yellow
        else p.color = '#ef4444'; // Very Hot Red
    });

    // Smooth pressure reading
    setPressure(prev => prev * 0.95 + currentPressure * 0.05);

  }, [temperature, volume, mode]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const wallX = (volume / 100) * width;

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw Container
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, wallX, height);
    
    // Draw Piston Wall
    ctx.fillStyle = '#475569';
    ctx.fillRect(wallX, 0, width - wallX, height);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(wallX, 0); ctx.lineTo(wallX, height);
    ctx.stroke();
    
    // Particles
    // Use screen blend mode for glowing effect
    ctx.globalCompositeOperation = 'screen';
    particlesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
        // Glow
        ctx.shadowBlur = p.r * 2;
        ctx.shadowColor = p.color;
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;

    // Overlay Info
    if (mode === 'gas') {
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.fillText(`V = ${(volume/100 * 5).toFixed(2)} L`, wallX/2 - 30, height - 20);
    }

  }, [volume, mode]);

  useEffect(() => {
    if (!isRunning) return;
    const loop = () => {
        updatePhysics();
        draw();
        reqRef.current = requestAnimationFrame(loop);
    };
    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current);
  }, [isRunning, updatePhysics, draw]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const summary = `Thermodynamics (${mode}): Temp=${temperature}K, Volume=${volume}%, Particles=${particleCount}, Pressure=${pressure.toFixed(1)} units`;
    const result = await analyzeExperimentData("Thermodynamics Lab", { mode, temperature, volume }, summary, lang);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
        
        {/* CONTROLS */}
        <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
                <Thermometer size={20} className="text-red-500" />
                {mode === 'gas' ? 'Định Luật Khí Lý Tưởng' : mode === 'states' ? 'Trạng Thái Vật Chất' : 'Nhiệt & Ma Sát'}
            </div>

            <div className="p-3 bg-slate-900 rounded-xl space-y-4">
                {/* Temperature */}
                <div>
                    <label className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Nhiệt Độ (T)</span>
                        <span className={`font-mono ${temperature > 500 ? 'text-red-400' : 'text-blue-400'}`}>{temperature} K</span>
                    </label>
                    <input type="range" min="0" max="1000" step="10" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-red-500"/>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><Snowflake size={10}/> 0K</span>
                        <span className="flex items-center gap-1"><Flame size={10}/> 1000K</span>
                    </div>
                </div>

                {/* Volume */}
                {mode !== 'states' && (
                    <div>
                        <label className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Thể Tích (V)</span>
                            <span className="font-mono text-teal-400">{volume}%</span>
                        </label>
                        <input type="range" min="10" max="90" step="1" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-teal-500"/>
                    </div>
                )}

                {/* Particles */}
                <div>
                    <label className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Số lượng Hạt (N)</span>
                        <span className="font-mono text-yellow-400">{particleCount}</span>
                    </label>
                    <input type="range" min="10" max="500" step="10" value={particleCount} onChange={(e) => setParticleCount(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-yellow-500"/>
                </div>
            </div>

            {/* MONITOR */}
            <div className="p-4 bg-slate-700 rounded-xl shadow-lg border-l-4 border-orange-500 mt-auto">
                <div className="flex items-center gap-2 mb-2 font-bold text-sm text-white">
                    <Activity size={16}/> {mode === 'gas' ? 'PV = nRT Monitor' : 'Thermal Monitor'}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-800 p-2 rounded">
                        <div className="text-slate-400">Pressure (P)</div>
                        <div className="text-lg text-orange-400">{pressure.toFixed(0)}</div>
                        <div className="text-[10px] text-slate-500">Pa (Simulated)</div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded">
                        <div className="text-slate-400">Energy (E)</div>
                        <div className="text-lg text-red-400">{(temperature * particleCount / 1000).toFixed(1)}</div>
                        <div className="text-[10px] text-slate-500">kJ (Internal)</div>
                    </div>
                </div>
            </div>

            {/* AI & ACTIONS */}
            <div className="pt-2 border-t border-slate-700 flex flex-col gap-2">
                {aiAnalysis ? (
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-3 text-sm text-slate-200 relative">
                        <button onClick={() => setAiAnalysis('')} className="absolute top-1 right-1 text-slate-400"><X size={14}/></button>
                        <div className="max-h-32 overflow-y-auto custom-scrollbar">
                            <p className="whitespace-pre-wrap text-xs">{aiAnalysis}</p>
                        </div>
                    </div>
                ) : (
                    <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-2 bg-indigo-600 rounded-lg text-xs font-bold flex justify-center items-center gap-2 hover:bg-indigo-500 disabled:opacity-50">
                        {isAnalyzing ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>} AI Analysis
                    </button>
                )}
                <div className="flex gap-2">
                    <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2">
                        {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Pause' : 'Run'}
                    </button>
                    <button onClick={() => {setTemperature(300); setVolume(50);}} className="p-2 bg-slate-700 rounded-xl hover:bg-slate-600 text-white"><RotateCcw size={16}/></button>
                </div>
            </div>
        </div>

        {/* VISUALIZATION */}
        <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 overflow-hidden relative shadow-2xl">
            <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
            <div className="absolute top-4 left-4 text-xs font-mono text-slate-500">
                Particle Engine v2.0 // {mode.toUpperCase()}
            </div>
        </div>
    </div>
  );
};
