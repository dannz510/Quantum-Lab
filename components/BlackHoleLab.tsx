
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Play, Pause, RotateCcw, Sparkles, Loader2, X, Aperture } from 'lucide-react';
import { calculateGravitationalWaveStrain } from '../services/physics';
import { analyzeExperimentData } from '../services/gemini';
import { Language } from '../types';

interface BlackHoleLabProps {
  lang: Language;
}

interface Particle {
  x: number;
  y: number;
  angle: number;
  dist: number;
  speed: number;
  color: string;
}

export const BlackHoleLab: React.FC<BlackHoleLabProps> = ({ lang }) => {
  const t = (en: string, vi: string) => lang === 'vi' ? vi : en;

  const [isRunning, setIsRunning] = useState(false);
  const [massRatio, setMassRatio] = useState(1);
  const [distance, setDistance] = useState(100); // initial distance
  const [time, setTime] = useState(0);
  
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  const mergerTime = 10; // seconds to merger

  // Initialize Particles
  useEffect(() => {
    const parts: Particle[] = [];
    for(let i=0; i<200; i++) {
       parts.push({
         x: 0, y: 0,
         angle: Math.random() * Math.PI * 2,
         dist: 30 + Math.random() * 50,
         speed: 0.05 + Math.random() * 0.1,
         color: Math.random() > 0.5 ? '#f59e0b' : '#ea580c'
       });
    }
    particlesRef.current = parts;
  }, []);

  useEffect(() => {
    const animate = () => {
      if (isRunning) {
         setTime(t => t + 0.02);
      }
      draw();
      reqRef.current = requestAnimationFrame(animate);
    };
    reqRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(reqRef.current);
  }, [isRunning, time, massRatio, distance]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    
    // Clear with trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, w, h);

    // Spacetime Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    
    // Wave ripple factor based on strain
    const strain = calculateGravitationalWaveStrain(time, 100, mergerTime);
    const ripple = strain * 5000; // scale for visuals

    // Draw Dynamic Grid
    ctx.beginPath();
    for(let x = 0; x < w; x+=40) {
      for(let y=0; y<h; y+=10) {
         const dX = x - w/2;
         const dY = y - h/2;
         const dist = Math.sqrt(dX*dX + dY*dY);
         const wave = Math.sin(dist * 0.1 - time * 10) * ripple * Math.exp(-dist/300);
         const offsetY = wave;
         
         if (y===0) ctx.moveTo(x, y + offsetY);
         else ctx.lineTo(x, y + offsetY);
      }
    }
    ctx.stroke();
    
    // Draw Black Holes
    const timeLeft = Math.max(0, mergerTime - time);
    const currentDist = (timeLeft / mergerTime) * 200; // decaying orbit
    const angle = time * (20 / (timeLeft + 1)); // increasing freq

    const cx = w/2;
    const cy = h/2;

    if (timeLeft > 0.1) {
       // Binary System
       const x1 = cx + Math.cos(angle) * currentDist * 0.5;
       const y1 = cy + Math.sin(angle) * currentDist * 0.5;
       const x2 = cx - Math.cos(angle) * currentDist * 0.5;
       const y2 = cy - Math.sin(angle) * currentDist * 0.5;

       // Draw Accretion Particles
       particlesRef.current.forEach(p => {
          p.angle += p.speed;
          // Orbit BH1
          const px = x1 + Math.cos(p.angle) * (p.dist * massRatio * 0.6);
          const py = y1 + Math.sin(p.angle) * (p.dist * massRatio * 0.6);
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI*2); ctx.fill();
       });

       // Event Horizons
       ctx.fillStyle = 'black';
       ctx.shadowBlur = 20;
       
       // BH 1
       ctx.shadowColor = '#f59e0b';
       ctx.strokeStyle = '#f59e0b';
       ctx.beginPath(); ctx.arc(x1, y1, 20 * massRatio, 0, Math.PI*2); ctx.fill(); ctx.stroke();
       
       // BH 2
       ctx.shadowColor = '#06b6d4';
       ctx.strokeStyle = '#06b6d4';
       ctx.beginPath(); ctx.arc(x2, y2, 20, 0, Math.PI*2); ctx.fill(); ctx.stroke();
       
       ctx.shadowBlur = 0;

    } else {
       // Merged
       ctx.fillStyle = 'black';
       ctx.strokeStyle = '#ef4444'; 
       ctx.shadowBlur = 50 + Math.sin(time*20)*20; // pulsing
       ctx.shadowColor = '#ef4444';
       ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI*2); ctx.fill(); ctx.stroke();
       ctx.shadowBlur = 0;
       
       // Shockwave ring
       ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, 1 - (time - mergerTime))})`;
       ctx.beginPath();
       ctx.arc(cx, cy, 40 + (time-mergerTime)*200, 0, Math.PI*2);
       ctx.stroke();

       // Ringdown text
       ctx.fillStyle = 'white';
       ctx.font = 'bold 20px Inter';
       ctx.textAlign = 'center';
       ctx.fillText("MERGER COMPLETE", cx, cy + 80);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const summary = `Black Hole Merger: Mass Ratio=${massRatio}, Initial Dist=${distance}, Chirp Signal Observed, Energy radiated via Gravitational Waves.`;
    const result = await analyzeExperimentData("Black Hole Merger", { massRatio, distance }, summary, lang);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
      <div className="lg:col-span-3 bg-lab-card border border-slate-700 rounded-2xl p-4 flex flex-col gap-6">
         <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
            <Settings size={20} /> {t('System Parameters', 'Tham Số Hệ Thống')}
         </div>
         
         <div className="space-y-6">
            <div>
               <label className="text-sm text-slate-400">{t('Mass Ratio (M1/M2)', 'Tỷ Lệ Khối Lượng')} ({massRatio})</label>
               <input type="range" min="0.5" max="2" step="0.1" value={massRatio} onChange={(e) => setMassRatio(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-orange-500" />
            </div>
            
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
               <div className="text-xs text-slate-500 uppercase">{t('Wave Strain', 'Độ Căng Sóng')} (h)</div>
               <div className="h-16 flex items-end gap-1 mt-2">
                  {/* Real-time visualizer bars */}
                  {[...Array(30)].map((_, i) => {
                     const historyTime = time - (30-i)*0.05;
                     const strain = calculateGravitationalWaveStrain(Math.max(0, historyTime), 100, mergerTime);
                     const h = Math.min(100, Math.abs(strain * 1000));
                     return <div key={i} className="flex-1 bg-orange-500/80 rounded-t transition-all duration-75" style={{ height: `${h}%` }}></div>
                  })}
               </div>
            </div>

            <div className="flex gap-2">
                 <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors">
                    {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? t('Pause', 'Dừng') : t('Simulate', 'Mô Phỏng')}
                 </button>
                 <button onClick={() => setTime(0)} className="p-2 bg-slate-700 rounded-xl hover:bg-slate-600 text-white"><RotateCcw size={16}/></button>
            </div>
         </div>

         <div className="pt-4 border-t border-slate-700 mt-auto">
             {aiAnalysis ? (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-3 text-sm text-slate-200 relative animate-in slide-in-from-bottom-2 flex flex-col shadow-lg">
                  <div className="flex justify-between items-start mb-2 sticky top-0 bg-transparent">
                     <div className="flex items-center gap-2 text-purple-400 text-xs font-bold"><Sparkles size={12}/> AI Analysis</div>
                     <button onClick={() => setAiAnalysis('')} className="text-slate-500 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"><X size={14}/></button>
                  </div>
                  <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                     <React.Fragment>
                         {/* Render text with safe formatting */}
                         <p className="whitespace-pre-wrap text-xs leading-relaxed">{aiAnalysis}</p>
                     </React.Fragment>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-300 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                  {t('Explain Gravity', 'Giải Thích Hấp Dẫn')}
                </button>
              )}
            </div>
      </div>

      <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 overflow-hidden relative">
         <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
         <div className="absolute top-4 left-4 flex flex-col gap-1">
            <div className="text-xs font-mono text-orange-500 flex items-center gap-2">
               <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
               LIGO DETECTOR FEED // LIVE
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
               Strain Sensitivity: 1e-21
            </div>
         </div>
      </div>
    </div>
  );
};
