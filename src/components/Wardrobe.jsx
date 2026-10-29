'use client';

import { useEffect, useState } from 'react';
import Avatar from './Avatar';
import Sheet from './Sheet';
import { SLOTS, ITEMS, ITEM } from '@/economy/catalog';
import { owns, canAfford } from '@/economy/rules';
import { levelLocked } from '@/economy/levels';
import { buy, equip } from '@/profile/store';
import { takeFocus, lockLabel } from '@/levels/focus';
import LockTag from '@/levels/LockTag';

export const price = (p) => (p.diamonds ? `${p.diamonds} 💎` : `${p.coins} 🪙`);

// Pick a slot, tap things to try them on (the big button in the room wears
// them), buy what you like. Owned things are put on with one tap.
// The Character tab is who you play as: Bobby, and the friends levels
// unlock (locked ones can be tried on, not bought). A level mission's "Go"
// opens the wardrobe on its item (takeFocus).
export default function Wardrobe({ wallet, onPreview, onSay, onClose }) {
  const [focus] = useState(() => ITEM[takeFocus()] ?? null);
  const [slot, setSlot] = useState(focus?.slot ?? 'color');
  const [trying, setTrying] = useState(focus && !owns(wallet, focus) ? focus.id : null);
  const tryItem = trying ? ITEM[trying] : null;
  const locked = (item) => levelLocked(wallet, item);
  const bobby = (wallet.equipped.char ?? 'char-bobby') === 'char-bobby';

  useEffect(() => {
    onPreview(tryItem ? { ...wallet.equipped, [tryItem.slot]: tryItem.id, ...(tryItem.slot === 'color' ? { char: 'char-bobby' } : null) } : null);
  }, [tryItem, wallet.equipped, onPreview]);

  function choose(item) {
    if (!owns(wallet, item)) return setTrying(item.id);
    setTrying(null);
    if (wallet.equipped[item.slot] !== item.id) {
      equip(item.slot, item.id);
      onSay(item.slot === 'char' ? (item.id === 'char-bobby' ? 'Me again. The original.' : `Fine. Be ${item.name}. See if I care.`) : 'Hmm. Acceptable.', 'smug');
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
        {slot === 'color' && !bobby && <p className="lv-note">Colors only show on Bobby.</p>}
        <div className="tiles">
          {ITEMS.filter((i) => i.slot === slot).map((item) => {
            const have = owns(wallet, item);
            const on = (wallet.equipped[slot] ?? (slot === 'char' ? 'char-bobby' : null)) === item.id;
            const lock = !have && locked(item);
            // colors only paint Bobby, so their tiles show him
            const look = { ...wallet.equipped, [slot]: item.id, ...(slot === 'color' ? { char: 'char-bobby' } : null) };
            return (
              <button
                key={item.id}
                className={`tile ${trying === item.id ? 'trying' : ''} ${lock ? 'locked' : ''}`}
                aria-pressed={on}
                onClick={() => choose(item)}
              >
                {on && <span className="check">✓</span>}
                <Avatar size={52} equipped={look} />
                <span className="name">{item.name}</span>
                <span className="cost">{lock ? <LockTag>{lockLabel(item)}</LockTag> : have ? (on ? (slot === 'char' ? 'Playing' : 'Wearing') : 'Owned') : price(item.price)}</span>
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
              {locked(tryItem)
                ? ` · ${lockLabel(tryItem)}`
                : canAfford(wallet, tryItem)
                  ? ''
                  : ` · need ${short.coins ? `${short.coins} more 🪙` : `${short.diamonds} more 💎`}`}
            </span>
          </div>
          <div className="row">
            <button className="pill ghost" onClick={() => setTrying(null)}>
              Cancel
            </button>
            {tryItem.price ? (
              <button className="pill" onClick={purchase} disabled={locked(tryItem) || !canAfford(wallet, tryItem)}>
                {locked(tryItem) ? <LockTag>{lockLabel(tryItem)}</LockTag> : `Buy · ${price(tryItem.price)}`}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </Sheet>
  );
}
