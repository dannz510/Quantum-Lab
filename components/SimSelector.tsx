import React, { useState } from 'react';
import { ArrowLeft, Play, Lock, Film, Activity, Waves, Zap, Magnet, Orbit, Triangle, Droplets, Radio, MoveHorizontal, AlignCenter, Globe, SortAsc, Link2, Aperture, MonitorPlay, Sun, Thermometer, Atom, Layers, Eye, Battery } from 'lucide-react';
import { AppMode, SimulationStats, Language } from '../types';

interface SimSelectorProps {
  setMode: (mode: AppMode) => void;
  lang: Language;
}

// FULL LIBRARY
const SIMULATIONS: SimulationStats[] = [
  // --- MECHANICS ---
  {
    id: 'pendulum', name: 'Simple Pendulum', nameVi: 'Con Lắc Đơn',
    category: 'Mechanics', difficulty: 'Easy',
    description: 'Harmonic motion, damping, energy conservation.',
    descriptionVi: 'Dao động điều hòa, tắt dần, bảo toàn năng lượng.',
    thumbnailColor: 'bg-teal-500'
  },
  {
    id: 'inclined', name: 'Inclined Plane', nameVi: 'Mặt Phẳng Nghiêng',
    category: 'Mechanics', difficulty: 'Medium',
    description: 'Friction, forces, vectors on a ramp.',
    descriptionVi: 'Ma sát, lực, phân tích vector trên dốc.',
    thumbnailColor: 'bg-emerald-600'
  },
  {
    id: 'fluids', name: 'Archimedes Fluid', nameVi: 'Thủy Lực Archimedes',
    category: 'Mechanics', difficulty: 'Hard',
    description: 'Buoyancy, fluid density, displacement.',
    descriptionVi: 'Lực đẩy Ác-si-mét, mật độ, sự dịch chuyển.',
    thumbnailColor: 'bg-cyan-600'
  },
  {
    id: 'mould', name: 'Chain Fountain', nameVi: 'Hiệu Ứng Mould',
    category: 'Mechanics', difficulty: 'Medium',
    description: 'Self-siphoning beads dynamics.',
    descriptionVi: 'Động lực học chuỗi hạt tự phun.',
    thumbnailColor: 'bg-pink-600'
  },
  {
    id: 'projectile', name: 'Projectile Motion', nameVi: 'Chuyển Động Ném Xiên',
    category: 'Mechanics', difficulty: 'Easy',
    description: 'Cannonball trajectory, drag, gravity.',
    descriptionVi: 'Quỹ đạo đạn pháo, sức cản, trọng lực.',
    thumbnailColor: 'bg-orange-500'
  },
  {
    id: 'collisions', name: 'Collision Lab', nameVi: 'Va Chạm Đàn Hồi',
    category: 'Mechanics', difficulty: 'Medium',
    description: 'Elastic/Inelastic collisions in 1D/2D.',
    descriptionVi: 'Va chạm đàn hồi/mềm trong 1D/2D.',
    thumbnailColor: 'bg-red-500'
  },
  {
    id: 'springs', name: 'Hooke\'s Law', nameVi: 'Định Luật Hooke',
    category: 'Mechanics', difficulty: 'Easy',
    description: 'Spring force, potential energy, oscillation.',
    descriptionVi: 'Lực đàn hồi, thế năng, dao động lò xo.',
    thumbnailColor: 'bg-green-500'
  },
  
  // --- OPTICS (NEW & EXPANDED) ---
  {
    id: 'optics_prism', name: 'Prism & Refraction', nameVi: 'Lăng Kính & Khúc Xạ',
    category: 'Optics', difficulty: 'Medium',
    description: 'Light dispersion (rainbows), Snell\'s law.',
    descriptionVi: 'Tán sắc ánh sáng (cầu vồng), định luật Snell.',
    thumbnailColor: 'bg-indigo-500'
  },
  {
    id: 'lenses', name: 'Geometric Optics', nameVi: 'Quang Hình Học',
    category: 'Optics', difficulty: 'Medium',
    description: 'Lenses, mirrors, focal points, image formation.',
    descriptionVi: 'Thấu kính, gương, tiêu điểm, tạo ảnh.',
    thumbnailColor: 'bg-blue-400'
  },
  {
    id: 'color', name: 'Color Mixing', nameVi: 'Pha Trộn Màu',
    category: 'Optics', difficulty: 'Easy',
    description: 'RGB additive and CMYK subtractive mixing.',
    descriptionVi: 'Pha màu cộng RGB và trừ CMYK.',
    thumbnailColor: 'bg-fuchsia-500'
  },

  // --- WAVES ---
  {
    id: 'ripple', name: 'Ripple Tank 3D', nameVi: 'Bể Sóng 3D',
    category: 'Waves', difficulty: 'Medium',
    description: 'Interference, diffraction in water.',
    descriptionVi: 'Giao thoa, nhiễu xạ sóng nước.',
    thumbnailColor: 'bg-sky-500'
  },
  {
    id: 'doppler', name: 'Doppler Effect', nameVi: 'Hiệu Ứng Doppler',
    category: 'Waves', difficulty: 'Easy',
    description: 'Sound frequency shift source/observer.',
    descriptionVi: 'Dịch chuyển tần số âm thanh nguồn/người xem.',
    thumbnailColor: 'bg-lime-600'
  },
  {
    id: 'simplewave', name: 'Wave on a String', nameVi: 'Sóng Trên Dây',
    category: 'Waves', difficulty: 'Easy',
    description: 'Amplitude, frequency, tension effects.',
    descriptionVi: 'Biên độ, tần số, lực căng dây.',
    thumbnailColor: 'bg-indigo-500'
  },

  // --- THERMODYNAMICS (NEW CATEGORY) ---
  {
    id: 'gas', name: 'Ideal Gas Law', nameVi: 'Khí Lý Tưởng',
    category: 'Thermodynamics', difficulty: 'Medium',
    description: 'PV=nRT, kinetic molecular theory.',
    descriptionVi: 'PV=nRT, thuyết động học phân tử.',
    thumbnailColor: 'bg-orange-600'
  },
  {
    id: 'states', name: 'States of Matter', nameVi: 'Trạng Thái Vật Chất',
    category: 'Thermodynamics', difficulty: 'Easy',
    description: 'Solid, liquid, gas phase changes.',
    descriptionVi: 'Chuyển pha rắn, lỏng, khí.',
    thumbnailColor: 'bg-blue-300'
  },
  {
    id: 'friction_heat', name: 'Friction & Heat', nameVi: 'Ma Sát & Nhiệt',
    category: 'Thermodynamics', difficulty: 'Easy',
    description: 'Mechanical energy to thermal energy.',
    descriptionVi: 'Cơ năng chuyển thành nhiệt năng.',
    thumbnailColor: 'bg-red-700'
  },

  // --- ELECTRONICS ---
  {
    id: 'circuit', name: 'RLC Circuit', nameVi: 'Mạch RLC',
    category: 'Electronics', difficulty: 'Medium',
    description: 'AC circuits, resonance, phase.',
    descriptionVi: 'Mạch xoay chiều, cộng hưởng, pha.',
    thumbnailColor: 'bg-amber-600'
  },
  {
    id: 'oscilloscope', name: 'Oscilloscope', nameVi: 'Dao Động Ký',
    category: 'Electronics', difficulty: 'Medium',
    description: 'Visualize waveforms, voltage, frequency.',
    descriptionVi: 'Hiển thị dạng sóng, điện áp, tần số.',
    thumbnailColor: 'bg-orange-600'
  },
  {
    id: 'induction', name: 'Faraday\'s Law', nameVi: 'Định luật Faraday',
    category: 'Electronics', difficulty: 'Hard',
    description: 'Magnetic flux, induced EMF.',
    descriptionVi: 'Từ thông, suất điện động cảm ứng.',
    thumbnailColor: 'bg-red-600'
  },

  // --- QUANTUM & MODERN ---
  {
    id: 'slit', name: 'Double Slit', nameVi: 'Khe Y-âng',
    category: 'Quantum', difficulty: 'Hard',
    description: 'Wave-particle duality, interference.',
    descriptionVi: 'Lưỡng tính sóng-hạt, giao thoa.',
    thumbnailColor: 'bg-purple-600'
  },
  {
    id: 'spectrum', name: 'Atomic Spectrum', nameVi: 'Phổ Nguyên Tử',
    category: 'Quantum', difficulty: 'Hard',
    description: 'Bohr model, emission lines.',
    descriptionVi: 'Mô hình Bohr, vạch phát xạ.',
    thumbnailColor: 'bg-violet-600'
  },
  {
    id: 'tunneling', name: 'Tunneling', nameVi: 'Hiệu Ứng Đường Hầm',
    category: 'Quantum', difficulty: 'Hard',
    description: 'Probability waves crossing barriers.',
    descriptionVi: 'Sóng xác suất vượt rào cản.',
    thumbnailColor: 'bg-indigo-600'
  },
  {
    id: 'blackhole', name: 'Black Hole Merger', nameVi: 'Hợp Nhất Hố Đen',
    category: 'Quantum', difficulty: 'Hard',
    description: 'Gravitational waves, LIGO visualization.',
    descriptionVi: 'Sóng hấp dẫn, mô phỏng LIGO.',
    thumbnailColor: 'bg-gray-800'
  },
  {
    id: 'rutherford', name: 'Rutherford Scattering', nameVi: 'Tán Xạ Rutherford',
    category: 'Quantum', difficulty: 'Hard',
    description: 'Atomic nucleus discovery.',
    descriptionVi: 'Khám phá hạt nhân nguyên tử.',
    thumbnailColor: 'bg-slate-500'
  },
  
  // --- AI GENERATIVE ---
  {
    id: 'veo', name: 'Veo AI Lab', nameVi: 'Phòng Lab Veo AI',
    category: 'Mechanics', difficulty: 'Hard',
    description: 'Generative physics video from text.',
    descriptionVi: 'Video vật lý tạo sinh từ văn bản.',
    thumbnailColor: 'bg-blue-600'
  }
];

