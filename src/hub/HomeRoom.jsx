'use client';

import { useEffect, useState } from 'react';

// Dust drifting through the light: [left %, delay s, duration s, size px]
const MOTES = [
  [18, 0, 14, 4], [26, 5, 18, 3], [34, 2, 16, 5], [42, 9, 20, 3], [58, 4, 17, 4],
  [66, 11, 15, 3], [72, 1, 19, 5], [82, 7, 16, 3], [12, 13, 21, 3], [50, 6, 22, 4],
];
const STARS = [[12, 18, 2], [30, 52, 1.6], [48, 14, 2.2], [66, 40, 1.6], [82, 20, 2], [90, 58, 1.4], [20, 70, 1.4], [58, 76, 1.8]];

// Morning / day / evening / night for the window and the lighting.
function skyOf(h) {
  if (h >= 7 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  if (h >= 5 && h < 7) return 'dawn';
  return 'night';
}

// The room the button lives in: a window onto the real time of day, a clock
// that tells it, pictures, a shelf, a sofa and a plant. All drawn, no emoji.
export default function HomeRoom() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const h = now ? now.getHours() + now.getMinutes() / 60 : 12;
  const sky = skyOf(h);
  const night = sky === 'night';
  // the sun/moon travels across the window over the day
  const sunX = Math.min(88, Math.max(12, ((h - 6) / 13) * 76 + 12));
  const sunY = 70 - Math.sin(Math.min(1, Math.max(0, (h - 6) / 13)) * Math.PI) * 52;
  const minDeg = now ? now.getMinutes() * 6 : 0;
  const hourDeg = now ? ((now.getHours() % 12) + now.getMinutes() / 60) * 30 : 0;

  return (
    <div className="hub-room" data-sky={sky} aria-hidden="true">
      <div className="room-wall" />
      <div className="room-shaft" />
      <div className="room-lamp" />
      <div className="room-floor" />
      <div className="room-rug" />
      <div className="room-glow" />

      <div className="r-window">
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
        <span className="rw-curtain l" />
        <span className="rw-curtain r" />
        <span className="rw-sill" />
      </div>

      <svg className="r-frame" viewBox="0 0 80 64" focusable="false">
        <rect x="2" y="2" width="76" height="60" rx="5" fill="#b8854f" />
        <rect x="2" y="2" width="76" height="60" rx="5" fill="none" stroke="#8f6335" strokeWidth="2" />
        <rect x="8" y="8" width="64" height="48" rx="2" fill="#fbeed3" />
        <rect x="8" y="8" width="64" height="30" fill="#ffd9a0" />
        <circle cx="52" cy="24" r="8" fill="#ff9a63" />
        <path d="M8 56 V40 l16 -14 14 12 12 -16 22 20 V56z" fill="#7aa580" />
        <path d="M8 56 V46 l18 -8 16 8 12 -6 18 8 V56z" fill="#5d8b6a" />
      </svg>

      <svg className="r-clock" viewBox="0 0 60 60" focusable="false">
        <circle cx="30" cy="30" r="27" fill="#b8854f" />
        <circle cx="30" cy="30" r="22" fill="#fff8ea" />
        {[0, 90, 180, 270].map((a) => (
          <rect key={a} x="29" y="10" width="2" height="5" rx="1" fill="#8a6f5e" transform={`rotate(${a} 30 30)`} />
        ))}
        <line x1="30" y1="30" x2="30" y2="17" stroke="#4a3428" strokeWidth="3" strokeLinecap="round" transform={`rotate(${hourDeg} 30 30)`} />
        <line x1="30" y1="30" x2="30" y2="11" stroke="#4a3428" strokeWidth="2" strokeLinecap="round" transform={`rotate(${minDeg} 30 30)`} />
        <circle cx="30" cy="30" r="2.6" fill="#e2674f" />
      </svg>

      <svg className="r-shelf" viewBox="0 0 120 64" focusable="false">
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

      <svg className="r-plant" viewBox="0 0 80 120" focusable="false">
        <path d="M40 78 C 20 66 8 40 18 10 C 34 28 40 52 40 78z" fill="#5f9a62" />
        <path d="M40 78 C 60 62 74 36 62 6 C 46 26 40 50 40 78z" fill="#7bb67a" />
        <path d="M40 80 C 34 56 38 34 42 12 C 50 36 48 60 40 80z" fill="#4c8754" />
        <path d="M40 78 L40 24" stroke="#3d7447" strokeWidth="1.5" fill="none" />
        <path d="M14 82 h52 l-7 34 a6 6 0 0 1 -6 4 h-26 a6 6 0 0 1 -6 -4z" fill="#d9774f" />
        <rect x="10" y="76" width="60" height="10" rx="5" fill="#e98c63" />
        <path d="M18 90 h44" stroke="#fff" strokeOpacity=".18" strokeWidth="3" strokeLinecap="round" />
      </svg>

      <svg className="r-sofa" viewBox="0 0 220 110" focusable="false">
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

      <svg className="r-lampstand" viewBox="0 0 50 150" focusable="false">
        <path d="M10 6 h30 l8 30 h-46z" fill="#ffd98f" />
        <path d="M10 6 h30 l8 30 h-46z" fill="url(#lampShine)" />
        <defs>
          <linearGradient id="lampShine" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".5" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="23" y="36" width="4" height="102" fill="#7a4f2b" />
        <ellipse cx="25" cy="140" rx="17" ry="6" fill="#7a4f2b" />
      </svg>

      <div className="room-motes">
        {MOTES.map(([x, d, t, sz], i) => (
          <i key={i} style={{ '--x': `${x}%`, '--d': `-${d}s`, '--t': `${t}s`, '--sz': `${sz}px` }} />
        ))}
      </div>
      <div className="room-night" />
    </div>
  );
}
