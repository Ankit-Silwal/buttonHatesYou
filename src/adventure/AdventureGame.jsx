'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Wallet from '@/components/Wallet';
import Avatar from '@/components/Avatar';
import { useProfile } from '@/profile/useProfile';
import { recordRun } from '@/profile/store';
import { GAME } from '@/economy/catalog';
import { Sound } from '@/game/sound';
import { W, H, lookOf } from './kit';
import { CREATE } from './games';

const SAVE_KEY = 'buttonHatesYou.adventure.v1';

// { best: { [game]: score }, muted } (older saves also have `goal`, unused now)
function loadSave() {
  const empty = { best: {}, muted: false };
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

  // Every run pays by how it went (see adventurePayout in economy/rules.js).
  const finish = useCallback(
    ({ score, coins, ms }) => {
      const best = Math.max(score, save.best[id] ?? 0);
      const newBest = score > (save.best[id] ?? 0) && score > 0;
      const prize = recordRun({ game: id, score, extra: coins, ms }) ?? { coins: 0, diamonds: 0 };
      update((s) => ({ ...s, best: { ...s.best, [id]: best } }));
      setResult({ score, coins, best, newBest, prize });
      setMode('over');
    },
    [id, save, update]
  );

  if (!save) return <main className={`adv adv-${id}`} />;
  // a run that paid at least a full first tier counts as a good one
  const good = result && (result.prize.coins >= (meta.payout.base ?? 25) || result.prize.diamonds > 0);

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
              {meta.rule}
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
          <div className={`adv-card${good ? ' win' : ''}`}>
            <Avatar size={84} equipped={profile.wallet.equipped} mood={good ? 'sad' : 'smug'} />
            <p className="kicker">{good ? 'Nice run' : 'Game over'}</p>
            <h2>
              {result.score} <small>{meta.unit}</small>
            </h2>
            <p>{result.newBest ? 'New best!' : `Best: ${result.best}`}</p>
            <p className="quip">“{good ? meta.quips.goal : meta.quips.fail}”</p>
            <p className={`prize${result.prize.coins || result.prize.diamonds ? '' : ' none'}`}>
              +{result.prize.coins} 🪙{result.prize.diamonds ? ` +${result.prize.diamonds} 💎` : ''}
            </p>
            <p className="goal">{nextTier(meta, result)}</p>
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

// The line under a run's payout: how far the next, better-paying tier was.
function nextTier({ payout: p, unit }, { score, coins }) {
  if (p.coins) return `${coins} coin${coins === 1 ? '' : 's'} grabbed. Every one is yours.`;
  const tier = Math.floor(score / p.per) + 1;
  const left = tier * p.per - score;
  return `${left} more ${unit} and the next ${p.per} pay ${p.base * (tier + 1)} 🪙.`;
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
    let played = 0; // seconds of unpaused play, sent with the run (the server checks the score against it)
    let reported = false;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      // frame timestamps can arrive out of order; never step backwards
      const dt = Math.min(Math.max(0, (now - last) / 1000), 1 / 30);
      last = now;
      if (!pausedRef.current && !reported) {
        game.update(dt);
        played += dt;
        // let the crash play out for a moment before the results card
        if (game.over && (overFor += dt) > 0.9) {
          reported = true;
          latest.current({ score: Math.floor(game.score), coins: Math.floor(game.coins ?? 0), ms: played * 1000 });
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
      bleed();
    };

    // The bars around the 480x800 frame show a heavily blurred, dimmed copy of
    // the frame itself (shrunk to a few pixels, then stretched back up), so
    // the scene's colours seem to spill off-screen.
    const tiny = document.createElement('canvas');
    tiny.width = 12;
    tiny.height = 20;
    const tc = tiny.getContext('2d');
    const bleed = () => {
      const fx = Math.round(ox * dpr);
      const fy = Math.round(oy * dpr);
      const fw = Math.round(W * scale * dpr);
      const fh = Math.round(H * scale * dpr);
      if ((fx < 1 && fy < 1) || fw < 2 || fh < 2) return;
      c.setTransform(1, 0, 0, 1, 0, 0);
      tc.clearRect(0, 0, 12, 20);
      tc.drawImage(cv, fx, fy, fw, fh, 0, 0, 12, 20);
      c.imageSmoothingEnabled = true;
      c.fillStyle = 'rgba(8, 4, 16, 0.38)';
      if (fx >= 1) {
        const rw = cv.width - fx - fw;
        c.drawImage(tiny, 0, 0, 1, 20, 0, 0, fx, cv.height);
        c.drawImage(tiny, 11, 0, 1, 20, fx + fw, 0, rw, cv.height);
        c.fillRect(0, 0, fx, cv.height);
        c.fillRect(fx + fw, 0, rw, cv.height);
      }
      if (fy >= 1) {
        const bh = cv.height - fy - fh;
        c.drawImage(tiny, 0, 0, 12, 1, 0, 0, cv.width, fy);
        c.drawImage(tiny, 0, 19, 12, 1, 0, fy + fh, cv.width, bh);
        c.fillRect(0, 0, cv.width, fy);
        c.fillRect(0, fy + fh, cv.width, bh);
      }
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
