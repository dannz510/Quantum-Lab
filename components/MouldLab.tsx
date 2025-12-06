
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Play, Pause, RotateCcw, Sparkles, Loader2, X, Link2 } from 'lucide-react';
import { ChainLink, stepChainFountain } from '../services/physics';
import { analyzeExperimentData } from '../services/gemini';
import { Language } from '../types';

interface MouldLabProps {
  lang: Language;
}

export const MouldLab: React.FC<MouldLabProps> = ({ lang }) => {
  const t = (en: string, vi: string) => lang === 'vi' ? vi : en;

  const [isRunning, setIsRunning] = useState(false);
  const [kickStrength, setKickStrength] = useState(15);
  const [chainLength, setChainLength] = useState(100);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const linksRef = useRef<ChainLink[]>([]);
  const reqRef = useRef<number>(0);

  // Initialize Chain
  useEffect(() => {
    handleReset();
  }, [chainLength]);

  const handleReset = () => {
    setIsRunning(false);
    const newLinks: ChainLink[] = [];
    // Start inside "beaker" at bottom left
    const startX = 100;
    const startY = 350;
    
    for (let i = 0; i < chainLength; i++) {
       // Coiled in beaker
       newLinks.push({
         x: startX + Math.random() * 20,
         y: startY - (i % 10) * 5, // stacked
         vx: 0,
         vy: 0,
         isFixed: false
       });
    }
    // Pull the first few links over the edge to start the flow
    for(let i=0; i<10; i++) {
       newLinks[i].x = 150 + i * 10;
       newLinks[i].y = 350 - i * 20;
       if (i > 5) newLinks[i].y += (i-5) * 30; // draping down
    }
    
    linksRef.current = newLinks;
    draw();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw Container (Beaker) with glass effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(80, 250);
    ctx.lineTo(80, 400);
    ctx.lineTo(160, 400);
    ctx.lineTo(160, 250);
    ctx.stroke();
    ctx.fill();

    // Draw Floor
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 400, width, 100);
    
    // Draw Floor reflection/shadow hint
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 405, width, 95);

    // Draw Connector Lines
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const links = linksRef.current;
    if (links.length > 0) {
      ctx.moveTo(links[0].x, links[0].y);
      for (let i = 1; i < links.length; i++) {
        ctx.lineTo(links[i].x, links[i].y);
      }
    }
    ctx.stroke();

    // Draw Metallic Beads
    for (const l of links) {
       ctx.beginPath();
       ctx.arc(l.x, l.y, 4, 0, Math.PI*2);
       // Gradient for metallic look
       const grad = ctx.createRadialGradient(l.x - 1, l.y - 1, 1, l.x, l.y, 4);
       grad.addColorStop(0, '#fbcfe8');
       grad.addColorStop(1, '#be185d');
       ctx.fillStyle = grad;
       ctx.fill();
    }
  };

  useEffect(() => {
    const animate = () => {
      if (isRunning) {
         linksRef.current = stepChainFountain(linksRef.current, 0.016, kickStrength, 400);
      }
      draw();
      reqRef.current = requestAnimationFrame(animate);
    };
    reqRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(reqRef.current);
  }, [isRunning, kickStrength]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const summary = `Mould Effect: Kick Strength=${kickStrength}, Chain Length=${chainLength}, Fountain height observed > container height.`;
    const result = await analyzeExperimentData("Chain Fountain", { kickStrength, chainLength }, summary, lang);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
       <div className="lg:col-span-3 bg-lab-card border border-slate-700 rounded-2xl p-4 flex flex-col gap-6">
          <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2">
            <Settings size={20} /> {t('Chain Properties', 'Thuộc Tính Chuỗi')}
          </div>
          
          <div className="space-y-6">
             <div>
                <label className="text-sm text-slate-400">{t('Kick Strength', 'Lực Phản Hồi')} ({kickStrength})</label>
                <input type="range" min="0" max="50" value={kickStrength} onChange={(e) => setKickStrength(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-pink-500" />
                <p className="text-xs text-slate-500 mt-1">{t('Simulates the lever arm effect on the floor.', 'Mô phỏng hiệu ứng đòn bẩy tại đáy cốc.')}</p>
             </div>
             <div>
                <label className="text-sm text-slate-400">{t('Chain Length', 'Độ Dài Chuỗi')} ({chainLength})</label>
                <input type="range" min="50" max="200" step="10" value={chainLength} onChange={(e) => setChainLength(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg accent-pink-500" />
             </div>
             
             <div className="flex gap-2 mt-4">
                 <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-pink-600 hover:bg-pink-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2">
                    {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? t('Stop', 'Dừng') : t('Drop', 'Thả')}
                 </button>
                 <button onClick={handleReset} className="p-2 bg-slate-700 rounded-xl hover:bg-slate-600 text-white"><RotateCcw size={16}/></button>
             </div>
          </div>
          
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
                  {t('Analyze Fountain', 'Phân Tích Đài Phun')}
                </button>
              )}
            </div>
       </div>
       
       <div className="lg:col-span-9 bg-black rounded-xl border border-slate-700 overflow-hidden relative">
          <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
          <div className="absolute top-4 left-4 text-xs font-mono text-pink-500">
             PHYSICS ENGINE: VERLET // KICKBACK ENABLED
          </div>
       </div>
    </div>
  );
};
