import { Lin, Rad, Shadow, Gloss } from './svg';

// More furniture, drawn the same way as art.jsx (merged into its ART): soft
// gradients, light from the top left, a contact shadow under floor pieces.
// The last group is Cursor's Collection, the pieces the final levels ask for.

const Pointer = ({ fill, stroke = '#1d1d24', w = 3, t = '' }) => (
  <path d="M0 0 L0 46 L11 35 L19 53 L27 49 L19 32 L34 32 Z" fill={fill} stroke={stroke} strokeWidth={w} strokeLinejoin="round" transform={t} />
);

export const MORE_ART = {
  /* ---------------- living room and bedroom ---------------- */
  'arcade-cabinet': {
    w: 15,
    glow: { x: 50, y: 32, r: 40, c: '#7cd6ff' },
    vb: '0 0 100 190',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('side')} x2={1} y2={0} stops={[[0, '#3b2f6b'], [1, '#231a46']]} />
          <Lin id={u('front')} stops={[[0, '#5a46a8'], [1, '#3a2c78']]} />
          <Lin id={u('scr')} stops={[[0, '#123049'], [1, '#0a1a2a']]} />
          <Gloss id={u('gl')} />
        </defs>
        <Shadow u={u} f={f} cx={50} cy={184} rx={46} ry={5} />
        <path d="M10 8 h80 v176 h-80z" fill={f('side')} />
        <path d="M16 4 h68 l4 10 h-76z" fill="#ff5ea8" />
        <rect x="18" y="6" width="64" height="6" rx="2" fill="#fff" opacity="0.25" />
        <path d="M16 16 h68 v96 l-6 8 h-56 l-6 -8z" fill={f('front')} />
        <rect x="22" y="24" width="56" height="58" rx="4" fill={f('scr')} />
        <g fill="#7cd6ff">
          <rect x="30" y="34" width="6" height="6" />
          <rect x="44" y="34" width="6" height="6" />
          <rect x="58" y="34" width="6" height="6" />
          <rect x="37" y="44" width="6" height="6" fill="#ff5ea8" />
          <rect x="51" y="44" width="6" height="6" fill="#ff5ea8" />
          <rect x="44" y="66" width="10" height="6" fill="#ffd34d" />
        </g>
        <rect x="22" y="24" width="56" height="58" rx="4" fill={f('gl')} opacity="0.35" />
        <path d="M12 120 h76 l-4 16 h-68z" fill="#2c2258" />
        <circle cx="34" cy="126" r="4" fill="#1b1b1b" />
        <rect x="33" y="114" width="2" height="12" fill="#1b1b1b" />
        <circle cx="34" cy="113" r="4" fill="#ff4d4d" />
        <circle cx="56" cy="127" r="4" fill="#ffd34d" />
        <circle cx="68" cy="127" r="4" fill="#4dd2ff" />
        <path d="M16 136 h68 v48 h-68z" fill={f('front')} />
        <rect x="40" y="150" width="20" height="14" rx="2" fill="#1b1540" />
        <rect x="47" y="154" width="6" height="6" rx="1" fill="#ffd34d" />
      </>
    ),
  },
  'bookcase-tall': {
    w: 13,
    vb: '0 0 90 190',
    draw: (u, f) => {
      const books = [
        ['#c44d3a', 8], ['#3f7fbf', 7], ['#e3b23c', 9], ['#5d9b6a', 6], ['#8a5aa8', 8], ['#d97a4a', 7],
        ['#2f5d7c', 9], ['#b33f5f', 6], ['#6f8f3f', 8], ['#e08f3c', 7],
      ];
      const shelf = (y, off) => {
        let x = 12;
        return books.slice(off, off + 6).map(([c, w], i) => {
          const h = 30 + ((i * 7 + off) % 9);
          const el = <rect key={i} x={x} y={y - h} width={w} height={h} rx="1" fill={c} />;
          x += w + 1;
          return el;
        });
      };
      return (
        <>
          <defs>
            <Lin id={u('wood')} x2={1} y2={0} stops={[[0, '#a3734c'], [1, '#6e4a2e']]} />
            <Lin id={u('back')} stops={[[0, '#4d3320'], [1, '#3a2617']]} />
          </defs>
          <Shadow u={u} f={f} cx={45} cy={185} rx={44} ry={5} />
          <rect x="4" y="4" width="82" height="180" rx="3" fill={f('wood')} />
          <rect x="10" y="10" width="70" height="168" fill={f('back')} />
          {[52, 96, 140].map((y) => (
            <rect key={y} x="8" y={y} width="74" height="5" fill="#8a5d3b" />
          ))}
          {shelf(52, 0)}
          {shelf(96, 3)}
          {shelf(140, 1)}
          <path d="M62 140 q8 -18 14 -2" fill="#5d9b6a" />
          <rect x="60" y="128" width="16" height="12" rx="2" fill="#d9c7a6" />
          <circle cx="66" cy="76" r="10" fill="#e8dcc6" />
          <circle cx="66" cy="76" r="6" fill="#3f7fbf" opacity="0.6" />
          <rect x="12" y="150" width="66" height="26" rx="2" fill="#7a5234" />
          <circle cx="45" cy="163" r="2.5" fill="#e6c27a" />
          <path d="M8 8 v172" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" />
        </>
      );
    },
  },
  'aquarium-big': {
    w: 22,
    glow: { x: 50, y: 40, r: 50, c: '#7fd8ff' },
    vb: '0 0 160 130',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('water')} stops={[[0, '#7fd3f0', 0.85], [1, '#2a7fb0', 0.9]]} />
          <Lin id={u('stand')} stops={[[0, '#3b4150'], [1, '#232733']]} />
          <Gloss id={u('gl')} />
        </defs>
        <Shadow u={u} f={f} cx={80} cy={125} rx={76} ry={5} />
        <rect x="10" y="84" width="140" height="40" rx="4" fill={f('stand')} />
        <rect x="18" y="92" width="58" height="26" rx="2" fill="#2d3240" />
        <rect x="84" y="92" width="58" height="26" rx="2" fill="#2d3240" />
        <rect x="6" y="8" width="148" height="78" rx="4" fill="#cfe8f2" opacity="0.35" />
        <rect x="10" y="14" width="140" height="70" rx="3" fill={f('water')} />
        <path d="M10 76 q20 -8 40 0 t40 0 t40 0 t20 -2 v12 h-140z" fill="#e8d29a" />
        <path d="M28 76 q-4 -20 2 -40 M30 76 q6 -18 0 -32 M120 78 q-6 -22 4 -44 M126 78 q6 -16 -2 -30" stroke="#3c9a55" strokeWidth="4" fill="none" strokeLinecap="round" />
        <g>
          <path d="M60 40 q10 -10 22 0 q-12 10 -22 0z" fill="#ff8a3d" />
          <path d="M82 40 l8 -6 v12z" fill="#ff8a3d" />
          <circle cx="66" cy="39" r="1.6" fill="#1b1b1b" />
        </g>
        <g>
          <path d="M100 58 q8 -8 18 0 q-10 8 -18 0z" fill="#ffd34d" />
          <path d="M118 58 l6 -5 v10z" fill="#ffd34d" />
          <circle cx="104" cy="57" r="1.4" fill="#1b1b1b" />
        </g>
        <g fill="#fff" opacity="0.7">
          <circle cx="58" cy="28" r="2" />
          <circle cx="55" cy="20" r="1.4" />
          <circle cx="97" cy="46" r="1.6" />
        </g>
        <rect x="4" y="6" width="152" height="8" rx="3" fill="#3b4150" />
        <rect x="14" y="18" width="40" height="60" fill={f('gl')} opacity="0.35" />
      </>
    ),
  },
  'piano-upright': {
    w: 24,
    vb: '0 0 180 150',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('lac')} stops={[[0, '#3a2a24'], [1, '#1c1210']]} />
          <Gloss id={u('gl')} />
        </defs>
        <Shadow u={u} f={f} cx={90} cy={145} rx={88} ry={5} />
        <rect x="8" y="8" width="164" height="132" rx="6" fill={f('lac')} />
        <rect x="8" y="8" width="164" height="40" rx="6" fill={f('gl')} opacity="0.25" />
        <rect x="4" y="4" width="172" height="10" rx="4" fill="#2a1d19" />
        <rect x="70" y="22" width="40" height="26" rx="2" fill="#efe6d2" />
        <path d="M76 30 h28 M76 36 h28 M76 42 h20" stroke="#6b5446" strokeWidth="1" />
        <rect x="4" y="62" width="172" height="12" rx="2" fill="#1c1210" />
        <rect x="10" y="64" width="160" height="22" fill="#fbf8f1" />
        {Array.from({ length: 19 }, (_, i) => (
          <path key={i} d={`M${10 + (i + 1) * 8.4} 64 v22`} stroke="#c9c2b4" strokeWidth="0.8" />
        ))}
        {[0, 1, 3, 4, 5, 7, 8, 10, 11, 12, 14, 15, 17].map((i) => (
          <rect key={i} x={10 + (i + 1) * 8.4 - 2.6} y="64" width="5.2" height="13" fill="#1b1b1b" />
        ))}
        <rect x="16" y="98" width="148" height="30" rx="3" fill="#2a1d19" />
        <rect x="14" y="132" width="10" height="10" fill="#1c1210" />
        <rect x="156" y="132" width="10" height="10" fill="#1c1210" />
        <circle cx="80" cy="138" r="2" fill="#d9b25a" />
        <circle cx="100" cy="138" r="2" fill="#d9b25a" />
        <path d="M130 34 l10 -14 l-4 16 M138 34 a4 3 0 1 1 -1 -1" fill="#e6d7b0" opacity="0.9" />
      </>
    ),
  },
  'plant-bonsai': {
    w: 10,
    vb: '0 0 100 90',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('pot')} x2={1} y2={0} stops={[[0, '#4f6d8f'], [1, '#2f4762']]} />
          <Rad id={u('leaf')} cx={0.35} cy={0.3} r={0.8} stops={[[0, '#9ad27f'], [1, '#3f7f3f']]} />
        </defs>
        <Shadow u={u} f={f} cx={50} cy={86} rx={40} ry={4} />
        <path d="M50 70 q-4 -14 -16 -22 q10 2 16 10 q2 -16 16 -26 q-8 14 -10 28z" fill="#6e4a2e" />
        <ellipse cx="30" cy="40" rx="20" ry="11" fill={f('leaf')} />
        <ellipse cx="66" cy="28" rx="24" ry="13" fill={f('leaf')} />
        <ellipse cx="52" cy="16" rx="16" ry="9" fill={f('leaf')} />
        <path d="M18 70 h64 l-6 14 h-52z" fill={f('pot')} />
        <rect x="14" y="66" width="72" height="7" rx="3" fill="#5d7fa3" />
        <path d="M24 74 h52" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.5" />
      </>
    ),
  },
  'plant-hanging': {
    w: 11,
    vb: '0 0 80 150',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('pot')} x2={1} y2={0} stops={[[0, '#f1ebe0'], [1, '#c9bfae']]} />
          <Lin id={u('vine')} stops={[[0, '#5aa45a'], [1, '#2f6e3a']]} />
        </defs>
        <path d="M40 0 V60 M40 60 L18 88 M40 60 L62 88" stroke="#b08a5a" strokeWidth="1.6" fill="none" />
        <path d="M14 88 h52 q0 22 -26 22 q-26 0 -26 -22z" fill={f('pot')} />
        <path d="M18 92 h44" stroke="#a89c86" strokeWidth="1.5" />
        <g fill={f('vine')}>
          {[[16, 96], [22, 112], [18, 128], [26, 142], [60, 98], [58, 116], [64, 132], [40, 110], [36, 126]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="6" ry="4" transform={`rotate(${(i % 2 ? 30 : -30)} ${x} ${y})`} />
          ))}
        </g>
        <path d="M18 90 q-6 20 2 40 q2 8 6 12 M62 90 q6 16 -2 30 q-2 8 2 12 M40 104 q-6 12 -4 22" stroke="#3c8045" strokeWidth="2" fill="none" />
        <ellipse cx="30" cy="86" rx="10" ry="5" fill="#5aa45a" />
        <ellipse cx="50" cy="85" rx="10" ry="5" fill="#4b9550" />
      </>
    ),
  },
  chandelier: {
    w: 20,
    glow: { x: 50, y: 70, r: 60, c: '#ffe2a6' },
    vb: '0 0 160 130',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('gold')} x2={1} y2={0} stops={[[0, '#f6dc8f'], [0.5, '#c99a2e'], [1, '#8a6417']]} />
          <Rad id={u('flame')} cx={0.5} cy={0.6} r={0.6} stops={[[0, '#fffbe8'], [0.6, '#ffd36b'], [1, '#ff9f3d', 0]]} />
        </defs>
        <path d="M80 0 V34" stroke="#6b5446" strokeWidth="2" />
        <circle cx="80" cy="40" r="8" fill={f('gold')} />
        <path d="M80 48 V84" stroke={f('gold')} strokeWidth="5" />
        <path d="M80 70 Q40 70 22 86 M80 70 Q120 70 138 86 M80 76 Q56 80 48 94 M80 76 Q104 80 112 94" stroke={f('gold')} strokeWidth="4" fill="none" strokeLinecap="round" />
        {[22, 48, 112, 138].map((x, i) => {
          const y = i === 1 || i === 2 ? 94 : 86;
          return (
            <g key={x}>
              <rect x={x - 6} y={y - 2} width="12" height="5" rx="2" fill={f('gold')} />
              <rect x={x - 2.5} y={y - 16} width="5" height="14" rx="1" fill="#fbf5e6" />
              <ellipse cx={x} cy={y - 21} rx="5" ry="8" fill={f('flame')} />
            </g>
          );
        })}
        <g fill="#e6f4ff" stroke="#9fc4dd" strokeWidth="0.8">
          {[34, 58, 80, 102, 126].map((x, i) => (
            <path key={x} d={`M${x} ${100 + (i % 2) * 8} l4 8 l-4 8 l-4 -8z`} />
          ))}
        </g>
        <ellipse cx="80" cy="86" rx="10" ry="6" fill={f('gold')} />
        <path d="M80 92 l5 10 l-5 10 l-5 -10z" fill="#e6f4ff" stroke="#9fc4dd" strokeWidth="0.8" />
      </>
    ),
  },
  'painting-sunset': {
    w: 15,
    vb: '0 0 130 96',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('sky')} stops={[[0, '#ff9e6d'], [0.55, '#ffcf7a'], [1, '#ffe7a8']]} />
          <Lin id={u('frame')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#e6c27a'], [1, '#8a6224']]} />
          <Lin id={u('sea')} stops={[[0, '#3f7fbf'], [1, '#22507f']]} />
        </defs>
        <rect x="2" y="2" width="126" height="92" rx="3" fill={f('frame')} />
        <rect x="10" y="10" width="110" height="76" fill={f('sky')} />
        <circle cx="66" cy="56" r="16" fill="#fff3c4" />
        <rect x="10" y="58" width="110" height="28" fill={f('sea')} />
        <path d="M44 64 h44 M52 70 h28 M58 76 h16" stroke="#ffe0a0" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <path d="M10 58 q14 -14 28 -6 q10 -10 22 0 v6z" fill="#7a4a6a" opacity="0.7" />
        <path d="M84 24 q4 -3 8 0 q4 -3 8 0" stroke="#5a3a3a" strokeWidth="1.5" fill="none" />
        <path d="M10 10 h110" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" />
      </>
    ),
  },
  'map-world': {
    w: 16,
    vb: '0 0 140 92',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('paper')} stops={[[0, '#f6ecd4'], [1, '#e4d3ae']]} />
        </defs>
        <path d="M4 6 l44 -4 l44 6 l44 -4 v82 l-44 4 l-44 -6 l-44 4z" fill={f('paper')} stroke="#b9a27a" strokeWidth="1.5" />
        <path d="M48 2 v82 M92 8 v82" stroke="#b9a27a" strokeOpacity="0.6" />
        <g fill="#8bb07a" stroke="#5f8452" strokeWidth="1">
          <path d="M14 22 q12 -10 26 -4 q6 8 -2 14 q-6 12 -12 22 q-8 -6 -6 -14 q-10 -6 -6 -18z" />
          <path d="M60 20 q10 -6 18 0 q2 8 -6 10 q8 6 4 22 q-6 8 -10 -2 q-8 -10 -6 -30z" />
          <path d="M86 18 q22 -6 38 4 q0 10 -12 12 q-8 2 -10 10 q-10 -2 -12 -12 q-6 -6 -4 -14z" />
          <path d="M110 58 q10 -2 14 6 q-4 8 -14 4z" />
        </g>
        <path d="M30 44 q30 -30 72 -14" stroke="#e2674f" strokeWidth="1.8" strokeDasharray="4 3" fill="none" />
        <path d="M100 28 l4 4 m0 -4 l-4 4" stroke="#e2674f" strokeWidth="2" />
        <circle cx="30" cy="44" r="2.5" fill="#e2674f" />
      </>
    ),
  },
  'mirror-round': {
    w: 10,
    vb: '0 0 90 90',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('rim')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#f6dc8f'], [1, '#8a6417']]} />
          <Lin id={u('glass')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#e9f3f8'], [0.6, '#b9cfda'], [1, '#8fa9b8']]} />
        </defs>
        <circle cx="47" cy="47" r="42" fill="#000" opacity="0.14" />
        <circle cx="45" cy="45" r="42" fill={f('rim')} />
        {Array.from({ length: 16 }, (_, i) => (
          <circle key={i} cx={45 + Math.cos((i / 16) * Math.PI * 2) * 39} cy={45 + Math.sin((i / 16) * Math.PI * 2) * 39} r="3" fill="#f6dc8f" />
        ))}
        <circle cx="45" cy="45" r="34" fill={f('glass')} />
        <path d="M26 34 l18 -14 M30 46 l26 -22" stroke="#fff" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" />
      </>
    ),
  },
  'rug-persian': {
    w: 50,
    vb: '0 0 300 80',
    draw: (u, f) => (
      <>
        <defs>
          <Rad id={u('m')} stops={[[0, '#f1d08a'], [0.25, '#c2472f'], [0.5, '#8d2a2a'], [0.85, '#7a2326'], [1, '#5c1a1d']]} />
        </defs>
        <path d="M30 8 h240 l26 64 h-292z" fill="#2a1608" opacity="0.18" transform="translate(0 3)" />
        <path d="M30 8 h240 l26 64 h-292z" fill={f('m')} />
        <path d="M44 14 h212 l20 52 h-252z" fill="none" stroke="#f1d08a" strokeWidth="3" />
        <path d="M58 20 h184 l15 40 h-214z" fill="none" stroke="#2f4f6f" strokeWidth="2" />
        <path d="M150 22 l40 18 l-40 18 l-40 -18z" fill="#2f4f6f" />
        <path d="M150 30 l22 10 l-22 10 l-22 -10z" fill="#f1d08a" />
        <circle cx="150" cy="40" r="4" fill="#c2472f" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => (
          <path key={i} d={`M${6 + i * 20.6} 72 v6`} stroke="#f1e2c0" strokeWidth="2" />
        ))}
      </>
    ),
  },
  'rug-checker': {
    w: 44,
    vb: '0 0 300 80',
    draw: (u, f) => {
      const cells = [];
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 10; c++)
          if ((r + c) % 2 === 0) {
            const y = 10 + r * 15;
            const x0 = 30 - r * 6 + c * (24 + r * 1.2);
            cells.push(<path key={`${r}-${c}`} d={`M${x0} ${y} h${24 + r * 1.2} l-${1.5} 15 h-${24 + r * 1.2}z`} fill="#2e2a3a" />);
          }
      return (
        <>
          <path d="M30 10 h240 l20 62 h-280z" fill="#2a1608" opacity="0.16" transform="translate(0 3)" />
          <path d="M30 10 h240 l20 62 h-280z" fill="#f3ead8" />
          {cells}
          <path d="M30 10 h240 l20 62 h-280z" fill="none" stroke="#e2674f" strokeWidth="3" />
        </>
      );
    },
  },
  'cat-tree': {
    w: 13,
    vb: '0 0 90 180',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('post')} x2={1} y2={0} stops={[[0, '#e3cfa6'], [1, '#b59a6a']]} />
          <Lin id={u('pad')} stops={[[0, '#9a8acb'], [1, '#6f5fa6']]} />
        </defs>
        <Shadow u={u} f={f} cx={45} cy={175} rx={42} ry={5} />
        <rect x="38" y="30" width="14" height="140" fill={f('post')} />
        {Array.from({ length: 14 }, (_, i) => (
          <path key={i} d={`M38 ${36 + i * 10} l14 4`} stroke="#9c8558" strokeWidth="1" />
        ))}
        <rect x="6" y="160" width="78" height="14" rx="5" fill={f('pad')} />
        <rect x="10" y="98" width="44" height="10" rx="4" fill={f('pad')} />
        <rect x="36" y="58" width="48" height="10" rx="4" fill={f('pad')} />
        <rect x="18" y="20" width="54" height="14" rx="6" fill={f('pad')} />
        <path d="M30 20 q0 -14 15 -14 q15 0 15 14z" fill="#6f5fa6" />
        <ellipse cx="45" cy="18" rx="9" ry="7" fill="#3f3466" />
        <path d="M70 68 v16" stroke="#e8e2d0" strokeWidth="1.2" />
        <circle cx="70" cy="88" r="5" fill="#ff7aa8" />
        <path d="M66 94 l4 3 l4 -3" stroke="#ff7aa8" strokeWidth="1.2" fill="none" />
      </>
    ),
  },
  globe: {
    w: 9,
    vb: '0 0 70 110',
    draw: (u, f) => (
      <>
        <defs>
          <Rad id={u('sea')} cx={0.38} cy={0.34} r={0.7} stops={[[0, '#8fd0f0'], [1, '#2f6f9f']]} />
          <Lin id={u('brass')} x2={1} y2={0} stops={[[0, '#f0d58a'], [1, '#9a7426']]} />
        </defs>
        <Shadow u={u} f={f} cx={35} cy={106} rx={24} ry={4} />
        <circle cx="35" cy="40" r="28" fill={f('sea')} />
        <g fill="#8bc07a">
          <path d="M18 30 q8 -10 18 -6 q4 6 -4 10 q-2 10 -10 12 q-6 -6 -4 -16z" />
          <path d="M42 46 q8 -4 12 4 q-2 10 -10 12 q-4 -6 -2 -16z" />
        </g>
        <path d="M12 22 q23 -20 46 2" stroke="#fff" strokeOpacity="0.4" strokeWidth="2.5" fill="none" />
        <path d="M6 40 a29 29 0 0 0 58 0" stroke={f('brass')} strokeWidth="4" fill="none" />
        <rect x="32" y="68" width="6" height="22" fill={f('brass')} />
        <path d="M16 102 q19 -16 38 0z" fill={f('brass')} />
      </>
    ),
  },

  /* ---------------- the kitchen ---------------- */
  blender: {
    w: 5,
    vb: '0 0 50 90',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('jar')} x2={1} y2={0} stops={[[0, '#e9f6fb', 0.7], [1, '#b8d4df', 0.8]]} />
          <Lin id={u('smoothie')} stops={[[0, '#ff8fb0'], [1, '#e05a86']]} />
        </defs>
        <Shadow u={u} f={f} cx={25} cy={87} rx={20} ry={3} />
        <rect x="8" y="62" width="34" height="24" rx="6" fill="#e2674f" />
        <circle cx="25" cy="74" r="4" fill="#fff" />
        <path d="M10 14 h30 l-4 48 h-22z" fill={f('jar')} stroke="#9bb8c4" strokeWidth="1.2" />
        <path d="M13 34 h24 l-2 28 h-20z" fill={f('smoothie')} />
        <rect x="8" y="8" width="34" height="8" rx="3" fill="#3b4150" />
        <path d="M14 18 v38" stroke="#fff" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
      </>
    ),
  },
  microwave: {
    w: 10,
    vb: '0 0 110 64',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('body')} stops={[[0, '#f2f3f5'], [1, '#c6cad1']]} />
          <Lin id={u('glass')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#3a4252'], [1, '#1c212c']]} />
        </defs>
        <Shadow u={u} f={f} cx={55} cy={60} rx={50} ry={4} />
        <rect x="4" y="4" width="102" height="54" rx="6" fill={f('body')} />
        <rect x="10" y="10" width="66" height="42" rx="4" fill={f('glass')} />
        <ellipse cx="43" cy="44" rx="16" ry="3" fill="#ffd36b" opacity="0.35" />
        <path d="M14 16 l18 0" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
        <rect x="82" y="12" width="18" height="8" rx="2" fill="#1c212c" />
        <text x="91" y="18.5" fontSize="6" textAnchor="middle" fill="#7cff9a" fontFamily="monospace">0:42</text>
        {[0, 1, 2].map((r) =>
          [0, 1].map((c) => <rect key={`${r}${c}`} x={83 + c * 9} y={26 + r * 8} width="7" height="5" rx="1.5" fill="#b9bfc8" />)
        )}
        <rect x="76" y="14" width="3" height="34" rx="1.5" fill="#9aa1ac" />
      </>
    ),
  },
  'herb-pots': {
    w: 9,
    vb: '0 0 100 60',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('pot')} x2={1} y2={0} stops={[[0, '#e58a5e'], [1, '#a64f2e']]} />
        </defs>
        <Shadow u={u} f={f} cx={50} cy={57} rx={46} ry={3} />
        {[16, 50, 84].map((x, i) => (
          <g key={x}>
            <g fill={['#5aa45a', '#7cbf5a', '#3f8f4f'][i]}>
              {[-8, -3, 2, 7].map((d, j) => (
                <ellipse key={j} cx={x + d} cy={24 - (j % 2) * 6} rx="4" ry="8" transform={`rotate(${d * 3} ${x + d} ${24 - (j % 2) * 6})`} />
              ))}
            </g>
            <path d={`M${x - 13} 32 h26 l-3 22 h-20z`} fill={f('pot')} />
            <rect x={x - 14} y="30" width="28" height="5" rx="2" fill="#ef9c70" />
            <rect x={x - 7} y="40" width="14" height="7" rx="1" fill="#fff7e8" />
          </g>
        ))}
      </>
    ),
  },
  'fridge-retro': {
    w: 15,
    vb: '0 0 100 190',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('body')} x2={1} y2={0} stops={[[0, '#bfe6dc'], [0.6, '#8ccbbb'], [1, '#5fa595']]} />
          <Gloss id={u('gl')} />
        </defs>
        <Shadow u={u} f={f} cx={50} cy={185} rx={46} ry={5} />
        <rect x="8" y="6" width="84" height="172" rx="22" fill={f('body')} />
        <path d="M8 66 h84" stroke="#4f8f80" strokeWidth="2.5" />
        <rect x="76" y="24" width="6" height="30" rx="3" fill="#e8ecf0" />
        <rect x="76" y="76" width="6" height="40" rx="3" fill="#e8ecf0" />
        <rect x="14" y="10" width="20" height="160" rx="10" fill={f('gl')} opacity="0.4" />
        <rect x="38" y="160" width="24" height="10" rx="3" fill="#d8e6e2" opacity="0.8" />
        <rect x="24" y="86" width="16" height="12" rx="2" fill="#ffd34d" transform="rotate(-8 32 92)" />
        <circle cx="52" cy="96" r="5" fill="#e2674f" />
        <rect x="18" y="30" width="22" height="16" rx="2" fill="#fff" transform="rotate(6 29 38)" />
        <path d="M22 36 h14 M22 40 h10" stroke="#6b5446" strokeWidth="1" transform="rotate(6 29 38)" />
        <rect x="12" y="178" width="10" height="8" rx="2" fill="#7a8a88" />
        <rect x="78" y="178" width="10" height="8" rx="2" fill="#7a8a88" />
      </>
    ),
  },
  'clock-cat': {
    w: 7,
    vb: '0 0 60 130',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('cat')} stops={[[0, '#2e2a35'], [1, '#17141c']]} />
        </defs>
        <path d="M10 18 l4 -16 l10 12 h12 l10 -12 l4 16 q4 10 4 22 v52 q0 8 -8 8 h-32 q-8 0 -8 -8 v-52 q0 -12 4 -22z" fill={f('cat')} />
        <ellipse cx="22" cy="30" rx="6" ry="7" fill="#fff" />
        <ellipse cx="38" cy="30" rx="6" ry="7" fill="#fff" />
        <circle className="cat-eye" cx="22" cy="31" r="3" fill="#1b1b1b" />
        <circle className="cat-eye" cx="38" cy="31" r="3" fill="#1b1b1b" />
        <path d="M26 42 q4 4 8 0" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="30" cy="66" r="14" fill="#fbf6ea" />
        <path d="M30 66 v-9 M30 66 l6 3" stroke="#1b1b1b" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 86 h28" stroke="#fff" strokeWidth="2" strokeDasharray="2 3" />
        <path d="M30 100 q-10 12 -2 28" stroke="#2e2a35" strokeWidth="6" fill="none" strokeLinecap="round" />
      </>
    ),
  },

  /* ---------------- the bedroom ---------------- */
  dresser: {
    w: 18,
    vb: '0 0 140 120',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('wood')} stops={[[0, '#f1e6d6'], [1, '#d3c2a8']]} />
          <Lin id={u('drawer')} stops={[[0, '#fbf4e8'], [1, '#e2d4be']]} />
        </defs>
        <Shadow u={u} f={f} cx={70} cy={115} rx={66} ry={5} />
        <rect x="8" y="34" width="124" height="74" rx="5" fill={f('wood')} />
        <rect x="4" y="30" width="132" height="8" rx="3" fill="#c9b596" />
        {[42, 64, 86].map((y) => (
          <g key={y}>
            <rect x="14" y={y} width="112" height="18" rx="3" fill={f('drawer')} stroke="#c9b596" />
            <circle cx="50" cy={y + 9} r="2.6" fill="#b8915a" />
            <circle cx="90" cy={y + 9} r="2.6" fill="#b8915a" />
          </g>
        ))}
        <rect x="14" y="108" width="8" height="8" fill="#b8a283" />
        <rect x="118" y="108" width="8" height="8" fill="#b8a283" />
        <rect x="24" y="12" width="20" height="18" rx="2" fill="#e8c8d8" />
        <path d="M28 16 h12 v10 h-12z" fill="#fff" opacity="0.6" />
        <path d="M100 30 v-10 q0 -6 6 -6 q6 0 6 6 v10" fill="#7cc6a4" />
        <circle cx="106" cy="12" r="5" fill="#ff7aa8" />
        <ellipse cx="72" cy="27" rx="12" ry="3" fill="#d9b25a" />
      </>
    ),
  },
  'stars-ceiling': {
    w: 22,
    glow: { x: 50, y: 50, r: 50, c: '#fff2a8' },
    vb: '0 0 180 110',
    draw: (u, f) => {
      const star = (x, y, r) => {
        const pts = Array.from({ length: 10 }, (_, i) => {
          const a = (Math.PI / 5) * i - Math.PI / 2;
          const rr = i % 2 ? r * 0.45 : r;
          return `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`;
        }).join(' ');
        return <polygon points={pts} />;
      };
      return (
        <>
          <path d="M90 0 V20 M90 20 L36 30 M90 20 L144 30 M90 20 V34" stroke="#b9a27a" strokeWidth="1.6" fill="none" />
          <rect x="30" y="28" width="120" height="4" rx="2" fill="#c9b596" />
          <path d="M40 32 V62 M70 32 V86 M110 32 V74 M140 32 V54 M90 34 V96" stroke="#d6cbb4" strokeWidth="1" />
          <g fill="#fff2a8" stroke="#e6c25a" strokeWidth="1.5">
            <g key="a">{star(40, 70, 9)}</g>
            <g key="b">{star(140, 62, 8)}</g>
            <g key="c">{star(90, 104, 6)}</g>
          </g>
          <g fill="#ffe08a">
            <path d="M70 86 a12 12 0 1 0 14 14 a10 10 0 1 1 -14 -14z" />
            <circle cx="110" cy="82" r="8" fill="#c9e6ff" />
          </g>
        </>
      );
    },
  },

  /* ---------------- Cursor's Collection (the final levels) ---------------- */
  'cursor-statue': {
    w: 12,
    glow: { x: 50, y: 40, r: 46, c: '#ffe08a' },
    vb: '0 0 90 170',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('gold')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#fff1b8'], [0.45, '#e6b422'], [1, '#8a6417']]} />
          <Lin id={u('stone')} stops={[[0, '#efe9df'], [1, '#bdb3a4']]} />
        </defs>
        <Shadow u={u} f={f} cx={45} cy={165} rx={40} ry={5} />
        <Pointer fill={f('gold')} stroke="#7a5a12" w={2.5} t="translate(22 6) scale(1.6)" />
        <path d="M30 20 l0 40" stroke="#fff" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
        <rect x="16" y="96" width="58" height="12" rx="3" fill={f('stone')} />
        <rect x="22" y="108" width="46" height="44" fill={f('stone')} />
        <rect x="12" y="152" width="66" height="12" rx="3" fill={f('stone')} />
        <rect x="28" y="120" width="34" height="14" rx="2" fill="#d4c9b5" />
        <text x="45" y="130.5" fontSize="8" textAnchor="middle" fill="#7a6a52" fontWeight="700">CLICK</text>
      </>
    ),
  },
  'cursor-neon': {
    w: 13,
    glow: { x: 50, y: 50, r: 55, c: '#7cf3ff' },
    vb: '0 0 110 90',
    draw: () => (
      <>
        <rect x="2" y="2" width="106" height="86" rx="8" fill="#1b1830" />
        <rect x="2" y="2" width="106" height="86" rx="8" fill="none" stroke="#3a3560" strokeWidth="2" />
        <g style={{ filter: 'drop-shadow(0 0 4px #7cf3ff)' }}>
          <Pointer fill="none" stroke="#7cf3ff" w={3.5} t="translate(22 16) scale(1.05)" />
        </g>
        <g style={{ filter: 'drop-shadow(0 0 3px #ff6ad5)' }} fill="none" stroke="#ff6ad5" strokeWidth="2.5" strokeLinecap="round">
          <path d="M70 30 l10 -8 M74 42 h12 M70 54 l10 8" />
        </g>
      </>
    ),
  },
  'cursor-hourglass': {
    w: 9,
    vb: '0 0 70 130',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('wood')} x2={1} y2={0} stops={[[0, '#c08a5c'], [1, '#6d4428']]} />
          <Lin id={u('glass')} x2={1} y2={0} stops={[[0, '#e9f6fb', 0.5], [1, '#b8d4df', 0.6]]} />
        </defs>
        <Shadow u={u} f={f} cx={35} cy={126} rx={30} ry={4} />
        <rect x="6" y="6" width="58" height="10" rx="3" fill={f('wood')} />
        <rect x="6" y="112" width="58" height="10" rx="3" fill={f('wood')} />
        <rect x="10" y="16" width="5" height="96" fill={f('wood')} />
        <rect x="55" y="16" width="5" height="96" fill={f('wood')} />
        <path d="M18 16 h34 q0 30 -14 44 q14 14 14 52 h-34 q0 -38 14 -52 q-14 -14 -14 -44z" fill={f('glass')} stroke="#9bb8c4" />
        <path d="M24 30 h22 q-2 18 -11 26 q-9 -8 -11 -26z" fill="#e6b422" />
        <path d="M35 60 v34" stroke="#e6b422" strokeWidth="1.6" strokeDasharray="2 2" />
        <path d="M20 112 q15 -18 30 0z" fill="#e6b422" />
        <path d="M22 20 q-2 18 6 30" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" fill="none" />
      </>
    ),
  },
  'cursor-rug': {
    w: 46,
    vb: '0 0 300 80',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('m')} stops={[[0, '#3a3560'], [1, '#231f40']]} />
        </defs>
        <rect x="14" y="13" width="272" height="62" rx="18" fill="#2a1608" opacity="0.18" />
        <rect x="14" y="10" width="272" height="62" rx="18" fill={f('m')} />
        <rect x="24" y="16" width="252" height="50" rx="13" fill="none" stroke="#7cf3ff" strokeWidth="2" strokeDasharray="6 5" />
        <Pointer fill="#fff" stroke="#1d1d24" w={2.5} t="translate(134 14) scale(1.05 0.98)" />
        {[60, 240].map((x) => (
          <g key={x} fill="#ff6ad5">
            <circle cx={x} cy="41" r="9" fill="none" stroke="#ff6ad5" strokeWidth="2" />
            <circle cx={x} cy="41" r="3" />
          </g>
        ))}
      </>
    ),
  },
  'cursor-pendant': {
    w: 12,
    glow: { x: 50, y: 85, r: 46, c: '#c9f8ff' },
    vb: '0 0 80 150',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('glass')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#ffffff'], [1, '#bfeaf3']]} />
        </defs>
        <path d="M30 0 V72" stroke="#2b2b2b" strokeWidth="1.6" />
        <rect x="26" y="68" width="8" height="8" rx="2" fill="#9aa1ac" />
        <Pointer fill={f('glass')} stroke="#2a3a48" w={2.5} t="translate(30 76) scale(1.2)" />
        <path d="M34 86 v30" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  },
};
