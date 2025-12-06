
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Activity, Zap, Magnet, Loader2, Sparkles, X } from 'lucide-react';
import { calculateImpedance } from '../services/physics';
import { analyzeExperimentData } from '../services/gemini';
import { AppMode, Language } from '../types';

interface ElectronicsLabProps {
  mode: AppMode;
  lang: Language;
}

export const ElectronicsLab: React.FC<ElectronicsLabProps> = ({ mode, lang }) => {
  const t = (en: string, vi: string) => lang === 'vi' ? vi : en;

  // RLC State
  const [res, setRes] = useState(100); 
  const [ind, setInd] = useState(0.1); 
  const [cap, setCap] = useState(100e-6); 
  const [freq, setFreq] = useState(50); 
  
  // Oscilloscope State
  const [timeDiv, setTimeDiv] = useState(5); 
  const [ampDiv, setAmpDiv] = useState(2); 
  const [signalType, setSignalType] = useState<'sine' | 'square'>('sine');

  // Induction State
  const [magnetPos, setMagnetPos] = useState(0); 
  const [inducedCurrent, setInducedCurrent] = useState(0);

  // AI
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (mode === AppMode.SIM_RUN_OSCILLOSCOPE) {
       drawOscilloscope();
    }
  }, [mode, freq, timeDiv, ampDiv, signalType]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    let summary = "";
    if (mode === AppMode.SIM_RUN_CIRCUIT) {
        const { Z, phase } = calculateImpedance(res, ind, cap, freq);
        summary = `RLC Circuit: R=${res}, L=${ind}, C=${cap}, Freq=${freq}, Z=${Z.toFixed(2)}, Phase=${phase.toFixed(2)}`;
    } else if (mode === AppMode.SIM_RUN_OSCILLOSCOPE) {
        summary = `Oscilloscope: Freq=${freq}, Signal=${signalType}`;
    } else {
        summary = `Induction: Moving magnet generated current spike.`;
    }
    const result = await analyzeExperimentData("Electronics Lab", { mode }, summary, lang);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const drawOscilloscope = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid with Glow
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let x=0; x<canvas.width; x+=50) { ctx.moveTo(x,0); ctx.lineTo(x, canvas.height); }
    for(let y=0; y<canvas.height; y+=50) { ctx.moveTo(0,y); ctx.lineTo(canvas.width, y); }
    ctx.stroke();

    // Signal with CRT Glow
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#10b981';
    ctx.beginPath();
    
    const centerY = canvas.height / 2;
    for (let x = 0; x < canvas.width; x++) {
      const t = x * (timeDiv / 50); 
      let y = 0;
      if (signalType === 'sine') {
         y = Math.sin(t * freq * 0.1) * (50 / ampDiv); 
      } else {
         y = Math.sign(Math.sin(t * freq * 0.1)) * (50 / ampDiv);
      }
      ctx.lineTo(x, centerY - y * 20); 
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const handleMagnetMove = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPos = Number(e.target.value);
    const delta = newPos - magnetPos;
    setMagnetPos(newPos);
    
    const dist = Math.abs(50 - newPos);
    setInducedCurrent(Math.abs(delta) * 5 * (dist < 20 ? 1 : 0.1));
    setTimeout(() => setInducedCurrent(0), 100);
  };

  const renderRLC = () => {
    const { Z, phase, I } = calculateImpedance(res, ind, cap, freq);
    const resonanceFreq = 1 / (2 * Math.PI * Math.sqrt(ind * cap));
    
    return (
       <div className="flex flex-col h-full gap-4">
          <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 p-8 flex items-center justify-center relative shadow-inner shadow-black/50">
             {/* Circuit Diagram Visual */}
             <div className="w-full max-w-md h-40 border-2 border-slate-600 rounded-lg relative flex items-center justify-between px-10 bg-slate-800/50 backdrop-blur-sm">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-2 text-slate-400 font-mono text-xs">SERIES RLC</div>
                <div className="flex flex-col items-center gap-1"><div className="w-12 h-4 border-2 border-white bg-slate-800"></div><span className="text-xs font-bold text-slate-300">R</span></div>
                <div className="flex flex-col items-center gap-1"><div className="w-12 h-4 bg-slate-600 rounded-full border border-slate-500"></div><span className="text-xs font-bold text-slate-300">L</span></div>
                <div className="flex flex-col items-center gap-1"><div className="flex gap-1"><div className="w-1 h-6 bg-white shadow-[0_0_5px_white]"></div><div className="w-1 h-6 bg-white shadow-[0_0_5px_white]"></div></div><span className="text-xs font-bold text-slate-300">C</span></div>
             </div>
             
             {/* Phasor Diagram (New Feature) */}
             <div className="absolute top-4 right-4 w-32 h-32 border border-slate-700 rounded-full bg-slate-950 flex items-center justify-center">
                 <div className="w-full h-px bg-slate-800 absolute"></div>
                 <div className="h-full w-px bg-slate-800 absolute"></div>
                 {/* Vector Z */}
                 <div className="w-1 h-16 bg-gradient-to-t from-blue-500 to-transparent absolute origin-bottom" style={{ transform: `translateY(-50%) rotate(${phase}deg)`, height: '40%' }}></div>
                 <span className="absolute text-[10px] text-blue-400 font-mono bottom-1">Phasor Z</span>
             </div>

             {/* Current Visual */}
             <div className="absolute bottom-4 left-4 right-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                   className="h-full bg-amber-500 transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.8)]" 
                   style={{ width: `${Math.min(I * 100, 100)}%`, opacity: I }}
                ></div>
             </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider">{t('Impedance', 'Trở Kháng')} (Z)</div>
                <div className="text-2xl font-bold text-white font-mono">{Z.toFixed(1)} Ω</div>
             </div>
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider">{t('Current', 'Dòng Điện')} (I)</div>
                <div className="text-2xl font-bold text-amber-400 font-mono">{I.toFixed(2)} A</div>
             </div>
             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider">{t('Resonance', 'Cộng Hưởng')}</div>
                <div className="text-2xl font-bold text-blue-400 font-mono">{resonanceFreq.toFixed(1)} Hz</div>
             </div>
          </div>
       </div>
    );
  };

  const renderOscilloscope = () => (
    <div className="flex flex-col h-full bg-black rounded-xl border-4 border-slate-600 p-2 relative shadow-2xl">
      <canvas ref={canvasRef} width={800} height={400} className="w-full h-full rounded bg-slate-900 cursor-crosshair"></canvas>
      <div className="absolute top-4 right-4 text-green-500 font-mono text-xs flex flex-col items-end pointer-events-none">
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
           className="w-48 h-16 flex rounded shadow-xl z-10 transition-transform duration-75 cursor-ew-resize hover:scale-105 active:scale-95"
           style={{ transform: `translateX(${(magnetPos - 50) * 4}px)` }}
        >
           <div className="flex-1 bg-red-600 rounded-l flex items-center justify-center text-white font-bold text-lg shadow-[inset_0_0_10px_rgba(0,0,0,0.3)]">N</div>
           <div className="flex-1 bg-slate-300 rounded-r flex items-center justify-center text-black font-bold text-lg shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">S</div>
        </div>

        {/* Galvonometer */}
        <div className="absolute bottom-8 w-48 h-24 bg-slate-800 rounded-t-full border border-slate-600 flex items-end justify-center pb-2 overflow-hidden shadow-lg">
           <div 
              className="w-1 h-20 bg-red-500 origin-bottom transition-transform duration-100 shadow-[0_0_5px_red]"
              style={{ transform: `rotate(${inducedCurrent * (Math.random() > 0.5 ? 1 : -1) * 5}deg)` }}
           ></div>
           <div className="absolute bottom-0 text-xs text-slate-400 font-mono mb-1">GALVANOMETER</div>
        </div>
     </div>
  );

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
      <div className="lg:col-span-3 bg-lab-card border border-slate-700 rounded-2xl p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
         <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
            <Settings size={20} /> {t('Controls', 'Điều Khiển')}
         </div>
         
         <div className="space-y-6">
           {(mode === AppMode.SIM_RUN_CIRCUIT || mode === AppMode.SIM_RUN_OSCILLOSCOPE) && (
             <>
               <div>
                  <label className="text-sm text-slate-400">{t('Frequency', 'Tần Số')} ({freq} Hz)</label>
                  <input type="range" min="1" max="1000" value={freq} onChange={(e) => setFreq(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-purple-500" />
               </div>
               {mode === AppMode.SIM_RUN_CIRCUIT && (
                  <>
                    <div>
                      <label className="text-sm text-slate-400">{t('Resistance', 'Điện Trở')} ({res} Ω)</label>
                      <input type="range" min="10" max="1000" value={res} onChange={(e) => setRes(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-blue-500" />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">{t('Inductance', 'Cảm Kháng')} ({(ind*1000).toFixed(0)} mH)</label>
                      <input type="range" min="0.01" max="1.0" step="0.01" value={ind} onChange={(e) => setInd(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-green-500" />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">{t('Capacitance', 'Dung Kháng')} ({(cap*1e6).toFixed(0)} µF)</label>
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
                 <label className="text-sm text-slate-400">{t('Magnet Position', 'Vị Trí Nam Châm')}</label>
                 <input type="range" min="0" max="100" value={magnetPos} onChange={handleMagnetMove} className="w-full h-2 bg-slate-700 rounded-lg accent-red-500" />
                 <p className="text-xs text-slate-500 mt-2">{t('Drag slider quickly to generate current', 'Kéo nhanh để tạo dòng điện')}</p>
              </div>
           )}

            <div className="pt-4 border-t border-slate-700 mt-auto">
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
                  {t('Analyze Circuit', 'Phân Tích Mạch')}
                </button>
              )}
            </div>
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
