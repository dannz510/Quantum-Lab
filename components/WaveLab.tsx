
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Waves, Radio, Loader2, Sparkles, X } from 'lucide-react';
import { analyzeExperimentData } from '../services/gemini';
import { AppMode, Language } from '../types';

interface WaveLabProps {
  mode: AppMode;
  lang: Language;
}

export const WaveLab: React.FC<WaveLabProps> = ({ mode, lang }) => {
  const t = (en: string, vi: string) => lang === 'vi' ? vi : en;

  const [frequency, setFrequency] = useState(2);
  const [sourceSpeed, setSourceSpeed] = useState(0);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const summary = mode === AppMode.SIM_RUN_RIPPLE 
      ? `Ripple Tank: Frequency=${frequency}Hz, Interference pattern observed.`
      : `Doppler Effect: Source Speed=${sourceSpeed}, Frequency=${frequency}Hz`;
      
    const result = await analyzeExperimentData("Wave Lab", { mode }, summary, lang);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
       timeRef.current += 0.05;
       const width = canvas.width;
       const height = canvas.height;
       
       ctx.fillStyle = '#0f172a';
       ctx.fillRect(0, 0, width, height);

       if (mode === AppMode.SIM_RUN_RIPPLE) {
          // Simulate 2 sources interference
          const cx = width / 2;
          const cy = height / 2;
          const separation = 40;
          
          const imageData = ctx.createImageData(width, height);
          const data = imageData.data;

          for (let x = 0; x < width; x+=4) { // Optimization: skip pixels
             for (let y = 0; y < height; y+=4) {
                const d1 = Math.sqrt((x - (cx - separation))**2 + (y - cy)**2);
                const d2 = Math.sqrt((x - (cx + separation))**2 + (y - cy)**2);
                
                const val1 = Math.sin(d1 * 0.1 - timeRef.current * frequency);
                const val2 = Math.sin(d2 * 0.1 - timeRef.current * frequency);
                
                const interfere = (val1 + val2) / 2; // -1 to 1
                
                // Map to color (blue scale)
                const intensity = Math.floor((interfere + 1) * 127);
                
                // Fill block of 4x4
                for(let dx=0; dx<4; dx++) {
                   for(let dy=0; dy<4; dy++) {
                      if (x+dx < width && y+dy < height) {
                         const i = ((y+dy) * width + (x+dx)) * 4;
                         data[i] = 0; // r
                         data[i+1] = intensity * 0.8; // g
                         data[i+2] = intensity + 50; // b
                         data[i+3] = 255;
                      }
                   }
                }
             }
          }
          ctx.putImageData(imageData, 0, 0);
          
          // Draw sources
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(cx - separation, cy, 4, 0, Math.PI*2);
          ctx.arc(cx + separation, cy, 4, 0, Math.PI*2);
          ctx.fill();

       } else if (mode === AppMode.SIM_RUN_DOPPLER) {
          const cx = width / 2;
          const cy = height / 2;
          
          const loopTime = (timeRef.current * 0.5) % (width + 100);
          const sx = (timeRef.current * sourceSpeed * 5) % (width + 100) - 50;
          const effectiveX = sourceSpeed > 0 ? sx : cx; 
          
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          
          for (let i = 0; i < 20; i++) {
             const t = (timeRef.current - i * (5/frequency));
             if (t > 0) {
                const radius = t * 10;
                // Center of this wavefront depends on where source WAS when emitted
                // x = currentX - speed * timeSinceEmission
                const emitX = effectiveX - (sourceSpeed * 5) * (t * 0.1); // approx
                
                ctx.beginPath();
                ctx.arc(sourceSpeed > 0 ? emitX : cx, cy, radius, 0, Math.PI * 2);
                ctx.stroke();
             }
          }

          // Source dot
          ctx.fillStyle = 'yellow';
          ctx.beginPath();
          ctx.arc(effectiveX, cy, 6, 0, Math.PI*2);
          ctx.fill();
       }

       frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameRef.current);
  }, [mode, frequency, sourceSpeed]);

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
      <div className="lg:col-span-3 bg-lab-card border border-slate-700 rounded-2xl p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
         <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
            <Settings size={20} /> Wave Controls
         </div>
         <div className="space-y-6">
            <div>
               <label className="text-sm text-slate-400">{t('Frequency', 'Tần Số')} ({frequency} Hz)</label>
               <input type="range" min="0.5" max="5" step="0.1" value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-sky-500" />
            </div>
            {mode === AppMode.SIM_RUN_DOPPLER && (
               <div>
                  <label className="text-sm text-slate-400">{t('Source Speed', 'Tốc Độ Nguồn')} (Mach {sourceSpeed/10})</label>
                  <input type="range" min="0" max="20" value={sourceSpeed} onChange={(e) => setSourceSpeed(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-lime-500" />
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
                  {t('Analyze Wave', 'Phân Tích Sóng')}
                </button>
              )}
            </div>
         </div>
      </div>

      <div className="lg:col-span-9 h-full bg-black rounded-xl border border-slate-700 overflow-hidden">
         <canvas ref={canvasRef} width={800} height={500} className="w-full h-full" />
      </div>
    </div>
  );
};
