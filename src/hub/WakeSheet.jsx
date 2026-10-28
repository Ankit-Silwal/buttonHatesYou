'use client';

import { useEffect, useRef, useState } from 'react';
import Sheet from '@/components/Sheet';
import { wake } from '@/profile/store';
import { canAfford } from '@/economy/rules';
import { WAKE_OPTIONS } from '@/economy/house';

const price = (p) => (p.diamonds ? `${p.diamonds} 💎` : `${p.coins} 🪙`);

// Paid ways to get him out of bed on the spot, with some energy back.
export default function WakeSheet({ wallet, asleep, onSay, onClose }) {
  const [said, setSaid] = useState('');
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  function wakeWith(o) {
    if (!wake(o.id)) {
      setSaid("You can't afford that. Let him sleep, or wake him with the lamp for free.");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setSaid(''), 3600);
      return;
    }
    onSay(o.quip);
    onClose();
  }

  return (
    <Sheet title="Wake-up options" onClose={onClose} className="shop-sheet wake-sheet">
      <div className="sheet-body">
        <p className="sheet-said" role="status">
          {said || 'Waking him with the lamp is free but leaves him as sleepy as he was. These wake him on the spot and give some energy back.'}
        </p>
        <ul className="menu wakes">
          {WAKE_OPTIONS.map((o) => (
            <li key={o.id}>
              <button className="dish" onClick={() => wakeWith(o)} disabled={!asleep || !canAfford(wallet, o)} aria-label={`Wake him with ${o.name}`}>
                <span className="dish-art emoji" aria-hidden="true">
                  {o.icon}
                </span>
                <b>{o.name}</b>
                <span className="dish-fx">⚡ +{o.energy}</span>
                <span className="dish-cost">{asleep ? price(o.price) : 'he is awake'}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}
