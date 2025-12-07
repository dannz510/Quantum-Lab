
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Play, Pause, RotateCcw, Send, Zap, Gavel, Droplet, Triangle, Sparkles, Loader2, X, Move, ChevronDown, ChevronUp, Activity, Ruler, ArrowDown, ArrowUp, Plus, Minus } from 'lucide-react';
import { calculateInclinedForces } from '../services/physics';
import { analyzeExperimentData } from '../services/gemini';
import { AppMode, Language } from '../types';

interface MechanicsLabProps {
  mode: AppMode;
  lang: Language;
}

// --- ORBITS LAB ---
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
    const [G, setG] = useState(0.5);
    const [inversePower, setInversePower] = useState(2);
    const [selectedBodyId, setSelectedBodyId] = useState<number | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);
    const dt = 0.05;

    useEffect(() => {
        const initialBodies = [
            new Body(1, 100, 400, 250, 0, 0, '#f59e0b'), // Star
            new Body(2, 5, 550, 250, 0, 1.5, '#3b82f6'),   // Planet 1
            new Body(3, 2, 650, 250, 0, 1.0, '#10b981'),   // Planet 2
        ];
        setBodies(initialBodies);
    }, []);

    const updatePhysics = useCallback((currentBodies: Body[]) => {
        const newBodies = currentBodies.map(b => {
            const nb = new Body(b.id, b.mass, b.x, b.y, b.vx, b.vy, b.color);
            nb.trail = [...b.trail];
            nb.thrustForce = b.thrustForce;
            return nb;
        });
        
        newBodies.forEach(bodyA => {
            bodyA.ax = 0;
            bodyA.ay = 0;
            bodyA.ax += bodyA.thrustForce.x;
            bodyA.ay += bodyA.thrustForce.y;
            if(bodyA.thrustForce.x !== 0 || bodyA.thrustForce.y !== 0) {
               bodyA.thrustForce = {x: 0, y: 0};
            }

            newBodies.forEach(bodyB => {
                if (bodyA.id !== bodyB.id) {
                    const dx = bodyB.x - bodyA.x;
                    const dy = bodyB.y - bodyA.y;
                    const distSq = dx * dx + dy * dy;
                    const dist = Math.sqrt(distSq);
                    if (dist < 5) return;
                    const forceMag = G * bodyB.mass / (dist ** inversePower); 
                    bodyA.ax += forceMag * dx / dist;
                    bodyA.ay += forceMag * dy / dist;
                }
            });
        });

        newBodies.forEach(body => {
            body.vx += body.ax * dt;
            body.vy += body.ay * dt;
            body.x += body.vx * dt;
            body.y += body.vy * dt;
            body.trail.push({x: body.x, y: body.y});
            if (body.trail.length > 500) body.trail.shift();
        });

        return newBodies;
    }, [G, inversePower]);

    const drawSimulation = useCallback((currentBodies: Body[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);
        
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for(let i=0; i<W; i+=50) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,H); ctx.stroke();}
        for(let i=0; i<H; i+=50) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(W,i); ctx.stroke();}

        currentBodies.forEach(body => {
            ctx.strokeStyle = body.color + '50';
            ctx.lineWidth = 2;
            ctx.beginPath();
            body.trail.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();

            ctx.shadowBlur = 10;
            ctx.shadowColor = body.color;
            ctx.fillStyle = body.color;
            ctx.beginPath();
            const radius = Math.max(3, body.mass / 8);
            ctx.arc(body.x, body.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            if (body.id === selectedBodyId) {
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(body.x, body.y, radius + 5, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.strokeStyle = '#34d399';
                ctx.beginPath();
                ctx.moveTo(body.x, body.y);
                ctx.lineTo(body.x + body.vx * 20, body.y + body.vy * 20);
                ctx.stroke();
            }
        });
    }, [selectedBodyId]);

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

    useEffect(() => {
        drawSimulation(bodies);
    }, [bodies, drawSimulation]);
    
    const handleApplyThrust = (fx: number, fy: number) => {
        if (!selectedBodyId) return;
        setBodies(prev => prev.map(body => {
            if (body.id === selectedBodyId) {
                const nb = new Body(body.id, body.mass, body.x, body.y, body.vx, body.vy, body.color);
                nb.trail = body.trail;
                nb.thrustForce = {x: fx, y: fy};
                nb.ax = body.ax; nb.ay = body.ay;
                return nb;
            }
            return body;
        }));
    };
    
    const selectedBody = bodies.find(b => b.id === selectedBodyId);
    
    // Telemetry Calculations
    const getTelemetry = () => {
        if (!selectedBody) return null;
        const centralStar = bodies.find(b => b.id === 1);
        const distToStar = centralStar ? Math.sqrt((selectedBody.x - centralStar.x)**2 + (selectedBody.y - centralStar.y)**2) : 0;
        const speed = Math.sqrt(selectedBody.vx**2 + selectedBody.vy**2);
        return { dist: distToStar, speed };
    };
    const telemetry = getTelemetry();

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const summary = `Orbits: Bodies=${bodies.length}, G=${G}, Law=1/r^${inversePower}`;
        const result = await analyzeExperimentData("Gravitational Orbits", { G, inversePower }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
                    <Gavel size={20} className="text-orange-500" /> Hệ Thống Điều Khiển
                </div>
                
                <div className="p-3 bg-slate-900 rounded-xl space-y-3">
                   <label className="text-xs text-slate-400 block mb-1">Hằng số Hấp dẫn (G) ({G.toFixed(2)})</label>
                   <input type="range" min="0.1" max="1.0" step="0.05" value={G} onChange={(e) => setG(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-orange-500" />
                   <label className="text-xs text-slate-400 block mb-1">Luật Nghịch đảo ({inversePower.toFixed(1)})</label>
                   <input type="range" min="1.0" max="3.0" step="0.1" value={inversePower} onChange={(e) => setInversePower(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-red-500" />
                </div>

                <div className="p-3 bg-slate-900 rounded-xl space-y-3">
                   <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1"><Send size={14}/> Động Cơ Phản Lực</h3>
                   <select value={selectedBodyId || ''} onChange={(e) => setSelectedBodyId(Number(e.target.value))} className="w-full p-2 rounded-lg bg-slate-700 text-sm">
                       <option value="">-- Chọn Thiên thể --</option>
                       {bodies.map(b => <option key={b.id} value={b.id}>Thiên thể {b.id} ({b.id === 1 ? 'Sao' : 'Hành tinh'})</option>)}
                   </select>
                   <div className="grid grid-cols-3 gap-1">
                       <div/>
                       <button onClick={() => handleApplyThrust(0, -5)} disabled={!selectedBodyId} className="py-1 bg-sky-600 rounded text-xs hover:bg-sky-500"><ArrowUp size={12} className="mx-auto"/></button>
                       <div/>
                       <button onClick={() => handleApplyThrust(-5, 0)} disabled={!selectedBodyId} className="py-1 bg-sky-600 rounded text-xs hover:bg-sky-500"><ArrowUp size={12} className="-rotate-90 mx-auto"/></button>
                       <div className="flex items-center justify-center text-xs text-slate-500">PUSH</div>
                       <button onClick={() => handleApplyThrust(5, 0)} disabled={!selectedBodyId} className="py-1 bg-sky-600 rounded text-xs hover:bg-sky-500"><ArrowUp size={12} className="rotate-90 mx-auto"/></button>
                       <div/>
                       <button onClick={() => handleApplyThrust(0, 5)} disabled={!selectedBodyId} className="py-1 bg-sky-600 rounded text-xs hover:bg-sky-500"><ArrowDown size={12} className="mx-auto"/></button>
                       <div/>
                   </div>
                </div>

                <div className="pt-4 border-t border-slate-700 mt-auto flex flex-col gap-4">
                     {aiAnalysis ? (
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-3 text-sm text-slate-200 relative">
                            <button onClick={() => setAiAnalysis('')} className="absolute top-1 right-1 text-slate-400"><X size={14}/></button>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                <p className="whitespace-pre-wrap">{aiAnalysis}</p>
                            </div>
                        </div>
                     ) : (
                        <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs flex items-center justify-center gap-2">
                           {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} AI Phân Tích
                        </button>
                     )}
                     <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2">
                         {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Tạm Dừng' : 'Chạy'}
                     </button>
                </div>
            </div>

            <div className="lg:col-span-9 flex flex-col gap-4">
                <div className="flex-1 bg-black rounded-xl border border-slate-700 overflow-hidden relative shadow-2xl">
                    <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
                    {selectedBody && telemetry && (
                        <div className="absolute top-4 right-4 bg-slate-900/80 border border-slate-700 p-4 rounded-lg backdrop-blur-sm w-64">
                            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{backgroundColor: selectedBody.color}}></span>
                                Telemetry: Body {selectedBody.id}
                            </h4>
                            <div className="space-y-2 text-xs font-mono text-slate-300">
                                <div className="flex justify-between"><span>Speed:</span> <span className="text-emerald-400">{telemetry.speed.toFixed(2)} px/t</span></div>
                                <div className="flex justify-between"><span>Dist to Star:</span> <span className="text-blue-400">{telemetry.dist.toFixed(1)} px</span></div>
                                <div className="flex justify-between"><span>Vector X:</span> <span>{selectedBody.vx.toFixed(3)}</span></div>
                                <div className="flex justify-between"><span>Vector Y:</span> <span>{selectedBody.vy.toFixed(3)}</span></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- FLUIDS LAB ---
const FluidsArchimedesLab = ({ lang }: { lang: Language }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [fluidDensity, setFluidDensity] = useState(1000); 
    const [viscosity, setViscosity] = useState(0.1); 
    const [objectDensity, setObjectDensity] = useState(500); 
    const [objectVolume, setObjectVolume] = useState(1); 
    const [objY, setObjY] = useState(50); 
    const [objVy, setObjVy] = useState(0); 
    const [splashParticles, setSplashParticles] = useState<{x: number, y: number, vx: number, vy: number, life: number}[]>([]);
    const [waterLevelOffset, setWaterLevelOffset] = useState(0);

    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);
    const g = 9.8; 
    const baseWaterLevel = 300;

    const updatePhysics = useCallback(() => {
        // Particles
        setSplashParticles(prev => prev.map(p => ({
            x: p.x + p.vx,
            y: p.y + p.vy,
            vx: p.vx,
            vy: p.vy + 0.5, // gravity
            life: p.life - 1
        })).filter(p => p.life > 0));
        
        // Water Level relaxation
        setWaterLevelOffset(prev => prev * 0.95);

        // Object Physics
        const objMass = objectDensity * objectVolume;
        let forceBuoyancy = 0;
        let forceDrag = 0;
        
        // Check immersion
        const objH = objectVolume * 50; 
        const submergedH = Math.max(0, Math.min(objH, (objY + objH) - (baseWaterLevel + waterLevelOffset)));
        const submergedRatio = submergedH / objH;

        if (submergedRatio > 0) {
            forceBuoyancy = fluidDensity * objectVolume * g * submergedRatio;
            forceDrag = 0.5 * fluidDensity * objVy * Math.abs(objVy) * viscosity * objectVolume * 0.1; 
        }

        const forceGravity = objMass * g;
        const realAcc = (forceGravity - forceBuoyancy - (objVy * Math.abs(objVy) * viscosity * 5)) / objMass;
        
        const dt = 0.05;
        let nextVy = objVy + realAcc * dt;
        let nextY = objY + nextVy * dt;
        
        // Splash Trigger
        if (objY + objH < baseWaterLevel && nextY + objH >= baseWaterLevel) {
            const splashCount = Math.min(20, Math.abs(nextVy) * 2);
            const newParticles = [];
            for(let i=0; i<splashCount; i++) {
                newParticles.push({
                    x: 400 + (Math.random()-0.5) * objH,
                    y: baseWaterLevel,
                    vx: (Math.random()-0.5) * 10,
                    vy: -Math.random() * 10 - Math.abs(nextVy)*0.5,
                    life: 30 + Math.random() * 20
                });
            }
            setSplashParticles(prev => [...prev, ...newParticles]);
            setWaterLevelOffset(Math.min(20, Math.abs(nextVy) * 2));
        }

        if (nextY > 450 - objH) { 
            nextY = 450 - objH;
            nextVy = -nextVy * 0.2; 
        }

        setObjVy(nextVy);
        setObjY(nextY);

    }, [fluidDensity, viscosity, objectDensity, objectVolume, objY, objVy, waterLevelOffset]);

    const drawSimulation = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const centerX = W / 2;
        const currentWaterLevel = baseWaterLevel + waterLevelOffset;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);
        
        const gradient = ctx.createLinearGradient(0, currentWaterLevel, 0, H);
        gradient.addColorStop(0, `rgba(59, 130, 246, 0.6)`);
        gradient.addColorStop(1, `rgba(30, 64, 175, 0.9)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, currentWaterLevel, W, H - currentWaterLevel);
        
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, currentWaterLevel);
        for(let x=0; x<=W; x+=10) {
            ctx.lineTo(x, currentWaterLevel + Math.sin(x*0.05 + Date.now()*0.005)*3);
        }
        ctx.stroke();

        const objSize = objectVolume * 50;
        ctx.fillStyle = objectDensity < fluidDensity ? '#fbbf24' : '#ef4444'; 
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.fillRect(centerX - objSize/2, objY, objSize, objSize);
        ctx.strokeRect(centerX - objSize/2, objY, objSize, objSize);
        
        ctx.fillStyle = '#bae6fd';
        splashParticles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, (p.life/50)*3, 0, Math.PI*2);
            ctx.fill();
        });

        const scale = 2;
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath(); ctx.moveTo(centerX, objY+objSize/2); ctx.lineTo(centerX, objY+objSize/2 + (objectDensity*objectVolume*g/200)*scale); ctx.stroke();
        if (objY + objSize > currentWaterLevel) {
             const submerged = Math.min(objSize, (objY+objSize) - currentWaterLevel);
             const bForce = fluidDensity * (submerged/objSize*objectVolume) * g;
             ctx.strokeStyle = '#10b981';
             ctx.beginPath(); ctx.moveTo(centerX-10, objY+objSize/2); ctx.lineTo(centerX-10, objY+objSize/2 - (bForce/200)*scale); ctx.stroke();
        }

    }, [fluidDensity, objectDensity, objectVolume, objY, splashParticles, waterLevelOffset]);

    useEffect(() => {
        if (!isRunning) return;
        const animate = () => {
            updatePhysics();
            drawSimulation();
            reqRef.current = requestAnimationFrame(animate);
        };
        reqRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(reqRef.current);
    }, [isRunning, updatePhysics, drawSimulation]);
    
    useEffect(() => {
        drawSimulation();
    }, [drawSimulation]);

    const handleReset = () => {
        setIsRunning(false);
        setObjY(50);
        setObjVy(0);
        setSplashParticles([]);
        setWaterLevelOffset(0);
        drawSimulation();
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const summary = `Fluids: Fluid Density=${fluidDensity}, Obj Density=${objectDensity}, Submerged=${objY > 250}, Velocity=${objVy.toFixed(2)}`;
        const result = await analyzeExperimentData("Archimedes Fluids", { fluidDensity, objectDensity }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4">
                <div className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-2">
                    <Droplet size={20} className="text-blue-500" /> Tham Số Chất Lỏng
                </div>
                
                <div className="p-3 bg-slate-900 rounded-xl space-y-3">
                   <label className="text-xs text-slate-400 block">Mật độ Chất lỏng ($\rho_f$) ({fluidDensity})</label>
                   <input type="range" min="100" max="2000" step="50" value={fluidDensity} onChange={(e) => setFluidDensity(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-blue-500" />
                   
                   <label className="text-xs text-slate-400 block">Độ nhớt ($\eta$) ({viscosity})</label>
                   <input type="range" min="0.01" max="0.5" step="0.01" value={viscosity} onChange={(e) => setViscosity(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-cyan-500" />
                </div>
                
                <div className="p-3 bg-slate-900 rounded-xl space-y-3 border-l-4 border-yellow-500">
                    <h3 className="text-xs font-bold text-yellow-500">Vật Thể</h3>
                    <label className="text-xs text-slate-400 block">Mật độ ($\rho_o$) ({objectDensity})</label>
                    <input type="range" min="100" max="2000" step="50" value={objectDensity} onChange={(e) => setObjectDensity(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-yellow-500" />
                    <p className={`text-xs font-bold ${objectDensity < fluidDensity ? 'text-green-400' : 'text-red-400'}`}>
                       {objectDensity < fluidDensity ? 'SẼ NỔI' : 'SẼ CHÌM'}
                    </p>
                </div>

                <div className="p-3 bg-slate-700 rounded-xl mt-auto shadow-lg">
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2"><Activity size={14}/> Data Monitor</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="text-slate-400">Velocity:</div> <div className="text-right text-blue-300">{objVy.toFixed(2)} m/s</div>
                        <div className="text-slate-400">F_net:</div> <div className="text-right text-purple-300">{((objectDensity*objectVolume*g) - (Math.min(1, (objY+objectVolume*50-baseWaterLevel)/(objectVolume*50))*fluidDensity*objectVolume*g)).toFixed(0)} N</div>
                        <div className="text-slate-400">Depth:</div> <div className="text-right text-teal-300">{Math.max(0, objY - baseWaterLevel).toFixed(1)} px</div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                    {aiAnalysis ? (
                        <div className="bg-purple-900/30 p-2 rounded text-xs relative">
                           <button onClick={() => setAiAnalysis('')} className="absolute top-1 right-1"><X size={12}/></button>
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
                            {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Dừng' : 'Thả'}
                        </button>
                        <button onClick={handleReset} className="p-2 bg-slate-700 rounded-xl hover:bg-slate-600 text-white"><RotateCcw size={16}/></button>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 overflow-hidden relative shadow-2xl">
                <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
            </div>
        </div>
    );
};

// --- INCLINED PLANE LAB ---
const InclinedPlaneLab = ({ lang }: { lang: Language }) => {
    const [angle, setAngle] = useState(30);
    const [mass, setMass] = useState(5);
    const [frictionMu, setFrictionMu] = useState(0.3);
    const [appliedForce, setAppliedForce] = useState(0); 
    
    const [isRunning, setIsRunning] = useState(false);
    const [time, setTime] = useState(0);
    const [pos, setPos] = useState(0);
    const [velocity, setVelocity] = useState(0);
    
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const reqRef = useRef(0);

    const g = 9.81;
    const rad = angle * Math.PI / 180;
    const F_g = mass * g;
    const F_gx = F_g * Math.sin(rad); 
    const F_gy = F_g * Math.cos(rad); 
    const Normal = F_gy;
    const MaxFriction = Normal * frictionMu;
    
    useEffect(() => {
        if (!isRunning) return;
        
        const dt = 0.02;
        const update = () => {
            let frictionForce = 0;
            const netNonFriction = appliedForce - F_gx;
            
            if (Math.abs(velocity) < 0.01) {
                if (Math.abs(netNonFriction) <= MaxFriction) {
                    frictionForce = -netNonFriction; 
                } else {
                    frictionForce = -Math.sign(netNonFriction) * MaxFriction;
                }
            } else {
                frictionForce = -Math.sign(velocity) * MaxFriction;
            }
            
            const F_net = netNonFriction + frictionForce;
            const acc = F_net / mass;
            
            setVelocity(v => v + acc * dt);
            setPos(p => {
                const next = p + velocity * dt;
                if (next < 0) { setVelocity(0); return 0; } 
                if (next > 20) { setVelocity(0); return 20; } 
                return next;
            });
            setTime(t => t + dt);
            
            reqRef.current = requestAnimationFrame(update);
        };
        reqRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(reqRef.current);
    }, [isRunning, velocity, appliedForce, F_gx, MaxFriction, mass]);

    const handleReset = () => {
        setIsRunning(false);
        setPos(0);
        setVelocity(0);
        setTime(0);
        setAppliedForce(0);
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const summary = `Inclined Plane: Angle=${angle}, Mass=${mass}, Friction=${frictionMu}, AppliedForce=${appliedForce}, Acc=${(appliedForce - F_gx) / mass} approx`;
        const result = await analyzeExperimentData("Inclined Plane", { angle, mass, frictionMu }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4">
                 <div className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-2">
                    <Triangle size={20} className="text-emerald-500" /> Động Lực Học Dốc Nghiêng
                </div>
                
                <div className="space-y-4">
                    <div className="p-3 bg-slate-900 rounded-xl space-y-2">
                        <label className="text-xs text-slate-400">Góc Nghiêng ({angle}°)</label>
                        <input type="range" min="0" max="60" value={angle} onChange={e => setAngle(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-emerald-500"/>
                        
                        <label className="text-xs text-slate-400">Khối lượng ({mass} kg)</label>
                        <input type="range" min="1" max="20" value={mass} onChange={e => setMass(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-blue-500"/>
                        
                        <label className="text-xs text-slate-400">Hệ số Ma sát ({frictionMu})</label>
                        <input type="range" min="0" max="1" step="0.1" value={frictionMu} onChange={e => setFrictionMu(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-orange-500"/>
                    </div>
                    
                    <div className="p-3 bg-slate-900 rounded-xl space-y-2 border-l-4 border-indigo-500">
                        <label className="text-xs font-bold text-indigo-400">Lực Tác Động Ngoài (Push/Pull)</label>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setAppliedForce(f => f - 10)} className="p-2 bg-slate-700 rounded hover:bg-slate-600"><Minus size={14}/></button>
                            <span className="flex-1 text-center font-mono text-sm">{appliedForce.toFixed(0)} N</span>
                            <button onClick={() => setAppliedForce(f => f + 10)} className="p-2 bg-slate-700 rounded hover:bg-slate-600"><Plus size={14}/></button>
                        </div>
                        <p className="text-[10px] text-slate-500 text-center">Dương = Đẩy lên, Âm = Thả/Kéo xuống</p>
                    </div>

                     <div className="bg-slate-700 rounded-xl p-3 text-xs font-mono space-y-1">
                        <div className="flex justify-between"><span>Time:</span> <span className="text-white">{time.toFixed(2)}s</span></div>
                        <div className="flex justify-between"><span>Pos:</span> <span className="text-green-400">{pos.toFixed(2)}m</span></div>
                        <div className="flex justify-between"><span>Vel:</span> <span className="text-blue-400">{velocity.toFixed(2)}m/s</span></div>
                        <div className="flex justify-between"><span>Acc:</span> <span className="text-red-400">{((appliedForce - F_gx - (Math.sign(velocity)*MaxFriction))/mass).toFixed(2)}m/s²</span></div>
                     </div>
                </div>

                <div className="flex flex-col gap-2 mt-auto">
                    {aiAnalysis ? (
                         <div className="bg-purple-900/30 p-2 rounded text-xs relative">
                           <button onClick={() => setAiAnalysis('')} className="absolute top-1 right-1"><X size={12}/></button>
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
                        <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2">
                            {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Dừng' : 'Chạy'}
                        </button>
                        <button onClick={handleReset} className="p-2 bg-slate-700 rounded-xl hover:bg-slate-600 text-white"><RotateCcw size={16}/></button>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 overflow-hidden relative shadow-2xl flex items-center justify-center">
                <svg viewBox="0 0 800 500" className="w-full h-full">
                    <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                          <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
                        </marker>
                    </defs>
                    
                    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="1"/>
                    </pattern>
                    <rect width="800" height="500" fill="url(#grid)" />

                    <g transform="translate(100, 400)">
                        <path d={`M 0 0 L 600 0 L 600 -${600 * Math.tan(rad)} Z`} fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                        
                        <path d={`M 50 0 A 50 50 0 0 0 ${50*Math.cos(-rad)} ${50*Math.sin(-rad)}`} fill="none" stroke="yellow" strokeDasharray="4 4"/>
                        <text x="60" y="-10" fill="yellow" fontSize="14">{angle}°</text>

                        <g transform={`rotate(${-angle})`}>
                            <g transform={`translate(${pos * 25}, -25)`}>
                                <rect x="0" y="-25" width="50" height="50" fill="#3b82f6" stroke="white" strokeWidth="2" />
                                <text x="25" y="5" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{mass}kg</text>
                                
                                <line x1="25" y1="-25" x2="25" y2={-25 - Normal/2} stroke="#10b981" strokeWidth="3" markerEnd="url(#arrow)" />
                                <text x="35" y={-35 - Normal/2} fill="#10b981" fontSize="12">N</text>

                                {appliedForce !== 0 && (
                                    <>
                                    <line x1={appliedForce > 0 ? 50 : 0} y1="0" x2={appliedForce > 0 ? 50 + appliedForce : 0 + appliedForce} y2="0" stroke="#818cf8" strokeWidth="3" markerEnd="url(#arrow)" />
                                    <text x={appliedForce > 0 ? 60 + appliedForce : -20 + appliedForce} y="-10" fill="#818cf8" fontSize="12">F_app</text>
                                    </>
                                )}

                                <g transform={`translate(25, 0) rotate(${angle})`}>
                                     <line x1="0" y1="0" x2="0" y2={F_g * 2} stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow)" />
                                     <text x="5" y={F_g * 2 + 10} fill="#ef4444" fontSize="12">mg</text>
                                </g>
                                
                                {Math.abs(velocity) > 0.01 && (
                                    <>
                                        <line x1="25" y1="2" x2={25 - Math.sign(velocity)*MaxFriction*2} y2="2" stroke="#f97316" strokeWidth="3" markerEnd="url(#arrow)" />
                                        <text x={25 - Math.sign(velocity)*MaxFriction*2} y="15" fill="#f97316" fontSize="12">f_k</text>
                                    </>
                                )}
                            </g>
                        </g>
                    </g>
                </svg>
            </div>
        </div>
    );
};

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
