import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  color: string;
  glowIntensity: number; // 0 - 100
  barCount?: number;
  height?: number;
}

export default function AudioVisualizer({
  analyser,
  isPlaying,
  color,
  glowIntensity,
  barCount = 28,
  height = 42,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const currentBarsRef = useRef<Float32Array>(new Float32Array(barCount));
  const isPlayingRef = useRef(isPlaying);
  const analyserRef = useRef(analyser);
  const colorRef = useRef(color);
  const glowRef = useRef(glowIntensity);

  isPlayingRef.current = isPlaying;
  analyserRef.current = analyser;
  colorRef.current = color;
  glowRef.current = glowIntensity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resize observer to keep canvas sharp and responsive
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (rect.width > 0) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(height * dpr);
      }
    };

    updateCanvasSize();
    const observer = new ResizeObserver(() => {
      updateCanvasSize();
    });
    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, [height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isLoopRunning = false;
    let dataArray: Uint8Array<ArrayBuffer> | null = null;

    const tick = () => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const playing = isPlayingRef.current;
      const an = analyserRef.current;
      const col = colorRef.current;
      const glow = glowRef.current;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      if (an) {
        if (!dataArray || dataArray.length !== an.frequencyBinCount) {
          dataArray = new Uint8Array(new ArrayBuffer(an.frequencyBinCount));
        }
        if (playing) {
          an.getByteFrequencyData(dataArray);
        }
      }

      const bars = currentBarsRef.current;
      const count = bars.length;
      const gap = 3 * dpr;
      const totalGap = gap * (count - 1);
      const barW = Math.max(2 * dpr, (w - totalGap) / count);
      const minH = 2.5 * dpr;
      const maxH = h * 0.92;

      // Glow setup
      if (glow > 0) {
        ctx.shadowColor = col;
        ctx.shadowBlur = (glow / 100) * 10 * dpr;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = col;

      let anyBarActive = false;

      for (let i = 0; i < count; i++) {
        let target = minH;

        if (playing && dataArray && dataArray.length > 0) {
          // Logarithmic distribution to capture bass, mid, treble nicely
          const normIndex = Math.pow(i / count, 1.25);
          const bin = Math.min(
            dataArray.length - 1,
            Math.floor(normIndex * (dataArray.length * 0.8)) + 1
          );
          const rawVal = dataArray[bin] || 0;
          target = minH + (rawVal / 255) * (maxH - minH);
        }

        if (playing) {
          // Smooth rise and fall during playback
          bars[i] = bars[i] * 0.65 + target * 0.35;
          if (bars[i] > minH + 0.5) anyBarActive = true;
        } else {
          // Smooth gentle decay when paused
          bars[i] = bars[i] * 0.86;
          if (bars[i] > minH + 0.3) {
            anyBarActive = true;
          } else {
            bars[i] = minH; // settled at baseline
          }
        }

        const barHeight = Math.max(minH, bars[i]);
        const x = i * (barW + gap);
        const y = h - barHeight;
        const radius = barW / 2;

        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, barW, barHeight, [radius, radius, radius, radius]);
        } else {
          ctx.rect(x, y, barW, barHeight);
        }
        ctx.fill();
      }

      // If playing or transitioning (bars decaying), continue the loop!
      // Once paused and all bars have settled at baseline, stop loop to save CPU!
      if (playing || anyBarActive) {
        animFrameRef.current = requestAnimationFrame(tick);
        isLoopRunning = true;
      } else {
        isLoopRunning = false;
        animFrameRef.current = 0;
      }
    };

    // Trigger tick whenever playing state changes
    if (isPlaying) {
      if (!isLoopRunning) {
        animFrameRef.current = requestAnimationFrame(tick);
        isLoopRunning = true;
      }
    } else {
      // Allow gentle decay transition to complete then halt
      if (!isLoopRunning) {
        animFrameRef.current = requestAnimationFrame(tick);
        isLoopRunning = true;
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="audio-visualizer-container" style={{ height }}>
      <canvas ref={canvasRef} className="audio-visualizer-canvas" />
    </div>
  );
}
