import { useRef, useEffect, useCallback } from 'react';

interface DotGridBackgroundProps {
  className?: string;
}

interface Dot {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  driftX: number;
  driftY: number;
  driftPhase: number;
}

export function DotGridBackground({ className = '' }: DotGridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const reducedMotionRef = useRef(false);

  const initDots = useCallback((width: number, height: number) => {
    const spacing = 60;
    const cols = Math.floor(width / spacing);
    const rows = Math.floor(height / spacing);
    const maxDots = 100;
    const totalPossible = cols * rows;

    // If too many dots, increase spacing
    let actualSpacingX = spacing;
    let actualSpacingY = spacing;
    if (totalPossible > maxDots) {
      const scale = Math.sqrt(totalPossible / maxDots);
      actualSpacingX = spacing * scale;
      actualSpacingY = spacing * scale;
    }

    const actualCols = Math.floor(width / actualSpacingX);
    const actualRows = Math.floor(height / actualSpacingY);
    const offsetX = (width - (actualCols - 1) * actualSpacingX) / 2;
    const offsetY = (height - (actualRows - 1) * actualSpacingY) / 2;

    const dots: Dot[] = [];
    for (let row = 0; row < actualRows; row++) {
      for (let col = 0; col < actualCols; col++) {
        if (dots.length >= maxDots) break;
        const x = offsetX + col * actualSpacingX;
        const y = offsetY + row * actualSpacingY;
        dots.push({
          x,
          y,
          originX: x,
          originY: y,
          vx: 0,
          vy: 0,
          driftX: (Math.random() - 0.5) * 0.3,
          driftY: (Math.random() - 0.5) * 0.3,
          driftPhase: Math.random() * Math.PI * 2,
        });
      }
    }
    dotsRef.current = dots;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mql.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mql.addEventListener('change', handleMotionChange);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get computed color from theme
    const computedStyle = getComputedStyle(document.documentElement);
    const mutedFg = computedStyle.getPropertyValue('--muted-foreground').trim();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      initDots(rect.width, rect.height);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    const parent = canvas.parentElement;
    if (parent) resizeObserver.observe(parent);

    // Mouse tracking on parent
    const handleMouseMove = (e: MouseEvent) => {
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    const handleMouseLeave = () => {
      mouseRef.current = null;
    };
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('mouseleave', handleMouseLeave);
    }

    let time = 0;
    const animate = () => {
      if (!ctx || !canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      ctx.clearRect(0, 0, width, height);

      // Parse HSL color for dots
      const dotColor = mutedFg
        ? `hsl(${mutedFg} / 0.15)`
        : 'rgba(128, 128, 128, 0.15)';

      const dots = dotsRef.current;
      const mouse = mouseRef.current;
      const isReduced = reducedMotionRef.current;

      time += 0.01;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        if (!isReduced) {
          // Gentle drift motion
          const drift = Math.sin(time + dot.driftPhase);
          const targetX = dot.originX + dot.driftX * drift * 8;
          const targetY = dot.originY + dot.driftY * Math.cos(time * 0.7 + dot.driftPhase) * 8;

          // Spring back to origin (with drift)
          const springStrength = 0.02;
          const ax = (targetX - dot.x) * springStrength;
          const ay = (targetY - dot.y) * springStrength;

          dot.vx += ax;
          dot.vy += ay;

          // Mouse repulsion
          if (mouse) {
            const dx = dot.x - mouse.x;
            const dy = dot.y - mouse.y;
            const distSq = dx * dx + dy * dy;
            const repulsionRadius = 80;
            if (distSq < repulsionRadius * repulsionRadius && distSq > 0) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / repulsionRadius) * 1.5;
              dot.vx += (dx / dist) * force;
              dot.vy += (dy / dist) * force;
            }
          }

          // Damping
          dot.vx *= 0.92;
          dot.vy *= 0.92;

          dot.x += dot.vx;
          dot.y += dot.vy;
        }

        // Draw plus sign
        const size = 4;
        ctx.beginPath();
        ctx.moveTo(dot.x - size, dot.y);
        ctx.lineTo(dot.x + size, dot.y);
        ctx.moveTo(dot.x, dot.y - size);
        ctx.lineTo(dot.x, dot.y + size);
        ctx.strokeStyle = dotColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      mql.removeEventListener('change', handleMotionChange);
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [initDots]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
