'use client';

import { useEffect, useRef, useState } from 'react';
import Sheet from '@/components/Sheet';
import { drink, stockPotion } from '@/profile/store';
import { canAfford } from '@/economy/rules';
import { POTIONS, DRAINED, DRAINED_DIRT } from '@/economy/house';

const price = (p) => (p.diamonds ? `${p.diamonds} 💎` : `${p.coins} 🪙`);
const LABEL = { hunger: '🍔 Full', energy: '⚡ Full', clean: '🫧 Spotless' };
const DRAIN_LABEL = { hunger: '🍔 Starving', energy: '💤 Exhausted', clean: '💩 Filthy' };

// Is there anything for this potion to fill (or drain)?
export const useful = (p, n) =>
  (p.fill ?? []).some((k) => (k === 'clean' ? (n.dirt ?? 0) > 0.5 : n[k] < 99.5)) ||
  (p.drain ?? []).some((k) => (k === 'clean' ? (n.dirt ?? 0) < DRAINED_DIRT : n[k] > DRAINED));

export const SOLD = POTIONS.filter((p) => !p.retired);

// The potion shop. Buying one keeps it (like food in the fridge): it waits
// on the shelf in the Kitchen and the Bedroom, or is drunk from here. Each
// fills a need right up (the Fill Everything Elixir fills them all), or for
// the nasty ones drains it; drinking one wakes him if he's asleep.
// `target`: a potion to point out (asleep in bed: the one that wakes him).
export default function PotionSheet({ wallet, needs, target, onSay, onClose }) {
  const [said, setSaid] = useState('');
  const timer = useRef(0);
  const picked = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    picked.current?.scrollIntoView({ block: 'center' }); // (it returns a Promise in newer browsers: not a cleanup)
  }, []);

  const show = (text) => {
    setSaid(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaid(''), 3600);
  };
  function buy(p) {
    if (!stockPotion(p.id)) return show("You can't afford that one. Go play something.");
    show(`${p.name} is on the shelf now.`);
  }
  function quaff(p) {
    if (!drink(p.id)) return show('Something went wrong. Try again.');
    onSay?.(p.quip);
    show(p.quip);
  }

  return (
    <Sheet title="Potions" onClose={onClose} className="shop-sheet potion-sheet">
      <div className="sheet-body">
        <p className="sheet-said" role="status">
          {said || 'Buy now, drink whenever. Some of these are good for him.'}
        </p>
        <ul className="menu potions">
          {SOLD.map((p) => {
            const worth = useful(p, needs);
            const have = wallet.potions?.[p.id] ?? 0;
            return (
              <li key={p.id} ref={p.id === target ? picked : null} className={p.id === target ? 'target' : undefined}>
                <div className="dish potion-dish">
                  <span className="dish-art">
                    <Bottle color={p.color} />
                    {have > 0 && <span className="stock-count">{have}</span>}
                  </span>
                  <b>{p.name}</b>
                  <span className="dish-fx">{p.fill ? p.fill.map((k) => LABEL[k]).join(' ') : p.drain.map((k) => DRAIN_LABEL[k]).join(' ')}</span>
                  <span className="potion-acts">
                    <button className="pill" onClick={() => buy(p)} disabled={!canAfford(wallet, p)} aria-label={`Buy ${p.name} for ${price(p.price)}`}>
                      {price(p.price)}
                    </button>
                    {have > 0 && (
                      <button className="pill alt" onClick={() => quaff(p)} disabled={!worth} aria-label={`Drink a ${p.name}`}>
                        {worth ? 'Drink' : p.fill ? 'Full' : 'Already'}
                      </button>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}

// A round flask with a cork, filled with the potion's colour.
export function Bottle({ color, size = 56 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
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
