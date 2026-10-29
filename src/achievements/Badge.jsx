'use client';

import { useId } from 'react';
import { GLYPHS, BY_EMOJI } from '@/components/Icon';

// The pictures on the achievements page, drawn instead of emoji. An
// achievement's emoji (`icon` in economy/achievements.js) stays its stable id;
// here it picks a line glyph on the app's 24x24 grid (Icon.jsx's set, plus a
// few only achievements need), drawn in white on a hexagonal badge. The badge
// is coloured by category, and its rim turns bronze, silver, then gold as the
// medals are claimed. Light comes from the top left, as in the house art.

// Extra glyphs, same layers as Icon.jsx: f fill, l line, b both, s solid.
const MORE = {
  wing: [['b', 'M3 15.5 C3 8.5 8.5 4 21 4 c-1 3 -3 5 -6 6 c1.6 0.2 2.8 0 4 -0.5 c-1.2 3 -3.6 4.6 -6.5 5 c1.3 0.4 2.4 0.4 3.5 0 c-2 3 -5 4.5 -9 4.5 C5 19 3 17.8 3 15.5 z'], ['l', 'M3.5 15 c4.5 -1.5 8 -4.5 10.5 -8']],
  note: [['l', 'M11.5 17.5 V4 l8 2.5 v3.5 l-8 -2.5'], ['b', 'M11.5 4 l8 2.5 v3.5 l-8 -2.5 z'], ['b', 'M5 17.5 a3.25 2.6 0 1 0 6.5 0 a3.25 2.6 0 1 0 -6.5 0 z']],
  cloud: [['b', 'M7 19 a4.5 4.5 0 0 1 -0.6 -8.96 a6 6 0 0 1 11.5 -1.4 A5.2 5.2 0 0 1 17.2 19 z'], ['l', 'M9 14.5 a3 3 0 0 1 3 -2.5']],
  hammer: [['l', 'M10.8 10.8 L20.2 20.2'], ['b', 'M13.3 6.2 L9.8 2.7 L2.7 9.8 L6.2 13.3 z'], ['l', 'M11.5 4.4 L4.4 11.5']],
  dash: [['b', 'M9.5 5 L19.5 12 L9.5 19 z'], ['l', 'M2.5 8 h4 M3.5 12 h3 M2.5 16 h4']],
  tower: [['b', 'M4 16.5 h15 v4 H4 z'], ['b', 'M5.5 12 h13 v4.5 h-13 z'], ['b', 'M7 7.5 h11 v4.5 H7 z'], ['b', 'M9.5 3.5 h7 v4 h-7 z']],
  knife: [['b', 'M21 3 C17 4 11.5 7.8 8.6 12.4 l3 3 C16.2 12.5 20 7 21 3 z'], ['b', 'M8.3 12.7 l3 3 l-5.4 5.4 a2.1 2.1 0 0 1 -3 -3 z']],
  coins: [['f', 'M5 6.5 v9 c0 1.7 3.1 3 7 3 s7 -1.3 7 -3 v-9 z'], ['b', 'M5 6.5 a7 3 0 1 0 14 0 a7 3 0 1 0 -14 0 z'], ['l', 'M5 6.5 v9 c0 1.7 3.1 3 7 3 s7 -1.3 7 -3 v-9 M5 11 c0 1.7 3.1 3 7 3 s7 -1.3 7 -3']],
  donut: [['b', 'M3 12 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 z M9 12 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 z'], ['l', 'M7 8 l1 0.6 M15.5 6.5 l-0.4 1 M17 14.5 l-1 -0.4 M10 17 l0.6 -0.9']],
  bag: [['b', 'M5 8 h14 l-1.2 12 a1.5 1.5 0 0 1 -1.5 1.4 H7.7 a1.5 1.5 0 0 1 -1.5 -1.4 z'], ['l', 'M9 10 V6.5 a3 3 0 0 1 6 0 V10']],
  chair: [['b', 'M7 3 h10 v9 H7 z'], ['b', 'M5 12 h14 v3 H5 z'], ['l', 'M7 15 v6 M17 15 v6']],
  flask: [['l', 'M9.5 3 h5 M10.5 3 v5.5 L5 18.5 a2 2 0 0 0 1.8 2.9 h10.4 a2 2 0 0 0 1.8 -2.9 L13.5 8.5 V3'], ['f', 'M7.6 14 h8.8 l2.6 4.5 a2 2 0 0 1 -1.8 2.9 H6.8 a2 2 0 0 1 -1.8 -2.9 z'], ['s', 'M9.5 17.5 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 z']],
  dice: [['b', 'M4 4 h16 v16 H4 z'], ['s', 'M7 7 a1.3 1.3 0 1 0 2.6 0 a1.3 1.3 0 1 0 -2.6 0 z M14.4 7 a1.3 1.3 0 1 0 2.6 0 a1.3 1.3 0 1 0 -2.6 0 z M10.7 12 a1.3 1.3 0 1 0 2.6 0 a1.3 1.3 0 1 0 -2.6 0 z M7 17 a1.3 1.3 0 1 0 2.6 0 a1.3 1.3 0 1 0 -2.6 0 z M14.4 17 a1.3 1.3 0 1 0 2.6 0 a1.3 1.3 0 1 0 -2.6 0 z']],
  medal: [['l', 'M7 2.5 l3 7 M17 2.5 l-3 7'], ['b', 'M6.5 15.5 a5.5 5.5 0 1 0 11 0 a5.5 5.5 0 1 0 -11 0 z'], ['l', 'M12 13 v5 M10.5 14 l1.5 -1']],
  gem: [['b', 'M7 4 h10 l4 5 -9 11 -9 -11 z'], ['l', 'M3 9 h18 M9.5 4 l2.5 5 2.5 -5 M12 9 v11']],
};
const MORE_BY_EMOJI = { '🪽': 'wing', '🎵': 'note', '☁️': 'cloud', '☁': 'cloud', '🔨': 'hammer', '🏃': 'dash', '🗼': 'tower', '🔪': 'knife', '🪙': 'coins', '🍩': 'donut', '🛍️': 'bag', '🪑': 'chair', '🧪': 'flask', '🎲': 'dice', '🥇': 'medal', '💎': 'gem' };

