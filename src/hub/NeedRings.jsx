'use client';

import { useNeeds } from '@/profile/needs';
import { ITEM, DEFAULT_LOOK } from '@/economy/catalog';
import Icon from '@/components/Icon';
import './rings.css';

const R = 21;
const C = 2 * Math.PI * R;

// green when full, yellow on the way down, red when he needs you
const tone = (v) => (v >= 60 ? 'good' : v >= 30 ? 'warn' : 'bad');

// The button's needs as three rings, each with his face in the middle: the
// ring fills with how full that need is and his face goes from happy to
// miserable with it. Tapping one opens the room that fixes it (`go` is the
// pager's: 2 kitchen, 3 bedroom, 4 bathroom). `children` sit at the end of
// the row (the daily chest).
export default function NeedRings({ go, equipped, children }) {
  const n = useNeeds();
  if (!n.ready) return null;
  // his face's colour: a character's own (Tabby is blue), else the paint he wears
  const skin = ITEM[equipped?.char]?.look?.c ? ITEM[equipped.char].look : (ITEM[equipped?.color] ?? ITEM[DEFAULT_LOOK.color]).look;
  const rings = [
    { id: 'hunger', label: 'Hunger', glyph: '🍔', v: n.hunger, pane: 2 },
    { id: 'energy', label: n.asleep ? 'Asleep' : 'Energy', glyph: n.asleep ? '💤' : '⚡', v: n.energy, pane: 3, asleep: n.asleep },
    { id: 'clean', label: 'Clean', glyph: '🫧', v: 100 - (n.dirt ?? 0), pane: 4 },
  ];
  return (
    <div className="need-rings">
      {rings.map((r) => {
        const v = Math.max(0, Math.min(100, Math.round(r.v)));
        const t = tone(v);
        return (
          <button key={r.id} type="button" className={`need-ring ${t} ${r.asleep ? 'asleep' : ''}`} onClick={() => go?.(r.pane)} aria-label={`${r.label}: ${v} of 100`} title={`${r.label} ${v}%`}>
            <svg viewBox="0 0 50 50" aria-hidden="true">
              <circle className="nr-track" cx="25" cy="25" r={R} />
              <circle className="nr-fill" cx="25" cy="25" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - v / 100)} transform="rotate(-90 25 25)" />
              <Face v={v} c={skin.c} cd={skin.cd} asleep={r.asleep} />
            </svg>
            <span className="nr-badge" aria-hidden="true">
              <Icon glyph={r.glyph} size={12} />
            </span>
          </button>
        );
      })}
      {children}
    </div>
  );
}

// His face, as happy as the need is full.
function Face({ v, c, cd, asleep }) {
  const mood = asleep ? 'sleep' : v >= 60 ? 'happy' : v >= 30 ? 'meh' : 'sad';
  return (
    <g>
      <circle cx="25" cy="26" r="15" fill={cd} />
      <circle cx="25" cy="25" r="15" fill={c} />
      <ellipse cx="21" cy="19" rx="5" ry="2.6" fill="#fff" opacity="0.25" transform="rotate(-24 21 19)" />
      {mood === 'sleep' || mood === 'happy' ? (
        <path d={mood === 'happy' ? 'M18.5 24 q2 -2.6 4 0 M27.5 24 q2 -2.6 4 0' : 'M18.5 23.5 q2 2 4 0 M27.5 23.5 q2 2 4 0'} stroke="#2b1d17" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="20.5" cy="23.5" r="1.9" fill="#fff" />
          <circle cx="29.5" cy="23.5" r="1.9" fill="#fff" />
          <circle cx="20.5" cy="24" r="1" fill="#2b1d17" />
          <circle cx="29.5" cy="24" r="1" fill="#2b1d17" />
        </>
      )}
      {mood === 'sad' && <path d="M18 20 l4 1.4 M32 20 l-4 1.4" stroke="#2b1d17" strokeWidth="1.3" strokeLinecap="round" />}
      <path
        d={mood === 'happy' ? 'M21 29 q4 4 8 0' : mood === 'meh' ? 'M21.5 30 h7' : mood === 'sad' ? 'M21 31.5 q4 -3.5 8 0' : 'M23.5 30 q1.5 1 3 0'}
        stroke="#2b1d17"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
      />
      {mood === 'sad' && <path d="M31.5 26 q1.2 2.4 0 3.2 q-1.2 -0.8 0 -3.2z" fill="#7cc6f0" />}
    </g>
  );
}
