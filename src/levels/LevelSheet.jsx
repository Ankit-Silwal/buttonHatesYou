'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Sheet from '@/components/Sheet';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import { GameGlyph, gameTint } from '@/components/GameIcon';
import { Art } from '@/house/art';
import { ITEM, GAME } from '@/economy/catalog';
import { HOUSE_ITEM } from '@/economy/house';
import { MAX_LEVEL, levelState, unlocksOf, levelsCleared } from '@/economy/levels';
import { useProfile } from '@/profile/useProfile';
import { levelUp } from '@/profile/store';
import { focusItem } from './focus';
import './levels.css';

// The home screen's panels, for the care missions' "Go" (see Hub.jsx).
const PANE = { living: 1, kitchen: 2, bedroom: 3, bath: 4 };
const CARE = {
  feed: { glyph: '🍪', text: (n) => `Feed him ${n} ${n === 1 ? 'time' : 'times'}`, pane: PANE.kitchen },
  nap: { glyph: '💤', text: (n) => `Put him to bed ${n === 1 ? 'once' : `${n} times`}`, pane: PANE.bedroom },
  wash: { glyph: '🫧', text: (n) => `Wash him ${n === 1 ? 'once' : `${n} times`}`, pane: PANE.bath },
};
const anyItem = (id) => ITEM[id] ?? HOUSE_ITEM[id];
const fmt = (n) => n.toLocaleString('en-US');

// A small picture of a thing: an outfit on the button, a piece of furniture,
// a wallpaper or floor swatch, a character, or a game's mark.
export function Thumb({ kind, id, equipped, size = 44 }) {
  if (kind === 'story' || kind === 'game') {
    return (
      <span className="lv-thumb lv-thumb-game" style={{ '--tint': gameTint(id), width: size, height: size }}>
        <GameGlyph id={id} size={size * 0.6} />
      </span>
    );
  }
  const it = anyItem(id);
  if (ITEM[id]) {
    const look = it.slot === 'char' ? { ...equipped, char: id } : { ...equipped, [it.slot]: id, ...(it.slot === 'color' ? { char: 'char-bobby' } : null) };
    return (
      <span className="lv-thumb" style={{ width: size, height: size }}>
        <Avatar size={size * 0.78} equipped={look} />
      </span>
    );
  }
  if (it?.kind === 'furniture') {
    return (
      <span className="lv-thumb lv-thumb-art" style={{ width: size, height: size }}>
        <Art id={id} />
      </span>
    );
  }
  return (
    <span className="lv-thumb" style={{ width: size, height: size }}>
      <span className={`swatch ${it?.kind === 'floor' ? 'hs-floor' : 'hs-wall'}`} {...{ [`data-${it?.kind ?? 'wall'}`]: id }} />
    </span>
  );
}

