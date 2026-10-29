'use client';

import { drink } from '@/profile/store';
import { SOLD, Bottle, useful } from './PotionSheet';

// The potions he owns, on a little shelf in the room's tray (Kitchen and
// Bedroom): tap one and he drinks it. Nothing shows when there are none.
// `onDrink(potion, ok)` lets the room react (a quip, or why not).
export default function PotionShelf({ wallet, needs, onDrink }) {
  const kept = SOLD.filter((p) => (wallet.potions?.[p.id] ?? 0) > 0);
  if (!kept.length) return null;

  function sip(p) {
    if (!useful(p, needs)) return onDrink?.(p, false);
    onDrink?.(p, drink(p.id));
  }

  return (
    <ul className="potion-shelf" aria-label="Potions">
      {kept.map((p) => (
        <li key={p.id}>
          <button type="button" className="shelf-potion" onClick={() => sip(p)} aria-label={`Drink ${p.name}, ${wallet.potions[p.id]} left`} title={p.name}>
            <Bottle color={p.color} size={40} />
            <span className="stock-count">{wallet.potions[p.id]}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
