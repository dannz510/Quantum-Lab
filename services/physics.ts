
// Physics Engine for Real-time Simulations

export const G_EARTH = 9.81;

// --- Pendulum Physics ---

// Calculates the period of a simple pendulum
// T = 2 * pi * sqrt(L/g)
export const calculateIdealPeriod = (length: number, gravity: number = G_EARTH): number => {
  return 2 * Math.PI * Math.sqrt(length / gravity);
};

// Calculates the large angle period using the infinite series approximation (first 2 terms)
export const calculateLargeAnglePeriod = (length: number, gravity: number, maxAngleRad: number): number => {
  const t0 = calculateIdealPeriod(length, gravity);
  const sinHalfTheta = Math.sin(maxAngleRad / 2);
  const term1 = (1 / 4) * Math.pow(sinHalfTheta, 2);
  const term2 = (9 / 64) * Math.pow(sinHalfTheta, 4);
  
  return t0 * (1 + term1 + term2);
};

// Runge-Kutta 4 (RK4) Integration for Pendulum Motion
export const stepPendulumRK4 = (
  theta: number, 
  omega: number, 
  dt: number, 
  length: number, 
  damping: number, 
  gravity: number = G_EARTH
): { theta: number, omega: number } => {
  const accel = (t: number, th: number, w: number) => {
    return -(gravity / length) * Math.sin(th) - (damping * w);
  };

  const k1v = accel(0, theta, omega);
  const k1x = omega;

  const k2v = accel(dt * 0.5, theta + k1x * dt * 0.5, omega + k1v * dt * 0.5);
  const k2x = omega + k1v * dt * 0.5;

  const k3v = accel(dt * 0.5, theta + k2x * dt * 0.5, omega + k2v * dt * 0.5);
  const k3x = omega + k2v * dt * 0.5;

  const k4v = accel(dt, theta + k3x * dt, omega + k3v * dt);
  const k4x = omega + k3v * dt;

  const newTheta = theta + (dt / 6.0) * (k1x + 2 * k2x + 2 * k3x + k4x);
  const newOmega = omega + (dt / 6.0) * (k1v + 2 * k2v + 2 * k3v + k4v);

  return { theta: newTheta, omega: newOmega };
};

export const calculateEnergy = (mass: number, length: number, theta: number, omega: number, gravity: number = G_EARTH) => {
  const pe = mass * gravity * length * (1 - Math.cos(theta));
  const ke = 0.5 * mass * Math.pow(length * omega, 2);
  return { pe, ke, total: pe + ke };
};

// --- Inclined Plane Physics ---
export const calculateInclinedForces = (mass: number, angleDeg: number, mu: number, g: number = G_EARTH) => {
  const angleRad = angleDeg * (Math.PI / 180);
  const weight = mass * g;
  const normal = weight * Math.cos(angleRad);
  const parallel = weight * Math.sin(angleRad);
  const frictionMax = normal * mu;
  
  // Acceleration if sliding
  const netForce = parallel > frictionMax ? parallel - frictionMax : 0;
  const acceleration = netForce / mass;

  return { weight, normal, parallel, frictionMax, acceleration, netForce };
};

// --- Orbital Physics ---
export const calculateOrbitalVelocity = (massCentral: number, radius: number) => {
  // v = sqrt(GM / r)
  const G = 6.674e-11; 
  // scaled for simulation visibility
  return Math.sqrt((G * massCentral) / radius);
};

// --- Electronics (RLC) ---
export const calculateImpedance = (R: number, L: number, C: number, f: number) => {
  const omega = 2 * Math.PI * f;
  const Xl = omega * L;
  const Xc = 1 / (omega * C);
  const Z = Math.sqrt(R * R + Math.pow(Xl - Xc, 2));
  const phase = Math.atan((Xl - Xc) / R) * (180 / Math.PI); // degrees
  return { Z, Xl, Xc, phase, I: 10 / Z }; // Assuming 10V source
};

// --- Quantum ---
export const calculateDoubleSlitIntensity = (x: number, D: number, d: number, lambda: number) => {
  // I = I0 * cos^2 (pi * d * sin(theta) / lambda)
  // theta ~ x / D
  const theta = Math.atan(x / D);
  const phase = (Math.PI * d * Math.sin(theta)) / lambda;
  return Math.cos(phase) * Math.cos(phase);
};

export const calculateTunnelingProbability = (E: number, V: number, width: number) => {
  // T approx e^(-2 * K * L)
  // K = sqrt(2m(V-E)) / hbar
  if (E > V) return 1;
  const k_factor = 0.5; // simplified constant for sim
  const K = Math.sqrt(V - E);
  const exponent = -2 * k_factor * K * width;
  return Math.exp(exponent);
};

// --- Mould Effect (Chain Fountain) ---
export interface ChainLink {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isFixed: boolean;
}

export const stepChainFountain = (
  links: ChainLink[], 
  dt: number, 
  kickStrength: number,
  containerHeight: number
): ChainLink[] => {
  const gravity = 500; // px/s^2 scaled
  const linkDist = 10;
  
  // 1. Verlet Integration & Forces
  let newLinks = links.map(l => {
    if (l.isFixed) return l;

    let { x, y, vx, vy } = l;

    // Gravity
    vy += gravity * dt;

    // Floor collision & Kick
    if (y > containerHeight) {
      y = containerHeight;
      vy = -vy * 0.1; // Damping on floor
      vx = vx * 0.5; // Friction

      // The Mould Effect "Kick"
      // If the link above is pulling this link up, the floor pushes back
      if (vy < 0) { // Moving up
         vy -= kickStrength * 10 * dt; 
      }
    }

    x += vx * dt;
    y += vy * dt;

    return { ...l, x, y, vx, vy, isFixed: l.isFixed };
  });

  // 2. Constraints (Distance between links)
  for (let iter = 0; iter < 5; iter++) {
    for (let i = 0; i < newLinks.length - 1; i++) {
      const l1 = newLinks[i];
      const l2 = newLinks[i+1];
      
      const dx = l2.x - l1.x;
      const dy = l2.y - l1.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const diff = (dist - linkDist) / dist;
      
      const offsetX = dx * diff * 0.5;
      const offsetY = dy * diff * 0.5;

      if (!l1.isFixed) {
        l1.x += offsetX;
        l1.y += offsetY;
      }
      if (!l2.isFixed) {
        l2.x -= offsetX;
        l2.y -= offsetY;
      }
    }
  }

  return newLinks;
};

// --- Gravitational Wave Chirp ---
export const calculateGravitationalWaveStrain = (time: number, distance: number, mergerTime: number, spin: number = 0) => {
  // Simplified Chirp signal model with Spin Influence
  // Positive Spin (aligned) delays merger, allows closer orbit (higher freq/amp)
  
  const effectiveMergerTime = mergerTime * (1 + spin * 0.2);
  const timeLeft = Math.max(0.05, effectiveMergerTime - time);
  
  if (time > effectiveMergerTime) {
     // Ringdown: Damped sine
     const decay = Math.exp(-(time - effectiveMergerTime) * (2 + spin));
     return Math.sin(time * 20) * decay * 0.5;
  }

  // Inspiral
  // Freq ~ (t_merger - t)^(-3/8)
  const freq = 1 / Math.pow(timeLeft, 0.375);
  // Amp ~ (t_merger - t)^(-1/4)
  // Spin boosts amplitude slightly near merger
  const amp = (1 / Math.pow(timeLeft, 0.25)) * (1 + spin * 0.1);

  return Math.sin(time * freq * 5) * amp * 0.1;
};
