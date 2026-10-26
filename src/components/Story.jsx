'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Avatar from './Avatar';
import { useProfile } from '@/profile/useProfile';
import { SERIES, SIDE } from '@/story/content';
import { CHAPTERS as LOVE_CHAPTERS, LEVELS as LOVE_LEVELS } from '@/love/levels';

// The whole story, in order. Premises are free to read; each chapter's
// retelling unlocks once you've finished that chapter in its game.

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? {};
  } catch {
    return {};
  }
}

// Which chapters of each game are finished, as { [seriesId]: Set<n> }.
function loadProgress() {
  const out = {};
  for (const s of SERIES) {
    const save = read(s.save);
    out[s.id] = new Set(s.id === 'please-dont' ? (save.done ? [1] : []) : Object.keys(save.done ?? {}).map(Number));
  }
  const love = read(SIDE.save).done ?? {};
  out.love = new Set(LOVE_CHAPTERS.filter((c) => LOVE_LEVELS.filter((l) => l.chapter === c.n).every((l) => love[l.id])).map((c) => c.n));
  return out;
}

export default function Story() {
  const profile = useProfile();
  const [done, setDone] = useState(null);

  useEffect(() => setDone(loadProgress()), []);

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
        <Avatar size={84} equipped={profile.wallet.equipped} mood="sad" className="has-legs" />
        <div>
          <h1>The Story</h1>
          <p>
            Why the button hates you, from the beginning. Each part tells you what it’s about. The rest you unlock by playing it:
            finish a chapter and its story appears here.
          </p>
          <p className="story-count">
            {done ? `${Math.min(unlocked, total)} of ${total} chapters unlocked` : '…'}
          </p>
        </div>
      </section>

      <ol className="story-parts">
        {SERIES.map((s) => (
          <Part key={s.id} s={s} done={done?.[s.id]} />
        ))}
      </ol>

      <section className="story-side">
        <p className="kicker">{SIDE.order}</p>
        <h2>{SIDE.title}</h2>
        <p className="premise">{SIDE.premise}</p>
        <ul className="side-chapters">
          {LOVE_CHAPTERS.map((c) => {
            const open = done?.love.has(c.n);
            return (
              <li key={c.n} className={open ? 'open' : 'locked'}>
                <b>
                  {open ? c.emoji : '🔒'} Chapter {c.n}: {open ? c.title : '???'}
                </b>
                {open && (
                  <span>
                    {LOVE_LEVELS.filter((l) => l.chapter === c.n)
                      .map((l) => l.title)
                      .join(' · ')}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <Link href={SIDE.href} className="pill">
          Play {SIDE.title}
        </Link>
      </section>
    </main>
  );
}

function Part({ s, done }) {
  const finished = done?.size ?? 0;
  return (
    <li className="story-part" style={{ '--tone': s.color }}>
      <div className="part-head">
        <p className="kicker">{s.order}</p>
        <h2>{s.title}</h2>
        <p className="premise">{s.premise}</p>
        <div className="part-meta">
          <Link href={s.href} className="pill">
            {finished ? 'Keep playing' : 'Play'} →
          </Link>
          <span>
            {finished} / {s.chapters.length} unlocked
          </span>
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
