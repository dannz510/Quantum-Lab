
import React, { useEffect, useRef } from 'react';

export const QuantumParticles: React.FC<{ className?: string }> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    
    // Config adapted for smaller icon usage
    const NUM_PARTICLES = 40;
    const ATTRACTION_FORCE = 0.05; 
    const DAMPING = 0.96;
    const MOUSE_RADIUS = 100;
    const MOUSE_REPEL_FORCE = -0.2;

    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      mass: number;

      constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 1.5 + 0.5;
        this.color = ['#6495ED', '#9370DB', '#ADD8E6'][Math.floor(Math.random() * 3)];
        this.mass = this.radius * this.radius;
      }

      update() {
        this.vx *= DAMPING;
        this.vy *= DAMPING;
        this.x += this.vx;
        this.y += this.vy;

        // Bounce
        if (this.x < 0 || this.x > width) { this.vx *= -1; this.x = Math.max(0, Math.min(width, this.x)); }
        if (this.y < 0 || this.y > height) { this.vy *= -1; this.y = Math.max(0, Math.min(height, this.y)); }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }

      interact(other: Particle) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const distSq = dx*dx + dy*dy;
        if (distSq > 0 && distSq < 2500) { // Attraction range
           const dist = Math.sqrt(distSq);
           const force = (ATTRACTION_FORCE * this.mass * other.mass) / distSq;
           const fx = force * (dx/dist);
           const fy = force * (dy/dist);
           this.vx += fx / this.mass;
           this.vy += fy / this.mass;
           
           // Draw line
           if (dist < 40 && ctx) {
               ctx.strokeStyle = `rgba(100, 149, 237, ${1 - dist/40})`;
               ctx.lineWidth = 0.5;
               ctx.beginPath();
               ctx.moveTo(this.x, this.y);
               ctx.lineTo(other.x, other.y);
               ctx.stroke();
           }
        }
      }
    }

    const particles = Array.from({ length: NUM_PARTICLES }, () => new Particle(width, height));

    let animationId: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)'; // Trail effect
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
            p1.interact(particles[j]);
            particles[j].interact(p1);
        }
        p1.update();
        p1.draw();
      }
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return <canvas ref={canvasRef} className={`${className} bg-slate-900 rounded-lg`} style={{ width: '100%', height: '100%' }} />;
};
