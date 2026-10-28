'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Sheet from '@/components/Sheet';
import { Art } from './art';
import './decor.css';
import { buy, decorate } from '@/profile/store';
import { owns, canAfford } from '@/economy/rules';
import { HOUSE_ITEMS, HOUSE_ITEM, ROOMS, SPOT, roomOf } from '@/economy/house';

const TABS = [
  { id: 'wall', name: 'Walls', icon: '🖼️' },
  { id: 'floor', name: 'Floors', icon: '🪵' },
  { id: 'furniture', name: 'Furniture', icon: '🛋️' },
];

export const priceText = (p) => (p.diamonds ? `${p.diamonds} 💎` : `${p.coins} 🪙`);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// The decorating sheet of one room: walls, floors and furniture that fit it.
// Tap a thing to see it in the room (`onPreview` gets { house, at } to draw,
// or null when nothing is being tried), then buy it, place it or take it down.
// The same sheet is used by every room on the home screen and by /house.
export default function DecorSheet({ room, wallet, onPreview, onClose, fullLink = true }) {
  const cfg = ROOMS[room];
  const cur = roomOf(wallet, room);
  const [tab, setTab] = useState('furniture');
  const [trying, setTrying] = useState(null);
  const [spot, setSpot] = useState(null);
  const [said, setSaid] = useState('');
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const item = trying ? HOUSE_ITEM[trying] : null;
  const have = item ? owns(wallet, item) : false;
  const spots = item?.kind === 'furniture' ? item.spots.filter((s) => cfg.spots.includes(s)) : [];
  const placedAt = item?.kind === 'furniture' ? Object.keys(cur.place).find((s) => cur.place[s] === item.id) : null;

  // What the room shows: the real room, plus whatever is being tried.
  const view = useMemo(() => {
    if (item && item.kind !== 'furniture' && cur[item.kind] !== item.id) return { house: { ...cur, [item.kind]: item.id }, at: item.kind };
    if (item?.kind === 'furniture' && spot && cur.place[spot] !== item.id) {
      const place = { ...cur.place };
      for (const s of Object.keys(place)) if (place[s] === item.id) delete place[s];
      place[spot] = item.id;
      return { house: { ...cur, place }, at: spot };
    }
    return { house: cur, at: null };
  }, [item, spot, cur]);

  useEffect(() => {
    onPreview(trying ? view : null);
  }, [trying, view, onPreview]);
  useEffect(() => () => onPreview(null), [onPreview]);

  const say = (text) => {
    setSaid(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaid(''), 3600);
  };

  function cancel() {
    setTrying(null);
    setSpot(null);
  }

  function choose(it) {
    if (trying === it.id) return cancel();
    setTrying(it.id);
    setSaid('');
    if (it.kind === 'furniture') {
      const ok = it.spots.filter((s) => cfg.spots.includes(s));
      const where = Object.keys(cur.place).find((s) => cur.place[s] === it.id);
      setSpot(where ?? ok.find((s) => !cur.place[s]) ?? ok[0]);
    }
  }

  const target = () => (item.kind === 'furniture' ? spot : item.kind);

  function buyItem() {
    if (!buy(item.id)) return say("You're broke. Go play something.");
    decorate(target(), item.id, room);
    say(pick(['Bought and put up. Looks great.', 'Ooh. Fancy.', 'Finally, some taste in here.']));
    cancel();
  }

  function applyItem() {
    decorate(target(), item.id, room);
    say(pick(['There. Perfect.', 'Hmm. Acceptable.', 'Move it again and he screams.']));
    cancel();
  }

  function takeDown() {
    decorate(placedAt, null, room);
    say('Back in the box it goes.');
    cancel();
  }

  const short =
    item?.price && !canAfford(wallet, item)
      ? item.price.diamonds
        ? `need ${item.price.diamonds - wallet.diamonds} more 💎`
        : `need ${item.price.coins - wallet.coins} more 🪙`
      : null;

  const list = HOUSE_ITEMS.filter((i) => i.kind === tab && i.rooms.includes(room));
  const isUse = (it) => (it.kind === 'furniture' ? Object.values(cur.place).includes(it.id) : cur[it.kind] === it.id);
  const required = cfg.required.includes(spot); // the bed and its lamp can be swapped, not removed

  return (
    <Sheet title={`Decorate · ${cfg.name}`} onClose={onClose} className="decor-sheet">
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              cancel();
            }}
          >
            <span aria-hidden="true">{t.icon}</span> {t.name}
          </button>
        ))}
      </div>

      <div className="sheet-body">
        {said && (
          <p className="decor-said" role="status">
            {said}
          </p>
        )}
        <div className="decor-grid">
          {list.map((it) => {
            const mine = owns(wallet, it);
            const inUse = isUse(it);
            return (
              <button key={it.id} className={`dtile ${trying === it.id ? 'trying' : ''}`} aria-pressed={inUse} onClick={() => choose(it)}>
                {inUse && <span className="check">✓</span>}
                <span className="dthumb">
                  {it.kind === 'furniture' ? (
                    <Art id={it.id} />
                  ) : (
                    <span className={`swatch ${it.kind === 'wall' ? 'hs-wall' : 'hs-floor'}`} {...{ [`data-${it.kind}`]: it.id }} />
                  )}
                </span>
                <span className="name">{it.name}</span>
                <span className="cost">{inUse ? (it.kind === 'furniture' ? 'Placed' : 'In use') : mine ? 'Owned' : priceText(it.price)}</span>
              </button>
            );
          })}
        </div>
        {fullLink && (
          <p className="decor-more">
            <Link href="/house">Open the full-screen editor</Link>
          </p>
        )}
      </div>

      {item && (
        <div className="buybar">
          <div className="decor-info">
            <span className="try-tag">{have ? 'Your stuff' : 'Previewing'}</span>
            <b>{item.name}</b>
            <span className="note">
              {item.kind === 'furniture' && have ? 'Pick a spot, then place it.' : have ? 'Shown in the room.' : 'Shown in the room. Nothing is charged until you buy.'}
              {short && <span className="decor-short"> · {short}</span>}
            </span>
            {spots.length > 1 && (
              <div className="decor-spots" role="radiogroup" aria-label="Where it goes">
                {spots.map((s) => (
                  <button key={s} role="radio" aria-checked={spot === s} onClick={() => setSpot(s)}>
                    {SPOT[s].name}
                    {cur.place[s] && cur.place[s] !== item.id ? ' (swap)' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="row">
            <button className="pill ghost" onClick={cancel}>
              Cancel
            </button>
            {!have ? (
              <button className="pill" onClick={buyItem} disabled={!canAfford(wallet, item)}>
                Buy · {priceText(item.price)}
              </button>
            ) : item.kind === 'furniture' && cur.place[spot] === item.id ? (
              required ? null : (
                <button className="pill alt" onClick={takeDown}>
                  Take down
                </button>
              )
            ) : item.kind !== 'furniture' && cur[item.kind] === item.id ? null : (
              <button className="pill" onClick={applyItem}>
                {item.kind === 'furniture' ? 'Place it' : 'Use this'}
              </button>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}
