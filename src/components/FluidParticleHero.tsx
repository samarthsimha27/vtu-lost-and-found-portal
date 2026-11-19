import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface FluidParticleHeroProps {
  onOpenApp: () => void;
}

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rgb: string;
  alpha: number;
  phase: number;
  speed: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number;
}

const VTU_PARTICLE_PALETTE = [
  { color: '#DF6A18', rgb: '223, 106, 24' }, // VTU Emblem Saffron Ring
  { color: '#146B32', rgb: '20, 107, 50' },  // VTU Emblem Emerald Core
  { color: '#E38B29', rgb: '227, 139, 41' }, // Diya Flame Amber
  { color: '#1E8240', rgb: '30, 130, 64' },  // Karnataka Lush Green
  { color: '#9E9589', rgb: '158, 149, 137' } // Emblem Silver Rim
];

export const FluidParticleHero: React.FC<FluidParticleHeroProps> = ({ onOpenApp }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animationFrameId = 0;

    const pointer = {
      x: width / 2,
      y: height / 2,
      prevX: width / 2,
      prevY: height / 2,
      vx: 0,
      vy: 0,
      active: false
    };

    const ripples: Ripple[] = [];
    let particles: Particle[] = [];

    const initParticles = () => {
      width = containerRef.current?.clientWidth || window.innerWidth;
      height = containerRef.current?.clientHeight || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(Math.max(Math.floor((width * height) / 6800), 110), 230);
      particles = [];

      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < count; i++) {
        const useRingBias = i % 3 !== 0;
        let ox: number;
        let oy: number;

        if (useRingBias) {
          const angle = (i / count) * Math.PI * 2 * 3.7 + Math.random() * 0.5;
          const minR = Math.min(width, height) * 0.17;
          const maxR = Math.max(width, height) * 0.56;
          const r = minR + Math.pow(Math.random(), 0.82) * (maxR - minR);
          ox = cx + Math.cos(angle) * r;
          oy = cy + Math.sin(angle) * r * 0.86;
        } else {
          ox = Math.random() * width;
          oy = Math.random() * height;
        }

        const paletteEntry = VTU_PARTICLE_PALETTE[i % VTU_PARTICLE_PALETTE.length];
        particles.push({
          x: ox,
          y: oy,
          originX: ox,
          originY: oy,
          vx: 0,
          vy: 0,
          size: 1.6 + Math.random() * 2.8,
          color: paletteEntry.color,
          rgb: paletteEntry.rgb,
          alpha: 0.32 + Math.random() * 0.48,
          phase: Math.random() * Math.PI * 2,
          speed: 0.35 + Math.random() * 0.55
        });
      }
    };

    initParticles();

    let time = 0;

    const render = () => {
      time += prefersReducedMotion ? 0.002 : 0.012;
      ctx.clearRect(0, 0, width, height);

      pointer.vx *= 0.88;
      pointer.vy *= 0.88;

      for (let r = ripples.length - 1; r >= 0; r--) {
        const rip = ripples[r];
        rip.radius += 6.5;
        rip.strength *= 0.96;
        if (rip.radius > rip.maxRadius || rip.strength < 0.03) {
          ripples.splice(r, 1);
        } else {
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(223, 106, 24, ${rip.strength * 0.22})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      const interactionRadius = Math.min(width, height) < 640 ? 145 : 225;
      const interactionRadiusSq = interactionRadius * interactionRadius;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const streamX =
          Math.cos(time * p.speed + p.phase + p.originY * 0.004) * 14 +
          Math.sin(time * 0.6 + p.originX * 0.003) * 8;
        const streamY =
          Math.sin(time * p.speed + p.phase + p.originX * 0.004) * 14 +
          Math.cos(time * 0.5 + p.originY * 0.003) * 8;

        const targetX = p.originX + (prefersReducedMotion ? 0 : streamX);
        const targetY = p.originY + (prefersReducedMotion ? 0 : streamY);

        if (pointer.active && !prefersReducedMotion) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < interactionRadiusSq && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const falloff = Math.pow(1 - dist / interactionRadius, 2);

            p.vx += pointer.vx * falloff * 0.14;
            p.vy += pointer.vy * falloff * 0.14;

            const nx = dx / dist;
            const ny = dy / dist;
            const swirlStrength = 0.55 * falloff;
            const pushStrength = 1.35 * falloff;

            p.vx += nx * pushStrength - ny * swirlStrength;
            p.vy += ny * pushStrength + nx * swirlStrength;
          }
        }

        for (let r = 0; r < ripples.length; r++) {
          const rip = ripples[r];
          const dx = p.x - rip.x;
          const dy = p.y - rip.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const band = Math.abs(dist - rip.radius);
          if (band < 42) {
            const waveForce = (1 - band / 42) * rip.strength * 2.4;
            p.vx += (dx / dist) * waveForce;
            p.vy += (dy / dist) * waveForce;
          }
        }

        p.vx += (targetX - p.x) * 0.026;
        p.vy += (targetY - p.y) * 0.026;
        p.vx *= 0.89;
        p.vy *= 0.89;

        p.x += p.vx;
        p.y += p.vy;
      }

      const linkDist = 92;
      const linkDistSq = linkDist * linkDist;

      ctx.lineWidth = 0.75;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dSq = dx * dx + dy * dy;

          if (dSq < linkDistSq) {
            const d = Math.sqrt(dSq);
            const kineticBoost = Math.min((Math.abs(a.vx) + Math.abs(a.vy)) * 0.04, 0.14);
            const lineAlpha = (1 - d / linkDist) * (0.11 + kineticBoost);
            ctx.strokeStyle = `rgba(${a.rgb}, ${lineAlpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const speedSq = p.vx * p.vx + p.vy * p.vy;
        const speed = Math.sqrt(speedSq);
        const radius = p.size + Math.min(speed * 0.12, 1.6);

        ctx.beginPath();
        if (speed > 1.3 && !prefersReducedMotion) {
          const angle = Math.atan2(p.vy, p.vx);
          const stretch = Math.min(1 + speed * 0.18, 2.3);
          ctx.ellipse(p.x, p.y, radius * stretch, radius * 0.88, angle, 0, Math.PI * 2);
        } else {
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        }
        ctx.fillStyle = `rgba(${p.rgb}, ${Math.min(p.alpha + speed * 0.03, 0.92).toFixed(3)})`;
        ctx.fill();
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    animationFrameId = window.requestAnimationFrame(render);

    const handlePointerMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (pointer.active) {
        pointer.vx = Math.max(Math.min(x - pointer.prevX, 34), -34);
        pointer.vy = Math.max(Math.min(y - pointer.prevY, 34), -34);
      }

      pointer.prevX = x;
      pointer.prevY = y;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;

      const normX = (x / rect.width - 0.5) * 2;
      const normY = (y / rect.height - 0.5) * 2;
      setTilt({
        rx: Number((-normY * 6).toFixed(2)),
        ry: Number((normX * 6).toFixed(2))
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current || e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (pointer.active) {
        pointer.vx = Math.max(Math.min(x - pointer.prevX, 28), -28);
        pointer.vy = Math.max(Math.min(y - pointer.prevY, 28), -28);
      }
      pointer.prevX = x;
      pointer.prevY = y;
      pointer.x = x;
      pointer.y = y;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      setTilt({ rx: 0, ry: 0 });
    };

    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current || prefersReducedMotion) return;
      const rect = containerRef.current.getBoundingClientRect();
      ripples.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        radius: 18,
        maxRadius: Math.max(width, height) * 0.45,
        strength: 1
      });
    };

    const handleResize = () => {
      initParticles();
    };

    const el = containerRef.current;
    el?.addEventListener('mousemove', handlePointerMove);
    el?.addEventListener('mouseleave', handlePointerLeave);
    el?.addEventListener('click', handleClick);
    el?.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      el?.removeEventListener('mousemove', handlePointerMove);
      el?.removeEventListener('mouseleave', handlePointerLeave);
      el?.removeEventListener('click', handleClick);
      el?.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <main
      ref={containerRef}
      aria-label="Visvesvaraya Technological University Landing Page"
      className="relative min-h-[100svh] w-full overflow-hidden flex flex-col items-center justify-between select-none"
      style={{
        background:
          'radial-gradient(circle at 50% 46%, #FFFFFF 0%, #FAF8F4 48%, #F1ECE3 100%)'
      }}
    >
      {/* Fluid Interactive Particle Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* Top Subtle University Motto — Standalone Hero Identity */}
      <div className="relative z-10 pt-10 sm:pt-12 text-center px-6">
        <p className="text-xs sm:text-sm tracking-[0.2em] text-[#625D55] font-medium">
          ಮೊದಲು ಮಾನವನಾಗು &nbsp;·&nbsp; First, Be Human
        </p>
      </div>

      {/* Central VTU Crest Medallion */}
      <div className="relative z-10 flex flex-col items-center px-6 my-auto">
        <div
          className="relative transition-transform duration-200 ease-out"
          style={{
            transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
          }}
        >
          <div className="p-3 sm:p-4 rounded-full bg-white/85 backdrop-blur-sm border border-[#E5DFD6] shadow-[0_24px_64px_-16px_rgba(20,107,50,0.16)]">
            <div className="p-1.5 rounded-full border border-[#DF6A18]/35 bg-gradient-to-b from-white to-[#F6F3EC]">
              {!logoError ? (
                <img
                  src="/assets/aistudio/image_d16b8c07.png"
                  alt="Visvesvaraya Technological University, Belagavi Official Emblem"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                  className="w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full object-contain drop-shadow-sm"
                />
              ) : (
                <div className="w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-[#DF6A18] via-white to-[#146B32] flex items-center justify-center text-center p-6">
                  <span className="font-serif text-xl font-semibold text-[#191816]">
                    VTU · Belagavi
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 text-center max-w-2xl">
          <h1
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#191816]"
            style={{ textWrap: 'balance' }}
          >
            Visvesvaraya Technological University
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#625D55] font-normal">
            Jnana Sangama &nbsp;·&nbsp; Belagavi, Karnataka
          </p>
        </div>

        {/* Tricolor Hairline Accent matching bottom ribbon of VTU logo */}
        <div className="mt-6 flex items-center gap-1.5" aria-hidden="true">
          <span className="h-[2px] w-10 bg-[#DF6A18] rounded-full" />
          <span className="h-[2px] w-10 bg-[#D6D0C6] rounded-full" />
          <span className="h-[2px] w-10 bg-[#146B32] rounded-full" />
        </div>
      </div>

      {/* Primary CTA Button — Opens Separate Main Application */}
      <div className="relative z-10 pb-10 sm:pb-12 flex flex-col items-center">
        <button
          type="button"
          onClick={onOpenApp}
          className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-[#146B32] hover:bg-[#0E4F24] shadow-sm transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#146B32] cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>Enter Campus Portal</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
        </button>
      </div>
    </main>
  );
};
