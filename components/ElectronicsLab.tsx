
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Settings, Plug, Cpu, Zap, Share2, X, Plus, Aperture, Magnet, BarChart2, Loader2, Sparkles, Play, Pause, RotateCcw } from 'lucide-react';
import { AppMode, Language } from '../types';
import { analyzeExperimentData } from '../services/gemini';

interface ElectronicsLabProps {
  mode: AppMode;
  lang: Language;
}

// --- SUB-COMPONENTS FROM USER CODE ---

const ElectronicsRLCBuilder = ({ lang }: { lang: Language }) => {
    // State controls
    const [R, setR] = useState(10); // Resistance (Ohm)
    const [L, setL] = useState(0.1); // Inductance (Henry)
    const [C, setC] = useState(0.0001); // Capacitance (Farad)
    const [Vpk, setVpk] = useState(10); // Peak Voltage (V)
    const [Freq, setFreq] = useState(60); // Frequency (Hz)
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Derived Physics Calculations
    const { omega, XL, XC, Z, phi_deg, Ipk, F_res } = useMemo(() => {
        const omega_val = 2 * Math.PI * Freq; // Tần số góc
        const XL_val = omega_val * L; // Cảm kháng
        const XC_val = 1 / (omega_val * C); // Dung kháng
        
        const Z_val = Math.sqrt(R * R + (XL_val - XC_val) ** 2); // Tổng trở
        const phi_rad = Math.atan((XL_val - XC_val) / R); // Góc pha (rad)
        const phi_deg_val = phi_rad * 180 / Math.PI; // Góc pha (độ)
        const Ipk_val = Vpk / Z_val; // Dòng điện đỉnh
        
        const F_res_val = 1 / (2 * Math.PI * Math.sqrt(L * C)); // Tần số cộng hưởng

        return { omega: omega_val, XL: XL_val, XC: XC_val, Z: Z_val, phi_deg: phi_deg_val, Ipk: Ipk_val, F_res: F_res_val };
    }, [R, L, C, Vpk, Freq]);
    
    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const summary = `RLC Circuit: R=${R}, L=${L}, C=${C}, Freq=${Freq}, Z=${Z.toFixed(2)}, Phase=${phi_deg.toFixed(2)}, Resonant Freq=${F_res.toFixed(2)}`;
        const result = await analyzeExperimentData("RLC Circuit", { R, L, C, Freq }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    // SVG for Phasor Diagram (Biểu đồ Vector Pha)
    const renderPhasorDiagram = () => {
        const scale = 10;
        const R_vec = R * scale;
        const XL_vec = XL * scale;
        const XC_vec = XC * scale;
        
        const Z_vec = Z * scale;
        const phi_rad = Math.atan((XL - XC) / R);
        
        const Z_x = R_vec;
        const Z_y = (XL - XC) * scale;
        
        // Find maximum vector length for scaling the SVG viewbox
        const maxLen = Math.max(R_vec, XL_vec, XC_vec, Z_vec) * 1.5;
        const viewBox = `0 0 ${maxLen * 2} ${maxLen * 2}`;
        const offset = maxLen;

        return (
            <svg viewBox={viewBox} className="w-full h-full">
                <g transform={`translate(${offset}, ${offset})`}>
                    {/* Axes (Trục) */}
                    <line x1={-offset} y1={0} x2={offset} y2={0} stroke="#374151" strokeDasharray="2 2" />
                    <line x1={0} y1={-offset} x2={0} y2={offset} stroke="#374151" strokeDasharray="2 2" />
                    <text x={offset * 0.9} y={15} fill="#9ca3af" fontSize="10px">Trục Thực (R)</text>
                    <text x={10} y={-offset * 0.9} fill="#9ca3af" fontSize="10px">Trục Ảo (L/C)</text>

                    {/* R Vector (Trở kháng) */}
                    <line x1={0} y1={0} x2={R_vec} y2={0} stroke="#f59e0b" strokeWidth="3" />
                    <text x={R_vec + 5} y={-5} fill="#f59e0b" fontSize="12px">VR</text>

                    {/* L Vector (Cảm kháng) - Lên */}
                    <line x1={R_vec} y1={0} x2={R_vec} y2={-XL_vec} stroke="#3b82f6" strokeWidth="3" />
                    <text x={R_vec + 5} y={-XL_vec - 5} fill="#3b82f6" fontSize="12px">VL</text>

                    {/* C Vector (Dung kháng) - Xuống */}
                    <line x1={R_vec} y1={0} x2={R_vec} y2={XC_vec} stroke="#ef4444" strokeWidth="3" />
                    <text x={R_vec + 5} y={XC_vec + 15} fill="#ef4444" fontSize="12px">VC</text>

                    {/* Net Impedance Vector (Tổng trở Z) */}
                    <line x1={0} y1={0} x2={Z_x} y2={-Z_y} stroke="#34d399" strokeWidth="5" markerEnd="url(#arrowhead)" />
                    <text x={Z_x + 5} y={-Z_y + 15} fill="#34d399" fontSize="14px">Z</text>
                    
                    {/* Angle Arc (Góc pha) */}
                    <path d={`M ${15} 0 A 15 15 0 0 0 ${15 * Math.cos(phi_rad)} ${-15 * Math.sin(phi_rad)}`} fill="none" stroke="#60a5fa" strokeWidth="1"/>
                    <text x={20} y={-5} fill="#60a5fa" fontSize="10px">phi</text>
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
            
            {/* CỘT THAM SỐ (LEFT PANEL) */}
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
                    <Cpu size={20} className="text-lime-500" /> Cấu Hình Mạch RLC Nối Tiếp
                </div>
                
                {/* Control: Resistor (R) */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Điện trở (R) ({R.toFixed(1)} $\Omega$)</label>
                   <input type="range" min="1" max="50" step="1" value={R} onChange={(e) => setR(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-lime-500 cursor-pointer" />
                </div>
                
                {/* Control: Inductor (L) */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Cuộn cảm (L) ({L.toFixed(3)} H)</label>
                   <input type="range" min="0.01" max="0.5" step="0.01" value={L} onChange={(e) => setL(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-blue-500 cursor-pointer" />
                </div>

                {/* Control: Capacitor (C) */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Tụ điện (C) ({C.toExponential(1)} F)</label>
                   <input type="range" min="0.00001" max="0.0005" step="0.00001" value={C} onChange={(e) => setC(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-red-500 cursor-pointer" />
                </div>
                
                {/* Control: AC Source */}
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
                        <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="w-full py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-300 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                        {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                        Phân Tích AI
                        </button>
                    )}
                </div>
            </div>

            {/* CỘT MÔ PHỎNG & VISUALS (RIGHT PANEL) */}
            <div className="lg:col-span-9 flex flex-col gap-4">
                
                {/* Visuals: RLC Circuit Diagram (Conceptual SVG) */}
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex-shrink-0">
                    <div className="text-lg font-bold text-white mb-2">Sơ đồ Mạch RLC Nối Tiếp</div>
                    <svg height="120" width="100%" viewBox="0 0 400 120" className='w-full'>
                        <rect x="0" y="0" width="400" height="120" fill="#0f172a" rx="10"/>
                        {/* Dây dẫn */}
                        <line x1="10" y1="20" x2="390" y2="20" stroke="#94a3b8" strokeWidth="2"/>
                        <line x1="10" y1="100" x2="390" y2="100" stroke="#94a3b8" strokeWidth="2"/>
                        {/* Sửa lỗi: Đảm bảo không có thuộc tính trùng lặp */}
                        <line x1="10" y1="20" x2="10" y2="100" stroke="#94a3b8" strokeWidth="2"/>
                        <line x1="390" y1="20" x2="390" y2="100" stroke="#94a3b8" strokeWidth="2"/>
                        
                        {/* Nguồn AC */}
                        <circle cx="20" cy="60" r="10" fill="none" stroke="#fef08a" strokeWidth="3"/>
                        <path d="M 15 65 Q 20 55 25 65 Q 30 55 35 65" stroke="#fef08a" fill="none" strokeWidth="2"/>
                        <text x="5" y="15" fill="#fef08a" fontSize="10">Vpk={Vpk}V, f={Freq}Hz</text>

                        {/* R */}
                        <rect x="100" y="55" width="40" height="10" fill="#f59e0b" stroke="#0f172a" strokeWidth="1"/>
                        <text x="105" y="50" fill="#f59e0b" fontSize="12">R={R}Ohm</text>

                        {/* L */}
                        <path d="M 180 60 C 185 50, 195 50, 200 60 S 215 70, 220 60 S 235 50, 240 60" fill="none" stroke="#3b82f6" strokeWidth="2"/>
                        <text x="195" y="50" fill="#3b82f6" fontSize="12">L={L}H</text>

                        {/* C */}
                        <line x1="300" y1="50" x2="300" y2="70" stroke="#ef4444" strokeWidth="4"/>
                        <line x1="310" y1="50" x2="310" y2="70" stroke="#ef4444" strokeWidth="4"/>
                        <text x="295" y="50" fill="#ef4444" fontSize="12">C={C}F</text>
                    </svg>
                </div>
                
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 flex-1'>
                    {/* Bảng phân tích Tổng trở */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                        <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 mb-2"><Zap size={16} className="text-yellow-400"/> Phân Tích Tổng Trở & Cộng Hưởng</div>
                        <div className='text-sm space-y-1 font-mono'>
                            <p>Cảm kháng (XL): <span className='text-blue-400'>{XL.toFixed(2)} $\Omega$</span></p>
                            <p>Dung kháng (XC): <span className='text-red-400'>{XC.toFixed(2)} $\Omega$</span></p>
                            <p>Tổng trở (Z): <span className='text-green-400 font-bold'>{Z.toFixed(2)} $\Omega$</span></p>
                            <p>Dòng điện Đỉnh (Ipk): <span className='text-yellow-400'>{Ipk.toFixed(3)} A</span></p>
                            <p>Góc Pha (phi): <span className='text-sky-400'>{phi_deg.toFixed(2)}°</span> ({phi_deg > 0 ? 'Cảm ứng' : phi_deg < 0 ? 'Dung kháng' : 'Cộng hưởng'})</p>
                            <p className='mt-2 text-xs text-slate-400'>Tần số Cộng hưởng (f_res): <span className='text-lime-400'>{F_res.toFixed(2)} Hz</span></p>
                        </div>
                        <p className={`mt-2 text-sm font-bold text-center ${Math.abs(XL - XC) < 1 ? 'text-lime-400' : 'text-slate-500'}`}>
                            {Math.abs(XL - XC) < 1 ? 'MẠCH ĐANG CỘNG HƯỞNG!' : 'Chưa Cộng Hưởng'}
                        </p>
                    </div>

                    {/* Biểu đồ Vector Pha (Phasor Diagram) */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                        <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 mb-2"><Share2 size={16} className="text-green-400"/> Biểu Đồ Vector Pha (Tổng Trở)</div>
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
    // State controls
    const [timebase, setTimebase] = useState(10); // Time/Div (ms)
    const [voltDivA, setVoltDivA] = useState(5); // Volt/Div Channel A (V)
    const [voltDivB, setVoltDivB] = useState(5); // Volt/Div Channel B (V)
    const [phaseShiftB, setPhaseShiftB] = useState(0); // Phase shift B relative to A
    const [mode, setMode] = useState('YT'); // YT or XY (Lissajous)
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);
    const timeRef = useRef(0);

    // Mock Signal Generation (Simulating a sine wave and a phase-shifted sine wave)
    const getSignalA = useCallback((t: number) => 10 * Math.sin(t * 2 * Math.PI * (1000 / 60)) * (1 / 60), []); // 60Hz signal, 10V peak
    const getSignalB = useCallback((t: number) => 8 * Math.sin(t * 2 * Math.PI * (1000 / 60) + (phaseShiftB * Math.PI / 180)), [phaseShiftB]); // 8V peak, phase shifted

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const summary = `Oscilloscope: Timebase=${timebase}ms, Mode=${mode}, Phase Shift=${phaseShiftB}, VoltDivA=${voltDivA}, VoltDivB=${voltDivB}`;
        const result = await analyzeExperimentData("Virtual Oscilloscope", { timebase, mode, phaseShiftB }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    // Draw Function
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

        // Clear with slight trailing effect
        ctx.fillStyle = 'rgba(15, 23, 42, 0.2)'; 
        ctx.fillRect(0, 0, W, H);
        
        // Draw Grid (Divisions)
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 0.5;
        const xDivs = 10;
        const yDivs = 8;
        for (let i = 0; i <= xDivs; i++) { // Vertical lines
            ctx.beginPath();
            ctx.moveTo(i * W / xDivs, 0);
            ctx.lineTo(i * W / xDivs, H);
            ctx.stroke();
        }
        for (let i = 0; i <= yDivs; i++) { // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(0, i * H / yDivs);
            ctx.lineTo(W, i * H / yDivs);
            ctx.stroke();
        }
        
        const pixelsPerMs = W / (timebase * xDivs);
        const pixelsPerVoltA = H / (voltDivA * yDivs);
        const pixelsPerVoltB = H / (voltDivB * yDivs);

        if (mode === 'YT') {
            // Y-T Mode (Time Domain)
            const startTime = timeRef.current - (timebase * xDivs / 1000); 

            // Channel A (Yellow)
            ctx.strokeStyle = '#f59e0b'; 
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x < W; x++) {
                const t = startTime + x / pixelsPerMs / 1000; // Convert pixel to time (seconds)
                const voltage = getSignalA(t);
                const y = centerY - voltage * pixelsPerVoltA / (yDivs / 2); // Center-based Y calculation
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Channel B (Cyan)
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
            // X-Y Mode (Lissajous)
            ctx.strokeStyle = '#a855f7'; // Purple
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            const totalTime = timebase * xDivs / 1000;
            const steps = 500;
            
            for (let i = 0; i <= steps; i++) {
                const t = (i / steps) * totalTime; 
                const voltA = getSignalA(t);
                const voltB = getSignalB(t);
                
                // Map voltage to X/Y coordinates
                const x = centerX + voltA * centerX / (Vpk * 1.5); // Normalize to peak
                const y = centerY - voltB * centerY / (8 * 1.5);
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }


    }, [timebase, voltDivA, voltDivB, phaseShiftB, mode, getSignalA, getSignalB]);

    // Animation Loop
    useEffect(() => {
        const animate = () => {
            if (mode === 'YT') {
                timeRef.current += 0.001; // Advance time for running wave
            }
            drawSimulation();
            reqRef.current = requestAnimationFrame(animate);
        };

        reqRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(reqRef.current);
    }, [drawSimulation, mode]);
    
    // Measurement Analysis (Mock)
    const VppA = useMemo(() => 2 * 10, []);
    const FreqA = useMemo(() => 60, []);
    const PhaseA = useMemo(() => 0, []);
    const PhaseB = useMemo(() => phaseShiftB, [phaseShiftB]);

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
            
            {/* CỘT THAM SỐ (LEFT PANEL) */}
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
                    <Aperture size={20} className="text-pink-500" /> Điều Khiển Máy Hiện Sóng
                </div>
                
                {/* Mode Selector */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                    <label className="text-xs text-slate-400 block mb-2">Chế độ Hiển thị</label>
                    <select 
                        value={mode} 
                        onChange={(e) => setMode(e.target.value)} 
                        className="w-full p-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:ring-pink-500 focus:border-pink-500 text-sm"
                    >
                        <option value="YT">Y-T (Time Domain)</option>
                        <option value="XY">X-Y (Lissajous)</option>
                    </select>
                </div>

                {/* Control: Timebase */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Timebase (X-axis) ({timebase} ms/Div)</label>
                   <input type="range" min="1" max="50" step="1" value={timebase} onChange={(e) => setTimebase(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-yellow-500 cursor-pointer" />
                </div>
                
                {/* Control: Volt/Div A */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner border-l-4 border-yellow-500">
                   <label className="text-xs text-slate-400 block mb-1">Kênh A: Volt/Div ({voltDivA} V/Div)</label>
                   <input type="range" min="1" max="10" step="1" value={voltDivA} onChange={(e) => setVoltDivA(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-yellow-500 cursor-pointer" />
                </div>

                {/* Control: Volt/Div B & Phase Shift */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner border-l-4 border-cyan-500">
                   <label className="text-xs text-slate-400 block mb-1">Kênh B: Volt/Div ({voltDivB} V/Div)</label>
                   <input type="range" min="1" max="10" step="1" value={voltDivB} onChange={(e) => setVoltDivB(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-cyan-500 cursor-pointer" />
                   <label className="text-xs text-slate-400 block mt-2 mb-1">Độ lệch Pha B ({phaseShiftB}°)</label>
                   <input type="range" min="0" max="360" step="5" value={phaseShiftB} onChange={(e) => setPhaseShiftB(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-cyan-500 cursor-pointer" />
                </div>

                {/* Phân tích Đo lường Tự động */}
                <div className="p-3 bg-slate-700 rounded-xl shadow-lg border-l-4 border-white mt-auto">
                    <p className="text-sm font-bold text-white mb-1"><Zap size={14} className='inline mr-1'/> Đo Lường Tự Động (Auto-Measure)</p>
                    <div className='text-xs space-y-1 font-mono'>
                        <p className='text-yellow-400'>Kênh A: Vpp={VppA}V, Freq={FreqA}Hz</p>
                        <p className='text-cyan-400'>Kênh B: Vpp={2 * 8}V, Freq={FreqA}Hz</p>
                        <p className='text-purple-400'>Lệch Pha: $\Delta\phi = {PhaseB}°$</p>
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
                </div>
            </div>

            {/* CỘT MÔ PHỎNG (RIGHT PANEL) */}
            <div className="lg:col-span-9 flex flex-col gap-4">
                
                {/* Simulation Canvas */}
                <div className="flex-1 bg-black rounded-xl border border-slate-700 overflow-hidden relative shadow-2xl">
                    <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
                    <div className="absolute top-4 left-4 text-sm text-slate-400">
                        {mode === 'YT' ? 'CHẾ ĐỘ Y-T: TÍN HIỆU THEO THỜI GIAN' : 'CHẾ ĐỘ X-Y: HÌNH LISSAJOUS'}
                    </div>
                    {/* Y-Div Scale */}
                    <div className='absolute top-2 right-2 text-xs text-yellow-400'>A: {voltDivA}V/Div</div>
                    <div className='absolute top-6 right-2 text-xs text-cyan-400'>B: {voltDivB}V/Div</div>
                    {/* X-Div Scale */}
                    <div className='absolute bottom-2 left-2 text-xs text-slate-400'>{timebase}ms/Div</div>
                </div>
            </div>
        </div>
    );
};

const ElectromagnetismFaraday = ({ lang }: { lang: Language }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [magnetSpeed, setMagnetSpeed] = useState(0); // Vận tốc Nam châm (cm/s)
    const [magnetStrength, setMagnetStrength] = useState(1); // Cường độ Nam châm (B)
    const [coilTurns, setCoilTurns] = useState(10); // Số vòng dây cuộn cảm (N)
    const [time, setTime] = useState(0);
    const [inducedVoltage, setInducedVoltage] = useState(0); // Điện áp cảm ứng
    const [flux, setFlux] = useState(0); // Từ thông
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const plotRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);
    
    // Magnet position
    const magnetInitialX = 600;
    const coilX = 200;

    // Physics Calculation
    const calculateFaraday = useCallback((t: number, speed: number, strength: number, N: number) => {
        const magnetPos = magnetInitialX - speed * t * 10;
        const dx = magnetPos - coilX;
        
        // Mock Magnetic Flux (proportional to strength and inverse distance squared)
        const flux_val = strength * N / (dx * dx / 1000 + 100);
        
        // Mock d(Flux)/dt (Rate of change)
        const dFlux_dt = (flux_val - flux) / 0.05; // Simplified derivative
        const voltage = -dFlux_dt; // Faraday's Law: E = -N * d(Flux)/dt
        
        // Update state for analysis panels
        setFlux(flux_val);
        setInducedVoltage(voltage);

        return { magnetPos, voltage, flux_val };
    }, [flux, magnetInitialX, coilX]);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const summary = `Faraday's Law: Magnet Speed=${magnetSpeed}, Strength=${magnetStrength}, Coil Turns=${coilTurns}, Max Voltage Observed=${Math.abs(inducedVoltage).toFixed(2)}`;
        const result = await analyzeExperimentData("Faraday's Law", { magnetSpeed, magnetStrength, coilTurns }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    // Draw Simulation
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
        
        // 1. Draw Coil (Cuộn dây)
        const coilHeight = 150;
        const coilWidth = 50;
        ctx.strokeStyle = '#f59e0b'; // Yellow for Copper
        ctx.lineWidth = 4;
        ctx.strokeRect(coilX - coilWidth / 2, centerY - coilHeight / 2, coilWidth, coilHeight);
        
        // Induced Current Visualization (Lenz's Law - Glowing effect)
        const glowIntensity = Math.min(1.0, Math.abs(voltage) / 10);
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(255, 255, 0, ${glowIntensity})`;
        ctx.strokeRect(coilX - coilWidth / 2, centerY - coilHeight / 2, coilWidth, coilHeight);
        ctx.shadowBlur = 0;
        
        // 2. Draw Magnet (Nam châm)
        const magnetHeight = 100;
        const magnetWidth = 50;
        
        // Draw Magnet body
        ctx.fillStyle = '#ef4444'; // Red (North Pole facing coil)
        ctx.fillRect(magnetPos - magnetWidth / 2, centerY - magnetHeight / 2, magnetWidth / 2, magnetHeight);
        ctx.fillStyle = '#3b82f6'; // Blue (South Pole)
        ctx.fillRect(magnetPos, centerY - magnetHeight / 2, magnetWidth / 2, magnetHeight);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(magnetPos - magnetWidth / 2, centerY - magnetHeight / 2, magnetWidth, magnetHeight);
        
        // 3. Draw Magnetic Flux Lines (Trực quan hóa Từ thông)
        const B_strength = magnetStrength * 50;
        ctx.strokeStyle = `rgba(100, 100, 255, 0.5)`;
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(magnetPos + magnetWidth / 2, centerY + i * 20); // Start from N pole
            ctx.bezierCurveTo(magnetPos + magnetWidth / 2 + B_strength, centerY + i * 20, 
                                coilX + 50, centerY + i * 50, 
                                coilX + coilWidth / 2, centerY + i * 50 + 50); // Curve through the coil
            ctx.stroke();
        }

    }, [magnetStrength, coilTurns, coilX]);

    // Draw Voltage Plot
    const drawPlot = useCallback(() => {
        const canvas = plotRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const centerY = H / 2;

        // Shift left
        const imageData = ctx.getImageData(1, 0, W - 1, H);
        ctx.putImageData(imageData, 0, 0);
        ctx.fillStyle = '#1e293b'; 
        ctx.fillRect(W - 1, 0, 1, H);

        // Draw center line
        ctx.strokeStyle = '#334155'; 
        ctx.beginPath();
        ctx.moveTo(0, centerY); ctx.lineTo(W, centerY); 
        ctx.stroke();

        // Draw Voltage Point
        const maxVoltageVisual = 10; 
        const normalizedVoltage = (inducedVoltage / maxVoltageVisual);
        const y = centerY - (normalizedVoltage * H / 2); 

        ctx.fillStyle = '#f59e0b'; 
        ctx.fillRect(W - 1, y, 1, 1);
    }, [inducedVoltage]);
    
    // Animation Loop
    useEffect(() => {
        if (!isRunning) return;

        const animate = () => {
            setTime(t => t + 0.05);
            
            const { magnetPos, voltage, flux_val } = calculateFaraday(time, magnetSpeed, magnetStrength, coilTurns);
            drawSimulation(magnetPos, voltage);
            drawPlot();

            // Stop when magnet hits the coil
            if (magnetPos <= coilX + 50) setIsRunning(false);

            reqRef.current = requestAnimationFrame(animate);
        };

        reqRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(reqRef.current);
    }, [isRunning, time, magnetSpeed, magnetStrength, coilTurns, calculateFaraday, drawSimulation, drawPlot]);
    
    useEffect(() => {
        drawSimulation(magnetInitialX, 0);
        drawPlot();
    }, [drawSimulation, drawPlot]);

    const handleReset = () => {
        setIsRunning(false);
        setTime(0);
        setInducedVoltage(0);
        setFlux(0);
        // Clear plot
        if (plotRef.current) {
            const ctx = plotRef.current.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#1e293b'; 
                ctx.fillRect(0, 0, plotRef.current.width, plotRef.current.height);
            }
        }
        drawSimulation(magnetInitialX, 0);
        setAiAnalysis('');
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
            
            {/* CỘT THAM SỐ (LEFT PANEL) */}
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
                    <Magnet size={20} className="text-blue-500" /> Cấu Hình Điện Từ
                </div>
                
                {/* Control: Magnet Speed */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Vận tốc Nam châm (v) ({magnetSpeed.toFixed(0)} cm/s)</label>
                   <input type="range" min="0" max="100" step="5" value={magnetSpeed} onChange={(e) => setMagnetSpeed(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-red-500 cursor-pointer" />
                   <p className='text-xs text-red-400 italic'>E proportional v (Tốc độ chuyển động).</p>
                </div>
                
                {/* Control: Magnet Strength */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Cường độ Từ trường (B) ({magnetStrength.toFixed(1)})</label>
                   <input type="range" min="0.1" max="2" step="0.1" value={magnetStrength} onChange={(e) => setMagnetStrength(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-blue-500 cursor-pointer" />
                </div>
                
                {/* Control: Coil Turns */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Số vòng dây Cuộn cảm (N) ({coilTurns})</label>
                   <input type="range" min="1" max="20" step="1" value={coilTurns} onChange={(e) => setCoilTurns(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-yellow-500 cursor-pointer" />
                   <p className='text-xs text-yellow-400 italic'>E proportional N (Số vòng dây).</p>
                </div>

                {/* Trực quan hóa Từ thông & Điện áp */}
                <div className="p-3 bg-slate-700 rounded-xl shadow-lg border-l-4 border-lime-500 mt-auto">
                    <p className="text-sm font-bold text-white mb-1"><Aperture size={14} className='inline mr-1'/> Phân Tích Hiện Tượng</p>
                    <div className='text-xs space-y-1 font-mono'>
                        <p className='text-cyan-400'>Từ thông (Phi_B): {flux.toFixed(3)} Wb</p>
                        <p className='text-yellow-400 font-bold'>Điện áp Cảm ứng (epsilon): {inducedVoltage.toFixed(3)} V</p>
                        <p className='text-red-400 italic mt-2'>Định luật Lenz: I_induced chống lại sự thay đổi Phi_B</p>
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
                        <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50" disabled={isRunning}>
                            {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Tạm Dừng' : 'Di Chuyển Nam Châm'}
                        </button>
                        <button onClick={handleReset} className="p-2 bg-slate-700 rounded-xl hover:bg-slate-600 text-white transition-colors" title="Thiết Lập Lại"><RotateCcw size={16}/></button>
                    </div>
                </div>
            </div>

            {/* CỘT MÔ PHỎNG (RIGHT PANEL) */}
            <div className="lg:col-span-9 flex flex-col gap-4">
                
                {/* Simulation Canvas */}
                <div className="flex-1 bg-black rounded-xl border border-slate-700 overflow-hidden relative shadow-2xl">
                    <canvas ref={canvasRef} width={800} height={350} className="w-full h-full object-contain" />
                    <div className="absolute top-4 left-4 text-sm text-slate-400">
                        Mô phỏng Định luật Cảm ứng Faraday
                    </div>
                </div>

                {/* Voltage Plot */}
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                    <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 mb-2"><BarChart2 size={16} className="text-yellow-400"/> Biểu Đồ Điện Áp Cảm Ứng (epsilon)</div>
                    <div className='h-20 w-full'>
                       <canvas ref={plotRef} width={700} height={80} className="w-full h-full bg-slate-800"></canvas>
                    </div>
                    <p className='text-xs text-slate-400 italic'>Điện áp epsilon chỉ xuất hiện khi Phi_B thay đổi.</p>
                </div>
            </div>
        </div>
    );
};

// --- MAIN EXPORT COMPONENT ---

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