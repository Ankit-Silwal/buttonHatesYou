'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Wallet from '@/components/Wallet';
import { useProfile } from '@/profile/useProfile';
import { grantReward } from '@/profile/store';
import { REWARDS } from '@/economy/catalog';
import { CHAPTERS, LEVELS, LEVEL, LAST, isChapterEnd } from './levels';
import { Bobby, Bubble, sfx } from './kit';
import ch1 from './chapters/ch1';
import ch2 from './chapters/ch2';

// Level id -> component. Each chapter file exports { [id]: Component }.
const PLAYS = { ...ch1, ...ch2 };

const SAVE_KEY = 'buttonHatesYou.love.v1';
const SKIP_AFTER_MS = 25000;

function loadSave() {
  try {
    return { done: {}, paid: [], muted: false, ...JSON.parse(localStorage.getItem(SAVE_KEY)) };
  } catch {
    return { done: {}, paid: [], muted: false };
  }
}

const unlocked = (save, id) => id === 1 || !!save.done[id - 1];
const nextUp = (save) => LEVELS.find((l) => !save.done[l.id])?.id ?? LAST;

export default function LoveGame() {
  const profile = useProfile();
  const [save, setSave] = useState(null);
  const [level, setLevel] = useState(null); // id being played, null = map

  useEffect(() => {
    const s = loadSave();
    sfx.setMuted(s.muted);
    setSave(s);
    // First time here: straight into the story.
    if (!Object.keys(s.done).length) setLevel(1);
  }, []);

  const update = useCallback((fn) => {
    setSave((s) => {
      const next = fn(s);
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  if (!save) return <main className="love" />;

  return (
    <main className="love" onPointerDown={() => sfx.init()}>
      {level ? (
        <Play key={level} id={level} save={save} update={update} onExit={() => setLevel(null)} onGo={setLevel} />
      ) : (
        <LevelMap save={save} profile={profile} onPlay={setLevel} update={update} />
      )}
    </main>
  );
}

/* ---------- the map ---------- */
function LevelMap({ save, profile, onPlay, update }) {
  const next = nextUp(save);
  const doneCount = Object.keys(save.done).length;
  return (
    <div className="love-map">
      <header className="love-top">
        <div className="row">
          <Link href="/games" className="chip home" aria-label="All games">
            🎮
          </Link>
          <Wallet profile={profile} />
        </div>
        <Mute save={save} update={update} />
      </header>

      <section className="love-hero">
        <Bobby size={110} mood="sad" tears={doneCount === 0} love={doneCount >= 25}>
          <Bubble>{doneCount === 0 ? 'Single for 404 days.' : doneCount >= LAST ? 'Thanks, bro. Truly.' : 'BRO. Keep going.'}</Bubble>
        </Bobby>
        <div>
          <h1>Desperate for Love</h1>
          <p>
            {doneCount} / {LAST} levels · a lonely red button with absolutely zero game
          </p>
          <button className="pill big love-btn" onClick={() => onPlay(next)}>
            {doneCount ? `Continue: level ${next}` : 'Start 💘'}
          </button>
        </div>
      </section>

      <ol className="chapters">
        {CHAPTERS.map((c) => {
          const ids = LEVELS.filter((l) => l.chapter === c.n).map((l) => l.id);
          const open = unlocked(save, ids[0]);
          return (
            <li key={c.n} className={`chapter ${open ? '' : 'locked'}`}>
              <h2>
                <span>{open ? c.emoji : '🔒'}</span> Chapter {c.n}
                <small>{c.title}</small>
              </h2>
              <div className="dots">
                {ids.map((id) => (
                  <button
                    key={id}
                    className={`dot ${save.done[id] ?? ''} ${id === next ? 'next' : ''}`}
                    disabled={!unlocked(save, id)}
                    onClick={() => onPlay(id)}
                    title={LEVEL[id].title}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Mute({ save, update }) {
  return (
    <button
      className="chip icon"
      aria-label="Sound on/off"
      onClick={() =>
        update((s) => {
          sfx.setMuted(!s.muted);
          return { ...s, muted: !s.muted };
        })
      }
    >
      {save.muted ? '🔇' : '🔊'}
    </button>
  );
}

/* ---------- playing one level ---------- */
function Play({ id, save, update, onExit, onGo }) {
  const meta = LEVEL[id];
  const chapter = CHAPTERS[meta.chapter - 1];
  const Level = PLAYS[id] ?? ComingSoon;
  const [phase, setPhase] = useState('intro'); // intro | play | result
  const [attempt, setAttempt] = useState(0);
  const [fails, setFails] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [line, setLine] = useState({ text: '', mood: 'calm', n: 0 });
  const [result, setResult] = useState(null); // { won, line, skipped, prize }
  const over = useRef(false);

  useEffect(() => {
    if (phase !== 'play') return;
    const t = setTimeout(() => setCanSkip(true), SKIP_AFTER_MS);
    return () => clearTimeout(t);
  }, [phase, attempt]);

  const say = useCallback((text, mood = 'calm') => setLine((l) => ({ text, mood, n: l.n + 1 })), []);

  const finish = useCallback(
    (won, text, skipped = false) => {
      if (over.current) return;
      over.current = true;
      let prize = null;
      if (won) {
        skipped ? sfx.ding() : sfx.win();
        const firstTime = !save.done[id];
        const chapterPaid = save.paid.includes(meta.chapter);
        if (isChapterEnd(id) && !chapterPaid && grantReward('love-chapter')) prize = REWARDS['love-chapter'];
        if (id === LAST && firstTime && grantReward('love-finale')) prize = REWARDS['love-finale'];
        update((s) => ({
          ...s,
          done: { ...s.done, [id]: s.done[id] === 'won' || !skipped ? 'won' : 'skipped' },
          paid: isChapterEnd(id) && !s.paid.includes(meta.chapter) ? [...s.paid, meta.chapter] : s.paid,
        }));
      } else {
        sfx.bad();
        setFails((f) => f + 1);
        setCanSkip(true);
      }
      setResult({ won, line: text, skipped, prize });
      setPhase('result');
    },
    [id, meta.chapter, save, update]
  );

  const win = useCallback((text) => finish(true, text), [finish]);
  const fail = useCallback((text) => finish(false, text), [finish]);

  function skip() {
    over.current = false; // allowed from the fail card too
    finish(true, "Fine. I'll pretend you did that. I believe in you. Kind of.", true);
  }

  function retry() {
    over.current = false;
    setResult(null);
    setLine((l) => ({ ...l, text: '' }));
    setAttempt((a) => a + 1);
    setPhase('play');
  }

  return (
    <div className="love-play">
      <header className="love-top">
        <div className="row">
          <button className="chip icon" onClick={onExit} aria-label="Level map">
            🗺️
          </button>
          <span className="chip title">
            <b>{id}</b>
            <span>{meta.title}</span>
          </span>
        </div>
        <div className="row">
          {phase === 'play' && canSkip && (
            <button className="chip skip" onClick={skip}>
              ⏭ Skip
            </button>
          )}
          <Mute save={save} update={update} />
        </div>
      </header>

      {phase === 'play' && (
        <>
          <p className="love-goal">{meta.goal}</p>
          {line.text && (
            <p className="love-line" key={line.n} aria-live="polite">
              <b>Bobby:</b> {line.text}
            </p>
          )}
          <div className="love-stage">
            <Level key={attempt} win={win} fail={fail} say={say} fails={fails} />
          </div>
        </>
      )}

      {phase === 'intro' && (
        <div className="love-overlay">
          <div className="love-card intro">
            {meta.id % 5 === 1 && (
              <p className="kicker">
                Chapter {chapter.n} · {chapter.title}
              </p>
            )}
            <h2>
              <span className="lvl-num">{id}</span> {meta.title}
            </h2>
            <div className="intro-bobby">
              <Bobby size={96} mood={id === 1 ? 'sad' : 'smug'} tears={id === 1}>
                <Bubble>{meta.intro}</Bubble>
              </Bobby>
            </div>
            <p className="goal">🎯 {meta.goal}</p>
            <button className="pill big love-btn" onClick={() => setPhase('play')} autoFocus>
              Let&apos;s go 💘
            </button>
          </div>
        </div>
      )}

      {phase === 'result' && result && (
        <div className="love-overlay">
          <div className={`love-card ${result.won ? 'won' : 'lost'}`}>
            <div className="big-emoji">{result.won ? (result.skipped ? '🙈' : '💘') : '💔'}</div>
            <h2>{result.won ? (result.skipped ? 'Skipped' : 'Nailed it') : 'Oof'}</h2>
            {result.line && <p className="quote">“{result.line}”</p>}
            {result.prize && (
              <p className="prize">
                {isChapterEnd(id) && id !== LAST ? `Chapter ${meta.chapter} done! ` : 'You finished the whole thing! '}+{result.prize.coins} 🪙
                {result.prize.diamonds ? ` +${result.prize.diamonds} 💎` : ''}
              </p>
            )}
            <div className="row">
              <button className="pill ghost" onClick={onExit}>
                Map
              </button>
              {result.won ? (
                id < LAST ? (
                  <button className="pill love-btn" onClick={() => onGo(id + 1)} autoFocus>
                    Next level →
                  </button>
                ) : (
                  <button className="pill love-btn" onClick={onExit} autoFocus>
                    The end 💘
                  </button>
                )
              ) : (
                <button className="pill love-btn" onClick={retry} autoFocus>
                  Try again
                </button>
              )}
            </div>
            {!result.won && fails >= 2 && (
              <button className="linkish" onClick={skip}>
                or skip this one
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Stand-in for levels that are not built yet.
function ComingSoon({ win }) {
  return (
    <div className="lv center">
      <Bobby size={120} mood="tired" sweat>
        <Bubble>This level is still under construction. Pretend you did something amazing.</Bubble>
      </Bobby>
      <button className="pill love-btn" onClick={() => win('Wow. Amazing. I saw nothing but I believe it.')}>
        I did something amazing
      </button>
    </div>
  );
}
