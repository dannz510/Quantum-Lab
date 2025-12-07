

export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  SIM_SELECTOR = 'SIM_SELECTOR',
  // Active Simulations
  SIM_RUN_PENDULUM = 'SIM_RUN_PENDULUM',
  SIM_RUN_VEO = 'SIM_RUN_VEO',
  SIM_RUN_CIRCUIT = 'SIM_RUN_CIRCUIT',
  SIM_RUN_SLIT = 'SIM_RUN_SLIT',
  // Newly Unlocked Simulations
  SIM_RUN_INCLINED = 'SIM_RUN_INCLINED',
  SIM_RUN_FLUIDS = 'SIM_RUN_FLUIDS',
  SIM_RUN_ORBITS = 'SIM_RUN_ORBITS',
  SIM_RUN_OSCILLOSCOPE = 'SIM_RUN_OSCILLOSCOPE',
  SIM_RUN_INDUCTION = 'SIM_RUN_INDUCTION',
  SIM_RUN_SPECTRUM = 'SIM_RUN_SPECTRUM',
  SIM_RUN_TUNNELING = 'SIM_RUN_TUNNELING',
  SIM_RUN_RIPPLE = 'SIM_RUN_RIPPLE',
  SIM_RUN_DOPPLER = 'SIM_RUN_DOPPLER',
  // New Mechanics Labs
  SIM_RUN_PROJECTILE = 'SIM_RUN_PROJECTILE',
  SIM_RUN_COLLISIONS = 'SIM_RUN_COLLISIONS',
  SIM_RUN_SPRINGS = 'SIM_RUN_SPRINGS',
  // New Modern Labs
  SIM_RUN_MOULD = 'SIM_RUN_MOULD',
  SIM_RUN_BLACKHOLE = 'SIM_RUN_BLACKHOLE',
  SIM_RUN_SIMPLE_WAVE = 'SIM_RUN_SIMPLE_WAVE',
  // NEW OPTICS LAB
  SIM_RUN_OPTICS = 'SIM_RUN_OPTICS',
  SIM_RUN_LENSES = 'SIM_RUN_LENSES',
  SIM_RUN_COLOR = 'SIM_RUN_COLOR',
  // NEW THERMODYNAMICS
  SIM_RUN_GAS = 'SIM_RUN_GAS',
  SIM_RUN_STATES = 'SIM_RUN_STATES',
  SIM_RUN_HEAT = 'SIM_RUN_HEAT',
  // NEW QUANTUM
  SIM_RUN_RUTHERFORD = 'SIM_RUN_RUTHERFORD',
  
  // Generic Placeholders for the expanded library
  SIM_PLACEHOLDER = 'SIM_PLACEHOLDER',

  CHAT_TUTOR = 'CHAT_TUTOR',
  DEEP_THINK = 'DEEP_THINK',
  SEARCH_GROUND = 'SEARCH_GROUND'
}

export type Language = 'en' | 'vi';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export interface SearchResult {
  text: string;
  groundingChunks?: Array<{
    web?: {
      uri?: string;
      title?: string;
    }
  }>;
}

export interface VideoGenerationState {
  status: 'idle' | 'generating' | 'completed' | 'error';
  videoUri?: string;
  progressMessage?: string;
  error?: string;
}

// --- New Types for QLAI Architecture ---

export interface Material {
  id: string;
  name: string;
  density: number; // kg/m^3
  frictionCoeff: number; // simplified for simulation
  color: string;
}

export interface DataPoint {
  time: number;
  value: number; // Generic value (angle, voltage, etc.)
  secondaryValue?: number; // e.g. velocity
}

export interface SimulationStats {
  id: string;
  name: string;
  nameVi?: string; // Vietnamese Name
  category: 'Mechanics' | 'Electronics' | 'Quantum' | 'Thermodynamics' | 'Waves' | 'Optics';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  descriptionVi?: string; // Vietnamese Description
  thumbnailColor: string;
  isPlaceholder?: boolean;
}

// Augment window for AI Studio specific methods
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}