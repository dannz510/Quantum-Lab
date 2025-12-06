
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
  // New Modern Labs
  SIM_RUN_MOULD = 'SIM_RUN_MOULD',
  SIM_RUN_BLACKHOLE = 'SIM_RUN_BLACKHOLE',

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
  category: 'Mechanics' | 'Electronics' | 'Quantum' | 'Thermodynamics' | 'Waves' | 'Forces';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  descriptionVi?: string; // Vietnamese Description
  thumbnailColor: string;
}

// Augment window for AI Studio specific methods
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
