import { Head } from '@inertiajs/react';
import { useState } from 'react';
import ProfileCard from '../components/ProfileCard';
import IntroOverlay from '../components/IntroOverlay';
import type { Profile } from '../types';

export default function PublicProfile({ profile }: { profile: Profile | null }) {
  const [showIntro, setShowIntro] = useState(profile?.introEnabled ?? false);

  if (!profile) {
    return (
      <>
        <Head title="Coming soon" />
        <main className="empty-page">
          <span className="brand-mark">✳</span>
          <h1>A new space is on its way.</h1>
          <p>Pemilik belum mempublikasikan profil ini.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Head title={profile.name || 'Profile'} />
      <div className={showIntro ? 'public-profile-root is-intro-active' : 'public-profile-root'}>
        <ProfileCard profile={profile} />
        {showIntro && (
          <IntroOverlay
            onEnter={() => setShowIntro(false)}
            accentColor={profile.accent}
          />
        )}
      </div>
    </>
  );
}
