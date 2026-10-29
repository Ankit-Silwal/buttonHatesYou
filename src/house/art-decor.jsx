'use client';

import { useEffect, useState } from 'react';
import { Lin, Rad, Shadow, Gloss } from './svg';
import './decor-art.css';

// The rooms' built-in pieces and the bookshelves, clocks and decor that go
// with them (merged into ART by art-more.jsx). The built-in ones are the
// props the rooms used to draw themselves (they were in hub/scene-art.jsx),
// drawn exactly as they were so a fresh room looks the same; the rest are
// drawn like the other house art: soft gradients, light from the top left,
// a contact shadow under floor pieces.
//
// Clocks show the real time. The time is only read after mounting (null
// until then, so the server and the first client render agree) and again
// every `every` ms.

function useNow(every = 30_000) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), every);
    return () => clearInterval(t);
  }, [every]);
  return now;
}

// Clock hands around (cx, cy). `hour` and `min` are [length, width, color];
// `sec` adds a seconds hand that ticks.
function Hands({ cx, cy, hour, min, sec, pin = '#e2674f', pinR = 2.6 }) {
  const now = useNow(sec ? 1000 : 30_000);
  const m = now ? now.getMinutes() + now.getSeconds() / 60 : 0;
  const h = now ? (now.getHours() % 12) + m / 60 : 0;
  const hand = ([len, w, c], deg, back = 0) => (
    <line x1={cx} y1={cy + back} x2={cx} y2={cy - len} stroke={c} strokeWidth={w} strokeLinecap="round" transform={`rotate(${deg} ${cx} ${cy})`} />
  );
  return (
    <g className="hands">
      {hand(hour, h * 30)}
      {hand(min, m * 6)}
      {sec && hand(sec, (now ? now.getSeconds() : 0) * 6, sec[0] * 0.22)}
      <circle cx={cx} cy={cy} r={pinR} fill={pin} />
    </g>
  );
}

// "13:07" in seven-segment LEDs.
const SEGS = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abfgcd' };
function Digit({ x, y, n, on, off }) {
  const lit = SEGS[n] ?? '';
  const w = 10;
  const h = 9;
  const t = 2.4;
  const seg = {
    a: [x + 1.5, y, w - 3, t],
    g: [x + 1.5, y + h, w - 3, t],
    d: [x + 1.5, y + 2 * h, w - 3, t],
    f: [x, y + 1.5, t, h - 1.5],
    b: [x + w - t, y + 1.5, t, h - 1.5],
    e: [x, y + h + 1.5, t, h - 1.5],
    c: [x + w - t, y + h + 1.5, t, h - 1.5],
  };
  return Object.entries(seg).map(([k, [sx, sy, sw, sh]]) => <rect key={k} x={sx} y={sy} width={sw} height={sh} rx="1.1" fill={lit.includes(k) ? on : off} />);
}
function LedTime({ x, y, on, off }) {
  const now = useNow(10_000);
  const hh = now ? String(now.getHours()).padStart(2, '0') : '12';
  const mm = now ? String(now.getMinutes()).padStart(2, '0') : '00';
  return (
    <g>
      <Digit x={x} y={y} n={hh[0]} on={on} off={off} />
      <Digit x={x + 13} y={y} n={hh[1]} on={on} off={off} />
      <g className="led-colon" fill={on}>
        <circle cx={x + 28.5} cy={y + 6} r="1.6" />
        <circle cx={x + 28.5} cy={y + 14} r="1.6" />
      </g>
      <Digit x={x + 33} y={y} n={mm[0]} on={on} off={off} />
      <Digit x={x + 46} y={y} n={mm[1]} on={on} off={off} />
    </g>
  );
}

// A row of books standing on a shelf at `y`, from x0 to at most x1.
const SPINES = ['#c44d3a', '#3f7fbf', '#e3b23c', '#5d9b6a', '#8a5aa8', '#d97a4a', '#2f5d7c', '#b33f5f', '#6f8f3f', '#e08f3c', '#4a6fa5', '#c9a227'];
function Books({ x0, x1, y, seed = 0, hMin = 18, hVar = 8, wMin = 5, wVar = 4, lean = true }) {
  const out = [];
  let x = x0;
  for (let i = 0; x < x1 - wMin; i++) {
    const k = i * 7 + seed * 3;
    const w = Math.min(x1 - x, wMin + (k % (wVar + 1)));
    const h = hMin + ((k * 5 + seed) % (hVar + 1));
    const c = SPINES[(i + seed * 5) % SPINES.length];
    const tilt = lean && i === 3 + (seed % 3) && x + w + 6 < x1;
    out.push(
      <g key={i} transform={tilt ? `rotate(12 ${x + w} ${y})` : undefined}>
        <rect x={x} y={y - h} width={w} height={h} rx="1" fill={c} />
        <rect x={x} y={y - h} width={w * 0.32} height={h} rx="1" fill="#fff" opacity="0.2" />
        <rect x={x + 0.8} y={y - h + 3} width={w - 1.6} height="1.6" fill="#fff" opacity="0.45" />
        <rect x={x + 0.8} y={y - 5} width={w - 1.6} height="1.2" fill="#000" opacity="0.18" />
      </g>
    );
    x += w + (tilt ? 4 : 0.8);
  }
  return out;
}

