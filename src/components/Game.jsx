'use client';

import { useEffect, useRef } from 'react';
import { startGame } from '@/game/story';

// Furniture in the button's home. x/y place it, tilt is how it sits once the
// house is ruined, fall is how it lands when the house collapses.
const DECOR = [
  { e: '🖼️', x: '10%', y: '20%', tilt: -14, fall: -80, d: 0.1 },
  { e: '🕰️', x: '82%', y: '18%', tilt: 10, fall: 120, d: 0 },
  { e: '', x: '58%', y: '34%', tilt: -8, fall: 6, d: 0.2, cls: 'shelf' },
  { e: '🕯️', x: '60%', y: 'calc(34% - 42px)', tilt: 24, fall: -140, d: 0.05 },
  { e: '📚', x: '68%', y: 'calc(34% - 44px)', tilt: -30, fall: 200, d: 0.12 },
  { e: '🪴', x: '6%', y: 'calc(80% - 64px)', tilt: -6, fall: -30, d: 0.3, cls: 'big' },
  { e: '🧸', x: '30%', y: 'calc(80% - 44px)', tilt: -20, fall: 95, d: 0.18 },
  { e: '🛋️', x: '76%', y: 'calc(80% - 66px)', tilt: 5, fall: 15, d: 0.4, cls: 'big' },
];

const CRACKS = [
  'M18 0 L21 9 L17 15 L23 24 L20 31',
  'M66 0 L64 6 L69 11 L65 18 L70 22',
  'M100 38 L93 41 L95 47 L88 52 L90 58',
  'M0 58 L6 61 L4 67 L11 71',
  'M44 80 L46 74 L42 69 L48 63',
];

export default function Game() {
  const root = useRef(null);

  // The game itself is an imperative engine (lots of moving, chasing and
  // animating elements); React just renders the stage and starts it.
  useEffect(() => startGame(root.current), []);

  return (
    <div ref={root}>
      <div id="app">
        <div id="room" aria-hidden="true">
          {DECOR.map((d, i) => (
            <span
              key={i}
              className={`decor ${d.cls ?? ''}`}
              style={{ '--x': d.x, '--y': d.y, '--tilt': `${d.tilt}deg`, '--fall': `${d.fall}deg`, '--d': `${d.d}s` }}
            >
              {d.e}
            </span>
          ))}
          <svg id="cracks" viewBox="0 0 100 100" preserveAspectRatio="none">
            {CRACKS.map((d) => <path key={d} pathLength="100" d={d} />)}
          </svg>
          <div id="graves" />
          <div id="puddle" />
        </div>
        <div id="world" />
        <div id="arena" hidden />
      </div>

      <header id="hud">
        <span className="brand">please don&apos;t.</span>
        <div className="mid">
          <span id="counter">0 / 75</span>
          <div id="bossbar" hidden />
        </div>
        <div className="tools">
          <button id="mute" title="Sound on/off" aria-label="Toggle sound">🔊</button>
          <button id="restart" title="Start over" aria-label="Start over">↺</button>
        </div>
      </header>

      <p id="line" aria-live="polite" />
      <div id="loadbar" hidden>
        <div className="track"><div className="fill" /></div>
        <span>Preparing your ultimate reward…</span>
      </div>
      <button id="again" className="pill" hidden>Play again</button>
      <div id="overlay" hidden />
    </div>
  );
}
