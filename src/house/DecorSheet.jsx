'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Sheet from '@/components/Sheet';
import { Art } from './art';
import './decor.css';
import { buy, decorate, placePiece, unplacePiece } from '@/profile/store';
import { owns, canAfford } from '@/economy/rules';
import { HOUSE_ITEMS, HOUSE_ITEM, ROOMS, MAX_PIECES, bandOf, fitsRoom, freeSpotFor, roomOf } from '@/economy/house';
import { levelLocked } from '@/economy/levels';
import { takeFocus, lockLabel } from '@/levels/focus';
import LockTag from '@/levels/LockTag';

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
// Furniture is free-placed (see house.js): a new piece drops at a free spot
// and is then dragged around in the room itself; `moved` ({ item, x, y }) is
// where the room last dropped the piece being previewed. The bed and the
// bedside lamp keep their fixed spots.
// The same sheet is used by every room on the home screen and by /house.
export default function DecorSheet({ room, wallet, onPreview, onClose, moved, fullLink = true }) {
  const cfg = ROOMS[room];
  const cur = roomOf(wallet, room);
  // a level mission's "Go" opens the sheet on the piece it asks for
  const [focus] = useState(() => {
    const f = HOUSE_ITEM[takeFocus()];
    return f?.rooms.includes(room) ? f : null;
  });
  const [tab, setTab] = useState(focus?.kind ?? 'furniture');
  const [trying, setTrying] = useState(null);
  const [pos, setPos] = useState(null); // where a free piece being tried would go
  const [said, setSaid] = useState('');
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const item = trying ? HOUSE_ITEM[trying] : null;
  const have = item ? owns(wallet, item) : false;
  const free = !!item && !!bandOf(item); // a free-placed piece
  const spot = item?.kind === 'furniture' && !free ? item.spots.find((s) => cfg.spots.includes(s)) : null; // the bed or the nightstand
  const placed = free && cur.items.some((p) => p.item === item.id);
  const full = free && !placed && cur.items.length >= MAX_PIECES;

  // the room dragged the piece being tried somewhere (since this sheet opened)
  const [opened] = useState(() => Date.now());
  useEffect(() => {
    if (moved && moved.item === trying && moved.n >= opened) setPos({ x: moved.x, y: moved.y });
  }, [moved, trying, opened]);

  // What the room shows: the real room, plus whatever is being tried.
  const view = useMemo(() => {
    if (item && item.kind !== 'furniture' && cur[item.kind] !== item.id) return { house: { ...cur, [item.kind]: item.id }, at: item.kind };
    if (free && !placed && pos) return { house: { ...cur, items: [...cur.items, { item: item.id, ...pos }] }, at: item.id };
    if (free && placed) return { house: cur, at: item.id };
    if (spot && cur.place[spot] !== item.id) {
      const place = { ...cur.place, [spot]: item.id };
      return { house: { ...cur, place }, at: spot };
    }
    return { house: cur, at: null };
  }, [item, free, placed, pos, spot, cur]);

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
    setPos(null);
  }

  function choose(it) {
    if (trying === it.id) return cancel();
    setTrying(it.id);
    setSaid('');
    setPos(bandOf(it) ? freeSpotFor(it, cur.items) : null);
  }

  useEffect(() => {
    if (focus) choose(focus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lockedNow = item ? !have && levelLocked(wallet, item) : false;

  // Puts the piece being tried in the room. False when it can't go in.
  function put() {
    if (free) return !full && fitsRoom(item, room) && placePiece(item.id, pos.x, pos.y, room);
    return decorate(spot ?? item.kind, item.id, room);
  }

  function buyItem() {
    if (!buy(item.id)) return say("You're broke. Go play something.");
    if (!put()) say(full ? `Bought. But the room is full: ${MAX_PIECES} things, tops.` : 'Bought.');
    else say(pick(['Bought and put up. Looks great.', 'Ooh. Fancy.', 'Finally, some taste in here.']));
    cancel();
  }

  function applyItem() {
    put();
    say(pick(['There. Perfect.', 'Hmm. Acceptable.', 'Move it again and he screams.']));
    cancel();
  }

  function takeDown() {
    unplacePiece(item.id, room);
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
  const isUse = (it) => (it.kind !== 'furniture' ? cur[it.kind] === it.id : bandOf(it) ? cur.items.some((p) => p.item === it.id) : Object.values(cur.place).includes(it.id));

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
            {t.id === 'furniture' && (
              <span className={`decor-count ${cur.items.length >= MAX_PIECES ? 'is-full' : ''}`} aria-label={`${cur.items.length} of ${MAX_PIECES} placed`}>
                {cur.items.length}/{MAX_PIECES}
              </span>
            )}
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
              <button key={it.id} className={`dtile ${trying === it.id ? 'trying' : ''} ${!mine && levelLocked(wallet, it) ? 'locked' : ''}`} aria-pressed={inUse} onClick={() => choose(it)}>
                {inUse && <span className="check">✓</span>}
                <span className="dthumb">
                  {it.kind === 'furniture' ? (
                    <Art id={it.id} />
                  ) : (
                    <span className={`swatch ${it.kind === 'wall' ? 'hs-wall' : 'hs-floor'}`} {...{ [`data-${it.kind}`]: it.id }} />
                  )}
                </span>
                <span className="name">{it.name}</span>
                <span className="cost">{inUse ? (it.kind === 'furniture' ? 'Placed' : 'In use') : mine ? 'Owned' : levelLocked(wallet, it) ? <LockTag>{lockLabel(it)}</LockTag> : priceText(it.price)}</span>
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
              {have ? 'Shown in the room.' : 'Shown in the room. Nothing is charged until you buy.'}
              {short && <span className="decor-short"> · {short}</span>}
            </span>
          </div>
          <div className="row">
            <button className="pill ghost" onClick={cancel}>
              Cancel
            </button>
            {!have ? (
              <button className="pill" onClick={buyItem} disabled={lockedNow || !canAfford(wallet, item)}>
                {lockedNow ? <LockTag>{lockLabel(item)}</LockTag> : `Buy · ${priceText(item.price)}`}
              </button>
            ) : placed ? (
              <button className="pill alt" onClick={takeDown}>
                Take down
              </button>
            ) : free ? (
              <button className="pill" onClick={applyItem} disabled={full}>
                {full ? `Room full · ${MAX_PIECES}/${MAX_PIECES}` : 'Place it'}
              </button>
            ) : (spot ? cur.place[spot] === item.id : cur[item.kind] === item.id) ? null : (
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
