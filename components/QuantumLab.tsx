
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Aperture, Settings, Play, Pause, RotateCcw, Zap, Target, Waves, Ruler, Microscope, Eye, Atom, Thermometer, BarChart2, Box, Share2, Loader2, Sparkles, X, Radiation, MousePointer2 } from 'lucide-react';
import { AppMode, Language } from '../types';
import { analyzeExperimentData } from '../services/gemini';

interface QuantumLabProps {
  mode: AppMode;
  lang: Language;
}

// --- DOUBLE SLIT LAB ---
const QuantumDoubleSlit = ({ lang }: { lang: Language }) => {
    const [wavelength, setWavelength] = useState(500); // nm
    const [separation, setSeparation] = useState(2000); // nm
    const [distance, setDistance] = useState(1); // m (not visibly scaled 1:1)
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Wave properties for visual
    // Wavelength 500nm -> Color Green
    // Canvas Scale: 1px approx 5nm for interference source separation
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        
        // Sources
        const cx = W / 2;
        const cy = H - 50;
        const d_px = separation / 100; // visual scale
        const s1 = { x: cx - d_px/2, y: cy };
        const s2 = { x: cx + d_px/2, y: cy };
        
        const lambda_px = wavelength / 20; // visual wavelength
        
        // Draw interference pattern (Approximation via lines)
        // Intensity I ~ cos^2( (pi * d * sin(theta)) / lambda )
        
        // Draw Screen Intensity
        const screenY = 50;
        const intensityData = ctx.createImageData(W, 50);
        
        for (let x = 0; x < W; x++) {
            const dx = x - cx;
            const D_px = H - 100; // Distance to source plane
            const theta = Math.atan(dx / D_px);
            
            const phaseDiff = (Math.PI * (d_px * 20) * Math.sin(theta)) / lambda_px; // Scaling factor adjustment
            const intensity = Math.cos(phaseDiff) * Math.cos(phaseDiff);
            
            // Color based on wavelength
            let r=0, g=0, b=0;
            if (wavelength < 450) { r=100; b=255; }
            else if (wavelength < 500) { r=0; g=100; b=255; }
            else if (wavelength < 570) { r=0; g=255; b=100; }
            else if (wavelength < 620) { r=255; g=255; b=0; }
            else { r=255; g=0; b=0; }
            
            const idx = (x + 25 * W) * 4; // Middle of strip
            // Fill vertical strip
            for(let y=0; y<50; y++) {
                const pixelIdx = (x + y * W) * 4;
                intensityData.data[pixelIdx] = r * intensity;
                intensityData.data[pixelIdx+1] = g * intensity;
                intensityData.data[pixelIdx+2] = b * intensity;
                intensityData.data[pixelIdx+3] = 255;
            }
        }
        ctx.putImageData(intensityData, 0, 0);
        
        // Draw Rays
        ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
        for(let i=-20; i<=20; i++) {
            ctx.beginPath();
            ctx.arc(s1.x, s1.y, i * lambda_px, Math.PI, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(s2.x, s2.y, i * lambda_px, Math.PI, 0);
            ctx.stroke();
        }
        
        // Barrier
        ctx.fillStyle = '#475569';
        ctx.fillRect(0, cy - 2, W, 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(s1.x - 2, cy - 2, 4, 4);
        ctx.fillRect(s2.x - 2, cy - 2, 4, 4);

    }, [wavelength, separation]);

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-2"><Waves size={20} className="text-purple-500" /> Double Slit</div>
                <div className="space-y-4 mt-4">
                    <div><label className="text-xs text-slate-400">Wavelength ({wavelength} nm)</label><input type="range" min="380" max="750" value={wavelength} onChange={e => setWavelength(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-purple-500"/></div>
                    <div><label className="text-xs text-slate-400">Slit Separation ({separation} nm)</label><input type="range" min="1000" max="5000" step="100" value={separation} onChange={e => setSeparation(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-blue-500"/></div>
                </div>
            </div>
            <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 shadow-2xl"><canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" /></div>
        </div>
    );
};

// --- ATOMIC SPECTRUM LAB ---
const QuantumAtomicSpectrum = ({ lang }: { lang: Language }) => {
    const [n, setN] = useState(1); // Energy Level
    const [targetN, setTargetN] = useState(1);
    const [photon, setPhoton] = useState<{lambda: number, color: string} | null>(null);
    
    // Rydberg constant R = 1.097e7 m^-1. 
    // 1/lambda = R * (1/n1^2 - 1/n2^2)
    
    const jump = (to: number) => {
        if (to < n) {
            // Emission
            const R = 1.097e7;
            const invLambda = R * (1/(to*to) - 1/(n*n));
            const lambda = 1/invLambda * 1e9; // nm
            
            let color = '#fff';
            if (lambda < 400) color = '#8b5cf6'; // UV
            else if (lambda < 450) color = '#3b82f6';
            else if (lambda < 500) color = '#06b6d4';
            else if (lambda < 570) color = '#22c55e';
            else if (lambda < 600) color = '#eab308';
            else if (lambda < 700) color = '#ef4444';
            else color = '#78350f'; // IR
            
            setPhoton({ lambda, color });
        } else {
            // Absorption (require energy)
            setPhoton(null);
        }
        setN(to);
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100">
             <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-2"><Atom size={20} className="text-pink-500" /> Bohr Model</div>
                <div className="grid grid-cols-4 gap-2 mt-4">
                    {[1,2,3,4,5].map(lvl => (
                        <button key={lvl} onClick={() => jump(lvl)} className={`p-2 rounded ${n === lvl ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-400'}`}>n={lvl}</button>
                    ))}
                </div>
                {photon && (
                    <div className="mt-4 p-3 bg-slate-900 rounded border border-slate-700">
                        <div className="text-xs text-slate-400">Emitted Photon</div>
                        <div className="text-lg font-mono font-bold" style={{color: photon.color}}>{photon.lambda.toFixed(1)} nm</div>
                    </div>
                )}
             </div>
             <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 shadow-2xl relative flex items-center justify-center">
                 {/* Atom Visual */}
                 <div className="relative w-96 h-96">
                     <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-yellow-500 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_20px_#eab308]"></div>
                     {[1,2,3,4,5].map(lvl => (
                         <div key={lvl} className={`absolute top-1/2 left-1/2 rounded-full border border-slate-700 -translate-x-1/2 -translate-y-1/2 transition-all`} 
                              style={{width: lvl*60, height: lvl*60, borderColor: n===lvl ? '#f472b6' : '#334155', borderWidth: n===lvl?2:1}}></div>
                     ))}
                     {/* Electron */}
                     <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee] transition-all duration-500"
                          style={{transform: `translate(-50%, -50%) translate(${n*30}px, 0)`}}></div>
                     
                     {/* Emitted Photon Animation */}
                     {photon && (
                         <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full animate-ping" 
                              style={{backgroundColor: photon.color, animationDuration: '1s'}}></div>
                     )}
                 </div>
             </div>
        </div>
    );
};

// --- TUNNELING LAB ---
const QuantumTunneling = ({ lang }: { lang: Language }) => {
    const [energy, setEnergy] = useState(50); // Particle Energy
    const [barrierHeight, setBarrierHeight] = useState(60);
    const [barrierWidth, setBarrierWidth] = useState(20);
    const [probability, setProbability] = useState(0);
    
    // T approx exp(-2 * sqrt(2m(V-E))/hbar * a)
    useEffect(() => {
        if (energy > barrierHeight) {
            setProbability(100);
        } else {
            const diff = barrierHeight - energy;
            // Simplified constant factor for visualization
            const prob = Math.exp(-0.1 * Math.sqrt(diff) * barrierWidth) * 100;
            setProbability(Math.max(0, Math.min(100, prob)));
        }
    }, [energy, barrierHeight, barrierWidth]);

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100">
             <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4">
                 <div className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-2"><MousePointer2 size={20} className="text-emerald-500" /> Tunneling</div>
                 <div className="space-y-4 mt-4">
                    <div><label className="text-xs text-slate-400">Particle Energy (E)</label><input type="range" min="10" max="100" value={energy} onChange={e => setEnergy(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-emerald-500"/></div>
                    <div><label className="text-xs text-slate-400">Barrier Height (V)</label><input type="range" min="10" max="100" value={barrierHeight} onChange={e => setBarrierHeight(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-red-500"/></div>
                    <div><label className="text-xs text-slate-400">Barrier Width (a)</label><input type="range" min="5" max="50" value={barrierWidth} onChange={e => setBarrierWidth(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-blue-500"/></div>
                 </div>
                 <div className="mt-4 p-3 bg-slate-900 rounded border border-slate-700">
                     <div className="text-xs text-slate-400">Transmission Probability</div>
                     <div className="text-xl font-bold text-emerald-400">{probability.toFixed(4)}%</div>
                 </div>
             </div>
             <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 shadow-2xl relative flex items-center justify-center overflow-hidden">
                 {/* Visualizer */}
                 <div className="w-full h-64 relative bg-slate-900/50 flex items-end px-10">
                     {/* Potential V */}
                     <div className="absolute bottom-0 left-[40%] bg-red-500/30 border-t-2 border-red-500 transition-all" 
                          style={{width: barrierWidth*4, height: barrierHeight*2}}></div>
                     {/* Particle Energy E */}
                     <div className="absolute w-full border-t-2 border-emerald-500 border-dashed bottom-0 transition-all flex items-center" 
                          style={{height: energy*2}}>
                          <span className="text-emerald-500 text-xs ml-2 mb-4 bg-black px-1">E</span>
                     </div>
                     
                     {/* Wave Packet (Static representation) */}
                     <svg className="absolute bottom-0 left-0 w-full h-full pointer-events-none">
                         <path d={`M 0 ${300-energy*2} Q 100 ${300-energy*2-20} 200 ${300-energy*2} T 400 ${300-energy*2}`} stroke="white" strokeWidth="2" fill="none" opacity="0.5"/>
                         {/* Transmitted Wave */}
                         <path d={`M ${400+barrierWidth*4} ${300-energy*2} Q ${500+barrierWidth*4} ${300-energy*2-20*probability/100} ${600+barrierWidth*4} ${300-energy*2}`} 
                               stroke="white" strokeWidth="2" fill="none" opacity={probability/100}/>
                     </svg>
                 </div>
             </div>
        </div>
    );
};

// --- RUTHERFORD SCATTERING (Preserved) ---
const QuantumRutherford = ({ lang }: { lang: Language }) => {
    const [isRunning, setIsRunning] = useState(true);
    const [energy, setEnergy] = useState(5); 
    const [nucleusZ, setNucleusZ] = useState(79); 
    const [particles, setParticles] = useState<{x: number, y: number, vx: number, vy: number, trace: {x:number, y:number}[]}[]>([]);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);

    useEffect(() => {
        if(particles.length === 0) {
            const initialParticles = [];
            for(let i=0; i<20; i++) {
                initialParticles.push({
                    x: -300 - Math.random() * 200,
                    y: (Math.random() - 0.5) * 200, 
                    vx: 5 + energy/2,
                    vy: 0,
                    trace: []
                });
            }
            setParticles(initialParticles);
        }
    }, [energy]);

    const update = () => {
        if (!isRunning) return;
        
        const k = 1000 * nucleusZ; 
        
        const newParticles = particles.map(p => {
            const dx = 0 - p.x; 
            const dy = 0 - p.y;
            const rSq = dx*dx + dy*dy;
            const r = Math.sqrt(rSq);
            
            const F = k / Math.max(rSq, 10);
            const ax = -F * (dx/r); 
            const ay = -F * (dy/r);
            
            const vx = p.vx + ax * 0.05;
            const vy = p.vy + ay * 0.05;
            const x = p.x + vx * 0.05;
            const y = p.y + vy * 0.05;
            
            let trace = p.trace;
            if (Math.random() > 0.8) trace = [...trace, {x, y}];

            if (x > 400 || y > 300 || y < -300) {
                return {
                    x: -400,
                    y: (Math.random() - 0.5) * 200,
                    vx: 5 + energy/2,
                    vy: 0,
                    trace: []
                };
            }

            return { x, y, vx, vy, trace };
        });
        
        setParticles(newParticles);
        reqRef.current = requestAnimationFrame(update);
    };

    useEffect(() => {
        if (isRunning) reqRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(reqRef.current);
    }, [isRunning, particles, energy, nucleusZ]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const cx = W/2;
        const cy = H/2;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);
        
        ctx.fillStyle = '#fbbf24';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fbbf24';
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#38bdf8';
        particles.forEach(p => {
            ctx.beginPath(); ctx.arc(cx + p.x, cy + p.y, 2, 0, Math.PI*2); ctx.fill();
            
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
            ctx.beginPath();
            p.trace.forEach((t, i) => {
                if (i===0) ctx.moveTo(cx + t.x, cy + t.y);
                else ctx.lineTo(cx + t.x, cy + t.y);
            });
            ctx.stroke();
        });
    };
    
    useEffect(draw, [particles]);

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-2">
                    <Radiation size={20} className="text-yellow-500" /> Rutherford Scattering
                </div>
                <div className="mt-4 space-y-4">
                    <div><label className="text-xs text-slate-400">Alpha Energy ({energy} MeV)</label><input type="range" min="1" max="20" value={energy} onChange={e => setEnergy(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-sky-500"/></div>
                    <div><label className="text-xs text-slate-400">Nucleus Z ({nucleusZ})</label><input type="range" min="10" max="100" value={nucleusZ} onChange={e => setNucleusZ(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-yellow-500"/></div>
                    <button onClick={() => setIsRunning(!isRunning)} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded-xl">{isRunning ? 'Pause' : 'Beam On'}</button>
                </div>
            </div>
            <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 shadow-2xl">
                <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
            </div>
        </div>
    );
};

export const QuantumLab: React.FC<QuantumLabProps> = ({ mode, lang }) => {
  switch(mode) {
      case AppMode.SIM_RUN_SLIT: return <QuantumDoubleSlit lang={lang} />;
      case AppMode.SIM_RUN_SPECTRUM: return <QuantumAtomicSpectrum lang={lang} />;
      case AppMode.SIM_RUN_TUNNELING: return <QuantumTunneling lang={lang} />;
      case AppMode.SIM_RUN_RUTHERFORD: return <QuantumRutherford lang={lang} />;
      default: return <div className="p-10 text-center text-slate-500">Mode not found</div>;
  }
};