const layersOf = (emoji) => (MORE_BY_EMOJI[emoji] ? MORE[MORE_BY_EMOJI[emoji]] : GLYPHS[BY_EMOJI[emoji]]?.[1]) ?? MORE.coins;

// Category body colours, top to bottom.
const CAT = {
  adventure: ['#ffa07c', '#e0483a', '#9e2a22'],
  story: ['#c2adff', '#6a48dc', '#3f2696'],
  home: ['#6fe0cd', '#1f938c', '#0f5c58'],
  daily: ['#86cfff', '#2f6fd8', '#1a4296'],
  legend: ['#ffe9a0', '#d49a12', '#7a5200'],
};

// Rim metals by medals claimed: none, bronze, silver, gold (light, mid, dark).
export const METAL = {
  steel: ['#dfe3ee', '#8b93ad', '#4a5068'],
  bronze: ['#f8cfa4', '#c27a3e', '#7c4316'],
  silver: ['#ffffff', '#c3cad6', '#727b8c'],
  gold: ['#fff3b0', '#f2c230', '#a8730a'],
  platinum: ['#ffffff', '#b8c8dc', '#5d6f8a'],
  diamond: ['#ecfdff', '#7fdcf5', '#1f7fa6'],
};
const RIM = ['steel', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];

// A pointy-top hexagon with rounded corners, as a path.
function hex(cx, cy, r, round) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const t = ((i * 60 - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  });
  const k = round / r; // the side is as long as the radius
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const n = (p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  return (
    pts
      .map((p, i) => {
        const a = lerp(p, pts[(i + 5) % 6], k);
        const b = lerp(p, pts[(i + 1) % 6], k);
        return `${i ? 'L' : 'M'}${n(a)} Q${n(p)} ${n(b)}`;
      })
      .join(' ') + ' Z'
  );
}
const OUTER = hex(26, 28, 25.5, 6);
const INNER = hex(26, 28, 20.5, 4.5);
const SHINE = 'M0 0 H52 V21 C40 27.5 12 27.5 0 21 Z'; // clipped to the body

function Glyph({ layers, color, op = 1 }) {
  return layers.map(([k, d], i) => (
    <path
      key={i}
      d={d}
      fill={k === 'l' ? 'none' : color}
      fillOpacity={k === 's' ? op : 0.28 * op}
      stroke={k === 'l' || k === 'b' ? color : 'none'}
      strokeOpacity={op}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      fillRule="evenodd"
    />
  ));
}

