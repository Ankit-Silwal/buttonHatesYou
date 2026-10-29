'use client';

import { useEffect, useState } from 'react';
import RoomScene from './RoomScene';
import { NeedHud } from './NeedBar';
import { sleep, wake } from '@/profile/store';
import { faceOf } from '@/profile/needs';
import { NEEDS, wakesAt, FILTHY_AT } from '@/economy/needs';
import { roomOf } from '@/economy/house';
import Hint from './Hint';

// The bedroom: a dim teen room with the bedside lamp on. Turn the lamp off
// and he gets into bed and sleeps; turn it on again and he wakes (still
// groggy, for free). Whether the lamp is on comes straight from his needs,
// so a reload mid-sleep shows the dark room. Paid energy boosts (they also
// wake him) and potions are in sheets.
export default function SleepPane({ needs, wallet, go, active, sky, view, edit, quip, onDecorate, onWake, onPotions }) {
  const face = faceOf(needs);
  const [line, setLine] = useState({ text: '', n: 0 });
  const filthy = !needs.asleep && (needs.dirt ?? 0) >= FILTHY_AT;
  const mins = needs.asleep ? Math.max(0, Math.ceil((wakesAt(needs) - Date.now()) / 60000)) : 0;

  const say = (text) => setLine((l) => ({ text, n: l.n + 1 }));
  useEffect(() => {
    if (quip?.pane === 'sleep') say(quip.text);
  }, [quip]);

  function toggleLamp() {
    if (needs.asleep) {
      if (wake()) say(needs.energy > 90 ? 'Good morning. I still hate you.' : 'Ugh. Five more minutes would have been nice.');
      return;
    }
    if (needs.energy >= 99) return say("I'm not tired. Nice try.");
    if ((needs.dirt ?? 0) >= FILTHY_AT) {
      return say("Ew, no. I'm not getting into bed like this. Clean me first!");
    }
    if (sleep()) {
      say('Lights out. Do not press anything.');
    }
  }

  const text = needs.asleep ? 'Zzz…' : line.text || (needs.energy < 40 ? 'My eyes hurt. I need a nap.' : 'Not sleepy.');
  const lamp = {
    on: !needs.asleep,
    label: needs.asleep ? 'Turn on the lamp (wake him up)' : 'Turn off the lamp',
    onToggle: toggleLamp,
  };
  const note = needs.asleep ? `Sleeping. Energy +${Math.round((NEEDS.sleepEnergyPerHour / 60) * 10) / 10} a minute${mins ? `, wakes in about ${mins} min` : ''}.` : '';
  // Stuck? Tired: tap the lamp (or, too dirty for bed, the bathroom). Rested: tap it to wake him.
  const lampHint = needs.asleep ? needs.energy >= 95 : needs.energy < 40;

  return (
    <RoomScene
      kind="bedroom"
      sky={sky}
      house={view?.house ?? roomOf(wallet, 'bedroom')}
      preview={view?.at}
      edit={edit}
      equipped={wallet.equipped}
      mood={face.mood}
      sleepy={face.sleepy}
      dirty={face.dirty}
      grime={face.grime}
      asleep={needs.asleep}
      line={{ text, n: line.n }}
      lamp={lamp}
      onPoke={() => say(needs.energy < 40 ? 'Tap the lamp. I need a nap.' : 'Do not poke me. Tap the lamp if you must.')}
      hud={<NeedHud kind="energy" icon={needs.asleep ? '💤' : '⚡'} label="Energy" value={needs.energy} note={note} />}
      tray={
        <>
          <Hint active={active} show={lampHint} from={filthy ? '.pill.to-bath' : '.rs-lamp'} />
          <div className="rs-pills">
            <button className="pill" onClick={onWake} style={{ '--i': 0 }}>
              <span className="ico">⏰</span> {needs.asleep ? 'Wake-up options' : 'Energy boosts'}
            </button>
            <button className="pill alt" onClick={onPotions} style={{ '--i': 1 }}>
              <span className="ico">🧪</span> Potions
            </button>
            <button className="pill house-btn" onClick={onDecorate} style={{ '--i': 2 }}>
              <span className="ico">🛋️</span> Decorate
            </button>
            {filthy && (
              <button className="pill to-bath" onClick={() => go?.(4)} style={{ '--i': 3 }}>
                <span className="ico">🛁</span> Bathroom
              </button>
            )}
          </div>
        </>
      }
    />
  );
}
