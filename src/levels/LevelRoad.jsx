'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { MAX_LEVEL, LEVELS, rewardOf, unlocksOf, levelState, levelsCleared } from '@/economy/levels';
import { useProfile } from '@/profile/useProfile';
import { levelUp } from '@/profile/store';
import { Mission, Thumb } from './LevelSheet';
import { focusItem } from './focus';
import './levels.css';

const fmt = (n) => n.toLocaleString('en-US');

// The profile's Levels tab: the whole road, level 1 to 200. Each level shows
// what clearing it pays (coins, diamonds every 5th, and what it unlocks);
// cleared ones are ticked, the current one is open with its missions and
// Level up, the ones ahead are dimmed. Opens scrolled to the current level.
export default function LevelRoad() {
  const { wallet, ready } = useProfile();
  const router = useRouter();
  const here = useRef(null);
  const [got, setGot] = useState(null);
  const n = levelsCleared(wallet);
  const st = levelState(wallet);

  useEffect(() => {
    if (ready) here.current?.scrollIntoView({ block: 'center' });
  }, [ready]);

  if (!ready) return null;

  // The missions' Go: the game itself, or home (to the shop with the item).
  const onGo = (where) => {
    if (where.buy) focusItem(where.buy);
    router.push('/');
  };

  function claim() {
    const L = st.level;
    if (levelUp(L)) setGot(L);
  }

  return (
    <section className="pf-card lv-road" aria-label="Levels">
      <div className="lv-road-head">
        <b>
          {n} <span>of {MAX_LEVEL} cleared</span>
        </b>
        <span className="lv-track" aria-hidden="true">
          <i style={{ width: `${(100 * n) / MAX_LEVEL}%` }} />
        </span>
      </div>
      {got && (
        <p className="lv-road-got" role="status">
          <Icon glyph="⭐" size={18} tint="currentColor" /> Level {got} cleared!
        </p>
      )}
      <ol className="lv-road-list">
        {LEVELS.map(({ level: L }) => {
          const state = L <= n ? 'done' : L === n + 1 ? 'now' : 'ahead';
          const r = rewardOf(L);
          const u = unlocksOf(L);
          return (
            <li key={L} ref={state === 'now' ? here : null} className={`lv-step ${state} ${u.length ? 'big' : ''} ${r.diamonds ? 'gem' : ''}`}>
              <span className="lv-step-n">{state === 'done' ? <Icon glyph="✓" size={16} tint="currentColor" /> : L}</span>
              <div className="lv-step-body">
                <div className="lv-step-top">
                  <span className="lv-step-name">Level {L}</span>
                  <span className="lv-step-pay">
                    <span>
                      <Icon glyph="🪙" size={14} /> {fmt(r.coins)}
                    </span>
                    {r.diamonds > 0 && (
                      <span>
                        <Icon glyph="💎" size={14} /> {r.diamonds}
                      </span>
                    )}
                  </span>
                </div>
                {u.length > 0 && (
                  <div className="lv-step-unlocks">
                    {u.map((x) => (
                      <span key={x.id} className="lv-step-x">
                        <Thumb kind={x.kind} id={x.id} equipped={wallet.equipped} size={30} />
                        {x.name}
                      </span>
                    ))}
                  </div>
                )}
                {state === 'now' && !st.max && (
                  <>
                    <ul className="lv-missions">
                      {st.missions.map((m) => (
                        <Mission key={m.kind} m={m} equipped={wallet.equipped} onGo={onGo} />
                      ))}
                    </ul>
                    <button type="button" className="pill lv-up" onClick={claim} disabled={!st.ready}>
                      <Icon glyph="⭐" size={18} tint="currentColor" /> Level up
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
