
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Play, Pause, RotateCcw, Sparkles, Loader2, X, Plus, Zap, Share2 } from 'lucide-react';
import { analyzeExperimentData } from '../services/gemini';
import { Language } from '../types';
import { SoundEngine } from '../services/sound';

// MOCK PHYSICS & AI SERVICES
const calculateGravitationalWaveStrain = (time: number, bhs: BlackHole[], mergerTime: number, spinAlignment: number) => {
    if (bhs.length < 2) return 0;
    const timeToCoalescence = mergerTime - time;
    if (timeToCoalescence <= 0) return 0.2 + (0.5 * Math.sin(time * 50)) * Math.exp(-(time - mergerTime) * 10); // Ringdown

    const timeFactor = timeToCoalescence > 0 ? timeToCoalescence : 0.001; 
    const frequency = 5 + (mergerTime - timeFactor) * 20; 
    const amplitude = 0.0000001 / timeFactor; 
    const spinBoost = 1 + bhs[0].spin * 0.4 * (1 + spinAlignment * 0.5); 
    const strain = Math.sin(time * frequency * spinBoost) * amplitude * spinBoost * 1e-19; 
    return strain;
};

interface BlackHole {
  id: number;
  mass: number;
  spin: number; 
  spinTilt: number;
  color: string;
  initialAngle: number;
}

interface Event {
    time: number;
    description: string;
}

const initialBlackHoles: BlackHole[] = [
    { id: 1, mass: 2.0, spin: 0.8, spinTilt: 0, color: '#f59e0b', initialAngle: 0 },
    { id: 2, mass: 1.0, spin: 0.0, spinTilt: 0, color: '#06b6d4', initialAngle: Math.PI },
];

interface BlackHoleLabProps {
  lang: Language;
}

