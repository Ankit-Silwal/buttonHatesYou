'use client';

import Avatar from '@/components/Avatar';
import { GameGrid } from '@/components/Arcade';
import { faceOf, PLAY_MIN_HUNGER } from '@/profile/needs';
import { PLAY_COST } from '@/economy/needs';

// The left panel: every game, as a grid of tiles (like the Android app).
// Playing needs energy and a fed tummy, so the header says what is missing
// and points at the other panels.
export default function GamesPane({ needs, equipped, go }) {
  const face = faceOf(needs);
  const hungry = needs.hunger < PLAY_MIN_HUNGER;
  const tired = needs.energy < PLAY_COST.adventure;
  let note = 'Every run pays coins: the better you do, the more you earn.';
  if (needs.asleep) note = "He's asleep. Wake him up in the Bedroom before he can play.";
  else if (hungry && tired) note = 'Too hungry and too tired to play. Feed him, then let him nap.';
  else if (hungry) note = 'Too hungry to play. Feed him in the Kitchen first.';
  else if (tired) note = 'Too tired to play. Let him nap in the Bedroom.';

  const blocked = needs.asleep || hungry || tired;

  return (
    <div className="arcade games-room">
      <div className="arcade-head">
        <Avatar size={58} equipped={equipped} mood={face.mood} sleepy={face.sleepy} className="has-legs" />
        <div>
          <h1>Games</h1>
          <p>{note}</p>
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
      <GameGrid equipped={equipped} dim={blocked} />
    </div>
  );
}
