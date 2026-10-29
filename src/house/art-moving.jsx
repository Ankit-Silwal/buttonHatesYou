import { Lin, Rad, Shadow, Gloss } from './svg';
import './moving.css';

// Moving furniture: the most expensive pieces in the house, and the only
// ones that keep moving on their own (moving.css; still for reduced motion).
// Three are sold for coins from a level on (Jukebox, Robot Chef, Galaxy
// Projector), three for a small fortune in diamonds (Fireplace, Popcorn
// Machine, Pet Raincloud). Merged into ART through art-more.jsx.

const NOTE = 'M0 0 v-14 l10 -3 v14 a3.2 2.6 0 1 1 -2 -2.4 v-8 l-6 1.8 v10 a3.2 2.6 0 1 1 -2 -2.4z';
const sparkle = 'M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2z';

export const MOVING_ART = {
  /* ---------------- coins, level-locked ---------------- */
  jukebox: {
    w: 17,
    glow: { x: 50, y: 42, r: 52, c: '#ff8ad8' },
    vb: '0 -40 120 230',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('wood')} x2={1} y2={0} stops={[[0, '#8a4a26'], [0.5, '#b8683a'], [1, '#6a361b']]} />
          <Lin id={u('tube')} x1={0} y1={0} x2={1} y2={1} stops={[[0, '#ff5ea8'], [0.35, '#ffd34d'], [0.7, '#5fe3ff'], [1, '#b06bff']]} />
          <Lin id={u('win')} stops={[[0, '#2a1240'], [1, '#170a26']]} />
          <Lin id={u('grille')} stops={[[0, '#e9c46a'], [1, '#a77b2c']]} />
          <Rad id={u('rec')} stops={[[0, '#3a3a44'], [0.7, '#111116'], [1, '#22222a']]} />
          <Gloss id={u('gl')} />
        </defs>
        <Shadow u={u} f={f} cx={60} cy={185} rx={56} ry={6} />
        {/* the cabinet */}
        <path d="M8 186 V78 a52 56 0 0 1 104 0 V186z" fill={f('wood')} />
        <path d="M16 182 V80 a44 48 0 0 1 88 0 V182z" fill="#4a2412" opacity="0.35" />
        {/* the glowing arch */}
        <path className="mv-hue" d="M18 120 V80 a42 46 0 0 1 84 0 V120" fill="none" stroke={f('tube')} strokeWidth="7" strokeLinecap="round" />
        <path d="M18 120 V80 a42 46 0 0 1 84 0 V120" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
        {/* the window and its spinning record */}
        <path d="M28 112 V84 a32 34 0 0 1 64 0 V112z" fill={f('win')} />
        <g className="mv-spin">
          <circle cx="60" cy="92" r="20" fill={f('rec')} />
          <circle cx="60" cy="92" r="15" fill="none" stroke="#3c3c48" strokeWidth="0.8" />
          <circle cx="60" cy="92" r="11" fill="none" stroke="#3c3c48" strokeWidth="0.8" />
          <circle cx="60" cy="92" r="6.5" fill="#ff5ea8" />
          <path d="M60 86 a6 6 0 0 1 5.5 3.6" stroke="#fff" strokeWidth="1.4" fill="none" opacity="0.8" />
          <circle cx="60" cy="92" r="1.4" fill="#111" />
        </g>
        <path d="M84 74 L72 96" stroke="#d8d8e0" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="84" cy="74" r="3.4" fill="#9a9aa8" />
        <path d="M28 112 V84 a32 34 0 0 1 64 0 V112z" fill={f('gl')} opacity="0.35" />
        {/* the selector */}
        <rect x="20" y="118" width="80" height="16" rx="3" fill="#2b1608" />
        {[30, 42, 54, 66, 78, 90].map((x, i) => (
          <rect key={x} className="mv-blink" x={x - 4} y="122" width="8" height="8" rx="2" fill={['#ff5ea8', '#ffd34d', '#5fe3ff', '#7cff9a', '#b06bff', '#ff8a4d'][i]} style={{ animationDelay: `${-i * 0.25}s` }} />
        ))}
        {/* the speaker grille between two bubble tubes */}
        <rect x="32" y="140" width="56" height="38" rx="6" fill={f('grille')} />
        {[38, 46, 54, 62, 70, 78].map((x) => (
          <rect key={x} x={x} y="144" width="4" height="30" rx="2" fill="#6a4a18" opacity="0.7" />
        ))}
        {[14, 96].map((x, k) => (
          <g key={x}>
            <rect x={x} y="138" width="10" height="44" rx="5" fill="#2b1608" />
            <rect x={x + 2} y="140" width="6" height="40" rx="3" fill={k ? '#5fe3ff' : '#ff5ea8'} opacity="0.75" />
            {[0, 1, 2].map((i) => (
              <circle key={i} className="mv-rise" cx={x + 5} cy="176" r="1.6" fill="#fff" style={{ animationDelay: `${-i * 0.8 - k * 0.4}s` }} />
            ))}
          </g>
        ))}
        <rect x="8" y="180" width="104" height="6" rx="2" fill="#4a2412" />
        {/* music notes floating up */}
        {[
          [26, 0, '#ff5ea8'],
          [70, -1.2, '#5fe3ff'],
          [92, -2.4, '#ffd34d'],
        ].map(([x, d, c]) => (
          <g key={x} transform={`translate(${x} 22)`}>
            <path className="mv-note" d={NOTE} fill={c} stroke="#2b1608" strokeWidth="0.8" style={{ animationDelay: `${d}s` }} />
          </g>
        ))}
      </>
    ),
  },

  'robot-chef': {
    w: 18,
    glow: { x: 74, y: 42, r: 34, c: '#ffb85c' },
    vb: '0 -34 130 220',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('metal')} x2={1} y2={0} stops={[[0, '#e8edf3'], [0.55, '#b9c3cf'], [1, '#8792a1']]} />
          <Lin id={u('steel')} stops={[[0, '#c9d1db'], [1, '#7d8794']]} />
          <Lin id={u('stove')} stops={[[0, '#f4f1ea'], [1, '#cfc7b8']]} />
          <Lin id={u('pot')} x2={1} y2={0} stops={[[0, '#d9483b'], [0.6, '#b8352b'], [1, '#7e2219']]} />
          <Rad id={u('soup')} stops={[[0, '#ffcf6b'], [1, '#e8892c']]} />
          <Gloss id={u('gl')} />
        </defs>
        <Shadow u={u} f={f} cx={66} cy={180} rx={62} ry={6} />
        {/* the little stove */}
        <rect x="70" y="118" width="56" height="62" rx="4" fill={f('stove')} />
        <rect x="76" y="132" width="44" height="30" rx="3" fill="#2b2b33" />
        <rect x="80" y="136" width="36" height="22" rx="2" fill="#3c3c48" />
        <rect className="mv-glow" x="82" y="150" width="32" height="6" rx="3" fill="#ff7a3a" opacity="0.6" />
        {[82, 98, 114].map((x) => (
          <circle key={x} cx={x} cy="125" r="2.6" fill="#555" />
        ))}
        <rect x="66" y="114" width="64" height="6" rx="2" fill="#a59a88" />
        {/* steam */}
        {[0, 1, 2].map((i) => (
          <path key={i} className="mv-steam" d="M98 72 c-6 -6 6 -10 0 -16 c-6 -6 6 -10 0 -16" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" opacity="0.8" style={{ animationDelay: `${-i * 0.9}s` }} transform={`translate(${(i - 1) * 9} 0)`} />
        ))}
        {/* the pot, back half */}
        <ellipse cx="98" cy="90" rx="22" ry="6" fill="#5e1812" />
        <ellipse className="mv-soup" cx="98" cy="91" rx="19" ry="4.6" fill={f('soup')} />
        {/* the stirring arm, with the spoon in the pot */}
        <g className="mv-stir">
          <path d="M54 112 Q72 96 86 92" stroke={f('steel')} strokeWidth="7" strokeLinecap="round" fill="none" />
          <circle cx="54" cy="112" r="6" fill="#8792a1" />
          <circle cx="86" cy="92" r="5" fill="#9aa4b2" />
          <path d="M86 92 L100 74" stroke="#7a4a26" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M90 98 L102 86" stroke="#b88a5a" strokeWidth="4" strokeLinecap="round" />
        </g>
        {/* the pot, front */}
        <path d="M76 90 h44 v18 a8 8 0 0 1 -8 8 h-28 a8 8 0 0 1 -8 -8z" fill={f('pot')} />
        <path d="M70 94 h6 M120 94 h6" stroke="#5e1812" strokeWidth="4" strokeLinecap="round" />
        <path d="M80 96 v12" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
        {/* the robot: wheels, body, head */}
        <rect x="10" y="164" width="52" height="16" rx="8" fill="#3c4250" />
        {[20, 36, 52].map((x) => (
          <circle key={x} className="mv-wheel" cx={x} cy="172" r="5" fill="#8792a1" stroke="#2b2f38" strokeWidth="1.6" strokeDasharray="3 2" />
        ))}
        <g className="mv-sway">
          <rect x="14" y="98" width="44" height="64" rx="10" fill={f('metal')} />
          <rect x="18" y="106" width="36" height="48" rx="6" fill="#fff" opacity="0.9" />
          <path d="M18 106 h36 v10 h-36z" fill="#e8edf3" />
          <circle cx="36" cy="128" r="6" fill="none" stroke="#d9483b" strokeWidth="2.2" />
          <path d="M33 128 h6 M36 125 v6" stroke="#d9483b" strokeWidth="1.8" />
          <rect x="30" y="90" width="12" height="10" rx="2" fill="#8792a1" />
          <rect x="10" y="44" width="52" height="48" rx="12" fill={f('metal')} />
          <rect x="16" y="52" width="40" height="32" rx="8" fill="#16202e" />
          <g className="mv-blink2">
            <rect x="24" y="60" width="7" height="9" rx="3" fill="#5fe3ff" />
            <rect x="41" y="60" width="7" height="9" rx="3" fill="#5fe3ff" />
          </g>
          <path d="M28 74 q8 6 16 0" stroke="#5fe3ff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <rect x="10" y="44" width="52" height="48" rx="12" fill={f('gl')} opacity="0.4" />
          <circle cx="8" cy="68" r="4" fill="#8792a1" />
          <circle cx="64" cy="68" r="4" fill="#8792a1" />
          {/* chef's hat */}
          <rect x="18" y="30" width="36" height="16" rx="3" fill="#fff" stroke="#dde3ea" />
          <circle cx="24" cy="24" r="10" fill="#fff" />
          <circle cx="36" cy="18" r="12" fill="#fff" />
          <circle cx="48" cy="24" r="10" fill="#fff" />
          <path d="M18 40 h36" stroke="#dde3ea" strokeWidth="1.4" />
          {/* left arm, waving a little */}
          <path d="M14 112 q-10 14 -4 28" stroke={f('steel')} strokeWidth="6" strokeLinecap="round" fill="none" />
        </g>
      </>
    ),
  },

  'galaxy-projector': {
    w: 16,
    glow: { x: 50, y: 30, r: 60, c: '#8f7bff' },
    vb: '0 -80 120 230',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('beam')} x1={0} y1={1} x2={0} y2={0} stops={[[0, '#b7a8ff', 0.55], [1, '#6b5cff', 0]]} />
          <Rad id={u('dome')} cx={0.38} cy={0.3} r={0.75} stops={[[0, '#d8ccff'], [0.5, '#7b63e0'], [1, '#3a2a8a']]} />
          <Lin id={u('base')} x2={1} y2={0} stops={[[0, '#ece6ff'], [1, '#a99fd0']]} />
          <Lin id={u('wood')} x2={1} y2={0} stops={[[0, '#c79a6e'], [1, '#8a5f3c']]} />
          <Rad id={u('planet')} cx={0.35} cy={0.3} stops={[[0, '#ffd1a1'], [1, '#e2674f']]} />
          <clipPath id={u('clip')}>
            <path d="M36 98 a24 24 0 0 1 48 0z" />
          </clipPath>
        </defs>
        <Shadow u={u} f={f} cx={60} cy={146} rx={44} ry={5} />
        {/* the beam of starlight */}
        <path className="mv-beam" d="M48 82 L-10 -80 H130 L72 82z" fill={f('beam')} />
        {[
          [20, -50, 0], [92, -64, -1.1], [60, -30, -2.2], [36, -2, -0.6], [86, 4, -1.7], [104, -24, -2.8], [12, -72, -0.3], [70, -76, -1.9], [50, 34, -2.5],
        ].map(([x, y, d], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path className="mv-star" d={sparkle} fill={i % 3 ? '#fff' : '#ffe08a'} style={{ animationDelay: `${d}s` }} />
          </g>
        ))}
        {/* a ringed planet drifting round */}
        <g className="mv-orbit">
          <circle cx="60" cy="-26" r="9" fill={f('planet')} />
          <ellipse cx="60" cy="-26" rx="16" ry="4" fill="none" stroke="#ffe08a" strokeWidth="2" transform="rotate(-18 60 -26)" />
        </g>
        <path className="mv-moon" d="M28 -36 a10 10 0 1 0 12 12 a8 8 0 1 1 -12 -12z" fill="#fff4c2" />
        {/* the stool */}
        <ellipse cx="60" cy="112" rx="34" ry="7" fill={f('wood')} />
        <path d="M34 114 L28 144 M86 114 L92 144 M60 118 V146" stroke="#7a5232" strokeWidth="4" strokeLinecap="round" />
        <path d="M40 132 h40" stroke="#7a5232" strokeWidth="3" />
        {/* the projector */}
        <rect x="34" y="96" width="52" height="14" rx="5" fill={f('base')} />
        <rect className="mv-blink" x="44" y="101" width="6" height="4" rx="2" fill="#7cff9a" />
        <path d="M36 98 a24 24 0 0 1 48 0z" fill={f('dome')} />
        <g clipPath={`url(#${u('clip')})`}>
          <g className="mv-pan" fill="#fff">
            {[0, 48].map((o) => (
              <g key={o} transform={`translate(${o} 0)`}>
                <circle cx="26" cy="86" r="1.6" />
                <circle cx="36" cy="80" r="1.1" />
                <circle cx="44" cy="90" r="1.8" />
                <circle cx="52" cy="82" r="1.2" />
                <circle cx="60" cy="88" r="1.5" />
                <circle cx="68" cy="78" r="1.1" />
              </g>
            ))}
          </g>
        </g>
        <path d="M42 90 a18 18 0 0 1 12 -14" stroke="#fff" strokeOpacity="0.6" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </>
    ),
  },

  /* ---------------- diamonds ---------------- */
  fireplace: {
    w: 26,
    glow: { x: 50, y: 64, r: 60, c: '#ff9a3c' },
    vb: '0 0 180 156',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('stone')} stops={[[0, '#c9b9a6'], [1, '#9a8672']]} />
          <Lin id={u('mantel')} stops={[[0, '#9a6236'], [1, '#6a3c1c']]} />
          <Lin id={u('box')} stops={[[0, '#1d0f08'], [1, '#3a1d0e']]} />
          <Rad id={u('heat')} cy={0.8} stops={[[0, '#ffcf5c', 0.95], [0.5, '#ff7a2a', 0.5], [1, '#ff7a2a', 0]]} />
          <Lin id={u('f1')} stops={[[0, '#ffdf6b'], [1, '#ff5a1f']]} />
          <Lin id={u('f2')} stops={[[0, '#fff6c8'], [1, '#ffb43a']]} />
        </defs>
        <Shadow u={u} f={f} cx={90} cy={152} rx={88} ry={5} />
        {/* stone surround */}
        <rect x="12" y="24" width="156" height="126" rx="4" fill={f('stone')} />
        {[
          [14, 30, 34], [50, 30, 40], [92, 30, 32], [126, 30, 40], [14, 50, 26], [42, 50, 30], [114, 50, 28], [144, 50, 22],
          [14, 70, 20], [150, 70, 16], [14, 92, 22], [148, 92, 18], [14, 114, 18], [150, 114, 16],
        ].map(([x, y, w], i) => (
          <rect key={i} x={x + 1} y={y} width={w - 3} height="17" rx="3" fill="#fff" opacity={i % 2 ? 0.1 : 0.16} />
        ))}
        {/* the firebox */}
        <path d="M38 150 V84 a52 34 0 0 1 104 0 V150z" fill="#7a6858" />
        <path d="M44 150 V86 a46 29 0 0 1 92 0 V150z" fill={f('box')} />
        <ellipse className="mv-heat" cx="90" cy="128" rx="44" ry="26" fill={f('heat')} />
        {/* logs */}
        <rect x="58" y="134" width="64" height="10" rx="5" fill="#6a3a1c" transform="rotate(-6 90 139)" />
        <rect x="58" y="134" width="64" height="10" rx="5" fill="#7c4824" transform="rotate(7 90 139)" />
        <circle cx="60" cy="136" r="4" fill="#c9905a" />
        <circle cx="121" cy="140" r="4" fill="#c9905a" />
        {/* flames */}
        <g className="mv-flame">
          <path d="M90 138 c-24 0 -30 -20 -20 -36 c5 -9 3 -18 -2 -26 c14 6 22 16 22 30 c4 -8 4 -14 2 -22 c14 10 20 24 18 36 c-2 12 -8 18 -20 18z" fill={f('f1')} />
        </g>
        <g className="mv-flame b">
          <path d="M70 138 c-12 0 -16 -10 -10 -20 c3 -5 2 -10 0 -14 c8 4 12 10 12 18 c3 -4 3 -8 2 -12 c7 6 9 14 8 20 c-1 6 -5 8 -12 8z" fill={f('f1')} />
          <path d="M112 138 c-12 0 -15 -10 -9 -19 c3 -5 2 -10 0 -14 c8 4 12 10 12 18 c3 -4 3 -8 2 -12 c6 6 8 14 7 19 c-1 6 -5 8 -12 8z" fill={f('f1')} />
        </g>
        <g className="mv-flame c">
          <path d="M90 138 c-12 0 -16 -10 -10 -20 c3 -5 2 -10 0 -14 c8 4 12 10 12 18 c3 -4 3 -8 2 -12 c7 6 9 14 8 20 c-1 6 -5 8 -12 8z" fill={f('f2')} />
        </g>
        {/* embers */}
        {[[78, 0], [96, -0.7], [86, -1.4], [104, -2.1]].map(([x, d]) => (
          <circle key={x} className="mv-ember" cx={x} cy="110" r="1.6" fill="#ffd34d" style={{ animationDelay: `${d}s` }} />
        ))}
        {/* grate */}
        <path d="M54 150 V140 M66 150 V138 M78 150 V137 M90 150 V137 M102 150 V137 M114 150 V138 M126 150 V140 M50 146 H130" stroke="#22150e" strokeWidth="3" strokeLinecap="round" />
        {/* mantel, with candles and a clock */}
        <rect x="2" y="14" width="176" height="14" rx="3" fill={f('mantel')} />
        <rect x="2" y="14" width="176" height="4" rx="2" fill="#fff" opacity="0.18" />
        {[22, 156].map((x, i) => (
          <g key={x}>
            <rect x={x - 3} y="0" width="6" height="14" rx="1.5" fill="#fff4dc" />
            <path className="mv-candle" d={`M${x} -9 c-3 4 -3 7 0 8 c3 -1 3 -4 0 -8z`} fill="#ffb43a" style={{ animationDelay: `${-i * 0.4}s` }} />
          </g>
        ))}
        <circle cx="90" cy="5" r="8.5" fill="#e9c46a" stroke="#8a6417" strokeWidth="1.6" />
        <circle cx="90" cy="5" r="6" fill="#fffaf0" />
        <path d="M90 5 V1.5 M90 5 L92.5 6.5" stroke="#3b2a20" strokeWidth="1.2" strokeLinecap="round" />
      </>
    ),
  },

  'popcorn-machine': {
    w: 14,
    glow: { x: 50, y: 40, r: 42, c: '#ffd45c' },
    vb: '0 -12 110 204',
    draw: (u, f) => {
      const puff = (x, y, s = 1) => (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <circle cx="-2" cy="0" r="3" fill="#fff8e1" />
          <circle cx="2" cy="-1" r="3" fill="#fff3cc" />
          <circle cx="0" cy="2" r="2.6" fill="#ffe9a8" />
        </g>
      );
      return (
        <>
          <defs>
            <Lin id={u('red')} x2={1} y2={0} stops={[[0, '#e2483b'], [0.6, '#c8352a'], [1, '#8e2219']]} />
            <Lin id={u('glass')} x2={1} y2={1} stops={[[0, '#fff8d8', 0.55], [1, '#ffd98a', 0.35]]} />
            <Lin id={u('kettle')} x2={1} y2={0} stops={[[0, '#eef1f5'], [1, '#9aa3b0']]} />
            <Rad id={u('warm')} cy={0.9} stops={[[0, '#ffd45c', 0.7], [1, '#ffd45c', 0]]} />
            <Gloss id={u('gl')} />
          </defs>
          <Shadow u={u} f={f} cx={55} cy={188} rx={46} ry={5} />
          {/* the cart and its wheels */}
          <rect x="16" y="120" width="78" height="56" rx="4" fill={f('red')} />
          <path d="M16 134 h78 M16 162 h78" stroke="#fff" strokeOpacity="0.85" strokeWidth="3" />
          <rect x="40" y="140" width="30" height="16" rx="3" fill="#fff4dc" />
          <text x="55" y="151.5" fontSize="8" textAnchor="middle" fill="#c8352a" fontWeight="800">
            50¢
          </text>
          {[28, 82].map((x) => (
            <g key={x}>
              <circle cx={x} cy="180" r="8" fill="#2b2b33" />
              <circle className="mv-wheel" cx={x} cy="180" r="4.5" fill="#c9d1db" stroke="#7d8794" strokeWidth="1.4" strokeDasharray="2.4 1.6" />
            </g>
          ))}
          {/* the glass cabinet */}
          <rect x="12" y="30" width="86" height="92" rx="4" fill={f('red')} />
          <rect x="18" y="36" width="74" height="80" rx="2" fill="#3a1a10" />
          <ellipse className="mv-heat" cx="55" cy="104" rx="36" ry="16" fill={f('warm')} />
          {/* the pile */}
          <path d="M20 116 c4 -16 16 -20 26 -16 c8 -10 22 -8 28 2 c8 -4 16 4 16 14z" fill="#ffe08a" />
          {[[26, 108], [34, 102], [44, 104], [52, 98], [60, 104], [68, 100], [78, 106], [86, 110], [38, 112], [58, 112], [72, 112]].map(([x, y], i) => (
            <g key={i}>{puff(x, y, 1)}</g>
          ))}
          {/* the kettle, tipping and popping */}
          <path d="M55 36 V46" stroke="#9aa3b0" strokeWidth="2.4" />
          <g className="mv-tip">
            <path d="M38 48 h34 v10 a17 9 0 0 1 -34 0z" fill={f('kettle')} />
            <ellipse cx="55" cy="48" rx="17" ry="4" fill="#cfd5dd" />
            <ellipse cx="55" cy="48" rx="13" ry="2.6" fill="#ffe08a" />
          </g>
          {[[46, 0, -18], [60, -0.35, 14], [52, -0.7, -6], [66, -1.05, 22], [42, -1.4, -26], [58, -0.2, 4]].map(([x, d, dx], i) => (
            <g key={i} transform={`translate(${x} 46)`}>
              <g className="mv-pop" style={{ animationDelay: `${d}s`, '--dx': `${dx}px` }}>
                {puff(0, 0, 0.9)}
              </g>
            </g>
          ))}
          <rect x="18" y="36" width="74" height="80" rx="2" fill={f('glass')} />
          <path d="M24 42 v66" stroke="#fff" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" />
          <path d="M55 36 v80" stroke="#8e2219" strokeWidth="2" opacity="0.6" />
          {/* the roof and its marquee */}
          <path d="M6 30 L16 10 h78 l10 20z" fill={f('red')} />
          <rect x="22" y="-10" width="66" height="20" rx="4" fill="#ffd34d" stroke="#8e2219" strokeWidth="2" />
          <text x="55" y="4.5" fontSize="10" textAnchor="middle" fill="#8e2219" fontWeight="900" letterSpacing="0.5">
            POPCORN
          </text>
          {[12, 26, 40, 55, 70, 84, 98].map((x, i) => (
            <circle key={x} className="mv-blink" cx={x} cy="30" r="2.4" fill="#fff6c8" style={{ animationDelay: `${-(i % 2) * 0.5}s` }} />
          ))}
        </>
      );
    },
  },

  raincloud: {
    w: 16,
    vb: '0 0 140 132',
    draw: (u, f) => (
      <>
        <defs>
          <Lin id={u('cloud')} stops={[[0, '#ffffff'], [1, '#c9d6e8']]} />
          <Lin id={u('drop')} stops={[[0, '#bfe6ff'], [1, '#4aa8e8']]} />
        </defs>
        {/* a little rainbow, now and then */}
        <g className="mv-rainbow" fill="none" strokeWidth="4" strokeLinecap="round">
          <path d="M98 66 a22 22 0 0 1 40 -6" stroke="#ff7a7a" />
          <path d="M101 69 a18 18 0 0 1 33 -5" stroke="#ffd34d" />
          <path d="M104 72 a14 14 0 0 1 26 -4" stroke="#7cdc8f" />
          <path d="M107 75 a10 10 0 0 1 19 -3" stroke="#6ab8ff" />
        </g>
        {/* rain */}
        {[[38, 0], [52, -0.45], [66, -0.9], [80, -0.25], [94, -0.7], [46, -1.1], [74, -1.3], [88, -0.15]].map(([x, d], i) => (
          <path key={i} className="mv-rain" d={`M${x} 74 q-3 6 0 8 q3 -2 0 -8z`} fill={f('drop')} style={{ animationDelay: `${d}s` }} />
        ))}
        {/* the cloud, bobbing */}
        <g className="mv-bob">
          <path d="M24 74 a18 18 0 0 1 6 -34 a24 24 0 0 1 40 -16 a22 22 0 0 1 36 12 a18 18 0 0 1 8 38z" fill={f('cloud')} />
          <path d="M24 74 h90" stroke="#a9b9d0" strokeWidth="2" strokeLinecap="round" />
          <path d="M40 34 a20 20 0 0 1 22 -10" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* sleepy face */}
          <path d="M52 52 q5 4 10 0 M78 52 q5 4 10 0" stroke="#3b4a66" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <ellipse cx="48" cy="60" rx="5" ry="3" fill="#ffb3c7" opacity="0.7" />
          <ellipse cx="92" cy="60" rx="5" ry="3" fill="#ffb3c7" opacity="0.7" />
          <path d="M66 62 q4 3 8 0" stroke="#3b4a66" strokeWidth="2" fill="none" strokeLinecap="round" />
          <g className="mv-zz" fill="#6a7fa8" fontWeight="800">
            <text x="104" y="22" fontSize="11">
              z
            </text>
            <text x="114" y="12" fontSize="8">
              z
            </text>
          </g>
        </g>
      </>
    ),
  },
};
