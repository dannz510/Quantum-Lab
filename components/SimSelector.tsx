
import React, { useState } from 'react';
import { ArrowLeft, Play, Lock, Film, Activity, Waves, Zap, Magnet, Orbit, Triangle, Droplets, Radio, MoveHorizontal, AlignCenter, Globe, SortAsc } from 'lucide-react';
import { AppMode, SimulationStats, Language } from '../types';

interface SimSelectorProps {
  setMode: (mode: AppMode) => void;
  lang: Language;
}

const SIMULATIONS: SimulationStats[] = [
  // --- MECHANICS ---
  {
    id: 'pendulum',
    name: 'Simple Pendulum',
    nameVi: 'Con Lắc Đơn',
    category: 'Mechanics',
    difficulty: 'Easy',
    description: 'Explore harmonic motion, damping, and energy conservation. Includes large angle approximation.',
    descriptionVi: 'Khám phá dao động điều hòa, tắt dần và bảo toàn năng lượng. Bao gồm công thức góc lớn.',
    thumbnailColor: 'bg-teal-500'
  },
  {
    id: 'inclined',
    name: 'Inclined Plane',
    nameVi: 'Mặt Phẳng Nghiêng',
    category: 'Mechanics',
    difficulty: 'Medium',
    description: 'Analyze friction, forces, and motion on a ramp. Dynamic vector analysis included.',
    descriptionVi: 'Phân tích ma sát, lực và chuyển động trên dốc. Bao gồm phân tích vector động.',
    thumbnailColor: 'bg-emerald-600'
  },
  {
    id: 'fluids',
    name: 'Archimedes Fluid Lab',
    nameVi: 'Thủy Lực Archimedes',
    category: 'Mechanics',
    difficulty: 'Hard',
    description: 'Explore buoyancy, fluid resistance, and displacement with dynamic liquid surfaces.',
    descriptionVi: 'Khám phá lực đẩy Ác-si-mét, sức cản chất lỏng và sự dịch chuyển với bề mặt động.',
    thumbnailColor: 'bg-cyan-600'
  },
  {
    id: 'orbits',
    name: 'Gravitational Orbits',
    nameVi: 'Quỹ Đạo Hấp Dẫn',
    category: 'Forces',
    difficulty: 'Hard',
    description: 'Simulate multi-body orbits and gravitational force fields in a vacuum.',
    descriptionVi: 'Mô phỏng quỹ đạo đa vật thể và trường lực hấp dẫn trong chân không.',
    thumbnailColor: 'bg-slate-600'
  },
  {
    id: 'veo',
    name: 'Veo Generative Lab',
    nameVi: 'Phòng Lab Veo AI',
    category: 'Mechanics',
    difficulty: 'Hard',
    description: 'Use generative video to simulate complex scenarios like collisions from images.',
    descriptionVi: 'Sử dụng video tạo sinh để mô phỏng các tình huống phức tạp như va chạm từ ảnh.',
    thumbnailColor: 'bg-blue-600'
  },

  // --- ELECTRONICS ---
  {
    id: 'circuit',
    name: 'RLC Circuit Builder',
    nameVi: 'Mạch RLC',
    category: 'Electronics',
    difficulty: 'Medium',
    description: 'Design AC/DC circuits, analyze resonance, and visualize phase shifts.',
    descriptionVi: 'Thiết kế mạch AC/DC, phân tích cộng hưởng và trực quan hóa độ lệch pha.',
    thumbnailColor: 'bg-amber-600'
  },
  {
    id: 'oscilloscope',
    name: 'Virtual Oscilloscope',
    nameVi: 'Dao Động Ký Ảo',
    category: 'Electronics',
    difficulty: 'Medium',
    description: 'Visualize voltage waveforms, measure Vpp, Vrms, and frequency in real-time.',
    descriptionVi: 'Hiển thị dạng sóng điện áp, đo Vpp, Vrms và tần số theo thời gian thực.',
    thumbnailColor: 'bg-orange-600'
  },
  {
    id: 'induction',
    name: 'Faraday\'s Law',
    nameVi: 'Định luật Faraday',
    category: 'Electronics',
    difficulty: 'Hard',
    description: 'Move magnets through coils to generate current. Visualize magnetic flux lines.',
    descriptionVi: 'Di chuyển nam châm qua cuộn dây để tạo dòng điện. Hiển thị đường sức từ.',
    thumbnailColor: 'bg-red-600'
  },

  // --- QUANTUM & OPTICS ---
  {
    id: 'slit',
    name: 'Double Slit Exp.',
    nameVi: 'Thí Nghiệm Khe Y-âng',
    category: 'Quantum',
    difficulty: 'Hard',
    description: 'Observe wave-particle duality, interference patterns, and wavefunction collapse.',
    descriptionVi: 'Quan sát lưỡng tính sóng-hạt, vân giao thoa và sự sụp đổ hàm sóng.',
    thumbnailColor: 'bg-purple-600'
  },
  {
    id: 'spectrum',
    name: 'Atomic Spectrum',
    nameVi: 'Phổ Nguyên Tử',
    category: 'Quantum',
    difficulty: 'Hard',
    description: 'Analyze emission and absorption lines of elements using the Bohr model.',
    descriptionVi: 'Phân tích các vạch phát xạ và hấp thụ của nguyên tố sử dụng mô hình Bohr.',
    thumbnailColor: 'bg-violet-600'
  },
  {
    id: 'tunneling',
    name: 'Quantum Tunneling',
    nameVi: 'Hiệu Ứng Đường Hầm',
    category: 'Quantum',
    difficulty: 'Hard',
    description: 'Visualize probability waves crossing energy barriers.',
    descriptionVi: 'Trực quan hóa sóng xác suất vượt qua rào cản năng lượng.',
    thumbnailColor: 'bg-indigo-600'
  },

  // --- WAVES ---
  {
    id: 'ripple',
    name: 'Ripple Tank 3D',
    nameVi: 'Bể Sóng 3D',
    category: 'Waves',
    difficulty: 'Medium',
    description: 'Simulate wave interference, diffraction, and reflection in a water tank.',
    descriptionVi: 'Mô phỏng giao thoa, nhiễu xạ và phản xạ sóng trong bể nước.',
    thumbnailColor: 'bg-sky-500'
  },
  {
    id: 'doppler',
    name: 'Doppler Effect',
    nameVi: 'Hiệu Ứng Doppler',
    category: 'Waves',
    difficulty: 'Easy',
    description: 'Observe frequency shifts from moving sound or light sources.',
    descriptionVi: 'Quan sát sự thay đổi tần số từ nguồn âm hoặc ánh sáng chuyển động.',
    thumbnailColor: 'bg-lime-600'
  }
];

