'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Avatar from './Avatar';
import { useProfile } from '@/profile/useProfile';
import { SERIES } from '@/story/content';
import { DEFAULT_LOOK } from '@/economy/catalog';
import { storyOpen, STORY_UNLOCKS } from '@/economy/levels';

// The whole story, in order, with no spoilers: a story's premise shows once
// its level is reached (the game unlocks), and each chapter's retelling once
// that chapter is finished, in this browser's save or the wallet's claims.

// The game behind each part, and its story-reward ids (catalog.js STORY_REWARDS).
const GAME_OF = { cursor: 'how-i-met-your-cursor', reason: 'the-reason', 'please-dont': 'please-dont' };
const claimOf = (id, n) => (id === 'please-dont' ? 'please-dont' : `${id}:${n}`);

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? {};
  } catch {
    return {};
  }
}

// Which chapters of each game are finished, as { [seriesId]: Set<n> }.
function loadProgress(claimed = []) {
  const out = {};
  for (const s of SERIES) {
    const save = read(s.save);
    const set = new Set(s.id === 'please-dont' ? (save.done ? [1] : []) : Object.keys(save.done ?? {}).map(Number));
    s.chapters.forEach((_, i) => claimed.includes(claimOf(s.id, i + 1)) && set.add(i + 1));
    out[s.id] = set;
  }
  return out;
}

export default function Story() {
  const profile = useProfile();
  const [done, setDone] = useState(null);
  const claimed = profile.wallet.claimed;

  useEffect(() => {
    if (profile.ready) setDone(loadProgress(Array.isArray(claimed) ? claimed : []));
  }, [profile.ready, claimed]);

  const total = SERIES.reduce((n, s) => n + s.chapters.length, 0);
  const unlocked = done ? SERIES.reduce((n, s) => n + done[s.id].size, 0) : 0;

  return (
    <main className="story">
      <header className="story-top">
        <Link href="/" className="chip home" aria-label="Back home">
          🏠
        </Link>
        <Link href="/games" className="chip">
          🎮 Games
        </Link>
      </header>

      <section className="story-hero">
        <span className="story-portrait">
          {/* the stories are prequels: plain Bobby, whatever he's wearing now */}
          <Avatar size={84} equipped={DEFAULT_LOOK} mood="sad" className="has-legs" />
        </span>
        <div>
          <h1>The Story</h1>
          <p className="story-count">{done ? `${Math.min(unlocked, total)} of ${total} chapters unlocked` : '…'}</p>
          <span className="story-progress" aria-hidden="true">
            <i style={{ width: `${(Math.min(unlocked, total) / total) * 100}%` }} />
          </span>
        </div>
      </section>

      <ol className="story-parts">
        {SERIES.map((s, i) => (
          <Part key={s.id} s={s} i={i} done={done?.[s.id]} open={profile.ready && storyOpen(profile.wallet, GAME_OF[s.id])} />
        ))}
      </ol>
    </main>
  );
}

// `open`: the story's game is unlocked (by level), so its premise can show.
function Part({ s, i, done, open: unlockedStory }) {
  const finished = done?.size ?? 0;
  return (
    <li className="story-part" style={{ '--tone': s.color, '--i': i }}>
      <div className="part-head">
        <p className="kicker">{s.order}</p>
        <h2>{s.title}</h2>
        <p className="premise">{unlockedStory ? s.premise : `Beat level ${STORY_UNLOCKS[GAME_OF[s.id]]} to find out what this one is about.`}</p>
        <div className="part-meta">
          <Link href={s.href} className="pill">
            {finished ? 'Keep playing' : 'Play'} →
          </Link>
          <span>{`${finished} / ${s.chapters.length} unlocked`}</span>
        </div>
      </div>

      <ol className="part-chapters">
        {s.chapters.map((c, i) => {
          const n = i + 1;
          const open = !!done?.has(n);
          // the next chapter's title is a fair teaser; anything further stays hidden
          const showTitle = open || !!done?.has(n - 1) || n === 1;
          return (
            <li key={n} className={open ? 'open' : 'locked'}>
              <h3>
                <span className="n">{open ? n : '🔒'}</span>
                {s.chapters.length > 1 && `${s.unit} ${n}: `}
                {showTitle ? c.title : '???'}
              </h3>
              {open ? (
                c.text.map((p, k) => <p key={k}>{p}</p>)
              ) : (
                <p className="lock">
                  Finish {s.chapters.length > 1 ? `${s.unit.toLowerCase()} ${n} of ` : ''}
                  <Link href={s.href}>{s.title}</Link> to read this.
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </li>
  );
}