// One achievement's badge: `a` from ACHIEVEMENTS, `level` medals claimed.
export default function Badge({ a, level = 0, size = 52, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const u = (name) => `${uid}-${name}`;
  const f = (name) => `url(#${u(name)})`;
  const [c1, c2, c3] = CAT[a.cat] ?? CAT.adventure;
  const [m1, m2, m3] = METAL[a.medals ? (level ? a.medals[0] : 'steel') : RIM[Math.min(level, RIM.length - 1)]];
  const layers = layersOf(a.icon);

  return (
    <svg className={`badge ${className}`.trim()} width={size} height={(size * 56) / 52} viewBox="0 0 52 56" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={u('rim')} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={m1} />
          <stop offset="0.5" stopColor={m2} />
          <stop offset="1" stopColor={m3} />
        </linearGradient>
        <linearGradient id={u('body')} x1="0.2" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="0.55" stopColor={c2} />
          <stop offset="1" stopColor={c3} />
        </linearGradient>
        <linearGradient id={u('shine')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.04" />
        </linearGradient>
        <clipPath id={u('clip')}>
          <path d={INNER} />
        </clipPath>
      </defs>
      <path d={OUTER} fill={f('rim')} />
      <path d={OUTER} fill="none" stroke={m3} strokeOpacity="0.6" strokeWidth="0.8" />
      <path d={INNER} fill={f('body')} />
      <path d={INNER} fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="1" />
      <path d={SHINE} fill={f('shine')} clipPath={f('clip')} />
      <g transform="translate(12.2 14.6) scale(1.15)">
        <g transform="translate(0 0.9)">
          <Glyph layers={layers} color="#000" op={0.22} />
        </g>
        <Glyph layers={layers} color="#fff" />
      </g>
    </svg>
  );
}

// A five-point star, as a path.
function star(cx, cy, R, r) {
  return (
    Array.from({ length: 10 }, (_, i) => {
      const t = ((i * 36 - 90) * Math.PI) / 180;
      const d = i % 2 ? r : R;
      return `${i ? 'L' : 'M'}${(cx + d * Math.cos(t)).toFixed(2)} ${(cy + d * Math.sin(t)).toFixed(2)}`;
    }).join(' ') + ' Z'
  );
}
const STAR = star(14, 23.5, 5, 2.2);

const OFF = { color: 'var(--medal-off, #fff)' };

// One medal of the bronze/silver/gold row. `state`: got, ready or locked.
export function MedalArt({ medal, state, size = 30 }) {
  const uid = useId().replace(/:/g, '');
  const id = `${uid}-m`;
  const [m1, m2, m3] = METAL[medal];
  const off = state === 'locked';

  return (
    <svg className="medal-art" width={size} height={(size * 36) / 28} viewBox="0 0 28 36" aria-hidden="true" focusable="false">
      {!off && (
        <defs>
          <radialGradient id={id} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor={m1} />
            <stop offset="0.6" stopColor={m2} />
            <stop offset="1" stopColor={m3} />
          </radialGradient>
        </defs>
      )}
      {/* a locked medal is an outline in --medal-off (white on the dark arcade, brown on light pages) */}
      <path d="M6 1 h6 l3.6 12.5 h-6 z" fill={off ? 'currentColor' : '#e2674f'} fillOpacity={off ? 0.08 : 1} style={off ? OFF : undefined} />
      <path d="M22 1 h-6 l-3.6 12.5 h6 z" fill={off ? 'currentColor' : '#a83d2c'} fillOpacity={off ? 0.12 : 1} style={off ? OFF : undefined} />
      <circle cx="14" cy="23.5" r="10.5" fill={off ? 'currentColor' : `url(#${id})`} fillOpacity={off ? 0.05 : 1} stroke={off ? 'currentColor' : m3} strokeOpacity={off ? 0.22 : 1} strokeWidth="1" style={off ? OFF : undefined} />
      <circle cx="14" cy="23.5" r="7.8" fill="none" stroke={off ? 'currentColor' : m3} strokeOpacity={off ? 0.12 : 0.55} strokeWidth="0.9" style={off ? OFF : undefined} />
      <path d={STAR} fill={off ? 'none' : m3} fillOpacity="0.7" stroke={off ? 'currentColor' : 'none'} strokeOpacity={off ? 0.25 : 1} strokeWidth="1" strokeLinejoin="round" style={off ? OFF : undefined} />
      {!off && <path d="M6.6 19.5 A8.6 8.6 0 0 1 10.5 15.4" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.3" strokeLinecap="round" />}
    </svg>
  );
}
