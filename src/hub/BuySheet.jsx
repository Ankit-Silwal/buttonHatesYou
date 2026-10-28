'use client';

import { useEffect, useRef, useState } from 'react';
import Sheet from '@/components/Sheet';
import { Art } from '@/house/art';
import { stockFood } from '@/profile/store';
import { canAfford, STOCK_MAX } from '@/economy/rules';
import { FOODS } from '@/economy/house';

const price = (p) => (p.diamonds ? `${p.diamonds} 💎` : `${p.coins} 🪙`);

// The whole menu as a grid. Tapping a dish buys ONE and puts it in the
// fridge; it is eaten from the strip in the Kitchen.
export default function BuySheet({ wallet, onClose }) {
  const [said, setSaid] = useState('');
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  function buy(f) {
    const full = (wallet.pantry?.[f.id] || 0) >= STOCK_MAX;
    if (full) setSaid(`The fridge can't hold more ${f.name}.`);
    else if (!stockFood(f.id)) setSaid("You're broke. Go play something.");
    else setSaid(`${f.name} is in the fridge.`);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaid(''), 3200);
  }

  return (
    <Sheet title="Buy food" onClose={onClose} className="shop-sheet">
      <div className="sheet-body">
        <p className="sheet-said" role="status">
          {said || 'Tap a dish to put one in the fridge. Feed him from the strip in the Kitchen.'}
        </p>
        <ul className="menu">
          {FOODS.map((f) => {
            const own = wallet.pantry?.[f.id] || 0;
            return (
              <li key={f.id}>
                <button className="dish" onClick={() => buy(f)} disabled={!canAfford(wallet, f) || own >= STOCK_MAX} aria-label={`Buy one ${f.name} for ${price(f.price)}. ${own} in the fridge.`}>
                  <span className="dish-art">
                    <Art id={f.id} />
                  </span>
                  <b>{f.name}</b>
                  <span className="dish-fx">
                    {f.hunger ? `🍔 +${f.hunger}` : ''} {f.energy ? `⚡ +${f.energy}` : ''}
                  </span>
                  <span className="dish-cost">{price(f.price)}</span>
                  {own > 0 && <span className="dish-have">{own} in fridge</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}
