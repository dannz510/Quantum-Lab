import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Play, Pause, RotateCcw, Activity, ArrowUpRight, Crosshair, RefreshCw, Triangle, Droplet, Move, ArrowDown, Scale } from 'lucide-react';
import { analyzeExperimentData } from '../services/gemini';
import { AppMode, Language } from '../types';
import { SoundEngine } from '../services/sound';

interface MechanicsLabProps {
  mode: AppMode;
  lang: Language;
}

// --- PROJECTILE MOTION LAB (Preserved) ---
const MechanicsProjectile = ({ lang }: { lang: Language }) => {
    // ... (Existing Implementation Preserved)
    const [angle, setAngle] = useState(45);
    const [velocity, setVelocity] = useState(50);
    const [gravity, setGravity] = useState(9.8);
    const [height, setHeight] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [projectilePath, setProjectilePath] = useState<{x: number, y: number}[]>([]);
    const [time, setTime] = useState(0);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);

    const runSim = useCallback(() => {
        if (!isRunning) return;
        const dt = 0.05;
        const t = time + dt;
        setTime(t);

        const rad = angle * Math.PI / 180;
        const vx = velocity * Math.cos(rad);
        const vy = velocity * Math.sin(rad);
        
        const x = vx * t;
        const y = height + vy * t - 0.5 * gravity * t * t;

        if (y < 0) {
            setIsRunning(false); 
            SoundEngine.playSplash(0.5); 
        } else {
            setProjectilePath(prev => [...prev, {x, y}]);
            reqRef.current = requestAnimationFrame(runSim);
        }
    }, [isRunning, time, angle, velocity, gravity, height]);

    useEffect(() => {
        if (isRunning) {
            reqRef.current = requestAnimationFrame(runSim);
        }
        return () => cancelAnimationFrame(reqRef.current);
    }, [runSim, isRunning]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, H - 20, W, 20);

        const scale = 5;
        const originX = 50;
        const originY = H - 20 - height * scale;

        ctx.save();
        ctx.translate(originX, originY);
        ctx.rotate(-angle * Math.PI / 180);
        ctx.fillStyle = '#475569';
        ctx.fillRect(0, -10, 40, 20);
        ctx.restore();

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        projectilePath.forEach(p => {
            ctx.lineTo(originX + p.x * scale, H - 20 - p.y * scale);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        if (projectilePath.length > 0) {
            const last = projectilePath[projectilePath.length - 1];
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(originX + last.x * scale, H - 20 - last.y * scale, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    useEffect(draw, [projectilePath, angle, height]);

    const handleReset = () => {
        setIsRunning(false);
        setTime(0);
        setProjectilePath([]);
        setAiAnalysis('');
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const maxRange = (velocity * velocity * Math.sin(2 * angle * Math.PI / 180)) / gravity;
        const summary = `Projectile: Angle=${angle}, Vel=${velocity}, G=${gravity}, Max Range (ideal)=${maxRange.toFixed(2)}`;
        const result = await analyzeExperimentData("Projectile Motion", { angle, velocity, gravity }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4">
                <div className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-2">
                    <Crosshair size={20} className="text-red-500" /> Projectile Controls
                </div>
                <div className="space-y-4">
                    <div><label className="text-xs text-slate-400">Angle ({angle}°)</label><input type="range" min="0" max="90" value={angle} onChange={e => setAngle(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-red-500"/></div>
                    <div><label className="text-xs text-slate-400">Velocity ({velocity} m/s)</label><input type="range" min="10" max="150" value={velocity} onChange={e => setVelocity(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-orange-500"/></div>
                    <div><label className="text-xs text-slate-400">Gravity ({gravity} m/s²)</label><input type="range" min="1" max="20" step="0.1" value={gravity} onChange={e => setGravity(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-blue-500"/></div>
                </div>
                <div className="flex gap-2 mt-auto">
                    <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl">{isRunning ? 'Pause' : 'Fire'}</button>
                    <button onClick={handleReset} className="p-2 bg-slate-700 rounded-xl"><RotateCcw/></button>
                </div>
                <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-2 bg-indigo-600 rounded text-xs font-bold flex justify-center items-center gap-2">
                    {isAnalyzing ? <span className="animate-spin">⌛</span> : <span>✨</span>} AI Analysis
                </button>
                {aiAnalysis && <div className="bg-purple-900/30 p-2 rounded text-xs max-h-32 overflow-y-auto custom-scrollbar">{aiAnalysis}</div>}
            </div>
            <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 shadow-2xl"><canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" /></div>
        </div>
    );
};

// --- INCLINED PLANE LAB (Preserved) ---
const MechanicsInclinedPlane = ({ lang }: { lang: Language }) => {
    // ... (Existing Implementation Preserved)
    const [angle, setAngle] = useState(30);
    const [mass, setMass] = useState(5);
    const [mu, setMu] = useState(0.2); // Friction coeff
    const [g, setG] = useState(9.8);
    const [pos, setPos] = useState(0); // 0 to 100% of ramp
    const [velocity, setVelocity] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);

    const rampLength = 500; // pixels visual

    const update = () => {
        if (!isRunning) return;
        
        // Physics
        const rad = angle * Math.PI / 180;
        const fg = mass * g;
        const normal = fg * Math.cos(rad);
        const fParallel = fg * Math.sin(rad);
        const friction = Math.min(fParallel, normal * mu);
        const netForce = fParallel - friction;
        
        const acc = netForce / mass; // m/s^2 (pixels/s^2 scaled)
        
        // Time step approx
        const dt = 0.05;
        const newVel = velocity + acc * dt * 5; // Scale factor for visuals
        const newPos = pos + newVel * dt;
        
        setVelocity(newVel);
        setPos(newPos);
        
        if (newPos > rampLength) setIsRunning(false);
        
        reqRef.current = requestAnimationFrame(update);
    };

    useEffect(() => {
        if (isRunning) reqRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(reqRef.current);
    }, [isRunning, velocity, pos, angle, mass, mu, g]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        const groundY = H - 50;
        const startX = 100;
        
        ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,W,H);
        
        // Ground
        ctx.fillStyle = '#1e293b'; ctx.fillRect(0, groundY, W, 50);
        
        // Ramp
        const rad = angle * Math.PI / 180;
        const rampEndX = startX + rampLength * Math.cos(rad);
        const rampEndY = groundY - rampLength * Math.sin(rad);
        
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(startX, groundY); ctx.lineTo(rampEndX, rampEndY); ctx.lineTo(rampEndX, groundY); ctx.closePath();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.2)'; ctx.fill(); ctx.stroke();
        
        // Angle Arc
        ctx.beginPath(); ctx.arc(startX, groundY, 40, 0, -rad, true); ctx.stroke();
        ctx.fillStyle = 'white'; ctx.fillText(`${angle}°`, startX + 50, groundY - 10);
        
        // Block
        const blockDist = (rampLength - 50) - pos; // Start at top
        const blockX = startX + (rampLength - blockDist) * Math.cos(rad);
        const blockY = groundY - (rampLength - blockDist) * Math.sin(rad);
        
        ctx.save();
        ctx.translate(blockX, blockY);
        ctx.rotate(-rad);
        
        // Mass Block
        const size = 30 + mass * 2;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-size/2, -size, size, size);
        
        // Vectors
        const vScale = 3;
        const fg = mass * g;
        const normal = fg * Math.cos(rad);
        const fParallel = fg * Math.sin(rad);
        const friction = Math.min(fParallel, normal * mu);

        // Normal (Up)
        ctx.beginPath(); ctx.moveTo(0, -size/2); ctx.lineTo(0, -size/2 - normal*vScale); 
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.stroke();
        
        // Friction (Backwards)
        ctx.beginPath(); ctx.moveTo(0, -size/2); ctx.lineTo(-friction*vScale*2, -size/2);
        ctx.strokeStyle = '#f59e0b'; ctx.stroke();

        ctx.restore();
        
        // Gravity (Always Down)
        ctx.save();
        ctx.translate(blockX, blockY - size/2); // Center of mass approx
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, fg * vScale); 
        ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
    };
    
    useEffect(draw, [pos, angle, mass]);

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4">
                 <div className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-2">
                    <Triangle size={20} className="text-orange-500" /> Inclined Plane
                </div>
                <div className="space-y-4">
                    <div><label className="text-xs text-slate-400">Angle ({angle}°)</label><input type="range" min="5" max="60" value={angle} onChange={e => setAngle(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-orange-500"/></div>
                    <div><label className="text-xs text-slate-400">Mass ({mass} kg)</label><input type="range" min="1" max="20" value={mass} onChange={e => setMass(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-red-500"/></div>
                    <div><label className="text-xs text-slate-400">Friction Coeff ({mu})</label><input type="range" min="0" max="1" step="0.1" value={mu} onChange={e => setMu(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-yellow-500"/></div>
                </div>
                <div className="bg-slate-900 p-2 rounded text-xs font-mono space-y-1">
                    <div className="text-green-500">Gravity (mg): {(mass*g).toFixed(1)} N</div>
                    <div className="text-blue-500">Normal (N): {(mass*g*Math.cos(angle*Math.PI/180)).toFixed(1)} N</div>
                    <div className="text-orange-500">Friction (f): {Math.min(mass*g*Math.sin(angle*Math.PI/180), mass*g*Math.cos(angle*Math.PI/180)*mu).toFixed(1)} N</div>
                </div>
                <div className="flex gap-2 mt-auto">
                    <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-xl">{isRunning ? 'Pause' : 'Slide'}</button>
                    <button onClick={() => {setPos(0); setVelocity(0); setIsRunning(false);}} className="p-2 bg-slate-700 rounded-xl"><RotateCcw/></button>
                </div>
            </div>
            <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 shadow-2xl"><canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" /></div>
        </div>
    );
};

// --- FLUIDS (ARCHIMEDES) LAB - UPGRADED ---
const MechanicsFluids = ({ lang }: { lang: Language }) => {
    const [fluidDensity, setFluidDensity] = useState(1000); // Water
    const [objDensity, setObjDensity] = useState(500); // Wood approx
    const [objVolume, setObjVolume] = useState(0.01); // m^3
    const [isDragging, setIsDragging] = useState(false);
    
    // Physics State
    const [objY, setObjY] = useState(100); // px from top
    const [velocity, setVelocity] = useState(0);
    const [overflow, setOverflow] = useState(0); // Volume displaced
    const [graphData, setGraphData] = useState<{depth: number, fb: number}[]>([]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);
    const lastTimeRef = useRef(0);
    
    // Constants
    const g = 9.8;
    const pxPerMeter = 1000; // Scale
    const waterLevelY = 300; // px from top
    const floorY = 450;
    const objSize = 80;

    // Mouse Handler
    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if(!rect) return;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const centerX = rect.width / 2;
        
        // Hit test
        if (Math.abs(mouseX - centerX) < objSize/2 && Math.abs(mouseY - objY) < objSize/2) {
            setIsDragging(true);
            setVelocity(0);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if(rect) {
                const mouseY = e.clientY - rect.top;
                setObjY(Math.max(objSize/2, Math.min(floorY - objSize/2, mouseY)));
            }
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    // Physics Loop
    useEffect(() => {
        const update = (time: number) => {
            if (!lastTimeRef.current) lastTimeRef.current = time;
            const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05); // Limit dt step
            lastTimeRef.current = time;

            if (!isDragging) {
                // Calculate Submerged Depth
                const bottomY = objY + objSize/2;
                const submergedH = Math.max(0, Math.min(objSize, bottomY - (waterLevelY - objSize/2 + 40))); // Approx offset
                const submergedRatio = Math.min(1, Math.max(0, (bottomY - 200) / objSize)); // Simplified visual overlap logic
                
                // Better Logic: Water Surface is at `waterLevelY`
                // Top of box is `objY - objSize/2`
                // Bottom of box is `objY + objSize/2`
                
                // Water top is roughly 250 in canvas coords (based on drawing below)
                const waterSurface = 250;
                const boxBottom = objY + objSize/2;
                const boxTop = objY - objSize/2;
                
                let subHeight = 0;
                if (boxBottom > waterSurface) {
                    subHeight = Math.min(objSize, boxBottom - waterSurface);
                }
                const subRatio = subHeight / objSize;

                // Forces
                const volumeSub = objVolume * subRatio;
                const mass = objDensity * objVolume;
                const weight = mass * g;
                const buoyantForce = fluidDensity * volumeSub * g;
                const drag = -velocity * 2; // Simple drag
                
                const netForce = weight - buoyantForce + drag;
                const acc = netForce / mass;
                
                let newVel = velocity + acc * dt * 50; // Scale factor
                let newY = objY + newVel * dt * 5;

                // Floor Collision
                if (newY > floorY - objSize/2) {
                    newY = floorY - objSize/2;
                    newVel = -newVel * 0.2; // Bounce
                }
                
                setObjY(newY);
                setVelocity(newVel);
                
                // Update Overflow & Graph
                setOverflow(prev => Math.max(prev, volumeSub * 1000)); // Liters
                if (subRatio > 0) {
                    setGraphData(prev => [...prev.slice(-50), { depth: subHeight, fb: buoyantForce }]);
                }
            }
            
            reqRef.current = requestAnimationFrame(update);
        };
        reqRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(reqRef.current);
    }, [isDragging, objY, velocity, fluidDensity, objDensity, objVolume]);

    // Drawing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;
        
        const W = canvas.width;
        const H = canvas.height;
        const centerX = W/2 - 100; // Shift left to make room for graph
        
        ctx.clearRect(0,0,W,H);
        
        // 1. Draw Beaker
        const beakerX = centerX - 100;
        const beakerY = 250;
        const beakerW = 200;
        const beakerH = 200;
        
        // Water
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.fillRect(beakerX, beakerY, beakerW, beakerH);
        
        // Beaker Lines
        ctx.strokeStyle = 'white'; ctx.lineWidth = 3;
        ctx.strokeRect(beakerX, beakerY, beakerW, beakerH);
        
        // Spout
        ctx.beginPath(); ctx.moveTo(beakerX + beakerW, beakerY + 20); 
        ctx.lineTo(beakerX + beakerW + 30, beakerY + 30);
        ctx.stroke();
        
        // 2. Draw Overflow Cup
        const cupX = beakerX + beakerW + 20;
        const cupY = beakerY + 100;
        ctx.fillStyle = '#334155';
        ctx.fillRect(cupX, cupY, 60, 100);
        // Overflow water
        const overflowH = Math.min(100, overflow * 5); // Visual scale
        ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.fillRect(cupX, cupY + 100 - overflowH, 60, overflowH);
        
        // 3. Draw Object
        ctx.fillStyle = objDensity > 1000 ? '#64748b' : '#d97706';
        ctx.fillRect(centerX - objSize/2, objY - objSize/2, objSize, objSize);
        ctx.strokeStyle = 'white'; ctx.strokeRect(centerX - objSize/2, objY - objSize/2, objSize, objSize);
        
        // 4. Force Vectors (if submerged or dragging)
        const centerObjY = objY;
        const subHeight = Math.min(objSize, Math.max(0, (objY + objSize/2) - 250));
        const subRatio = subHeight / objSize;
        const fb = fluidDensity * (objVolume * subRatio) * g;
        const fg = objDensity * objVolume * g;
        
        // Fg (Red Down)
        ctx.beginPath(); ctx.moveTo(centerX, centerObjY); ctx.lineTo(centerX, centerObjY + fg * 2);
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.stroke();
        // Fb (Blue Up)
        if (fb > 0) {
            ctx.beginPath(); ctx.moveTo(centerX, centerObjY); ctx.lineTo(centerX, centerObjY - fb * 2);
            ctx.strokeStyle = '#3b82f6'; ctx.stroke();
        }
        
        // 5. Real-time Graph (Right Side)
        const graphX = W - 250;
        const graphY = 50;
        const graphW = 200;
        const graphH = 150;
        
        ctx.fillStyle = '#1e293b'; ctx.fillRect(graphX, graphY, graphW, graphH);
        ctx.strokeStyle = '#475569'; ctx.strokeRect(graphX, graphY, graphW, graphH);
        
        ctx.beginPath();
        ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2;
        graphData.forEach((pt, i) => {
            const x = graphX + (pt.depth / objSize) * graphW;
            const y = graphY + graphH - (pt.fb / (fluidDensity * objVolume * g)) * graphH;
            if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();
        
        ctx.fillStyle = 'white'; ctx.font = '10px sans-serif';
        ctx.fillText("Buoyant Force vs Depth", graphX + 50, graphY - 10);

    }, [objY, overflow, graphData, objDensity, fluidDensity, objVolume]);

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100">
             <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4">
                 <div className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-2">
                    <Droplet size={20} className="text-sky-500" /> Archimedes Engine
                </div>
                
                <div className="p-2 bg-sky-900/30 rounded border border-sky-500/30 text-xs text-sky-200">
                    <Move size={14} className="inline mr-1"/> Drag the block to submerge it!
                </div>

                <div className="space-y-4">
                    <div><label className="text-xs text-slate-400">Fluid Density ({fluidDensity} kg/m³)</label><input type="range" min="800" max="1200" value={fluidDensity} onChange={e => setFluidDensity(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-sky-500"/></div>
                    <div><label className="text-xs text-slate-400">Object Density ({objDensity} kg/m³)</label><input type="range" min="200" max="2000" step="100" value={objDensity} onChange={e => setObjDensity(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-orange-500"/></div>
                </div>
                
                <div className="p-3 bg-slate-900 rounded-xl space-y-2 font-mono text-xs mt-auto">
                    <div className="flex justify-between"><span className="text-slate-400">Mass:</span> <span className="text-white">{(objDensity*objVolume).toFixed(2)} kg</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Displaced Vol:</span> <span className="text-sky-400">{overflow.toFixed(2)} mL</span></div>
                </div>
                
                <button onClick={() => {setObjY(100); setVelocity(0); setOverflow(0); setGraphData([])}} className="w-full py-2 bg-slate-700 rounded hover:bg-slate-600"><RotateCcw size={16} className="mx-auto"/></button>
             </div>
             <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 shadow-2xl relative">
                 <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={500} 
                    className="w-full h-full object-contain cursor-move"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                 />
                 <div className="absolute top-2 left-2 text-xs text-slate-500">Interactive Physics Canvas</div>
             </div>
        </div>
    );
};

// --- COLLISION LAB (Preserved but integrated) ---
const MechanicsCollisions = ({ lang }: { lang: Language }) => {
    // ... (Existing Implementation) ...
    const [balls, setBalls] = useState([
        { x: 100, y: 250, vx: 5, vy: 0, r: 20, m: 5, color: '#ef4444' },
        { x: 400, y: 250, vx: 0, vy: 0, r: 20, m: 5, color: '#3b82f6' }
    ]);
    const [elasticity, setElasticity] = useState(1.0);
    const [isRunning, setIsRunning] = useState(false);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);

    const update = () => {
        if (!isRunning) return;
        let newBalls = balls.map(b => ({...b, x: b.x + b.vx, y: b.y + b.vy}));
        
        newBalls.forEach(b => {
            if (b.x < b.r || b.x > 800 - b.r) b.vx *= -1;
            if (b.y < b.r || b.y > 500 - b.r) b.vy *= -1;
        });

        const b1 = newBalls[0];
        const b2 = newBalls[1];
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < b1.r + b2.r) {
            const angle = Math.atan2(dy, dx);
            const tempVx = b1.vx;
            b1.vx = b2.vx * elasticity;
            b2.vx = tempVx * elasticity;
            
            const overlap = (b1.r + b2.r - dist) / 2;
            b1.x -= overlap * Math.cos(angle);
            b2.x += overlap * Math.cos(angle);
            SoundEngine.playClick();
        }

        setBalls(newBalls);
        reqRef.current = requestAnimationFrame(update);
    };

    useEffect(() => {
        if (isRunning) reqRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(reqRef.current);
    }, [isRunning, balls, elasticity]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 800, 500);
        balls.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = 'white'; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.vx*10, b.y + b.vy*10); ctx.stroke();
        });
    };
    
    useEffect(draw, [balls]);

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-2"><RefreshCw size={20} className="text-green-500" /> Collision Lab</div>
                <div className="mt-4 space-y-4">
                    <div><label className="text-xs text-slate-400">Elasticity ({elasticity})</label><input type="range" min="0" max="1" step="0.1" value={elasticity} onChange={e => setElasticity(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-green-500"/></div>
                    <div className="flex gap-2"><button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-xl">{isRunning ? 'Pause' : 'Run'}</button><button onClick={() => setBalls([{x:100,y:250,vx:5,vy:0,r:20,m:5,color:'#ef4444'}, {x:400,y:250,vx:0,vy:0,r:20,m:5,color:'#3b82f6'}])} className="p-2 bg-slate-700 rounded-xl"><RotateCcw/></button></div>
                </div>
            </div>
            <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 shadow-2xl"><canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" /></div>
        </div>
    );
};

// --- SPRINGS LAB (Preserved but integrated) ---
const MechanicsSprings = ({ lang }: { lang: Language }) => {
    // ... (Existing Implementation) ...
    const [k, setK] = useState(50); const [m, setM] = useState(10); const [damping, setDamping] = useState(0.5);
    const [y, setY] = useState(200); const [vy, setVy] = useState(0); const [isRunning, setIsRunning] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null); const reqRef = useRef(0); const equilibriumY = 250;

    const update = () => {
        if (!isRunning) return;
        const displacement = y - equilibriumY;
        const forceSpring = -k * (displacement / 50); 
        const forceDamp = -damping * vy;
        const forceGrav = m * 9.8 / 50; 
        const acc = (forceSpring + forceDamp + forceGrav) / m;
        const nextVy = vy + acc;
        setVy(nextVy); setY(y + nextVy);
        reqRef.current = requestAnimationFrame(update);
    };

    useEffect(() => {
        if (isRunning) reqRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(reqRef.current);
    }, [isRunning, y, vy, k, m, damping]);

    const draw = () => {
        const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
        ctx.clearRect(0, 0, 800, 500);
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(400, 0);
        const coils = 15; const step = y / coils;
        for (let i = 0; i <= coils; i++) { const xOffset = i % 2 === 0 ? -20 : 20; ctx.lineTo(400 + (i === 0 || i === coils ? 0 : xOffset), i * step); }
        ctx.stroke();
        ctx.fillStyle = '#8b5cf6'; ctx.fillRect(375, y, 50, 50);
        ctx.strokeStyle = '#34d399'; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(300, equilibriumY + 25); ctx.lineTo(500, equilibriumY + 25); ctx.stroke();
        ctx.setLineDash([]);
    };
    
    useEffect(draw, [y]);

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100">
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-2"><Activity size={20} className="text-purple-500" /> Hooke's Law</div>
                <div className="mt-4 space-y-4">
                    <div><label className="text-xs text-slate-400">Spring Constant (k)</label><input type="range" min="10" max="200" value={k} onChange={e => setK(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-purple-500"/></div>
                    <div><label className="text-xs text-slate-400">Mass (m)</label><input type="range" min="1" max="50" value={m} onChange={e => setM(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-blue-500"/></div>
                    <div><label className="text-xs text-slate-400">Damping</label><input type="range" min="0" max="2" step="0.1" value={damping} onChange={e => setDamping(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-red-500"/></div>
                    <button onClick={() => setIsRunning(!isRunning)} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl">{isRunning ? 'Stop' : 'Oscillate'}</button>
                    <button onClick={() => {setY(350); setVy(0);}} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-1 rounded-lg text-xs">Pull Down</button>
                </div>
            </div>
            <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 shadow-2xl"><canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" /></div>
        </div>
    );
};

// Placeholder for Orbits
const MechanicsOrbits = ({ lang }: { lang: Language }) => <div className="text-white p-10 flex items-center justify-center h-full">Orbits Lab Active (See SimSelector)</div>;


export const MechanicsLab: React.FC<MechanicsLabProps> = ({ mode, lang }) => {
  switch(mode) {
      case AppMode.SIM_RUN_ORBITS: return <MechanicsOrbits lang={lang} />;
      case AppMode.SIM_RUN_FLUIDS: return <MechanicsFluids lang={lang} />;
      case AppMode.SIM_RUN_INCLINED: return <MechanicsInclinedPlane lang={lang} />;
      case AppMode.SIM_RUN_PROJECTILE: return <MechanicsProjectile lang={lang} />;
      case AppMode.SIM_RUN_COLLISIONS: return <MechanicsCollisions lang={lang} />;
      case AppMode.SIM_RUN_SPRINGS: return <MechanicsSprings lang={lang} />;
      default: return <div className="p-10 text-center text-slate-500">Mode not found</div>;
  }
};