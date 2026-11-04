export type Profile = {
  name: string;
  bio: string;
  quote: string;
  accent: string;
  backgroundColor: string;
  opacity: number;
  blur: number;
  radius: number;
  glow: boolean;
  entrance: boolean;
  avatar: string | null;
  background: string | null;
  backgroundType: 'color' | 'image' | 'video';
  audio: string | null;
  songTitle: string;
  links: { label: string; url: string }[];

  // Audio Visualizer
  visualizerEnabled: boolean;
  visualizerColorMode: 'accent' | 'custom';
  visualizerColor: string;
  visualizerGlow: number;

  // Background Effect
  backgroundEffect: 'none' | 'gold_particles';
  particleColor: string;
  particleDensity: number;
  particleSize: number;
  particleSpeed: number;
  particleGlow: number;
  particleOpacity: number;

  // Cursor Effect
  cursorEffect: 'default' | 'dot' | 'ring' | 'crosshair';
  cursorColorMode: 'accent' | 'custom';
  cursorColor: string;
  cursorSize: number;
  cursorGlow: number;
  cursorTrail: boolean;

  // Username Effect
  nameEffect: 'none' | 'glitch' | 'typewriter' | 'rainbow';

  // Intro Overlay
  introEnabled: boolean;
};
