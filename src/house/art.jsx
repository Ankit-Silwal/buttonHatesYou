'use client';

import { useId } from 'react';

// Pictures of everything in the house and the fridge, as SVG with soft
// gradients and shadows (light comes from the top left). Keyed by the item
// ids in src/economy/house.js. `w` is how wide a piece is in the room, in
// percent of the room's width. `par`: the svg's preserveAspectRatio (a
// string of lights stretches along the ceiling).
//
// Gradient ids must be unique on the page (the same piece can be in the room
// and in the shop at once), so each drawing gets `u(name)` for an id and
// `f(name)` for a url(#id) reference, both prefixed per instance.

import { Lin, Rad, Shadow, Gloss } from './svg';
import { MORE_ART } from './art-more';

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

  /* ---------------- teen room additions ---------------- */
  'bed-loft': {
    w: 38,
    vb: '0 0 220 170',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('steel')} x2={1} y2={0} stops={[[0, '#5d6776'], [0.5, '#3d4552'], [1, '#262c36']]} />
          <Lin id={u('mat')} stops={[[0, '#eef1f4'], [1, '#c9d0d8']]} />
          <Lin id={u('quilt')} stops={[[0, '#4a8a96'], [1, '#2f6370']]} />
          <Lin id={u('desk')} stops={[[0, '#b8946a'], [1, '#7c5c3a']]} />
          <Rad id={u('pil')} cx={0.4} cy={0.3} r={0.75} stops={[[0, '#ffffff'], [1, '#d3d8e0']]} />
          <Rad id={u('bag')} cx={0.38} cy={0.3} r={0.8} stops={[[0, '#9a8cd6'], [0.6, '#6b5bb0'], [1, '#43397c']]} />
          <Lin id={u('scr')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#6fe3ff'], [0.6, '#5a6cff'], [1, '#b04fff']]} />
          <Gloss id={u('gl')} />
        </defs>
        <Shadow u={u} f={f} cx={106} cy={164} rx={104} ry={6} />
        <rect x="8" y="46" width="9" height="116" rx="2" fill={f('steel')} />
        <rect x="190" y="46" width="9" height="116" rx="2" fill={f('steel')} />
        <rect x="8" y="46" width="191" height="6" rx="2" fill={f('steel')} />
        <rect x="8" y="46" width="191" height="2" fill="#fff" opacity="0.18" />
        <rect x="8" y="94" width="191" height="8" rx="2" fill={f('steel')} />
        <rect x="18" y="72" width="170" height="24" rx="8" fill={f('mat')} />
        <path d="M22 66 q0 -12 14 -12 h26 q12 0 12 10 q0 10 -12 10 h-26 q-14 0 -14 -8z" fill={f('pil')} />
        <path d="M84 76 q40 -12 100 -2 v22 h-100z" fill={f('quilt')} />
        <path d="M84 76 q40 -12 100 -2 v5 q-50 -8 -100 4z" fill={f('gl')} />
        <path d="M96 90 h86" stroke="#1f4a54" strokeWidth="1.5" opacity="0.5" />
        <rect x="199" y="98" width="5" height="64" rx="2" fill="#2e3540" />
        <rect x="212" y="98" width="5" height="64" rx="2" fill="#2e3540" />
        <g fill="#8a95a6">
          {[108, 122, 136, 150].map((y) => (
            <rect key={y} x="203" y={y} width="10" height="4" rx="1.5" />
          ))}
        </g>
        <rect x="26" y="126" width="116" height="6" rx="2" fill={f('desk')} />
        <rect x="26" y="126" width="116" height="2" fill="#fff" opacity="0.25" />
        <rect x="32" y="132" width="5" height="30" fill="#3d4552" />
        <rect x="132" y="132" width="5" height="30" fill="#3d4552" />
        <rect x="52" y="104" width="46" height="22" rx="3" fill="#1d2129" />
        <rect x="55" y="107" width="40" height="16" rx="2" fill={f('scr')} />
        <rect x="70" y="124" width="10" height="3" fill="#1d2129" />
        <rect x="106" y="120" width="18" height="6" rx="2" fill="#e2674f" />
        <path d="M148 162 C144 140 152 128 176 126 C192 128 194 150 190 162z" fill={f('bag')} />
        <path d="M156 134 q12 -6 24 0" stroke="#fff" strokeOpacity="0.4" strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  'poster-vinyl': {
    w: 12,
    vb: '0 0 90 90',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('cov')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#2d3a6b'], [0.55, '#6a3f86'], [1, '#d6587a']]} />
          <Rad id={u('sun')} stops={[[0, '#ffe29a'], [0.7, '#ff9a6b'], [1, '#ff9a6b', 0]]} />
          <Rad id={u('rec')} stops={[[0, '#2a2a2f'], [1, '#08080b']]} />
        </defs>
        <rect x="9" y="9" width="78" height="78" rx="2" fill="#000" opacity="0.22" />
        <rect x="6" y="6" width="78" height="78" rx="2" fill={f('cov')} />
        <circle cx="45" cy="38" r="24" fill={f('sun')} />
        <path d="M6 54 H84 M6 60 H84 M6 67 H84" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.5" />
        <path d="M6 48 L30 40 L48 50 L66 36 L84 46 V54 H6z" fill="#1c1838" opacity="0.8" />
        <text x="45" y="77" textAnchor="middle" fontSize="9" fontWeight="800" fill="#ffe9ef" fontFamily="var(--font), system-ui" letterSpacing="2">NIGHT DRIVE</text>
        <circle cx="72" cy="18" r="7" fill={f('rec')} />
        <circle cx="72" cy="18" r="2.2" fill="#d6587a" />
        <rect x="6" y="6" width="78" height="78" rx="2" fill="none" stroke="#fff" strokeOpacity="0.25" />
      </>
    ),
  },
  'photo-wall': {
    w: 20,
    vb: '0 0 160 110',
    draw: (u, f) => {
      const shots = [
        [10, 24, -8, '#7fb6c9', '#d6a3c4'],
        [46, 34, 5, '#e6b46a', '#b5806a'],
        [84, 26, -4, '#8fb59a', '#4f7d8c'],
        [120, 36, 7, '#a999d6', '#e08aa0'],
      ];
      return (
        <>
          <defs>
            <filter id={u('g')} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>
          <path d="M2 6 Q40 30 80 14 Q120 30 158 8" stroke="#3a3a42" strokeWidth="1.2" fill="none" />
          {[[12, 15], [34, 22], [58, 24], [80, 14], [104, 22], [128, 24], [150, 12]].map(([x, y], i) => (
            <g key={i} className="twinkle" style={{ animationDelay: `${i * 0.3}s` }}>
              <circle cx={x} cy={y + 2} r="5" fill="#ffd98a" opacity="0.5" filter={f('g')} />
              <circle cx={x} cy={y + 2} r="2.2" fill="#ffe7a8" />
            </g>
          ))}
          {shots.map(([x, y, r, c1, c2], i) => (
            <g key={i} transform={`rotate(${r} ${x + 14} ${y})`}>
              <rect x={x + 2} y={y + 3} width="28" height="36" fill="#000" opacity="0.2" />
              <rect x={x} y={y} width="28" height="36" fill="#f7f4ee" />
              <rect x={x + 3} y={y + 3} width="22" height="22" fill={c1} />
              <path d={`M${x + 3} ${y + 25} L${x + 11} ${y + 14} L${x + 17} ${y + 21} L${x + 21} ${y + 16} L${x + 25} ${y + 22} V${y + 25}z`} fill={c2} />
              <circle cx={x + 19} cy={y + 9} r="3" fill="#fff" opacity="0.7" />
              <rect x={x + 11} y={y - 3} width="6" height="8" rx="1" fill="#c99a5c" />
            </g>
          ))}
        </>
      );
    },
  },
  'skate-decks': {
    w: 15,
    vb: '0 0 120 120',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('a')} x2={1} y2={0} stops={[[0, '#e2674f'], [1, '#a53a28']]} />
          <Lin id={u('b')} x2={1} y2={0} stops={[[0, '#3f8f9c'], [1, '#27606b']]} />
          <Lin id={u('c')} x2={1} y2={0} stops={[[0, '#2d2f3b'], [1, '#15161d']]} />
        </defs>
        {[[10, 'a', -6], [48, 'b', 0], [86, 'c', 6]].map(([x, k, r]) => (
          <g key={k} transform={`rotate(${r} ${x + 12} 60)`}>
            <rect x={x + 3} y="11" width="24" height="102" rx="12" fill="#000" opacity="0.2" />
            <rect x={x} y="8" width="24" height="102" rx="12" fill={f(k)} />
            <rect x={x} y="8" width="6" height="102" rx="3" fill="#fff" opacity="0.18" />
            <g fill="#8a95a6">
              <circle cx={x + 6} cy="24" r="1.6" />
              <circle cx={x + 18} cy="24" r="1.6" />
              <circle cx={x + 6} cy="94" r="1.6" />
              <circle cx={x + 18} cy="94" r="1.6" />
            </g>
          </g>
        ))}
        <circle cx="22" cy="52" r="7" fill="#ffd36b" />
        <path d="M14 66 L30 58 M14 74 L30 66" stroke="#fff" strokeWidth="2.5" opacity="0.8" />
        <path d="M54 46 l12 18 l12 -18 z" fill="#ffd36b" />
        <circle cx="66" cy="76" r="6" fill="none" stroke="#9fe0e8" strokeWidth="2.5" />
        <path d="M94 46 h20 M94 54 h20 M94 62 h14" stroke="#ff5fa8" strokeWidth="3" strokeLinecap="round" />
        <circle cx="104" cy="82" r="5" fill="#5fe3ff" />
      </>
    ),
  },
  'led-strip': {
    w: 100,
    glow: { x: 50, y: 60, r: 70, c: '#d96bff' },
    vb: '0 0 400 30',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('l')} x2={1} y2={0} stops={[[0, '#ff4fd8'], [0.5, '#a56bff'], [1, '#4fe3ff']]} />
          <Lin id={u('halo')} stops={[[0, '#c06bff', 0.55], [1, '#c06bff', 0]]} />
        </defs>
        <rect x="0" y="6" width="400" height="24" fill={f('halo')} />
        <rect x="0" y="0" width="400" height="7" fill="#20232b" />
        <rect x="6" y="2" width="388" height="3.6" rx="1.8" fill={f('l')} />
        <g fill="#fff" opacity="0.8">
          {Array.from({ length: 33 }, (_, i) => (
            <circle key={i} cx={10 + i * 12} cy="3.8" r="0.9" />
          ))}
        </g>
        <rect x="6" y="2" width="388" height="1.2" fill="#fff" opacity="0.4" />
      </>
    ),
  },
  'rug-shag': {
    w: 48,
    vb: '0 0 300 80',
    draw: (u, f) => {
      const tufts = [];
      for (let i = 0; i < 46; i++) {
        const a = (i / 46) * Math.PI * 2;
        tufts.push([150 + Math.cos(a) * 140, 40 + Math.sin(a) * 32, Math.cos(a) * 6, Math.sin(a) * 3]);
      }
      return (
        <>
          <defs>
            <Rad id={u('r')} cx={0.45} cy={0.4} r={0.65} stops={[[0, '#f1ece6'], [0.7, '#d8d0cc'], [1, '#b9aeb4']]} />
            <Lin id={u('sheen')} stops={[[0, '#fff', 0.35], [0.5, '#fff', 0], [1, '#000', 0.1]]} />
          </defs>
          <ellipse cx="150" cy="46" rx="148" ry="33" fill="#2a1608" opacity="0.2" />
          <ellipse cx="150" cy="40" rx="142" ry="33" fill={f('r')} />
          <g stroke="#cbbfc4" strokeWidth="2.6" strokeLinecap="round">
            {tufts.map(([x, y, dx, dy], i) => (
              <path key={i} d={`M${x} ${y} l${dx} ${dy}`} />
            ))}
          </g>
          <g stroke="#a99fb6" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" fill="none">
            {Array.from({ length: 70 }, (_, i) => {
              const x = 30 + ((i * 53) % 240);
              const y = 18 + ((i * 29) % 44);
              return <path key={i} d={`M${x} ${y} q3 -3 5 0`} />;
            })}
          </g>
          <ellipse cx="150" cy="40" rx="142" ry="33" fill={f('sheen')} />
        </>
      );
    },
  },
  'plant-snake': {
    w: 10,
    vb: '0 0 80 170',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('leaf')} x2={1} y2={0} stops={[[0, '#4f9a6a'], [0.6, '#2d6b47'], [1, '#1b4430']]} />
          <Lin id={u('pot')} x2={1} y2={0} stops={[[0, '#6a7280'], [0.5, '#3f4651'], [1, '#262b33']]} />
        </defs>
        <Shadow u={u} f={f} cx={40} cy={165} rx={28} ry={5} />
        {[
          'M40 120 C26 90 24 50 30 14 C42 44 46 90 46 120z',
          'M44 120 C52 80 62 50 66 26 C70 56 62 96 52 122z',
          'M38 122 C24 100 8 76 6 52 C20 70 34 96 44 122z',
          'M46 120 C58 98 70 90 76 70 C76 96 64 112 52 124z',
          'M40 120 C36 84 40 48 44 4 C52 40 52 86 48 120z',
        ].map((d, i) => (
          <g key={i}>
            <path d={d} fill={f('leaf')} stroke="#d9d46a" strokeWidth="1.6" strokeOpacity="0.85" />
            <path d={d} fill="none" stroke="#18382a" strokeOpacity="0.35" strokeWidth="0.8" strokeDasharray="5 6" />
          </g>
        ))}
        <path d="M22 122 h40 l-5 40 q-15 4 -30 0z" fill={f('pot')} />
        <rect x="20" y="118" width="44" height="8" rx="3" fill="#59616e" />
        <path d="M28 130 l2 26" stroke="#fff" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />
        <path d="M26 162 l-4 4 M58 162 l4 4" stroke="#b88a3a" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  },
  'mini-fridge': {
    w: 14,
    vb: '0 0 100 150',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('body')} x2={1} y2={0} stops={[[0, '#bfe0d6'], [0.55, '#9ccbbd'], [1, '#6f9f94']]} />
        </defs>
        <Shadow u={u} f={f} cx={50} cy={144} rx={42} ry={5} />
        <rect x="10" y="6" width="80" height="132" rx="12" fill={f('body')} />
        <rect x="10" y="6" width="80" height="132" rx="12" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.5" />
        <path d="M10 48 H90" stroke="#5f8a80" strokeWidth="2" />
        <rect x="76" y="16" width="5" height="24" rx="2.5" fill="#e6e2d6" />
        <rect x="76" y="58" width="5" height="40" rx="2.5" fill="#e6e2d6" />
        <circle cx="24" cy="28" r="5.5" fill="#7cffb0" opacity="0.3" />
        <circle cx="24" cy="28" r="2.6" fill="#7cffb0" />
        <g transform="rotate(-4 43 69)">
          <rect x="32" y="56" width="22" height="26" fill="#fff8e6" />
          <path d="M36 62 h14 M36 68 h10 M36 74 h12" stroke="#e2674f" strokeWidth="1.4" />
        </g>
        <circle cx="30" cy="54" r="3.2" fill="#e2674f" />
        <rect x="26" y="92" width="12" height="9" rx="2" fill="#5b8fd6" />
        <path d="M54 92 l5 -3 5 3 -2 6 h-6z" fill="#ffd36b" />
        <circle cx="44" cy="116" r="4" fill="#9775fa" />
        <path d="M16 12 q-2 60 0 120" stroke="#fff" strokeOpacity="0.4" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M18 138 l-2 6 M82 138 l2 6" stroke="#3b3f46" strokeWidth="5" strokeLinecap="round" />
      </>
    ),
  },
  'record-player': {
    w: 20,
    vb: '0 0 160 110',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('wood')} x2={1} y2={1} stops={[[0, '#b98458'], [1, '#6c4528']]} />
          <Lin id={u('deck')} stops={[[0, '#4a4f5a'], [1, '#2b2f38']]} />
          <Lin id={u('top')} stops={[[0, '#656b78'], [1, '#3a3f49']]} />
        </defs>
        <Shadow u={u} f={f} cx={80} cy={104} rx={66} ry={5} />
        <path d="M24 70 l-6 34 M136 70 l6 34" stroke="#4e3320" strokeWidth="5" strokeLinecap="round" />
        <rect x="14" y="62" width="132" height="14" rx="4" fill={f('wood')} />
        <rect x="14" y="62" width="132" height="3" fill="#fff" opacity="0.2" />
        <rect x="30" y="80" width="14" height="22" fill="#e2674f" />
        <rect x="46" y="82" width="12" height="20" fill="#4f7bd5" />
        <rect x="60" y="78" width="14" height="24" fill="#f2c14e" />
        <rect x="76" y="82" width="12" height="20" fill="#7cc6a4" />
        <rect x="30" y="80" width="58" height="4" fill="#000" opacity="0.15" />
        <path d="M18 62 l8 -30 h108 l8 30z" fill={f('deck')} />
        <path d="M26 32 h108" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.5" />
        <path d="M18 62 h124 l-1 -4 h-122z" fill={f('top')} />
        <g transform="translate(66 47) scale(1 0.34)">
          <circle r="35" fill="#15161a" />
          <circle r="36" fill="none" stroke="#fff" strokeOpacity="0.15" />
          <g className="vinyl">
            <circle r="30" fill="#0b0b0e" />
            <circle r="24" fill="none" stroke="#2a2b33" strokeWidth="1" />
            <circle r="18" fill="none" stroke="#2a2b33" strokeWidth="1" />
            <circle r="11" fill="#d6587a" />
            <rect x="-2" y="-11" width="4" height="9" fill="#ffe9ef" opacity="0.8" />
            <circle r="1.5" fill="#0b0b0e" />
            <path d="M-26 -8 q10 -16 28 -20" stroke="#fff" strokeOpacity="0.2" strokeWidth="3" fill="none" />
          </g>
        </g>
        <circle cx="122" cy="38" r="5" fill="#8a95a6" />
        <path d="M122 38 L96 52 L90 50" stroke="#d8dde6" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="86" y="48" width="8" height="5" rx="1" fill="#2b2f38" transform="rotate(-24 90 50)" />
        <circle cx="30" cy="54" r="3.4" fill="#2b2f38" stroke="#8a95a6" />
        <circle cx="30" cy="44" r="2" fill="#7cffb0" />
      </>
    ),
  },
  'guitar-stand': {
    w: 17,
    vb: '0 0 140 170',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('body')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#4fb3c4'], [0.6, '#2b6f86'], [1, '#17394b']]} />
          <Lin id={u('neck')} x2={1} y2={0} stops={[[0, '#c9a06a'], [1, '#8a6238']]} />
          <Lin id={u('amp')} x2={1} y2={0} stops={[[0, '#3a3f4a'], [1, '#1e2128']]} />
        </defs>
        <Shadow u={u} f={f} cx={70} cy={165} rx={62} ry={5} />
        <rect x="76" y="116" width="58" height="48" rx="4" fill={f('amp')} />
        <rect x="76" y="116" width="58" height="48" rx="4" fill="none" stroke="#fff" strokeOpacity="0.2" />
        <rect x="82" y="130" width="46" height="28" rx="2" fill="#8d7a5a" />
        <path d="M82 134 h46 M82 138 h46 M82 142 h46 M82 146 h46 M82 150 h46 M82 154 h46" stroke="#5a4a32" strokeWidth="0.8" />
        <g fill="#c9ced8">
          {[88, 100, 112, 124].map((x) => (
            <circle key={x} cx={x} cy="123" r="2.4" />
          ))}
        </g>
        <path d="M30 156 L14 166 M30 156 L48 166 M30 156 L40 138" stroke="#2b2f38" strokeWidth="3" strokeLinecap="round" />
        <g transform="rotate(-6 46 90)">
          <rect x="43" y="14" width="7" height="76" fill={f('neck')} />
          <g stroke="#e8e2d0" strokeWidth="0.8">
            {[26, 38, 50, 62, 74].map((y) => (
              <path key={y} d={`M43 ${y} h7`} />
            ))}
          </g>
          <path d="M42 14 l-1 -12 q5 -3 10 0 l-1 12z" fill="#2b2f38" />
          <g fill="#c9ced8">
            <circle cx="40" cy="6" r="1.3" />
            <circle cx="40" cy="10" r="1.3" />
            <circle cx="53" cy="6" r="1.3" />
            <circle cx="53" cy="10" r="1.3" />
          </g>
          <g fill={f('body')}>
            <ellipse cx="46" cy="98" rx="20" ry="16" />
            <ellipse cx="46" cy="124" rx="26" ry="26" />
          </g>
          <ellipse cx="38" cy="92" rx="10" ry="6" fill="#fff" opacity="0.22" transform="rotate(-20 38 92)" />
          <path d="M34 112 q12 -6 24 0 q4 16 -4 28 q-12 6 -22 0 q-6 -12 2 -28z" fill="#f4f1ea" opacity="0.85" />
          <rect x="36" y="106" width="20" height="4" rx="1.5" fill="#1d2129" />
          <rect x="36" y="118" width="20" height="4" rx="1.5" fill="#1d2129" />
          <circle cx="58" cy="136" r="2.4" fill="#c9ced8" />
          <circle cx="52" cy="144" r="2.4" fill="#c9ced8" />
        </g>
      </>
    ),
  },
  'chair-gaming': {
    w: 14,
    vb: '0 0 100 170',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('blk')} x2={1} y2={0} stops={[[0, '#3a3d48'], [0.5, '#22242c'], [1, '#14151a']]} />
          <Lin id={u('acc')} stops={[[0, '#ff4f8b'], [1, '#b81f58']]} />
          <Gloss id={u('gl')} />
        </defs>
        <Shadow u={u} f={f} cx={50} cy={165} rx={38} ry={5} />
        <path d="M50 140 L12 158 M50 140 L88 158 M50 140 V160 M50 140 L36 162 M50 140 L64 162" stroke="#2b2f38" strokeWidth="4.5" strokeLinecap="round" />
        <g fill="#14151a">
          <circle cx="12" cy="160" r="4.5" />
          <circle cx="88" cy="160" r="4.5" />
          <circle cx="36" cy="164" r="4" />
          <circle cx="64" cy="164" r="4" />
        </g>
        <rect x="44" y="114" width="12" height="30" rx="3" fill="#8a95a6" />
        <rect x="46" y="114" width="3" height="30" fill="#fff" opacity="0.35" />
        <path d="M20 8 q30 -8 60 0 l8 30 l-4 54 h-68 l-4 -54z" fill={f('blk')} />
        <path d="M12 38 l8 -30 q-6 20 0 56 l4 28 h-12z M88 38 l-8 -30 q6 20 0 56 l-4 28 h12z" fill={f('acc')} />
        <rect x="34" y="40" width="32" height="48" rx="6" fill="#2d303b" />
        <path d="M50 42 v44" stroke="#ff4f8b" strokeWidth="3" />
        <path d="M40 46 v38 M60 46 v38" stroke="#14151a" strokeWidth="1.5" />
        <rect x="32" y="10" width="36" height="22" rx="9" fill="#2d303b" />
        <rect x="32" y="10" width="36" height="22" rx="9" fill={f('gl')} opacity="0.35" />
        <path d="M38 18 h24" stroke="#ff4f8b" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 98 q-2 16 6 18 h60 q8 -2 6 -18 q-36 8 -72 0z" fill={f('blk')} />
        <path d="M16 112 q34 8 68 0" stroke="#ff4f8b" strokeWidth="2.5" fill="none" />
        <rect x="6" y="84" width="10" height="8" rx="3" fill="#2d303b" />
        <rect x="84" y="84" width="10" height="8" rx="3" fill="#2d303b" />
        <path d="M10 92 v6 M90 92 v6" stroke="#8a95a6" strokeWidth="3" />
      </>
    ),
  },
  'desk-gaming': {
    w: 30,
    glow: { x: 40, y: 32, r: 38, c: '#7a8cff' },
    vb: '0 0 240 150',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('top')} stops={[[0, '#4a4f5c'], [1, '#262a33']]} />
          <Lin id={u('s1')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#5fe3ff'], [0.55, '#5a6cff'], [1, '#c04fff']]} />
          <Lin id={u('s2')} x1={0} y1={1} x2={1} y2={0} stops={[[0, '#ff6aa8'], [0.5, '#8a5cff'], [1, '#3a7bff']]} />
          <Lin id={u('tw')} x2={1} y2={0} stops={[[0, '#2e323d'], [1, '#14161c']]} />
          <Lin id={u('under')} stops={[[0, '#c06bff', 0.55], [1, '#c06bff', 0]]} />
          <Gloss id={u('gl')} />
        </defs>
        <Shadow u={u} f={f} cx={120} cy={146} rx={112} ry={5} />
        <rect x="6" y="100" width="228" height="22" fill={f('under')} />
        <rect x="14" y="100" width="6" height="46" fill="#2b2f38" />
        <rect x="220" y="100" width="6" height="46" fill="#2b2f38" />
        <rect x="170" y="112" width="42" height="34" rx="3" fill={f('tw')} />
        <rect x="174" y="116" width="26" height="26" rx="2" fill="#0d0e12" />
        <circle cx="187" cy="129" r="9" fill="none" stroke="#5fe3ff" strokeWidth="2.4" className="rgb-hue" />
        <circle cx="187" cy="129" r="3" fill="#ff4fd8" />
        <path d="M205 118 v22" stroke="#b04fff" strokeWidth="2" className="rgb-hue" />
        <rect x="2" y="92" width="236" height="9" rx="3" fill={f('top')} />
        <rect x="2" y="92" width="236" height="2" fill="#fff" opacity="0.2" />
        <rect x="12" y="14" width="86" height="56" rx="4" fill="#14161c" />
        <rect x="16" y="18" width="78" height="46" rx="2" fill={f('s1')} />
        <path d="M16 56 L34 40 L48 52 L64 34 L94 56 V64 H16z" fill="#14163a" opacity="0.55" />
        <circle cx="76" cy="30" r="7" fill="#ffe29a" opacity="0.9" />
        <rect x="16" y="18" width="78" height="46" rx="2" fill={f('gl')} opacity="0.3" />
        <path d="M55 70 v18" stroke="#1d2129" strokeWidth="5" />
        <rect x="42" y="86" width="28" height="4" rx="2" fill="#1d2129" />
        <rect x="104" y="14" width="86" height="56" rx="4" fill="#14161c" />
        <rect x="108" y="18" width="78" height="46" rx="2" fill={f('s2')} />
        <g fill="#0d0e12" opacity="0.6">
          <rect x="114" y="24" width="26" height="4" rx="1" />
          <rect x="114" y="32" width="40" height="4" rx="1" />
          <rect x="114" y="40" width="32" height="4" rx="1" />
        </g>
        <rect x="108" y="18" width="78" height="46" rx="2" fill={f('gl')} opacity="0.3" />
        <path d="M147 70 v18" stroke="#1d2129" strokeWidth="5" />
        <rect x="134" y="86" width="28" height="4" rx="2" fill="#1d2129" />
        <rect x="52" y="84" width="76" height="8" rx="2" fill="#15171d" />
        <g className="rgb-hue">
          <rect x="54" y="86" width="72" height="4" rx="1" fill="#ff4fd8" opacity="0.9" />
          <rect x="54" y="86" width="36" height="4" rx="1" fill="#4fe3ff" opacity="0.9" />
        </g>
        <ellipse cx="148" cy="92" rx="7" ry="3" fill="#15171d" />
        <rect x="204" y="78" width="14" height="14" rx="2" fill="#e2674f" />
        <path d="M208 78 v-5 M214 78 v-7" stroke="#ffd36b" strokeWidth="1.6" />
      </>
    ),
  },

  /* ---------------- bedroom: the bedside lamp is how he goes to sleep ---------------- */
  'lamp-bedside': {
    w: 10,
    glow: { x: 50, y: 24, r: 44, c: '#ffc46b' },
    vb: '0 0 100 130',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('wood')} x2={1} y2={0} stops={[[0, '#c58a55'], [1, '#8f5a33']]} />
          <Lin id={u('shade')} x2={1} y2={0} stops={[[0, '#ffe6a8'], [0.5, '#ffd27a'], [1, '#e8a94f']]} />
          <Rad id={u('bulb')} cx={0.5} cy={0.5} r={0.5} stops={[[0, '#fffbe6'], [0.6, '#ffe39a', 0.7], [1, '#ffc46b', 0]]} />
        </defs>
        <Shadow u={u} f={f} cx={50} cy={124} rx={44} ry={5} />
        <rect x="12" y="76" width="76" height="46" rx="5" fill={f('wood')} />
        <rect x="6" y="68" width="88" height="10" rx="5" fill="#d9a06b" />
        <rect x="6" y="68" width="88" height="3" rx="1.5" fill="#fff" opacity="0.35" />
        <rect x="20" y="86" width="60" height="26" rx="4" fill="#7a4a2a" opacity="0.5" />
        <rect x="22" y="88" width="56" height="22" rx="3" fill="#b3774a" />
        <circle cx="50" cy="99" r="3" fill="#f3d48c" />
        <ellipse cx="50" cy="66" rx="15" ry="4" fill="#4b4540" />
        <rect x="48" y="38" width="4" height="28" fill="#4b4540" />
        <ellipse className="lamp-lit" cx="50" cy="36" rx="30" ry="22" fill={f('bulb')} />
        <path d="M28 40 L38 6 H62 L72 40 Z" fill={f('shade')} />
        <path d="M34 36 L41 10" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="50" cy="40" rx="22" ry="4.5" fill="#fff4cf" className="lamp-lit" />
        <ellipse cx="50" cy="40" rx="22" ry="4.5" fill="#caa05a" opacity="0.5" />
      </>
    ),
  },
  'nightstand-modern': {
    w: 10,
    glow: { x: 50, y: 24, r: 44, c: '#9fe3ff' },
    vb: '0 0 100 130',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('body')} x2={1} y2={0} stops={[[0, '#ffffff'], [1, '#d6dce4']]} />
          <Lin id={u('shade')} x2={1} y2={0} stops={[[0, '#7fe0d4'], [1, '#2fa89c']]} />
          <Rad id={u('bulb')} cx={0.5} cy={0.5} r={0.5} stops={[[0, '#f0ffff'], [0.6, '#bff4ff', 0.7], [1, '#9fe3ff', 0]]} />
        </defs>
        <Shadow u={u} f={f} cx={50} cy={124} rx={42} ry={5} />
        <rect x="14" y="70" width="72" height="50" rx="6" fill={f('body')} />
        <rect x="20" y="78" width="60" height="18" rx="3" fill="#aab4c2" opacity="0.55" />
        <rect x="20" y="100" width="60" height="14" rx="3" fill="#2b3342" />
        <rect x="26" y="103" width="22" height="8" rx="1.5" fill="#ff7a8a" />
        <rect x="50" y="104" width="24" height="7" rx="1.5" fill="#ffd36b" />
        <rect x="14" y="66" width="72" height="8" rx="4" fill="#2b3342" />
        <path d="M18 120 l-2 6 M82 120 l2 6" stroke="#2b3342" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 66 C 50 50 56 40 62 30" stroke="#2b3342" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <ellipse className="lamp-lit" cx="64" cy="26" rx="28" ry="20" fill={f('bulb')} />
        <path d="M48 32 Q54 6 78 10 Q80 26 76 34 Z" fill={f('shade')} />
        <path d="M54 26 Q58 14 68 13" stroke="#fff" strokeOpacity="0.5" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <ellipse className="lamp-lit" cx="62" cy="34" rx="14" ry="3" fill="#eaffff" />
      </>
    ),
  },
  'wardrobe-tall': {
    w: 12,
    vb: '0 0 110 240',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('wood')} x2={1} y2={0} stops={[[0, '#7c5a43'], [0.5, '#5d4130'], [1, '#43301f']]} />
          <Lin id={u('mir')} x2={1} y2={1} stops={[[0, '#dff2ff'], [0.5, '#a9cfe6'], [1, '#7fa7c4']]} />
        </defs>
        <Shadow u={u} f={f} cx={55} cy={234} rx={50} ry={5} />
        <rect x="6" y="6" width="98" height="222" rx="6" fill={f('wood')} />
        <rect x="2" y="2" width="106" height="10" rx="4" fill="#3a281a" />
        <rect x="14" y="20" width="38" height="196" rx="3" fill="#000" opacity="0.18" />
        <rect x="58" y="20" width="38" height="196" rx="3" fill="#000" opacity="0.18" />
        <rect x="17" y="23" width="32" height="190" rx="2" fill={f('mir')} />
        <path d="M22 30 L44 90 M22 60 L30 80" stroke="#fff" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" />
        <rect x="61" y="23" width="32" height="190" rx="2" fill="#6b4c37" />
        <path d="M61 120 h32" stroke="#000" strokeOpacity="0.2" strokeWidth="1.5" />
        <path d="M86 126 q8 4 4 18 q-6 2 -8 -4z" fill="#ff7aa8" />
        <rect x="52" y="108" width="3" height="26" rx="1.5" fill="#f3d48c" />
        <rect x="57" y="108" width="3" height="26" rx="1.5" fill="#f3d48c" />
        <path d="M14 228 v8 M96 228 v8" stroke="#2c1f14" strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  },
  'desk-study': {
    w: 20,
    vb: '0 0 200 140',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('top')} stops={[[0, '#e6c79c'], [1, '#c79f6d']]} />
          <Lin id={u('side')} x2={1} y2={0} stops={[[0, '#b88457'], [1, '#8a5d3a']]} />
          <Lin id={u('scr')} stops={[[0, '#8fe3ff'], [1, '#4f8be0']]} />
        </defs>
        <Shadow u={u} f={f} cx={100} cy={134} rx={92} ry={6} />
        <rect x="12" y="62" width="176" height="10" rx="4" fill={f('top')} />
        <rect x="12" y="62" width="176" height="3" rx="1.5" fill="#fff" opacity="0.4" />
        <rect x="18" y="72" width="8" height="58" rx="2" fill={f('side')} />
        <rect x="126" y="72" width="56" height="58" rx="3" fill={f('side')} />
        <rect x="132" y="78" width="44" height="22" rx="2" fill="#a06f45" />
        <rect x="132" y="104" width="44" height="22" rx="2" fill="#a06f45" />
        <circle cx="154" cy="89" r="2.4" fill="#f3d48c" />
        <circle cx="154" cy="115" r="2.4" fill="#f3d48c" />
        <path d="M34 62 l6 -34 h54 l6 34z" fill="#2b3342" />
        <rect x="42" y="32" width="48" height="26" rx="2" fill={f('scr')} />
        <path d="M46 38 h20 M46 44 h30 M46 50 h14" stroke="#fff" strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 62 h78 l-4 -6 h-70z" fill="#1f2530" />
        <rect x="112" y="46" width="34" height="16" rx="2" fill="#e2674f" />
        <rect x="114" y="38" width="30" height="10" rx="2" fill="#5b8fd6" />
        <rect x="116" y="31" width="26" height="8" rx="2" fill="#ffd36b" />
        <path d="M160 62 v-26 l14 -14" stroke="#4b4540" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M168 22 l16 10 l-6 6z" fill="#7fd6a0" />
        <rect x="150" y="50" width="12" height="12" rx="3" fill="#fffaf2" />
        <path d="M162 53 q6 2 0 6" stroke="#fffaf2" strokeWidth="2" fill="none" />
      </>
    ),
  },
  'string-lights': {
    w: 100,
    glow: null,
    vb: '0 0 400 60',
    draw: () => {
      const bulbs = [];
      for (let k = 0; k < 2; k++) {
        const x0 = k * 200;
        for (let i = 0; i < 8; i++) {
          const t = (i + 0.5) / 8;
          bulbs.push({ x: x0 + 8 + t * 184, y: 6 + Math.sin(t * Math.PI) * 30, d: (i % 4) * 0.5 });
        }
      }
      return (
        <>
          <path d="M8 4 Q104 52 200 4 Q296 52 392 4" stroke="#3a3530" strokeWidth="1.3" fill="none" />
          {bulbs.map((b, i) => (
            <g key={i} className="twinkle" style={{ animationDelay: `${b.d}s` }}>
              <circle cx={b.x} cy={b.y + 7} r="10" fill="#ffd98f" opacity="0.28" />
              <rect x={b.x - 1.8} y={b.y} width="3.6" height="3.4" fill="#5b5a52" />
              <circle cx={b.x} cy={b.y + 7} r="4.6" fill="#fff0c2" />
              <circle cx={b.x - 1.4} cy={b.y + 5.6} r="1.3" fill="#fff" opacity="0.9" />
            </g>
          ))}
        </>
      );
    },
  },
  'floor-mirror': {
    w: 8,
    vb: '0 0 80 220',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('glass')} x2={1} y2={1} stops={[[0, '#e8f6ff'], [0.5, '#b7d6ea'], [1, '#86aac4']]} />
          <Lin id={u('frame')} x2={1} y2={0} stops={[[0, '#f3d48c'], [0.5, '#c79a45'], [1, '#8a6425']]} />
        </defs>
        <Shadow u={u} f={f} cx={40} cy={212} rx={34} ry={5} />
        <path d="M14 212 L30 190 M66 212 L50 190" stroke="#5a4328" strokeWidth="5" strokeLinecap="round" />
        <rect x="8" y="6" width="64" height="192" rx="30" fill={f('frame')} />
        <rect x="14" y="12" width="52" height="180" rx="26" fill={f('glass')} />
        <path d="M24 40 L44 120 M24 76 L34 104" stroke="#fff" strokeOpacity="0.6" strokeWidth="5" strokeLinecap="round" />
        <path d="M56 150 q-4 20 -12 30" stroke="#fff" strokeOpacity="0.3" strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    ),
  },

  /* ---------------- kitchen ---------------- */
  'kitchen-table': {
    w: 24,
    vb: '0 0 240 150',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('top')} stops={[[0, '#f0d3a8'], [1, '#d3a874']]} />
          <Lin id={u('leg')} x2={1} y2={0} stops={[[0, '#c58a55'], [1, '#8f5a33']]} />
          <Lin id={u('seat')} stops={[[0, '#ff8f78'], [1, '#d6523d']]} />
        </defs>
        <Shadow u={u} f={f} cx={120} cy={142} rx={108} ry={7} />
        <path d="M112 76 h16 l4 56 h-24z" fill={f('leg')} />
        <ellipse cx="120" cy="134" rx="30" ry="6" fill="#8f5a33" />
        <ellipse cx="120" cy="72" rx="84" ry="18" fill="#a77544" />
        <ellipse cx="120" cy="66" rx="84" ry="18" fill={f('top')} />
        <ellipse cx="96" cy="62" rx="40" ry="6" fill="#fff" opacity="0.2" />
        <rect x="104" y="48" width="16" height="12" rx="3" fill="#fffaf2" />
        <path d="M120 52 q5 1 0 6" stroke="#fffaf2" strokeWidth="2" fill="none" />
        <path d="M30 118 l-4 24 M70 118 l4 24" stroke="#4b4540" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="50" cy="114" rx="26" ry="9" fill={f('seat')} />
        <ellipse cx="50" cy="110" rx="26" ry="9" fill="#ff9f8a" />
        <path d="M170 118 l-4 24 M210 118 l4 24" stroke="#4b4540" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="190" cy="114" rx="26" ry="9" fill={f('seat')} />
        <ellipse cx="190" cy="110" rx="26" ry="9" fill="#ff9f8a" />
      </>
    ),
  },
  'stove-range': {
    w: 13,
    vb: '0 0 110 130',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('steel')} x2={1} y2={0} stops={[[0, '#eef1f5'], [0.5, '#c4cad3'], [1, '#8e97a4']]} />
          <Lin id={u('glass')} stops={[[0, '#2b3342'], [1, '#12161f']]} />
        </defs>
        <Shadow u={u} f={f} cx={55} cy={124} rx={48} ry={5} />
        <rect x="8" y="22" width="94" height="100" rx="6" fill={f('steel')} />
        <path d="M6 22 l8 -14 h82 l8 14z" fill="#3a404a" />
        {[32, 78].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="15" rx="13" ry="3.6" fill="#1b1f27" />
            <ellipse cx={x} cy="15" rx="8" ry="2.2" fill="#ff7a3a" className="twinkle" />
          </g>
        ))}
        {[22, 42, 62, 82].map((x) => (
          <circle key={x} cx={x + 4} cy="34" r="4.4" fill="#2b3342" />
        ))}
        <rect x="16" y="46" width="78" height="66" rx="5" fill="#9aa3b0" />
        <rect x="20" y="50" width="70" height="8" rx="2" fill={f('steel')} />
        <rect x="22" y="62" width="66" height="40" rx="4" fill={f('glass')} />
        <path d="M28 68 L44 96" stroke="#fff" strokeOpacity="0.3" strokeWidth="5" strokeLinecap="round" />
        <path d="M14 122 v4 M96 122 v4" stroke="#4b4540" strokeWidth="5" strokeLinecap="round" />
      </>
    ),
  },
  'coffee-machine': {
    w: 8,
    vb: '0 0 80 100',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('body')} x2={1} y2={0} stops={[[0, '#4a4f5c'], [1, '#1f232b']]} />
          <Lin id={u('cof')} stops={[[0, '#8a5a3a'], [1, '#4a2a18']]} />
        </defs>
        <Shadow u={u} f={f} cx={40} cy={96} rx={34} ry={4} />
        <rect x="10" y="6" width="60" height="22" rx="8" fill={f('body')} />
        <rect x="10" y="20" width="12" height="70" rx="3" fill={f('body')} />
        <rect x="10" y="84" width="60" height="9" rx="3" fill="#15181e" />
        <rect x="30" y="28" width="22" height="10" rx="2" fill="#8e97a4" />
        <path d="M36 38 v8 M46 38 v8" stroke="#aab3c0" strokeWidth="3" />
        <rect x="30" y="58" width="24" height="26" rx="3" fill="#fff" opacity="0.85" />
        <rect x="31" y="68" width="22" height="15" rx="2" fill={f('cof')} />
        <path d="M54 62 q8 2 6 12 q-2 4 -6 4" stroke="#fff" strokeWidth="3" fill="none" />
        <circle cx="58" cy="16" r="3" fill="#ff5a4f" />
        <circle cx="48" cy="16" r="3" fill="#7cffb0" className="twinkle" />
      </>
    ),
  },
  toaster: {
    w: 7,
    vb: '0 0 80 56',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('chr')} x2={1} y2={0} stops={[[0, '#f4f6f9'], [0.45, '#b9c0ca'], [1, '#7e8794']]} />
        </defs>
        <Shadow u={u} f={f} cx={40} cy={52} rx={34} ry={4} />
        <path d="M24 16 q0 -10 6 -10 h4 v14z M46 16 q0 -10 6 -10 h4 v14z" fill="#e8b866" />
        <rect x="8" y="14" width="64" height="34" rx="14" fill={f('chr')} />
        <rect x="16" y="14" width="48" height="5" rx="2.5" fill="#262b34" />
        <path d="M14 24 q4 -4 14 -4" stroke="#fff" strokeOpacity="0.7" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="70" y="26" width="6" height="12" rx="3" fill="#ff5a4f" />
        <circle cx="22" cy="40" r="3" fill="#262b34" />
      </>
    ),
  },
  'fruit-bowl': {
    w: 8,
    vb: '0 0 100 60',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('bowl')} stops={[[0, '#7fc8d6'], [1, '#3f8fa3']]} />
          <Rad id={u('ap')} cx={0.35} cy={0.3} r={0.8} stops={[[0, '#ff9a8a'], [1, '#c8362a']]} />
        </defs>
        <Shadow u={u} f={f} cx={50} cy={56} rx={40} ry={4} />
        <circle cx="34" cy="22" r="13" fill={f('ap')} />
        <path d="M34 9 q2 -6 8 -6" stroke="#4b7a3a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <circle cx="62" cy="24" r="12" fill="#ffb347" />
        <circle cx="58" cy="19" r="3" fill="#fff" opacity="0.4" />
        <path d="M40 24 q20 -22 44 -6 q-18 -4 -40 14z" fill="#ffd84a" />
        <path d="M10 28 h80 q-4 24 -20 26 h-40 q-16 -2 -20 -26z" fill={f('bowl')} />
        <path d="M16 34 q10 14 24 16" stroke="#fff" strokeOpacity="0.45" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="8" y="26" width="84" height="5" rx="2.5" fill="#a8dce6" />
      </>
    ),
  },
  'wall-shelf-spices': {
    w: 14,
    vb: '0 0 160 80',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('wood')} stops={[[0, '#d9a06b'], [1, '#a8703f']]} />
        </defs>
        {[
          [14, '#e2674f', 'chili'],
          [42, '#ffd36b', 'curry'],
          [70, '#7fd6a0', 'herb'],
          [98, '#b58cf0', 'sumac'],
          [126, '#ff9f5a', 'paprika'],
        ].map(([x, c], i) => (
          <g key={i}>
            <rect x={x} y={20 + (i % 2) * 4} width="22" height={36 - (i % 2) * 4} rx="4" fill="#fffaf2" opacity="0.9" />
            <rect x={x + 2} y={30 + (i % 2) * 4} width="18" height="16" rx="2" fill={c} />
            <rect x={x - 1} y={14 + (i % 2) * 4} width="24" height="8" rx="3" fill="#4b4540" />
            <path d={`M${x + 5} ${26 + (i % 2) * 4} v18`} stroke="#fff" strokeOpacity="0.5" strokeWidth="2.4" strokeLinecap="round" />
          </g>
        ))}
        <rect x="2" y="56" width="156" height="10" rx="3" fill={f('wood')} />
        <rect x="2" y="56" width="156" height="3" rx="1.5" fill="#fff" opacity="0.35" />
        <path d="M14 66 v8 h8 M138 66 v8 h8" stroke="#6b4a2a" strokeWidth="4" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  'pendant-kitchen': {
    w: 10,
    glow: { x: 50, y: 82, r: 44, c: '#ffcf8a' },
    vb: '0 0 80 150',
    draw: (u, f) => (
      <>
        <defs>
          <Rad id={u('glass')} cx={0.4} cy={0.35} r={0.8} stops={[[0, '#fff2cf'], [0.5, '#ffc46b'], [1, '#e08a3a']]} />
        </defs>
        <path d="M40 0 V78" stroke="#2b2b2b" strokeWidth="1.6" />
        <rect x="34" y="70" width="12" height="14" rx="3" fill="#2b3342" />
        <circle cx="40" cy="112" r="28" fill="#fff0c2" opacity="0.22" />
        <path d="M18 112 a22 22 0 0 1 44 0 a22 22 0 0 1 -44 0z" fill={f('glass')} />
        <path d="M26 100 q4 -10 14 -12" stroke="#fff" strokeOpacity="0.75" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M36 82 h8 l2 8 h-12z" fill="#2b3342" />
      </>
    ),
  },
  'kitchen-island': {
    w: 24,
    vb: '0 0 240 130',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('top')} stops={[[0, '#e9cfa6'], [1, '#c79f6d']]} />
          <Lin id={u('body')} x2={1} y2={0} stops={[[0, '#4f8f9a'], [1, '#2f6370']]} />
        </defs>
        <Shadow u={u} f={f} cx={120} cy={124} rx={112} ry={6} />
        <rect x="14" y="40" width="212" height="76" rx="6" fill={f('body')} />
        <rect x="6" y="28" width="228" height="16" rx="5" fill="#a77544" />
        <rect x="6" y="24" width="228" height="14" rx="5" fill={f('top')} />
        <rect x="6" y="24" width="228" height="3" rx="1.5" fill="#fff" opacity="0.4" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={24 + i * 68} y="52" width="60" height="56" rx="4" fill="#000" opacity="0.14" />
            <rect x={26 + i * 68} y="54" width="56" height="52" rx="3" fill="#5ea0ac" />
            <rect x={46 + i * 68} y="60" width="16" height="3" rx="1.5" fill="#f3d48c" />
          </g>
        ))}
        <rect x="150" y="14" width="40" height="10" rx="3" fill="#8f5a33" />
        <path d="M60 24 q4 -16 18 -16 q14 0 16 16z" fill="#fffaf2" />
        <path d="M70 12 q2 -8 8 -9" stroke="#4b7a3a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M20 116 v8 M220 116 v8" stroke="#1f3a42" strokeWidth="6" strokeLinecap="round" />
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
  ...MORE_ART,
};

export function Art({ id, className = '', ...rest }) {
  const raw = useId();
  const a = ART[id];
  if (!a) return null;
  const p = 'a' + raw.replace(/[^a-zA-Z0-9]/g, '');
  const u = (k) => `${p}-${k}`;
  const f = (k) => `url(#${p}-${k})`;
  return (
    <svg viewBox={a.vb} preserveAspectRatio={a.par} className={`art art-${id} ${className}`} aria-hidden="true" focusable="false" {...rest}>
      {a.draw(u, f)}
    </svg>
  );
}
