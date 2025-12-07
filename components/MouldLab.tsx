
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Link, Loader2, Sparkles, X } from 'lucide-react';
import { analyzeExperimentData } from '../services/gemini';
import { Language } from '../types';

interface MouldLabProps {
  lang: Language;
}

export const MouldLab: React.FC<MouldLabProps> = ({ lang }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [chainMass, setChainMass] = useState(10);
    const [stiffness, setStiffness] = useState(0.5);
    const [basinHeight, setBasinHeight] = useState(150);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);
    const timeRef = useRef(0);

    const renderChain = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number, t: number) => {
        const centerX = W / 2;
        const basinY = H - basinHeight;
        
        const V_exit = Math.sqrt(2 * 9.8 * (basinHeight / 10));
        const F_uplift = chainMass * V_exit * V_exit / 10;
        const maxRise = Math.min(120, Math.max(0, F_uplift * 2 * stiffness / 10 * 1.5));
        
        const currentRise = isRunning ? Math.min(maxRise, t * 50) : 0;
        
        const startX = centerX - 20;
        const startY = basinY + 40; 
        const peakX = centerX;
        const peakY = basinY - currentRise;
        const endX = centerX + 60;
        const endY = H + 50; 
        
        // Draw Glass Beaker
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(centerX - 50, basinY, 100, H - basinY);
        ctx.fill();
        ctx.stroke();
        
        // Beaker Reflections
        ctx.beginPath();
        ctx.moveTo(centerX - 40, basinY + 20);
        ctx.lineTo(centerX - 40, H - 20);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(centerX, basinY, 50, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        const numBeads = 150;
        const beadColor = '#f59e0b';
        
        for (let i = 0; i < numBeads; i++) {
            const progress = (i + t * 20) % numBeads / numBeads; 
            let x, y;
            
            if (progress < 0.3) {
                 const p = progress / 0.3;
                 x = startX + (peakX - startX) * p;
                 y = startY + (peakY - startY) * Math.sin(p * Math.PI / 2);
            } else {
                 const p = (progress - 0.3) / 0.7;
                 x = peakX + (endX - peakX) * p;
                 y = peakY + (endY - peakY) * p * p; 
            }

            ctx.fillStyle = beadColor;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.ellipse(centerX, H - 20, 40, 20, 0, 0, Math.PI * 2);
        ctx.fill();

    }, [basinHeight, chainMass, stiffness, isRunning]);

    useEffect(() => {
        const animate = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            ctx.clearRect(0,0, canvas.width, canvas.height);
            
            if (isRunning) timeRef.current += 0.05;
            else timeRef.current = 0;

            renderChain(ctx, canvas.width, canvas.height, timeRef.current);
            reqRef.current = requestAnimationFrame(animate);
        };
        reqRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(reqRef.current);
    }, [renderChain, isRunning]);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const result = await analyzeExperimentData("Chain Fountain", { chainMass, stiffness, basinHeight }, "Analysis requested.", lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4">
                 <div className="flex items-center gap-2 font-bold text-yellow-500 border-b border-slate-700 pb-2">
                    <Link size={20}/> Chain Fountain
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400">Chain Mass ({chainMass})</label>
                        <input type="range" min="1" max="20" value={chainMass} onChange={e => setChainMass(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-yellow-500" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400">Basin Height ({basinHeight})</label>
                        <input type="range" min="100" max="300" value={basinHeight} onChange={e => setBasinHeight(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-teal-500" />
                    </div>
                     <div>
                        <label className="text-xs text-slate-400">Stiffness ({stiffness})</label>
                        <input type="range" min="0.1" max="1" step="0.1" value={stiffness} onChange={e => setStiffness(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-orange-500" />
                    </div>
                </div>

                <div className="flex gap-2 mt-auto">
                    <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2">
                         {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Stop' : 'Drop Chain'}
                    </button>
                    <button onClick={() => {setIsRunning(false); timeRef.current=0;}} className="p-2 bg-slate-700 rounded-xl"><RotateCcw size={16}/></button>
                </div>
                 {!aiAnalysis ? (
                   <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-2 bg-indigo-600 rounded flex items-center justify-center gap-2 text-sm mt-2">
                      {isAnalyzing ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>} AI Analysis
                   </button>
                ) : (
                    <div className="bg-indigo-900/30 p-2 rounded border border-indigo-500/30 text-xs relative mt-2">
                       <button onClick={() => setAiAnalysis('')} className="absolute top-1 right-1"><X size={12}/></button>
                       <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2">
                           <p className="whitespace-pre-wrap">{aiAnalysis}</p>
                       </div>
                    </div>
                )}
            </div>

            <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 relative overflow-hidden shadow-2xl">
                 <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
                 <div className="absolute top-4 left-4 text-xs text-slate-500">Physics Engine: Bead-Spring Dynamics</div>
            </div>
        </div>
    );
};
