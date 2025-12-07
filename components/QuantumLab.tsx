
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Aperture, Settings, Play, Pause, RotateCcw, Zap, Target, Waves, Ruler, Microscope, Eye, Atom, Thermometer, BarChart2, Box, Share2, Loader2, Sparkles, X } from 'lucide-react';
import { AppMode, Language } from '../types';
import { analyzeExperimentData } from '../services/gemini';

interface QuantumLabProps {
  mode: AppMode;
  lang: Language;
}

// --- SUB-COMPONENTS FROM USER CODE ---

const QuantumDoubleSlit = ({ lang }: { lang: Language }) => {
  // State for controls
  const [isRunning, setIsRunning] = useState(false);
  const [particleType, setParticleType] = useState('electron'); // electron, photon, buckyball
  const [slitDistance, setSlitDistance] = useState(10); // d
  const [detectorActive, setDetectorActive] = useState(false); // Quan sát có làm sụp đổ hàm sóng
  const [phaseShift, setPhaseShift] = useState(0); // Bộ điều chỉnh pha
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // State for simulation visuals
  const [hits, setHits] = useState<number[]>([]); // Array of hit positions on the screen
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitsRef = useRef(hits);
  
  // Update hitsRef whenever hits state changes
  useEffect(() => {
      hitsRef.current = hits;
  }, [hits]);

  // Utility function for probability calculation (simplified for visualization)
  const calculateProbability = useCallback((x: number, W: number, L: number, d: number, lambda: number, phase: number) => {
    // W: screen width, L: slit distance to screen, d: distance between slits
    // lambda: de Broglie wavelength (simplified based on particle type)
    let lambda_val = 1;
    if (particleType === 'electron') lambda_val = 0.5;
    else if (particleType === 'buckyball') lambda_val = 0.05;
    else lambda_val = 1.2; 
    
    const k = 2 * Math.PI / lambda_val;
    const intensity = Math.cos(k * d * x / (2 * L) + phase / 2) ** 2;
    return intensity * Math.exp(-(x * x) / 5000); // Gaussian envelope
  }, [particleType]);

  // Simulation Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const centerX = W / 2;
    const L = 300; // Fixed screen distance for calculation
    
    // Function to draw the result pattern
    const drawResultPattern = () => {
        // Draw accumulated hits
        ctx.fillStyle = 'rgba(15, 23, 42, 0.5)'; // Slate-900 transparent background
        ctx.fillRect(0, 0, W, H);

        const hitMap = new Array(W).fill(0);
        hitsRef.current.forEach(hitX => {
            const index = Math.floor(hitX);
            if (index >= 0 && index < W) {
                hitMap[index]++;
            }
        });

        // Find max hit count for normalization
        const maxHits = Math.max(...hitMap);

        // Draw the accumulated pattern
        ctx.strokeStyle = '#34d399'; // Green/Teal
        for (let i = 0; i < W; i++) {
            const height = (hitMap[i] / (maxHits + 1)) * H;
            ctx.beginPath();
            ctx.moveTo(i, H);
            ctx.lineTo(i, H - height * 0.9);
            ctx.stroke();
        }
    };
    
    const runSimulation = () => {
      if (isRunning) {
        // 1. Calculate next hit position based on active state
        let hitX;
        if (detectorActive) {
            // Particle mode (no interference)
            hitX = centerX + (Math.random() - 0.5) * 50; 
        } else {
            // Wave mode (interference)
            const d = slitDistance;
            const probability_distribution = new Array(W).fill(0).map((_, i) => {
                const x = i - centerX;
                return calculateProbability(x, W, L, d, 0, phaseShift);
            });

            // Weighted random selection based on probability
            const totalProb = probability_distribution.reduce((a, b) => a + b, 0);
            let target = Math.random() * totalProb;
            let currentSum = 0;
            let selectedIndex = 0;
            for (let i = 0; i < W; i++) {
                currentSum += probability_distribution[i];
                if (currentSum >= target) {
                    selectedIndex = i;
                    break;
                }
            }
            hitX = selectedIndex;
        }

        // Add the new hit
        setHits(prevHits => {
            const newHits = [...prevHits, hitX];
            // Limit hits for performance and visual clarity
            return newHits.slice(newHits.length > 3000 ? newHits.length - 3000 : 0);
        });

        // 2. Redraw Pattern (done outside the physics loop)
      }
      drawResultPattern(); // Always redraw for continuous update
      animationFrameId = requestAnimationFrame(runSimulation);
    };

    animationFrameId = requestAnimationFrame(runSimulation);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, detectorActive, slitDistance, phaseShift, calculateProbability]);
  
  const handleReset = () => {
      setIsRunning(false);
      setHits([]);
      setDetectorActive(false);
      setAiAnalysis('');
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const summary = `Double Slit: Particle=${particleType}, Detector=${detectorActive}, Slit Dist=${slitDistance}, Phase Shift=${phaseShift}`;
    const result = await analyzeExperimentData("Double Slit Experiment", { particleType, detectorActive, slitDistance }, summary, lang);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  // Simplified FFT Visualization (Mock data for UI)
  const fftData = detectorActive ? [50, 20, 10, 5, 2] : [5, 40, 2, 30, 10, 50, 10, 30, 2, 40, 5];

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
      
      {/* CỘT THAM SỐ (LEFT PANEL) */}
      <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
            <Aperture size={20} className="text-emerald-500" /> Cấu Hình Thí Nghiệm Hai Khe
          </div>
          
          {/* Bộ điều khiển Vật liệu Hạt */}
          <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
              <label className="text-xs text-slate-400 block mb-2"><Waves size={14} className='inline mr-1'/> Vật Liệu Hạt (Ảnh hưởng đến Bước Sóng)</label>
              <select 
                  value={particleType} 
                  onChange={(e) => setParticleType(e.target.value)} 
                  className="w-full p-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              >
                  <option value="photon">Photon (Ánh Sáng)</option>
                  <option value="electron">Electron</option>
                  <option value="buckyball">Phân tử Buckyball (Khối lượng lớn)</option>
              </select>
          </div>
          
          {/* Công cụ Lưới/Dò Khe (Detector & Slit Controls) */}
          <div className="p-3 bg-slate-900 rounded-xl shadow-inner space-y-3">
              <div className='flex items-center justify-between'>
                  <label className="text-sm font-semibold text-white">Chế độ Quan sát (Máy dò)</label>
                  <button 
                      onClick={() => setDetectorActive(!detectorActive)} 
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${detectorActive ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}
                  >
                      <Eye size={14}/> {detectorActive ? 'BẬT' : 'TẮT'}
                  </button>
              </div>
              <p className='text-xs text-slate-400 italic'>{detectorActive ? 'Chế độ Hạt: Vân giao thoa bị xóa bỏ.' : 'Chế độ Sóng: Hiện tượng giao thoa sóng.'}</p>
              
              {/* Slit Distance */}
              <div>
                 <label className="text-xs text-slate-400 block mb-1">Khoảng cách giữa hai khe ({slitDistance.toFixed(1)} \mu m)</label>
                 <input type="range" min="1" max="20" step="0.5" value={slitDistance} onChange={(e) => setSlitDistance(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-emerald-500 cursor-pointer" />
              </div>
          </div>
          
          {/* Bộ Điều chỉnh Pha (Phase Regulator) */}
          <div className="p-3 bg-slate-900 rounded-xl shadow-inner space-y-2">
              <label className="text-xs text-slate-400 block mb-1"><Ruler size={14} className='inline mr-1'/> Bộ Điều chỉnh Pha (Shift)</label>
              <input type="range" min="-180" max="180" step="5" value={phaseShift} onChange={(e) => setPhaseShift(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-indigo-500 cursor-pointer" />
              <p className='text-sm text-indigo-400 text-center font-mono'>{phaseShift}° (Dịch chuyển vân giao thoa)</p>
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
                  <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                      {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Dừng' : 'Bắn Hạt'}
                  </button>
                  <button onClick={handleReset} className="p-2 bg-slate-700 rounded-xl hover:bg-slate-600 text-white transition-colors" title="Thiết Lập Lại"><RotateCcw size={16}/></button>
              </div>
          </div>
      </div>

      {/* CỘT MÔ PHỎNG (RIGHT PANEL) */}
      <div className="lg:col-span-9 flex flex-col gap-4">
          
          {/* Simulation Canvas and Slits */}
          <div className="flex-1 bg-black rounded-xl border border-slate-700 overflow-hidden relative shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-1/2 h-full relative">
                      {/* Slit Barrier */}
                      <div className="absolute inset-y-0 right-1/2 w-4 bg-slate-700 shadow-xl border-r border-slate-600 flex flex-col justify-center items-center gap-6">
                           <div className='absolute w-full h-[5%] bg-slate-900 shadow-[0_0_10px_rgba(0,0,0,1)]'></div>
                           <div className='absolute w-full h-[5%] bg-slate-900 shadow-[0_0_10px_rgba(0,0,0,1)]' style={{transform: `translateY(${slitDistance * 0.5}px)`}}></div>
                           <div className='absolute w-full h-[5%] bg-slate-900 shadow-[0_0_10px_rgba(0,0,0,1)]' style={{transform: `translateY(${-slitDistance * 0.5}px)`}}></div>
                           <div className="text-xs text-white -translate-x-1/2 rotate-90 absolute right-full top-1/2 transform -translate-y-1/2">KHE CHẮN</div>
                      </div>
                      {/* Wave Visualization (Simplified/Conceptual) */}
                      {!detectorActive && isRunning && (
                           <div className='absolute inset-0 right-1/2 animate-pulse pointer-events-none'>
                               <div className='absolute inset-0' style={{backgroundImage: 'radial-gradient(rgba(52, 211, 153, 0.3) 10%, transparent 70%)', opacity: 0.5, animation: 'wave-spread 2s infinite linear'}}></div>
                           </div>
                      )}
                  </div>
              </div>
              
              {/* Hit Screen */}
              <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
              <div className="absolute bottom-2 right-4 text-xs text-slate-500">{hits.length} Lượt bắn</div>
          </div>
          
          {/* Phân tích Biến đổi Fourier & Lưới Dò Cục bộ */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* FFT Analysis */}
              <div className='bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg'>
                  <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 mb-2"><Microscope size={16} className="text-indigo-400"/> Phân Tích Phổ Không Gian (FFT)</div>
                  <div className="h-20 flex items-end gap-1">
                      {fftData.map((height, index) => (
                          <div key={index} className="flex-1 bg-indigo-600 rounded-t-sm transition-all duration-300" style={{ height: `${height * 1.5}px` }}></div>
                      ))}
                  </div>
                  <p className='text-xs text-slate-400 mt-2 italic'>{detectorActive ? 'Phổ Gaussian (Hạt): Xác suất tập trung tại tâm.' : 'Phổ Tín hiệu Nhiễu xạ (Sóng): Các đỉnh nhọn rõ rệt.'}</p>
              </div>

              {/* Lưới Dò Cục bộ (Detector Grid) - Simplified UI */}
              <div className='bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg'>
                  <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 mb-2"><Target size={16} className="text-amber-400"/> Lưới Dò Cục Bộ (Local Detectors)</div>
                  <div className='h-20 flex justify-around items-center'>
                      {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className='text-center'>
                              <div className='text-xl text-amber-300'>{Math.round(Math.random() * 100)}%</div>
                              <div className='text-xs text-slate-500'>Vị trí {i}</div>
                          </div>
                      ))}
                  </div>
                  <p className='text-xs text-slate-400 mt-2 italic'>Tỷ lệ xác suất hạt được tìm thấy tại các vị trí khác nhau trên màn hình.</p>
              </div>
          </div>
      </div>
    </div>
  );
};

const QuantumAtomicSpectrum = ({ lang }: { lang: Language }) => {
    // State controls
    const [element, setElement] = useState('H'); // Hydrogen
    const [excitationTemp, setExcitationTemp] = useState(1000); // Kích thích nhiệt độ
    const [electronLevel, setElectronLevel] = useState(4); // Mức năng lượng hiện tại (n=4)
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Physics constants (Simplified Bohr for H-like atoms)
    const R = 1.097e7; // Rydberg constant (m^-1)
    const Z = useMemo(() => {
        if (element === 'H') return 1;
        if (element === 'He+') return 2;
        if (element === 'Li++') return 3;
        return 1;
    }, [element]);

    // Calculate energy and wavelength
    const calculateTransition = (n_final: number, n_initial: number) => {
        const factor = 1 / (n_final * n_final) - 1 / (n_initial * n_initial);
        const wavelength = 1 / (R * Z * Z * factor); // meter
        
        let series = '';
        if (n_final === 1) series = 'Lyman (UV)';
        if (n_final === 2) series = 'Balmer (Visible)';
        if (n_final === 3) series = 'Paschen (IR)';

        // Simplified color mapping for visible light (Balmer series)
        let color = '#ffffff';
        const lambda_nm = wavelength * 1e9;

        if (n_final === 2) {
            if (lambda_nm > 650) color = '#ef4444'; // H-alpha (Red)
            else if (lambda_nm > 480) color = '#22c55e'; // H-beta (Cyan)
            else if (lambda_nm > 430) color = '#3b82f6'; // H-gamma (Blue)
            else color = '#8b5cf6'; // Violet
        } else if (n_final === 1) {
            color = '#94a3b8'; // UV/Gray
        }

        return { wavelength: lambda_nm.toFixed(2), series, color, energy: factor * 13.6 * Z * Z };
    };

    // Generate possible transitions from the current level
    const possibleTransitions = useMemo(() => {
        const transitions = [];
        for (let n_final = 1; n_final < electronLevel; n_final++) {
            transitions.push(calculateTransition(n_final, electronLevel));
        }
        return transitions.filter(t => t.wavelength !== "Infinity" && parseFloat(t.wavelength) > 0);
    }, [electronLevel, Z]);

    // Simulate Electron Fall (Emission)
    const handleFall = (n_final: number) => {
        if (electronLevel <= n_final) return;
        setElectronLevel(n_final);
        // Alert replaced with console or visual feedback, as alerts interrupt flow
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const summary = `Atomic Spectrum: Element=${element}, Temp=${excitationTemp}K, Current Level n=${electronLevel}, Transitions=${possibleTransitions.length}`;
        const result = await analyzeExperimentData("Atomic Spectrum", { element, excitationTemp, electronLevel }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    // Energy Level Visuals (Conceptual)
    const maxLevel = 5;
    const energyLevels = Array.from({ length: maxLevel }, (_, i) => i + 1).reverse(); // [5, 4, 3, 2, 1]

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
            
            {/* CỘT THAM SỐ (LEFT PANEL) */}
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
                    <Atom size={20} className="text-blue-500" /> Cấu Hình Nguyên Tử & Kích Thích
                </div>

                {/* Bộ chọn Nguyên tố */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                    <label className="text-xs text-slate-400 block mb-2">Chọn Nguyên tố (Z - Điện tích hạt nhân)</label>
                    <select value={element} onChange={(e) => setElement(e.target.value)} className="w-full p-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:ring-blue-500 focus:border-blue-500 text-sm">
                        <option value="H">Hydrogen (Z=1)</option>
                        <option value="He+">Helium Ion (Z=2)</option>
                        <option value="Li++">Lithium Double Ion (Z=3)</option>
                    </select>
                </div>
                
                {/* Bộ điều khiển Nhiệt độ/Kích thích */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner space-y-3">
                    <label className="text-xs text-slate-400 block mb-1"><Thermometer size={14} className='inline mr-1'/> Nhiệt độ Kích thích ({excitationTemp} K)</label>
                    <input type="range" min="100" max="5000" step="100" value={excitationTemp} onChange={(e) => setExcitationTemp(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-red-500 cursor-pointer" />
                    <p className='text-sm text-red-400 text-center font-mono'>Nhiệt độ $\rightarrow$ Mức năng lượng ban đầu (n={electronLevel})</p>
                </div>

                {/* Phân tích Trạng thái Hiện tại */}
                <div className="p-3 bg-slate-700 rounded-xl shadow-lg border-l-4 border-blue-400">
                    <p className="text-sm font-bold text-white mb-1">Electron ở mức n={electronLevel}</p>
                    <p className="text-xs text-slate-300">Năng lượng liên kết: {(-13.6 * Z * Z / (electronLevel * electronLevel)).toFixed(2)} eV</p>
                    <p className="text-xs text-slate-400 italic mt-2">Chọn mức thấp hơn để electron phát xạ photon:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {energyLevels.filter(n => n < electronLevel).map(n => (
                            <button key={n} onClick={() => handleFall(n)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-xs rounded-lg transition-colors">
                                Rơi xuống n={n}
                            </button>
                        ))}
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
                        Phân Tích Phổ
                        </button>
                    )}
                </div>
            </div>

            {/* CỘT MÔ PHỎNG & VISUALS (RIGHT PANEL) */}
            <div className="lg:col-span-9 flex flex-col gap-4">
                
                {/* Orbital & Energy Level Visualization */}
                <div className="grid grid-cols-2 gap-4 flex-1">
                    {/* Energy Level Diagram */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg relative">
                        <div className="text-lg font-bold text-white mb-4">Biểu Đồ Mức Năng Lượng</div>
                        <div className='relative h-64 w-full'>
                            {energyLevels.map((n, index) => (
                                <div key={n} className="absolute w-full px-4" style={{ top: `${index * 50}px` }}>
                                    <div className={`h-1 rounded-full ${n === electronLevel ? 'bg-yellow-400 shadow-[0_0_10px_yellow]' : 'bg-slate-600'}`} style={{ width: `${100 - n * 10}%`, marginLeft: `${n * 5}%` }}></div>
                                    <span className="absolute left-0 text-xs -translate-y-1/2">n={n}</span>
                                    <span className="absolute right-0 text-xs -translate-y-1/2 text-slate-400">{(-13.6 * Z * Z / (n * n)).toFixed(2)} eV</span>
                                </div>
                            ))}
                            {/* Visualized Transitions */}
                            {possibleTransitions.map((t, index) => (
                                <div
                                    key={index}
                                    className="absolute animate-bounce"
                                    style={{ 
                                        color: t.color, 
                                        top: `${energyLevels.indexOf(electronLevel) * 50 + 20}px`, 
                                        left: `${100 + index * 10}px`,
                                        animationDelay: `${index * 0.5}s`
                                    }}
                                    title={`Phát xạ ${t.wavelength} nm`}
                                >
                                    <Zap size={16} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Atomic Orbital Visualization */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex flex-col items-center justify-center">
                        <div className="text-lg font-bold text-white mb-4">Trực Quan Hóa Quỹ Đạo Xác Suất</div>
                        <div className='relative w-40 h-40 border-2 border-dashed border-slate-600 rounded-full flex items-center justify-center'>
                            <div className='absolute w-4 h-4 bg-red-600 rounded-full shadow-[0_0_15px_rgba(255,0,0,0.8)]' title="Hạt Nhân"></div>
                            {/* Simplified Orbital Shape based on n */}
                            <div className={`w-32 h-32 rounded-full ${electronLevel === 1 ? 'bg-blue-600/50' : electronLevel === 2 ? 'bg-teal-600/50' : 'bg-purple-600/50'} shadow-inner border border-dashed ${electronLevel === 4 ? 'animate-pulse' : ''}`} style={{ transform: `scale(${electronLevel / maxLevel * 1.5})` }}></div>
                            <p className='absolute bottom-0 text-sm text-yellow-400'>n={electronLevel} ({electronLevel === 3 ? 'p-like' : 's-like'})</p>
                        </div>
                    </div>
                </div>
                
                {/* Máy Quang Phổ Độ Phân Giải Cao (Spectrometer) */}
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex flex-col">
                    <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 mb-2"><BarChart2 size={16} className="text-purple-400"/> Máy Quang Phổ Độ Phân Giải Cao</div>
                    <div className="relative h-20 bg-black/50 rounded-lg border border-slate-600 overflow-hidden flex items-end">
                        <div className='absolute inset-0 flex'>
                            {/* Simplified Spectrum with Lines */}
                            {possibleTransitions.map((t, index) => (
                                <div 
                                    key={index}
                                    className="h-full w-0.5 shadow-lg absolute" 
                                    style={{ 
                                        backgroundColor: t.color, 
                                        left: `${(parseFloat(t.wavelength) - 200) / 700 * 100}%`, // Position based on Wavelength (200-900nm range)
                                        boxShadow: `0 0 15px ${t.color}`,
                                        opacity: 0.8 
                                    }}
                                    title={`${t.series}: ${t.wavelength} nm`}
                                ></div>
                            ))}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-4 bg-slate-700 text-[10px] text-slate-400 flex justify-between px-2 items-center">
                            <span>200nm (UV)</span>
                            <span>400nm (Blue)</span>
                            <span>700nm (Red)</span>
                            <span>900nm (IR)</span>
                        </div>
                    </div>
                    <p className='text-xs text-slate-400 mt-2 italic'>Các vạch phổ của {element} theo dãy Balmer (có thể nhìn thấy) và Lyman/Paschen (không nhìn thấy).</p>
                </div>
            </div>
        </div>
    );
};

const QuantumTunneling = ({ lang }: { lang: Language }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [particleEnergy, setParticleEnergy] = useState(50); // Năng lượng Hạt (eV)
    const [barrierHeight, setBarrierHeight] = useState(80); // Chiều cao Rào cản 1 (eV)
    const [barrierWidth, setBarrierWidth] = useState(10); // Chiều rộng Rào cản 1 (nm)
    const [dualBarrierActive, setDualBarrierActive] = useState(false); // Cộng hưởng
    const [time, setTime] = useState(0);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reqRef = useRef(0);

    // Simplified Probability Calculation (approximated for UI)
    const calculateTransmissionProbability = useCallback(() => {
        const E = particleEnergy;
        const V = barrierHeight;
        const L = barrierWidth;
        const m = 1; // Simplified mass (m_e = 1)
        
        if (E >= V) return 1.0; // Over the barrier

        // Tunneling approximation (WKB)
        const alpha = Math.sqrt(2 * m * (V - E)); 
        const transmissionVal = Math.exp(-2 * alpha * L / 2); 
        
        // Add complexity for dual barrier (Resonant Tunneling)
        if (dualBarrierActive && E > 40 && E < 60) {
            // Mock resonance spike near E=50
            const resonancePeak = 0.8;
            const deviation = Math.abs(E - 50);
            return Math.min(1.0, transmissionVal + resonancePeak * Math.exp(-deviation / 2));
        }

        return transmissionVal;
    }, [particleEnergy, barrierHeight, barrierWidth, dualBarrierActive]);
    
    // Draw the simulation
    const drawSimulation = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const H_center = H * 0.7;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);

        // 1. Draw Barrier(s) (Rào cản Năng lượng)
        const V_norm = barrierHeight / 100 * H * 0.3;
        const L_norm = barrierWidth / 15 * 50; 
        const barrierX = W / 2;

        const drawBarrier = (x: number, width: number, height: number, color: string) => {
            ctx.fillStyle = color;
            ctx.fillRect(x - width / 2, H_center - height, width, height);
            ctx.strokeStyle = '#e2e8f0';
            ctx.strokeRect(x - width / 2, H_center - height, width, height);
        };
        
        drawBarrier(barrierX, L_norm, V_norm, 'rgba(159, 18, 57, 0.7)'); // Rào cản 1
        
        if (dualBarrierActive) {
            drawBarrier(barrierX + 100, L_norm * 0.8, V_norm * 0.8, 'rgba(147, 51, 234, 0.7)'); // Rào cản 2
        }
        
        // Base line for E=0
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(0, H_center);
        ctx.lineTo(W, H_center);
        ctx.stroke();

        // 2. Draw Wave Packet (Gói sóng)
        const A_initial = 1.0;
        const T_prob = calculateTransmissionProbability();
        const R_prob = 1.0 - T_prob; // Simplified reflection
        
        // Draw the Wave Packet as a probability density
        const wavePos = (time * 10) % (W + 200) - 100; // Moving position
        
        const drawWavePacket = (centerX: number, amplitude: number, color: string, speedFactor = 1) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let x = 0; x < W; x += 1) {
                const gaussian = amplitude * Math.exp(-((x - centerX) ** 2) / 500);
                // Quick oscillation for phase
                const oscillation = Math.sin(x / 5 + time * 20 * speedFactor); 
                const y = H_center - gaussian * 80 * oscillation;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            // Draw the |Psi|^2 envelope
            ctx.fillStyle = `${color.replace(')', ', 0.3)')}`; // Transparent fill
            ctx.beginPath();
            for (let x = 0; x < W; x += 1) {
                const envelope = amplitude * Math.exp(-((x - centerX) ** 2) / 500) * 80;
                ctx.lineTo(x, H_center - envelope);
            }
            for (let x = W - 1; x >= 0; x -= 1) {
                const envelope = amplitude * Math.exp(-((x - centerX) ** 2) / 500) * 80;
                ctx.lineTo(x, H_center + envelope);
            }
            ctx.fill();
        }
        
        // Draw initial/reflected wave (simplified logic)
        if (wavePos < barrierX - L_norm/2) {
             drawWavePacket(wavePos, A_initial, '#38bdf8'); // Sóng Tới (Incident)
        } else if (wavePos > barrierX + L_norm / 2) {
             // Draw reflected and transmitted wave components 
             const reflectedPos = barrierX - (wavePos - barrierX);
             drawWavePacket(reflectedPos, A_initial * Math.sqrt(R_prob), '#f97316'); // Sóng Phản xạ
             drawWavePacket(wavePos + 100, A_initial * Math.sqrt(T_prob) * 1.5, '#10b981', 0.9); // Sóng Truyền tải
        } else {
             // Wave interaction/tunneling happens here
             // Draw Evanescent Wave: amplitude drops sharply inside barrier
             drawWavePacket(wavePos, A_initial, '#38bdf8');
             // Show very small wave on the other side
             drawWavePacket(barrierX + L_norm / 2 + 50, A_initial * Math.sqrt(T_prob) * 0.5, '#10b981', 0.9);
        }

    }, [time, barrierHeight, barrierWidth, particleEnergy, dualBarrierActive, calculateTransmissionProbability]);

    // Animation Loop
    useEffect(() => {
        if (!isRunning) return;

        const animate = () => {
            setTime(t => t + 0.05);
            drawSimulation();
            reqRef.current = requestAnimationFrame(animate);
        };

        reqRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(reqRef.current);
    }, [isRunning, drawSimulation]);
    
    useEffect(() => {
        // Initial draw or redraw on param change
        drawSimulation();
    }, [drawSimulation]);

    const handleReset = () => {
        setIsRunning(false);
        setTime(0);
        drawSimulation();
        setAiAnalysis('');
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        const summary = `Quantum Tunneling: Energy=${particleEnergy}eV, Barrier Height=${barrierHeight}eV, Width=${barrierWidth}nm, Dual=${dualBarrierActive}`;
        const result = await analyzeExperimentData("Quantum Tunneling", { particleEnergy, barrierHeight, barrierWidth }, summary, lang);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    const T_prob = calculateTransmissionProbability();

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-slate-900 text-slate-100 overflow-hidden">
            
            {/* CỘT THAM SỐ (LEFT PANEL) */}
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-700 pb-2 flex-shrink-0">
                    <Box size={20} className="text-pink-500" /> Cấu Hình Rào Cản & Hạt
                </div>
                
                {/* Bộ Điều khiển Rào cản Kép (Resonance) */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner space-y-3">
                    <div className='flex items-center justify-between'>
                        <label className="text-sm font-semibold text-white">Chế độ Rào cản Kép (Cộng Hưởng)</label>
                        <button 
                            onClick={() => setDualBarrierActive(!dualBarrierActive)} 
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${dualBarrierActive ? 'bg-purple-600 hover:bg-purple-500' : 'bg-slate-700 hover:bg-slate-600'}`}
                        >
                            {dualBarrierActive ? 'BẬT' : 'TẮT'}
                        </button>
                    </div>
                    <p className='text-xs text-slate-400 italic'>Thử năng lượng E $\approx$ 50 eV để đạt Cộng Hưởng (nếu Dual Barrier BẬT).</p>
                </div>
                
                {/* Control: Barrier Height (Chiều cao) */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Chiều cao Rào cản (V) ({barrierHeight} eV)</label>
                   <input type="range" min="10" max="150" step="5" value={barrierHeight} onChange={(e) => setBarrierHeight(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-pink-500 cursor-pointer" />
                </div>
                
                {/* Control: Barrier Width (Chiều rộng) */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Chiều rộng Rào cản (L) ({barrierWidth.toFixed(1)} nm)</label>
                   <input type="range" min="1" max="20" step="0.5" value={barrierWidth} onChange={(e) => setBarrierWidth(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-pink-500 cursor-pointer" />
                </div>

                {/* Control: Particle Energy (Năng lượng Hạt) */}
                <div className="p-3 bg-slate-900 rounded-xl shadow-inner">
                   <label className="text-xs text-slate-400 block mb-1">Năng lượng Gói sóng (E) ({particleEnergy} eV)</label>
                   <input type="range" min="10" max="150" step="5" value={particleEnergy} onChange={(e) => setParticleEnergy(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg accent-sky-500 cursor-pointer" />
                   <p className='text-sm text-sky-400 text-center font-mono'>$E {particleEnergy < barrierHeight ? '<' : '\u2265'} V$: {particleEnergy < barrierHeight ? 'Xuyên Hầm' : 'Vượt Rào'}</p>
                </div>

                {/* Đồ thị Tỷ lệ Sóng (Transmission/Reflection Plot) */}
                <div className="p-3 bg-slate-700 rounded-xl shadow-lg border-l-4 border-yellow-400 mt-auto">
                    <p className="text-sm font-bold text-white mb-1"><Share2 size={14} className='inline mr-1'/> Tỷ Lệ Sóng (Probability)</p>
                    <div className='flex justify-between text-xs text-slate-300 font-mono'>
                        <span>Truyền tải (T)</span>
                        <span className='text-green-400'>{(T_prob * 100).toFixed(2)}%</span>
                    </div>
                    <div className='w-full h-2 bg-slate-900 rounded-full mt-1'>
                        <div className='h-full bg-green-500 rounded-full transition-all duration-500' style={{ width: `${T_prob * 100}%` }}></div>
                    </div>
                    <div className='flex justify-between text-xs text-slate-300 font-mono mt-2'>
                        <span>Phản xạ (R)</span>
                        <span className='text-red-400'>{((1 - T_prob) * 100).toFixed(2)}%</span>
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
                        <button onClick={() => setIsRunning(!isRunning)} className="flex-1 bg-pink-600 hover:bg-pink-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                            {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Dừng' : 'Mô Phỏng'}
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
                    <div className="absolute top-4 left-4 flex flex-col gap-1">
                       <div className="text-xs text-slate-500">Trạng thái: $E={particleEnergy.toFixed(1)}$ eV, $V={barrierHeight.toFixed(1)}$ eV</div>
                    </div>
                    <div className="absolute top-4 right-4 text-sm font-mono text-white p-2 bg-slate-900/70 rounded-lg">
                        {/* Đã sửa lỗi: Giảm độ phức tạp của cú pháp LaTeX bằng cách loại bỏ \left và \right */}
                        {'$\\mathcal{T} \\approx \\exp(-\\sqrt{2m(V-E)}\\cdot L)$'}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN EXPORT COMPONENT ---

export const QuantumLab: React.FC<QuantumLabProps> = ({ mode, lang }) => {
  if (mode === AppMode.SIM_RUN_SLIT) {
    return <QuantumDoubleSlit lang={lang} />;
  }
  if (mode === AppMode.SIM_RUN_SPECTRUM) {
    return <QuantumAtomicSpectrum lang={lang} />;
  }
  if (mode === AppMode.SIM_RUN_TUNNELING) {
    return <QuantumTunneling lang={lang} />;
  }
  return <div className="p-10 text-center text-slate-500">Mode not found</div>;
};