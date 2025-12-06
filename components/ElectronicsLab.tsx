
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Activity, Zap, Magnet } from 'lucide-react';
import { calculateImpedance } from '../services/physics';
import { AppMode } from '../types';

interface ElectronicsLabProps {
  mode: AppMode;
}

export const ElectronicsLab: React.FC<ElectronicsLabProps> = ({ mode }) => {
  // RLC State
  const [res, setRes] = useState(100); // Ohm
  const [ind, setInd] = useState(0.1); // Henry
  const [cap, setCap] = useState(100e-6); // Farad
  const [freq, setFreq] = useState(50); // Hz

  // Oscilloscope State
  const [timeDiv, setTimeDiv] = useState(5); // ms
  const [ampDiv, setAmpDiv] = useState(2); // V
  const [signalType, setSignalType] = useState<'sine' | 'square'>('sine');

  // Induction State
  const [magnetPos, setMagnetPos] = useState(0); // 0-100
  const [flux, setFlux] = useState(0);
  const [inducedCurrent, setInducedCurrent] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (mode === AppMode.SIM_RUN_OSCILLOSCOPE) {
       drawOscilloscope();
    }
  }, [mode, freq, timeDiv, ampDiv, signalType]);

  const drawOscilloscope = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let x=0; x<canvas.width; x+=50) { ctx.moveTo(x,0); ctx.lineTo(x, canvas.height); }
    for(let y=0; y<canvas.height; y+=50) { ctx.moveTo(0,y); ctx.lineTo(canvas.width, y); }
    ctx.stroke();

    // Signal
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const centerY = canvas.height / 2;
    for (let x = 0; x < canvas.width; x++) {
      const t = x * (timeDiv / 50); // scale time
      let y = 0;
      if (signalType === 'sine') {
         y = Math.sin(t * freq * 0.1) * (50 / ampDiv); 
      } else {
         y = Math.sign(Math.sin(t * freq * 0.1)) * (50 / ampDiv);
      }
      ctx.lineTo(x, centerY - y * 20); // Scale amplitude
    }
    ctx.stroke();
  };

  const handleMagnetMove = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPos = Number(e.target.value);
    const delta = newPos - magnetPos;
    setMagnetPos(newPos);
    // Faraday: EMF ~ - dFlux/dt
    // Flux is max when magnet is in center (50)
    const dist = Math.abs(50 - newPos);
    const currentFlux = 1000 / (dist + 10);
    setFlux(currentFlux);
    
    // Induced current proportional to speed of change
    setInducedCurrent(Math.abs(delta) * 5 * (dist < 20 ? 1 : 0.1));
    setTimeout(() => setInducedCurrent(0), 100);
  };

  const renderRLC = () => {
    const { Z, phase, I } = calculateImpedance(res, ind, cap, freq);
    const resonanceFreq = 1 / (2 * Math.PI * Math.sqrt(ind * cap));

    return (
       <div className="flex flex-col h-full gap-4">
          <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 p-8 flex items-center justify-center relative">
             {/* Circuit Diagram Visual */}
             <div className="w-full max-w-md h-40 border-2 border-slate-600 rounded-lg relative flex items-center justify-between px-10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-2 text-slate-400">Series RLC</div>
                <div className="flex flex-col items-center gap-1"><div className="w-12 h-4 border-2 border-white bg-slate-800"></div><span className="text-xs">R ({res}Ω)</span></div>
                <div className="flex flex-col items-center gap-1"><div className="w-12 h-4 bg-slate-600 rounded-full"></div><span className="text-xs">L ({(ind*1000).toFixed(0)}mH)</span></div>
                <div className="flex flex-col items-center gap-1"><div className="flex gap-1"><div className="w-1 h-6 bg-white"></div><div className="w-1 h-6 bg-white"></div></div><span className="text-xs">C ({(cap*1e6).toFixed(0)}µF)</span></div>
             </div>
             {/* Current Visual */}
             <div className="absolute bottom-4 left-4 right-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                   className="h-full bg-amber-500 transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
                   style={{ width: `${Math.min(I * 100, 100)}%`, opacity: I }}
                ></div>
             </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Impedance (Z)</div>
                <div className="text-2xl font-bold text-white font-mono">{Z.toFixed(1)} Ω</div>
             </div>
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Current (I)</div>
                <div className="text-2xl font-bold text-amber-400 font-mono">{I.toFixed(2)} A</div>
             </div>
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Resonance Freq</div>
                <div className="text-2xl font-bold text-blue-400 font-mono">{resonanceFreq.toFixed(1)} Hz</div>
             </div>
          </div>
       </div>
    );
  };

  const renderOscilloscope = () => (
    <div className="flex flex-col h-full bg-black rounded-xl border-4 border-slate-600 p-2 relative shadow-2xl">
      <canvas ref={canvasRef} width={800} height={400} className="w-full h-full rounded bg-slate-900 cursor-crosshair"></canvas>
      <div className="absolute top-4 right-4 text-green-500 font-mono text-xs flex flex-col items-end">
         <div>CH1: {ampDiv}V/div</div>
         <div>T: {timeDiv}ms/div</div>
         <div>Freq: {freq}Hz</div>
      </div>
    </div>
  );

  const renderInduction = () => (
     <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-700 relative overflow-hidden items-center justify-center">
        {/* Coil */}
        <div className="w-64 h-64 border-[12px] border-amber-600/50 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
           <div className={`w-full h-full rounded-full border-4 border-amber-500 ${inducedCurrent > 5 ? 'shadow-[0_0_30px_rgba(245,158,11,0.6)]' : ''} transition-shadow duration-100`}></div>
        </div>

        {/* Magnet */}
        <div 
           className="w-48 h-16 flex rounded shadow-xl z-10 transition-transform duration-75 cursor-ew-resize"
           style={{ transform: `translateX(${(magnetPos - 50) * 4}px)` }}
        >
           <div className="flex-1 bg-red-600 rounded-l flex items-center justify-center text-white font-bold">N</div>
           <div className="flex-1 bg-slate-300 rounded-r flex items-center justify-center text-black font-bold">S</div>
        </div>

        {/* Galvonometer */}
        <div className="absolute bottom-8 w-48 h-24 bg-slate-800 rounded-t-full border border-slate-600 flex items-end justify-center pb-2 overflow-hidden">
           <div 
              className="w-1 h-20 bg-red-500 origin-bottom transition-transform duration-100"
              style={{ transform: `rotate(${inducedCurrent * (Math.random() > 0.5 ? 1 : -1) * 5}deg)` }}
           ></div>
           <div className="absolute bottom-0 text-xs text-slate-400 font-mono">GALVANOMETER</div>
        </div>
     </div>
  );

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
      <div className="lg:col-span-3 bg-lab-card border border-slate-700 rounded-2xl p-4 flex flex-col gap-6">
         <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
            <Settings size={20} /> Controls
         </div>
         
         <div className="space-y-6">
           {(mode === AppMode.SIM_RUN_CIRCUIT || mode === AppMode.SIM_RUN_OSCILLOSCOPE) && (
             <>
               <div>
                  <label className="text-sm text-slate-400">Frequency ({freq} Hz)</label>
                  <input type="range" min="1" max="1000" value={freq} onChange={(e) => setFreq(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-purple-500" />
               </div>
               {mode === AppMode.SIM_RUN_CIRCUIT && (
                  <>
                    <div>
                      <label className="text-sm text-slate-400">Resistance ({res} Ω)</label>
                      <input type="range" min="10" max="1000" value={res} onChange={(e) => setRes(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-blue-500" />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Inductance ({(ind*1000).toFixed(0)} mH)</label>
                      <input type="range" min="0.01" max="1.0" step="0.01" value={ind} onChange={(e) => setInd(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-green-500" />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Capacitance ({(cap*1e6).toFixed(0)} µF)</label>
                      <input type="range" min="1e-6" max="500e-6" step="1e-6" value={cap} onChange={(e) => setCap(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-amber-500" />
                    </div>
                  </>
               )}
               {mode === AppMode.SIM_RUN_OSCILLOSCOPE && (
                 <>
                   <div>
                      <label className="text-sm text-slate-400">Time Div ({timeDiv} ms)</label>
                      <input type="range" min="1" max="50" value={timeDiv} onChange={(e) => setTimeDiv(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-green-500" />
                   </div>
                   <div>
                      <label className="text-sm text-slate-400">Amp Div ({ampDiv} V)</label>
                      <input type="range" min="1" max="10" value={ampDiv} onChange={(e) => setAmpDiv(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-green-500" />
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => setSignalType('sine')} className={`flex-1 py-2 text-xs font-bold rounded ${signalType === 'sine' ? 'bg-green-600 text-white' : 'bg-slate-800'}`}>SINE</button>
                      <button onClick={() => setSignalType('square')} className={`flex-1 py-2 text-xs font-bold rounded ${signalType === 'square' ? 'bg-green-600 text-white' : 'bg-slate-800'}`}>SQUARE</button>
                   </div>
                 </>
               )}
             </>
           )}

           {mode === AppMode.SIM_RUN_INDUCTION && (
              <div>
                 <label className="text-sm text-slate-400">Magnet Position</label>
                 <input type="range" min="0" max="100" value={magnetPos} onChange={handleMagnetMove} className="w-full h-2 bg-slate-700 rounded-lg accent-red-500" />
                 <p className="text-xs text-slate-500 mt-2">Drag slider quickly to generate current</p>
              </div>
           )}
         </div>
      </div>

      <div className="lg:col-span-9 h-full">
         {mode === AppMode.SIM_RUN_CIRCUIT && renderRLC()}
         {mode === AppMode.SIM_RUN_OSCILLOSCOPE && renderOscilloscope()}
         {mode === AppMode.SIM_RUN_INDUCTION && renderInduction()}
      </div>
    </div>
  );
};
