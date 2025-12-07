
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Play, Pause, RotateCcw, Volume2, Wind, Eye, Target, Waves, Ruler, LayoutGrid, Loader2, Sparkles, X } from 'lucide-react';
import { AppMode, Language } from '../types';
import { analyzeExperimentData } from '../services/gemini';

interface WaveLabProps {
  mode: AppMode;
  lang: Language;
}

// --- SUB-COMPONENTS FROM USER CODE ---

const WavesDopplerEffect = ({ lang }: { lang: Language }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [sourceVelocity, setSourceVelocity] = useState(0); // Vận tốc Nguồn (m/s)
    const [waveSpeed, setWaveSpeed] = useState(343); // Tốc độ Sóng (Sound/Light - m/s)
    const [sourceFrequency, setSourceFrequency] = useState(10); // Tần số Nguồn (Hz)
    const [time, setTime] = useState(0);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);
    const observers = [{x: 100, y: 250, freq: 0, color: '#f59e0b'}, {x: 700, y: 250, freq: 0, color: '#3b82f6'}];

    // Draw Function
    const drawSimulation = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        const centerY = H / 2;
        const centerX = W / 2;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);

        const V_source = sourceVelocity;
        const V_wave = waveSpeed;
        
        // Convert simulation units (pixel/time) to real-world scale (simplified)
        const scale = 5; // 1 pixel = 5m
        const V_source_sim = V_source / scale;
        const V_wave_sim = V_wave / scale; 
        const wavePeriod = 1 / sourceFrequency; // Second
        
        // Calculate source position
        const sourceX = centerX + V_source_sim * time;
        const sourceY = centerY;

        // 1. Draw Wavefronts
        const maxWaveAge = 15; // Max waves to draw
        
        for (let i = 0; i < maxWaveAge; i++) {
            const waveAge = time - i * wavePeriod;
            if (waveAge <= 0) continue;

            const radius = waveAge * V_wave_sim;
            const centerShift = V_source_sim * waveAge; // Shift from initial center

            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 1;
            ctx.beginPath();
            // Center of the wave is the point where the source emitted it
            ctx.arc(centerX + V_source_sim * (time - waveAge), sourceY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 2. Draw Source (Nguồn)
        const sourceColor = V_source_sim > 0 ? '#ef4444' : '#f59e0b'; // Red shift (moving right)
        ctx.fillStyle = sourceColor;
        ctx.beginPath();
        ctx.arc(sourceX, sourceY, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw Velocity Vector
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sourceX, sourceY);
        ctx.lineTo(sourceX + V_source_sim * 20, sourceY);
        ctx.stroke();
        
        // 3. Draw Observers & Calculate Observed Frequency (Mock update for UI)
        observers.forEach(obs => {
            const dx = obs.x - sourceX;
            const dist = Math.sqrt(dx * dx);
            
            // Simplified Doppler calculation (1D motion)
            const f_obs = sourceFrequency * (V_wave / (V_wave - V_source * Math.sign(dx)));
            obs.freq = f_obs;

            ctx.fillStyle = obs.color;
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Text annotation
            ctx.fillStyle = 'white';
            ctx.font = '12px Inter';
            ctx.fillText(`f = ${f_obs.toFixed(1)} Hz`, obs.x, obs.y - 15);
        });
        
        // 4. Draw Mach Cone (if V_source >= V_wave)
        if (V_source >= V_wave) {
             const machAngle = Math.asin(V_wave / V_source); 
             const coneLength = 500;
             
             ctx.strokeStyle = '#f87171'; // Red for Shockwave
             ctx.lineWidth = 3;
             
             // Top Cone
             ctx.beginPath();
             ctx.moveTo(sourceX, sourceY);
             ctx.lineTo(sourceX + coneLength * Math.cos(machAngle) * 0.5, sourceY - coneLength * Math.sin(machAngle));
             ctx.stroke();

             // Bottom Cone
             ctx.beginPath();
             ctx.moveTo(sourceX, sourceY);
             ctx.lineTo(sourceX + coneLength * Math.cos(machAngle) * 0.5, sourceY + coneLength * Math.sin(machAngle));
             ctx.stroke();
             
             ctx.fillStyle = '#f87171';
             ctx.font = 'bold 16px Inter';
             ctx.textAlign = 'center';
             ctx.fillText('SÓNG XUNG KÍCH (MACH CONE)', centerX, H - 20);
        }

    }, [sourceVelocity, waveSpeed, sourceFrequency, time, observers]);

    // Animation Loop
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
            
            {/* CỘT THAM SỐ (LEFT PANEL) */}
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
                    <Volume2 size={20} className="text-pink-500" /> Cấu Hình Sóng & Nguồn
                </div>
                
                {/* Control: Source Velocity */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Vận tốc Nguồn (vs) ({sourceVelocity.toFixed(0)} m/s)</label>
                   <input type="range" min="0" max="500" step="10" value={sourceVelocity} onChange={(e) => setSourceVelocity(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-red-500 cursor-pointer" />
                   {/* Đã sửa lỗi: Thay thế > bằng {'>'} */}
                   <p className='text-xs text-red-400 italic'>Vận tốc {'>'} Tốc độ sóng $\rightarrow$ Sóng Xung kích (Mach Cone).</p>
                </div>
                
                {/* Control: Wave Speed (Môi trường) */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1"><Wind size={14} className='inline mr-1'/> Tốc độ Sóng (v) ({waveSpeed.toFixed(0)} m/s)</label>
                   <input type="range" min="100" max="500" step="10" value={waveSpeed} onChange={(e) => setWaveSpeed(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-cyan-500 cursor-pointer" />
                   <p className='text-xs text-cyan-400 italic'>Âm thanh trong không khí: ~343 m/s.</p>
                </div>

                {/* Control: Source Frequency */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Tần số Nguồn (fs) ({sourceFrequency.toFixed(0)} Hz)</label>
                   <input type="range" min="1" max="50" step="1" value={sourceFrequency} onChange={(e) => setSourceFrequency(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-yellow-500 cursor-pointer" />
                </div>
                
                {/* Phân tích Tần số (Frequency Analysis Panel) */}
                <div className="p-3 bg-slate-700 rounded-xl shadow-lg border-l-4 border-white mt-auto">
                    <p className="text-sm font-bold text-white mb-1"><Eye size={14} className='inline mr-1'/> Tần Số Quan Sát (f_obs)</p>
                    <div className='text-xs space-y-1 font-mono'>
                        <p className='text-yellow-400'>Quan sát viên 1 (Trước): fs * v / (v - vs) = {observers[0].freq.toFixed(2)} Hz (Blue Shift)</p>
                        <p className='text-blue-400'>Quan sát viên 2 (Sau): fs * v / (v + vs) = {observers[1].freq.toFixed(2)} Hz (Red Shift)</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-700 mt-auto flex flex-col gap-4">
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
                        Phân Tích AI
                        </button>
                    )}

                    {/* Điều khiển Mô phỏng */}
                    <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-pink-600 hover:bg-pink-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                            {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Tạm Dừng' : 'Phát Sóng'}
                        </button>
                        <button onClick={handleReset} className="p-2 bg-slate-700 rounded-xl hover:bg-slate-600 text-white transition-colors" title="Thiết Lập Lại"><RotateCcw size={16}/></button>
                    </div>
                </div>
            </div>

            {/* CỘT MÔ PHỎNG (RIGHT PANEL) */}
            <div className="lg:col-span-9 flex flex-col gap-4">
                
                {/* Simulation Canvas */}
                <div className="flex-1 bg-black rounded-xl border border-slate-700 overflow-hidden relative shadow-2xl">
                    <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
                    <div className="absolute top-4 left-4 text-sm text-slate-400">
                        Mô phỏng Trắc đồ Sóng (Wavefront Mapping)
                    </div>
                </div>
            </div>
        </div>
    );
};

const WavesRippleTank = ({ lang }: { lang: Language }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [sourceCount, setSourceCount] = useState(2); // Số lượng nguồn sóng
    const [frequency, setFrequency] = useState(5); // Tần số (Hz)
    const [phaseDifference, setPhaseDifference] = useState(0); // Độ lệch pha giữa các nguồn
    const [barrierType, setBarrierType] = useState('double_slit'); // Loại vật cản
    const [slitWidth, setSlitWidth] = useState(10); // Chiều rộng khe
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const crossSectionRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);
    const timeRef = useRef(0);

    // Mock Source Positions (Simplified)
    const sources = [
        { x: 350, y: 250, phase: 0 },
        { x: 450, y: 250, phase: phaseDifference },
        { x: 400, y: 150, phase: phaseDifference * 2 }
    ].slice(0, sourceCount);
    
    // Draw Function (Interference and Diffraction)
    const drawSimulation = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);

        const V_wave = 100; // Tốc độ sóng (pixel/s)
        const wavelength = V_wave / frequency;

        // 1. Calculate and Draw Wave Amplitude (Amplitude Map)
        for (let x = 0; x < W; x += 2) {
            for (let y = 0; y < H; y += 2) {
                let totalAmplitude = 0;
                sources.forEach(source => {
                    const dx = x - source.x;
                    const dy = y - source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Phase based on distance, time, and source phase
                    const phase = (distance / wavelength * 2 * Math.PI) - (timeRef.current * frequency * 2 * Math.PI) + (source.phase * Math.PI / 180);
                    const amplitude = Math.cos(phase) / (distance / 50 + 1); // Amplitude decreases with distance
                    totalAmplitude += amplitude;
                });
                
                // Map Amplitude to Color (Interference Pattern)
                const colorVal = Math.floor(Math.abs(totalAmplitude) * 128) + 127;
                const alpha = Math.min(1.0, Math.abs(totalAmplitude) * 0.8);

                // Dùng màu vàng/xanh lam để trực quan hóa (Ánh sáng chói và vùng tối)
                const r = totalAmplitude > 0 ? colorVal : 127;
                const g = 127;
                const b = totalAmplitude < 0 ? colorVal : 127;

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                ctx.fillRect(x, y, 2, 2);
            }
        }
        
        // 2. Draw Barrier (Vật cản Nhiễu xạ)
        const barrierX = W / 2;
        ctx.fillStyle = '#475569';
        ctx.fillRect(barrierX - 5, 0, 10, H);
        
        if (barrierType === 'double_slit') {
            const slitCenter1 = H / 2 - 50;
            const slitCenter2 = H / 2 + 50;
            
            // Draw slits (Gaps in the barrier)
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(barrierX - 5, slitCenter1 - slitWidth * 2, 10, slitWidth * 4); // Slit 1
            ctx.fillRect(barrierX - 5, slitCenter2 - slitWidth * 2, 10, slitWidth * 4); // Slit 2
        }

        // 3. Draw Sources
        sources.forEach(source => {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(source.x, source.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });

    }, [sourceCount, frequency, phaseDifference, barrierType, slitWidth, sources]);

    // Draw Cross-Section View
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
        
        // Simulate wave amplitude along the center Y axis (X=W*0.75)
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const simulationCanvas = canvasRef.current;
        if (!simulationCanvas) return;
        const simW = simulationCanvas.width;
        const simH = simulationCanvas.height;
        const crossSectionX = simW * 0.75;
        
        // Sample the amplitude map along X=crossSectionX
        for (let y = 0; y < H; y++) {
            const simY = y * simH / H; // Map cross-section Y to simulation Y
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
            else ctx.lineTo(W * 0.5, y_pos); // Draw along the center of the cross-section plot
        }
        ctx.stroke();

    }, [sources, frequency]);


    // Animation Loop
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
            
            {/* CỘT THAM SỐ (LEFT PANEL) */}
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
                    <Waves size={20} className="text-teal-500" /> Cấu Hình Bể Sóng
                </div>
                
                {/* Control: Source Count */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Số lượng Nguồn Sóng ({sourceCount})</label>
                   <input type="range" min="1" max="3" step="1" value={sourceCount} onChange={(e) => setSourceCount(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-teal-500 cursor-pointer" />
                </div>
                
                {/* Control: Frequency */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Tần số (f) ({frequency.toFixed(1)} Hz)</label>
                   <input type="range" min="1" max="10" step="0.5" value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-teal-500 cursor-pointer" />
                   <p className='text-xs text-teal-400 italic'>Bước sóng (lambda): {(100 / frequency).toFixed(1)} px</p>
                </div>
                
                {/* Control: Phase Difference */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Lệch Pha Nguồn 2 ({phaseDifference}°) </label>
                   <input type="range" min="0" max="360" step="10" value={phaseDifference} onChange={(e) => setPhaseDifference(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-indigo-500 cursor-pointer" />
                </div>

                {/* Điều khiển Hình dạng Vật cản (Barrier Shape Control) */}
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

                {/* Phân tích Sóng (Wave Analysis Grid) */}
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

                    {/* Điều khiển Mô phỏng */}
                    <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                            {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Tạm Dừng' : 'Tạo Sóng'}
                        </button>
                        <button onClick={handleReset} className="p-2 bg-slate-700 rounded-xl hover:bg-slate-600 text-white transition-colors" title="Thiết Lập Lại"><RotateCcw size={16}/></button>
                    </div>
                </div>
            </div>

            {/* CỘT MÔ PHỎNG (RIGHT PANEL) */}
            <div className="lg:col-span-9 flex flex-col gap-4">
                
                {/* Simulation Canvas (Interference Pattern) */}
                <div className="flex-1 bg-black rounded-xl border border-slate-700 overflow-hidden relative shadow-2xl">
                    <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
                    <div className="absolute top-4 left-4 text-sm text-slate-400">
                        Mô Phỏng Giao Thoa/Nhiễu Xạ Sóng
                    </div>
                </div>
                
                {/* Mặt cắt Sóng Động (Cross-Section View) */}
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

// --- MAIN EXPORT COMPONENT ---

export const WaveLab: React.FC<WaveLabProps> = ({ mode, lang }) => {
  if (mode === AppMode.SIM_RUN_DOPPLER) {
    return <WavesDopplerEffect lang={lang} />;
  }
  if (mode === AppMode.SIM_RUN_RIPPLE) {
    return <WavesRippleTank lang={lang} />;
  }
  return <div className="p-10 text-center text-slate-500">Mode not found</div>;
};