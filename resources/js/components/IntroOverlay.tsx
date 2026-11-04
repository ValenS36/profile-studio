import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface IntroOverlayProps {
  onEnter: () => void;
  accentColor?: string;
}

export default function IntroOverlay({ onEnter, accentColor = '#b6a2ff' }: IntroOverlayProps) {
  const [exiting, setExiting] = useState(false);

  const handleClick = () => {
    if (exiting) return;
    setExiting(true);

    // Dispatch profile-enter event to trigger audio autoplay via user interaction
    try {
      window.dispatchEvent(new CustomEvent('profile-enter'));
    } catch {}

    // Delay callback to allow smooth fade-out and unblur transition
    setTimeout(() => {
      onEnter();
    }, 550);
  };

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          className="intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55 }}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          aria-label="Click here to start"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <div className="intro-backdrop" />
          <motion.div
            className="intro-content"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
          >
            <div className="intro-icon" style={{ borderColor: accentColor }}>
              <motion.span
                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                style={{ color: accentColor }}
              >
                ✳
              </motion.span>
            </div>
            <motion.p
              className="intro-cta"
              animate={{ opacity: [0.65, 1, 0.65] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            >
              [ click here to start ]
            </motion.p>
            <span className="intro-hint">tap anywhere to enter</span>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          className="intro-overlay is-exiting"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="intro-backdrop is-exiting" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
