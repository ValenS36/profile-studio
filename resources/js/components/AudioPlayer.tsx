import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, Volume1, VolumeX, Music2, AlertCircle, Loader2 } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';

interface AudioPlayerProps {
  src: string;
  title: string;
  visualizerEnabled?: boolean;
  visualizerColor?: string;
  visualizerGlow?: number;
  accentColor?: string;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

const resolveAudioSource = (rawSrc: string) => {
  if (!rawSrc) return '';
  // Convert /storage/profile/xxx into /media/stream/xxx for HTTP 206 Range support
  if (rawSrc.startsWith('/storage/profile/')) {
    const filename = rawSrc.replace('/storage/profile/', '');
    return `/media/stream/${encodeURIComponent(filename)}`;
  }
  return rawSrc;
};

export default function AudioPlayer({
  src,
  title,
  visualizerEnabled = true,
  visualizerColor,
  visualizerGlow = 60,
  accentColor = '#b6a2ff',
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Scrubber drag state
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);
  const [seekTime, setSeekTime] = useState(0);

  const activeColor = visualizerColor || accentColor;
  const audioSourceUrl = resolveAudioSource(src);

  // Initialize Web Audio API on first user interaction
  const initAudioNodes = () => {
    if (!audioRef.current) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      if (!sourceNodeRef.current && audioRef.current) {
        const an = ctx.createAnalyser();
        an.fftSize = 64;
        an.smoothingTimeConstant = 0.8;
        analyserNodeRef.current = an;

        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(an);
        an.connect(ctx.destination);
        sourceNodeRef.current = source;

        setAnalyser(an);
      }
    } catch (err) {
      console.warn('AudioVisualizer initialization fallback:', err);
    }
  };

  // Reset states when source URL changes
  useEffect(() => {
    setIsPlaying(false);
    setIsBuffering(false);
    setCurrentTime(0);
    setDuration(0);
    setIsDraggingSeek(false);
    setSeekTime(0);
    setError(null);

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.load();
    }
  }, [src]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
        sourceNodeRef.current = null;
        analyserNodeRef.current = null;
      }
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setError(null);
      initAudioNodes();

      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume().catch(() => {});
      }

      try {
        setIsBuffering(true);
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        setIsPlaying(false);
        console.warn('Playback error:', err);
        setError('Pemutaran ditolak oleh browser');
      } finally {
        setIsBuffering(false);
      }
    }
  };

  // Start audio on profile enter if triggered by intro screen
  useEffect(() => {
    const handleProfileEnter = () => {
      const audio = audioRef.current;
      if (audio && !isPlaying) {
        togglePlay();
      }
    };
    window.addEventListener('profile-enter', handleProfileEnter);
    return () => window.removeEventListener('profile-enter', handleProfileEnter);
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current && !isDraggingSeek) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      if (isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
      setError(null);
    }
  };

  const handleDurationChange = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      if (isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
    }
  };

  const commitSeek = (targetSec: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const clamped = Math.max(0, Math.min(targetSec, duration || targetSec));
    setCurrentTime(clamped);
    setSeekTime(clamped);

    try {
      audio.currentTime = clamped;
    } catch (err) {
      console.warn('Failed to seek audio:', err);
    }
  };

  const handleSeekPointerDown = () => {
    setIsDraggingSeek(true);
    setSeekTime(currentTime);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSeekTime(val);
    if (!isDraggingSeek) {
      commitSeek(val);
    }
  };

  const handleSeekPointerUp = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.currentTarget as HTMLInputElement;
    const val = Number(target.value);
    commitSeek(val);
    setIsDraggingSeek(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    setIsMuted(v === 0);
    if (audioRef.current) {
      audioRef.current.volume = v;
      audioRef.current.muted = v === 0;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
      if (!nextMuted && volume === 0) {
        setVolume(0.5);
        audioRef.current.volume = 0.5;
      }
    }
  };

  const displayTime = isDraggingSeek ? seekTime : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (displayTime / duration) * 100)) : 0;

  return (
    <div className="custom-audio-player">
      <audio
        ref={audioRef}
        src={audioSourceUrl}
        preload="auto"
        loop
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleDurationChange}
        onCanPlay={() => setIsBuffering(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setIsBuffering(false);
          setIsPlaying(false);
          setError('File audio tidak dapat dimuat');
        }}
      />

      {/* Header with track title */}
      <div className="player-header">
        <div className="player-track-info">
          <Music2 size={15} style={{ color: activeColor }} />
          <span className="player-track-title">{title || 'Soundtrack'}</span>
        </div>
        {error && (
          <span className="player-error-tag" title={error}>
            <AlertCircle size={12} /> {error}
          </span>
        )}
      </div>

      {/* Visualizer Canvas Area */}
      {visualizerEnabled && (
        <div className="player-visualizer-wrapper">
          <AudioVisualizer
            analyser={analyser}
            isPlaying={isPlaying}
            color={activeColor}
            glowIntensity={visualizerGlow}
            barCount={30}
            height={38}
          />
        </div>
      )}

      {/* Progress Bar & Timestamps */}
      <div className="player-scrubber-row">
        <span className="player-time-current">{formatTime(displayTime)}</span>
        <div className="player-progress-container">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={displayTime}
            onPointerDown={handleSeekPointerDown}
            onPointerUp={handleSeekPointerUp}
            onTouchStart={handleSeekPointerDown}
            onTouchEnd={handleSeekPointerUp}
            onMouseDown={handleSeekPointerDown}
            onMouseUp={handleSeekPointerUp}
            onChange={handleSeekChange}
            disabled={duration === 0 || !isFinite(duration)}
            className="player-progress-input"
            style={{
              background: `linear-gradient(to right, ${activeColor} ${progressPercent}%, rgba(255,255,255,0.12) ${progressPercent}%)`,
            }}
            aria-label="Posisi pemutaran lagu"
          />
        </div>
        <span className="player-time-total">{duration > 0 ? formatTime(duration) : '--:--'}</span>
      </div>

      {/* Controls: Play/Pause, Volume */}
      <div className="player-controls-row">
        <div className="player-left-space" />

        <button
          type="button"
          onClick={togglePlay}
          className="player-play-btn"
          style={{
            borderColor: activeColor,
            boxShadow: isPlaying ? `0 0 16px ${activeColor}40` : undefined,
          }}
          aria-label={isPlaying ? 'Jeda pemutaran musik' : 'Mulai pemutaran musik'}
        >
          {isBuffering ? (
            <Loader2 size={16} className="animate-spin" style={{ color: activeColor }} />
          ) : isPlaying ? (
            <Pause size={16} style={{ color: activeColor }} fill={activeColor} />
          ) : (
            <Play size={16} style={{ color: activeColor, marginLeft: 2 }} fill={activeColor} />
          )}
        </button>

        {/* Volume controls */}
        <div
          className="player-volume-group"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <button
            type="button"
            onClick={toggleMute}
            className="player-vol-btn"
            aria-label={isMuted || volume === 0 ? 'Aktifkan suara' : 'Bisukan suara'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={15} />
            ) : volume < 0.5 ? (
              <Volume1 size={15} />
            ) : (
              <Volume2 size={15} />
            )}
          </button>

          <div className={`player-vol-slider-wrap ${showVolumeSlider ? 'is-visible' : ''}`}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="player-vol-slider"
              aria-label="Volume suara"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
