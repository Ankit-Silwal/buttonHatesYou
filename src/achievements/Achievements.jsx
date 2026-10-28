'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import Account from '@/components/Account';
import Wallet from '@/components/Wallet';
import { useProfile } from '@/profile/useProfile';
import { claimAchievement } from '@/profile/store';
import { ACHIEVEMENTS, ACHIEVEMENT_DIAMONDS, CATEGORIES, MEDALS, achievementStates } from '@/economy/achievements';
import { isBigDay } from '@/economy/chest';
import { ChestArt, ChestDialog, Streak, useChest } from './Chest';
import './achievements.css';

const fmt = (n) => Math.floor(n).toLocaleString('en-US');
const LEVELS = ACHIEVEMENTS.reduce((n, a) => n + a.levels.length, 0);

// Every achievement, by category: medals, progress to the next level, and a
// Claim button when a level is ready. Claiming is by hand, one level at a
// time, so there is always a moment of "ooh".
export default function Achievements() {
  const profile = useProfile();
  const { wallet, ready } = profile;
  const [burst, setBurst] = useState(null); // { id, level, diamonds, n }
  const [chestOpen, setChestOpen] = useState(false);
  const bursts = useRef(0);
  const states = achievementStates(wallet);
  const claimed = states.reduce((n, x) => n + x.level, 0);
  const earned = states.reduce((n, x) => n + x.a.levels.slice(0, x.level).reduce((m, l) => m + l.diamonds, 0), 0);
  const waiting = states.reduce((n, x) => n + x.claimable, 0);

  function claim(x) {
    const got = claimAchievement(x.a.id, x.level + 1);
    if (!got) return;
    setBurst({ id: x.a.id, level: x.level, diamonds: got.diamonds, n: ++bursts.current });
  }

  return (
    <main className="arcade ach-page">
      <header className="hub-top">
        <div className="arcade-left">
          <Link href="/" className="chip home" aria-label="Back home">
            🏠
          </Link>
          <Wallet profile={profile} />
        </div>
        <Account user={profile.user} ready={ready} />
      </header>

      <div className="arcade-head">
        <Avatar size={64} equipped={wallet.equipped} mood={waiting ? 'annoyed' : 'smug'} className="has-legs" />
        <div>
          <h1>Achievements</h1>
          <p>Diamonds don&apos;t grow on trees. They grow on achievements. Hit a goal, then claim its medal for 💎.</p>
        </div>
      </div>

      {ready && (
        <section className="ach-overview" aria-label="Your progress">
          <div className="ach-stat">
            <b>
              {claimed}
              <small>/{LEVELS}</small>
            </b>
            <span>medals</span>
          </div>
          <div className="ach-stat">
            <b>
              {earned}
              <small>/{ACHIEVEMENT_DIAMONDS}</small>
            </b>
            <span>💎 earned</span>
          </div>
          <div className={`ach-stat ${waiting ? 'hot' : ''}`}>
            <b>{waiting}</b>
            <span>ready to claim</span>
          </div>
          <ChestTile onOpen={() => setChestOpen(true)} />
        </section>
      )}

      {CATEGORIES.map((cat) => (
        <section key={cat.id} className="shelf" aria-labelledby={`ach-${cat.id}`}>
          <div className="shelf-head">
            <h2 id={`ach-${cat.id}`}>{cat.name}</h2>
            <p>{cat.blurb}</p>
          </div>
          <ul className="ach-grid">
            {states
              .filter((x) => x.a.cat === cat.id)
              .map((x, i) => (
                <li key={x.a.id} style={{ '--i': Math.min(i, 10) }}>
                  <Card x={x} ready={ready} burst={burst?.id === x.a.id ? burst : null} onClaim={() => claim(x)} />
                </li>
              ))}
          </ul>
        </section>
      ))}

      {chestOpen && <ChestDialog onClose={() => setChestOpen(false)} />}
    </main>
  );
}

function ChestTile({ onOpen }) {
  const chest = useChest();
  if (!chest) return null;
  return (
    <button className={`ach-chest ${chest.ready ? 'ready' : ''}`} onClick={onOpen}>
      <ChestArt big={chest.ready && isBigDay(chest.streak)} state={chest.ready ? 'closed' : 'open'} />
      <span className="ach-chest-text">
        <b>{chest.ready ? 'Daily chest ready!' : 'Chest opened today'}</b>
        <Streak streak={chest.alive} />
      </span>
    </button>
  );
}

function Medal({ medal, state, level, pop }) {
  return (
    <span className={`medal ${medal.id} ${state} ${pop ? 'pop' : ''}`} title={`${medal.name}: ${state === 'got' ? 'claimed' : state === 'ready' ? 'ready to claim' : `${fmt(level.at)} to go for ${level.diamonds} 💎`}`}>
      <span className="medal-disc">★</span>
    </span>
  );
}

function Card({ x, ready, burst, onClaim }) {
  const { a, level, value, next, claimable } = x;
  const done = !next;
  const shown = next ?? a.levels[a.levels.length - 1];
  const from = level ? a.levels[level - 1].at : 0;
  const pct = done ? 100 : Math.max(0, Math.min(100, ((value - from) / (next.at - from)) * 100));
  const medal = MEDALS[Math.min(level, MEDALS.length - 1)];

  return (
    <article className={`ach-card ${claimable ? 'ready' : ''} ${done ? 'done' : ''} ${burst ? 'claimed' : ''}`} key={burst?.n}>
      <div className="ach-top">
        <span className="ach-ico" aria-hidden="true">
          {a.icon}
        </span>
        <div className="ach-title">
          <b>{a.name}</b>
          <span className="ach-goal">{done ? 'All three medals. Show-off.' : a.goal(next.at)}</span>
        </div>
      </div>

      <div className="ach-medals" aria-label={`${level} of ${a.levels.length} medals`}>
        {MEDALS.map((m, i) => (
          <Medal key={m.id} medal={m} level={a.levels[i]} state={i < level ? 'got' : i < level + claimable ? 'ready' : 'locked'} pop={burst && burst.level === i} />
        ))}
      </div>

      <div className="ach-progress">
        <div className="ach-bar" role="progressbar" aria-valuemin={0} aria-valuemax={shown.at} aria-valuenow={Math.min(value, shown.at)}>
          <i style={{ width: `${ready ? pct : 0}%` }} />
        </div>
        <span className="ach-count">
          {fmt(Math.min(value, shown.at))} / {fmt(shown.at)}
        </span>
      </div>

      <div className="ach-foot">
        {done ? (
          <span className="ach-reward done">✓ Complete</span>
        ) : (
          <span className="ach-reward">
            <span className={`dot ${medal.id}`} /> {medal.name} · +{next.diamonds} 💎
          </span>
        )}
        {claimable > 0 && (
          <button className="pill claim" onClick={onClaim}>
            Claim
          </button>
        )}
      </div>

      {burst && (
        <span className="ach-burst" aria-live="polite">
          <span className="ach-plus">+{burst.diamonds} 💎</span>
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} style={{ '--a': `${i * 36}deg`, '--d': `${60 + (i % 3) * 18}px` }}>
              {i % 2 ? '💎' : '✦'}
            </i>
          ))}
        </span>
      )}
    </article>
  );
}
