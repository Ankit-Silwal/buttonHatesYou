'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Wallet from '@/components/Wallet';
import { useProfile } from '@/profile/useProfile';
import { useEnergyGate } from '@/house/EnergyGate';
import { claimStory } from '@/profile/store';
import { Game } from './engine';
import { Bobby } from './actors';
import { SPEAKERS } from './draw';
import { initAudio, setMuted, stopAll } from './audio';
// The menu, episode runner and overlays shared by the story platformers
// (The Reason, How I Met Your Cursor). Each game passes a config:
//   saveKey, episodes, acts, story (its STORY_REWARDS prefix), unit ('Episode'),
//   title, kicker, sub, theme (extra class on <main>), keys (controls line)

function loadSave(key) {
  const empty = { done: {}, paid: [], flags: {}, muted: false };
  try {
    return { ...empty, ...JSON.parse(localStorage.getItem(key)) };
  } catch {
    return empty;
  }
}

const unlocked = (save, n) => n === 1 || !!save.done[n - 1];
const nextUp = (cfg, save) => cfg.episodes.find((e) => !save.done[e.n])?.n ?? 1;

export default function StoryGame({ cfg }) {
  const LAST = cfg.episodes.length;
  const profile = useProfile();
  const gate = useEnergyGate('story'); // each episode start costs energy
  const [save, setSave] = useState(null);
  const [playing, setPlaying] = useState(null); // episode number
  const [finished, setFinished] = useState(null); // { n, prize, skipped }

  useEffect(() => {
    const s = loadSave(cfg.saveKey);
    setMuted(s.muted);
    setSave(s);
  }, []);

  const update = useCallback((fn) => {
    setSave((s) => {
      const next = fn(s);
      try {
        localStorage.setItem(cfg.saveKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const complete = useCallback(
    (n, flags, skipped = false) => {
      // the first finish of each part pays (big, once: the wallet remembers)
      const prize = skipped ? null : claimStory(`${cfg.story}:${n}`);
      update((s) => ({
        ...s,
        done: { ...s.done, [n]: s.done[n] === 'won' || !skipped ? 'won' : 'skipped' },
        paid: prize ? [...s.paid, n] : s.paid,
        flags: flags ? { ...s.flags, ...flags } : s.flags,
      }));
      setPlaying(null);
      setFinished({ n, prize, skipped });
    },
    [cfg, LAST, save, update]
  );

  const cls = `reason ${cfg.theme ?? ''}`;
  if (!save) return <main className={cls} />;

  const toggleMute = () =>
    update((s) => {
      setMuted(!s.muted);
      return { ...s, muted: !s.muted };
    });

  return (
    <main className={cls} onPointerDown={() => initAudio()}>
      {playing ? (
        <Play key={playing} cfg={cfg} n={playing} save={save} muted={save.muted} onMute={toggleMute} onDone={complete} onExit={() => setPlaying(null)} />
      ) : (
        <Menu cfg={cfg} save={save} profile={profile} onPlay={(n) => { if (!gate.spend()) return; setFinished(null); setPlaying(n); }} onMute={toggleMute} />
      )}
      {finished && !playing && (
        <Finished
          cfg={cfg}
          {...finished}
          onClose={() => setFinished(null)}
          onNext={() => {
            if (!gate.spend()) return;
            setFinished(null);
            setPlaying(finished.n + 1);
          }}
        />
      )}
      {gate.refusal}
    </main>
  );
}

/* ---------- the episode list ---------- */
function Menu({ cfg, save, profile, onPlay, onMute }) {
  const LAST = cfg.episodes.length;
  const next = nextUp(cfg, save);
  const doneCount = Object.keys(save.done).length;
  return (
    <div className="reason-menu">
      <header className="reason-top">
        <div className="row">
          <Link href="/games" className="chip home" aria-label="All games">
            🎮
          </Link>
          <Wallet profile={profile} />
        </div>
        <button className="chip icon" aria-label="Sound on/off" onClick={onMute}>
          {save.muted ? '🔇' : '🔊'}
        </button>
      </header>

      <section className="reason-hero">
        {cfg.hero ?? (
          <div className="reason-bobby" aria-hidden="true">
            <span className="body" />
            <span className="pendant">♥</span>
          </div>
        )}
        <div>
          <p className="kicker">{cfg.kicker}</p>
          <h1>{cfg.title}</h1>
          <p className="reason-sub">{cfg.sub}</p>
          <button className="pill big reason-btn" onClick={() => onPlay(next)}>
            {doneCount ? (doneCount >= LAST ? 'Play again' : `Continue: ${cfg.unit} ${next}`) : 'Begin'}
          </button>
        </div>
      </section>

      {cfg.acts.map((act) => (
        <section key={act.n} className="reason-act">
          <h2>
            {act.label ?? `Act ${['I', 'II', 'III', 'IV'][act.n - 1]}`} <small>{act.title}</small>
          </h2>
          <ol>
            {cfg.episodes.filter((e) => e.act === act.n).map((e) => {
              const open = unlocked(save, e.n);
              return (
                <li key={e.n}>
                  <button className={`ep ${save.done[e.n] ?? ''} ${e.n === next ? 'next' : ''}`} disabled={!open} onClick={() => onPlay(e.n)}>
                    <span className="ep-num">{open ? e.n : '🔒'}</span>
                    <span className="info">
                      <b>{open ? e.title : '???'}</b>
                      <span>
                        {e.mins} min{save.done[e.n] === 'won' ? ' · done' : save.done[e.n] === 'skipped' ? ' · skipped' : ''}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <p className="reason-keys">{cfg.keys}</p>
    </div>
  );
}

function Finished({ cfg, n, prize, skipped, onClose, onNext }) {
  const ep = cfg.episodes[n - 1];
  return (
    <div className="reason-overlay">
      <div className="reason-card">
        <p className="kicker">{skipped ? 'Skipped' : `${cfg.unit} complete`}</p>
        <h2>
          {n}. {ep.title}
        </h2>
        {prize ? (
          <p className="prize">
            +{prize.coins} 🪙{prize.diamonds ? ` +${prize.diamonds} 💎` : ''}
          </p>
        ) : (
          !skipped && <p>Already paid out. Replays are just for fun.</p>
        )}
        <div className="row">
          <button className="pill ghost" onClick={onClose}>
            {cfg.unit}s
          </button>
          {n < cfg.episodes.length && (
            <button className="pill reason-btn" onClick={onNext} autoFocus>
              {cfg.unit} {n + 1} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- playing one episode ---------- */
function Play({ cfg, n, save, muted, onMute, onDone, onExit }) {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const game = useRef(null);
  const [ui, setUi] = useState({});
  const [paused, setPaused] = useState(false);
  const [touch, setTouch] = useState(false);
  const latest = useRef({ onDone });
  latest.current.onDone = onDone;

  useEffect(() => {
    const ep = cfg.episodes[n - 1];
    const flags = { coins: 0, ...save.flags, ...ep.start };
    const g = new Game(canvas.current, { flags, onUi: setUi, onPause: () => setPaused((p) => !p) });
    game.current = g;
    if (process.env.NODE_ENV !== 'production') window.__reason = g; // poke at it from devtools
    const fit = () => g.resize(wrap.current.clientWidth, wrap.current.clientHeight);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap.current);
    const player = new Bobby(flags);
    let alive = true;
    (async () => {
      await (ep.play ?? notYet)(g, player);
      if (alive) latest.current.onDone(n, g.flags);
    })();
    return () => {
      alive = false;
      ro.disconnect();
      g.destroy();
      stopAll();
    };
    // the save is read once when the episode starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  useEffect(() => {
    if (game.current) game.current.paused = paused;
  }, [paused]);

  useEffect(() => {
    setTouch(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  const g = game.current;
  const talk = ui.talk;
  const sp = talk ? SPEAKERS[talk.who] ?? { name: talk.who, color: '#fff' } : null;

  return (
    <div className="reason-play">
      <div className="reason-stage" ref={wrap}>
        <canvas ref={canvas} />
      </div>

      {/* the hearts live in the top-left corner, so the episode name sits bottom-right */}
      <header className="reason-top end">
        <button className="chip icon" aria-label="Sound on/off" onClick={onMute}>
          {muted ? '🔇' : '🔊'}
        </button>
      </header>

      {!talk && !ui.choice && (
        <div className={`reason-bottom ${touch ? 'touch' : ''}`}>
          <button className="chip icon" onClick={() => setPaused(true)} aria-label="Pause">
            ⏸
          </button>
          <span className="chip title">
            <b>{n}</b>
            <span>{cfg.episodes[n - 1].title}</span>
          </span>
        </div>
      )}

      {ui.objective && !talk && !ui.locked && <p className="reason-goal">{ui.objective}</p>}

      {ui.prompt && !talk && !ui.choice && (
        <button
          className="reason-prompt"
          onClick={() => {
            g?.input.press('act');
            g?.input.release('act');
          }}
        >
          <kbd>E</kbd> {ui.prompt}
        </button>
      )}

      {talk && (
        <button className={`reason-talk ${talk.who === 'sys' ? 'sys' : ''} ${talk.style ?? ''}`} onClick={() => g?.tap()} style={{ '--who': sp.color }}>
          {sp.name && <span className="name">{sp.name}</span>}
          <span className="line">{talk.text.slice(0, Math.floor(talk.shown))}</span>
          {talk.shown >= talk.text.length && !talk.noSkip && talk.auto == null && <span className="more">▸</span>}
        </button>
      )}

      {ui.choice && (
        <div className="reason-choice">
          {ui.choice.prompt && <p>{ui.choice.prompt}</p>}
          <div className={`opts ${ui.choice.options.length > 2 ? 'many' : ''}`}>
            {ui.choice.options.map((o, i) => (
              <button key={i} className={i === ui.choice.idx ? 'on' : ''} onClick={() => g?.pick(i)}>
                <span className="k">{i + 1}</span> {o}
              </button>
            ))}
          </div>
        </div>
      )}

      {ui.card && (
        <div className={`reason-titlecard ${ui.card.style}`} key={ui.card.n}>
          {ui.card.title && <h2>{ui.card.title}</h2>}
          {ui.card.sub && <p>{ui.card.sub}</p>}
        </div>
      )}

      {ui.button && (
        <button className={`reason-bigbtn ${ui.button.style ?? ''}`} onClick={() => g?.pressButton()}>
          {ui.button.label}
        </button>
      )}

      {touch && <Pad game={g} />}

      {paused && (
        <div className="reason-overlay">
          <div className="reason-card">
            <h2>Paused</h2>
            <div className="col">
              <button className="pill reason-btn" onClick={() => setPaused(false)} autoFocus>
                Resume
              </button>
              <button className="pill ghost" onClick={() => onDone(n, null, true)}>
                Skip this {cfg.unit.toLowerCase()}
              </button>
              <button className="pill ghost" onClick={onExit}>
                {cfg.unit}s
              </button>
            </div>
            <p className="reason-keys small">{cfg.keys}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// On phones: a d-pad on the left and action buttons on the right.
function Pad({ game }) {
  const bind = (a) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      initAudio();
      game?.input.press(a);
    },
    onPointerUp: () => game?.input.release(a),
    onPointerCancel: () => game?.input.release(a),
    onPointerLeave: () => game?.input.release(a),
  });
  return (
    <div className="reason-pad" onContextMenu={(e) => e.preventDefault()}>
      <div className="side">
        <button {...bind('left')}>◀</button>
        <button {...bind('down')}>▼</button>
        <button {...bind('up')} className="up">▲</button>
        <button {...bind('right')}>▶</button>
      </div>
      <div className="side">
        <button {...bind('special')} className="sm">Q</button>
        <button {...bind('dash')} className="sm">⇢</button>
        <button {...bind('attack')}>⚔</button>
        <button {...bind('jump')}>⤒</button>
      </div>
    </div>
  );
}

// Episodes that are not written yet just say so.
async function notYet(g) {
  g.fx.noHud = true;
  await g.card('Coming soon', 'This episode is still being written. Bobby is nervous about it.', 3.5, 'soft');
}
