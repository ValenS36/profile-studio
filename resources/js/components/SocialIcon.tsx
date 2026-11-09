import { Facebook, Github, Instagram, Link2, Twitter, Youtube } from 'lucide-react';

// Check actual host boundaries, not substrings (e.g. discord.com.evil.test).
export function socialPlatform(url: string, label: string): string {
  const platforms: Record<string, string[]> = {
    discord: ['discord.com', 'discord.gg', 'discordapp.com'],
    roblox: ['roblox.com'], instagram: ['instagram.com'],
    youtube: ['youtube.com', 'youtu.be'], github: ['github.com'],
    x: ['x.com'], twitter: ['twitter.com'], facebook: ['facebook.com', 'fb.com'],
  };
  try {
    const host = new URL(url).hostname.toLowerCase();
    for (const [platform, domains] of Object.entries(platforms)) {
      if (domains.some(domain => host === domain || host.endsWith(`.${domain}`))) return platform;
    }
  } catch { /* Incomplete URLs are normal while editing the draft. */ }
  const name = label.trim().toLowerCase();
  return Object.hasOwn(platforms, name) ? name : 'link';
}

export default function SocialIcon({ url, label }: { url: string; label: string }) {
  const platform = socialPlatform(url, label);
  const props = { size: 24, 'aria-hidden': true as const, focusable: false as const };
  switch (platform) {
    case 'discord': return <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.249.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.099.246.197.373.291a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.891.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .031-.056c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.03-.028ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419Z" />
    </svg>;
    case 'roblox': return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M5 0 24 5 19 24 0 19ZM9.7 8 8 14.3 14.3 16 16 9.7Z" /></svg>;
    case 'x': return <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.4l8.2-9.4L.8 2h6.5l4.4 6.7ZM17.8 20h1.7L6.3 4H4.5Z" /></svg>;
    case 'instagram': return <Instagram {...props} />;
    case 'youtube': return <Youtube {...props} />;
    case 'github': return <Github {...props} />;
    case 'twitter': return <Twitter {...props} />;
    case 'facebook': return <Facebook {...props} />;
    default: return <Link2 {...props} />;
  }
}
