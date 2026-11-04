import { useEffect, useRef, useState } from 'react';

export type NameEffect = 'none' | 'glitch' | 'typewriter' | 'rainbow';

interface UsernameEffectProps {
  name: string;
  effect: NameEffect;
  accentColor?: string;
}

/* ─── Glitch Effect ─── */
function GlitchName({ name, accentColor }: { name: string; accentColor: string }) {
  return (
    <h1
      className="name-effect-glitch"
      data-text={name}
      style={{ '--accent': accentColor } as React.CSSProperties}
    >
      <span className="glitch-base">{name}</span>
    </h1>
  );
}

/* ─── Typewriter Effect (Smooth Looping) ─── */
function TypewriterName({ name, accentColor }: { name: string; accentColor: string }) {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);

  useEffect(() => {
    // Reset when name changes
    setDisplayText('');
    setIsDeleting(false);
  }, [name]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!isDeleting) {
      // Typing forward
      if (displayText.length < name.length) {
        timer = setTimeout(() => {
          setDisplayText(name.slice(0, displayText.length + 1));
        }, 85);
      } else {
        // Full name reached, pause before deleting
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      // Backspacing
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(name.slice(0, displayText.length - 1));
        }, 40);
      } else {
        // Completely deleted, pause briefly then start typing again
        timer = setTimeout(() => {
          setIsDeleting(false);
          setLoopNum((prev) => prev + 1);
        }, 500);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, name, loopNum]);

  return (
    <h1 className="name-effect-typewriter">
      <span className="typewriter-text">{displayText}</span>
      <span className="typewriter-cursor" style={{ color: accentColor }}>
        |
      </span>
    </h1>
  );
}

/* ─── Rainbow (RGB Ease Flow) ─── */
function RainbowName({ name }: { name: string }) {
  return (
    <h1 className="name-effect-rainbow" data-text={name}>
      {name}
    </h1>
  );
}

/* ─── Main Export ─── */
export default function UsernameEffect({
  name,
  effect = 'none',
  accentColor = '#b6a2ff',
}: UsernameEffectProps) {
  switch (effect) {
    case 'glitch':
      return <GlitchName name={name} accentColor={accentColor} />;
    case 'typewriter':
      return <TypewriterName name={name} accentColor={accentColor} />;
    case 'rainbow':
      return <RainbowName name={name} />;
    default:
      return <h1>{name}</h1>;
  }
}
