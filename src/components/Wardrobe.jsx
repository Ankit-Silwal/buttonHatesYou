'use client';

import { useEffect, useState } from 'react';
import Avatar from './Avatar';
import Sheet from './Sheet';
import { SLOTS, ITEMS, ITEM } from '@/economy/catalog';
import { owns, canAfford } from '@/economy/rules';
import { buy, equip } from '@/profile/store';

export const price = (p) => (p.diamonds ? `${p.diamonds} 💎` : `${p.coins} 🪙`);

// Pick a slot, tap things to try them on (the big button in the room wears
// them), buy what you like. Owned things are put on with one tap.
export default function Wardrobe({ wallet, onPreview, onSay, onClose }) {
  const [slot, setSlot] = useState('color');
  const [trying, setTrying] = useState(null);
  const tryItem = trying ? ITEM[trying] : null;

  useEffect(() => {
    onPreview(tryItem ? { ...wallet.equipped, [tryItem.slot]: tryItem.id } : null);
  }, [tryItem, wallet.equipped, onPreview]);

  function choose(item) {
    if (!owns(wallet, item)) return setTrying(item.id);
    setTrying(null);
    if (wallet.equipped[item.slot] !== item.id) {
      equip(item.slot, item.id);
      onSay('Hmm. Acceptable.', 'smug');
    }
  }

  function purchase() {
    if (!buy(tryItem.id)) return onSay("You're broke. Go play something.", 'annoyed');
    equip(tryItem.slot, tryItem.id);
    setTrying(null);
    onSay("Fine. I look amazing. Doesn't mean I like you.", 'smug');
  }

  const short = tryItem?.price && {
    coins: Math.max(0, (tryItem.price.coins ?? 0) - wallet.coins),
    diamonds: Math.max(0, (tryItem.price.diamonds ?? 0) - wallet.diamonds),
  };

  return (
    <Sheet title="Wardrobe" onClose={onClose}>
      <div className="tabs" role="tablist">
        {SLOTS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={slot === s.id}
            onClick={() => {
              setSlot(s.id);
              setTrying(null);
            }}
          >
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      <div className="sheet-body">
        <div className="tiles">
          {ITEMS.filter((i) => i.slot === slot).map((item) => {
            const have = owns(wallet, item);
            const on = wallet.equipped[slot] === item.id;
            return (
              <button
                key={item.id}
                className={`tile ${trying === item.id ? 'trying' : ''}`}
                aria-pressed={on}
                onClick={() => choose(item)}
              >
                {on && <span className="check">✓</span>}
                <Avatar size={52} equipped={{ ...wallet.equipped, [slot]: item.id }} />
                <span className="name">{item.name}</span>
                <span className="cost">{have ? (on ? 'Wearing' : 'Owned') : price(item.price)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tryItem && (
        <div className="buybar">
          <div>
            <span className="try-tag">Trying on</span>
            <b>{tryItem.name}</b>
            <span className="note">
              {canAfford(wallet, tryItem)
                ? ''
                : ` · need ${short.coins ? `${short.coins} more 🪙` : `${short.diamonds} more 💎`}`}
            </span>
          </div>
          <div className="row">
            <button className="pill ghost" onClick={() => setTrying(null)}>
              Cancel
            </button>
            <button className="pill" onClick={purchase} disabled={!canAfford(wallet, tryItem)}>
              Buy · {price(tryItem.price)}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
