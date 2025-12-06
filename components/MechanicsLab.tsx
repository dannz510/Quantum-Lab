
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Play, Pause, RotateCcw, Info } from 'lucide-react';
import { calculateInclinedForces } from '../services/physics';
import { AppMode } from '../types';

interface MechanicsLabProps {
  mode: AppMode;
}

export const MechanicsLab: React.FC<MechanicsLabProps> = ({ mode }) => {
  // Common State
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);

  // Inclined Plane State
  const [angle, setAngle] = useState(30);
  const [mass, setMass] = useState(5);
  const [friction, setFriction] = useState(0.3);
  const [blockPos, setBlockPos] = useState(0); // 0 to 100% of ramp

  // Fluids State
  const [densityObj, setDensityObj] = useState(800); // kg/m3
  const [densityFluid, setDensityFluid] = useState(1000); // water
  const [volume, setVolume] = useState(1);
  const [submergedDepth, setSubmergedDepth] = useState(0);

  // Orbits State
  const [orbitRadius, setOrbitRadius] = useState(150);
  const [starMass, setStarMass] = useState(1000);
  const [planetAngle, setPlanetAngle] = useState(0);

  const reqRef = useRef<number>();

  useEffect(() => {
    if (!isRunning) return;

    const animate = () => {
      setTime(t => t + 0.016);

      if (mode === AppMode.SIM_RUN_INCLINED) {
        const physics = calculateInclinedForces(mass, angle, friction);
        if (physics.acceleration > 0) {
           setBlockPos(p => Math.min(p + physics.acceleration * 0.5, 100));
        }
      } else if (mode === AppMode.SIM_RUN_FLUIDS) {
        // Simple harmonic-ish buoyancy damping
        const targetDepth = Math.min(1, densityObj / densityFluid);
        setSubmergedDepth(curr => curr + (targetDepth - curr) * 0.05);
      } else if (mode === AppMode.SIM_RUN_ORBITS) {
         // Kepler-ish orbital speed v ~ 1/sqrt(r)
         const speed = Math.sqrt(starMass / orbitRadius) * 0.5;
         setPlanetAngle(a => a + speed * 0.016);
      }

      reqRef.current = requestAnimationFrame(animate);
    };
    reqRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(reqRef.current!);
  }, [isRunning, mode, mass, angle, friction, densityObj, densityFluid, starMass, orbitRadius]);

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setBlockPos(0);
    setPlanetAngle(0);
    setSubmergedDepth(0);
  };

  const renderInclinedPlane = () => {
    const forces = calculateInclinedForces(mass, angle, friction);
    return (
      <div className="flex flex-col h-full">
         <div className="flex-1 relative flex items-center justify-center bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
            {/* Ramp */}
            <div className="relative w-96 h-64 border-b-4 border-slate-500">
               <div 
                 className="absolute bottom-0 left-0 h-2 bg-slate-500 origin-bottom-left w-[120%]"
                 style={{ transform: `rotate(-${angle}deg)` }}
               ></div>
               {/* Block */}
               <div 
                 className="absolute bottom-0 left-0 w-16 h-16 bg-blue-500 rounded border border-blue-400 flex items-center justify-center text-xs font-bold text-white shadow-lg transition-transform"
                 style={{ 
                   transform: `rotate(-${angle}deg) translateX(${blockPos * 3}px) translateY(-100%)`, 
                   transformOrigin: 'bottom left'
                 }}
               >
                 {mass}kg
               </div>
            </div>
            {/* Force Vectors Overlay */}
            <div className="absolute top-4 right-4 bg-slate-800/80 p-4 rounded-lg text-xs space-y-2 pointer-events-none">
               <div className="flex items-center gap-2 text-green-400"><span className="w-4 h-0.5 bg-green-400"></span> Parallel Force: {forces.parallel.toFixed(1)} N</div>
               <div className="flex items-center gap-2 text-red-400"><span className="w-4 h-0.5 bg-red-400"></span> Friction: {Math.min(forces.parallel, forces.frictionMax).toFixed(1)} N</div>
               <div className="flex items-center gap-2 text-white font-bold">Net Force: {forces.netForce.toFixed(1)} N</div>
               <div className="text-blue-300">Acceleration: {forces.acceleration.toFixed(2)} m/s²</div>
            </div>
         </div>
      </div>
    );
  };

  const renderFluids = () => {
    const isFloating = densityObj < densityFluid;
    return (
       <div className="flex flex-col h-full">
          <div className="flex-1 flex items-center justify-center bg-slate-900 rounded-xl border border-slate-700 relative">
             {/* Tank */}
             <div className="w-64 h-80 border-4 border-slate-500 border-t-0 rounded-b-xl relative bg-blue-900/10 overflow-hidden">
                {/* Water Level */}
                <div className="absolute bottom-0 left-0 right-0 bg-blue-500/30 border-t border-blue-400 transition-all duration-500" style={{ height: '70%' }}>
                   <div className="absolute top-2 right-2 text-blue-300 text-xs font-bold">Fluid: {densityFluid} kg/m³</div>
                </div>
                
                {/* Object */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-600 rounded border border-amber-500 flex items-center justify-center text-white font-bold shadow-xl transition-all duration-700 ease-out"
                  style={{ bottom: isRunning ? (isFloating ? '60%' : '5%') : '80%' }} 
                >
                   <div>
                     <div>{densityObj} kg/m³</div>
                     <div className="text-xs font-normal opacity-80">{isFloating ? 'Floating' : 'Sinking'}</div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    );
  };

  const renderOrbits = () => {
    return (
       <div className="flex flex-col h-full">
         <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
             {/* Star */}
             <div className="absolute w-16 h-16 bg-yellow-400 rounded-full shadow-[0_0_50px_rgba(250,204,21,0.5)] flex items-center justify-center z-10">
               <span className="text-black font-bold text-xs">Star</span>
             </div>
             
             {/* Orbit Path */}
             <div 
               className="absolute rounded-full border border-slate-700 border-dashed"
               style={{ width: orbitRadius * 2, height: orbitRadius * 2 }}
             ></div>

             {/* Planet */}
             <div 
               className="absolute w-6 h-6 bg-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]"
               style={{ 
                 transform: `translate(${Math.cos(planetAngle) * orbitRadius}px, ${Math.sin(planetAngle) * orbitRadius}px)`
               }}
             ></div>
         </div>
       </div>
    );
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
      <div className="lg:col-span-3 bg-lab-card border border-slate-700 rounded-2xl p-4 flex flex-col gap-6">
         <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
            <Settings size={20} /> Setup
         </div>
         
         <div className="space-y-4">
           {mode === AppMode.SIM_RUN_INCLINED && (
             <>
               <div>
                 <label className="text-sm text-slate-400">Ramp Angle ({angle}°)</label>
                 <input type="range" min="0" max="60" value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-blue-500" />
               </div>
               <div>
                 <label className="text-sm text-slate-400">Mass ({mass}kg)</label>
                 <input type="range" min="1" max="20" value={mass} onChange={(e) => setMass(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-blue-500" />
               </div>
               <div>
                 <label className="text-sm text-slate-400">Friction Coeff ({friction})</label>
                 <input type="range" min="0" max="1" step="0.1" value={friction} onChange={(e) => setFriction(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-blue-500" />
               </div>
             </>
           )}

           {mode === AppMode.SIM_RUN_FLUIDS && (
             <>
                <div>
                 <label className="text-sm text-slate-400">Object Density</label>
                 <input type="range" min="200" max="2000" step="50" value={densityObj} onChange={(e) => setDensityObj(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-amber-500" />
                 <div className="flex justify-between text-xs text-slate-500 mt-1"><span>Cork</span><span>Steel</span></div>
               </div>
               <div>
                 <label className="text-sm text-slate-400">Fluid Density</label>
                 <input type="range" min="500" max="1500" step="50" value={densityFluid} onChange={(e) => setDensityFluid(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-blue-500" />
                 <div className="flex justify-between text-xs text-slate-500 mt-1"><span>Oil</span><span>Honey</span></div>
               </div>
             </>
           )}

           {mode === AppMode.SIM_RUN_ORBITS && (
             <>
                <div>
                 <label className="text-sm text-slate-400">Orbit Radius</label>
                 <input type="range" min="50" max="250" value={orbitRadius} onChange={(e) => setOrbitRadius(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-cyan-500" />
               </div>
               <div>
                 <label className="text-sm text-slate-400">Star Mass</label>
                 <input type="range" min="500" max="5000" value={starMass} onChange={(e) => setStarMass(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-yellow-500" />
               </div>
             </>
           )}
         </div>

         <div className="mt-auto flex gap-2">
            <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2">
              {isRunning ? <Pause size={18} /> : <Play size={18} />} {isRunning ? 'Pause' : 'Start'}
            </button>
            <button onClick={handleReset} className="bg-slate-700 hover:bg-slate-600 p-3 rounded-xl text-white">
               <RotateCcw size={18} />
            </button>
         </div>
      </div>

      <div className="lg:col-span-9 h-full">
         {mode === AppMode.SIM_RUN_INCLINED && renderInclinedPlane()}
         {mode === AppMode.SIM_RUN_FLUIDS && renderFluids()}
         {mode === AppMode.SIM_RUN_ORBITS && renderOrbits()}
      </div>
    </div>
  );
};
