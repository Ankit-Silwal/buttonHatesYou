'use client';

import { useEffect, useState } from 'react';

// The hand-drawn fixtures of the four rooms (see RoomScene.jsx and scene.css).
// The rooms' movable pieces (clock, pictures, shelves, sofa...) are furniture
// now, drawn by src/house/art-decor.jsx.
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
