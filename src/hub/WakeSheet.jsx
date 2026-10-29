'use client';

import { useEffect, useRef, useState } from 'react';
import Sheet from '@/components/Sheet';
import { wake } from '@/profile/store';
import { canAfford } from '@/economy/rules';
import { WAKE_OPTIONS } from '@/economy/house';

const price = (p) => (p.diamonds ? `${p.diamonds} 💎` : `${p.coins} 🪙`);

// Paid energy boosts. Asleep, they get him out of bed on the spot; awake,
// they keep him going without a nap. Either way he gets energy back.
export default function WakeSheet({ wallet, asleep, onSay, onClose }) {
  const [said, setSaid] = useState('');
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  function wakeWith(o) {
    if (!wake(o.id)) {
      setSaid(asleep ? "You can't afford that. Let him sleep, or wake him with the lamp for free." : "You can't afford that. A nap is free, though.");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setSaid(''), 3600);
      return;
    }
    onSay(o.quip);
    onClose();
  }

  return (
    <Sheet title={asleep ? 'Wake-up options' : 'Energy boosts'} onClose={onClose} className="shop-sheet wake-sheet">
      <div className="sheet-body">
        <p className="sheet-said" role="status">
          {said ||
            (asleep
              ? 'Waking him with the lamp is free but leaves him as sleepy as he was. These wake him on the spot and give some energy back.'
              : 'No time for a nap? These give him energy right now, no bed needed.')}
        </p>
        <ul className="menu wakes">
          {WAKE_OPTIONS.map((o) => (
            <li key={o.id}>
              <button className="dish" onClick={() => wakeWith(o)} disabled={!canAfford(wallet, o)} aria-label={asleep ? `Wake him with ${o.name}` : `Give him ${o.name}`}>
                <span className="dish-art emoji" aria-hidden="true">
                  {o.icon}
                </span>
                <b>{o.name}</b>
                <span className="dish-fx">⚡ +{o.energy}</span>
                <span className="dish-cost">{price(o.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  );
}
