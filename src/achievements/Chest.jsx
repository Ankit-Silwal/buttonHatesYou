'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useProfile } from '@/profile/useProfile';
import { openChest, buyChest } from '@/profile/store';
import { chestFor } from '@/economy/rules';
import { CHEST, isBigDay, BUY_CHEST, RARITIES } from '@/economy/chest';
import { FOOD, HOUSE_ITEM } from '@/economy/house';
import { Art } from '@/house/art';
import './achievements.css';

// The clock, ticking once a minute (0 until mounted, so the server render and
// the first browser render agree).
export function useNow(every = 30_000) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(t);
  }, [every]);
  return now;
}

// Today's chest, as the wallet sees it: { ready, streak (if opened now), alive, next }.
export function useChest() {
  const { wallet, ready } = useProfile();
  const now = useNow();
  if (!ready || !now) return null;
  return chestFor(wallet, now);
}

const until = (t, now) => {
  const m = Math.max(1, Math.ceil((t - now) / 60_000));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

// A row of 7 dots: where today falls in the week's streak (day 7 is the big one).
export function Streak({ streak, today }) {
  const inWeek = streak ? ((streak - 1) % CHEST.bigEvery) + 1 : 0;
  return (
    <span className="streak" aria-label={`Streak: ${streak} day${streak === 1 ? '' : 's'}`}>
      {Array.from({ length: CHEST.bigEvery }, (_, i) => (
        <i key={i} className={`${i < inWeek ? 'on' : ''} ${i === inWeek - 1 && today ? 'today' : ''} ${i === CHEST.bigEvery - 1 ? 'big' : ''}`} />
      ))}
      <b>🔥 {streak}</b>
    </span>
  );
}

// The chest itself, drawn in CSS. `state`: closed | shaking | tapped | open.
// `rarity`: a coin chest's colors (common, rare, epic, legendary).
export function ChestArt({ state = 'closed', big = false, rarity = null }) {
  return (
    <span className={`chest-art ${state} ${big ? 'big' : ''} ${rarity ? `rarity rarity-${rarity}` : ''}`} aria-hidden="true">
      <span className="chest-rays" />
      <span className="chest-lid" />
      <span className="chest-body">
        <span className="chest-lock" />
      </span>
    </span>
  );
}

// What came out of the chest, as flying bits and then a list.
function lootList(loot) {
  const out = [{ k: 'coins', icon: '🪙', text: `${loot.coins} coins` }];
  if (loot.food) out.push({ k: 'food', icon: '🍪', text: `${FOOD[loot.food]?.name ?? 'A snack'} (free, in the house)` });
  if (loot.energy) out.push({ k: 'energy', icon: '⚡', text: 'Full energy' });
  if (loot.diamonds) out.push({ k: 'diamonds', icon: '💎', text: `${loot.diamonds} diamond${loot.diamonds > 1 ? 's' : ''}!` });
  return out;
}

// The daily chest, opened in a dialog: tap, it shakes, the lid pops, the loot
// flies out. `onClose` when done.
export function ChestDialog({ onClose }) {
  const chest = useChest();
  const [state, setState] = useState('closed'); // closed | shaking | open
  const [loot, setLoot] = useState(null);
  const [shop, setShop] = useState(false); // showing the coin chest instead
  const now = useNow();

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  function open() {
    if (state !== 'closed' || !chest?.ready) return;
    setState('shaking');
    setTimeout(() => {
      const got = openChest();
      if (!got) return setState('closed');
      setLoot(got);
      setState('open');
    }, 750);
  }

  const big = loot ? loot.big : chest && isBigDay(chest.streak);
  const items = loot ? lootList(loot) : [];

  if (shop) {
    return (
      <div className="chest-dialog" role="dialog" aria-modal="true" aria-label="Coin chest" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <CoinChest onBack={() => setShop(false)} onClose={onClose} />
      </div>
    );
  }

  return (
    <div className="chest-dialog" role="dialog" aria-modal="true" aria-label="Daily chest" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`chest-card ${state} ${big ? 'big' : ''}`}>
        <p className="kicker">{big ? 'Day 7: the BIG chest' : 'Daily chest'}</p>
        <button className="chest-hit" onClick={open} disabled={state !== 'closed' || !chest?.ready} aria-label="Open the chest">
          <ChestArt state={state} big={big} />
          {state === 'open' && (
            <span className="chest-fly" aria-hidden="true">
              {[...items, ...items].map((it, i) => (
                <i key={i} style={{ '--n': i, '--a': `${-150 + (i * 300) / Math.max(1, items.length * 2 - 1)}deg` }}>
                  {it.icon}
                </i>
              ))}
            </span>
          )}
        </button>

        {state === 'open' && loot ? (
          <>
            <h2>{loot.diamonds ? 'Ooh, shiny.' : big ? 'Jackpot. He is furious.' : 'Free stuff. He hates that.'}</h2>
            <ul className="chest-loot">
              {items.map((it, i) => (
                <li key={it.k} className={it.k} style={{ '--i': i }}>
                  <span>{it.icon}</span> {it.text}
                </li>
              ))}
            </ul>
            <Streak streak={loot.streak} today />
            <button className="pill" onClick={onClose} autoFocus>
              Nice
            </button>
          </>
        ) : chest?.ready ? (
          <>
            <h2>{state === 'shaking' ? 'Opening…' : 'Tap the chest'}</h2>
            <p className="chest-note">
              {chest.streak > 1 ? `Day ${chest.streak} in a row. ` : ''}
              {isBigDay(chest.streak) ? 'A big one: coins, a fancy snack, energy and a diamond.' : `Come back ${CHEST.bigEvery} days in a row for a big one.`}
            </p>
            <Streak streak={chest.alive} />
          </>
        ) : (
          <>
            <h2>Already opened today</h2>
            <p className="chest-note">The next one is ready in {chest && now ? until(chest.next, now) : '…'}.</p>
            {chest && <Streak streak={chest.alive} />}
            <button className="pill ghost" onClick={onClose}>
              Close
            </button>
          </>
        )}

        {state !== 'shaking' && (
          <button className="chest-shop-link" onClick={() => setShop(true)}>
            <ChestArt rarity="legendary" />
            <span>
              <b>Can't wait? Buy one.</b>
              <small>🪙 {BUY_CHEST.price.coins}</small>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- the coin chest ---------- */
// What each rarity says when you get it, and when a tap bumps it up.
const RARITY = {
  common: { name: 'Common', odds: '70%', got: 'Common. Like you.', up: null },
  rare: { name: 'Rare', odds: '22%', got: 'Rare. He is mildly annoyed.', up: 'Rare!' },
  epic: { name: 'Epic', odds: '7%', got: 'Epic. He is sulking now.', up: 'EPIC?!' },
  legendary: { name: 'Legendary', odds: '1%', got: 'LEGENDARY. He will never forgive this.', up: 'LEGENDARY!!' },
};

function coinLootList(loot) {
  const out = [{ k: 'coins', icon: '🪙', text: `${loot.coins} coins` }];
  if (loot.item) out.unshift({ k: 'item', art: loot.item, text: `${HOUSE_ITEM[loot.item]?.name ?? 'Furniture'} (yours, go decorate)` });
  if (loot.food) out.push({ k: 'food', icon: '🍪', text: `${FOOD[loot.food]?.name ?? 'A snack'} (free, in the house)` });
  if (loot.diamonds) out.push({ k: 'diamonds', icon: '💎', text: `${loot.diamonds} diamond${loot.diamonds > 1 ? 's' : ''}!` });
  return out;
}

// The chest you buy with coins. Buying decides everything (see boughtChest in
// economy/chest.js); then it takes BUY_CHEST.taps taps to open, and each tap
// may bump it up a rarity, exactly as the path says. `got` is that outcome.
function CoinChest({ onBack, onClose }) {
  const { wallet } = useProfile();
  const [got, setGot] = useState(null); // { path, rarity, loot }
  const [taps, setTaps] = useState(0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const price = BUY_CHEST.price.coins;
  const afford = wallet.coins >= price;

  function purchase() {
    const res = buyChest();
    if (!res) return setError(true);
    setError(false);
    setGot(res);
    setTaps(0);
    setOpen(false);
  }

  function tap() {
    if (!got || open || taps >= BUY_CHEST.taps) return;
    const n = taps + 1;
    setTaps(n);
    if (n === BUY_CHEST.taps) setTimeout(() => setOpen(true), 450);
  }

  const rarity = !got ? 'common' : taps ? got.path[taps - 1] : 'common';
  const bumped = got && taps > 0 && rarity !== (taps > 1 ? got.path[taps - 2] : 'common');
  const items = open ? coinLootList(got.loot) : [];

  return (
    <div className={`chest-card coin-chest r-${rarity} ${open ? 'open' : 'closed'}`}>
      <p className="kicker">{got ? RARITY[rarity].name : 'Coin chest'}</p>
      <button className="chest-hit" onClick={tap} disabled={!got || open || taps >= BUY_CHEST.taps} aria-label={got ? `Tap the chest (${taps} of ${BUY_CHEST.taps})` : 'A coin chest'}>
        {/* a new key each tap restarts the shake */}
        <ChestArt key={taps} state={open ? 'open' : taps ? 'tapped' : 'closed'} rarity={rarity} />
        {bumped && !open && (
          <span key={`b${taps}`} className="rarity-burst" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} style={{ '--a': `${i * 36}deg` }} />
            ))}
          </span>
        )}
        {open && (
          <span className="chest-fly" aria-hidden="true">
            {[...items, ...items].map((it, i) => (
              <i key={i} style={{ '--n': i, '--a': `${-150 + (i * 300) / Math.max(1, items.length * 2 - 1)}deg` }}>
                {it.icon ?? '🛋️'}
              </i>
            ))}
          </span>
        )}
      </button>

      {open ? (
        <>
          <h2>{RARITY[got.rarity].got}</h2>
          <ul className="chest-loot">
            {items.map((it, i) => (
              <li key={it.k} className={it.k} style={{ '--i': i }}>
                {it.art ? <Art id={it.art} className="loot-art" /> : <span>{it.icon}</span>} {it.text}
              </li>
            ))}
          </ul>
          <div className="coin-chest-actions">
            <button className="pill ghost" onClick={onClose}>
              Nice
            </button>
            <button className="pill" onClick={purchase} disabled={!afford}>
              Again · 🪙 {price}
            </button>
          </div>
        </>
      ) : got ? (
        <>
          <h2 aria-live="polite">{taps === 0 ? 'Tap it.' : taps < BUY_CHEST.taps ? (bumped ? RARITY[rarity].up : 'Harder.') : 'Here it comes…'}</h2>
          <span className="tap-dots" aria-label={`${taps} of ${BUY_CHEST.taps} taps`}>
            {Array.from({ length: BUY_CHEST.taps }, (_, i) => (
              <i key={i} className={i < taps ? `on r-${got.path[i]}` : ''} />
            ))}
          </span>
        </>
      ) : (
        <>
          <h2>Pay to be disappointed</h2>
          <p className="chest-odds" aria-label="Odds">
            {RARITIES.map((r) => (
              <span key={r} className={`r-${r}`}>
                {RARITY[r].name} <b>{RARITY[r].odds}</b>
              </span>
            ))}
          </p>
          <div className="coin-chest-actions">
            <button className="pill ghost" onClick={onBack}>
              Back
            </button>
            <button className="pill" onClick={purchase} disabled={!afford}>
              Buy · 🪙 {price}
            </button>
          </div>
          {(!afford || error) && <p className="chest-note">You have {wallet.coins} 🪙. He's thrilled you're broke.</p>}
        </>
      )}
    </div>
  );
}

// The "Achievement ready!" line under a run's or a story part's payout.
export function ReadyLine({ ready }) {
  if (!ready?.length) return null;
  const names = ready.map((a) => a.name);
  return (
    <Link className="ach-ready-line" href="/achievements">
      <span aria-hidden="true">🏆</span> Achievement ready! <b>{names.slice(0, 2).join(', ')}{names.length > 2 ? ` +${names.length - 2}` : ''}</b>
    </Link>
  );
}
