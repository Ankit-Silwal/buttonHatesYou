'use client';

import { useEffect, useState } from 'react';

// The hand-drawn props of the four rooms (see RoomScene.jsx and scene.css).
// Every piece is an inline SVG (or a few styled boxes) with no emoji, drawn in
// the same warm palette. They carry no gradients with ids so any number can
// share a page.

// Dust drifting through the light: [left %, delay s, duration s, size px]
export const MOTES = [
  [18, 0, 14, 4], [26, 5, 18, 3], [34, 2, 16, 5], [42, 9, 20, 3], [58, 4, 17, 4],
  [66, 11, 15, 3], [72, 1, 19, 5], [82, 7, 16, 3], [12, 13, 21, 3], [50, 6, 22, 4],
];
const STARS = [[12, 18, 2], [30, 52, 1.6], [48, 14, 2.2], [66, 40, 1.6], [82, 20, 2], [90, 58, 1.4], [20, 70, 1.4], [58, 76, 1.8]];

// The real time, refreshed every half minute (null until mounted, so the
// server and the first client render agree).
export function useClock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

// A window onto the real time of day. `dress` picks the curtains.
export function Window({ sky, dress = 'curtain', className = '' }) {
  const now = useClock();
  const h = now ? now.getHours() + now.getMinutes() / 60 : 12;
  const night = sky === 'night';
  // the sun travels across the window over the day
  const sunX = Math.min(88, Math.max(12, ((h - 6) / 13) * 76 + 12));
  const sunY = 70 - Math.sin(Math.min(1, Math.max(0, (h - 6) / 13)) * Math.PI) * 52;
  return (
    <div className={`r-window ${className}`} data-sky={sky} data-dress={dress} aria-hidden="true">
      <div className="rw-sky">
        {night ? (
          <>
            {STARS.map(([x, y, s], i) => (
              <i key={i} className="rw-star" style={{ left: `${x}%`, top: `${y}%`, width: s * 2, height: s * 2, animationDelay: `${i * 0.4}s` }} />
            ))}
            <i className="rw-moon" />
          </>
        ) : (
          <i className="rw-sun" style={{ left: `${sunX}%`, top: `${sunY}%` }} />
        )}
        <i className="rw-cloud c1" />
        <i className="rw-cloud c2" />
        <span className="rw-hills" />
      </div>
      <span className="rw-bar v" />
      <span className="rw-bar h" />
      {dress === 'curtain' && (
        <>
          <span className="rw-curtain l" />
          <span className="rw-curtain r" />
        </>
      )}
      {dress === 'valance' && <span className="rw-valance" />}
      {dress === 'night' && (
        <>
          <span className="rw-curtain l" />
          <span className="rw-curtain r" />
        </>
      )}
      <span className="rw-sill" />
    </div>
  );
}

/* ------------------------------ living room ------------------------------ */

export function Frame() {
  return (
    <svg className="rp r-frame" viewBox="0 0 80 64" focusable="false">
      <rect x="2" y="2" width="76" height="60" rx="5" fill="#b8854f" />
      <rect x="2" y="2" width="76" height="60" rx="5" fill="none" stroke="#8f6335" strokeWidth="2" />
      <rect x="8" y="8" width="64" height="48" rx="2" fill="#fbeed3" />
      <rect x="8" y="8" width="64" height="30" fill="#ffd9a0" />
      <circle cx="52" cy="24" r="8" fill="#ff9a63" />
      <path d="M8 56 V40 l16 -14 14 12 12 -16 22 20 V56z" fill="#7aa580" />
      <path d="M8 56 V46 l18 -8 16 8 12 -6 18 8 V56z" fill="#5d8b6a" />
    </svg>
  );
}

export function Clock() {
  const now = useClock();
  const minDeg = now ? now.getMinutes() * 6 : 0;
  const hourDeg = now ? ((now.getHours() % 12) + now.getMinutes() / 60) * 30 : 0;
  return (
    <svg className="rp r-clock" viewBox="0 0 60 60" focusable="false">
      <circle cx="30" cy="30" r="27" fill="#b8854f" />
      <circle cx="30" cy="30" r="22" fill="#fff8ea" />
      {[0, 90, 180, 270].map((a) => (
        <rect key={a} x="29" y="10" width="2" height="5" rx="1" fill="#8a6f5e" transform={`rotate(${a} 30 30)`} />
      ))}
      <line x1="30" y1="30" x2="30" y2="17" stroke="#4a3428" strokeWidth="3" strokeLinecap="round" transform={`rotate(${hourDeg} 30 30)`} />
      <line x1="30" y1="30" x2="30" y2="11" stroke="#4a3428" strokeWidth="2" strokeLinecap="round" transform={`rotate(${minDeg} 30 30)`} />
      <circle cx="30" cy="30" r="2.6" fill="#e2674f" />
    </svg>
  );
}