// One mission: what to do, how far along, and a way to go and do it.
function Mission({ m, equipped, onGo }) {
  let icon;
  let title;
  let sub;
  let go = null;
  if (m.kind === 'play') {
    const g = GAME[m.game];
    icon = <Thumb kind="game" id={m.game} size={44} />;
    title = g.payout.coins ? `Grab ${fmt(m.need)} coins` : `Score ${fmt(m.need)} ${g.unit}`;
    sub = `in one ${g.name} run`;
    go = { href: g.href };
  } else if (m.kind === 'buy') {
    const it = anyItem(m.item);
    icon = <Thumb kind="item" id={m.item} equipped={equipped} size={44} />;
    title = `Get the ${it.name}`;
    sub = it.price.coins ? `${fmt(it.price.coins)} 🪙` : `${it.price.diamonds} 💎`;
    go = { buy: m.item };
  } else if (m.kind === 'stock') {
    icon = (
      <span className="lv-thumb lv-thumb-ico">
        <Icon glyph="🛒" size={26} />
      </span>
    );
    title = `Stock ${m.need} foods`;
    sub = 'for the fridge';
    go = { food: true };
  } else {
    const c = CARE[m.care];
    icon = (
      <span className="lv-thumb lv-thumb-ico">
        <Icon glyph={c.glyph} size={26} />
      </span>
    );
    title = c.text(m.need);
    sub = 'Care';
    go = { pane: c.pane };
  }
  const pct = Math.round((100 * m.have) / m.need);
  return (
    <li className={`lv-mission ${m.done ? 'done' : ''}`}>
      {icon}
      <div className="lv-m-text">
        <b>{title}</b>
        <span className="lv-m-sub">{sub}</span>
        <span className="lv-bar" role="progressbar" aria-valuemin={0} aria-valuemax={m.need} aria-valuenow={m.have} aria-label={title}>
          <i style={{ width: `${pct}%` }} />
        </span>
      </div>
      <div className="lv-m-end">
        <span className="lv-m-count">{m.kind === 'buy' ? (m.done ? 'Owned' : '0/1') : `${fmt(m.have)}/${fmt(m.need)}`}</span>
        {m.done ? (
          <span className="lv-done" aria-label="Done">
            <Icon glyph="✓" size={18} tint="#fff" />
          </span>
        ) : go.href ? (
          <Link className="lv-go" href={go.href}>
            Go
          </Link>
        ) : (
          <button type="button" className="lv-go" onClick={() => onGo(go)}>
            Go
          </button>
        )}
      </div>
    </li>
  );
}

// What clearing a level hands out: coins, diamonds and anything it unlocks.
function Rewards({ reward, unlocks, equipped }) {
  return (
    <div className="lv-rewards">
      <span className="lv-prize">
        <Icon glyph="🪙" size={18} /> {fmt(reward.coins)}
      </span>
      {reward.diamonds > 0 && (
        <span className="lv-prize">
          <Icon glyph="💎" size={18} /> {reward.diamonds}
        </span>
      )}
      {unlocks.map((u) => (
        <span key={u.id} className="lv-prize lv-unlock">
          <Thumb kind={u.kind} id={u.id} equipped={equipped} size={26} /> {u.name}
        </span>
      ))}
    </div>
  );
}

