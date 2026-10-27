'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Avatar from './Avatar';
import { useProfile } from '@/profile/useProfile';
import { SERIES } from '@/story/content';

// The whole story, in order. Premises are free to read; each chapter's
// retelling unlocks once you've finished that chapter in its game.

// "Read it all" is remembered per browser, so a spoiler reader stays one.
const REVEAL_KEY = 'buttonHatesYou.story.revealAll';

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
  return out;
}

export default function Story() {
  const profile = useProfile();
  const [done, setDone] = useState(null);
  const [all, setAll] = useState(false);

  useEffect(() => {
    setDone(loadProgress());
    try {
      setAll(localStorage.getItem(REVEAL_KEY) === '1');
    } catch {}
  }, []);

  function reveal(on) {
    if (on && !window.confirm('Unlock every chapter? This spoils both games, including the ending of The Reason.')) return;
    setAll(on);
    try {
      if (on) localStorage.setItem(REVEAL_KEY, '1');
      else localStorage.removeItem(REVEAL_KEY);
    } catch {}
  }

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
          <Avatar size={84} equipped={profile.wallet.equipped} mood="sad" className="has-legs" />
        </span>
        <div>
          <h1>The Story</h1>
          <p>
            Why the button hates you, from the beginning. Each part tells you what it’s about. The rest you unlock by playing it:
            finish a chapter and its story appears here.
          </p>
          <p className="story-count">
            {all ? 'Everything unlocked. Spoilers ahead.' : done ? `${Math.min(unlocked, total)} of ${total} chapters unlocked` : '…'}
          </p>
          <span className="story-progress" aria-hidden="true">
            <i style={{ width: `${all ? 100 : (Math.min(unlocked, total) / total) * 100}%` }} />
          </span>
          <button className={`pill ${all ? 'ghost' : 'reveal'}`} onClick={() => reveal(!all)}>
            {all ? '🔒 Lock it again' : '📖 Read it all (spoilers)'}
          </button>
        </div>
      </section>

      <ol className="story-parts">
        {SERIES.map((s, i) => (
          <Part key={s.id} s={s} i={i} done={done?.[s.id]} all={all} />
        ))}
      </ol>
    </main>
  );
}

function Part({ s, i, done, all }) {
  const finished = done?.size ?? 0;
  return (
    <li className="story-part" style={{ '--tone': s.color, '--i': i }}>
      <div className="part-head">
        <p className="kicker">{s.order}</p>
        <h2>{s.title}</h2>
        <p className="premise">{s.premise}</p>
        <div className="part-meta">
          <Link href={s.href} className="pill">
            {finished ? 'Keep playing' : 'Play'} →
          </Link>
          <span>{all ? 'all unlocked' : `${finished} / ${s.chapters.length} unlocked`}</span>
        </div>
      </div>

      <ol className="part-chapters">
        {s.chapters.map((c, i) => {
          const n = i + 1;
          const open = all || !!done?.has(n);
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
