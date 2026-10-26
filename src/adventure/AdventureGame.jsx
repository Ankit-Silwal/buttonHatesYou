'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Wallet from '@/components/Wallet';
import Avatar from '@/components/Avatar';
import { useProfile } from '@/profile/useProfile';
import { grantReward } from '@/profile/store';
import { GAME, REWARDS } from '@/economy/catalog';
import { Sound } from '@/game/sound';
import { W, H, lookOf } from './kit';
import { CREATE } from './games';

const SAVE_KEY = 'buttonHatesYou.adventure.v1';

// { best: { [game]: score }, goal: [games whose goal was ever reached], muted }
function loadSave() {
  const empty = { best: {}, goal: [], muted: false };
  try {
    return { ...empty, ...JSON.parse(localStorage.getItem(SAVE_KEY)) };
  } catch {
    return empty;
  }
}

// One Adventure mini-game: a title card, the canvas, and a results card.
export default function AdventureGame({ id }) {
  const meta = GAME[id];
  const profile = useProfile();
  const [save, setSave] = useState(null);
  const [mode, setMode] = useState('title'); // title | play | over
  const [run, setRun] = useState(0); // bumps to restart the canvas
  const [result, setResult] = useState(null); // { score, best, prize }

  useEffect(() => {
    const s = loadSave();
    Sound.setMuted(s.muted);
    setSave(s);
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

  const finish = useCallback(
    (score) => {
      const best = Math.max(score, save.best[id] ?? 0);
      const newBest = score > (save.best[id] ?? 0) && score > 0;
      let prize = null;
      if (score >= meta.goal && grantReward('adventure-goal')) {
        prize = { ...REWARDS['adventure-goal'] };
        // the very first time a game's goal is reached it also pays a diamond
        if (!save.goal.includes(id) && grantReward('adventure-first')) prize.diamonds += REWARDS['adventure-first'].diamonds;
      }
      update((s) => ({
        ...s,
        best: { ...s.best, [id]: best },
        goal: prize && !s.goal.includes(id) ? [...s.goal, id] : s.goal,
      }));
      setResult({ score, best, newBest, prize });
      setMode('over');
    },
    [id, meta, save, update]
  );

  if (!save) return <main className={`adv adv-${id}`} />;

  const start = () => {
    Sound.init();
    setResult(null);
    setRun((r) => r + 1);
    setMode('play');
  };

  const toggleMute = () =>
    update((s) => {
      Sound.setMuted(!s.muted);
      return { ...s, muted: !s.muted };
    });

  return (
    <main className={`adv adv-${id}`} style={{ '--art': meta.color }}>
      <header className="adv-top">
        <div className="row">
          <Link href="/games" className="chip home" aria-label="All games">
            🎮
          </Link>
          {mode !== 'play' && <Wallet profile={profile} />}
        </div>
        <button className="chip icon" aria-label="Sound on/off" onClick={toggleMute}>
          {save.muted ? '🔇' : '🔊'}
        </button>
      </header>

      {mode === 'play' && <Stage key={run} id={id} equipped={profile.wallet.equipped} onOver={finish} />}

      {mode === 'title' && (
        <div className="adv-overlay">
          <div className="adv-card">
            <span className="adv-emoji" aria-hidden="true">
              {meta.emoji}
            </span>
            <h1>{meta.name}</h1>
            <p>{meta.blurb}</p>
            <p className="how">{meta.howTo}</p>
            <p className="goal">
              Goal: <b>{meta.goal}</b> {meta.unit} · {meta.prize}
              {save.best[id] ? <span> · Best: {save.best[id]}</span> : null}
            </p>
            <button className="pill big" onClick={start} autoFocus>
              Play
            </button>
          </div>
        </div>
      )}

      {mode === 'over' && result && (
        <div className="adv-overlay">
          <div className="adv-card">
            <Avatar size={84} equipped={profile.wallet.equipped} mood={result.prize ? 'sad' : 'smug'} />
            <p className="kicker">{result.prize ? 'Goal reached' : 'Game over'}</p>
            <h2>
              {result.score} <small>{meta.unit}</small>
            </h2>
            <p>{result.newBest ? 'New best!' : `Best: ${result.best}`}</p>
            <p className="quip">“{result.prize ? meta.quips.goal : meta.quips.fail}”</p>
            {result.prize ? (
              <p className="prize">
                +{result.prize.coins} 🪙{result.prize.diamonds ? ` +${result.prize.diamonds} 💎` : ''}
              </p>
            ) : (
              <p className="goal">
                Reach {meta.goal} {meta.unit} to earn coins.
              </p>
            )}
            <div className="row">
              <Link href="/games" className="pill ghost">
                Games
              </Link>
              <button className="pill" onClick={start} autoFocus>
                Again
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ---------- the canvas and its loop ---------- */
function Stage({ id, equipped, onOver }) {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const latest = useRef(onOver);
  latest.current = onOver;
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  useEffect(() => {
    const cv = canvas.current;
    const box = wrap.current; // kept: a late resize callback can outlive the ref
    const c = cv.getContext('2d');
    const keys = new Set();
    const game = CREATE[id]({ look: lookOf(equipped), sound: Sound, keys });
    let scale = 1;
    let ox = 0;
    let oy = 0;
    let dpr = 1;

    const fit = () => {
      const cw = box.clientWidth;
      const ch = box.clientHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      scale = Math.min(cw / W, ch / H);
      ox = (cw - W * scale) / 2;
      oy = (ch - H * scale) / 2;
      cv.width = Math.round(cw * dpr);
      cv.height = Math.round(ch * dpr);
      cv.style.width = `${cw}px`;
      cv.style.height = `${ch}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);

    // pointer position in game coordinates
    const at = (e) => {
      const r = cv.getBoundingClientRect();
      return [(e.clientX - r.left - ox) / scale, (e.clientY - r.top - oy) / scale];
    };
    const down = (e) => {
      if (pausedRef.current) return;
      e.preventDefault();
      cv.setPointerCapture?.(e.pointerId);
      game.down?.(...at(e));
    };
    const move = (e) => !pausedRef.current && game.move?.(...at(e));
    const up = (e) => !pausedRef.current && game.up?.(...at(e));
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);

    const keydown = (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') return setPaused((p) => !p);
      if (pausedRef.current) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!keys.has(e.code) && !e.repeat) game.key?.(e.code);
      keys.add(e.code);
    };
    const keyup = (e) => keys.delete(e.code);
    const blur = () => {
      keys.clear();
      setPaused(true);
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', blur);

    let raf = 0;
    let last = performance.now();
    let overFor = 0;
    let reported = false;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (!pausedRef.current && !reported) {
        game.update(dt);
        // let the crash play out for a moment before the results card
        if (game.over && (overFor += dt) > 0.9) {
          reported = true;
          latest.current(Math.floor(game.score));
        }
      }
      // the bars around the 480x800 frame show the stage's own background
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, cv.width, cv.height);
      c.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
      c.save();
      c.beginPath();
      c.rect(0, 0, W, H);
      c.clip();
      game.draw(c);
      c.restore();
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      cv.removeEventListener('pointerdown', down);
      cv.removeEventListener('pointermove', move);
      cv.removeEventListener('pointerup', up);
      cv.removeEventListener('pointercancel', up);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
    };
    // the outfit is read once when a run starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="adv-stage" ref={wrap}>
      <canvas ref={canvas} />
      <button className="chip icon adv-pause" aria-label="Pause" onClick={() => setPaused(true)}>
        ⏸
      </button>
      {paused && (
        <div className="adv-overlay">
          <div className="adv-card">
            <h2>Paused</h2>
            <p>The button is enjoying the break.</p>
            <button className="pill big" onClick={() => setPaused(false)} autoFocus>
              Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
