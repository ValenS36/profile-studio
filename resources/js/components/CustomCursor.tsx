import { useEffect, useRef, useState } from 'react';

export type CursorType = 'default' | 'dot' | 'ring' | 'crosshair';

interface CustomCursorProps {
  type: CursorType;
  color: string;
  size?: number; // 6 - 60
  glow?: number; // 0 - 100
  trail?: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
}

interface TrailPoint {
  x: number;
  y: number;
}

export default function CustomCursor({
  type,
  color,
  size = 20,
  glow = 50,
  trail = false,
  containerRef,
}: CustomCursorProps) {
  const [isSupported, setIsSupported] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailsContainerRef = useRef<HTMLDivElement>(null);

  const posRef = useRef({ x: -100, y: -100 });
  const isInsideRef = useRef(false);
  const isOverTextRef = useRef(false);
  const isInteractiveRef = useRef(false);

  const trailPointsRef = useRef<TrailPoint[]>(
    Array.from({ length: 5 }, () => ({ x: -100, y: -100 }))
  );
  const trailRafRef = useRef<number>(0);

  // Check pointer fine & hover support
  useEffect(() => {
    const media = window.matchMedia('(pointer: fine) and (hover: hover)');
    setIsSupported(media.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsSupported(e.matches);
    };

    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isSupported || type === 'default') {
      if (containerRef.current) {
        containerRef.current.classList.remove('has-custom-cursor');
      }
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Apply custom cursor class to container
    container.classList.add('has-custom-cursor');

    const updateCursorVisual = () => {
      const cursor = cursorRef.current;
      if (!cursor) return;

      if (!isInsideRef.current || isOverTextRef.current) {
        cursor.style.opacity = '0';
        return;
      }

      cursor.style.opacity = '1';
      const scale = isInteractiveRef.current ? 1.35 : 1;
      cursor.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%) scale(${scale})`;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      posRef.current = { x, y };
      isInsideRef.current = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;

      const target = e.target as HTMLElement | null;
      if (target) {
        isOverTextRef.current =
          target.closest('input:not([type="range"]):not([type="checkbox"]):not([type="color"]), textarea, [contenteditable="true"]') !==
          null;
        isInteractiveRef.current =
          target.closest('a, button, [role="button"], input[type="range"], input[type="checkbox"], select') !==
          null;
      }

      updateCursorVisual();
    };

    const handlePointerEnter = () => {
      isInsideRef.current = true;
      updateCursorVisual();
    };

    const handlePointerLeave = () => {
      isInsideRef.current = false;
      updateCursorVisual();
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerenter', handlePointerEnter);
    container.addEventListener('pointerleave', handlePointerLeave);

    // Trail animation loop
    if (trail) {
      const animateTrail = () => {
        const points = trailPointsRef.current;
        const targetX = posRef.current.x;
        const targetY = posRef.current.y;

        // Smoothly interpolate points towards leader
        let leaderX = targetX;
        let leaderY = targetY;

        for (let i = 0; i < points.length; i++) {
          points[i].x += (leaderX - points[i].x) * 0.42;
          points[i].y += (leaderY - points[i].y) * 0.42;
          leaderX = points[i].x;
          leaderY = points[i].y;
        }

        const trailContainer = trailsContainerRef.current;
        if (trailContainer) {
          const children = trailContainer.children;
          const show = isInsideRef.current && !isOverTextRef.current;
          trailContainer.style.opacity = show ? '1' : '0';

          for (let i = 0; i < children.length; i++) {
            const el = children[i] as HTMLElement;
            if (el && points[i]) {
              el.style.transform = `translate3d(${points[i].x}px, ${points[i].y}px, 0) translate(-50%, -50%)`;
            }
          }
        }

        trailRafRef.current = requestAnimationFrame(animateTrail);
      };
      trailRafRef.current = requestAnimationFrame(animateTrail);
    }

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerenter', handlePointerEnter);
      container.removeEventListener('pointerleave', handlePointerLeave);
      container.classList.remove('has-custom-cursor');
      if (trailRafRef.current) {
        cancelAnimationFrame(trailRafRef.current);
      }
    };
  }, [isSupported, type, trail, containerRef]);

  if (!isSupported || type === 'default') {
    return null;
  }

  const glowBlur = (glow / 100) * 12;
  const shadowStyle = glow > 0 ? `0 0 ${glowBlur}px ${color}` : undefined;

  return (
    <div className="custom-cursor-root" aria-hidden="true">
      {/* Optional Trail */}
      {trail && (
        <div ref={trailsContainerRef} className="custom-cursor-trails">
          {trailPointsRef.current.map((_, i) => {
            const decay = 1 - (i + 1) / (trailPointsRef.current.length + 1);
            const dotSize = Math.max(3, (size * 0.35) * decay);
            return (
              <div
                key={i}
                className="cursor-trail-dot"
                style={{
                  width: dotSize,
                  height: dotSize,
                  backgroundColor: color,
                  opacity: decay * 0.6,
                  boxShadow: glow > 0 ? `0 0 ${glowBlur * 0.5}px ${color}` : undefined,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Main Cursor Element */}
      <div
        ref={cursorRef}
        className={`custom-cursor-head cursor-${type}`}
        style={{
          width: size,
          height: size,
        }}
      >
        {type === 'dot' && (
          <div
            className="cursor-dot-shape"
            style={{
              width: Math.max(6, size * 0.5),
              height: Math.max(6, size * 0.5),
              backgroundColor: color,
              boxShadow: shadowStyle,
            }}
          />
        )}

        {type === 'ring' && (
          <div
            className="cursor-ring-shape"
            style={{
              width: size,
              height: size,
              borderColor: color,
              boxShadow: shadowStyle,
            }}
          />
        )}

        {type === 'crosshair' && (
          <div className="cursor-crosshair-shape" style={{ width: size, height: size }}>
            <span
              className="crosshair-h"
              style={{
                backgroundColor: color,
                boxShadow: shadowStyle,
              }}
            />
            <span
              className="crosshair-v"
              style={{
                backgroundColor: color,
                boxShadow: shadowStyle,
              }}
            />
            <span
              className="crosshair-center"
              style={{
                backgroundColor: color,
                boxShadow: shadowStyle,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
