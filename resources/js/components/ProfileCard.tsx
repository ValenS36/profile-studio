import { useRef, type CSSProperties } from 'react';
import { motion, MotionConfig } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import type { Profile } from '../types';
import AudioPlayer from './AudioPlayer';
import BackgroundEffects from './BackgroundEffects';
import CustomCursor from './CustomCursor';
import UsernameEffect from './UsernameEffect';

export default function ProfileCard({
  profile: p,
  preview = false,
}: {
  profile: Profile;
  preview?: boolean;
}) {
  const sceneRef = useRef<HTMLElement>(null);
  const style = {
    '--accent': p.accent,
    backgroundColor: p.backgroundColor,
  } as CSSProperties;

  // Resolve colors based on mode (accent vs custom)
  const visualizerColor =
    p.visualizerColorMode === 'custom' ? p.visualizerColor || '#b6a2ff' : p.accent;
  const cursorColor =
    p.cursorColorMode === 'custom' ? p.cursorColor || '#b6a2ff' : p.accent;

  return (
    <MotionConfig reducedMotion="user">
      <section ref={sceneRef} className="profile-scene" style={style}>
        {/* Background Image / Video */}
        {p.background && p.backgroundType === 'image' && (
          <img className="scene-media" src={p.background} alt="" />
        )}
        {p.background && p.backgroundType === 'video' && (
          <video
            className="scene-media"
            src={p.background}
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        <div className="scene-shade" />

        {/* Background Effects (Gold Falling Particles, etc.) */}
        <BackgroundEffects
          effect={p.backgroundEffect || 'none'}
          color={p.particleColor || '#d4af37'}
          density={p.particleDensity ?? 40}
          size={p.particleSize ?? 4}
          speed={p.particleSpeed ?? 3}
          glow={p.particleGlow ?? 50}
          opacity={p.particleOpacity ?? 80}
        />

        {/* Custom Cursor Effect */}
        <CustomCursor
          type={p.cursorEffect || 'default'}
          color={cursorColor}
          size={p.cursorSize ?? 20}
          glow={p.cursorGlow ?? 50}
          trail={p.cursorTrail ?? false}
          containerRef={sceneRef}
        />

        {/* Profile Card Container */}
        <motion.article
          key={p.entrance ? 'animated' : 'static'}
          initial={p.entrance ? { opacity: 0, y: 18 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="profile-card"
          style={{
            background: `rgba(24,23,34,${p.opacity / 100})`,
            backdropFilter: `blur(${p.blur}px)`,
            borderRadius: p.radius,
            boxShadow: p.glow ? `0 0 65px ${p.accent}24` : undefined,
          }}
        >
          {/* Avatar */}
          <div className="avatar" style={{ borderColor: p.accent }}>
            {p.avatar ? (
              <img src={p.avatar} alt={`Foto ${p.name}`} />
            ) : (
              <span>{p.name.slice(0, 1).toUpperCase()}</span>
            )}
          </div>

          <div className="tiny-label">MY LITTLE CORNER OF THE INTERNET</div>

          {/* Username with optional effect */}
          <UsernameEffect
            name={p.name}
            effect={p.nameEffect || 'none'}
            accentColor={p.accent}
          />

          {p.bio && <p className="bio">{p.bio}</p>}
          {p.quote && <blockquote>"{p.quote}"</blockquote>}

          {/* Social Links */}
          <div className="social-links">
            {p.links.map((link, i) =>
              preview ? (
                <span className="social-pill" key={i}>
                  {link.label}
                  <ExternalLink size={13} />
                </span>
              ) : (
                <a
                  className="social-pill"
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                  <ExternalLink size={13} />
                </a>
              )
            )}
          </div>

          {/* Custom Audio Player with Audio Visualizer */}
          {p.audio && (
            <div className="music-player-wrapper">
              <AudioPlayer
                src={p.audio}
                title={p.songTitle || 'Soundtrack'}
                visualizerEnabled={p.visualizerEnabled ?? true}
                visualizerColor={visualizerColor}
                visualizerGlow={p.visualizerGlow ?? 60}
                accentColor={p.accent}
              />
            </div>
          )}
        </motion.article>

        <span className="scene-footer">a space to be yourself.</span>
      </section>
    </MotionConfig>
  );
}
