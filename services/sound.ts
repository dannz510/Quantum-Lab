
export class SoundEngine {
  private static ctx: AudioContext | null = null;
  private static masterGain: GainNode | null = null;

  static init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Global volume
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return { ctx: this.ctx, master: this.masterGain! };
  }

  // --- UI SOUNDS ---
  static playNav() {
    const { ctx, master } = this.init();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  static playClick() {
    const { ctx, master } = this.init();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(1500, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  // --- PHYSICS SOUNDS ---

  // Water Splash: Filtered Noise
  static playSplash(intensity: number = 1) {
    const { ctx, master } = this.init();
    const bufferSize = ctx.sampleRate * 1.0; 
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5 * intensity, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    noise.start();
  }

  // Pendulum Whoosh: Pink Noise modulated by speed
  static createWhoosh() {
    const { ctx, master } = this.init();
    
    // Create Pink Noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // (roughly) compensate for gain
        b6 = white * 0.115926;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    noise.start();

    return {
        update: (speed: number) => { // speed 0 to ~5
            const normSpeed = Math.min(speed, 5) / 5;
            gain.gain.setTargetAtTime(normSpeed * 0.4, ctx.currentTime, 0.1);
            filter.frequency.setTargetAtTime(200 + normSpeed * 1000, ctx.currentTime, 0.1);
        },
        stop: () => {
            noise.stop();
            noise.disconnect();
        }
    };
  }

  // Doppler Engine: Sawtooth wave
  static createDopplerDrone() {
      const { ctx, master } = this.init();
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      const gain = ctx.createGain();
      gain.gain.value = 0;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.start();

      return {
          update: (freq: number, vol: number) => {
              osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.1);
              gain.gain.setTargetAtTime(vol * 0.2, ctx.currentTime, 0.1);
          },
          stop: () => {
              osc.stop();
              osc.disconnect();
          }
      };
  }

  // Black Hole Chirp: FM Synthesis
  static createGravitationalDrone() {
      const { ctx, master } = this.init();
      
      // Carrier
      const carrier = ctx.createOscillator();
      carrier.type = 'sine';
      
      // Modulator (Rumble)
      const mod = ctx.createOscillator();
      mod.type = 'sine';
      mod.frequency.value = 50; 
      
      const modGain = ctx.createGain();
      modGain.gain.value = 20;

      const mainGain = ctx.createGain();
      mainGain.gain.value = 0;

      mod.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(mainGain);
      mainGain.connect(master);

      carrier.start();
      mod.start();

      return {
          update: (strain: number, freq: number) => {
               // Strain controls volume, freq controls pitch
               const vol = Math.min(1, strain * 1e20 * 500000); // Scaling logic for sim
               mainGain.gain.setTargetAtTime(vol * 0.5, ctx.currentTime, 0.1);
               carrier.frequency.setTargetAtTime(60 + freq * 2, ctx.currentTime, 0.1);
               mod.frequency.setTargetAtTime(freq, ctx.currentTime, 0.1);
               modGain.gain.setTargetAtTime(freq * 2, ctx.currentTime, 0.1);
          },
          stop: () => {
              carrier.stop();
              mod.stop();
          }
      }
  }
}
