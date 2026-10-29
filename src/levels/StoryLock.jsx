'use client';

import Link from 'next/link';
import Avatar from '@/components/Avatar';
import { GAME } from '@/economy/catalog';
import { STORY_UNLOCKS, storyOpen, levelState } from '@/economy/levels';
import { useProfile } from '@/profile/useProfile';
import LockTag from './LockTag';
import { Ring } from './LevelSheet';
import './levels.css';

// A story game's page: the game itself once its level is cleared (or for
// anyone who already played some of it), a locked card until then.
export default function StoryLock({ game, children }) {
  const { wallet, ready } = useProfile();
  if (!ready) return null; // the cache isn't read yet: don't flash either one
  if (storyOpen(wallet, game)) return children;
  const st = levelState(wallet);
  return (
    <main className="lv-locked-page">
      <div className="lv-locked-card">
        <Avatar size={96} equipped={wallet.equipped} mood="smug" />
        <h1>{GAME[game]?.name}</h1>
        <LockTag>Beat level {STORY_UNLOCKS[game]}</LockTag>
        <span className="lv-locked-row">
          <Ring done={st.done} level={st.level} size={40} /> You&apos;re on level {st.level}
        </span>
        <Link className="pill" href="/">
          Home
        </Link>
      </div>
    </main>
  );
}
