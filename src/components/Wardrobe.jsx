'use client';

import { useEffect, useState } from 'react';
import Avatar from './Avatar';
import Sheet from './Sheet';
import { SLOTS, ITEMS, ITEM } from '@/economy/catalog';
import { owns, canAfford } from '@/economy/rules';
import { levelLocked } from '@/economy/levels';
import { buy, equip } from '@/profile/store';
import { CLOTHES } from '@/profile/undress';
import { takeFocus, lockLabel } from '@/levels/focus';
import LockTag from '@/levels/LockTag';

export const price = (p) => (p.diamonds ? `${p.diamonds} 💎` : `${p.coins} 🪙`);
const total = (items) => items.reduce((t, i) => ({ coins: t.coins + (i.price?.coins ?? 0), diamonds: t.diamonds + (i.price?.diamonds ?? 0) }), { coins: 0, diamonds: 0 });
const priceOf = ({ coins, diamonds }) => [coins && `${coins.toLocaleString('en-US')} 🪙`, diamonds && `${diamonds} 💎`].filter(Boolean).join(' + ');

// Pick a slot, tap things to try them on (the big button in the room wears
// them), buy what you like. Things tried on in different slots stay on
// together, so a whole look can be tried and bought at once (Buy all).
// Owned things are put on with one tap.
// The Character tab is who you play as: Bobby, and the friends levels unlock
// (a locked one only says which level; they're never bought). A level
// mission's "Go" opens the wardrobe on its item (takeFocus).
// `undressed`: his clothes are on the bathroom stand, so nothing that comes
// off can be put on (or tried on) until he's been taken back to it.
export default function Wardrobe({ wallet, undressed = false, onPreview, onSay, onClose, onBath }) {
  const [focus] = useState(() => ITEM[takeFocus()] ?? null);
  const [slot, setSlot] = useState(focus?.slot ?? 'color');
  const [trying, setTrying] = useState(() => (focus && !owns(wallet, focus) && !levelLocked(wallet, focus) ? { [focus.slot]: focus.id } : {})); // { [slot]: item id }, not owned yet
  const bobby = (wallet.equipped.char ?? 'char-bobby') === 'char-bobby';
  const tried = Object.values(trying).map((id) => ITEM[id]);
  const cost = total(tried);
  const affordable = wallet.coins >= cost.coins && wallet.diamonds >= cost.diamonds;

  useEffect(() => {
    // a color shows on Bobby, so trying one shows him
    onPreview(tried.length ? { ...wallet.equipped, ...trying, ...(trying.color ? { char: 'char-bobby' } : null) } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trying, wallet.equipped, onPreview]);

  const untry = (s) =>
    setTrying((t) => {
      const { [s]: _, ...rest } = t;
      return rest;
    });

  const stuck = (item) => undressed && (CLOTHES.includes(item.slot) || (item.slot === 'eyes' && item.id !== 'eyes-classic' && /shades|glasses|aviators|visor|monocle|3d/.test(item.id)));
  function choose(item) {
    if (stuck(item)) return onSay('My clothes are on the stand in the bathroom. Take me there.', 'annoyed');
    if (!owns(wallet, item) && levelLocked(wallet, item)) return onSay(`${lockLabel(item)} first.`, 'smug');
    if (!owns(wallet, item)) {
      if (trying[item.slot] === item.id) return untry(item.slot); // tap again: take it off
      return setTrying((t) => ({ ...t, [item.slot]: item.id }));
    }
    untry(item.slot);
    if (wallet.equipped[item.slot] !== item.id) {
      equip(item.slot, item.id);
      onSay(item.slot === 'char' ? (item.id === 'char-bobby' ? 'Me again. The original.' : `Fine. Be ${item.name}. See if I care.`) : 'Hmm. Acceptable.', 'smug');
    }
  }

  // Buys (and puts on) everything being tried, cheapest first, until the
  // money runs out.
  function buyAll() {
    let got = 0;
    for (const item of [...tried].sort((a, b) => (a.price.coins ?? 0) - (b.price.coins ?? 0))) {
      if (!buy(item.id)) break; // checks the wallet as it is after the last one
      equip(item.slot, item.id);
      untry(item.slot);
      got++;
    }
    if (!got) return onSay("You're broke. Go play something.", 'annoyed');
    onSay(got > 1 ? 'The whole look. I hate how good this is.' : "Fine. I look amazing. Doesn't mean I like you.", 'smug');
  }

  const short = { coins: Math.max(0, cost.coins - wallet.coins), diamonds: Math.max(0, cost.diamonds - wallet.diamonds) };
  // what the tiles show him in: his outfit plus everything being tried
  const look = { ...wallet.equipped, ...trying };

  return (
    <Sheet title="Wardrobe" onClose={onClose}>
      <div className="tabs" role="tablist">
        {SLOTS.map((s) => (
          <button key={s.id} role="tab" aria-selected={slot === s.id} className={trying[s.id] ? 'has-try' : undefined} onClick={() => setSlot(s.id)}>
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      {undressed && (
        <button type="button" className="ward-bare" onClick={onBath}>
          <span>His clothes are on the bathroom stand.</span>
          <b>Go get them</b>
        </button>
      )}
      <div className="sheet-body">
        {slot === 'color' && !bobby && <p className="lv-note">Colors only show on Bobby.</p>}
        <div className="tiles">
          {ITEMS.filter((i) => i.slot === slot).map((item) => {
            const have = owns(wallet, item);
            const on = (wallet.equipped[slot] ?? (slot === 'char' ? 'char-bobby' : null)) === item.id;
            const lock = !have && levelLocked(wallet, item);
            return (
              <button key={item.id} className={`tile ${trying[slot] === item.id ? 'trying' : ''} ${lock ? 'locked' : ''}`} aria-pressed={on} onClick={() => choose(item)}>
                {on && <span className="check">✓</span>}
                <Avatar size={52} equipped={{ ...look, [slot]: item.id, ...(slot === 'color' ? { char: 'char-bobby' } : null) }} />
                <span className="name">{item.name}</span>
                <span className="cost">{lock ? <LockTag>{lockLabel(item)}</LockTag> : have ? (on ? (slot === 'char' ? 'Playing' : 'Wearing') : 'Owned') : price(item.price)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tried.length > 0 && (
        <div className="buybar">
          <div className="try-list">
            <span className="try-tag">Trying on</span>
            {tried.map((i) => (
              <span key={i.id} className="try-chip">
                {i.name}
                <button aria-label={`Take off ${i.name}`} onClick={() => untry(i.slot)}>
                  ×
                </button>
              </span>
            ))}
            {!affordable && <span className="note">need {short.coins ? `${short.coins.toLocaleString('en-US')} more 🪙` : `${short.diamonds} more 💎`}</span>}
          </div>
          <div className="row">
            <button className="pill ghost" onClick={() => setTrying({})}>
              Cancel
            </button>
            <button className="pill" onClick={buyAll} disabled={!tried.some((i) => canAfford(wallet, i))}>
              {tried.length > 1 ? 'Buy all' : 'Buy'} · {priceOf(cost)}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
