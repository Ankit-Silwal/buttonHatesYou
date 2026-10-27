'use client';

import { useId } from 'react';

// Pictures of everything in the house and the fridge, as SVG with soft
// gradients and shadows (light comes from the top left). Keyed by the item
// ids in src/economy/house.js. `w` is how wide a piece is in the room, in
// percent of the room's width.
//
// Gradient ids must be unique on the page (the same piece can be in the room
// and in the shop at once), so each drawing gets `u(name)` for an id and
// `f(name)` for a url(#id) reference, both prefixed per instance.

const Lin = ({ id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1 }) => (
  <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
    {stops.map(([o, c, op = 1], i) => (
      <stop key={i} offset={o} stopColor={c} stopOpacity={op} />
    ))}
  </linearGradient>
);
const Rad = ({ id, stops, cx = 0.5, cy = 0.5, r = 0.5, fx, fy }) => (
  <radialGradient id={id} cx={cx} cy={cy} r={r} fx={fx ?? cx} fy={fy ?? cy}>
    {stops.map(([o, c, op = 1], i) => (
      <stop key={i} offset={o} stopColor={c} stopOpacity={op} />
    ))}
  </radialGradient>
);
// A soft contact shadow on the floor.
const Shadow = ({ u, f, cx, cy, rx, ry, o = 0.35 }) => (
  <>
    <Rad id={u('sh')} stops={[[0, '#2a1608', o], [0.6, '#2a1608', o * 0.4], [1, '#2a1608', 0]]} />
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={f('sh')} />
  </>
);
const Gloss = ({ id }) => <Lin id={id} stops={[[0, '#fff', 0.55], [0.5, '#fff', 0.08], [1, '#fff', 0]]} />;

