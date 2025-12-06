
import React, { useState, useRef, useEffect } from 'react';
import { Settings, AlignCenter, Radio, MoveHorizontal } from 'lucide-react';
import { calculateDoubleSlitIntensity, calculateTunnelingProbability } from '../services/physics';
import { AppMode } from '../types';

interface QuantumLabProps {
  mode: AppMode;
}

export const QuantumLab: React.FC<QuantumLabProps> = ({ mode }) => {
  // Slit State
  const [slitDist, setSlitDist] = useState(50); // micrometers
  const [wavelength, setWavelength] = useState(500); // nm
  const [screenDist, setScreenDist] = useState(1); // m

  // Spectrum State
  const [element, setElement] = useState<'hydrogen' | 'helium' | 'neon'>('hydrogen');

  // Tunneling State
  const [energy, setEnergy] = useState(5); // eV
  const [barrierHeight, setBarrierHeight] = useState(10); // eV
  const [barrierWidth, setBarrierWidth] = useState(2); // nm

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (mode === AppMode.SIM_RUN_SLIT) {
       drawInterference();
    }
  }, [mode, slitDist, wavelength, screenDist]);

  const drawInterference = () => {
     const canvas = canvasRef.current;
     if (!canvas) return;
     const ctx = canvas.getContext('2d');
     if (!ctx) return;

     ctx.fillStyle = '#000000';
     ctx.fillRect(0, 0, canvas.width, canvas.height);

     const width = canvas.width;
     const height = canvas.height;
     const center = width / 2;

     // Draw Gradient Pattern
     const imageData = ctx.createImageData(width, 100);
     const data = imageData.data;

     // Calculate intensity for each pixel
     // Lambda in meters = wavelength * 1e-9
     // d in meters = slitDist * 1e-6
     const lamM = wavelength * 1e-9;
     const dM = slitDist * 1e-6;

     // Color based on wavelength
     let r=0, g=0, b=0;
     if (wavelength < 450) { r=100; b=255; }
     else if (wavelength < 500) { g=200; b=255; }
     else if (wavelength < 580) { r=100; g=255; }
     else if (wavelength < 620) { r=255; g=200; }
     else { r=255; }

     for (let x = 0; x < width; x++) {
        // Physical position on screen (scale factor arbitrary for viz)
        const posM = (x - center) * 0.00001; 
        const intensity = calculateDoubleSlitIntensity(posM, screenDist, dM, lamM);
        
        for (let y = 0; y < 100; y++) {
           const index = (y * width + x) * 4;
           data[index] = r * intensity;
           data[index+1] = g * intensity;
           data[index+2] = b * intensity;
           data[index+3] = 255;
        }
     }
     ctx.putImageData(imageData, 0, height/2 - 50);

     // Draw Intensity Graph
     ctx.strokeStyle = '#ffffff';
     ctx.lineWidth = 1;
     ctx.beginPath();
     for (let x = 0; x < width; x++) {
        const posM = (x - center) * 0.00001;
        const intensity = calculateDoubleSlitIntensity(posM, screenDist, dM, lamM);
        const y = height - 20 - (intensity * 100);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
     }
     ctx.stroke();
  };

  const renderSpectrum = () => {
    // Fake emission lines
    const lines = {
       hydrogen: [410, 434, 486, 656],
       helium: [447, 501, 587, 667],
       neon: [540, 585, 640, 703]
    };
    
    return (
       <div className="flex flex-col h-full bg-slate-950 rounded-xl border border-slate-800 p-8">
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
             <div className="text-2xl font-bold text-white uppercase tracking-widest">{element} EMISSION SPECTRUM</div>
             
             <div className="w-full h-32 bg-black relative rounded-lg border border-slate-600 overflow-hidden">
                {lines[element].map(lam => {
                   // Map 400-750nm to 0-100%
                   const pos = ((lam - 400) / 350) * 100;
                   let color = '#fff';
                   if (lam < 450) color = 'violet';
                   else if (lam < 490) color = 'blue';
                   else if (lam < 560) color = 'green';
                   else if (lam < 590) color = 'yellow';
                   else if (lam < 630) color = 'orange';
                   else color = 'red';
                   
                   return (
                      <div 
                        key={lam}
                        className="absolute top-0 bottom-0 w-1 shadow-[0_0_10px_currentColor]"
                        style={{ left: `${pos}%`, backgroundColor: color, color: color }}
                      >
                         <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-mono">{lam}</span>
                      </div>
                   );
                })}
             </div>
             
             <div className="w-full h-8 bg-gradient-to-r from-violet-900 via-green-900 to-red-900 opacity-30 rounded"></div>
          </div>
       </div>
    );
  };

  const renderTunneling = () => {
     const prob = calculateTunnelingProbability(energy, barrierHeight, barrierWidth);
     return (
        <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-700 p-8">
           <div className="flex-1 relative flex items-center">
              {/* Region 1: Incoming */}
              <div className="h-1 bg-blue-500 w-1/3 relative">
                 <div className="absolute -top-6 text-xs text-blue-400">Incoming Particle (E={energy}eV)</div>
              </div>
              
              {/* Barrier */}
              <div className="h-32 w-24 bg-slate-700 border-x border-slate-500 relative flex items-center justify-center">
                 <div className="text-xs text-white text-center font-bold">Barrier<br/>(V={barrierHeight}eV)</div>
              </div>

              {/* Region 3: Outgoing */}
              <div className="h-1 bg-blue-500/50 flex-1 relative" style={{ opacity: prob }}>
                 <div className="absolute -top-6 text-xs text-blue-400">Transmitted Wave</div>
              </div>
           </div>
           
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center">
              <div className="text-sm text-slate-400 mb-2">Tunneling Probability</div>
              <div className="text-3xl font-bold text-white font-mono">{(prob * 100).toExponential(2)}%</div>
              <div className="text-xs text-slate-500 mt-2">Quantum mechanics allows particles to pass through barriers higher than their energy level.</div>
           </div>
        </div>
     );
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
       <div className="lg:col-span-3 bg-lab-card border border-slate-700 rounded-2xl p-4 flex flex-col gap-6">
          <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
             <Settings size={20} /> Quantum Setup
          </div>
          
          <div className="space-y-6">
             {mode === AppMode.SIM_RUN_SLIT && (
                <>
                   <div>
                     <label className="text-sm text-slate-400">Slit Distance ({slitDist} µm)</label>
                     <input type="range" min="10" max="100" value={slitDist} onChange={(e) => setSlitDist(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-purple-500" />
                   </div>
                   <div>
                     <label className="text-sm text-slate-400">Wavelength ({wavelength} nm)</label>
                     <input type="range" min="400" max="700" value={wavelength} onChange={(e) => setWavelength(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-pink-500" />
                   </div>
                </>
             )}
             {mode === AppMode.SIM_RUN_SPECTRUM && (
                <div className="grid grid-cols-1 gap-2">
                   {['hydrogen', 'helium', 'neon'].map(el => (
                      <button 
                        key={el}
                        onClick={() => setElement(el as any)}
                        className={`p-3 rounded-lg capitalize font-bold transition-all ${element === el ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                      >
                         {el}
                      </button>
                   ))}
                </div>
             )}
             {mode === AppMode.SIM_RUN_TUNNELING && (
                <>
                   <div>
                     <label className="text-sm text-slate-400">Particle Energy ({energy} eV)</label>
                     <input type="range" min="1" max="15" value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-blue-500" />
                   </div>
                   <div>
                     <label className="text-sm text-slate-400">Barrier Height ({barrierHeight} eV)</label>
                     <input type="range" min="5" max="20" value={barrierHeight} onChange={(e) => setBarrierHeight(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-red-500" />
                   </div>
                   <div>
                     <label className="text-sm text-slate-400">Barrier Width ({barrierWidth} nm)</label>
                     <input type="range" min="0.5" max="5" step="0.5" value={barrierWidth} onChange={(e) => setBarrierWidth(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-slate-500" />
                   </div>
                </>
             )}
          </div>
       </div>

       <div className="lg:col-span-9 h-full">
          {mode === AppMode.SIM_RUN_SLIT && (
             <div className="flex flex-col h-full bg-black rounded-xl border border-slate-800 p-4">
                <canvas ref={canvasRef} width={800} height={400} className="w-full h-full object-contain" />
             </div>
          )}
          {mode === AppMode.SIM_RUN_SPECTRUM && renderSpectrum()}
          {mode === AppMode.SIM_RUN_TUNNELING && renderTunneling()}
       </div>
    </div>
  );
};
