
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plug, Cpu, Zap, Share2, X, Aperture, Magnet, BarChart2, Loader2, Sparkles, Play, Pause, RotateCcw, RefreshCw } from 'lucide-react';
import { AppMode, Language } from '../types';
import { analyzeExperimentData } from '../services/gemini';

interface ElectronicsLabProps {
  mode: AppMode;
  lang: Language;
}

const ElectronicsRLCBuilder = ({ lang }: { lang: Language }) => {
    const [R, setR] = useState(10); 
    const [L, setL] = useState(0.1); 
    const [C, setC] = useState(0.0001); 
    const [Vpk, setVpk] = useState(10); 
    const [Freq, setFreq] = useState(60); 
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const { omega, XL, XC, Z, phi_deg, Ipk, F_res } = useMemo(() => {
        const omega_val = 2 * Math.PI * Freq; 
        const XL_val = omega_val * L; 
        const XC_val = 1 / (omega_val * C); 
        
        const Z_val = Math.sqrt(R * R + (XL_val - XC_val) ** 2); 
        const phi_rad = Math.atan((XL_val - XC_val) / R); 
        const phi_deg_val = phi_rad * 180 / Math.PI; 
        const Ipk_val = Vpk / Z_val; 
        
        const F_res_val = 1 / (2 * Math.PI * Math.sqrt(L * C)); 

        return { omega: omega_val, XL: XL_val, XC: XC_val, Z: Z_val, phi_deg: phi_deg_val, Ipk: Ipk_val, F_res: F_res_val };
    }, [R, L, C, Vpk, Freq]);
    
    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const summary = `RLC Circuit: R=${R}, L=${L}, C=${C}, Freq=${Freq}, Z=${Z.toFixed(2)}, Phase=${phi_deg.toFixed(2)}, Resonant Freq=${F_res.toFixed(2)}`;
        const result = await analyzeExperimentData("RLC Circuit", { R, L, C, Freq }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    const renderPhasorDiagram = () => {
        const scale = 10;
        const R_vec = R * scale;
        const XL_vec = XL * scale;
        const XC_vec = XC * scale;
        
        const Z_vec = Z * scale;
        const phi_rad = Math.atan((XL - XC) / R);
        
        const Z_x = R_vec;
        const Z_y = (XL - XC) * scale;
        
        const maxLen = Math.max(R_vec, XL_vec, XC_vec, Z_vec) * 1.5;
        const viewBox = `0 0 ${maxLen * 2} ${maxLen * 2}`;
        const offset = maxLen;

        return (
            <svg viewBox={viewBox} className="w-full h-full">
                <g transform={`translate(${offset}, ${offset})`}>
                    <line x1={-offset} y1={0} x2={offset} y2={0} stroke="#374151" strokeDasharray="2 2" />
                    <line x1={0} y1={-offset} x2={0} y2={offset} stroke="#374151" strokeDasharray="2 2" />
                    <text x={offset * 0.9} y={15} fill="#9ca3af" fontSize="10px">R</text>
                    <text x={10} y={-offset * 0.9} fill="#9ca3af" fontSize="10px">Im</text>

                    <line x1={0} y1={0} x2={R_vec} y2={0} stroke="#f59e0b" strokeWidth="3" />
                    <text x={R_vec + 5} y={-5} fill="#f59e0b" fontSize="12px">VR</text>

                    <line x1={R_vec} y1={0} x2={R_vec} y2={-XL_vec} stroke="#3b82f6" strokeWidth="3" />
                    <text x={R_vec + 5} y={-XL_vec - 5} fill="#3b82f6" fontSize="12px">VL</text>

                    <line x1={R_vec} y1={0} x2={R_vec} y2={XC_vec} stroke="#ef4444" strokeWidth="3" />
                    <text x={R_vec + 5} y={XC_vec + 15} fill="#ef4444" fontSize="12px">VC</text>

                    <line x1={0} y1={0} x2={Z_x} y2={-Z_y} stroke="#34d399" strokeWidth="5" markerEnd="url(#arrowhead)" />
                    <text x={Z_x + 5} y={-Z_y + 15} fill="#34d399" fontSize="14px">Z</text>
                    
                    <path d={`M ${15} 0 A 15 15 0 0 0 ${15 * Math.cos(phi_rad)} ${-15 * Math.sin(phi_rad)}`} fill="none" stroke="#60a5fa" strokeWidth="1"/>
                </g>
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#34d399" />
                    </marker>
                </defs>
            </svg>
        );
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
                    <Cpu size={20} className="text-lime-500" /> Cấu Hình Mạch RLC Nối Tiếp
                </div>
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Điện trở (R) ({R.toFixed(1)} $\Omega$)</label>
                   <input type="range" min="1" max="50" step="1" value={R} onChange={(e) => setR(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-lime-500 cursor-pointer" />
                </div>
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Cuộn cảm (L) ({L.toFixed(3)} H)</label>
                   <input type="range" min="0.01" max="0.5" step="0.01" value={L} onChange={(e) => setL(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-blue-500 cursor-pointer" />
                </div>
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Tụ điện (C) ({C.toExponential(1)} F)</label>
                   <input type="range" min="0.00001" max="0.0005" step="0.00001" value={C} onChange={(e) => setC(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-red-500 cursor-pointer" />
                </div>
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1"><Plug size={14}/> Nguồn AC</h3>
                   <label className="text-xs text-slate-400 block mb-1">Điện áp Đỉnh (Vpk) ({Vpk} V)</label>
                   <input type="range" min="1" max="20" step="1" value={Vpk} onChange={(e) => setVpk(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-yellow-500 cursor-pointer" />
                   <label className="text-xs text-slate-400 block mb-1">Tần số (f) ({Freq} Hz)</label>
                   <input type="range" min="10" max="100" step="5" value={Freq} onChange={(e) => setFreq(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-yellow-500 cursor-pointer" />
                </div>
                <div className="pt-4 border-t border-slate-700 mt-auto">
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
                        <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-300 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50">
                        {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} Phân Tích AI
                        </button>
                    )}
                </div>
            </div>
            <div className="lg:col-span-9 flex flex-col gap-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex-shrink-0">
                    <div className="text-lg font-bold text-white mb-2">Sơ đồ Mạch RLC Nối Tiếp</div>
                    <svg height="120" width="100%" viewBox="0 0 400 120" className='w-full'>
                        <rect x="0" y="0" width="400" height="120" fill="#0f172a" rx="10"/>
                        <line x1="10" y1="20" x2="390" y2="20" stroke="#94a3b8" strokeWidth="2"/>
                        <line x1="10" y1="100" x2="390" y2="100" stroke="#94a3b8" strokeWidth="2"/>
                        <line x1="10" y1="20" x2="10" y2="100" stroke="#94a3b8" strokeWidth="2"/>
                        <line x1="390" y1="20" x2="390" y2="100" stroke="#94a3b8" strokeWidth="2"/>
                        <circle cx="20" cy="60" r="10" fill="none" stroke="#fef08a" strokeWidth="3"/>
                        <path d="M 15 65 Q 20 55 25 65 Q 30 55 35 65" stroke="#fef08a" fill="none" strokeWidth="2"/>
                        <text x="5" y="15" fill="#fef08a" fontSize="10">Vpk={Vpk}V, f={Freq}Hz</text>
                        <rect x="100" y="55" width="40" height="10" fill="#f59e0b" stroke="#0f172a" strokeWidth="1"/>
                        <text x="105" y="50" fill="#f59e0b" fontSize="12">R={R}Ohm</text>
                        <path d="M 180 60 C 185 50, 195 50, 200 60 S 215 70, 220 60 S 235 50, 240 60" fill="none" stroke="#3b82f6" strokeWidth="2"/>
                        <text x="195" y="50" fill="#3b82f6" fontSize="12">L={L}H</text>
                        <line x1="300" y1="50" x2="300" y2="70" stroke="#ef4444" strokeWidth="4"/>
                        <line x1="310" y1="50" x2="310" y2="70" stroke="#ef4444" strokeWidth="4"/>
                        <text x="295" y="50" fill="#ef4444" fontSize="12">C={C}F</text>
                    </svg>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 flex-1'>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                        <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 mb-2"><Zap size={16} className="text-yellow-400"/> Phân Tích Tổng Trở & Cộng Hưởng</div>
                        <div className='text-sm space-y-1 font-mono'>
                            <p>Cảm kháng (XL): <span className='text-blue-400'>{XL.toFixed(2)} $\Omega$</span></p>
                            <p>Dung kháng (XC): <span className='text-red-400'>{XC.toFixed(2)} $\Omega$</span></p>
                            <p>Tổng trở (Z): <span className='text-green-400 font-bold'>{Z.toFixed(2)} $\Omega$</span></p>
                            <p>Dòng điện Đỉnh (Ipk): <span className='text-yellow-400'>{Ipk.toFixed(3)} A</span></p>
                            <p>Góc Pha (phi): <span className='text-sky-400'>{phi_deg.toFixed(2)}°</span></p>
                            <p className='mt-2 text-xs text-slate-400'>Tần số Cộng hưởng (f_res): <span className='text-lime-400'>{F_res.toFixed(2)} Hz</span></p>
                        </div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                        <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 mb-2"><Share2 size={16} className="text-green-400"/> Biểu Đồ Vector Pha</div>
                        <div className='h-48 w-full'>
                            {renderPhasorDiagram()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const VIRTUAL_OSCILLOSCOPE = ({ lang }: { lang: Language }) => {
    const [timebase, setTimebase] = useState(10); 
    const [voltDivA, setVoltDivA] = useState(5); 
    const [voltDivB, setVoltDivB] = useState(5); 
    const [phaseShiftB, setPhaseShiftB] = useState(0); 
    const [mode, setMode] = useState('YT'); 
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);
    const timeRef = useRef(0);

    const getSignalA = useCallback((t: number) => 10 * Math.sin(t * 2 * Math.PI * (1000 / 60)) * (1 / 60), []); 
    const getSignalB = useCallback((t: number) => 8 * Math.sin(t * 2 * Math.PI * (1000 / 60) + (phaseShiftB * Math.PI / 180)), [phaseShiftB]); 

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const summary = `Oscilloscope: Timebase=${timebase}ms, Mode=${mode}, Phase Shift=${phaseShiftB}, VoltDivA=${voltDivA}, VoltDivB=${voltDivB}`;
        const result = await analyzeExperimentData("Virtual Oscilloscope", { timebase, mode, phaseShiftB }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    const drawSimulation = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const centerX = W / 2;
        const centerY = H / 2;
        const Vpk = 10;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.2)'; 
        ctx.fillRect(0, 0, W, H);
        
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 0.5;
        const xDivs = 10;
        const yDivs = 8;
        for (let i = 0; i <= xDivs; i++) { 
            ctx.beginPath();
            ctx.moveTo(i * W / xDivs, 0);
            ctx.lineTo(i * W / xDivs, H);
            ctx.stroke();
        }
        for (let i = 0; i <= yDivs; i++) { 
            ctx.beginPath();
            ctx.moveTo(0, i * H / yDivs);
            ctx.lineTo(W, i * H / yDivs);
            ctx.stroke();
        }
        
        const pixelsPerMs = W / (timebase * xDivs);
        const pixelsPerVoltA = H / (voltDivA * yDivs);
        const pixelsPerVoltB = H / (voltDivB * yDivs);

        if (mode === 'YT') {
            const startTime = timeRef.current - (timebase * xDivs / 1000); 
            ctx.strokeStyle = '#f59e0b'; 
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x < W; x++) {
                const t = startTime + x / pixelsPerMs / 1000; 
                const voltage = getSignalA(t);
                const y = centerY - voltage * pixelsPerVoltA / (yDivs / 2); 
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x < W; x++) {
                const t = startTime + x / pixelsPerMs / 1000;
                const voltage = getSignalB(t);
                const y = centerY - voltage * pixelsPerVoltB / (yDivs / 2);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#a855f7'; 
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            const totalTime = timebase * xDivs / 1000;
            const steps = 500;
            
            for (let i = 0; i <= steps; i++) {
                const t = (i / steps) * totalTime; 
                const voltA = getSignalA(t);
                const voltB = getSignalB(t);
                
                const x = centerX + voltA * centerX / (Vpk * 1.5); 
                const y = centerY - voltB * centerY / (8 * 1.5);
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }, [timebase, voltDivA, voltDivB, phaseShiftB, mode, getSignalA, getSignalB]);

    useEffect(() => {
        const animate = () => {
            if (mode === 'YT') {
                timeRef.current += 0.001; 
            }
            drawSimulation();
            reqRef.current = requestAnimationFrame(animate);
        };
        reqRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(reqRef.current);
    }, [drawSimulation, mode]);
    
    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
                    <Aperture size={20} className="text-pink-500" /> Điều Khiển Máy Hiện Sóng
                </div>
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                    <label className="text-xs text-slate-400 block mb-2">Chế độ Hiển thị</label>
                    <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full p-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:ring-pink-500 focus:border-pink-500 text-sm">
                        <option value="YT">Y-T (Time Domain)</option>
                        <option value="XY">X-Y (Lissajous)</option>
                    </select>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Timebase (X-axis) ({timebase} ms/Div)</label>
                   <input type="range" min="1" max="50" step="1" value={timebase} onChange={(e) => setTimebase(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-yellow-500 cursor-pointer" />
                </div>
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner border-l-4 border-yellow-500">
                   <label className="text-xs text-slate-400 block mb-1">Kênh A: Volt/Div ({voltDivA} V/Div)</label>
                   <input type="range" min="1" max="10" step="1" value={voltDivA} onChange={(e) => setVoltDivA(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-yellow-500 cursor-pointer" />
                </div>
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner border-l-4 border-cyan-500">
                   <label className="text-xs text-slate-400 block mb-1">Kênh B: Volt/Div ({voltDivB} V/Div)</label>
                   <input type="range" min="1" max="10" step="1" value={voltDivB} onChange={(e) => setVoltDivB(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-cyan-500 cursor-pointer" />
                   <label className="text-xs text-slate-400 block mt-2 mb-1">Độ lệch Pha B ({phaseShiftB}°)</label>
                   <input type="range" min="0" max="360" step="5" value={phaseShiftB} onChange={(e) => setPhaseShiftB(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-cyan-500 cursor-pointer" />
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
                        <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-300 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50">
                        {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} Phân Tích AI
                        </button>
                    )}
                </div>
            </div>
            <div className="lg:col-span-9 flex flex-col gap-4">
                <div className="flex-1 bg-black rounded-xl border border-slate-700 overflow-hidden relative shadow-2xl">
                    <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
                    <div className="absolute top-4 left-4 text-sm text-slate-400">
                        {mode === 'YT' ? 'CHẾ ĐỘ Y-T: TÍN HIỆU THEO THỜI GIAN' : 'CHẾ ĐỘ X-Y: HÌNH LISSAJOUS'}
                    </div>
                    <div className='absolute top-2 right-2 text-xs text-yellow-400'>A: {voltDivA}V/Div</div>
                    <div className='absolute top-6 right-2 text-xs text-cyan-400'>B: {voltDivB}V/Div</div>
                    <div className='absolute bottom-2 left-2 text-xs text-slate-400'>{timebase}ms/Div</div>
                </div>
            </div>
        </div>
    );
};

const ElectromagnetismFaraday = ({ lang }: { lang: Language }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [magnetSpeed, setMagnetSpeed] = useState(0); 
    const [magnetStrength, setMagnetStrength] = useState(1); 
    const [coilTurns, setCoilTurns] = useState(10); 
    const [polarity, setPolarity] = useState<'NS'|'SN'>('NS');
    const [showField, setShowField] = useState(false);
    
    const [time, setTime] = useState(0);
    const [inducedVoltage, setInducedVoltage] = useState(0); 
    const [flux, setFlux] = useState(0); 
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const plotRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);
    
    const magnetInitialX = 650;
    const coilX = 200;
    const magnetWidth = 60;
    const magnetHeight = 30;

    const calculateFaraday = useCallback((t: number, speed: number, strength: number, N: number) => {
        const magnetPos = magnetInitialX - speed * t * 10;
        const dx = magnetPos - coilX;
        
        const polFact = polarity === 'NS' ? 1 : -1;
        const flux_val = polFact * strength * N * 1000 / (dx * dx + 2000);
        
        const nextMagnetPos = magnetPos - speed * 0.05 * 10;
        const nextDx = nextMagnetPos - coilX;
        const nextFlux = polFact * strength * N * 1000 / (nextDx * nextDx + 2000);
        const voltage = -(nextFlux - flux_val) / 0.05 * 5; 

        setFlux(flux_val);
        setInducedVoltage(voltage);

        return { magnetPos, voltage, flux_val };
    }, [polarity]);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const summary = `Faraday's Law: Magnet Speed=${magnetSpeed}, Strength=${magnetStrength}, Coil Turns=${coilTurns}, Max Voltage Observed=${Math.abs(inducedVoltage).toFixed(2)}`;
        const result = await analyzeExperimentData("Faraday's Law", { magnetSpeed, magnetStrength, coilTurns }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    const drawSimulation = useCallback((magnetPos: number, voltage: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const centerY = H / 2;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);
        
        if (showField) {
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            for(let y=0; y<H; y+=40) {
                for(let x=0; x<W; x+=40) {
                    const dx = x - magnetPos;
                    const dy = y - centerY;
                    const angle = Math.atan2(dy, dx);
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + Math.cos(angle)*10, y + Math.sin(angle)*10);
                    ctx.stroke();
                }
            }
        }
        
        const coilHeight = 150;
        const coilWidth = 60;
        const loops = coilTurns;
        
        ctx.shadowBlur = Math.abs(voltage) * 2;
        ctx.shadowColor = voltage > 0 ? '#34d399' : '#f87171'; 
        
        ctx.strokeStyle = '#f59e0b'; 
        ctx.lineWidth = 4;
        
        for(let i=0; i<loops; i++) {
            const xOffset = (i / loops) * coilWidth;
            ctx.beginPath();
            ctx.ellipse(coilX - coilWidth/2 + xOffset, centerY, 10, coilHeight/2, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        
        const leftColor = polarity === 'NS' ? '#ef4444' : '#3b82f6';
        const rightColor = polarity === 'NS' ? '#3b82f6' : '#ef4444';
        
        ctx.fillStyle = leftColor;
        ctx.fillRect(magnetPos - magnetWidth/2, centerY - magnetHeight/2, magnetWidth/2, magnetHeight);
        ctx.fillStyle = rightColor;
        ctx.fillRect(magnetPos, centerY - magnetHeight/2, magnetWidth/2, magnetHeight);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(polarity === 'NS' ? 'N' : 'S', magnetPos - magnetWidth/4 - 4, centerY + 4);
        ctx.fillText(polarity === 'NS' ? 'S' : 'N', magnetPos + magnetWidth/4 - 4, centerY + 4);
        
        const compassX = coilX;
        const compassY = centerY - 100;
        
        const dx = magnetPos - compassX;
        const dy = centerY - compassY;
        const angle = Math.atan2(dy, dx);
        const needleAngle = polarity === 'NS' ? angle : angle + Math.PI;

        ctx.save();
        ctx.translate(compassX, compassY);
        ctx.rotate(needleAngle);
        
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0,0, 20, 0, Math.PI*2); ctx.stroke();
        
        ctx.fillStyle = '#ef4444'; 
        ctx.beginPath(); ctx.moveTo(0,-5); ctx.lineTo(15,0); ctx.lineTo(0,5); ctx.fill();
        ctx.fillStyle = '#3b82f6'; 
        ctx.beginPath(); ctx.moveTo(0,-5); ctx.lineTo(-15,0); ctx.lineTo(0,5); ctx.fill();
        
        ctx.restore();
        ctx.fillStyle = '#94a3b8';
        ctx.fillText("Compass", compassX - 25, compassY - 25);

    }, [magnetStrength, coilTurns, coilX, polarity, showField]);

    const drawPlot = useCallback(() => {
        const canvas = plotRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const centerY = H / 2;

        const imageData = ctx.getImageData(1, 0, W - 1, H);
        ctx.putImageData(imageData, 0, 0);
        ctx.fillStyle = '#1e293b'; 
        ctx.fillRect(W - 1, 0, 1, H);

        ctx.strokeStyle = '#334155'; 
        ctx.beginPath();
        ctx.moveTo(0, centerY); ctx.lineTo(W, centerY); 
        ctx.stroke();

        const scale = 5;
        const y = centerY - (inducedVoltage * scale); 

        ctx.fillStyle = inducedVoltage > 0 ? '#34d399' : '#f87171'; 
        ctx.fillRect(W - 2, Math.min(y, centerY), 2, Math.abs(centerY - y));
    }, [inducedVoltage]);
    
    useEffect(() => {
        if (!isRunning) return;
        const animate = () => {
            setTime(t => t + 0.05);
            const { magnetPos, voltage } = calculateFaraday(time, magnetSpeed, magnetStrength, coilTurns);
            drawSimulation(magnetPos, voltage);
            drawPlot();
            if (magnetPos <= coilX - 50) setIsRunning(false); 
            reqRef.current = requestAnimationFrame(animate);
        };
        reqRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(reqRef.current);
    }, [isRunning, time, magnetSpeed, magnetStrength, coilTurns, polarity]);
    
    useEffect(() => {
        drawSimulation(magnetInitialX, 0);
        drawPlot();
    }, [polarity, showField]); 

    const handleReset = () => {
        setIsRunning(false);
        setTime(0);
        setInducedVoltage(0);
        setFlux(0);
        if (plotRef.current) {
            const ctx = plotRef.current.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, plotRef.current.width, plotRef.current.height);
        }
        drawSimulation(magnetInitialX, 0);
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
                    <Magnet size={20} className="text-blue-500" /> Cấu Hình Điện Từ
                </div>
                
                <div className="p-3 bg-slate-900 rounded-xl space-y-3">
                   <label className="text-xs text-slate-400 block">Vận tốc Nam châm ({magnetSpeed} cm/s)</label>
                   <input type="range" min="0" max="100" step="5" value={magnetSpeed} onChange={(e) => setMagnetSpeed(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-red-500" />
                   
                   <label className="text-xs text-slate-400 block">Cường độ Từ trường ({magnetStrength})</label>
                   <input type="range" min="0.1" max="2" step="0.1" value={magnetStrength} onChange={(e) => setMagnetStrength(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-blue-500" />
                   
                   <label className="text-xs text-slate-400 block">Số vòng dây ({coilTurns})</label>
                   <input type="range" min="1" max="20" step="1" value={coilTurns} onChange={(e) => setCoilTurns(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-yellow-500" />
                </div>
                
                <div className="p-3 bg-slate-900 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Cực Nam Châm</span>
                        <button onClick={() => setPolarity(p => p === 'NS' ? 'SN' : 'NS')} className="text-xs px-2 py-1 bg-slate-700 rounded hover:bg-slate-600 flex gap-1 items-center">
                            <RefreshCw size={10}/> {polarity === 'NS' ? 'N-S' : 'S-N'}
                        </button>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Hiện Trường Từ</span>
                        <button onClick={() => setShowField(!showField)} className={`text-xs px-2 py-1 rounded transition-colors ${showField ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                            {showField ? 'BẬT' : 'TẮT'}
                        </button>
                    </div>
                </div>

                <div className="p-3 bg-slate-700 rounded-xl shadow-lg border-l-4 border-lime-500 mt-auto">
                    <p className="text-sm font-bold text-white mb-1"><Aperture size={14} className='inline mr-1'/> Data Live</p>
                    <div className='text-xs space-y-1 font-mono'>
                        <div className="flex justify-between"><span>Flux:</span> <span>{flux.toFixed(1)}</span></div>
                        <div className="flex justify-between"><span>EMF:</span> <span className={inducedVoltage > 0 ? 'text-green-400' : 'text-red-400'}>{inducedVoltage.toFixed(2)} V</span></div>
                    </div>
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
                        <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2">
                            {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Dừng' : 'Chạy'}
                        </button>
                        <button onClick={handleReset} className="p-2 bg-slate-700 rounded-xl hover:bg-slate-600 text-white"><RotateCcw size={16}/></button>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-9 flex flex-col gap-4">
                <div className="flex-1 bg-black rounded-xl border border-slate-700 overflow-hidden relative shadow-2xl">
                    <canvas ref={canvasRef} width={800} height={350} className="w-full h-full object-contain" />
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                    <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 mb-2"><BarChart2 size={16} className="text-yellow-400"/> EMF (Điện Áp Cảm Ứng) theo Thời Gian</div>
                    <div className='h-20 w-full'>
                       <canvas ref={plotRef} width={700} height={80} className="w-full h-full bg-slate-800"></canvas>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ElectronicsLab: React.FC<ElectronicsLabProps> = ({ mode, lang }) => {
  if (mode === AppMode.SIM_RUN_CIRCUIT) {
    return <ElectronicsRLCBuilder lang={lang} />;
  }
  if (mode === AppMode.SIM_RUN_OSCILLOSCOPE) {
    return <VIRTUAL_OSCILLOSCOPE lang={lang} />;
  }
  if (mode === AppMode.SIM_RUN_INDUCTION) {
    return <ElectromagnetismFaraday lang={lang} />;
  }
  return <div className="p-10 text-center text-slate-500">Mode not found</div>;
};