export const SimSelector: React.FC<SimSelectorProps> = ({ setMode, lang }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState<'difficulty' | 'name'>('difficulty');

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en;

  const categories = [
    { id: 'All', label: t('All Labs', 'Tất Cả'), icon: Layers },
    { id: 'Mechanics', label: t('Mechanics', 'Cơ Học'), icon: Triangle },
    { id: 'Waves', label: t('Waves', 'Sóng & Âm'), icon: Waves },
    { id: 'Optics', label: t('Optics', 'Quang Học'), icon: Sun },
    { id: 'Thermodynamics', label: t('Thermodynamics', 'Nhiệt Học'), icon: Thermometer },
    { id: 'Electronics', label: t('Electronics', 'Điện Từ'), icon: Zap },
    { id: 'Quantum', label: t('Quantum', 'Lượng Tử'), icon: Atom },
  ];

  const handleSelect = (sim: SimulationStats) => {
    switch (sim.id) {
      // Mechanics
      case 'pendulum': setMode(AppMode.SIM_RUN_PENDULUM); break;
      case 'inclined': setMode(AppMode.SIM_RUN_INCLINED); break;
      case 'fluids': setMode(AppMode.SIM_RUN_FLUIDS); break;
      case 'projectile': setMode(AppMode.SIM_RUN_PROJECTILE); break; 
      case 'collisions': setMode(AppMode.SIM_RUN_COLLISIONS); break; 
      case 'springs': setMode(AppMode.SIM_RUN_SPRINGS); break; 
      case 'mould': setMode(AppMode.SIM_RUN_MOULD); break;
      case 'orbits': setMode(AppMode.SIM_RUN_ORBITS); break;
      case 'veo': setMode(AppMode.SIM_RUN_VEO); break;

      // Thermodynamics
      case 'gas': setMode(AppMode.SIM_RUN_GAS); break; 
      case 'states': setMode(AppMode.SIM_RUN_STATES); break; 
      case 'friction_heat': setMode(AppMode.SIM_RUN_HEAT); break; 

      // Waves
      case 'ripple': setMode(AppMode.SIM_RUN_RIPPLE); break;
      case 'doppler': setMode(AppMode.SIM_RUN_DOPPLER); break;
      case 'simplewave': setMode(AppMode.SIM_RUN_SIMPLE_WAVE); break;

      // Electronics
      case 'circuit': setMode(AppMode.SIM_RUN_CIRCUIT); break;
      case 'oscilloscope': setMode(AppMode.SIM_RUN_OSCILLOSCOPE); break;
      case 'induction': setMode(AppMode.SIM_RUN_INDUCTION); break;

      // Quantum
      case 'slit': setMode(AppMode.SIM_RUN_SLIT); break;
      case 'spectrum': setMode(AppMode.SIM_RUN_SPECTRUM); break;
      case 'tunneling': setMode(AppMode.SIM_RUN_TUNNELING); break;
      case 'rutherford': setMode(AppMode.SIM_RUN_RUTHERFORD); break; 
      case 'blackhole': setMode(AppMode.SIM_RUN_BLACKHOLE); break;

      // Optics
      case 'optics_prism': setMode(AppMode.SIM_RUN_OPTICS); break;
      case 'lenses': setMode(AppMode.SIM_RUN_LENSES); break; 
      case 'color': setMode(AppMode.SIM_RUN_COLOR); break; 

      default: setMode(AppMode.SIM_PLACEHOLDER); break;
    }
  };

  const filteredSims = SIMULATIONS.filter(s => activeTab === 'All' || s.category === activeTab).sort((a, b) => {
      if (sortBy === 'difficulty') {
          const levels = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
          return levels[a.difficulty] - levels[b.difficulty];
      }
      return a.name.localeCompare(b.name);
  });

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Top Header */}
      <div className="p-6 pb-2 flex flex-col gap-4 bg-slate-900/90 backdrop-blur z-10">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={() => setMode(AppMode.DASHBOARD)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                    <ArrowLeft className="text-slate-400" />
                </button>
                <h1 className="text-2xl font-bold text-white tracking-tight">{t('Simulation Library', 'Thư Viện Mô Phỏng')}</h1>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
                <SortAsc size={16} className="text-slate-400 ml-2" />
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-sm text-white font-medium p-1 outline-none cursor-pointer"
                >
                    <option value="difficulty">{t('Level', 'Độ khó')}</option>
                    <option value="name">{t('Name', 'Tên')}</option>
                </select>
            </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
            {categories.map(cat => {
                const Icon = cat.icon;
                return (
                    <button 
                        key={cat.id} 
                        onClick={() => setActiveTab(cat.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === cat.id ? 'bg-white text-slate-900 shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <Icon size={16}/> {cat.label}
                    </button>
                )
            })}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {filteredSims.map((sim) => (
                <div 
                    key={sim.id}
                    onClick={() => handleSelect(sim)}
                    className={`bg-lab-card border border-slate-700 rounded-2xl p-5 cursor-pointer group hover:border-lab-accent transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col h-full`}
                >
                    <div className={`absolute top-0 right-0 w-32 h-32 ${sim.thumbnailColor} opacity-5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:opacity-15 transition-opacity`}></div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className={`p-3 rounded-xl ${sim.thumbnailColor} bg-opacity-20 text-white group-hover:scale-110 transition-transform duration-300`}>
                            {sim.category === 'Mechanics' && <Triangle size={24}/>}
                            {sim.category === 'Waves' && <Waves size={24}/>}
                            {sim.category === 'Electronics' && <Zap size={24}/>}
                            {sim.category === 'Quantum' && <Atom size={24}/>}
                            {sim.category === 'Optics' && <Sun size={24}/>}
                            {sim.category === 'Thermodynamics' && <Thermometer size={24}/>}
                        </div>
                        {sim.isPlaceholder ? (
                            <span className="bg-slate-700 text-slate-400 text-[10px] font-bold px-2 py-1 rounded border border-slate-600">DEV</span>
                        ) : (
                            <span className={`text-[10px] font-bold px-2 py-1 rounded border border-slate-600 ${sim.difficulty === 'Hard' ? 'text-red-400 bg-red-900/20' : sim.difficulty === 'Medium' ? 'text-yellow-400 bg-yellow-900/20' : 'text-green-400 bg-green-900/20'}`}>
                                {sim.difficulty}
                            </span>
                        )}
                    </div>

                    <h3 className="font-bold text-white text-lg mb-1 group-hover:text-lab-accent transition-colors leading-tight">
                        {lang === 'vi' ? (sim.nameVi || sim.name) : sim.name}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">
                        {lang === 'vi' ? (sim.descriptionVi || sim.description) : sim.description}
                    </p>

                    <div className="flex items-center text-xs font-medium text-slate-500 group-hover:text-white transition-colors mt-auto">
                        {sim.isPlaceholder ? <Lock size={12} className="mr-1"/> : <Play size={12} className="mr-1 fill-current" />}
                        {sim.isPlaceholder ? t('In Development', 'Đang Phát Triển') : t('Run Simulation', 'Chạy Mô Phỏng')}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};