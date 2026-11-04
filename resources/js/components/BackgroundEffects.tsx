import { useEffect, useRef } from 'react';

interface BackgroundEffectsProps {
  effect: 'none' | 'gold_particles';
  color?: string;
  density?: number; // 5 - 150
  size?: number; // 1 - 20
  speed?: number; // 1 - 20
  glow?: number; // 0 - 100
  opacity?: number; // 10 - 100
}

interface Particle {
  x: number;
  y: number;
  baseX: number;
  driftX: number;
  swaySpeed: number;
  swayWidth: number;
  speedY: number;
  phase: number;
  size: number;
  aspect: number;
  rotation: number;
  rotSpeed: number;
  flipAngle: number;
  flipSpeed: number;
  opacity: number;
  shimmerSpeed: number;
}

export default function BackgroundEffects({
  effect,
  color = '#d4af37',
  density = 40,
  size = 4,
  speed = 3,
  glow = 50,
  opacity = 80,
}: BackgroundEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animIdRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const canvasSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const propsRef = useRef({ effect, color, density, size, speed, glow, opacity });
  propsRef.current = { effect, color, density, size, speed, glow, opacity };

  useEffect(() => {
    if (effect === 'none') {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = 0;
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check prefers-reduced-motion: if active, soften motion but DO NOT freeze!
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motionFactor = prefersReducedMotion ? 0.75 : 1.0;

    const initParticles = (width: number, height: number) => {
      const area = (width * height) / (1000 * 700);
      const count = Math.max(12, Math.min(120, Math.floor(density * Math.max(0.6, Math.min(area, 2.2)))));

      const list: Particle[] = [];
      const currentSpeed = Math.max(1, speed);
      const baseSpeedY = (45 + (currentSpeed / 3) * 35); // lively, elegant fall speed

      for (let i = 0; i < count; i++) {
        const pSize = (0.6 + Math.random() * 1.4) * (size / 4);
        const startX = Math.random() * width;
        list.push({
          x: startX,
          baseX: startX,
          y: Math.random() * height,
          driftX: (Math.random() - 0.5) * 16, // gentle sideways drift
          swaySpeed: 1.2 + Math.random() * 1.8,
          swayWidth: 12 + Math.random() * 22,
          speedY: (0.7 + Math.random() * 0.7) * baseSpeedY,
          phase: Math.random() * Math.PI * 2,
          size: Math.max(1.2, pSize),
          aspect: Math.random() < 0.35 ? 1 : 0.35 + Math.random() * 0.45, // flakes or round specks
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 2.2,
          flipAngle: Math.random() * Math.PI * 2,
          flipSpeed: 1.2 + Math.random() * 2.0,
          opacity: (0.5 + Math.random() * 0.5) * (opacity / 100),
          shimmerSpeed: 2.0 + Math.random() * 3.0,
        });
      }
      particlesRef.current = list;
    };

    const updateCanvasDimensions = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;

      if (w <= 0 || h <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const pixelW = Math.floor(w * dpr);
      const pixelH = Math.floor(h * dpr);

      // Only re-allocate canvas buffer if size actually changed
      if (canvas.width !== pixelW || canvas.height !== pixelH) {
        canvas.width = pixelW;
        canvas.height = pixelH;
        canvasSizeRef.current = { w, h };
        initParticles(w, h);
      }
    };

    updateCanvasDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasDimensions();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && !animIdRef.current) {
        lastTimeRef.current = performance.now();
        animIdRef.current = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    lastTimeRef.current = performance.now();

    const render = (now: number) => {
      if (document.hidden) {
        animIdRef.current = 0;
        return;
      }

      const rawDelta = lastTimeRef.current > 0 ? (now - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = now;
      const delta = Math.min(Math.max(rawDelta, 0.001), 0.08);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      if (w <= 0 || h <= 0) {
        animIdRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const { color: pColor, glow: pGlow } = propsRef.current;
      const timeSec = now * 0.001;

      // Glow setup
      if (pGlow > 0) {
        ctx.shadowColor = pColor;
        ctx.shadowBlur = (pGlow / 100) * 8;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = pColor;

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Fall downwards with delta time
        p.y += p.speedY * delta * motionFactor;

        // Drift and sway horizontally
        p.baseX += p.driftX * delta * motionFactor;
        p.x = p.baseX + Math.sin(timeSec * p.swaySpeed + p.phase) * (p.swayWidth * motionFactor);

        // Rotate & 3D Flip
        p.rotation += p.rotSpeed * delta * motionFactor;
        p.flipAngle += p.flipSpeed * delta * motionFactor;

        // Wrap around bottom
        if (p.y > h + 25) {
          p.y = -20;
          p.baseX = Math.random() * w;
          p.x = p.baseX;
        }

        // Wrap around sides
        if (p.baseX < -40) {
          p.baseX = w + 40;
          p.x = p.baseX;
        } else if (p.baseX > w + 40) {
          p.baseX = -40;
          p.x = p.baseX;
        }

        // Shimmering alpha calculation
        const shimmer = 0.75 + 0.25 * Math.sin(timeSec * p.shimmerSpeed + p.phase);
        const currentAlpha = Math.max(0.08, Math.min(1, p.opacity * shimmer));

        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // 3D-like flip projection
        const flipScale = Math.cos(p.flipAngle);
        ctx.scale(1, Math.max(0.18, Math.abs(flipScale)));

        ctx.beginPath();
        if (p.aspect >= 0.9) {
          // Circular / soft speck
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        } else {
          // Organic elongated gold leaf flake
          const flakeW = p.size * 2.0;
          const flakeH = p.size * p.aspect * 2.0;
          ctx.ellipse(0, 0, flakeW, flakeH, 0, 0, Math.PI * 2);
        }
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();
      animIdRef.current = requestAnimationFrame(render);
    };

    animIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = 0;
      }
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [effect, density, size, speed, glow, opacity]);

  if (effect === 'none') return null;

  return (
    <div className="scene-bg-effect-layer" aria-hidden="true">
      <canvas ref={canvasRef} className="scene-bg-effect-canvas" />
    </div>
  );
}
