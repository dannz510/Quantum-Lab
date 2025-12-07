
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Play, Pause, RotateCcw, Volume2, Wind, Eye, Target, Waves, Ruler, LayoutGrid, Loader2, Sparkles, X, Car, Plane, Star } from 'lucide-react';
import { AppMode, Language } from '../types';
import { analyzeExperimentData } from '../services/gemini';

interface WaveLabProps {
  mode: AppMode;
  lang: Language;
}

const WavesDopplerEffect = ({ lang }: { lang: Language }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [sourceVelocity, setSourceVelocity] = useState(0); 
    const [waveSpeed, setWaveSpeed] = useState(343); 
    const [sourceFrequency, setSourceFrequency] = useState(10); 
    const [sourceType, setSourceType] = useState<'car'|'jet'|'star'>('car');
    
    const [time, setTime] = useState(0);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const graphRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);
    
    // Observers
    const observers = [{x: 100, y: 250, freq: 0, color: '#f59e0b', label: 'Observer A'}, {x: 700, y: 250, freq: 0, color: '#3b82f6', label: 'Observer B'}];

    const drawSimulation = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const centerY = H / 2;
        const centerX = W / 2;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);

        const V_source = sourceVelocity;
        const V_wave = waveSpeed;
        const scale = 5; 
        const V_source_sim = V_source / scale;
        const V_wave_sim = V_wave / scale; 
        const wavePeriod = 1 / sourceFrequency; 
        
        const sourceX = centerX + V_source_sim * time;
        const sourceY = centerY;

        // Wavefronts
        const maxWaveAge = 15; 
        for (let i = 0; i < maxWaveAge; i++) {
            const waveAge = time - i * wavePeriod;
            if (waveAge <= 0) continue;
            const radius = waveAge * V_wave_sim;
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(centerX + V_source_sim * (time - waveAge), sourceY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Source Icon
        ctx.fillStyle = 'white';
        // Simple shape based on type
        ctx.beginPath();
        if (sourceType === 'car') {
            ctx.rect(sourceX - 15, sourceY - 10, 30, 20);
        } else if (sourceType === 'jet') {
            ctx.moveTo(sourceX + 20, sourceY); ctx.lineTo(sourceX - 10, sourceY - 15); ctx.lineTo(sourceX - 10, sourceY + 15);
        } else {
            ctx.arc(sourceX, sourceY, 15, 0, Math.PI*2);
        }
        ctx.fill();
        
        // Observers
        observers.forEach(obs => {
            const dx = obs.x - sourceX;
            // Doppler Math
            const f_obs = sourceFrequency * (V_wave / (V_wave - V_source * Math.sign(-dx))); // Approaching source makes denominator smaller (higher freq)
            obs.freq = Math.abs(f_obs);

            ctx.fillStyle = obs.color;
            ctx.beginPath(); ctx.arc(obs.x, obs.y, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'white'; ctx.font = '12px sans-serif'; ctx.fillText(`${obs.freq.toFixed(1)} Hz`, obs.x - 20, obs.y - 15);
        });

        // Graph Drawing (Observer B Freq over time)
        const gCanvas = graphRef.current;
        if(gCanvas) {
            const gCtx = gCanvas.getContext('2d');
            if(gCtx) {
                // Scroll
                const img = gCtx.getImageData(1, 0, gCanvas.width-1, gCanvas.height);
                gCtx.putImageData(img, 0, 0);
                gCtx.fillStyle = '#1e293b'; gCtx.fillRect(gCanvas.width-1, 0, 1, gCanvas.height);
                
                // Plot B
                const y = gCanvas.height - (observers[1].freq / (sourceFrequency*2)) * gCanvas.height * 0.8;
                gCtx.fillStyle = '#3b82f6';
                gCtx.fillRect(gCanvas.width-1, y, 2, 2);
            }
        }

    }, [sourceVelocity, waveSpeed, sourceFrequency, time, sourceType]);

    useEffect(() => {
        if (!isRunning) return;
        const animate = () => {
            setTime(t => t + 0.05);
            drawSimulation();
            reqRef.current = requestAnimationFrame(animate);
        };
        reqRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(reqRef.current);
    }, [isRunning, drawSimulation]);
    
    useEffect(() => {
        drawSimulation();
    }, [drawSimulation]);

    const handleReset = () => {
        setIsRunning(false);
        setTime(0);
        setSourceVelocity(0);
        if(graphRef.current) {
             const ctx = graphRef.current.getContext('2d');
             if(ctx) ctx.clearRect(0,0,graphRef.current.width, graphRef.current.height);
        }
        drawSimulation();
        setAiAnalysis('');
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const summary = `Doppler Effect: Source Vel=${sourceVelocity}m/s, Wave Speed=${waveSpeed}m/s, Freq=${sourceFrequency}Hz. Mach=${(sourceVelocity/waveSpeed).toFixed(2)}`;
        const result = await analyzeExperimentData("Doppler Effect", { sourceVelocity, waveSpeed, sourceFrequency }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
                    <Volume2 size={20} className="text-pink-500" /> Cấu Hình Sóng & Nguồn
                </div>
                
                <div className="p-3 bg-slate-900 rounded-xl space-y-3">
                   <label className="text-xs text-slate-400 block">Vận tốc Nguồn ({sourceVelocity} m/s)</label>
                   <input type="range" min="0" max="500" step="10" value={sourceVelocity} onChange={(e) => setSourceVelocity(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-red-500" />
                   
                   <label className="text-xs text-slate-400 block">Tốc độ Sóng ({waveSpeed} m/s)</label>
                   <input type="range" min="100" max="500" step="10" value={waveSpeed} onChange={(e) => setWaveSpeed(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-cyan-500" />
                   
                   <label className="text-xs text-slate-400 block">Tần số Nguồn ({sourceFrequency} Hz)</label>
                   <input type="range" min="1" max="50" step="1" value={sourceFrequency} onChange={(e) => setSourceFrequency(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-yellow-500" />
                </div>
                
                <div className="flex gap-2 p-2 bg-slate-900 rounded-xl">
                    <button onClick={() => setSourceType('car')} className={`p-2 flex-1 rounded ${sourceType === 'car' ? 'bg-indigo-600' : 'bg-slate-700'}`}><Car size={16} className="mx-auto"/></button>
                    <button onClick={() => setSourceType('jet')} className={`p-2 flex-1 rounded ${sourceType === 'jet' ? 'bg-indigo-600' : 'bg-slate-700'}`}><Plane size={16} className="mx-auto"/></button>
                    <button onClick={() => setSourceType('star')} className={`p-2 flex-1 rounded ${sourceType === 'star' ? 'bg-indigo-600' : 'bg-slate-700'}`}><Star size={16} className="mx-auto"/></button>
                </div>

                <div className="flex flex-col gap-2 mt-auto">
                    {aiAnalysis ? (
                        <div className="bg-purple-900/30 p-2 rounded text-xs relative">
                           <button onClick={() => setAiAnalysis('')} className="absolute top-1 right-1"><X size={12}/></button>
                           {/* SCROLLBAR ADDED */}
                           <div className="max-h-32 overflow-y-auto custom-scrollbar">
                             {aiAnalysis}
                           </div>
                        </div>
                    ) : (
                         <button onClick={handleAnalyze} disabled={isAnalyzing} className="py-2 bg-indigo-600 rounded text-xs font-bold flex justify-center items-center gap-2">
                             {isAnalyzing ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>} AI Phân Tích
                         </button>
                    )}
                    <div className="flex gap-2">
                        <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-pink-600 hover:bg-pink-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2">
                            {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Dừng' : 'Phát'}
                        </button>
                        <button onClick={handleReset} className="p-2 bg-slate-700 rounded-xl hover:bg-slate-600 text-white"><RotateCcw size={16}/></button>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-9 flex flex-col gap-4">
                <div className="flex-1 bg-black rounded-xl border border-slate-700 overflow-hidden relative shadow-2xl">
                    <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
                </div>
                <div className="h-32 bg-slate-800 rounded-xl border border-slate-700 p-2 relative">
                    <div className="text-xs text-slate-400 absolute top-2 left-2">Biểu Đồ Tần Số Quan Sát (Observer B)</div>
                    <canvas ref={graphRef} width={800} height={100} className="w-full h-full"></canvas>
                </div>
            </div>
        </div>
    );
};

const WavesRippleTank = ({ lang }: { lang: Language }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [sourceCount, setSourceCount] = useState(2);
    const [frequency, setFrequency] = useState(5);
    const [phaseDifference, setPhaseDifference] = useState(0); 
    const [barrierType, setBarrierType] = useState('double_slit');
    const [slitWidth, setSlitWidth] = useState(10); 
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const crossSectionRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);
    const timeRef = useRef(0);

    const sources = [
        { x: 350, y: 250, phase: 0 },
        { x: 450, y: 250, phase: phaseDifference },
        { x: 400, y: 150, phase: phaseDifference * 2 }
    ].slice(0, sourceCount);
    
    const drawSimulation = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);

        const V_wave = 100;
        const wavelength = V_wave / frequency;

        for (let x = 0; x < W; x += 2) {
            for (let y = 0; y < H; y += 2) {
                let totalAmplitude = 0;
                sources.forEach(source => {
                    const dx = x - source.x;
                    const dy = y - source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    const phase = (distance / wavelength * 2 * Math.PI) - (timeRef.current * frequency * 2 * Math.PI) + (source.phase * Math.PI / 180);
                    const amplitude = Math.cos(phase) / (distance / 50 + 1); 
                    totalAmplitude += amplitude;
                });
                
                const colorVal = Math.floor(Math.abs(totalAmplitude) * 128) + 127;
                const alpha = Math.min(1.0, Math.abs(totalAmplitude) * 0.8);

                const r = totalAmplitude > 0 ? colorVal : 127;
                const g = 127;
                const b = totalAmplitude < 0 ? colorVal : 127;

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                ctx.fillRect(x, y, 2, 2);
            }
        }
        
        const barrierX = W / 2;
        ctx.fillStyle = '#475569';
        ctx.fillRect(barrierX - 5, 0, 10, H);
        
        if (barrierType === 'double_slit') {
            const slitCenter1 = H / 2 - 50;
            const slitCenter2 = H / 2 + 50;
            
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(barrierX - 5, slitCenter1 - slitWidth * 2, 10, slitWidth * 4); 
            ctx.fillRect(barrierX - 5, slitCenter2 - slitWidth * 2, 10, slitWidth * 4); 
        }

        sources.forEach(source => {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(source.x, source.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });

    }, [sourceCount, frequency, phaseDifference, barrierType, slitWidth, sources]);

    const drawCrossSection = useCallback(() => {
        const canvas = crossSectionRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const centerY = H / 2;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(W, centerY);
        ctx.stroke();

        const V_wave = 100;
        const wavelength = V_wave / frequency;
        
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const simulationCanvas = canvasRef.current;
        if (!simulationCanvas) return;
        const simW = simulationCanvas.width;
        const simH = simulationCanvas.height;
        const crossSectionX = simW * 0.75;
        
        for (let y = 0; y < H; y++) {
            const simY = y * simH / H; 
            let totalAmplitude = 0;
            sources.forEach(source => {
                const dx = crossSectionX - source.x;
                const dy = simY - source.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const phase = (distance / wavelength * 2 * Math.PI) - (timeRef.current * frequency * 2 * Math.PI) + (source.phase * Math.PI / 180);
                const amplitude = Math.cos(phase) / (distance / 50 + 1); 
                totalAmplitude += amplitude;
            });
            
            const y_pos = centerY - totalAmplitude * 50;
            if (y === 0) ctx.moveTo(W * 0.5, y_pos);
            else ctx.lineTo(W * 0.5, y_pos); 
        }
        ctx.stroke();

    }, [sources, frequency]);

    useEffect(() => {
        if (!isRunning) return;

        const animate = () => {
            timeRef.current += 0.05;
            drawSimulation();
            drawCrossSection();
            reqRef.current = requestAnimationFrame(animate);
        };

        reqRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(reqRef.current);
    }, [isRunning, drawSimulation, drawCrossSection]);
    
    useEffect(() => {
        drawSimulation();
        drawCrossSection();
    }, [drawSimulation, drawCrossSection]);

    const handleReset = () => {
        setIsRunning(false);
        timeRef.current = 0;
        drawSimulation();
        drawCrossSection();
        setAiAnalysis('');
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const summary = `Ripple Tank: Sources=${sourceCount}, Freq=${frequency}Hz, Phase Diff=${phaseDifference}, Barrier=${barrierType}`;
        const result = await analyzeExperimentData("Ripple Tank", { sourceCount, frequency, barrierType }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
                    <Waves size={20} className="text-teal-500" /> Cấu Hình Bể Sóng
                </div>
                
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Số lượng Nguồn Sóng ({sourceCount})</label>
                   <input type="range" min="1" max="3" step="1" value={sourceCount} onChange={(e) => setSourceCount(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-teal-500 cursor-pointer" />
                </div>
                
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Tần số (f) ({frequency.toFixed(1)} Hz)</label>
                   <input type="range" min="1" max="10" step="0.5" value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-teal-500 cursor-pointer" />
                   <p className='text-xs text-teal-400 italic'>Bước sóng (lambda): {(100 / frequency).toFixed(1)} px</p>
                </div>
                
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Lệch Pha Nguồn 2 ({phaseDifference}°) </label>
                   <input type="range" min="0" max="360" step="10" value={phaseDifference} onChange={(e) => setPhaseDifference(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-indigo-500 cursor-pointer" />
                </div>

                <div className="p-3 bg-slate-900 rounded-xl shadow-inner space-y-3">
                    <label className="text-xs text-slate-400 block mb-2">Hình dạng Vật cản Nhiễu xạ</label>
                    <select 
                        value={barrierType} 
                        onChange={(e) => setBarrierType(e.target.value)} 
                        className="w-full p-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    >
                        <option value="double_slit">Khe Kép (Double Slit)</option>
                        <option value="single_slit">Khe Đơn (Single Slit)</option>
                        <option value="none">Không có Vật cản</option>
                    </select>
                    {barrierType !== 'none' && (
                        <div>
                           <label className="text-xs text-slate-400 block mt-2 mb-1">Chiều rộng Khe ({slitWidth.toFixed(0)} px)</label>
                           <input type="range" min="5" max="30" step="1" value={slitWidth} onChange={(e) => setSlitWidth(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-amber-500 cursor-pointer" />
                        </div>
                    )}
                </div>

                <div className="p-3 bg-slate-700 rounded-xl shadow-lg border-l-4 border-yellow-400 mt-auto">
                    <p className="text-sm font-bold text-white mb-1"><Ruler size={14} className='inline mr-1'/> Phân Tích Mô Hình Giao Thoa</p>
                    <p className='text-xs text-slate-300'>n: Số Vùng Cực Đại, lambda / d: Tỷ lệ Giao thoa/Nhiễu xạ</p>
                    <p className='text-xs text-yellow-400'>Vùng Cực Đại: <span className='font-mono'>~5</span> (Giả lập)</p>
                </div>

                <div className="pt-4 border-t border-slate-700 mt-auto flex flex-col gap-4">
                    {aiAnalysis ? (
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-3 text-sm text-slate-200 relative animate-in slide-in-from-bottom-2 flex flex-col">
                        <div className="flex justify-between items-start mb-2 sticky top-0">
                            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold"><Sparkles size={12}/> AI Analysis</div>
                            <button onClick={() => setAiAnalysis('')} className="text-slate-500 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"><X size={14}/></button>
                        </div>
                        {/* SCROLLBAR ADDED */}
                        <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2">
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
                        <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                            {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Tạm Dừng' : 'Tạo Sóng'}
                        </button>
                        <button onClick={handleReset} className="p-2 bg-slate-700 rounded-xl hover:bg-slate-600 text-white transition-colors" title="Thiết Lập Lại"><RotateCcw size={16}/></button>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-9 flex flex-col gap-4">
                <div className="flex-1 bg-black rounded-xl border border-slate-700 overflow-hidden relative shadow-2xl">
                    <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
                    <div className="absolute top-4 left-4 text-sm text-slate-400">
                        Mô Phỏng Giao Thoa/Nhiễu Xạ Sóng
                    </div>
                </div>
                
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                    <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 mb-2"><LayoutGrid size={16} className="text-purple-400"/> Mặt Cắt Sóng Động (Tại X=75%)</div>
                    <div className='h-20 w-full'>
                       <canvas ref={crossSectionRef} width={700} height={80} className="w-full h-full"></canvas>
                    </div>
                    <p className='text-xs text-slate-400 italic'>Biểu đồ Biên độ sóng theo vị trí Y.</p>
                </div>
            </div>
        </div>
    );
};

export const WaveLab: React.FC<WaveLabProps> = ({ mode, lang }) => {
  if (mode === AppMode.SIM_RUN_DOPPLER) {
    return <WavesDopplerEffect lang={lang} />;
  }
  if (mode === AppMode.SIM_RUN_RIPPLE) {
    return <WavesRippleTank lang={lang} />;
  }
  return <div className="p-10 text-center text-slate-500">Mode not found</div>;
};
