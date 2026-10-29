'use client';

import Avatar from '@/components/Avatar';
import { GameGrid } from '@/components/Arcade';
import { faceOf, PLAY_MIN_HUNGER } from '@/profile/needs';
import { PLAY_COST } from '@/economy/needs';
import { useState } from 'react';
import Hint from './Hint';

// The left panel: every game, as a grid of tiles (like the Android app).
// Playing needs energy and a fed tummy, so the header says what is missing
// and points at the other panels.
export default function GamesPane({ needs, equipped, go, active }) {
  const face = faceOf(needs);
  const hungry = needs.hunger < PLAY_MIN_HUNGER;
  const tired = needs.energy < PLAY_COST.adventure;
  let note = 'Every run pays coins: the better you do, the more you earn.';
  if (needs.asleep) note = "He's asleep.";
  else if (hungry && tired) note = 'Too hungry and too tired to play.';
  else if (hungry) note = 'Too hungry to play.';
  else if (tired) note = 'Too tired to play.';

  const blocked = needs.asleep || hungry || tired;
  // Per game (a story costs more energy than a quick game): why he can't, in his words.
  const why = (g) => {
    if (needs.asleep) return "Zzz… I'm asleep. Wake me up first.";
    if (hungry) return "I'm too hungry to play. Feed me first.";
    if (needs.energy < (PLAY_COST[g.category] ?? PLAY_COST.adventure)) return "I'm too tired for that one. Let me nap.";
    return null;
  };
  const [nag, setNag] = useState(null); // { text, n }: he says why, with a shake

  return (
    <div className="arcade games-room">
      <div className="arcade-head">
        <Avatar size={58} equipped={equipped} mood={face.mood} sleepy={face.sleepy} className="has-legs" />
        <div>
          <h1>Games</h1>
          <p className={nag ? 'gp-nag' : undefined} key={nag?.n ?? 0}>
            {nag?.text ?? note}
          </p>
          <Hint active={active} show={blocked} from=".gp-fix .pill" />
          {blocked && (
            <div className="gp-fix">
              {hungry && !needs.asleep && (
                <button className="pill" onClick={() => go(2)}>
                  🍳 Kitchen
                </button>
              )}
              {(tired || needs.asleep) && (
                <button className="pill alt" onClick={() => go(3)}>
                  🛏️ Bedroom
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <GameGrid equipped={equipped} why={why} onBlocked={(text) => setNag((m) => ({ text, n: (m?.n ?? 0) + 1 }))} />
    </div>
  );
}