export const BlackHoleLab: React.FC<BlackHoleLabProps> = ({ lang }) => {
  // State for controls
  const [isRunning, setIsRunning] = useState(false);
  const [bhs, setBhs] = useState<BlackHole[]>(initialBlackHoles);
  const [time, setTime] = useState(0);
  const [eventLog, setEventLog] = useState<Event[]>([]);
  const [finalBHMassLoss, setFinalBHMassLoss] = useState(0);
  const [recoilVelocity, setRecoilVelocity] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plotCanvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>(0);
  
  // Audio Ref
  const droneRef = useRef<any>(null);

  const mergerTime = 10; 
  
  useEffect(() => {
    if (time > mergerTime - 2 && time < mergerTime - 1.95 && bhs.length >= 2) {
        const desc = "Quỹ đạo xoắn ốc tăng tốc (Phát hiện tín hiệu Chirp).";
        if (!eventLog.some(e => e.description === desc)) setEventLog(prev => [...prev, { time: time, description: desc }]);
    }
    if (time > mergerTime && time < mergerTime + 0.05 && bhs.length >= 2) {
        const totalMass = bhs.reduce((sum, bh) => sum + bh.mass, 0);
        const massLoss = (totalMass - (totalMass * 0.95)) / totalMass;
        const kickV = bhs.some(bh => bh.spinTilt > 0) ? 500 : 0;
        
        setFinalBHMassLoss(massLoss);
        setRecoilVelocity(kickV);
        
        const desc = `Hợp nhất hoàn tất. Hố đen cuối: M=${(totalMass * (1 - massLoss)).toFixed(2)}. Mất khối lượng: ${(massLoss * 100).toFixed(2)}%`;
        if (!eventLog.some(e => e.description.includes("Hợp nhất hoàn tất"))) setEventLog(prev => [...prev, { time: time, description: desc }]);
    }
  }, [time, bhs, mergerTime, eventLog]);

  const drawStrainPlot = useCallback((currentStrain: number) => {
    const canvas = plotCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    const imageData = ctx.getImageData(1, 0, w - 1, h);
    ctx.putImageData(imageData, 0, 0);
    ctx.fillStyle = '#0f172a'; 
    ctx.fillRect(w - 1, 0, 1, h);

    ctx.strokeStyle = '#334155'; 
    ctx.beginPath();
    ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); 
    ctx.stroke();

    const maxStrainVisual = 0.3; 
    const normalizedStrain = (currentStrain / maxStrainVisual);
    const y = h / 2 - (normalizedStrain * h / 2); 

    ctx.fillStyle = '#f59e0b'; 
    ctx.fillRect(w - 1, y, 1, 1);
  }, []);
  
  const drawAccretionDisk = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, spin: number, tilt: number, color: string) => {
    // Enhanced Accretion Disk Shader
    const gradient = ctx.createRadialGradient(x, y, size * 0.5, x, y, size * 2.5);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, 'transparent');
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    
    ctx.globalAlpha = 0.6 + spin * 0.4;
    ctx.beginPath();
    const tiltFactor = 1 - Math.abs(tilt / 90) * 0.3;
    ctx.ellipse(x, y, size * 2.5, size * 2.5 * tiltFactor, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Event Horizon
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'white';
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * (1 - spin / 3), 0, 0, Math.PI * 2);
    ctx.fill(); 
    
    ctx.shadowBlur = 0;
  }

  const drawSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, w, h);

    const currentStrain = calculateGravitationalWaveStrain(time, bhs, mergerTime, bhs.some(bh => bh.spinTilt > 0) ? 0.5 : 0);
    drawStrainPlot(currentStrain * 1e25);
    
    // UPDATE DRONE SOUND
    if (isRunning && droneRef.current) {
        // Estimate frequency based on time left
        const timeLeft = Math.max(0.1, mergerTime - time);
        const freq = 10 + (1 / timeLeft) * 20; // Increases as time -> merger
        const normStrain = Math.abs(currentStrain * 1e20); 
        droneRef.current.update(normStrain, freq);
    }

    const cx = w/2;
    const cy = h/2;

    const timeLeft = Math.max(0, mergerTime - time);
    const orbitRadius = timeLeft > 0.1 ? (timeLeft / mergerTime) * 100 : 0; 
    const angle = time * (10 / (timeLeft + 1)); 

    const bhPositions = bhs.map((bh, index) => {
        let x, y;
        let massFraction = bh.mass / bhs.reduce((sum, b) => sum + b.mass, 0);
        let currentDist = orbitRadius * (1 - massFraction); 
        
        if (bhs.length === 2) {
            x = cx + Math.cos(angle + bh.initialAngle) * (bh === bhs[0] ? currentDist : -currentDist);
            y = cy + Math.sin(angle + bh.initialAngle) * (bh === bhs[0] ? currentDist : -currentDist);
        } else if (index < 2) {
             x = cx + Math.cos(angle + bh.initialAngle) * (bh === bhs[0] ? currentDist : -currentDist);
             y = cy + Math.sin(angle + bh.initialAngle) * (bh === bhs[0] ? currentDist : -currentDist);
        } else {
             const thirdBodyDist = 150 * (1 - time / (mergerTime + 5));
             x = cx + Math.cos(time * 0.5 + bh.initialAngle) * thirdBodyDist;
             y = cy + Math.sin(time * 0.5 + bh.initialAngle) * thirdBodyDist;
        }

        return { x, y, size: bh.mass * 10, spin: bh.spin, tilt: bh.spinTilt, color: bh.color };
    });

    // Gravitational Lensing Grid
    const ripple = currentStrain * 5000; 
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    
    const drawGridLine = (start: {x: number, y: number}, end: {x: number, y: number}) => {
        ctx.beginPath();
        for(let t=0; t<=1; t+=0.05) {
            const x = start.x + (end.x - start.x) * t;
            const y = start.y + (end.y - start.y) * t;
            let lensingX = 0;
            let lensingY = 0;
            
            bhPositions.forEach(pos => {
                const dx = x - pos.x;
                const dy = y - pos.y;
                const r = Math.sqrt(dx*dx + dy*dy);
                const warpFactor = (pos.size * 5) / (r * r + 1); 
                lensingX += dx * warpFactor;
                lensingY += dy * warpFactor;
            });

            const distToCenter = Math.sqrt((x-cx)**2 + (y-cy)**2);
            const waveEffectY = Math.sin(distToCenter * 0.1 - time * 10) * ripple * Math.exp(-distToCenter/300);
            
            const finalX = x + lensingX;
            const finalY = y + waveEffectY + lensingY;

            if (t === 0) ctx.moveTo(finalX, finalY);
            else ctx.lineTo(finalX, finalY);
        }
        ctx.stroke();
    }
    
    const gridStep = 50;
    for(let i=0; i<w; i+=gridStep) drawGridLine({x: i, y: 0}, {x: i, y: h});
    for(let j=0; j<h; j+=gridStep) drawGridLine({x: 0, y: j}, {x: w, y: j});

    if (timeLeft > 0.05) {
        bhPositions.forEach(pos => {
            drawAccretionDisk(ctx, pos.x, pos.y, pos.size, pos.spin, pos.tilt, pos.color);
        });
    } else {
        // Merger Complete Shockwave
        const finalMassSize = 40; 
        ctx.fillStyle = 'black';
        ctx.strokeStyle = '#ef4444'; 
        ctx.shadowBlur = 50 + Math.sin(time*20)*20; 
        ctx.shadowColor = '#ef4444';
        ctx.beginPath(); ctx.arc(cx, cy, finalMassSize, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        
        const ringdownWaveRadius = finalMassSize + (time-mergerTime)*200;
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, 1 - (time - mergerTime))})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, ringdownWaveRadius, 0, Math.PI*2);
        ctx.stroke();
        
        if (recoilVelocity > 0) {
            ctx.fillStyle = 'yellow';
            ctx.font = 'bold 16px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(`KICK: ${recoilVelocity} km/s`, cx + 80, cy - 80);
        }
    }
  }, [time, bhs, mergerTime, recoilVelocity, drawStrainPlot, isRunning]);

  useEffect(() => {
    if (!isRunning) {
        if (droneRef.current) {
            droneRef.current.stop();
            droneRef.current = null;
        }
        return;
    }
    
    // Start sound if running
    if (!droneRef.current) {
        droneRef.current = SoundEngine.createGravitationalDrone();
    }

    const animate = () => {
        setTime(t => t + 0.02);
        if (time > mergerTime + 5) setIsRunning(false);
        drawSimulation();
        reqRef.current = requestAnimationFrame(animate);
    };
    reqRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(reqRef.current);
  }, [isRunning, time, drawSimulation, mergerTime]);
  
  // Cleanup on unmount
  useEffect(() => {
      return () => {
          if (droneRef.current) droneRef.current.stop();
      };
  }, []);
  
  const handleReset = () => {
      setIsRunning(false);
      setTime(0);
      setEventLog([]);
      setFinalBHMassLoss(0);
      setRecoilVelocity(0);
      if (droneRef.current) {
          droneRef.current.stop();
          droneRef.current = null;
      }
      setAiAnalysis('');
  };
  
  const handleUpdateBH = (id: number, field: string, value: number) => {
      setBhs(prev => prev.map(bh => 
          bh.id === id ? { ...bh, [field]: value } : bh
      ));
  };
  
  const handleAddBH = () => {
      if (bhs.length >= 3) return;
      const newId = Math.max(...bhs.map(b => b.id), 0) + 1;
      setBhs(prev => [...prev, { 
          id: newId, 
          mass: 0.5, 
          spin: 0.1, 
          spinTilt: 0,
          color: '#f97316', 
          initialAngle: Math.random() * Math.PI * 2 
      }]);
  };

  const handleRemoveBH = (id: number) => {
      if (bhs.length <= 1) return;
      setBhs(prev => prev.filter(bh => bh.id !== id));
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const summary = `Black Hole Merger: Bodies=${bhs.length}, SpinTilt used=${bhs.some(b => b.spinTilt > 0)}, Mass Loss=${(finalBHMassLoss * 100).toFixed(2)}%, Kick=${recoilVelocity}`;
    const result = await analyzeExperimentData("Black Hole Merger", { bhsCount: bhs.length, finalBHMassLoss }, summary, lang);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden bg-slate-900 text-slate-100">
      
      {/* LEFT PANEL */}
      <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          
          <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
            <Settings size={20} className="text-orange-500" /> Cấu Hình Hệ Thống Hố Đen
          </div>
          
          <div className="flex justify-between items-center pb-2 border-b border-slate-700 flex-shrink-0">
              <h3 className="text-sm font-semibold text-slate-400">Hố Đen ({bhs.length}/3)</h3>
              <div className="flex gap-2">
                  <button onClick={handleAddBH} disabled={bhs.length >= 3} className="p-1 bg-green-600 rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors" title="Thêm Hố Đen"><Plus size={14}/></button>
              </div>
          </div>
          
          <div className="space-y-4 flex-grow overflow-y-auto pr-1 custom-scrollbar">
              {bhs.map((bh, index) => (
                  <div key={bh.id} className={`p-3 rounded-xl border-l-4 ${bh.color === '#f59e0b' ? 'border-orange-500' : bh.color === '#06b6d4' ? 'border-sky-500' : 'border-amber-500'} bg-slate-900 shadow-md`}>
                      <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm text-white">Hố Đen {index + 1}</span>
                          <button onClick={() => handleRemoveBH(bh.id)} disabled={bhs.length <= 1} className="text-red-500 hover:text-red-400 disabled:opacity-30"><X size={14}/></button>
                      </div>

                      <div>
                         <label className="text-xs text-slate-400 block mb-1">Khối lượng ({bh.mass.toFixed(1)} M☉)</label>
                         <input type="range" min="0.5" max="3" step="0.1" value={bh.mass} onChange={(e) => handleUpdateBH(bh.id, 'mass', Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-orange-500 cursor-pointer" />
                      </div>
                      
                      <div className="mt-2">
                         <label className="text-xs text-slate-400 block mb-1">Tham số Quay (a) ({bh.spin.toFixed(2)})</label>
                         <input type="range" min="0" max="0.99" step="0.01" value={bh.spin} onChange={(e) => handleUpdateBH(bh.id, 'spin', Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-teal-500 cursor-pointer" />
                      </div>
                      
                      <div className="mt-2">
                         <label className="text-xs text-slate-400 block mb-1">Góc Spin (Độ nghiêng) ({bh.spinTilt}°)</label>
                         <input type="range" min="0" max="90" step="5" value={bh.spinTilt} onChange={(e) => handleUpdateBH(bh.id, 'spinTilt', Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-purple-500 cursor-pointer" />
                         <p className='text-xs text-purple-400 italic'>Góc nghiêng khác 0 $\rightarrow$ Phát xạ Sóng Hấp dẫn không đối xứng (Kick).</p>
                      </div>
                  </div>
              ))}
          </div>

          <div className="p-3 bg-slate-700 rounded-xl shadow-lg border-l-4 border-red-500 flex-shrink-0">
             <p className="text-sm font-bold text-white mb-1"><Share2 size={14} className='inline mr-1'/> Kết Quả Hợp Nhất</p>
             <p className='text-xs text-slate-300'>Mất Khối lượng (Năng lượng $\gamma$): <span className='text-red-400 font-mono'>{(finalBHMassLoss * 100).toFixed(2)}%</span></p>
             <p className='text-xs text-slate-300'>Vận tốc Giật lùi (Kick): <span className='text-yellow-400 font-mono'>{recoilVelocity.toFixed(0)} km/s</span></p>
          </div>

          <div className="pt-4 border-t border-slate-700 mt-auto flex flex-col gap-4">
            {aiAnalysis ? (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-3 text-sm text-slate-200 relative animate-in slide-in-from-bottom-2 flex flex-col">
                  <div className="flex justify-between items-start mb-2 sticky top-0">
                     <div className="flex items-center gap-2 text-purple-400 text-xs font-bold"><Sparkles size={12}/> AI Analysis</div>
                     <button onClick={() => setAiAnalysis('')} className="text-slate-500 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"><X size={14}/></button>
                  </div>
                  {/* SCROLLBAR ADDED */}
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
                  Phân Tích AI
                </button>
              )}
          
            <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50" disabled={time > mergerTime + 3 || bhs.length < 2}>
                    {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Dừng' : 'Mô Phỏng'}
                </button>
                <button onClick={handleReset} className="p-2 bg-slate-700 rounded-xl hover:bg-slate-600 text-white transition-colors" title="Thiết Lập Lại Mô Phỏng"><RotateCcw size={16}/></button>
            </div>
          </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:col-span-9 flex flex-col gap-4">
          <div className="flex-1 bg-black rounded-xl border border-slate-700 overflow-hidden relative shadow-2xl min-h-[300px]">
              <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
              <div className="absolute top-4 left-4 flex flex-col gap-1">
                 <div className="text-xs font-mono text-orange-500 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></span>
                    HỆ ĐA THỂ GR // T: {time.toFixed(2)}s
                 </div>
                 <div className="text-[10px] text-slate-500 font-mono">
                    Độ Cong Không-Thời gian: {calculateGravitationalWaveStrain(time, bhs, mergerTime, bhs.some(bh => bh.spinTilt > 0) ? 0.5 : 0).toExponential(4)}
                 </div>
              </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0 min-h-[120px]">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex flex-col">
                  <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 mb-2"><Zap size={16} className="text-yellow-400"/> Nhật Ký Sự Kiện Hợp Nhất</div>
                  <div className="space-y-1 text-xs max-h-24 overflow-y-auto custom-scrollbar">
                      {eventLog.length === 0 ? (
                          <p className="text-slate-500 italic">Đang chờ mô phỏng khởi động...</p>
                      ) : (
                          eventLog.slice().reverse().map((event, index) => (
                              <div key={index} className="flex items-start text-slate-300">
                                  <span className="font-mono text-[10px] text-yellow-500 w-10 shrink-0">[{event.time.toFixed(2)}s]</span>
                                  <span className="ml-2">{event.description}</span>
                              </div>
                          ))
                      )}
                  </div>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                 <div className="text-xs text-slate-500 uppercase flex justify-between items-center">
                     <span>Phổ Tín Hiệu Sóng Hấp Dẫn (Strain h)</span>
                 </div>
                 <div className="h-24 mt-2 relative">
                    <canvas ref={plotCanvasRef} width={250} height={96} className="w-full h-full"></canvas>
                 </div>
              </div>
          </div>
      </div>
    </div>
  );
};
