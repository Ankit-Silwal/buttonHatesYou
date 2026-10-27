'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { startGame } from '@/game/story';
import { GOAL } from '@/game/core';
import { useEnergyGate } from '@/house/EnergyGate';

// Furniture in the button's home. x/y place it, tilt is how it sits once the
// house is ruined, fall is how it lands when the house collapses.
const DECOR = [
  { e: '🖼️', name: 'painting', x: '10%', y: '20%', tilt: -14, fall: -80, d: 0.1 },
  { e: '🕰️', name: 'clock', x: '82%', y: '18%', tilt: 10, fall: 120, d: 0 },
  { e: '', name: 'shelf', x: '58%', y: '34%', tilt: -8, fall: 6, d: 0.2, cls: 'shelf' },
  { e: '🕯️', name: 'candle', x: '60%', y: 'calc(34% - 42px)', tilt: 24, fall: -140, d: 0.05 },
  { e: '📚', name: 'books', x: '68%', y: 'calc(34% - 44px)', tilt: -30, fall: 200, d: 0.12 },
  { e: '🪴', name: 'plant', x: '6%', y: 'calc(80% - 64px)', tilt: -6, fall: -30, d: 0.3, cls: 'big' },
  { e: '🧸', name: 'teddy', x: '30%', y: 'calc(80% - 44px)', tilt: -20, fall: 95, d: 0.18 },
  { e: '🛋️', name: 'couch', x: '76%', y: 'calc(80% - 66px)', tilt: 5, fall: 15, d: 0.4, cls: 'big' },
];

const CRACKS = [
  'M18 0 L21 9 L17 15 L23 24 L20 31',
  'M66 0 L64 6 L69 11 L65 18 L70 22',
  'M100 38 L93 41 L95 47 L88 52 L90 58',
  'M0 58 L6 61 L4 67 L11 71',
  'M44 80 L46 74 L42 69 L48 63',
];

// Dust floating in the sunbeam: left, top (inside the beam) and drift delay.
const MOTES = [
  ['12%', '20%', '0s'],
  ['30%', '42%', '-3s'],
  ['46%', '64%', '-6s'],
  ['22%', '74%', '-1.5s'],
  ['56%', '30%', '-4.5s'],
  ['64%', '82%', '-7.5s'],
];

export default function Game() {
  const root = useRef(null);
  const gate = useEnergyGate('story'); // starting costs energy

  // The game itself is an imperative engine (lots of moving, chasing and
  // animating elements); React just renders the stage and starts it.
  useEffect(() => {
    if (gate.once()) return startGame(root.current); // too tired: shows a refusal instead
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={root} className="pd">
      <div id="app">
        <div id="room" aria-hidden="true">
          {/* the room's light and depth: wall, window, sunbeam, floor, rug */}
          <div className="pd-wall" />
          <div className="pd-hole" />
          <div className="pd-window">
            <i className="pd-sky" />
            <i className="pd-sun" />
          </div>
          <div className="pd-floor" />
          <div className="pd-rug" />
          <div className="pd-beam" />
          <div className="pd-motes">
            {MOTES.map((m, i) => (
              <i key={i} style={{ '--mx': m[0], '--my': m[1], '--md': m[2] }} />
            ))}
          </div>
          {DECOR.map((d, i) => (
            <span
              key={i}
              className={`decor ${d.cls ?? ''}`}
              data-name={d.name}
              style={{ '--x': d.x, '--y': d.y, '--tilt': `${d.tilt}deg`, '--fall': `${d.fall}deg`, '--d': `${d.d}s` }}
            >
              {d.e}
            </span>
          ))}
          <svg id="cracks" viewBox="0 0 100 100" preserveAspectRatio="none">
            {CRACKS.map((d) => <path key={'hl' + d} className="hl" d={d} />)}
            {CRACKS.map((d) => <path key={d} d={d} />)}
          </svg>
          <div id="dents" />
          <div id="graves" />
          <div id="puddle" />
          {/* evening and the final collapse fade in over everything */}
          <div className="pd-tint dusk" />
          <div className="pd-tint dark" />
          <div className="pd-dust" />
        </div>
        <div id="world" />
        <div id="arena" hidden />
      </div>

      <header id="hud">
        <span className="brand">please don&apos;t.</span>
        <div className="mid">
          <span id="counter">0 / {GOAL}</span>
          <div id="bossbar" hidden />
        </div>
        <div className="tools">
          <Link href="/games" title="All games" aria-label="All games">🎮</Link>
          <button id="skip" title="Skip ahead" aria-label="Skip ahead" hidden>⏩</button>
          <button id="skipAll" title="Skip the whole level" aria-label="Skip the whole level" hidden>⏭</button>
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
      {gate.refusal}
    </div>
  );
}
