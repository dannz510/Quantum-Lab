
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
