'use client';

import { useEffect, useRef, useState } from 'react';
import Sheet from '@/components/Sheet';
import { drink } from '@/profile/store';
import { canAfford } from '@/economy/rules';
import { POTIONS } from '@/economy/house';

const price = (p) => (p.diamonds ? `${p.diamonds} 💎` : `${p.coins} 🪙`);
const LABEL = { hunger: '🍔 Full', energy: '⚡ Full', clean: '🫧 Spotless' };

// Is there anything for this potion to fill?
const useful = (p, n) =>
  p.fill.some((k) => (k === 'clean' ? (n.dirt ?? 0) > 0.5 : n[k] < 99.5));

// Potions: bought and drunk on the spot, each fills a need right up (the
// elixir fills them all). Drinking one wakes him if he was asleep.
export default function PotionSheet({ wallet, needs, onSay, onClose }) {
  const [said, setSaid] = useState('');
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  function quaff(p) {
    const text = drink(p.id) ? p.quip : "You can't afford that one. Go play something.";
    if (text === p.quip) onSay?.(p.quip);
    setSaid(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaid(''), 3600);
  }

  return (
    <Sheet title="Potions" onClose={onClose} className="shop-sheet potion-sheet">
      <div className="sheet-body">
        <p className="sheet-said" role="status">
          {said || 'Each one fills a need right up, no waiting. Drinking one wakes him if he is asleep.'}
        </p>
        <ul className="menu potions">
          {POTIONS.map((p) => {
            const worth = useful(p, needs);
            return (
              <li key={p.id}>
                <button className="dish" onClick={() => quaff(p)} disabled={!canAfford(wallet, p) || !worth} aria-label={`Drink ${p.name} for ${price(p.price)}`}>
                  <span className="dish-art">
                    <Bottle color={p.color} />
                  </span>
                  <b>{p.name}</b>
                  <span className="dish-fx">{p.fill.map((k) => LABEL[k]).join(' ')}</span>
                  <span className="dish-cost">{worth ? price(p.price) : 'Already full'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}

// A round flask with a cork, filled with the potion's colour.
function Bottle({ color }) {
  return (
    <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true" focusable="false">
      <rect x="26" y="6" width="12" height="8" rx="2" fill="#b07a4a" />
      <path d="M27 14h10v9a18 18 0 1 1-10 0z" fill="#fff" fillOpacity="0.55" stroke="#4a3428" strokeOpacity="0.35" strokeWidth="2" />
      <path d="M16.5 38a15.5 15.5 0 0 0 31 0z" fill={color} />
      <path d="M16.5 38a15.5 15.5 0 0 0 31 0" fill="none" stroke="#000" strokeOpacity="0.12" strokeWidth="3" />
      <ellipse cx="32" cy="38" rx="15.5" ry="2.5" fill={color} />
      <circle cx="26" cy="45" r="2" fill="#fff" fillOpacity="0.7" />
      <circle cx="36" cy="49" r="1.3" fill="#fff" fillOpacity="0.6" />
      <path d="M22 30a12 12 0 0 1 6-5" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