// The next few levels that unlock something.
function Ahead({ from, equipped }) {
  const list = useMemo(() => {
    const out = [];
    for (let L = from; L <= MAX_LEVEL && out.length < 4; L++) {
      const u = unlocksOf(L);
      if (u.length) out.push({ L, u });
    }
    return out;
  }, [from]);
  if (!list.length) return null;
  return (
    <section className="lv-ahead" aria-label="Coming up">
      <h3>Coming up</h3>
      <ul>
        {list.map(({ L, u }) => (
          <li key={L}>
            <span className="lv-ahead-n">{L}</span>
            {u.map((x) => (
              <span key={x.id} className="lv-ahead-x">
                <Thumb kind={x.kind} id={x.id} equipped={equipped} size={30} />
                <span>{x.name}</span>
              </span>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}

const CONFETTI = ['#e2674f', '#f0c36d', '#5b9bd5', '#9bbf9a', '#f39ac0', '#a58bd6'];

// The celebration after a level-up.
function Party({ got, equipped, onDone }) {
  return (
    <div className="lv-party" role="status">
      <div className="lv-confetti" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => (
          <i key={i} style={{ '--x': `${(i * 37) % 100}%`, '--d': `${(i % 7) * 0.08}s`, '--c': CONFETTI[i % CONFETTI.length], '--r': `${(i * 53) % 360}deg` }} />
        ))}
      </div>
      <span className="lv-party-badge">
        <Icon glyph="⭐" size={30} tint="#fff" />
        <b>{got.level}</b>
      </span>
      <h3>Level {got.level} cleared!</h3>
      <Rewards reward={got.reward} unlocks={got.unlocks} equipped={equipped} />
      <button type="button" className="pill" onClick={onDone}>
        {got.level >= MAX_LEVEL ? 'Done' : `On to level ${got.level + 1}`}
      </button>
    </div>
  );
}

// The levels sheet: the current level's three missions, its reward, a
// Level up button when they're all done, and what's coming up.
//   go(pane)          slide the home screen to a panel (care missions)
//   openWardrobe()    open the wardrobe (an outfit to buy)
//   openDecor(room)   open a room's decorating sheet (furniture to buy)
//   openFood()        open the food shop (stock the fridge)
export default function LevelSheet({ onClose, go, openWardrobe, openDecor, openFood }) {
  const { wallet } = useProfile();
  const st = levelState(wallet);
  const [got, setGot] = useState(null);
  const equipped = wallet.equipped;

  function onGo(where) {
    onClose();
    if (where.pane != null) return go?.(where.pane);
    if (where.food) {
      go?.(PANE.kitchen);
      return openFood?.();
    }
    const id = where.buy;
    focusItem(id);
    if (ITEM[id]) return openWardrobe?.();
    const room = HOUSE_ITEM[id].rooms[0];
    go?.(PANE[room] ?? PANE.living);
    openDecor?.(room);
  }

  function claim() {
    const before = st;
    if (!levelUp(before.level)) return;
    setGot({ level: before.level, reward: before.reward, unlocks: before.unlocks });
  }

  const n = levelsCleared(wallet);
  const sheet = (
    <Sheet title={got ? 'Level up!' : st.max ? 'All levels cleared' : `Level ${st.level}`} onClose={onClose} className="lv-sheet">
      <div className="sheet-body lv-body">
        {got ? (
          <Party got={got} equipped={equipped} onDone={() => setGot(null)} />
        ) : st.max ? (
          <div className="lv-max">
            <Avatar size={96} equipped={equipped} mood="smug" />
            <b>{MAX_LEVEL} of {MAX_LEVEL}</b>
          </div>
        ) : (
          <>
            <div className="lv-head">
              <Ring done={st.done} level={st.level} size={58} />
              <div className="lv-head-text">
                <span className="lv-of">
                  {n} of {MAX_LEVEL} cleared
                </span>
                <span className="lv-track" aria-hidden="true">
                  <i style={{ width: `${(100 * n) / MAX_LEVEL}%` }} />
                </span>
              </div>
            </div>
            <ul className="lv-missions">
              {st.missions.map((m) => (
                <Mission key={m.kind} m={m} equipped={equipped} onGo={onGo} />
              ))}
            </ul>
            <div className={`lv-claim ${st.ready ? 'ready' : ''}`}>
              <Rewards reward={st.reward} unlocks={st.unlocks} equipped={equipped} />
              <button type="button" className="pill lv-up" onClick={claim} disabled={!st.ready}>
                <Icon glyph="⭐" size={18} tint="currentColor" /> Level up
              </button>
            </div>
            <Ahead from={st.level + 1} equipped={equipped} />
          </>
        )}
      </div>
    </Sheet>
  );
  return typeof document === 'undefined' ? null : createPortal(<div className="lv-layer">{sheet}<button type="button" className="lv-scrim" aria-label="Close" tabIndex={-1} onClick={onClose} /></div>, document.body);
}

// A ring of the missions done around the level number.
export function Ring({ done, level, size = 34, ready = false }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const gap = 2.2;
  const seg = c / 3 - gap;
  return (
    <span className={`lv-ring ${ready ? 'ready' : ''}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" width={size} height={size} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx="18"
            cy="18"
            r={r}
            fill="none"
            strokeWidth="3.4"
            strokeLinecap="round"
            className={i < done ? 'on' : ''}
            strokeDasharray={`${seg} ${c - seg}`}
            strokeDashoffset={c / 4 - i * (c / 3) - gap / 2}
          />
        ))}
      </svg>
      <b style={{ fontSize: Math.max(11, size * (level >= 100 ? 0.3 : 0.38)) }}>{level}</b>
    </span>
  );
}

