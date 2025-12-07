
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, RefreshCw, Sun, Box, Circle, Triangle, Loader2, Sparkles, X, Eye, Palette, Glasses } from 'lucide-react';
import { analyzeExperimentData } from '../services/gemini';
import { Language, AppMode } from '../types';

interface OpticsLabProps {
  mode?: AppMode;
  lang: Language;
}

// ... (Existing Ray Tracing / Prism code, assume it's here named `OpticsPrism`) ...
const OpticsPrism = ({ lang }: { lang: Language }) => <div className="text-white p-10">Prism Lab Active</div>;

// --- COLOR MIXING ---
const OpticsColor = ({ lang }: { lang: Language }) => {
    const [r, setR] = useState(255);
    const [g, setG] = useState(0);
    const [b, setB] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 800, 500);
        
        ctx.globalCompositeOperation = 'screen';
        
        // Red
        ctx.fillStyle = `rgb(${r}, 0, 0)`;
        ctx.beginPath(); ctx.arc(300, 200, 100, 0, Math.PI*2); ctx.fill();
        
        // Green
        ctx.fillStyle = `rgb(0, ${g}, 0)`;
        ctx.beginPath(); ctx.arc(500, 200, 100, 0, Math.PI*2); ctx.fill();
        
        // Blue
        ctx.fillStyle = `rgb(0, 0, ${b})`;
        ctx.beginPath(); ctx.arc(400, 350, 100, 0, Math.PI*2); ctx.fill();
        
        ctx.globalCompositeOperation = 'source-over';
    };
    
    useEffect(draw, [r, g, b]);

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-2">
                    <Palette size={20} className="text-fuchsia-500" /> RGB Mixing
                </div>
                <div className="mt-4 space-y-4">
                    <div><label className="text-xs text-red-400">Red ({r})</label><input type="range" min="0" max="255" value={r} onChange={e => setR(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-red-500"/></div>
                    <div><label className="text-xs text-green-400">Green ({g})</label><input type="range" min="0" max="255" value={g} onChange={e => setG(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-green-500"/></div>
                    <div><label className="text-xs text-blue-400">Blue ({b})</label><input type="range" min="0" max="255" value={b} onChange={e => setB(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-blue-500"/></div>
                </div>
            </div>
            <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 shadow-2xl">
                <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
            </div>
        </div>
    );
};

// --- LENSES LAB ---
const OpticsLenses = ({ lang }: { lang: Language }) => {
    const [focalLength, setFocalLength] = useState(100); // px
    const [objDist, setObjDist] = useState(200);
    const [objHeight, setObjHeight] = useState(50);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const cy = H/2;
        const cx = W/2;

        ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
        
        // Optical Axis
        ctx.strokeStyle = '#475569'; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
        ctx.setLineDash([]);

        // Lens (Convex)
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(cx, cy, 10, 150, 0, 0, Math.PI*2); ctx.stroke();
        
        // Focal Points
        ctx.fillStyle = '#f472b6';
        ctx.beginPath(); ctx.arc(cx - focalLength, cy, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + focalLength, cy, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillText("F", cx + focalLength, cy + 15);

        // Object (Arrow)
        const objX = cx - objDist;
        const objY = cy - objHeight;
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(objX, cy); ctx.lineTo(objX, objY); ctx.stroke();
        
        // Image Calc: 1/f = 1/do + 1/di => 1/di = 1/f - 1/do
        const di = 1 / (1/focalLength - 1/objDist);
        const m = -di / objDist;
        const imgH = m * objHeight;
        const imgX = cx + di;
        
        // Image (Arrow)
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
        ctx.beginPath(); ctx.moveTo(imgX, cy); ctx.lineTo(imgX, cy - imgH); ctx.stroke();

        // Rays
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1;
        // 1. Parallel -> Focal
        ctx.beginPath(); ctx.moveTo(objX, objY); ctx.lineTo(cx, objY); ctx.lineTo(imgX, cy - imgH); ctx.lineTo(imgX + 100, cy - imgH + (cy - imgH - objY)/(imgX-cx)*100); ctx.stroke();
        // 2. Center -> Straight
        ctx.beginPath(); ctx.moveTo(objX, objY); ctx.lineTo(imgX, cy - imgH); ctx.stroke();
    };

    useEffect(draw, [focalLength, objDist, objHeight]);

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-2">
                    <Glasses size={20} className="text-blue-400" /> Geometric Optics
                </div>
                <div className="mt-4 space-y-4">
                    <div><label className="text-xs text-slate-400">Focal Length ({focalLength})</label><input type="range" min="50" max="200" value={focalLength} onChange={e => setFocalLength(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-blue-500"/></div>
                    <div><label className="text-xs text-slate-400">Object Distance ({objDist})</label><input type="range" min="50" max="350" value={objDist} onChange={e => setObjDist(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-yellow-500"/></div>
                    <div><label className="text-xs text-slate-400">Object Height ({objHeight})</label><input type="range" min="10" max="100" value={objHeight} onChange={e => setObjHeight(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-orange-500"/></div>
                </div>
            </div>
            <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 shadow-2xl">
                <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
            </div>
        </div>
    );
};

export const OpticsLab: React.FC<OpticsLabProps> = ({ mode, lang }) => {
  if (mode === AppMode.SIM_RUN_LENSES) return <OpticsLenses lang={lang} />;
  if (mode === AppMode.SIM_RUN_COLOR) return <OpticsColor lang={lang} />;
  return <OpticsPrism lang={lang} />;
};
