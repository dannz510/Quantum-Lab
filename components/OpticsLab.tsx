
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, RefreshCw, Sun, Box, Circle, Triangle, Loader2, Sparkles, X, Eye, Palette, Glasses } from 'lucide-react';
import { analyzeExperimentData } from '../services/gemini';
import { Language, AppMode } from '../types';

interface OpticsLabProps {
  mode?: AppMode;
  lang: Language;
}

// --- PRISM LAB (Ray Tracing) ---
const OpticsPrism = ({ lang }: { lang: Language }) => {
    const [angle, setAngle] = useState(0);
    const [indexOfRefraction, setIndexOfRefraction] = useState(1.5);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const cx = W/2;
        const cy = H/2;
        
        ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,W,H);
        
        // Prism Geometry (Equilateral)
        const size = 150;
        const h = size * Math.sqrt(3)/2;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle * Math.PI / 180);
        
        // Vertices relative to center
        const p1 = {x: 0, y: -h*2/3};
        const p2 = {x: -size/2, y: h/3};
        const p3 = {x: size/2, y: h/3};
        
        // Draw Prism
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.closePath();
        ctx.fill(); ctx.stroke();
        
        ctx.restore();
        
        // Ray Tracing Logic (Simplified)
        // Source
        const sx = 100; const sy = cy;
        ctx.strokeStyle = 'white'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(cx - 50, sy); ctx.stroke(); // Incident Ray (approx)
        
        // Dispersion Rays (R, G, B)
        const traceRay = (color: string, iorOffset: number, offsetY: number) => {
             const n = indexOfRefraction + iorOffset;
             // Fake Refraction visual for demo
             const refractAngle1 = Math.PI/6 / n; // Snell's law approx
             const refractAngle2 = Math.PI/3 * n; 
             
             ctx.strokeStyle = color;
             ctx.globalCompositeOperation = 'screen';
             ctx.beginPath();
             ctx.moveTo(cx - 50, sy);
             // Inside Prism
             const mx = cx + 20;
             const my = sy + (n-1.5)*50;
             ctx.lineTo(mx, my);
             // Exit Prism
             ctx.lineTo(W, my + (my-sy)*3 + offsetY);
             ctx.stroke();
        };
        
        traceRay('#ef4444', -0.05, -20); // Red (less bend)
        traceRay('#22c55e', 0, 0);       // Green
        traceRay('#3b82f6', 0.05, 20);   // Blue (more bend)
        
        ctx.globalCompositeOperation = 'source-over';
    };
    
    useEffect(draw, [angle, indexOfRefraction]);

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4">
                 <div className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-2">
                    <Triangle size={20} className="text-white" /> Prism Dispersion
                </div>
                <div className="mt-4 space-y-4">
                    <div><label className="text-xs text-slate-400">Rotation ({angle}°)</label><input type="range" min="-45" max="45" value={angle} onChange={e => setAngle(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-white"/></div>
                    <div><label className="text-xs text-slate-400">Refractive Index ({indexOfRefraction})</label><input type="range" min="1.3" max="1.8" step="0.01" value={indexOfRefraction} onChange={e => setIndexOfRefraction(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-blue-500"/></div>
                </div>
            </div>
            <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 shadow-2xl"><canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" /></div>
        </div>
    );
};

// --- COLOR MIXING LAB ---
const OpticsColor = ({ lang }: { lang: Language }) => {
    const [r, setR] = useState(255);
    const [g, setG] = useState(0);
    const [b, setB] = useState(0);
    const [mode, setMode] = useState<'additive'|'subtractive'>('additive');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = mode === 'additive' ? '#000' : '#fff';
        ctx.fillRect(0, 0, 800, 500);
        
        ctx.globalCompositeOperation = mode === 'additive' ? 'screen' : 'multiply';
        
        const offset = 100;
        
        if (mode === 'additive') {
            // RGB
            ctx.fillStyle = `rgb(${r}, 0, 0)`;
            ctx.beginPath(); ctx.arc(300, 200, 100, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = `rgb(0, ${g}, 0)`;
            ctx.beginPath(); ctx.arc(500, 200, 100, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = `rgb(0, 0, ${b})`;
            ctx.beginPath(); ctx.arc(400, 350, 100, 0, Math.PI*2); ctx.fill();
        } else {
            // CMY (Subtractive) - Simplified using RGB inputs as CMY sliders
            ctx.fillStyle = `rgb(0, ${255-r/2}, ${255-r/2})`; // Cyan-ish
            ctx.beginPath(); ctx.arc(300, 200, 100, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = `rgb(${255-g/2}, 0, ${255-g/2})`; // Magenta-ish
            ctx.beginPath(); ctx.arc(500, 200, 100, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = `rgb(${255-b/2}, ${255-b/2}, 0)`; // Yellow-ish
            ctx.beginPath(); ctx.arc(400, 350, 100, 0, Math.PI*2); ctx.fill();
        }
        
        ctx.globalCompositeOperation = 'source-over';
    };
    
    useEffect(draw, [r, g, b, mode]);

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-2">
                    <Palette size={20} className="text-fuchsia-500" /> Color Mixing
                </div>
                <div className="flex gap-2 my-4">
                    <button onClick={() => setMode('additive')} className={`flex-1 py-1 rounded text-xs ${mode==='additive'?'bg-white text-black':'bg-slate-700 text-white'}`}>Light (RGB)</button>
                    <button onClick={() => setMode('subtractive')} className={`flex-1 py-1 rounded text-xs ${mode==='subtractive'?'bg-white text-black':'bg-slate-700 text-white'}`}>Paint (CMY)</button>
                </div>
                <div className="mt-4 space-y-4">
                    <div><label className="text-xs text-red-400">Ch 1 ({r})</label><input type="range" min="0" max="255" value={r} onChange={e => setR(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-red-500"/></div>
                    <div><label className="text-xs text-green-400">Ch 2 ({g})</label><input type="range" min="0" max="255" value={g} onChange={e => setG(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-green-500"/></div>
                    <div><label className="text-xs text-blue-400">Ch 3 ({b})</label><input type="range" min="0" max="255" value={b} onChange={e => setB(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-blue-500"/></div>
                </div>
            </div>
            <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 shadow-2xl"><canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" /></div>
        </div>
    );
};

// --- LENSES LAB (Preserved) ---
const OpticsLenses = ({ lang }: { lang: Language }) => {
    const [focalLength, setFocalLength] = useState(100); 
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
        ctx.strokeStyle = '#475569'; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(cx, cy, 10, 150, 0, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = '#f472b6';
        ctx.beginPath(); ctx.arc(cx - focalLength, cy, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + focalLength, cy, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillText("F", cx + focalLength, cy + 15);

        const objX = cx - objDist; const objY = cy - objHeight;
        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(objX, cy); ctx.lineTo(objX, objY); ctx.stroke();
        
        const di = 1 / (1/focalLength - 1/objDist); const m = -di / objDist; const imgH = m * objHeight; const imgX = cx + di;
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
        ctx.beginPath(); ctx.moveTo(imgX, cy); ctx.lineTo(imgX, cy - imgH); ctx.stroke();

        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(objX, objY); ctx.lineTo(cx, objY); ctx.lineTo(imgX, cy - imgH); ctx.lineTo(imgX + 100, cy - imgH + (cy - imgH - objY)/(imgX-cx)*100); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(objX, objY); ctx.lineTo(imgX, cy - imgH); ctx.stroke();
    };

    useEffect(draw, [focalLength, objDist, objHeight]);

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-2"><Glasses size={20} className="text-blue-400" /> Geometric Optics</div>
                <div className="mt-4 space-y-4">
                    <div><label className="text-xs text-slate-400">Focal Length ({focalLength})</label><input type="range" min="50" max="200" value={focalLength} onChange={e => setFocalLength(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-blue-500"/></div>
                    <div><label className="text-xs text-slate-400">Object Distance ({objDist})</label><input type="range" min="50" max="350" value={objDist} onChange={e => setObjDist(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-yellow-500"/></div>
                    <div><label className="text-xs text-slate-400">Object Height ({objHeight})</label><input type="range" min="10" max="100" value={objHeight} onChange={e => setObjHeight(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-orange-500"/></div>
                </div>
            </div>
            <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 shadow-2xl"><canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" /></div>
        </div>
    );
};

export const OpticsLab: React.FC<OpticsLabProps> = ({ mode, lang }) => {
  if (mode === AppMode.SIM_RUN_LENSES) return <OpticsLenses lang={lang} />;
  if (mode === AppMode.SIM_RUN_COLOR) return <OpticsColor lang={lang} />;
  return <OpticsPrism lang={lang} />;
};
