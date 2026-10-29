'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import { GameGlyph, gameTint } from '@/components/GameIcon';
import { MAX_LEVEL, rewardOf, unlocksOf, levelState, levelsCleared } from '@/economy/levels';
import { questStates } from '@/economy/quests';
import { useProfile } from '@/profile/useProfile';
import { levelUp, claimQuest } from '@/profile/store';
import { Mission, Thumb } from './LevelSheet';
import { focusItem } from './focus';
import './levels.css';
import './tree.css';

const fmt = (n) => n.toLocaleString('en-US');
const BEHIND = 3; // cleared levels still shown under the current one

// The next good reward above level L (diamonds, every 5th level, or
// something unlocked): the top of what the tree shows. Above it, clouds.
function goalFrom(L) {
  for (let x = L + 1; x < MAX_LEVEL; x++) if (rewardOf(x).diamonds || unlocksOf(x).length) return x;
  return MAX_LEVEL;
}

// The Levels tab: the levels as a tree that grows up from level 1, his face
// on the current one. It only shows as far as the next big reward; past that
// it's clouds until that level is beaten. Tap a level for what it pays.
// Under it: the current level's missions, then the hard quests.
export default function LevelTree() {
  const { wallet, ready } = useProfile();
  const router = useRouter();
  const n = levelsCleared(wallet);
  const st = levelState(wallet);
  const cur = Math.min(MAX_LEVEL, n + 1);
  const [pick, setPick] = useState(null);
  const [got, setGot] = useState(null);
  const here = useRef(null);
  useEffect(() => {
    if (ready) here.current?.scrollIntoView({ block: 'center' });
  }, [ready]);
  if (!ready) return null;

  const top = st.max ? MAX_LEVEL : goalFrom(cur);
  const from = Math.max(1, cur - BEHIND);
  const levels = Array.from({ length: top - from + 1 }, (_, i) => top - i); // top first
  const shown = pick ?? cur;

  const onGo = (where) => {
    if (where.buy) focusItem(where.buy);
    router.push('/');
  };
  function claim() {
    const L = st.level;
    if (levelUp(L)) {
      setGot(L);
      setPick(null);
    }
  }

  return (
    <>
      <section className="pf-card lv-tree-card" aria-label="Levels">
        <div className="lv-sky" aria-hidden={st.max ? undefined : 'true'}>
          {st.max ? (
            <p className="lv-sky-done">
              <Icon glyph="⭐" size={20} tint="currentColor" /> Every level beaten. He's almost impressed.
            </p>
          ) : (
            <>
              <i className="cloud c1" />
              <i className="cloud c2" />
              <i className="cloud c3" />
              <i className="cloud c4" />
              <p className="lv-sky-text">
                <Icon glyph="🔒" size={16} tint="currentColor" /> Beat level {top} to see beyond
              </p>
            </>
          )}
        </div>

        <ol className="lv-tree">
          {levels.map((L) => {
            const state = L <= n ? 'done' : L === cur && !st.max ? 'now' : 'ahead';
            const r = rewardOf(L);
            const u = unlocksOf(L);
            const side = L % 2 ? 'left' : 'right';
            return (
              <li key={L} className={`lv-branch ${side} ${state} ${u.length ? 'big' : ''} ${shown === L ? 'picked' : ''}`} ref={state === 'now' ? here : null}>
                <button type="button" className="lv-node" onClick={() => setPick(L)} aria-label={`Level ${L}${state === 'done' ? ', beaten' : state === 'now' ? ', you are here' : ''}`}>
                  {state === 'now' && (
                    <span className="lv-you" aria-hidden="true">
                      <Avatar size={34} equipped={wallet.equipped} mood="smug" />
                    </span>
                  )}
                  <span className="lv-num">{state === 'done' ? <Icon glyph="✓" size={18} tint="currentColor" /> : L}</span>
                </button>
                <span className="lv-leaf" aria-hidden="true" />
                <span className="lv-prize">
                  {u.length > 0 ? (
                    u.slice(0, 2).map((x) => <Thumb key={x.id} kind={x.kind} id={x.id} equipped={wallet.equipped} size={30} />)
                  ) : r.diamonds ? (
                    <span className="lv-pay">
                      <Icon glyph="💎" size={14} /> {r.diamonds}
                    </span>
                  ) : (
                    <span className="lv-pay">
                      <Icon glyph="🪙" size={14} /> {fmt(r.coins)}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
        <div className="lv-ground" aria-hidden="true" />
      </section>

      {got && (
        <p className="lv-road-got" role="status">
          <Icon glyph="⭐" size={18} tint="currentColor" /> Level {got} beaten!
        </p>
      )}

      <LevelDetail L={shown} cur={cur} st={st} n={n} wallet={wallet} onGo={onGo} onClaim={claim} />
      <Quests wallet={wallet} />
    </>
  );
}

// What a level pays, and for the current one its missions and Level up.
function LevelDetail({ L, cur, st, n, wallet, onGo, onClaim }) {
  const r = rewardOf(L);
  const u = unlocksOf(L);
  const now = L === cur && !st.max;
  return (
    <section className="pf-card lv-detail">
      <div className="lv-detail-top">
        <h2>Level {L}</h2>
        <span className="lv-detail-state">{L <= n ? 'Beaten' : now ? `${st.done} of 3 done` : 'Ahead'}</span>
      </div>
      <div className="lv-detail-pay">
        <span className="lv-pay">
          <Icon glyph="🪙" size={15} /> {fmt(r.coins)}
        </span>
        {r.diamonds > 0 && (
          <span className="lv-pay">
            <Icon glyph="💎" size={15} /> {r.diamonds}
          </span>
        )}
        {u.map((x) => (
          <span key={x.id} className="lv-pay unlock">
            <Thumb kind={x.kind} id={x.id} equipped={wallet.equipped} size={26} /> {x.name}
          </span>
        ))}
      </div>
      {now && (
        <>
          <ul className="lv-missions">
            {st.missions.map((m) => (
              <Mission key={m.kind} m={m} equipped={wallet.equipped} onGo={onGo} />
            ))}
          </ul>
          <button type="button" className="pill lv-up" onClick={onClaim} disabled={!st.ready}>
            <Icon glyph="⭐" size={18} tint="currentColor" /> Level up
          </button>
        </>
      )}
    </section>
  );
}

// The hard quests: long goals beside the levels, claimable once each.
function Quests({ wallet }) {
  const [said, setSaid] = useState(null);
  const list = questStates(wallet).sort((a, b) => (b.done && !b.claimed) - (a.done && !a.claimed) || a.claimed - b.claimed || b.value / b.q.at - a.value / a.q.at);
  function claim(x) {
    const got = claimQuest(x.q.id);
    if (got) setSaid(`${x.q.name}: +${fmt(got.coins)} coins, +${got.diamonds} diamonds.`);
  }
  return (
    <section className="pf-card lv-quests" aria-labelledby="lv-quests-h">
      <h2 id="lv-quests-h">Hard quests</h2>
      {said && (
        <p className="lv-road-got" role="status">
          {said}
        </p>
      )}
      <ul>
        {list.map((x) => (
          <li key={x.q.id} className={`lv-quest ${x.claimed ? 'claimed' : x.done ? 'ready' : ''}`}>
            <span className="lv-quest-ico" style={x.q.game ? { '--tint': gameTint(x.q.game) } : undefined} aria-hidden="true">
              {x.q.game ? <GameGlyph id={x.q.game} size={22} /> : <Icon glyph={x.q.icon} size={22} />}
            </span>
            <div className="lv-quest-body">
              <b>{x.q.name}</b>
              <span>{x.q.goal}</span>
              <span className="lv-track" aria-hidden="true">
                <i style={{ width: `${(100 * x.value) / x.q.at}%` }} />
              </span>
            </div>
            <div className="lv-quest-end">
              <span className="lv-quest-pay">
                <Icon glyph="💎" size={13} /> {x.q.reward.diamonds}
              </span>
              {x.claimed ? (
                <Icon glyph="✓" size={18} tint="#6fdc8c" />
              ) : x.done ? (
                <button type="button" className="pill lv-claim" onClick={() => claim(x)}>
                  Claim
                </button>
              ) : (
                <small>
                  {fmt(x.value)}/{fmt(x.q.at)}
                </small>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