export function Shelf() {
  return (
    <svg className="rp r-shelf" viewBox="0 0 120 64" focusable="false">
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
    </svg>
  );
}

export function Plant() {
  return (
    <svg className="rp r-plant" viewBox="0 0 80 120" focusable="false">
      <path d="M40 78 C 20 66 8 40 18 10 C 34 28 40 52 40 78z" fill="#5f9a62" />
      <path d="M40 78 C 60 62 74 36 62 6 C 46 26 40 50 40 78z" fill="#7bb67a" />
      <path d="M40 80 C 34 56 38 34 42 12 C 50 36 48 60 40 80z" fill="#4c8754" />
      <path d="M40 78 L40 24" stroke="#3d7447" strokeWidth="1.5" fill="none" />
      <path d="M14 82 h52 l-7 34 a6 6 0 0 1 -6 4 h-26 a6 6 0 0 1 -6 -4z" fill="#d9774f" />
      <rect x="10" y="76" width="60" height="10" rx="5" fill="#e98c63" />
      <path d="M18 90 h44" stroke="#fff" strokeOpacity=".18" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Sofa() {
  return (
    <svg className="rp r-sofa" viewBox="0 0 220 110" focusable="false">
      <rect x="14" y="28" width="192" height="58" rx="22" fill="#4f8f9a" />
      <rect x="0" y="52" width="40" height="52" rx="16" fill="#3e7a85" />
      <rect x="180" y="52" width="40" height="52" rx="16" fill="#3e7a85" />
      <rect x="34" y="52" width="152" height="40" rx="14" fill="#6bb0b9" />
      <path d="M110 54 V90" stroke="#4f8f9a" strokeWidth="3" />
      <rect x="40" y="98" width="10" height="10" rx="3" fill="#7a4f2b" />
      <rect x="170" y="98" width="10" height="10" rx="3" fill="#7a4f2b" />
      <rect x="58" y="40" width="34" height="30" rx="9" fill="#f0c36d" transform="rotate(-10 75 55)" />
      <path d="M64 50 l22 -6 M62 58 l22 -6" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
    </svg>
  );
}

export function FloorLamp() {
  return (
    <svg className="rp r-lampstand" viewBox="0 0 50 150" focusable="false">
      <path d="M10 6 h30 l8 30 h-46z" fill="#ffd98f" />
      <path d="M14 8 l-4 26" stroke="#fff" strokeOpacity=".5" strokeWidth="4" strokeLinecap="round" />
      <rect x="23" y="36" width="4" height="102" fill="#7a4f2b" />
      <ellipse cx="25" cy="140" rx="17" ry="6" fill="#7a4f2b" />
    </svg>
  );
}

/* --------------------------------- kitchen -------------------------------- */

export function Fridge() {
  return (
    <svg className="rp k-fridge" viewBox="0 0 60 140" focusable="false">
      <rect x="3" y="3" width="54" height="134" rx="8" fill="#cfe6e4" />
      <rect x="3" y="3" width="54" height="134" rx="8" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" />
      <path d="M3 46 H57" stroke="#8fb3b0" strokeWidth="2" />
      <rect x="44" y="14" width="4" height="26" rx="2" fill="#f4f1e8" />
      <rect x="44" y="56" width="4" height="46" rx="2" fill="#f4f1e8" />
      <rect x="12" y="62" width="14" height="14" fill="#fff8e6" transform="rotate(-5 19 69)" />
      <circle cx="19" cy="60" r="3" fill="#e2674f" />
      <rect x="14" y="84" width="9" height="9" rx="2" fill="#5b8fd6" />
      <path d="M26 82 l4 -2 4 2 -1 5h-6z" fill="#ffd36b" />
      <path d="M10 8 q-2 60 0 120" stroke="#fff" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// The run of cabinets with the sink on top.
export function Counter() {
  return (
    <div className="k-counter">
      <svg className="k-sink" viewBox="0 0 70 44" focusable="false">
        <path d="M6 34 q0 -6 6 -6 h46 q6 0 6 6 v4 h-58z" fill="#aab3c0" />
        <path d="M10 34 h50" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" />
        <path d="M44 28 V14 q0 -8 -8 -8 h-6" stroke="#c9d1db" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <rect x="26" y="4" width="8" height="6" rx="2" fill="#aab3c0" />
        <circle cx="44" cy="28" r="3" fill="#8e97a4" />
      </svg>
      <span className="top" />
      <span className="doors">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <i key={i} />
        ))}
      </span>
    </div>
  );
}

export function Stove() {
  return (
    <svg className="rp k-stove" viewBox="0 0 84 70" focusable="false">
      <rect x="3" y="14" width="78" height="52" rx="6" fill="#cfd6dd" />
      <rect x="3" y="10" width="78" height="8" rx="3" fill="#8e97a4" />
      <rect x="12" y="30" width="60" height="30" rx="4" fill="#4b5560" />
      <rect x="16" y="34" width="52" height="22" rx="3" fill="#7e8b97" opacity=".55" />
      <path d="M20 38 l12 -2" stroke="#fff" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />
      <rect x="22" y="24" width="40" height="3" rx="1.5" fill="#f4f1e8" />
      {[18, 34, 50, 66].map((x) => (
        <circle key={x} cx={x} cy="21" r="2.4" fill="#4b5560" />
      ))}
      <path d="M44 10 h22 l-2 -10 h-18z" fill="#e2674f" />
      <rect x="62" y="2" width="8" height="3" rx="1.5" fill="#4b5560" />
      <g className="steam" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round">
        <path d="M50 -2 q-3 -5 0 -9 q3 -4 0 -8" />
        <path d="M57 -2 q-3 -5 0 -9 q3 -4 0 -8" />
      </g>
    </svg>
  );
}

export function Hood() {
  return (
    <svg className="rp k-hood" viewBox="0 0 84 50" focusable="false">
      <rect x="32" y="0" width="20" height="22" fill="#aab3c0" />
      <path d="M32 0 h20 v22 h-20z" fill="none" stroke="#fff" strokeOpacity=".4" />
      <path d="M4 44 L24 20 H60 L80 44 Z" fill="#cfd6dd" />
      <path d="M4 44 L24 20 H60 L80 44 Z" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.5" />
      <rect x="2" y="42" width="80" height="6" rx="3" fill="#8e97a4" />
      <rect x="28" y="44" width="28" height="2" rx="1" fill="#ffe9a8" />
    </svg>
  );
}

export function WallShelf() {
  return (
    <svg className="rp k-shelf" viewBox="0 0 120 64" focusable="false">
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
    </svg>
  );
}

export function Table() {
  return (
    <svg className="rp k-table" viewBox="0 0 150 110" focusable="false">
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
    </svg>
  );
}

export function Pendant() {
  return (
    <svg className="rp k-pendant" viewBox="0 0 60 120" focusable="false">
      <rect x="29" y="0" width="2" height="62" fill="#4a3428" />
      <path d="M8 90 Q10 62 30 60 Q50 62 52 90z" fill="#e2674f" />
      <path d="M14 84 Q16 68 28 64" stroke="#fff" strokeOpacity=".5" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="6" y="88" width="48" height="5" rx="2.5" fill="#b84a36" />
      <ellipse className="bulb-lit" cx="30" cy="98" rx="9" ry="7" fill="#fff4cf" />
    </svg>
  );
}

/* --------------------------------- bedroom -------------------------------- */

export function StringLights() {
  return (
    <svg className="rp b-lights" viewBox="0 0 400 44" preserveAspectRatio="none" focusable="false">
      <path d="M0 4 Q50 36 100 8 T200 8 T300 8 T400 4" fill="none" stroke="#2d2a4a" strokeWidth="1.6" />
      {[[24, 20], [62, 25], [100, 8], [140, 20], [178, 17], [220, 14], [258, 24], [300, 8], [340, 21], [378, 12]].map(([x, y], i) => (
        <g key={i} className="bulb" style={{ animationDelay: `${i * 0.35}s` }}>
          <circle cx={x} cy={y + 5} r="9" fill="#ffd36b" opacity=".22" />
          <circle cx={x} cy={y + 5} r="3.6" fill={['#ffd36b', '#ff9a8a', '#ffe9a8', '#9fd8ff'][i % 4]} />
        </g>
      ))}
    </svg>
  );
}

export function Wardrobe() {
  return (
    <svg className="rp b-wardrobe" viewBox="0 0 100 190" focusable="false">
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
    </svg>
  );
}

export function Poster() {
  return (
    <svg className="rp b-poster" viewBox="0 0 80 100" focusable="false">
      <rect x="2" y="2" width="76" height="96" rx="4" fill="#f4eee0" />
      <rect x="8" y="8" width="64" height="84" rx="2" fill="#26307a" />
      <circle cx="52" cy="30" r="12" fill="#fdf6d8" />
      <circle cx="57" cy="27" r="11" fill="#26307a" />
      <path d="M8 92 V68 l16 -16 12 12 14 -22 22 28 V92z" fill="#3f4fa8" />
      <path d="M8 92 V78 l18 -10 16 10 12 -8 18 8 V92z" fill="#2c3a8a" />
      {[[18, 18], [30, 40], [40, 14], [20, 52], [64, 54]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.3" fill="#fff" />
      ))}
    </svg>
  );
}

