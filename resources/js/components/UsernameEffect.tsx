import { useEffect, useState, type CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';

export type NameEffect = 'none' | 'glitch' | 'typewriter' | 'rainbow';
interface UsernameEffectProps { name: string; effect: NameEffect; accentColor?: string }

function TypewriterName({ name, accentColor }: { name: string; accentColor: string }) {
  const reducedMotion = useReducedMotion();
  const [text, setText] = useState(name);

  useEffect(() => {
    if (!name) { setText(name); return; }
    const letters = typeof Intl.Segmenter === 'function'
      ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(name), part => part.segment)
      : Array.from(name);
    let count = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    setText('');
    const tick = () => {
      count += deleting ? -1 : 1;
      setText(letters.slice(0, count).join(''));
      let delay = reducedMotion ? 180 : deleting ? 48 : 95;
      if (count === letters.length) { deleting = true; delay = 2400; }
      else if (count === 0) { deleting = false; delay = 650; }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 450);
    return () => clearTimeout(timer);
  }, [name, reducedMotion]);

  return <h1 className="name-effect-typewriter" aria-label={name} style={{ '--name-accent': accentColor } as CSSProperties}>
    <span className="typewriter-layout" aria-hidden="true">
      <span className="typewriter-reserve">{name}<span className="typewriter-cursor">▎</span></span>
      <span className="typewriter-live">{text}<span className="typewriter-cursor">▎</span></span>
    </span>
  </h1>;
}

export default function UsernameEffect({ name, effect = 'none', accentColor = '#b6a2ff' }: UsernameEffectProps) {
  if (effect === 'typewriter') return <TypewriterName key={name} name={name} accentColor={accentColor} />;
  if (effect === 'glitch') return <h1 className="name-effect-glitch" aria-label={name} style={{ '--name-accent': accentColor } as CSSProperties}>
    <span className="glitch-word" aria-hidden="true">
      <span className="glitch-base">{name}</span>
      <span className="glitch-slice glitch-slice-a">{name}</span>
      <span className="glitch-slice glitch-slice-b">{name}</span>
      <span className="glitch-slice glitch-slice-scan">{name}</span>
    </span>
  </h1>;
  if (effect === 'rainbow') return <h1 className="name-effect-rainbow"><span>{name}</span></h1>;
  return <h1>{name}</h1>;
}
