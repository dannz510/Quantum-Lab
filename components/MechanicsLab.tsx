
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Play, Pause, RotateCcw, Plus, Minus, Send, Zap, Gavel, Droplet, Box, Scale, Sparkles, Loader2, X } from 'lucide-react';
import { calculateInclinedForces } from '../services/physics';
import { analyzeExperimentData } from '../services/gemini';
import { AppMode, Language } from '../types';

interface MechanicsLabProps {
  mode: AppMode;
  lang: Language;
}

// --- SUB-COMPONENTS FROM USER CODE ---

// Simplified N-Body Physics (Euler/Verlet Integration)
class Body {
    id: number;
    mass: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    ax: number;
    ay: number;
    color: string;
    trail: {x: number, y: number}[];
    thrustForce: {x: number, y: number};

    constructor(id: number, mass: number, x: number, y: number, vx: number, vy: number, color: string) {
        this.id = id;
        this.mass = mass;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.ax = 0;
        this.ay = 0;
        this.color = color;
        this.trail = [];
        this.thrustForce = {x: 0, y: 0};
    }
}

const MechanicsOrbits = ({ lang }: { lang: Language }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [bodies, setBodies] = useState<Body[]>([]);
    const [G, setG] = useState(0.5); // Hằng số hấp dẫn
    const [inversePower, setInversePower] = useState(2); // Luật nghịch đảo (1/r^2)
    const [selectedBodyId, setSelectedBodyId] = useState<number | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);
    const dt = 0.05; // Time step

    useEffect(() => {
        // Initial setup
        const initialBodies = [
            new Body(1, 100, 400, 250, 0, 0, '#f59e0b'), // Central Star
            new Body(2, 5, 550, 250, 0, 1.5, '#3b82f6'),   // Planet 1
            new Body(3, 2, 650, 250, 0, 1.0, '#10b981'),   // Planet 2
        ];
        setBodies(initialBodies);
    }, []);

    const updatePhysics = useCallback((currentBodies: Body[]) => {
        const newBodies = currentBodies.map(b => {
            const nb = new Body(b.id, b.mass, b.x, b.y, b.vx, b.vy, b.color);
            nb.trail = [...b.trail];
            nb.thrustForce = b.thrustForce; // Keep thrust until applied
            return nb;
        });
        
        // 1. Calculate Forces (N-Body)
        newBodies.forEach(bodyA => {
            bodyA.ax = 0;
            bodyA.ay = 0;
            
            // Add Thrust Force (Impulse applied directly to acceleration for simplicity in this tick)
            bodyA.ax += bodyA.thrustForce.x;
            bodyA.ay += bodyA.thrustForce.y;
            // Reset thrust after application
            if(bodyA.thrustForce.x !== 0 || bodyA.thrustForce.y !== 0) {
               bodyA.thrustForce = {x: 0, y: 0};
            }

            newBodies.forEach(bodyB => {
                if (bodyA.id !== bodyB.id) {
                    const dx = bodyB.x - bodyA.x;
                    const dy = bodyB.y - bodyA.y;
                    const distSq = dx * dx + dy * dy;
                    const dist = Math.sqrt(distSq);
                    
                    if (dist < 5) return; // Avoid singularity
                    
                    // Custom Inverse Power Law
                    const forceMag = G * bodyB.mass / (dist ** inversePower); 
                    
                    bodyA.ax += forceMag * dx / dist;
                    bodyA.ay += forceMag * dy / dist;
                }
            });
        });

        // 2. Integration (Euler)
        newBodies.forEach(body => {
            body.vx += body.ax * dt;
            body.vy += body.ay * dt;
            body.x += body.vx * dt;
            body.y += body.vy * dt;
            
            // Update Trail
            body.trail.push({x: body.x, y: body.y});
            if (body.trail.length > 500) body.trail.shift();
        });

        return newBodies;
    }, [G, inversePower, dt]);

    // Draw Function
    const drawSimulation = useCallback((currentBodies: Body[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);
        
        currentBodies.forEach(body => {
            // Draw Trail
            ctx.strokeStyle = body.color + '50'; // Transparent trail
            ctx.lineWidth = 1;
            ctx.beginPath();
            body.trail.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();

            // Draw Body
            ctx.fillStyle = body.color;
            ctx.beginPath();
            const radius = Math.max(3, body.mass / 10);
            ctx.arc(body.x, body.y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw Gravitational Vector (Simplified)
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(body.x, body.y);
            ctx.lineTo(body.x + body.ax * 100, body.y + body.ay * 100);
            ctx.stroke();
            
            // Highlight selected body
            if (body.id === selectedBodyId) {
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    }, [selectedBodyId]);

    // Animation Loop
    useEffect(() => {
        if (!isRunning) return;

        const animate = () => {
            setBodies(prevBodies => updatePhysics(prevBodies));
        };
        reqRef.current = requestAnimationFrame(function loop() {
             animate();
             reqRef.current = requestAnimationFrame(loop);
        });
        return () => cancelAnimationFrame(reqRef.current);
    }, [isRunning, updatePhysics]);

    // Separate Draw Loop
    useEffect(() => {
        drawSimulation(bodies);
    }, [bodies, drawSimulation]);
    
    // UI Handlers
    const handleReset = () => {
        setIsRunning(false);
        const initialBodies = [
            new Body(1, 100, 400, 250, 0, 0, '#f59e0b'), 
            new Body(2, 5, 550, 250, 0, 1.5, '#3b82f6'), 
            new Body(3, 2, 650, 250, 0, 1.0, '#10b981'),
        ];
        setBodies(initialBodies);
        drawSimulation(initialBodies);
        setAiAnalysis('');
    };
    
    const handleApplyThrust = (forceX: number, forceY: number) => {
        if (!selectedBodyId) return;
        setBodies(prev => prev.map(body => {
            if (body.id === selectedBodyId) {
                const nb = new Body(body.id, body.mass, body.x, body.y, body.vx, body.vy, body.color);
                nb.trail = body.trail;
                nb.thrustForce = {x: forceX, y: forceY};
                nb.ax = body.ax; nb.ay = body.ay;
                return nb;
            }
            return body;
        }));
    };
    
    const selectedBody = bodies.find(b => b.id === selectedBodyId);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const summary = `Orbits: Bodies=${bodies.length}, G=${G}, Law=1/r^${inversePower}`;
        const result = await analyzeExperimentData("Gravitational Orbits", { G, inversePower }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
            
            {/* CỘT THAM SỐ (LEFT PANEL) */}
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
                    <Gavel size={20} className="text-orange-500" /> Luật Vật Lý & Điều Khiển
                </div>
                
                {/* Bộ Điều khiển Hấp dẫn */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner space-y-3">
                   <label className="text-xs text-slate-400 block mb-1">Hằng số Hấp dẫn (G) ({G.toFixed(2)})</label>
                   <input type="range" min="0.1" max="1.0" step="0.05" value={G} onChange={(e) => setG(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-orange-500 cursor-pointer" />
                   
                   <label className="text-xs text-slate-400 block mb-1">Luật Nghịch đảo ({inversePower.toFixed(1)}): $1/r^{inversePower.toFixed(1)}$</label>
                   <input type="range" min="1.0" max="3.0" step="0.1" value={inversePower} onChange={(e) => setInversePower(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-red-500 cursor-pointer" />
                   <p className='text-xs text-red-400 italic'>$1/r^2$ là hấp dẫn Newton. $1/r^3$ $\rightarrow$ Quỹ đạo hỗn loạn/xoắn.</p>
                </div>

                {/* Công cụ Động cơ Phản lực (Thruster Tool) */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner space-y-3">
                   <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1"><Send size={14}/> Động Cơ Phản Lực</h3>
                   <select value={selectedBodyId || ''} onChange={(e) => setSelectedBodyId(Number(e.target.value))} className="w-full p-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:ring-sky-500 focus:border-sky-500 text-sm">
                       <option value="">-- Chọn Thiên thể --</option>
                       {bodies.map(b => <option key={b.id} value={b.id}>Body {b.id} (M={b.mass})</option>)}
                   </select>
                   
                   <div className="grid grid-cols-3 gap-1">
                       <button onClick={() => handleApplyThrust(0, -5)} disabled={!selectedBodyId} className="col-span-3 py-1 bg-sky-600 hover:bg-sky-500 rounded-lg text-xs disabled:opacity-30">Lên</button>
                       <button onClick={() => handleApplyThrust(-5, 0)} disabled={!selectedBodyId} className="py-1 bg-sky-600 hover:bg-sky-500 rounded-lg text-xs disabled:opacity-30">Trái</button>
                       <button onClick={() => handleApplyThrust(0, 0)} disabled={!selectedBodyId} className="py-1 bg-slate-500 rounded-lg text-xs disabled:opacity-30">Reset</button>
                       <button onClick={() => handleApplyThrust(5, 0)} disabled={!selectedBodyId} className="py-1 bg-sky-600 hover:bg-sky-500 rounded-lg text-xs disabled:opacity-30">Phải</button>
                       <button onClick={() => handleApplyThrust(0, 5)} disabled={!selectedBodyId} className="col-span-3 py-1 bg-sky-600 hover:bg-sky-500 rounded-lg text-xs disabled:opacity-30">Xuống</button>
                   </div>
                </div>

                {/* Bảng phân tích Quỹ đạo */}
                <div className="p-3 bg-slate-700 rounded-xl shadow-lg border-l-4 border-teal-400 mt-auto">
                    <p className="text-sm font-bold text-white mb-1"><Zap size={14} className='inline mr-1'/> Phân Tích Quỹ Đạo</p>
                    {selectedBody ? (
                        <div className='text-xs space-y-1'>
                            <p>Vận tốc: V=({selectedBody.vx.toFixed(2)}, {selectedBody.vy.toFixed(2)})</p>
                            <p>Gia tốc: A=({selectedBody.ax.toFixed(2)}, {selectedBody.ay.toFixed(2)})</p>
                            <p>Độ lệch tâm (E): $0.5$ (Giả lập)</p>
                            <p className='text-yellow-300'>Định luật Kepler 2: Vận tốc khu vực tăng gần Sao Trung tâm.</p>
                        </div>
                    ) : (
                        <p className='text-xs text-slate-400 italic'>Chọn một thiên thể để xem thông số.</p>
                    )}
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
                            {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Tạm Dừng' : 'Chạy Mô Phỏng'}
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
                        Mô phỏng Hệ {bodies.length}-Thiên thể. Luật Hấp dẫn: $1/r^{inversePower.toFixed(1)}$
                    </div>
                    {/* Barycenter Visualization (Tâm Hợp) */}
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-white/50 -translate-x-1/2 -translate-y-1/2 animate-pulse" title="Tâm Hợp (Barycenter)"></div>
                </div>
            </div>
        </div>
    );
};

const FluidsArchimedesLab = ({ lang }: { lang: Language }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [fluidDensity, setFluidDensity] = useState(1000); // Mật độ chất lỏng (kg/m^3)
    const [viscosity, setViscosity] = useState(0.1); // Độ nhớt
    const [objectDensity, setObjectDensity] = useState(500); // Mật độ vật thể
    const [objectVolume, setObjectVolume] = useState(1); // Thể tích vật thể
    const [time, setTime] = useState(0);
    const [flowMode, setFlowMode] = useState('buoyancy'); // buoyancy or bernoulli
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);
    
    const g = 9.8; // Trọng lực

    // Object State (for Buoyancy Mode)
    const [objY, setObjY] = useState(50); // Vị trí Y của vật thể
    const [objVy, setObjVy] = useState(0); // Vận tốc Y của vật thể

    // Physics Calculation (Buoyancy/Falling)
    const updateBuoyancy = useCallback(() => {
        const objMass = objectDensity * objectVolume;
        const buoyancyForce = fluidDensity * objectVolume * g; // Lực nổi
        const gravityForce = objMass * g; // Trọng lực
        
        // Lực cản (Drag Force - simplified)
        const dragForce = viscosity * objVy * 0.5; 
        
        const netForce = buoyancyForce - gravityForce - dragForce;
        const objAy = netForce / objMass;
        
        const dt = 0.05;
        const newVy = objVy + objAy * dt;
        let newY = objY + newVy * dt;

        // Check boundaries (water level at Y=300)
        if (newY >= 300) {
            newY = 300;
            // Damping/Bounce logic here if needed
            if (objectDensity > fluidDensity) {
                // Sinking to the bottom (Y=450)
                newY = Math.min(450, newY + newVy * dt);
            } else {
                // Floating at the surface
                newY = 300 - 50; // Object size is 50px
                setObjVy(0);
                return;
            }
        }
        
        setObjVy(newVy);
        setObjY(newY);

    }, [fluidDensity, viscosity, objectDensity, objectVolume, objY, objVy, g]);

    // Draw Function
    const drawSimulation = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const waterLevel = 300;
        const centerX = W / 2;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);
        
        // 1. Draw Fluid (Chất lỏng)
        // Fluid color based on density and viscosity
        const fluidColor = `rgba(30, 64, 175, ${fluidDensity / 1500 * 0.8})`;
        ctx.fillStyle = fluidColor;
        ctx.fillRect(0, waterLevel, W, H - waterLevel);
        
        // Water surface
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, waterLevel);
        ctx.lineTo(W, waterLevel);
        ctx.stroke();

        if (flowMode === 'buoyancy') {
            // 2. Draw Object (Vật thể)
            const objSize = objectVolume * 50; // Visual size
            const objColor = objectDensity > fluidDensity ? '#ef4444' : '#34d399';
            ctx.fillStyle = objColor;
            ctx.fillRect(centerX - objSize / 2, objY, objSize, objSize);
            ctx.strokeStyle = 'white';
            ctx.strokeRect(centerX - objSize / 2, objY, objSize, objSize);

            // 3. Draw Force Vectors
            const mag = 10;
            const F_b = fluidDensity * objectVolume * g * mag / 100;
            const F_g = objectDensity * objectVolume * g * mag / 100;

            // Buoyancy Force (Up)
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX + 30, objY + objSize / 2);
            ctx.lineTo(centerX + 30, objY + objSize / 2 - F_b);
            ctx.stroke();
            
            // Gravity Force (Down)
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX - 30, objY + objSize / 2);
            ctx.lineTo(centerX - 30, objY + objSize / 2 + F_g);
            ctx.stroke();
            
            // Text annotations
            ctx.fillStyle = '#34d399'; ctx.font = '12px Inter'; ctx.fillText('F_Nổi', centerX + 35, objY + objSize / 2 - F_b - 5);
            ctx.fillStyle = '#f87171'; ctx.font = '12px Inter'; ctx.fillText('F_Trọng', centerX - 60, objY + objSize / 2 + F_g + 15);

        } else if (flowMode === 'bernoulli') {
            // Bernoulli Flow Mode (Mock Venturi Tube)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(centerX - 100, 100, 200, 150);
            
            // Venturi Tube Shape
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX - 100, 150);
            ctx.lineTo(centerX - 50, 150);
            ctx.lineTo(centerX - 20, 100);
            ctx.lineTo(centerX + 20, 100);
            ctx.lineTo(centerX + 50, 150);
            ctx.lineTo(centerX + 100, 150);
            ctx.stroke();
            
            // Flow visualization (Velocity/Color Map)
            ctx.fillStyle = '#3b82f6';
            ctx.font = 'bold 12px Inter';
            ctx.fillText('Áp suất cao (Tốc độ thấp)', centerX - 100, 90);
            ctx.fillStyle = '#f59e0b';
            ctx.fillText('Áp suất thấp (Tốc độ cao)', centerX - 40, 60);

        }

    }, [fluidDensity, objectDensity, objectVolume, objY, flowMode, g]);

    // Animation Loop
    useEffect(() => {
        if (!isRunning || flowMode !== 'buoyancy') return;

        const animate = () => {
            updateBuoyancy();
            drawSimulation();
            reqRef.current = requestAnimationFrame(animate);
        };

        reqRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(reqRef.current);
    }, [isRunning, updateBuoyancy, drawSimulation, flowMode]);
    
    useEffect(() => {
        drawSimulation();
    }, [drawSimulation]);

    const handleReset = () => {
        setIsRunning(false);
        setObjY(50);
        setObjVy(0);
        setTime(0);
        drawSimulation();
        setAiAnalysis('');
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const summary = `Fluids: Mode=${flowMode}, Fluid Density=${fluidDensity}, Obj Density=${objectDensity}, Viscosity=${viscosity}`;
        const result = await analyzeExperimentData("Archimedes Fluids", { flowMode, fluidDensity, objectDensity }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
            
            {/* CỘT THAM SỐ (LEFT PANEL) */}
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
                    <Droplet size={20} className="text-blue-500" /> Cấu Hình Chất Lỏng & Vật Thể
                </div>
                
                {/* Mode Selector */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                    <label className="text-xs text-slate-400 block mb-2">Chế độ Mô phỏng</label>
                    <select 
                        value={flowMode} 
                        onChange={(e) => setFlowMode(e.target.value)} 
                        className="w-full p-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                        <option value="buoyancy">Lực Nổi Archimedes</option>
                        <option value="bernoulli">Dòng Chảy Bernoulli</option>
                    </select>
                </div>
                
                {/* Control: Fluid Density */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Mật độ Chất lỏng ($\rho_f$) ({fluidDensity.toFixed(0)} kg/m\u00b3)</label>
                   <input type="range" min="100" max="2000" step="50" value={fluidDensity} onChange={(e) => setFluidDensity(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-blue-500 cursor-pointer" />
                </div>
                
                {/* Control: Viscosity */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Độ nhớt ($\eta$) ({viscosity.toFixed(2)})</label>
                   <input type="range" min="0.01" max="1" step="0.05" value={viscosity} onChange={(e) => setViscosity(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-cyan-500 cursor-pointer" />
                </div>

                {/* Control: Object Density (Buoyancy Mode) */}
                {flowMode === 'buoyancy' && (
                    <div className="p-3 bg-slate-900 rounded-xl shadow-inner border-l-4 border-yellow-500">
                       <label className="text-xs text-slate-400 block mb-1">Mật độ Vật thể ($\rho_o$) ({objectDensity.toFixed(0)} kg/m\u00b3)</label>
                       <input type="range" min="100" max="2000" step="50" value={objectDensity} onChange={(e) => setObjectDensity(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-yellow-500 cursor-pointer" />
                       <p className={`mt-1 text-xs font-bold ${objectDensity < fluidDensity ? 'text-green-400' : 'text-red-400'}`}>
                           Vật thể sẽ {objectDensity < fluidDensity ? 'NỔI' : 'CHÌM'}
                       </p>
                    </div>
                )}
                
                {/* Phân tích Lực nổi */}
                <div className="p-3 bg-slate-700 rounded-xl shadow-lg border-l-4 border-white mt-auto">
                    <p className="text-sm font-bold text-white mb-1"><Zap size={14} className='inline mr-1'/> Lực Nổi & Trọng Lực</p>
                    <div className='text-xs space-y-1 font-mono'>
                        <p className='text-green-400'>Lực Nổi ($F_b$): {(fluidDensity * objectVolume * g).toFixed(1)} N</p>
                        <p className='text-red-400'>Trọng Lực ($F_g$): {(objectDensity * objectVolume * g).toFixed(1)} N</p>
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
                        <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50" disabled={flowMode !== 'buoyancy'}>
                            {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Tạm Dừng' : 'Thả Vật Thể'}
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
                        {flowMode === 'buoyancy' ? 'Mô Phỏng Lực Nổi' : 'Phân Tích Dòng Chảy Bernoulli'}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PRESERVED INCLINED PLANE COMPONENT (Since not provided in new update) ---
const InclinedPlaneLab = ({ lang }: { lang: Language }) => {
    const [angle, setAngle] = useState(30);
    const [mass, setMass] = useState(5);
    const [friction, setFriction] = useState(0.3);
    const [blockPos, setBlockPos] = useState(0); 
    const [isRunning, setIsRunning] = useState(false);
    const reqRef = useRef(0);

    const forces = calculateInclinedForces(mass, angle, friction);

    useEffect(() => {
        if (!isRunning) return;
        const animate = () => {
            if (forces.acceleration > 0) {
               setBlockPos(p => Math.min(p + forces.acceleration * 0.05, 100));
            }
            reqRef.current = requestAnimationFrame(animate);
        };
        reqRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(reqRef.current);
    }, [isRunning, forces.acceleration]);

    return (
        <div className="h-full flex flex-col bg-slate-900 rounded-xl border border-slate-700 p-4">
            <div className="flex gap-4 p-4 bg-slate-800 rounded-lg mb-4 items-center">
                <div>
                    <label className="text-xs text-slate-400">Angle</label>
                    <input type="range" min="0" max="60" value={angle} onChange={e => setAngle(Number(e.target.value))} className="w-full"/>
                </div>
                <button onClick={() => setIsRunning(!isRunning)} className="px-4 py-2 bg-blue-600 rounded text-white text-sm">{isRunning ? 'Pause' : 'Start'}</button>
                <button onClick={() => { setIsRunning(false); setBlockPos(0); }} className="px-4 py-2 bg-slate-600 rounded text-white text-sm">Reset</button>
            </div>
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                <div className="relative w-96 h-64 border-b-4 border-slate-500">
                    <div 
                        className="absolute bottom-0 left-0 h-2 bg-slate-500 origin-bottom-left w-[120%]"
                        style={{ transform: `rotate(-${angle}deg)` }}
                    ></div>
                    <div 
                        className="absolute bottom-0 left-0 w-16 h-16 bg-blue-500 rounded border border-blue-400 flex items-center justify-center text-xs font-bold text-white shadow-lg transition-transform z-10"
                        style={{ 
                        transform: `rotate(-${angle}deg) translateX(${blockPos * 3}px) translateY(-100%)`, 
                        transformOrigin: 'bottom left'
                        }}
                    >
                        {mass}kg
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN EXPORT COMPONENT ---

export const MechanicsLab: React.FC<MechanicsLabProps> = ({ mode, lang }) => {
  if (mode === AppMode.SIM_RUN_ORBITS) {
    return <MechanicsOrbits lang={lang} />;
  }
  if (mode === AppMode.SIM_RUN_FLUIDS) {
    return <FluidsArchimedesLab lang={lang} />;
  }
  if (mode === AppMode.SIM_RUN_INCLINED) {
    return <InclinedPlaneLab lang={lang} />;
  }
  return <div className="p-10 text-center text-slate-500">Mode not found</div>;
};