export const SimSelector: React.FC<SimSelectorProps> = ({ setMode, lang }) => {
  const [sortBy, setSortBy] = useState<'difficulty' | 'category' | 'name'>('difficulty');

  const handleSelect = (id: string) => {
    switch (id) {
      case 'pendulum': setMode(AppMode.SIM_RUN_PENDULUM); break;
      case 'veo': setMode(AppMode.SIM_RUN_VEO); break;
      case 'circuit': setMode(AppMode.SIM_RUN_CIRCUIT); break;
      case 'slit': setMode(AppMode.SIM_RUN_SLIT); break;
      case 'inclined': setMode(AppMode.SIM_RUN_INCLINED); break;
      case 'fluids': setMode(AppMode.SIM_RUN_FLUIDS); break;
      case 'orbits': setMode(AppMode.SIM_RUN_ORBITS); break;
      case 'oscilloscope': setMode(AppMode.SIM_RUN_OSCILLOSCOPE); break;
      case 'induction': setMode(AppMode.SIM_RUN_INDUCTION); break;
      case 'spectrum': setMode(AppMode.SIM_RUN_SPECTRUM); break;
      case 'tunneling': setMode(AppMode.SIM_RUN_TUNNELING); break;
      case 'ripple': setMode(AppMode.SIM_RUN_RIPPLE); break;
      case 'doppler': setMode(AppMode.SIM_RUN_DOPPLER); break;
      default: break;
    }
  };

  const getIcon = (id: string) => {
    switch(id) {
        case 'pendulum': return Activity;
        case 'veo': return Film;
        case 'inclined': return Triangle;
        case 'fluids': return Droplets;
        case 'orbits': return Orbit;
        case 'circuit': return Zap;
        case 'oscilloscope': return Activity;
        case 'induction': return Magnet;
        case 'slit': return AlignCenter;
        case 'spectrum': return Radio;
        case 'tunneling': return MoveHorizontal;
        case 'ripple': return Waves;
        case 'doppler': return Radio;
        default: return Activity;
    }
  };

  // Sorting Logic
  const sortedSims = [...SIMULATIONS].sort((a, b) => {
    if (sortBy === 'difficulty') {
      const levels = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
      return levels[a.difficulty] - levels[b.difficulty];
    }
    if (sortBy === 'category') {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en;

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => setMode(AppMode.DASHBOARD)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="text-slate-400" />
          </button>
          <h1 className="text-2xl font-bold text-white">{t('Simulation Library', 'Thư viện Mô phỏng')}</h1>
        </div>

        <div className="flex items-center gap-3">
           {/* Sort Toggle */}
           <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
              <SortAsc size={16} className="text-slate-400 ml-2" />
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-sm text-white font-medium p-1 outline-none cursor-pointer"
              >
                 <option value="difficulty">{t('Level', 'Độ khó')}</option>
                 <option value="category">{t('Category', 'Danh mục')}</option>
                 <option value="name">{t('Name', 'Tên')}</option>
              </select>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {sortedSims.map((sim) => {
          // Unlocking logic: ALL UNLOCKED
          const isUnlocked = true;
          const Icon = getIcon(sim.id);
          
          return (
            <div 
              key={sim.id}
              onClick={() => isUnlocked && handleSelect(sim.id)}
              className={`bg-lab-card border border-slate-700/50 rounded-2xl overflow-hidden group hover:border-slate-500 transition-all cursor-pointer relative flex flex-col h-full ${!isUnlocked ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className={`h-32 ${sim.thumbnailColor} bg-opacity-20 relative flex items-center justify-center overflow-hidden shrink-0`}>
                 <div className={`absolute inset-0 ${sim.thumbnailColor} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                 <Icon size={48} className={`${sim.thumbnailColor.replace('bg-', 'text-')} opacity-80 group-hover:scale-110 transition-transform duration-500`} />
                 {!isUnlocked && (
                   <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="flex items-center gap-2 text-slate-300 font-bold uppercase text-xs tracking-wider border border-slate-500 px-3 py-1 rounded-full bg-black/40"><Lock size={12} /> {t('Locked', 'Đã khóa')}</span>
                   </div>
                 )}
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                 <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{sim.category}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sim.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' : 
                      sim.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {sim.difficulty === 'Easy' ? t('Easy', 'Dễ') : sim.difficulty === 'Medium' ? t('Medium', 'Trung bình') : t('Hard', 'Khó')}
                    </span>
                 </div>
                 <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                   {lang === 'vi' && sim.nameVi ? sim.nameVi : sim.name}
                 </h3>
                 <p className="text-slate-400 text-sm mb-4 line-clamp-3 flex-1">
                   {lang === 'vi' && sim.descriptionVi ? sim.descriptionVi : sim.description}
                 </p>
                 
                 {isUnlocked && (
                   <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2 mt-auto">
                      <Play size={12} /> {t('Launch Lab', 'Chạy Lab')}
                   </button>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