export const ART = {
  /* ---------------- beds ---------------- */
  'bed-basic': {
    w: 36,
    vb: '0 0 200 92',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('m')} stops={[[0, '#f3efe6'], [1, '#d9d0bf']]} />
          <Lin id={u('side')} stops={[[0, '#cfc4b0'], [1, '#a99c86']]} />
          <Lin id={u('bl')} stops={[[0, '#9fb0c8'], [1, '#6f81a0']]} />
          <Rad id={u('pil')} cx={0.4} cy={0.35} r={0.7} stops={[[0, '#ffffff'], [1, '#dcd6ca']]} />
          <pattern id={u('tick')} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="transparent" />
            <rect width="3" height="10" fill="#b9c6d8" opacity="0.45" />
          </pattern>
        </defs>
        <Shadow u={u} f={f} cx={100} cy={84} rx={98} ry={9} />
        <rect x="6" y="52" width="188" height="30" rx="10" fill={f('side')} />
        <rect x="6" y="44" width="188" height="26" rx="12" fill={f('m')} />
        <rect x="6" y="44" width="188" height="26" rx="12" fill={f('tick')} />
        <path d="M10 70 h180" stroke="#8f826e" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.6" />
        <path d="M18 38 q2 -14 22 -14 h26 q16 0 16 12 q0 12 -14 12 h-32 q-18 0 -18 -10z" fill={f('pil')} />
        <path d="M30 32 q10 4 20 0" stroke="#c8c0b0" strokeWidth="1.5" fill="none" />
        <path d="M92 42 q30 -10 60 -4 q30 6 38 10 l0 16 q-50 8 -100 0z" fill={f('bl')} />
        <path d="M104 50 q24 -6 50 2 M120 58 q20 -4 40 2" stroke="#56688a" strokeWidth="1.6" fill="none" opacity="0.6" />
      </>
    ),
  },
  'bed-cozy': {
    w: 38,
    vb: '0 0 220 130',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('wood')} stops={[[0, '#a8724a'], [1, '#6d4428']]} />
          <Lin id={u('woodL')} x2={1} y2={0} stops={[[0, '#c08a5c'], [1, '#8a5a36']]} />
          <Lin id={u('sheet')} stops={[[0, '#fffdf8'], [1, '#e7e0d3']]} />
          <Lin id={u('quilt')} stops={[[0, '#e98a6c'], [1, '#c25d44']]} />
          <Rad id={u('pil')} cx={0.4} cy={0.3} r={0.75} stops={[[0, '#ffffff'], [1, '#e6dfd2']]} />
          <pattern id={u('q')} width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="18" height="18" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.2" strokeDasharray="3 3" />
          </pattern>
          <Gloss id={u('gl')} />
        </defs>
        <Shadow u={u} f={f} cx={112} cy={124} rx={110} ry={8} />
        <path d="M8 120 V36 q0 -30 34 -30 h4 q34 0 34 30 V120z" fill={f('woodL')} />
        <path d="M18 116 V40 q0 -22 26 -22 q26 0 26 22 V116z" fill="#5d3920" opacity="0.25" />
        <path d="M14 30 q4 -18 30 -20" stroke="#e2b38a" strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" />
        <rect x="8" y="88" width="206" height="22" rx="6" fill={f('wood')} />
        <rect x="200" y="70" width="14" height="52" rx="5" fill={f('wood')} />
        <rect x="12" y="108" width="10" height="14" rx="2" fill="#5a3820" />
        <rect x="196" y="108" width="10" height="14" rx="2" fill="#5a3820" />
        <rect x="20" y="66" width="180" height="26" rx="10" fill={f('sheet')} />
        <path d="M28 64 q0 -20 22 -20 h22 q20 0 20 14 q0 10 -14 12 h-36 q-14 0 -14 -6z" fill={f('pil')} />
        <path d="M70 70 q60 -14 132 -4 v26 h-132z" fill={f('quilt')} />
        <path d="M70 70 q60 -14 132 -4 v26 h-132z" fill={f('q')} />
        <path d="M70 70 q60 -14 132 -4 v6 q-70 -8 -132 6z" fill={f('gl')} />
        <path d="M70 92 h132" stroke="#8f3a28" strokeWidth="2" opacity="0.5" />
      </>
    ),
  },
  'bed-cloud': {
    w: 38,
    vb: '0 0 220 130',
    draw: (u, f) => (
      <>
        <defs>
          <Rad id={u('c')} cx={0.4} cy={0.3} r={0.75} stops={[[0, '#ffffff'], [0.7, '#eae6ff'], [1, '#c9c0f2']]} />
          <Rad id={u('glow')} stops={[[0, '#c6b8ff', 0.7], [1, '#c6b8ff', 0]]} />
          <Lin id={u('blank')} stops={[[0, '#b9a8f5'], [1, '#8b74e0']]} />
        </defs>
        <ellipse cx="110" cy="96" rx="112" ry="40" fill={f('glow')} />
        <g fill={f('c')}>
          <circle cx="40" cy="72" r="30" />
          <circle cx="80" cy="60" r="36" />
          <circle cx="130" cy="62" r="34" />
          <circle cx="176" cy="74" r="30" />
          <rect x="16" y="70" width="190" height="40" rx="20" />
        </g>
        <path d="M20 96 q90 18 184 0" stroke="#b6a9ec" strokeWidth="3" fill="none" opacity="0.6" />
        <path d="M100 80 q50 -14 100 -2 q8 14 -4 26 q-50 8 -96 0z" fill={f('blank')} opacity="0.9" />
        <g fill="#fff6b0">
          <path d="M60 22 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
          <path d="M170 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
          <path d="M116 12 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z" />
        </g>
      </>
    ),
  },

  /* ---------------- lights ---------------- */
  'lamp-arc': {
    w: 15,
    glow: { x: 26, y: 26, r: 40, c: '#ffd58a' },
    vb: '0 0 90 230',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('brass')} x2={1} y2={0} stops={[[0, '#f3d48c'], [0.5, '#b88a3a'], [1, '#7a5520']]} />
          <Lin id={u('shade')} stops={[[0, '#3e4a44'], [1, '#1f2723']]} />
          <Rad id={u('bulb')} cx={0.5} cy={0.2} r={0.8} stops={[[0, '#fffbe8'], [0.4, '#ffe2a0'], [1, '#ffbf5a', 0]]} />
          <Rad id={u('marble')} cx={0.35} cy={0.3} r={0.8} stops={[[0, '#ffffff'], [1, '#c9c4bc']]} />
        </defs>
        <Shadow u={u} f={f} cx={66} cy={224} rx={24} ry={5} />
        <path d="M66 218 C66 120 60 40 22 30" stroke={f('brass')} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <ellipse cx="22" cy="58" rx="22" ry="22" fill={f('bulb')} />
        <path d="M2 40 q20 -30 40 0 z" fill={f('shade')} />
        <path d="M6 36 q16 -20 32 0" stroke="#7d8c84" strokeWidth="1.5" fill="none" opacity="0.6" />
        <ellipse cx="22" cy="40" rx="20" ry="4" fill="#ffe7b0" />
        <ellipse cx="66" cy="218" rx="20" ry="7" fill={f('marble')} />
        <path d="M46 218 v4 q20 8 40 0 v-4" fill="#b3aca2" />
      </>
    ),
  },
  'lamp-lava': {
    w: 7,
    glow: { x: 50, y: 45, r: 30, c: '#ff7a52' },
    vb: '0 0 50 140',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('metal')} x2={1} y2={0} stops={[[0, '#d9dde4'], [0.45, '#8b93a1'], [1, '#4b5260']]} />
          <Lin id={u('liq')} stops={[[0, '#ffb35c'], [1, '#e2412f']]} />
          <Lin id={u('glass')} x2={1} y2={0} stops={[[0, '#fff', 0.4], [0.3, '#fff', 0.05], [1, '#fff', 0]]} />
          <clipPath id={u('clip')}>
            <path d="M16 22 h18 l8 66 h-34z" />
          </clipPath>
        </defs>
        <Shadow u={u} f={f} cx={25} cy={135} rx={18} ry={4} />
        <path d="M18 8 h14 l3 14 h-20z" fill={f('metal')} />
        <path d="M16 22 h18 l8 66 h-34z" fill={f('liq')} />
        <g clipPath={`url(#${u('clip')})`} fill="#ffe08a">
          <ellipse className="lava b1" cx="22" cy="70" rx="7" ry="9" />
          <ellipse className="lava b2" cx="30" cy="50" rx="5" ry="7" />
          <ellipse className="lava b3" cx="24" cy="34" rx="4" ry="5" />
        </g>
        <path d="M16 22 h18 l8 66 h-34z" fill={f('glass')} />
        <path d="M8 88 h34 l-6 44 h-22z" fill={f('metal')} />
        <path d="M10 92 h30" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.5" />
      </>
    ),
  },
  'lamp-pendant': {
    w: 11,
    glow: { x: 50, y: 92, r: 46, c: '#ffd88f' },
    vb: '0 0 80 150',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('shade')} x2={1} y2={0} stops={[[0, '#3f7a63'], [0.5, '#2a5a48'], [1, '#173a2e']]} />
          <Rad id={u('bulb')} cx={0.5} cy={0.3} r={0.7} stops={[[0, '#fffdf0'], [0.5, '#ffe6a6'], [1, '#ffcf6b', 0]]} />
          <Gloss id={u('gl')} />
        </defs>
        <path d="M40 0 V96" stroke="#2b2b2b" strokeWidth="1.6" />
        <rect x="35" y="88" width="10" height="14" rx="2" fill="#b88a3a" />
        <ellipse cx="40" cy="130" rx="16" ry="14" fill={f('bulb')} />
        <path d="M8 130 Q10 98 40 98 Q70 98 72 130z" fill={f('shade')} />
        <path d="M16 124 Q20 104 40 102" stroke="#fff" strokeOpacity="0.35" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <ellipse cx="40" cy="130" rx="32" ry="4" fill="#ffefc4" />
      </>
    ),
  },
  'lights-fairy': {
    w: 100,
    glow: null,
    vb: '0 0 400 50',
    draw: () => {
      const bulbs = [];
      const cols = ['#ffd46b', '#ff8fa3', '#8fd3ff', '#b6f28c', '#ffd46b', '#c9a2ff'];
      for (let i = 0; i < 17; i++) {
        const x = 12 + i * 23.5;
        const t = x / 400;
        const y = 6 + Math.sin(t * Math.PI * 3) ** 2 * 26;
        bulbs.push({ x, y, c: cols[i % cols.length], d: (i % 5) * 0.4 });
      }
      const path = bulbs.map((b, i) => `${i ? 'L' : 'M'}${b.x} ${b.y - 4}`).join(' ');
      return (
        <>
          <path d={`M0 2 ${path} L400 2`} stroke="#3c3a35" strokeWidth="1.2" fill="none" />
          {bulbs.map((b, i) => (
            <g key={i} className="twinkle" style={{ animationDelay: `${b.d}s` }}>
              <circle cx={b.x} cy={b.y + 3} r="9" fill={b.c} opacity="0.25" />
              <rect x={b.x - 1.8} y={b.y - 4} width="3.6" height="3" fill="#5b5a52" />
              <ellipse cx={b.x} cy={b.y + 3} rx="3.4" ry="4.6" fill={b.c} />
              <ellipse cx={b.x - 1} cy={b.y + 1.6} rx="1" ry="1.6" fill="#fff" opacity="0.8" />
            </g>
          ))}
        </>
      );
    },
  },
  'disco-ball': {
    w: 11,
    glow: { x: 50, y: 72, r: 40, c: '#cfd8ff' },
    vb: '0 0 80 130',
    draw: (u, f) => (
      <>
        <defs>
          <Rad id={u('ball')} cx={0.35} cy={0.3} r={0.75} stops={[[0, '#ffffff'], [0.35, '#c9d0de'], [0.8, '#6b7488'], [1, '#3b4152']]} />
          <clipPath id={u('clip')}>
            <circle cx="40" cy="88" r="30" />
          </clipPath>
        </defs>
        <path d="M40 0 V58" stroke="#8d8d8d" strokeWidth="1.4" />
        <rect x="36" y="54" width="8" height="5" rx="1.5" fill="#a9a9a9" />
        <circle cx="40" cy="88" r="30" fill={f('ball')} />
        <g clipPath={`url(#${u('clip')})`} className="disco-facets">
          {Array.from({ length: 9 }, (_, i) => (
            <path key={'h' + i} d={`M0 ${60 + i * 7} H80`} stroke="#2e3340" strokeOpacity="0.35" strokeWidth="0.8" />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <path key={'v' + i} d={`M${40 + (i - 6) * 7} 56 Q${40 + (i - 6) * 9} 88 ${40 + (i - 6) * 7} 120`} stroke="#2e3340" strokeOpacity="0.35" strokeWidth="0.8" fill="none" />
          ))}
          <rect x="22" y="70" width="6" height="5" fill="#fff" opacity="0.9" />
          <rect x="29" y="63" width="6" height="5" fill="#fff" opacity="0.7" />
          <rect x="50" y="98" width="6" height="5" fill="#bfe4ff" opacity="0.7" />
          <rect x="36" y="105" width="6" height="5" fill="#ffd1f0" opacity="0.6" />
        </g>
        <path className="sparkle" d="M22 66 l1.6 4.4 4.4 1.6 -4.4 1.6 -1.6 4.4 -1.6 -4.4 -4.4 -1.6 4.4 -1.6z" fill="#fff" />
      </>
    ),
  },

  /* ---------------- plants and things on the floor ---------------- */
  'plant-monstera': {
    w: 14,
    vb: '0 0 120 180',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('pot')} x2={1} y2={0} stops={[[0, '#ffffff'], [0.6, '#e4e0d8'], [1, '#b9b3a8']]} />
          <Lin id={u('leaf')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#6fbf73'], [1, '#2f7a45']]} />
          <Lin id={u('leaf2')} x1={1} y1={0} x2={0} y2={1} stops={[[0, '#5aa865'], [1, '#235f36']]} />
        </defs>
        <Shadow u={u} f={f} cx={60} cy={174} rx={36} ry={6} />
        <g stroke="#3f7b45" strokeWidth="2.4" fill="none" strokeLinecap="round">
          <path d="M58 130 Q50 90 24 62" />
          <path d="M60 130 Q64 80 86 48" />
          <path d="M60 130 Q60 70 56 30" />
          <path d="M62 130 Q80 100 104 92" />
        </g>
        <path d="M24 62 C0 60 -2 88 14 100 C28 96 40 84 24 62z M12 76 l8 4 M10 86 l10 2" fill={f('leaf2')} stroke="#1f4f2c" strokeWidth="0.8" />
        <path d="M86 48 C112 40 120 70 106 86 C92 86 78 72 86 48z" fill={f('leaf')} />
        <path d="M56 30 C30 18 26 50 44 64 C60 66 72 50 56 30z" fill={f('leaf')} />
        <path d="M104 92 C118 96 118 116 104 120 C94 114 92 100 104 92z" fill={f('leaf2')} />
        <g stroke="#1f5a30" strokeWidth="1.2" opacity="0.7" fill="none">
          <path d="M86 48 L102 78 M56 30 L46 60 M24 62 L14 96" />
        </g>
        <g fill="#f5f0e6" opacity="0.9">
          <ellipse cx="98" cy="62" rx="3" ry="6" transform="rotate(30 98 62)" />
          <ellipse cx="46" cy="44" rx="3" ry="6" transform="rotate(-20 46 44)" />
        </g>
        <path d="M30 128 h60 l-8 46 h-44z" fill={f('pot')} />
        <rect x="27" y="124" width="66" height="10" rx="4" fill="#f4f1ea" />
        <path d="M38 140 l3 30" stroke="#fff" strokeWidth="3" opacity="0.7" strokeLinecap="round" />
      </>
    ),
  },
  'plant-cactus': {
    w: 8,
    vb: '0 0 70 120',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('pot')} x2={1} y2={0} stops={[[0, '#e58a5e'], [1, '#a64f2e']]} />
          <Lin id={u('c')} x2={1} y2={0} stops={[[0, '#8fd38a'], [0.6, '#4f9e57'], [1, '#2f6e3a']]} />
        </defs>
        <Shadow u={u} f={f} cx={35} cy={115} rx={24} ry={4} />
        <path d="M14 56 q-12 0 -12 -14 v-10 q0 -6 6 -6 q6 0 6 6 v8 q0 4 4 4z" fill={f('c')} />
        <path d="M54 48 q12 0 12 -12 v-6 q0 -6 -6 -6 q-6 0 -6 6 v6 q0 2 -4 2z" fill={f('c')} />
        <rect x="20" y="16" width="30" height="66" rx="15" fill={f('c')} />
        <g fill="#fff8d8">
          {[[24, 30], [44, 30], [26, 52], [46, 50], [34, 66], [24, 72], [46, 70], [6, 36], [62, 30]].map(([x, y], i) => (
            <path key={i} d={`M${x} ${y} l2 -3 M${x} ${y} l-2 -3`} stroke="#fff8d8" strokeWidth="1" />
          ))}
        </g>
        <path d="M27 34 l6 2 M43 34 l-6 2" stroke="#1d3a20" strokeWidth="2" strokeLinecap="round" />
        <circle cx="30" cy="40" r="1.8" fill="#1d3a20" />
        <circle cx="40" cy="40" r="1.8" fill="#1d3a20" />
        <path d="M31 48 q4 -3 8 0" stroke="#1d3a20" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <g fill="#ff7aa8">
          <circle cx="35" cy="14" r="5" />
          <circle cx="35" cy="14" r="2" fill="#ffe36b" />
        </g>
        <path d="M14 82 h42 l-5 32 h-32z" fill={f('pot')} />
        <rect x="12" y="78" width="46" height="8" rx="3" fill="#ef9c70" />
      </>
    ),
  },
  'fish-bowl': {
    w: 11,
    vb: '0 0 100 130',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('wood')} stops={[[0, '#b07a4c'], [1, '#6e4628']]} />
          <Lin id={u('water')} stops={[[0, '#9fe0ff', 0.75], [1, '#2f8fc9', 0.85]]} />
          <Rad id={u('glass')} cx={0.35} cy={0.3} r={0.7} stops={[[0, '#ffffff', 0.5], [0.5, '#ffffff', 0.05], [1, '#bfe8ff', 0.3]]} />
          <clipPath id={u('clip')}>
            <circle cx="50" cy="52" r="34" />
          </clipPath>
        </defs>
        <Shadow u={u} f={f} cx={50} cy={126} rx={34} ry={5} />
        <rect x="22" y="84" width="56" height="8" rx="3" fill={f('wood')} />
        <path d="M28 92 l-4 32 M72 92 l4 32 M50 92 v32" stroke="#6e4628" strokeWidth="4" strokeLinecap="round" />
        <g clipPath={`url(#${u('clip')})`}>
          <rect x="10" y="30" width="80" height="60" fill={f('water')} />
          <g fill="#d8c8a8">
            <circle cx="34" cy="84" r="5" fill="#e4d6b8" />
            <circle cx="44" cy="86" r="5" fill="#c9b48e" />
            <circle cx="56" cy="85" r="6" fill="#efe3c8" />
            <circle cx="68" cy="83" r="5" fill="#b8a07a" />
          </g>
          <path d="M62 82 q-4 -14 2 -26 q-8 12 -6 26z" fill="#3f9a55" />
          <g className="fish">
            <path d="M38 54 q10 -10 20 0 q-10 10 -20 0z" fill="#ff8a3d" />
            <path d="M38 54 l-8 -6 v12z" fill="#ff6a2a" />
            <circle cx="52" cy="52" r="1.6" fill="#1a1a1a" />
            <path d="M44 50 q4 -2 6 0" stroke="#ffd2a8" strokeWidth="1.2" fill="none" />
          </g>
          <circle className="bubble" cx="58" cy="44" r="1.8" fill="none" stroke="#fff" strokeWidth="0.8" />
        </g>
        <path d="M50 30 m-34 6 a36 36 0 1 0 68 0" fill="none" />
        <circle cx="50" cy="52" r="34" fill={f('glass')} stroke="#d8f1ff" strokeOpacity="0.8" strokeWidth="1.4" />
        <ellipse cx="50" cy="20" rx="18" ry="3.5" fill="none" stroke="#e8f7ff" strokeWidth="2" />
        <path d="M26 40 q4 -10 14 -14" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
      </>
    ),
  },
  beanbag: {
    w: 20,
    vb: '0 0 160 110',
    draw: (u, f) => (
      <>
        <defs>
          <Rad id={u('b')} cx={0.38} cy={0.3} r={0.8} stops={[[0, '#ffb1a0'], [0.55, '#e0654c'], [1, '#9c3524']]} />
          <Gloss id={u('gl')} />
        </defs>
        <Shadow u={u} f={f} cx={80} cy={102} rx={76} ry={8} o={0.4} />
        <path d="M14 96 C0 70 18 30 56 22 C92 14 130 24 146 56 C158 80 150 98 132 100 C96 106 46 106 14 96z" fill={f('b')} />
        <path d="M40 60 C60 50 96 50 120 62 C110 76 60 78 40 60z" fill="#8f2e1f" opacity="0.35" />
        <path d="M44 34 q30 -14 64 -4" stroke="#fff" strokeOpacity="0.45" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M30 88 q20 6 44 4 M96 90 q20 2 36 -6" stroke="#7d2617" strokeOpacity="0.4" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  'tv-retro': {
    w: 17,
    glow: { x: 50, y: 42, r: 34, c: '#9fd8ff' },
    vb: '0 0 130 140',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('wood')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#c58b55'], [1, '#6a4124']]} />
          <Rad id={u('scr')} cx={0.4} cy={0.35} r={0.8} stops={[[0, '#c6f0ff'], [0.6, '#5aa6d6'], [1, '#1d3d5c']]} />
          <Gloss id={u('gl')} />
          <clipPath id={u('clip')}>
            <rect x="18" y="38" width="70" height="56" rx="12" />
          </clipPath>
        </defs>
        <Shadow u={u} f={f} cx={65} cy={134} rx={56} ry={6} />
        <path d="M50 26 L34 2 M62 26 L86 6" stroke="#4a4a4a" strokeWidth="2" strokeLinecap="round" />
        <circle cx="34" cy="2" r="2.5" fill="#d64545" />
        <circle cx="86" cy="6" r="2.5" fill="#d64545" />
        <rect x="6" y="26" width="118" height="80" rx="14" fill={f('wood')} />
        <rect x="10" y="30" width="110" height="72" rx="11" fill="none" stroke="#e2ad7a" strokeOpacity="0.5" strokeWidth="1.5" />
        <rect x="14" y="34" width="78" height="64" rx="14" fill="#2b2420" />
        <rect x="18" y="38" width="70" height="56" rx="12" fill={f('scr')} />
        <g clipPath={`url(#${u('clip')})`} className="tv-show">
          <g className="tv-bars">
            {['#ff6b6b', '#ffd36b', '#7be07b', '#6bd3ff', '#9d7bff', '#ff7bd5'].map((c, i) => (
              <rect key={c} x={18 + i * 11.7} y="38" width="11.7" height="56" fill={c} opacity="0.55" />
            ))}
          </g>
          <circle cx="53" cy="66" r="14" fill="#e2674f" className="tv-face" />
          <circle cx="48" cy="63" r="2.2" fill="#2b1d17" />
          <circle cx="58" cy="63" r="2.2" fill="#2b1d17" />
          <path d="M47 71 q6 4 12 0" stroke="#2b1d17" strokeWidth="1.8" fill="none" />
          <rect className="tv-scan" x="18" y="38" width="70" height="6" fill="#fff" opacity="0.15" />
        </g>
        <rect x="18" y="38" width="70" height="56" rx="12" fill={f('gl')} opacity="0.5" />
        <circle cx="106" cy="48" r="6" fill="#3a2a20" />
        <circle cx="106" cy="48" r="3" fill="#d9b88f" />
        <circle cx="106" cy="66" r="6" fill="#3a2a20" />
        <circle cx="106" cy="66" r="3" fill="#d9b88f" />
        <path d="M100 80 h12 M100 84 h12 M100 88 h12" stroke="#3a2a20" strokeWidth="1.5" />
        <path d="M22 106 l-6 24 M108 106 l6 24" stroke="#4a2e18" strokeWidth="5" strokeLinecap="round" />
      </>
    ),
  },

  /* ---------------- rugs ---------------- */
  'rug-round': {
    w: 46,
    vb: '0 0 300 80',
    draw: (u, f) => (
      <>
        <defs>
          <Rad id={u('r')} stops={[[0, '#f6d7a8'], [0.45, '#e9b77a'], [0.5, '#c86f4f'], [0.58, '#f1d2a2'], [0.86, '#d9a06a'], [0.9, '#7f5a8f'], [1, '#6a4a7a']]} />
        </defs>
        <ellipse cx="150" cy="44" rx="146" ry="34" fill="#2a1608" opacity="0.18" />
        <ellipse cx="150" cy="40" rx="144" ry="34" fill={f('r')} />
        <ellipse cx="150" cy="40" rx="100" ry="23" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="4 6" />
        <ellipse cx="150" cy="40" rx="40" ry="9" fill="none" stroke="#a5523a" strokeOpacity="0.5" strokeWidth="2" />
      </>
    ),
  },
  'rug-rainbow': {
    w: 48,
    vb: '0 0 300 80',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('sheen')} stops={[[0, '#fff', 0.35], [0.5, '#fff', 0], [1, '#000', 0.12]]} />
        </defs>
        <ellipse cx="150" cy="44" rx="148" ry="34" fill="#2a1608" opacity="0.18" />
        {['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa'].map((c, i) => (
          <ellipse key={c} cx="150" cy="40" rx={144 - i * 22} ry={34 - i * 5.2} fill={c} stroke="#fff" strokeOpacity="0.25" strokeWidth="3" strokeDasharray="1 3" />
        ))}
        <ellipse cx="150" cy="40" rx="144" ry="34" fill={f('sheen')} />
      </>
    ),
  },

  /* ---------------- on the walls ---------------- */
  'poster-band': {
    w: 13,
    vb: '0 0 90 124',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('p')} stops={[[0, '#2a2350'], [1, '#141029']]} />
          <Rad id={u('sun')} cx={0.5} cy={0.5} r={0.5} stops={[[0, '#ffcf5a'], [0.6, '#ff6a6a'], [1, '#ff6a6a', 0]]} />
        </defs>
        <rect x="6" y="8" width="80" height="112" rx="2" fill="#000" opacity="0.18" />
        <rect x="3" y="4" width="80" height="112" rx="2" fill={f('p')} />
        <circle cx="43" cy="56" r="30" fill={f('sun')} />
        <circle cx="43" cy="60" r="16" fill="#e2674f" />
        <circle cx="38" cy="56" r="2.5" fill="#fff" />
        <circle cx="48" cy="56" r="2.5" fill="#fff" />
        <path d="M37 65 q6 -4 12 0" stroke="#2b1d17" strokeWidth="2" fill="none" />
        <path d="M60 30 l-8 14 h6 l-6 14" stroke="#ffe36b" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
        <text x="43" y="98" textAnchor="middle" fontSize="13" fontWeight="800" fill="#ffe9d6" fontFamily="var(--font), system-ui" letterSpacing="1">THE CLICKS</text>
        <text x="43" y="109" textAnchor="middle" fontSize="5.5" fill="#ff9ab0" fontFamily="var(--font), system-ui" letterSpacing="1">NO-PRESS WORLD TOUR</text>
        <rect x="31" y="0" width="24" height="8" rx="1" fill="#f4ecd0" opacity="0.85" transform="rotate(-4 43 4)" />
      </>
    ),
  },
  'clock-wall': {
    w: 10,
    vb: '0 0 90 94',
    draw: (u, f) => {
      // The hands show the real time: a negative delay starts each turn
      // at the right angle.
      const d = new Date();
      const s = d.getSeconds() + d.getMinutes() * 60 + (d.getHours() % 12) * 3600;
      return (
        <>
          <defs>
            <Lin id={u('rim')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#f3d48c'], [1, '#8a6224']]} />
            <Rad id={u('face')} cx={0.4} cy={0.35} r={0.7} stops={[[0, '#ffffff'], [1, '#efe6d6']]} />
          </defs>
          <circle cx="46" cy="50" r="42" fill="#000" opacity="0.15" />
          <circle cx="44" cy="46" r="42" fill={f('rim')} />
          <circle cx="44" cy="46" r="35" fill={f('face')} />
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x="43" y="14" width="2" height={i % 3 ? 4 : 7} rx="1" fill="#6b5446" transform={`rotate(${i * 30} 44 46)`} />
          ))}
          <g className="hand" style={{ animationDuration: '43200s', animationDelay: `-${s}s` }}>
            <rect x="42.5" y="26" width="3" height="22" rx="1.5" fill="#3a2a20" />
          </g>
          <g className="hand" style={{ animationDuration: '3600s', animationDelay: `-${s % 3600}s` }}>
            <rect x="43" y="18" width="2" height="30" rx="1" fill="#3a2a20" />
          </g>
          <g className="hand" style={{ animationDuration: '60s', animationDelay: `-${s % 60}s`, animationTimingFunction: 'steps(60)' }}>
            <rect x="43.5" y="16" width="1" height="36" fill="#e2674f" />
          </g>
          <circle cx="44" cy="46" r="3" fill="#e2674f" />
          <path d="M18 34 q8 -18 26 -22" stroke="#fff" strokeWidth="3" strokeOpacity="0.7" fill="none" strokeLinecap="round" />
        </>
      );
    },
  },
  'shelf-books': {
    w: 17,
    vb: '0 0 140 90',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('wood')} stops={[[0, '#c08a5c'], [1, '#7a4c2c']]} />
          <Lin id={u('pot')} x2={1} y2={0} stops={[[0, '#f6f3ec'], [1, '#bdb6aa']]} />
        </defs>
        <rect x="6" y="70" width="130" height="10" rx="2" fill="#000" opacity="0.14" />
        {[
          [14, 30, 12, '#e2674f'],
          [27, 26, 10, '#4f7bd5'],
          [38, 34, 13, '#f2c14e'],
          [52, 28, 9, '#7cc6a4'],
        ].map(([x, h, w, c]) => (
          <g key={x}>
            <rect x={x} y={68 - h} width={w} height={h} rx="1.5" fill={c} />
            <rect x={x} y={68 - h} width={w * 0.3} height={h} fill="#fff" opacity="0.2" />
            <rect x={x + 2} y={72 - h} width={w - 4} height="2" fill="#fff" opacity="0.5" />
          </g>
        ))}
        <rect x="62" y="42" width="10" height="28" rx="1.5" fill="#a58bd6" transform="rotate(14 72 68)" />
        <path d="M96 68 h18 l-2 -12 h-14z" fill={f('pot')} />
        <path d="M105 56 q-10 -14 -2 -22 q4 10 2 22 q6 -14 14 -16 q-2 12 -14 16" fill="#5aa865" />
        <path d="M124 68 v-10 h-6 v-4 h16 v4 h-6 v10z" fill="#e6b422" />
        <circle cx="126" cy="46" r="7" fill="#f2c94c" />
        <rect x="2" y="66" width="136" height="7" rx="2" fill={f('wood')} />
        <path d="M20 73 v8 l8 -8 M118 73 v8 l-8 -8" stroke="#6b6b6b" strokeWidth="2.5" fill="none" />
      </>
    ),
  },
  'art-portrait': {
    w: 14,
    vb: '0 0 100 124',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('gold')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#ffe7a3'], [0.4, '#d4a43a'], [0.7, '#9b6c14'], [1, '#e7c167']]} />
          <Rad id={u('bg')} cx={0.5} cy={0.4} r={0.7} stops={[[0, '#4f6b5a'], [1, '#1d2a24']]} />
          <Rad id={u('body')} cx={0.38} cy={0.3} r={0.75} stops={[[0, '#fff', 0.5], [0.4, '#fff', 0], [1, '#000', 0.25]]} />
        </defs>
        <rect x="6" y="8" width="90" height="114" rx="4" fill="#000" opacity="0.2" />
        <rect x="2" y="2" width="90" height="114" rx="4" fill={f('gold')} />
        <rect x="9" y="9" width="76" height="100" rx="2" fill="#7a5414" />
        <rect x="12" y="12" width="70" height="94" fill={f('bg')} />
        <ellipse cx="47" cy="98" rx="34" ry="10" fill="#1a1410" opacity="0.5" />
        <circle cx="47" cy="66" r="24" style={{ fill: 'var(--skin, #e2674f)' }} />
        <circle cx="47" cy="66" r="24" fill={f('body')} />
        <circle cx="40" cy="60" r="4" fill="#fff" />
        <circle cx="54" cy="60" r="4" fill="#fff" />
        <circle cx="41" cy="61" r="2" fill="#2b1d17" />
        <circle cx="55" cy="61" r="2" fill="#2b1d17" />
        <path d="M40 73 q7 -3 14 0" stroke="#2b1d17" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M30 44 l6 -10 6 6 5 -10 5 10 6 -6 6 10z" fill="#f2c94c" stroke="#9b6c14" strokeWidth="1" />
        <rect x="34" y="110" width="26" height="5" rx="1" fill="#f6e2a8" />
      </>
    ),
  },
  'neon-sign': {
    w: 20,
    vb: '0 0 170 80',
    draw: (u, f) => (
      <>
        <defs>
          <filter id={u('glow')} x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="4" y="6" width="162" height="68" rx="12" fill="#ffffff" opacity="0.12" stroke="#ffffff" strokeOpacity="0.35" />
        <g filter={`url(#${u('glow')})`} className="neon-flicker">
          <text x="85" y="36" textAnchor="middle" fontSize="24" fontWeight="700" fill="none" stroke="#ff5fa8" strokeWidth="2.6" fontFamily="var(--font), system-ui" letterSpacing="1">
            DON&apos;T
          </text>
          <text x="85" y="62" textAnchor="middle" fontSize="22" fontWeight="700" fill="none" stroke="#5fe3ff" strokeWidth="2.4" fontFamily="var(--font), system-ui" letterSpacing="3">
            PRESS
          </text>
        </g>
        <circle cx="14" cy="16" r="2" fill="#ccc" />
        <circle cx="156" cy="16" r="2" fill="#ccc" />
      </>
    ),
  },

  /* ---------------- food ---------------- */
  'food-cookie': {
    vb: '0 0 64 64',
    draw: (u, f) => (
      <>
        <defs>
          <Rad id={u('c')} cx={0.4} cy={0.35} r={0.7} stops={[[0, '#f1c27d'], [0.8, '#c98b45'], [1, '#9c6428']]} />
        </defs>
        <ellipse cx="32" cy="58" rx="22" ry="3.5" fill="#2a1608" opacity="0.2" />
        <circle cx="32" cy="34" r="24" fill={f('c')} />
        <rect x="14" y="16" width="36" height="9" rx="3" fill="#f5f7fb" stroke="#c9d1de" />
        <circle cx="19" cy="20.5" r="1.6" fill="#ff6b6b" />
        <circle cx="24" cy="20.5" r="1.6" fill="#ffd43b" />
        <circle cx="29" cy="20.5" r="1.6" fill="#69db7c" />
        {[[22, 36], [36, 32], [42, 44], [28, 48], [44, 30]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y} q3 -3 5 0 q-1 4 -5 0z`} fill="#4a2a17" />
        ))}
      </>
    ),
  },
  'food-pixels': {
    vb: '0 0 64 64',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('b')} x2={1} y2={0} stops={[[0, '#ffffff'], [1, '#c8d0dc']]} />
        </defs>
        <ellipse cx="32" cy="58" rx="22" ry="3.5" fill="#2a1608" opacity="0.2" />
        {[
          ['#ff6b6b', 16, 22], ['#ffd43b', 22, 18], ['#69db7c', 28, 20], ['#4dabf7', 34, 16], ['#9775fa', 40, 20], ['#ff8fd0', 44, 24],
          ['#4dabf7', 20, 26], ['#ff6b6b', 30, 25], ['#ffd43b', 38, 26],
        ].map(([c, x, y], i) => (
          <rect key={i} x={x} y={y} width="6" height="6" fill={c} stroke="#fff" strokeOpacity="0.4" />
        ))}
        <path d="M8 30 h48 q-2 22 -24 24 q-22 -2 -24 -24z" fill={f('b')} />
        <path d="M8 30 h48" stroke="#9aa6b8" strokeWidth="2" />
        <path d="M14 36 q4 10 12 14" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  'food-bubble': {
    vb: '0 0 64 64',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('bag')} x2={1} y2={0} stops={[[0, '#7bd3ff'], [1, '#2c86c9']]} />
        </defs>
        <ellipse cx="32" cy="59" rx="20" ry="3" fill="#2a1608" opacity="0.2" />
        <path d="M14 10 h36 l-2 6 4 40 h-40 l4 -40z" fill={f('bag')} />
        <path d="M14 10 l2 3 2 -3 2 3 2 -3 2 3 2 -3 2 3 2 -3 2 3 2 -3 2 3 2 -3 2 3 2 -3 2 3 2 -3" stroke="#bfe9ff" fill="none" />
        <text x="32" y="36" textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff" fontFamily="var(--font), system-ui">POP!</text>
        {[[20, 6], [28, 4], [36, 7], [44, 5]].map(([x, y], i) => (
          <g key={i}>
            <rect x={x - 5} y={y} width="10" height="10" rx="2" fill="#e8f7ff" opacity="0.85" />
            <circle cx={x} cy={y + 5} r="3" fill="#fff" stroke="#9fd8f5" />
          </g>
        ))}
        <path d="M20 20 v28" stroke="#fff" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  },
  'food-usb': {
    vb: '0 0 64 64',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('bread')} stops={[[0, '#f6c77f'], [1, '#c9873e']]} />
          <Lin id={u('metal')} stops={[[0, '#f2f4f8'], [1, '#9aa3b2']]} />
        </defs>
        <ellipse cx="30" cy="58" rx="24" ry="3.5" fill="#2a1608" opacity="0.2" />
        <path d="M40 26 h16 v12 h-16z" fill={f('metal')} />
        <rect x="45" y="29" width="3" height="3" fill="#5b6475" />
        <rect x="50" y="29" width="3" height="3" fill="#5b6475" />
        <path d="M6 40 q0 -6 6 -6 h30 q6 0 6 6 v4 h-42z" fill={f('bread')} />
        <path d="M6 36 h42 l-2 4 h-38z" fill="#7cc65a" />
        <rect x="8" y="30" width="38" height="5" rx="2" fill="#2d6bd6" />
        <path d="M8 30 h38 v-2 h-38z" fill="#ff6b5a" />
        <path d="M6 30 q0 -12 20 -12 q22 0 22 12z" fill={f('bread')} />
        <path d="M14 24 q8 -4 16 -2" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" fill="none" strokeLinecap="round" />
        <g fill="#fff3d6">
          <ellipse cx="20" cy="22" rx="1.2" ry="0.7" />
          <ellipse cx="30" cy="21" rx="1.2" ry="0.7" />
          <ellipse cx="38" cy="23" rx="1.2" ry="0.7" />
        </g>
      </>
    ),
  },
  'food-tacks': {
    vb: '0 0 64 64',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('b')} x2={1} y2={0} stops={[[0, '#ffd8a8'], [1, '#e8945a']]} />
        </defs>
        <ellipse cx="32" cy="58" rx="22" ry="3.5" fill="#2a1608" opacity="0.2" />
        <ellipse cx="32" cy="30" rx="24" ry="7" fill="#fbfbfb" />
        {[['#ff6b6b', 20, 27], ['#4dabf7', 30, 25], ['#ffd43b', 40, 28], ['#69db7c', 26, 31], ['#ff6b6b', 36, 32], ['#9775fa', 44, 30]].map(([c, x, y], i) => (
          <g key={i}>
            <path d={`M${x} ${y} l2 -6`} stroke="#9aa3b2" strokeWidth="1.2" />
            <circle cx={x} cy={y} r="3" fill={c} />
            <circle cx={x - 1} cy={y - 1} r="1" fill="#fff" opacity="0.7" />
          </g>
        ))}
        <path d="M8 30 q2 24 24 24 q22 0 24 -24 q-10 7 -24 7 q-14 0 -24 -7z" fill={f('b')} />
        <path d="M14 38 q4 10 12 12" stroke="#fff" strokeWidth="2.5" strokeOpacity="0.6" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  'food-cables': {
    vb: '0 0 64 64',
    draw: (u, f) => (
      <>
        <defs>
          <Rad id={u('p')} cx={0.45} cy={0.4} r={0.6} stops={[[0, '#ffffff'], [1, '#d6dbe4']]} />
        </defs>
        <ellipse cx="32" cy="57" rx="26" ry="4" fill="#2a1608" opacity="0.2" />
        <ellipse cx="32" cy="44" rx="28" ry="10" fill={f('p')} />
        <g fill="none" strokeWidth="2.6" strokeLinecap="round">
          <path d="M14 42 q6 -16 14 -4 q6 10 12 -6 q6 -12 10 6" stroke="#ffd43b" />
          <path d="M16 46 q10 -20 18 -2 q4 8 12 -8" stroke="#ff6b6b" />
          <path d="M20 40 q8 -12 14 2 q6 10 12 -4" stroke="#4dabf7" />
          <path d="M24 44 q4 -14 10 -6 q6 6 8 -4" stroke="#f1f3f5" />
        </g>
        <rect x="46" y="20" width="8" height="10" rx="2" fill="#495057" transform="rotate(20 50 25)" />
        <path d="M47 18 l1 -4 M51 19 l1 -4" stroke="#ced4da" strokeWidth="1.6" />
        <circle cx="26" cy="36" r="4" fill="#d6452f" />
        <circle cx="25" cy="35" r="1.3" fill="#fff" opacity="0.6" />
      </>
    ),
  },
  'food-battery': {
    vb: '0 0 64 64',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('drink')} stops={[[0, '#c6f26b'], [1, '#4caf50']]} />
          <Lin id={u('bat')} x2={1} y2={0} stops={[[0, '#3b3b3b'], [0.5, '#6b6b6b'], [1, '#2b2b2b']]} />
          <Lin id={u('glass')} x2={1} y2={0} stops={[[0, '#fff', 0.5], [0.3, '#fff', 0.1], [1, '#fff', 0.25]]} />
        </defs>
        <ellipse cx="32" cy="59" rx="16" ry="3" fill="#2a1608" opacity="0.2" />
        <g transform="rotate(14 40 20)">
          <rect x="36" y="2" width="9" height="30" rx="2" fill={f('bat')} />
          <rect x="36" y="2" width="9" height="10" rx="2" fill="#e6b422" />
          <rect x="39" y="0" width="3" height="3" fill="#bbb" />
        </g>
        <path d="M16 18 h32 l-4 40 h-24z" fill={f('drink')} />
        <path d="M16 18 h32" stroke="#e8ffd0" strokeWidth="3" />
        <path d="M27 30 l-3 8 h6 l-3 8" stroke="#fff8b0" strokeWidth="2" fill="none" strokeLinejoin="round" />
        <path d="M14 14 h36 l-5 46 h-26z" fill={f('glass')} stroke="#fff" strokeOpacity="0.6" />
        <circle cx="48" cy="16" r="5" fill="#ffd43b" />
        <circle cx="48" cy="16" r="2.5" fill="#fff3a8" />
      </>
    ),
  },
  'food-gluedog': {
    vb: '0 0 64 64',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('bun')} stops={[[0, '#f6c77f'], [1, '#c27a32']]} />
          <Lin id={u('glue')} stops={[[0, '#ffffff', 0.95], [1, '#d8e6f2', 0.95]]} />
        </defs>
        <ellipse cx="32" cy="56" rx="28" ry="4" fill="#2a1608" opacity="0.2" />
        <path d="M4 36 q0 -10 10 -10 h36 q10 0 10 10 q0 14 -28 14 q-28 0 -28 -14z" fill={f('bun')} />
        <rect x="2" y="28" width="60" height="9" rx="4.5" fill={f('glue')} stroke="#c3d2e0" />
        <rect x="6" y="30" width="40" height="2.5" rx="1.2" fill="#fff" />
        <path d="M20 37 q1 6 0 9 q-2 2 -2 0 q-1 -4 2 -9 M38 37 q1 4 0 6 q-2 1 -2 0 q0 -3 2 -6" fill="#f4f8fc" />
        <path d="M8 34 q20 -6 48 0" stroke="#ffd43b" strokeWidth="2" fill="none" strokeDasharray="4 3" />
        <path d="M10 40 q10 4 22 4" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  'food-floppy': {
    vb: '0 0 64 64',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('w')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#ffe08a'], [1, '#d99a2b']]} />
        </defs>
        <ellipse cx="32" cy="58" rx="24" ry="3.5" fill="#2a1608" opacity="0.2" />
        <path d="M8 8 h42 l6 6 v42 h-48z" fill={f('w')} stroke="#b07a1c" strokeWidth="1.2" />
        <g stroke="#b07a1c" strokeOpacity="0.5" strokeWidth="1.2">
          {[16, 24, 32, 40, 48].map((v) => (
            <path key={v} d={`M8 ${v} H56 M${v} 8 V56`} />
          ))}
        </g>
        <rect x="18" y="8" width="24" height="14" fill="#cfd6e0" stroke="#8a95a6" />
        <rect x="32" y="10" width="6" height="10" fill="#6b7686" />
        <rect x="14" y="32" width="36" height="20" rx="2" fill="#fff7e0" />
        <path d="M18 38 h28 M18 44 h20" stroke="#e2674f" strokeWidth="1.6" />
        <path d="M42 24 q6 0 6 6" stroke="#fff" strokeWidth="2" fill="none" opacity="0.7" />
        <ellipse cx="40" cy="30" rx="4" ry="2.5" fill="#fffbe8" opacity="0.8" />
      </>
    ),
  },
};

export function Art({ id, className = '', ...rest }) {
  const raw = useId();
  const a = ART[id];
  if (!a) return null;
  const p = 'a' + raw.replace(/[^a-zA-Z0-9]/g, '');
  const u = (k) => `${p}-${k}`;
  const f = (k) => `url(#${p}-${k})`;
  return (
    <svg viewBox={a.vb} className={`art art-${id} ${className}`} aria-hidden="true" focusable="false" {...rest}>
      {a.draw(u, f)}
    </svg>
  );
}