export const DECOR_ART = {
  /* ------------- built in: the living room ------------- */
  'frame-meadow': {
    w: 10.5,
    builtin: true,
    vb: '0 0 80 64',
    draw: () => (
      <>
        <rect x="2" y="2" width="76" height="60" rx="5" fill="#b8854f" />
        <rect x="2" y="2" width="76" height="60" rx="5" fill="none" stroke="#8f6335" strokeWidth="2" />
        <rect x="8" y="8" width="64" height="48" rx="2" fill="#fbeed3" />
        <rect x="8" y="8" width="64" height="30" fill="#ffd9a0" />
        <circle cx="52" cy="24" r="8" fill="#ff9a63" />
        <path d="M8 56 V40 l16 -14 14 12 12 -16 22 20 V56z" fill="#7aa580" />
        <path d="M8 56 V46 l18 -8 16 8 12 -6 18 8 V56z" fill="#5d8b6a" />
      </>
    ),
  },
  'clock-oak': {
    w: 7.1,
    builtin: true,
    vb: '0 0 60 60',
    draw: () => (
      <>
        <circle cx="30" cy="30" r="27" fill="#b8854f" />
        <circle cx="30" cy="30" r="22" fill="#fff8ea" />
        {[0, 90, 180, 270].map((a) => (
          <rect key={a} x="29" y="10" width="2" height="5" rx="1" fill="#8a6f5e" transform={`rotate(${a} 30 30)`} />
        ))}
        <Hands cx={30} cy={30} hour={[13, 3, '#4a3428']} min={[19, 2, '#4a3428']} />
      </>
    ),
  },
  'shelf-trinkets': {
    w: 16.2,
    builtin: true,
    vb: '0 0 120 64',
    draw: () => (
      <>
        <rect x="0" y="52" width="120" height="8" rx="3" fill="#b8854f" />
        <rect x="6" y="56" width="108" height="4" rx="2" fill="#8f6335" opacity=".5" />
        <rect x="8" y="22" width="12" height="30" rx="2" fill="#e2674f" />
        <rect x="21" y="14" width="10" height="38" rx="2" fill="#6f9a6e" />
        <rect x="32" y="26" width="13" height="26" rx="2" fill="#f0c36d" />
        <rect x="46" y="20" width="9" height="32" rx="2" fill="#7a8fd0" transform="rotate(8 50 52)" />
        <path d="M78 52 V46 q-9 -2 -9 -12 h24 q0 10 -9 12 V52z" fill="#f0c36d" />
        <path d="M69 36 q-8 0 -6 8 q2 3 7 2 M93 36 q8 0 6 8 q-2 3 -7 2" fill="none" stroke="#f0c36d" strokeWidth="2.4" />
        <rect x="72" y="50" width="18" height="3" rx="1" fill="#b8854f" />
        <circle cx="106" cy="38" r="9" fill="#fffaf2" />
        <path d="M99 40 q7 8 14 0" fill="none" stroke="#e2674f" strokeWidth="2" strokeLinecap="round" />
        <circle cx="103" cy="35" r="1.4" fill="#4a3428" />
        <circle cx="109" cy="35" r="1.4" fill="#4a3428" />
      </>
    ),
  },
  'plant-leafy': {
    w: 8.9,
    builtin: true,
    vb: '0 0 80 120',
    draw: () => (
      <>
        <path d="M40 78 C 20 66 8 40 18 10 C 34 28 40 52 40 78z" fill="#5f9a62" />
        <path d="M40 78 C 60 62 74 36 62 6 C 46 26 40 50 40 78z" fill="#7bb67a" />
        <path d="M40 80 C 34 56 38 34 42 12 C 50 36 48 60 40 80z" fill="#4c8754" />
        <path d="M40 78 L40 24" stroke="#3d7447" strokeWidth="1.5" fill="none" />
        <path d="M14 82 h52 l-7 34 a6 6 0 0 1 -6 4 h-26 a6 6 0 0 1 -6 -4z" fill="#d9774f" />
        <rect x="10" y="76" width="60" height="10" rx="5" fill="#e98c63" />
        <path d="M18 90 h44" stroke="#fff" strokeOpacity=".18" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  },
  'lamp-floor': {
    w: 5,
    builtin: true,
    vb: '0 0 50 150',
    draw: () => (
      <>
        <path d="M10 6 h30 l8 30 h-46z" fill="#ffd98f" />
        <path d="M14 8 l-4 26" stroke="#fff" strokeOpacity=".5" strokeWidth="4" strokeLinecap="round" />
        <rect x="23" y="36" width="4" height="102" fill="#7a4f2b" />
        <ellipse cx="25" cy="140" rx="17" ry="6" fill="#7a4f2b" />
      </>
    ),
  },
  'sofa-teal': {
    w: 22.2,
    builtin: true,
    vb: '0 0 220 110',
    draw: () => (
      <>
        <rect x="14" y="28" width="192" height="58" rx="22" fill="#4f8f9a" />
        <rect x="0" y="52" width="40" height="52" rx="16" fill="#3e7a85" />
        <rect x="180" y="52" width="40" height="52" rx="16" fill="#3e7a85" />
        <rect x="34" y="52" width="152" height="40" rx="14" fill="#6bb0b9" />
        <path d="M110 54 V90" stroke="#4f8f9a" strokeWidth="3" />
        <rect x="40" y="98" width="10" height="10" rx="3" fill="#7a4f2b" />
        <rect x="170" y="98" width="10" height="10" rx="3" fill="#7a4f2b" />
        <rect x="58" y="40" width="34" height="30" rx="9" fill="#f0c36d" transform="rotate(-10 75 55)" />
        <path d="M64 50 l22 -6 M62 58 l22 -6" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
      </>
    ),
  },

  /* ------------- built in: the kitchen ------------- */
  'shelf-jars': {
    w: 13.6,
    builtin: true,
    vb: '0 0 120 64',
    draw: () => (
      <>
        <rect x="0" y="52" width="120" height="8" rx="3" fill="#b8854f" />
        <rect x="6" y="56" width="108" height="4" rx="2" fill="#8f6335" opacity=".5" />
        <rect x="10" y="26" width="18" height="26" rx="4" fill="#fffaf2" stroke="#d8bc98" strokeWidth="1.5" />
        <rect x="9" y="22" width="20" height="6" rx="3" fill="#e2674f" />
        <rect x="34" y="20" width="18" height="32" rx="4" fill="#f4e0b0" stroke="#d8bc98" strokeWidth="1.5" />
        <rect x="33" y="16" width="20" height="6" rx="3" fill="#6f9a6e" />
        <rect x="58" y="30" width="16" height="22" rx="4" fill="#fffaf2" stroke="#d8bc98" strokeWidth="1.5" />
        <rect x="57" y="26" width="18" height="6" rx="3" fill="#7a8fd0" />
        <path d="M88 52 v-14 h20 v14z" fill="#d9774f" />
        <path d="M96 38 q-6 -10 -2 -18 q4 8 4 18 q6 -12 14 -14 q-4 8 -8 14z" fill="#5f9a62" />
      </>
    ),
  },
  'pendant-red': {
    w: 6.8,
    builtin: true,
    vb: '0 0 60 120',
    draw: () => (
      <>
        <rect x="29" y="0" width="2" height="62" fill="#4a3428" />
        <path d="M8 90 Q10 62 30 60 Q50 62 52 90z" fill="#e2674f" />
        <path d="M14 84 Q16 68 28 64" stroke="#fff" strokeOpacity=".5" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="6" y="88" width="48" height="5" rx="2.5" fill="#b84a36" />
        <ellipse className="bulb-lit" cx="30" cy="98" rx="9" ry="7" fill="#fff4cf" />
      </>
    ),
  },
  'table-bistro': {
    w: 26.6,
    builtin: true,
    vb: '0 0 150 110',
    draw: () => (
      <>
        <ellipse cx="75" cy="102" rx="64" ry="6" fill="#2a1608" opacity=".18" />
        <rect x="22" y="76" width="22" height="6" rx="3" fill="#e2674f" />
        <rect x="30" y="82" width="5" height="22" rx="2" fill="#7a4f2b" />
        <rect x="106" y="76" width="22" height="6" rx="3" fill="#e2674f" />
        <rect x="114" y="82" width="5" height="22" rx="2" fill="#7a4f2b" />
        <rect x="70" y="46" width="8" height="56" rx="3" fill="#7a4f2b" />
        <ellipse cx="75" cy="102" rx="22" ry="4" fill="#7a4f2b" />
        <ellipse cx="75" cy="46" rx="58" ry="12" fill="#c58a55" />
        <ellipse cx="75" cy="43" rx="58" ry="12" fill="#e2b783" />
        <path d="M20 43 a55 10 0 0 1 110 0 a55 10 0 0 1 -110 0z" fill="#fffaf2" opacity=".5" />
        <path d="M47 38 l8 -3 8 3 -8 3z M87 40 l8 -3 8 3 -8 3z" fill="#e2674f" opacity=".55" />
        <path d="M68 34 q0 -10 7 -10 q7 0 7 10z" fill="#f0c36d" />
        <circle cx="75" cy="22" r="3.4" fill="#e2674f" />
      </>
    ),
  },

  /* ------------- built in: the bedroom ------------- */
  'lights-twinkle': {
    w: 85,
    builtin: true,
    vb: '0 0 400 44',
    par: 'none', // stretched along the ceiling
    draw: () => (
      <>
        <path d="M0 4 Q50 36 100 8 T200 8 T300 8 T400 4" fill="none" stroke="#2d2a4a" strokeWidth="1.6" />
        {[[24, 20], [62, 25], [100, 8], [140, 20], [178, 17], [220, 14], [258, 24], [300, 8], [340, 21], [378, 12]].map(([x, y], i) => (
          <g key={i} className="bulb" style={{ animationDelay: `${i * 0.35}s` }}>
            <circle cx={x} cy={y + 5} r="9" fill="#ffd36b" opacity=".22" />
            <circle cx={x} cy={y + 5} r="3.6" fill={['#ffd36b', '#ff9a8a', '#ffe9a8', '#9fd8ff'][i % 4]} />
          </g>
        ))}
      </>
    ),
  },
  'poster-moon': {
    w: 13.6,
    builtin: true,
    vb: '0 0 80 100',
    draw: () => (
      <>
        <rect x="2" y="2" width="76" height="96" rx="4" fill="#f4eee0" />
        <rect x="8" y="8" width="64" height="84" rx="2" fill="#26307a" />
        <circle cx="52" cy="30" r="12" fill="#fdf6d8" />
        <circle cx="57" cy="27" r="11" fill="#26307a" />
        <path d="M8 92 V68 l16 -16 12 12 14 -22 22 28 V92z" fill="#3f4fa8" />
        <path d="M8 92 V78 l18 -10 16 10 12 -8 18 8 V92z" fill="#2c3a8a" />
        {[[18, 18], [30, 40], [40, 14], [20, 52], [64, 54]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.3" fill="#fff" />
        ))}
      </>
    ),
  },
  'wardrobe-plum': {
    w: 18.2,
    builtin: true,
    vb: '0 0 100 190',
    draw: () => (
      <>
        <ellipse cx="50" cy="184" rx="44" ry="5" fill="#0a0820" opacity=".3" />
        <rect x="6" y="6" width="88" height="172" rx="6" fill="#7a5a98" />
        <rect x="6" y="6" width="88" height="14" rx="6" fill="#5f4380" />
        <rect x="12" y="26" width="36" height="146" rx="3" fill="#8f6fb0" />
        <rect x="52" y="26" width="36" height="146" rx="3" fill="#8f6fb0" />
        <rect x="18" y="34" width="24" height="64" rx="2" fill="#c9d8ff" opacity=".45" />
        <path d="M22 40 l8 -2" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
        <rect x="42" y="92" width="3" height="18" rx="1.5" fill="#f3d48c" />
        <rect x="55" y="92" width="3" height="18" rx="1.5" fill="#f3d48c" />
        <path d="M58 120 h24 v10 h-24z M58 138 h24 v10 h-24z" fill="#6f4f8d" />
        <rect x="14" y="178" width="10" height="8" rx="2" fill="#4a3428" />
        <rect x="76" y="178" width="10" height="8" rx="2" fill="#4a3428" />
      </>
    ),
  },

  /* ------------- bookshelves ------------- */
  'shelf-floating': {
    w: 14,
    vb: '0 0 120 104',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('board')} stops={[[0, '#d9a774'], [1, '#9c6a3e']]} />
          <Lin id={u('pot')} x2={1} y2={0} stops={[[0, '#fbf7ef'], [1, '#cfc6b6']]} />
          <Rad id={u('vase')} cx={0.35} cy={0.3} r={0.8} stops={[[0, '#9fd4cf'], [1, '#4f8f8a']]} />
        </defs>
        {/* top shelf: books and a little cactus */}
        <rect x="6" y="32" width="64" height="6" rx="2" fill="#000" opacity="0.12" transform="translate(2 3)" />
        <Books x0={10} x1={48} y={30} seed={1} hMin={16} hVar={6} />
        <path d="M54 30 h12 l-1.5 -9 h-9z" fill={f('pot')} />
        <path d="M60 21 v-10 a3 3 0 0 1 6 0 v4 M60 17 h-3 v-4" stroke="#5aa865" strokeWidth="4" strokeLinecap="round" fill="none" />
        <rect x="6" y="30" width="64" height="5" rx="2" fill={f('board')} />
        <rect x="6" y="30" width="64" height="1.6" rx="0.8" fill="#fff" opacity="0.35" />
        {/* middle shelf, offset right: a vase and a stack lying down */}
        <rect x="44" y="64" width="70" height="6" rx="2" fill="#000" opacity="0.12" transform="translate(2 3)" />
        <path d="M54 62 q-6 -4 -6 -12 q0 -8 6 -10 v-5 h8 v5 q6 2 6 10 q0 8 -6 12z" fill={f('vase')} />
        <path d="M53 44 q-2 6 0 12" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M58 35 q-4 -10 -10 -12 M58 35 q2 -12 8 -16 M58 35 q6 -6 12 -6" stroke="#6f9a6e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <circle cx="48" cy="23" r="2.6" fill="#f2c14e" />
        <circle cx="66" cy="19" r="2.6" fill="#ff9a8a" />
        <circle cx="70" cy="29" r="2.4" fill="#fff4cf" />
        {['#3f7fbf', '#e3b23c', '#c44d3a'].map((c, i) => (
          <g key={c}>
            <rect x={76 + i * 1.5} y={56 - i * 6} width={26 - i * 3} height="6" rx="1" fill={c} />
            <rect x={76 + i * 1.5} y={56 - i * 6} width={26 - i * 3} height="1.6" rx="0.8" fill="#fff" opacity="0.35" />
          </g>
        ))}
        <Books x0={102} x1={112} y={62} seed={4} hMin={16} hVar={4} lean={false} />
        <circle cx="86" cy="40" r="4" fill="#fffaf2" />
        <circle cx="86" cy="40" r="2" fill="#e2674f" />
        <rect x="44" y="62" width="70" height="5" rx="2" fill={f('board')} />
        <rect x="44" y="62" width="70" height="1.6" rx="0.8" fill="#fff" opacity="0.35" />
        {/* bottom shelf: books held up by a bookend */}
        <rect x="10" y="96" width="66" height="6" rx="2" fill="#000" opacity="0.12" transform="translate(2 3)" />
        <Books x0={14} x1={56} y={94} seed={7} hMin={18} hVar={7} />
        <path d="M60 94 v-14 h4 v10 h8 v4z" fill="#3a2a20" />
        <circle cx="68" cy="84" r="5" fill="#e2674f" />
        <circle cx="66.5" cy="82.5" r="1.6" fill="#fff" opacity="0.5" />
        <rect x="10" y="94" width="66" height="5" rx="2" fill={f('board')} />
        <rect x="10" y="94" width="66" height="1.6" rx="0.8" fill="#fff" opacity="0.35" />
      </>
    ),
  },
  'shelf-ladder': {
    w: 13,
    vb: '0 0 100 180',
    draw: (u, f) => {
      // four boards, wider towards the floor, between two leaning rails
      const boards = [[40, 30], [78, 36], [116, 42], [154, 48]]; // [y, half-width]
      return (
        <>
          <defs>
            <Lin id={u('rail')} x2={1} y2={0} stops={[[0, '#c99566'], [1, '#86552f']]} />
            <Lin id={u('board')} stops={[[0, '#e0b07e'], [1, '#a77345']]} />
            <Lin id={u('basket')} stops={[[0, '#e8cf9c'], [1, '#b8915a']]} />
            <Lin id={u('pot')} x2={1} y2={0} stops={[[0, '#fbf7ef'], [1, '#cfc6b6']]} />
          </defs>
          <Shadow u={u} f={f} cx={50} cy={174} rx={46} ry={5} />
          {/* on the boards (drawn before the front rails) */}
          <Books x0={26} x1={64} y={40} seed={2} hMin={15} hVar={6} />
          <path d="M66 40 h10 l-1.5 -8 h-7z" fill={f('pot')} />
          <path d="M71 32 q-8 -6 -6 -14 q5 4 6 14 q2 -10 9 -12 q-1 8 -9 12" fill="#5aa865" />
          <path d="M20 78 q2 -18 16 -18 q14 0 16 18z" fill="#8fbfae" />
          <path d="M26 72 q4 -8 10 -8" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" fill="none" strokeLinecap="round" />
          <Books x0={56} x1={82} y={78} seed={5} hMin={14} hVar={5} lean={false} />
          <Books x0={14} x1={60} y={116} seed={8} hMin={19} hVar={7} />
          <path d="M64 116 q-2 -16 14 -16 q14 0 12 16z" fill="#e8dcc6" />
          <circle cx="76" cy="106" r="4" fill="#3f7fbf" opacity="0.55" />
          <rect x="14" y="134" width="38" height="20" rx="3" fill={f('basket')} />
          <path d="M14 140 h38 M14 146 h38" stroke="#9c7a45" strokeWidth="1.2" opacity="0.6" />
          <path d="M20 134 q13 -10 26 0" stroke="#9c7a45" strokeWidth="2" fill="none" />
          <path d="M60 154 v-16 q0 -6 6 -6 h12 q6 0 6 6 v16z" fill="#d9774f" />
          <path d="M64 136 h16" stroke="#fff" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
          {boards.map(([y, hw]) => (
            <g key={y}>
              <rect x={50 - hw} y={y} width={hw * 2} height="5" rx="1.5" fill={f('board')} />
              <rect x={50 - hw} y={y} width={hw * 2} height="1.5" rx="0.75" fill="#fff" opacity="0.35" />
              <rect x={50 - hw} y={y + 5} width={hw * 2} height="2" fill="#000" opacity="0.12" />
            </g>
          ))}
          {/* the rails, leaning out towards the floor */}
          <path d="M22 6 L6 172 h7 L28 6z" fill={f('rail')} />
          <path d="M72 6 L87 172 h7 L78 6z" fill={f('rail')} />
          <path d="M23.5 8 L9 170" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.4" />
          <path d="M73.5 8 L88.5 170" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.4" />
        </>
      );
    },
  },
  'shelf-cube': {
    w: 19,
    vb: '0 0 130 130',
    draw: (u, f) => {
      const cells = [
        [12, 26], [48, 26], [84, 26],
        [12, 70], [48, 70], [84, 70],
      ];
      return (
        <>
          <defs>
            <Lin id={u('frame')} x2={1} y2={1} stops={[[0, '#f7f2ea'], [1, '#d3c8b6']]} />
            <Lin id={u('back')} stops={[[0, '#e6dccb'], [1, '#cdbfa8']]} />
            <Lin id={u('binA')} stops={[[0, '#8fbfae'], [1, '#5d8c7c']]} />
            <Lin id={u('binB')} stops={[[0, '#f0a58a'], [1, '#c96a4c']]} />
            <Lin id={u('pot')} x2={1} y2={0} stops={[[0, '#e98c63'], [1, '#b85a36']]} />
            <Gloss id={u('gl')} />
          </defs>
          <Shadow u={u} f={f} cx={65} cy={124} rx={62} ry={5} />
          <rect x="6" y="20" width="118" height="100" rx="4" fill={f('frame')} />
          {cells.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="34" height="40" rx="1.5" fill={f('back')} />
          ))}
          {/* top left: books; top middle: a bin; top right: books and a ball */}
          <Books x0={14} x1={45} y={66} seed={3} hMin={24} hVar={8} />
          <rect x="51" y="40" width="28" height="26" rx="3" fill={f('binA')} />
          <rect x="59" y="45" width="12" height="4" rx="2" fill="#2f4f45" opacity="0.5" />
          <Books x0={86} x1={106} y={66} seed={9} hMin={22} hVar={6} lean={false} />
          <circle cx="111" cy="60" r="6" fill="#f2c14e" />
          <path d="M106 58 q5 -4 10 0" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" fill="none" />
          {/* bottom: a bin, books lying down, a framed photo */}
          <rect x="15" y="84" width="28" height="26" rx="3" fill={f('binB')} />
          <rect x="23" y="89" width="12" height="4" rx="2" fill="#6a2c18" opacity="0.4" />
          {[['#3f7fbf', 0], ['#e3b23c', 1], ['#8a5aa8', 2], ['#5d9b6a', 3]].map(([c, i]) => (
            <rect key={i} x={52 + (i % 2) * 2} y={104 - i * 6} width={26 - (i % 2) * 3} height="6" rx="1" fill={c} />
          ))}
          <rect x="89" y="84" width="24" height="26" rx="2" fill="#3a2a20" />
          <rect x="92" y="87" width="18" height="20" rx="1" fill="#ffd9a0" />
          <circle cx="101" cy="95" r="4" fill="#e2674f" />
          <path d="M92 107 l6 -6 4 3 8 -7 v10z" fill="#6f9a6e" />
          {/* a plant on top */}
          <path d="M92 20 h22 l-3 -12 h-16z" fill={f('pot')} />
          <path d="M103 8 c-10 -2 -16 -10 -14 -18 c8 2 12 8 14 18 c0 -10 6 -18 14 -20 c2 8 -4 16 -14 20" fill="#5f9a62" />
          <path d="M103 8 c-2 -6 0 -12 2 -16" stroke="#3d7447" strokeWidth="1.2" fill="none" />
          <rect x="20" y="12" width="40" height="8" rx="1.5" fill="#c44d3a" />
          <rect x="22" y="5" width="34" height="7" rx="1.5" fill="#2f5d7c" />
          <rect x="6" y="20" width="118" height="100" rx="4" fill={f('gl')} opacity="0.25" />
          <rect x="10" y="120" width="8" height="4" rx="1" fill="#8a7b66" />
          <rect x="112" y="120" width="8" height="4" rx="1" fill="#8a7b66" />
        </>
      );
    },
  },
  'bookcase-library': {
    w: 25,
    vb: '0 0 160 210',
    draw: (u, f) => {
      const rows = [52, 94, 136, 178];
      return (
        <>
          <defs>
            <Lin id={u('wood')} x2={1} y2={0} stops={[[0, '#8a5a36'], [0.5, '#6b4226'], [1, '#4e2f1a']]} />
            <Lin id={u('back')} stops={[[0, '#3b2414'], [1, '#2a180c']]} />
            <Lin id={u('crown')} stops={[[0, '#a8724a'], [1, '#6d4428']]} />
            <Lin id={u('brass')} x2={1} y2={1} stops={[[0, '#ffe3a0'], [1, '#b8862f']]} />
            <Rad id={u('lamp')} cx={0.5} cy={0.4} r={0.6} stops={[[0, '#fff4cf'], [1, '#f0b44c']]} />
          </defs>
          <Shadow u={u} f={f} cx={80} cy={204} rx={78} ry={6} />
          <rect x="6" y="14" width="148" height="188" rx="3" fill={f('wood')} />
          <path d="M0 6 h160 v10 h-160z" fill={f('crown')} />
          <rect x="0" y="6" width="160" height="2.5" fill="#fff" opacity="0.25" />
          <path d="M3 16 h154 l-3 4 h-148z" fill="#5a3820" />
          {[14, 82].map((x) => (
            <rect key={x} x={x} y="22" width="64" height="172" fill={f('back')} />
          ))}
          {rows.map((y, r) => (
            <g key={y}>
              <Books x0={16} x1={r === 1 ? 58 : 76} y={y} seed={r * 2} hMin={26} hVar={9} />
              <Books x0={r === 2 ? 106 : 84} x1={144} y={y} seed={r * 2 + 5} hMin={26} hVar={9} />
              <rect x="12" y={y} width="136" height="5" fill="#7a4d2c" />
              <rect x="12" y={y} width="136" height="1.4" fill="#fff" opacity="0.2" />
            </g>
          ))}
          {/* a little globe and a reading lamp among the books */}
          <circle cx="68" cy="83" r="9" fill="#5b8fd6" />
          <path d="M62 80 q4 -4 8 -1 q3 4 -2 6 q-4 1 -6 -5" fill="#6fae6d" />
          <path d="M68 74 a9 9 0 0 1 0 18" stroke={f('brass')} strokeWidth="1.6" fill="none" />
          <rect x="64" y="92" width="8" height="2" fill={f('brass')} />
          <path d="M84 136 v-12 l8 -14" stroke={f('brass')} strokeWidth="2" fill="none" />
          <path d="M86 112 l12 -6 4 8 -12 6z" fill={f('lamp')} />
          <rect x="80" y="134" width="12" height="2.5" rx="1" fill={f('brass')} />
          <rect x="76" y="22" width="6" height="172" fill="#5a3820" />
          <rect x="6" y="194" width="148" height="8" fill="#4e2f1a" />
          <path d="M10 22 v170" stroke="#fff" strokeOpacity="0.14" strokeWidth="2" />
          {/* the rolling ladder */}
          <rect x="4" y="8" width="152" height="2" fill={f('brass')} />
          <path d="M118 10 L104 200 M136 10 L124 200" stroke="#c99566" strokeWidth="4" strokeLinecap="round" />
          {[40, 70, 100, 130, 160, 188].map((y) => {
            const t = (y - 10) / 190;
            return <path key={y} d={`M${118 - t * 14} ${y} H${136 - t * 12}`} stroke="#b07f50" strokeWidth="3" strokeLinecap="round" />;
          })}
          <circle cx="104" cy="200" r="3" fill="#3a2a20" />
          <circle cx="124" cy="200" r="3" fill="#3a2a20" />
        </>
      );
    },
  },

  /* ------------- clocks ------------- */
  'clock-digital': {
    w: 12,
    glow: { x: 50, y: 48, r: 24, c: '#ff5a5a' },
    vb: '0 0 110 56',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('case')} stops={[[0, '#3b3f4a'], [1, '#1d2027']]} />
          <Lin id={u('scr')} stops={[[0, '#160b0d'], [1, '#2a1216']]} />
          <Gloss id={u('gl')} />
        </defs>
        <rect x="4" y="6" width="102" height="44" rx="11" fill="#000" opacity="0.18" transform="translate(2 3)" />
        <rect x="4" y="6" width="102" height="44" rx="11" fill={f('case')} />
        <rect x="10" y="11" width="90" height="34" rx="7" fill={f('scr')} />
        <LedTime x={24} y={17} on="#ff5a5a" off="#3a1a1e" />
        <circle cx="94" cy="17" r="1.6" fill="#7cd6ff" />
        <text x="91" y="41" fontSize="5" fontWeight="700" fill="#ff5a5a" opacity="0.7" fontFamily="system-ui, sans-serif">
          ON
        </text>
        <path d="M14 14 q30 -4 60 0 v6 q-30 -4 -60 0z" fill={f('gl')} opacity="0.5" />
        <rect x="26" y="50" width="10" height="3" rx="1.5" fill="#1d2027" />
        <rect x="74" y="50" width="10" height="3" rx="1.5" fill="#1d2027" />
      </>
    ),
  },
  'clock-sunburst': {
    w: 12.5,
    vb: '0 0 120 120',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('gold')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#ffe7a3'], [0.5, '#e8b54a'], [1, '#9c6a1e']]} />
          <Rad id={u('face')} cx={0.4} cy={0.35} r={0.75} stops={[[0, '#fffdf6'], [1, '#efe3c8']]} />
        </defs>
        <circle cx="62" cy="63" r="29" fill="#000" opacity="0.15" />
        {Array.from({ length: 24 }, (_, i) => (
          <g key={i} transform={`rotate(${i * 15} 60 60)`}>
            <path d={i % 2 ? 'M60 60 L58 14 L60 10 L62 14z' : 'M60 60 L57.5 6 L60 2 L62.5 6z'} fill={f('gold')} />
            {i % 2 === 0 && <circle cx="60" cy="5" r="2.6" fill={f('gold')} />}
          </g>
        ))}
        <circle cx="60" cy="60" r="27" fill={f('gold')} />
        <circle cx="60" cy="60" r="22" fill={f('face')} />
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} cx="60" cy="42" r={i % 3 ? 0.9 : 1.6} fill="#8a6224" transform={`rotate(${i * 30} 60 60)`} />
        ))}
        <Hands cx={60} cy={60} hour={[10, 2.6, '#3a2a20']} min={[16, 1.8, '#3a2a20']} sec={[17, 0.8, '#e2674f']} pin="#b8862f" pinR={2.2} />
        <path d="M44 48 q6 -10 16 -12" stroke="#fff" strokeOpacity="0.8" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  'clock-cuckoo': {
    w: 10.5,
    vb: '0 0 90 170',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('wood')} x2={1} y2={0} stops={[[0, '#a8724a'], [1, '#6d4428']]} />
          <Lin id={u('roof')} stops={[[0, '#7a4d2c'], [1, '#4e2f1a']]} />
          <Rad id={u('face')} cx={0.4} cy={0.35} r={0.75} stops={[[0, '#fffdf6'], [1, '#ead9bb']]} />
          <Lin id={u('cone')} stops={[[0, '#b8862f'], [1, '#6d4a14']]} />
        </defs>
        {/* chains and pine-cone weights, then the pendulum, behind the house */}
        <path d="M34 92 V138 M56 92 V124" stroke="#b8862f" strokeWidth="1.2" strokeDasharray="2 1.4" />
        <path d="M30 138 h8 l-1 14 q-3 5 -6 0z" fill={f('cone')} />
        <path d="M52 124 h8 l-1 14 q-3 5 -6 0z" fill={f('cone')} />
        <g className="cuckoo-pend">
          <path d="M45 92 V140" stroke="#6d4428" strokeWidth="2" />
          <circle cx="45" cy="144" r="7" fill="#e6b422" />
          <path d="M45 144 m-4 -2 l2.6 -2.6 l2.6 2.6 l-2.6 2.6z" fill="#fff" opacity="0.35" />
          <circle cx="42.5" cy="141.5" r="2" fill="#fff" opacity="0.4" />
        </g>
        <rect x="14" y="40" width="62" height="54" rx="2" fill="#000" opacity="0.15" transform="translate(2 3)" />
        <rect x="14" y="40" width="62" height="54" rx="2" fill={f('wood')} />
        {/* the roof and its carved leaves */}
        <path d="M45 6 L88 44 L80 48 L45 18 L10 48 L2 44z" fill={f('roof')} />
        <path d="M45 6 L88 44" stroke="#fff" strokeOpacity="0.2" strokeWidth="1.5" />
        <path d="M45 18 L80 48 V40 H10 V48z" fill="#5a3820" />
        {/* the little door, and the bird who comes out */}
        <rect x="38" y="24" width="14" height="14" rx="7" fill="#2a180c" />
        <g className="cuckoo-bird">
          <ellipse cx="45" cy="32" rx="6" ry="4.6" fill="#f2c14e" />
          <circle cx="49" cy="29" r="3.4" fill="#f2c14e" />
          <path d="M52 29 l4 1 -4 1.4z" fill="#e2674f" />
          <circle cx="50" cy="28.2" r="0.9" fill="#3a2a20" />
          <path d="M41 32 q3 2 6 0" stroke="#c99a2e" strokeWidth="1.2" fill="none" />
        </g>
        <g className="cuckoo-door">
          <path d="M38 31 a7 7 0 0 1 7 -7 v14 h-7z" fill="#8a5a36" />
          <path d="M52 31 a7 7 0 0 0 -7 -7 v14 h7z" fill="#7a4d2c" />
        </g>
        <circle cx="45" cy="66" r="18" fill={f('face')} />
        <circle cx="45" cy="66" r="18" fill="none" stroke="#e6b422" strokeWidth="2" />
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x="44.4" y="50.5" width="1.2" height={i % 3 ? 2 : 3.6} rx="0.6" fill="#5a3820" transform={`rotate(${i * 30} 45 66)`} />
        ))}
        <Hands cx={45} cy={66} hour={[8.5, 2.2, '#2a180c']} min={[13, 1.5, '#2a180c']} pin="#b8862f" pinR={1.8} />
        {/* carved leaves at the bottom corners */}
        <path d="M14 94 q-8 -2 -10 -10 q8 0 12 6z M76 94 q8 -2 10 -10 q-8 0 -12 6z" fill="#5d9b6a" />
        <path d="M14 94 q-4 4 -12 2 q4 -6 12 -4z M76 94 q4 4 12 2 q-4 -6 -12 -4z" fill="#4c8754" />
        <path d="M18 44 v46" stroke="#fff" strokeOpacity="0.2" strokeWidth="2" />
      </>
    ),
  },
  'clock-grandfather': {
    w: 11,
    vb: '0 0 76 210',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('wood')} x2={1} y2={0} stops={[[0, '#9a6640'], [0.55, '#6e4428'], [1, '#4e2f1a']]} />
          <Lin id={u('glass')} x2={1} y2={1} stops={[[0, '#2a1a12'], [1, '#160d08']]} />
          <Rad id={u('face')} cx={0.4} cy={0.35} r={0.75} stops={[[0, '#fffdf6'], [1, '#eadcc0']]} />
          <Lin id={u('brass')} x2={1} y2={1} stops={[[0, '#ffe3a0'], [1, '#b8862f']]} />
          <Gloss id={u('gl')} />
        </defs>
        <Shadow u={u} f={f} cx={38} cy={204} rx={34} ry={5} />
        {/* hood with a curved top */}
        <path d="M8 62 V22 q0 -16 30 -18 q30 2 30 18 V62z" fill={f('wood')} />
        <circle cx="38" cy="6" r="4" fill={f('brass')} />
        <circle cx="38" cy="36" r="21" fill={f('brass')} />
        <circle cx="38" cy="36" r="18" fill={f('face')} />
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x="37.4" y="20" width="1.2" height={i % 3 ? 2 : 3.6} rx="0.6" fill="#4e2f1a" transform={`rotate(${i * 30} 38 36)`} />
        ))}
        <Hands cx={38} cy={36} hour={[8.5, 2.2, '#2a180c']} min={[13.5, 1.5, '#2a180c']} pin="#b8862f" pinR={1.8} />
        <path d="M24 26 q5 -8 14 -9" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* the trunk with its window and the pendulum */}
        <rect x="4" y="60" width="68" height="6" rx="2" fill="#5a3820" />
        <rect x="12" y="66" width="52" height="112" fill={f('wood')} />
        <rect x="20" y="74" width="36" height="92" rx="16" fill={f('glass')} />
        <g className="gf-pend">
          <path d="M38 66 V146" stroke={f('brass')} strokeWidth="2" />
          <circle cx="38" cy="150" r="9" fill={f('brass')} />
          <circle cx="35" cy="147" r="3" fill="#fff" opacity="0.45" />
        </g>
        <path d="M30 82 V110 M46 82 V100" stroke="#b8862f" strokeWidth="1" strokeDasharray="2 1.4" opacity="0.8" />
        <rect x="27" y="110" width="6" height="12" rx="2" fill={f('brass')} />
        <rect x="43" y="100" width="6" height="12" rx="2" fill={f('brass')} />
        <rect x="20" y="74" width="36" height="92" rx="16" fill={f('gl')} opacity="0.35" />
        <path d="M24 84 q2 30 0 70" stroke="#fff" strokeOpacity="0.25" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* base */}
        <rect x="6" y="178" width="64" height="20" rx="2" fill={f('wood')} />
        <rect x="4" y="176" width="68" height="4" rx="2" fill="#5a3820" />
        <rect x="8" y="196" width="10" height="6" rx="1.5" fill="#3a2414" />
        <rect x="58" y="196" width="10" height="6" rx="1.5" fill="#3a2414" />
        <path d="M14 70 v104" stroke="#fff" strokeOpacity="0.16" strokeWidth="2" />
      </>
    ),
  },

  /* ------------- lamps, plants, rugs, wall art ------------- */
  'lamp-mushroom': {
    w: 7,
    glow: { x: 50, y: 34, r: 34, c: '#ffcf7a' },
    vb: '0 0 70 92',
    draw: (u, f) => (
      <>
        <defs>
          <Rad id={u('cap')} cx={0.4} cy={0.3} r={0.8} stops={[[0, '#fff1c9'], [0.55, '#ffc37a'], [1, '#e8894a']]} />
          <Lin id={u('stem')} x2={1} y2={0} stops={[[0, '#fbf3e3'], [1, '#d6c6a8']]} />
          <Lin id={u('base')} stops={[[0, '#8a5a36'], [1, '#5a3820']]} />
        </defs>
        <Shadow u={u} f={f} cx={35} cy={87} rx={24} ry={4} />
        <path d="M27 50 q-2 18 -4 30 h24 q-2 -12 -4 -30z" fill={f('stem')} />
        <path d="M30 54 q-1 12 -3 24" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="35" cy="84" rx="19" ry="5" fill={f('base')} />
        <path d="M4 50 q0 -40 31 -42 q31 2 31 42 q-31 8 -62 0z" fill={f('cap')} />
        {[[20, 24, 4], [42, 18, 3.4], [52, 34, 3], [30, 38, 2.6], [12, 40, 2.2]].map(([x, y, r]) => (
          <circle key={x} cx={x} cy={y} r={r} fill="#fffaf0" opacity="0.8" />
        ))}
        <path d="M12 34 q6 -18 20 -22" stroke="#fff" strokeOpacity="0.7" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M6 50 q29 7 58 0" stroke="#c96a3a" strokeOpacity="0.5" strokeWidth="1.5" fill="none" />
      </>
    ),
  },
  'plant-fiddle': {
    w: 12,
    vb: '0 0 100 190',
    draw: (u, f) => {
      // big violin-shaped leaves along a slender trunk
      const leaves = [
        [50, 22, -10, 1.1], [34, 38, -48, 1], [66, 40, 40, 1.05], [30, 62, -62, 0.95], [70, 66, 58, 1],
        [40, 86, -40, 0.9], [62, 92, 34, 0.9], [48, 50, 6, 1], [36, 108, -70, 0.8], [64, 112, 66, 0.8],
      ];
      return (
        <>
          <defs>
            <Lin id={u('leafA')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#7fbf6e'], [1, '#3f7a45']]} />
            <Lin id={u('leafB')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#6aab62'], [1, '#2f6538']]} />
            <Lin id={u('basket')} stops={[[0, '#ead2a0'], [1, '#b48c55']]} />
          </defs>
          <Shadow u={u} f={f} cx={50} cy={184} rx={30} ry={5} />
          <path d="M50 150 C 49 120 52 90 48 40" stroke="#6d4428" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M49 120 L36 108 M51 104 L62 92 M49 84 L40 86 M50 70 L70 66" stroke="#6d4428" strokeWidth="2" strokeLinecap="round" />
          {leaves.map(([x, y, rot, s], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
              <path d="M0 14 C -12 10 -13 -2 -8 -6 C -12 -12 -6 -20 0 -20 C 6 -20 12 -12 8 -6 C 13 -2 12 10 0 14z" fill={f(i % 2 ? 'leafB' : 'leafA')} />
              <path d="M0 13 V-18" stroke="#2f5d33" strokeWidth="1" opacity="0.6" />
              <path d="M-6 -12 q2 -5 6 -6" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </g>
          ))}
          <path d="M24 148 h52 l-6 34 q-1 3 -4 3 h-32 q-3 0 -4 -3z" fill={f('basket')} />
          {[156, 164, 172].map((y) => (
            <path key={y} d={`M${25 + (y - 148) * 0.17} ${y} H${75 - (y - 148) * 0.17}`} stroke="#9c7a45" strokeWidth="1.3" opacity="0.6" />
          ))}
          <rect x="21" y="144" width="58" height="7" rx="3.5" fill="#d9bb84" />
          <path d="M30 154 v26" stroke="#fff" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    },
  },
  'rug-boho': {
    w: 44,
    vb: '0 0 300 84',
    draw: (u, f) => (
      <>
        <defs>
          <Rad id={u('base')} cx={0.45} cy={0.4} r={0.6} stops={[[0, '#f8ead0'], [1, '#e6cfa6']]} />
        </defs>
        {/* tassels at both ends */}
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i} stroke="#d9bf8f" strokeWidth="1.6" strokeLinecap="round">
            <path d={`M12 ${26 + i * 4} h-9`} />
            <path d={`M288 ${26 + i * 4} h9`} />
          </g>
        ))}
        <ellipse cx="152" cy="46" rx="142" ry="34" fill="#000" opacity="0.12" />
        <rect x="10" y="10" width="280" height="64" rx="10" fill={f('base')} />
        <rect x="18" y="17" width="264" height="50" rx="6" fill="none" stroke="#c96a4c" strokeWidth="3" />
        <rect x="26" y="24" width="248" height="36" rx="4" fill="none" stroke="#5d8c7c" strokeWidth="1.6" strokeDasharray="6 4" />
        {[60, 110, 150, 190, 240].map((x, i) => (
          <path key={x} d={`M${x} 42 l${i === 2 ? 16 : 11} -12 l${i === 2 ? 16 : 11} 12 l-${i === 2 ? 16 : 11} 12z`} transform={`translate(-${i === 2 ? 16 : 11} 0)`} fill={i === 2 ? '#c96a4c' : i % 2 ? '#e3b23c' : '#5d8c7c'} opacity="0.9" />
        ))}
        <path d="M150 34 l6 8 -6 8 -6 -8z" fill="#f8ead0" />
        {[36, 264].map((x) => (
          <path key={x} d={`M${x} 30 v24 M${x - 6} 36 l6 -6 6 6 M${x - 6} 48 l6 6 6 -6`} stroke="#8a5a36" strokeWidth="1.6" fill="none" />
        ))}
        <rect x="10" y="10" width="280" height="64" rx="10" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.5" />
      </>
    ),
  },
  'art-abstract': {
    w: 13,
    vb: '0 0 110 90',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('canvas')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#fffaf0'], [1, '#efe5d2']]} />
          <Lin id={u('frame')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#4a3a30'], [1, '#221812']]} />
          <Rad id={u('sun')} cx={0.4} cy={0.35} r={0.7} stops={[[0, '#ffd37a'], [1, '#e8954a']]} />
        </defs>
        <rect x="5" y="5" width="100" height="80" rx="2" fill="#000" opacity="0.18" transform="translate(2 3)" />
        <rect x="5" y="5" width="100" height="80" rx="2" fill={f('frame')} />
        <rect x="10" y="10" width="90" height="70" fill={f('canvas')} />
        <path d="M10 80 V56 q20 -22 44 -8 q18 10 46 -10 V80z" fill="#5d8c7c" />
        <circle cx="72" cy="34" r="14" fill={f('sun')} />
        <path d="M20 22 h28 a14 14 0 0 1 0 28 h-28z" fill="#e2674f" opacity="0.9" />
        <rect x="58" y="54" width="22" height="22" fill="#2f5d7c" opacity="0.85" transform="rotate(12 69 65)" />
        <path d="M14 66 q30 -6 52 4" stroke="#3a2a20" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="30" cy="62" r="3" fill="#3a2a20" />
        <path d="M86 16 l6 6 M92 16 l-6 6" stroke="#3a2a20" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M10 10 L40 10 L10 34z" fill="#fff" opacity="0.18" />
      </>
    ),
  },
};