/* -------------------------------- bathroom -------------------------------- */

export function Mirror() {
  return (
    <svg className="rp t-mirror" viewBox="0 0 80 100" focusable="false">
      <path d="M6 96 V40 a34 34 0 0 1 68 0 V96z" fill="#e6cfb1" />
      <path d="M12 90 V40 a28 28 0 0 1 56 0 V90z" fill="#e9f8fb" />
      <path d="M12 90 V40 a28 28 0 0 1 56 0 V90z" fill="#bfe4ee" opacity=".55" />
      <path d="M22 70 L50 24" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".7" />
      <path d="M34 80 L56 44" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".5" />
    </svg>
  );
}

export function Vanity() {
  return (
    <svg className="rp t-vanity" viewBox="0 0 120 84" focusable="false">
      <rect x="6" y="28" width="108" height="52" rx="5" fill="#f4f1e8" />
      <rect x="6" y="28" width="108" height="52" rx="5" fill="none" stroke="#c9bfa8" strokeWidth="1.5" />
      <rect x="12" y="36" width="45" height="38" rx="3" fill="#e8e2d2" />
      <rect x="63" y="36" width="45" height="38" rx="3" fill="#e8e2d2" />
      <circle cx="50" cy="55" r="2.6" fill="#c58a55" />
      <circle cx="70" cy="55" r="2.6" fill="#c58a55" />
      <rect x="0" y="20" width="120" height="12" rx="6" fill="#fffaf2" />
      <path d="M30 20 q0 -8 12 -8 h36 q12 0 12 8z" fill="#cfeaf2" />
      <path d="M76 16 V4 q0 -4 -5 -4 h-6" stroke="#aab3c0" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="9" y="82" width="10" height="2" rx="1" fill="#8a6f5e" />
      <rect x="101" y="82" width="10" height="2" rx="1" fill="#8a6f5e" />
    </svg>
  );
}

