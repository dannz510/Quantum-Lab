
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Play, Pause, RotateCcw, Link, Scale, TrendingUp, Cpu, Loader2, Sparkles, X } from 'lucide-react';
import { analyzeExperimentData } from '../services/gemini';
import { Language } from '../types';

interface MouldLabProps {
  lang: Language;
}

export const MouldLab: React.FC<MouldLabProps> = ({ lang }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [chainMass, setChainMass] = useState(10); // Khối lượng/đơn vị dài
    const [stiffness, setStiffness] = useState(0.5); // Độ cứng liên kết
    const [basinHeight, setBasinHeight] = useState(150); // Chiều cao Bát chứa
    const [fountainHeight, setFountainHeight] = useState(0); // Chiều cao Phun trào thực tế (Visual)
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);
    const timeRef = useRef(0);

    // Simplified Physics Calculation (Focus on Fountain Height)
    const calculatePhysics = useCallback((H_basin: number, mass: number, stiffness: number) => {
        // H_fountain = H_basin * (v^2 / (2g)) / (v^2 / (2g) - L*g) 
        // Simplified based on momentum transfer and chain properties
        const V_exit = Math.sqrt(2 * 9.8 * (H_basin / 10)); // Vận tốc thoát
        const F_uplift = mass * V_exit * V_exit / 10; // Lực đẩy (momentum)
        const H_fountain = F_uplift * 2 * stiffness / 10;
        
        return Math.min(100, Math.max(0, H_fountain * 1.5)); // Limit visual height
    }, []);

    // Draw Function
    const drawSimulation = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const centerX = W / 2;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);
        
        // 1. Draw Basin (Bát chứa)
        const basinY = H - basinHeight;
        ctx.fillStyle = '#334155'; // Grey
        ctx.fillRect(centerX - 150, basinY, 300, H - basinY);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(centerX - 150, basinY);
        ctx.lineTo(centerX + 150, basinY);
        ctx.stroke();

        // 2. Calculate/Set Fountain Height
        const H_fountain = calculatePhysics(basinHeight, chainMass, stiffness);
        setFountainHeight(H_fountain);

        // 3. Draw Chain Fountain (Phun trào chuỗi)
        const chainColor = '#fcd34d'; // Gold/Yellow
        const chainThickness = 4;
        
        // Falling part (Rơi xuống đất)
        ctx.fillStyle = chainColor;
        ctx.fillRect(centerX - chainThickness / 2, basinY + 50, chainThickness, H - basinY - 50);

        // Fountain part (Phun trào)
        if (H_fountain > 0) {
            ctx.fillStyle = chainColor;
            ctx.fillRect(centerX - chainThickness / 2, basinY - H_fountain, chainThickness, H_fountain);
            
            // Peak (Đỉnh Phun trào) - Highlight Force Vector
            const peakY = basinY - H_fountain;
            
            // Uplift Force Vector
            ctx.strokeStyle = '#f87171'; // Red
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX + 10, peakY + 10);
            ctx.lineTo(centerX + 10, peakY - 30);
            ctx.stroke();
            ctx.fillStyle = '#f87171';
            ctx.beginPath(); ctx.arc(centerX + 10, peakY - 30, 4, 0, Math.PI * 2); ctx.fill();
            
            // Annotate Force
            ctx.fillStyle = '#f87171';
            ctx.font = '10px Inter';
            ctx.fillText('F_Uplift', centerX + 15, peakY - 35);
        }

        // 4. Draw Chain in Basin (Dòng chảy hạt mô phỏng)
        ctx.fillStyle = chainColor + '80'; // Semi-transparent
        ctx.beginPath();
        ctx.arc(centerX, basinY + 10, 100, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw the point of exit (Miệng bát)
        ctx.fillStyle = '#fcd34d';
        ctx.beginPath();
        ctx.arc(centerX, basinY, 5, 0, Math.PI * 2);
        ctx.fill();

    }, [basinHeight, chainMass, stiffness, calculatePhysics]);

    // Animation Loop
    useEffect(() => {
        if (!isRunning) return;

        const animate = () => {
            timeRef.current += 0.05;
            drawSimulation();
            reqRef.current = requestAnimationFrame(animate);
        };

        reqRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(reqRef.current);
    }, [isRunning, drawSimulation]);
    
    useEffect(() => {
        // Initial draw or redraw on param change
        drawSimulation();
    }, [drawSimulation]);

    const handleReset = () => {
        setIsRunning(false);
        timeRef.current = 0;
        setFountainHeight(0);
        drawSimulation();
        setAiAnalysis('');
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const summary = `Chain Fountain: Mass=${chainMass}, Stiffness=${stiffness}, BasinHeight=${basinHeight}, FountainHeight=${fountainHeight.toFixed(2)}`;
        const result = await analyzeExperimentData("Chain Fountain", { chainMass, stiffness, basinHeight }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
            
            {/* CỘT THAM SỐ (LEFT PANEL) */}
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
                    <Link size={20} className="text-yellow-500" /> Cấu Hình Chuỗi & Vật Lý
                </div>
                
                {/* Control: Khối lượng/Đơn vị Chiều dài */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1"><Scale size={14} className='inline mr-1'/> Khối lượng Chuỗi/đơn vị ({chainMass.toFixed(1)} kg/m)</label>
                   <input type="range" min="1" max="20" step="1" value={chainMass} onChange={(e) => setChainMass(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-yellow-500 cursor-pointer" />
                </div>
                
                {/* Control: Độ cứng (Stiffness) */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1"><Cpu size={14} className='inline mr-1'/> Độ cứng Liên kết ({stiffness.toFixed(2)})</label>
                   <input type="range" min="0.1" max="1.0" step="0.05" value={stiffness} onChange={(e) => setStiffness(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-orange-500 cursor-pointer" />
                   <p className='text-xs text-orange-400 italic'>Độ cứng càng cao, lực đẩy lên càng hiệu quả.</p>
                </div>

                {/* Control: Chiều cao Bát chứa (ảnh hưởng đến vận tốc rơi) */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Chiều cao Bát chứa ({basinHeight.toFixed(0)} px)</label>
                   <input type="range" min="100" max="400" step="10" value={basinHeight} onChange={(e) => setBasinHeight(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-teal-500 cursor-pointer" />
                </div>

                {/* Phân tích Lực Nâng */}
                <div className="p-3 bg-slate-700 rounded-xl shadow-lg border-l-4 border-red-500 mt-auto">
                    <p className="text-sm font-bold text-white mb-1"><TrendingUp size={14} className='inline mr-1'/> Phân Tích Lực Phun Trào</p>
                    <div className='text-xs space-y-1'>
                        <p>Chiều cao Phun trào: <span className='text-yellow-300 font-mono'>{fountainHeight.toFixed(1)} px</span></p>
                        <p>Vận tốc Thoát (v): <span className='text-teal-300 font-mono'>{(Math.sqrt(2 * 9.8 * (basinHeight / 100)) * 10).toFixed(2)} m/s</span> (Giả lập)</p>
                        <p>Lực Phản lực Nâng (F_up): <span className='text-red-300 font-mono'>{(chainMass * 0.5).toFixed(2)} N</span> (Giả lập)</p>
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
                        <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                            {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Tạm Dừng' : 'Bắt Đầu Rơi'}
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
                        Hiệu ứng Phun Trào (Fountain Effect)
                    </div>
                </div>
            </div>
        </div>
    );
};