export function Towels() {
  return (
    <svg className="rp t-towels" viewBox="0 0 100 90" focusable="false">
      <rect x="4" y="6" width="92" height="5" rx="2.5" fill="#b8854f" />
      <rect x="4" y="2" width="5" height="14" rx="2.5" fill="#8f6335" />
      <rect x="91" y="2" width="5" height="14" rx="2.5" fill="#8f6335" />
      <path d="M14 8 h34 v64 q-17 6 -34 0z" fill="#fff" />
      <path d="M14 56 h34 v6 h-34z M14 64 h34 v3 h-34z" fill="#f0c36d" />
      <path d="M54 8 h34 v52 q-17 6 -34 0z" fill="#fff" />
      <path d="M54 44 h34 v6 h-34z M54 52 h34 v3 h-34z" fill="#e2674f" />
    </svg>
  );
}

export function Duck() {
  return (
    <svg className="rp t-duck" viewBox="0 0 60 50" focusable="false">
      <ellipse cx="30" cy="44" rx="22" ry="4" fill="#2a1608" opacity=".15" />
      <path d="M8 30 q0 14 22 14 q22 0 22 -14 q-8 6 -16 -2 q-12 8 -28 2z" fill="#ffd23f" />
      <path d="M44 26 q6 -2 8 -6 q-6 0 -8 2z" fill="#ffd23f" />
      <circle cx="38" cy="18" r="11" fill="#ffd23f" />
      <path d="M47 18 q8 0 9 3 q-5 3 -10 1z" fill="#ff8a3d" />
      <circle cx="41" cy="15" r="1.8" fill="#4a3428" />
      <path d="M12 32 q8 6 20 2" stroke="#e8b81e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
