'use client';

import { useState } from 'react';
import Room from '@/house/Room';
import NeedBar from './NeedBar';
import { sleep, wake } from '@/profile/store';
import { faceOf } from '@/profile/needs';
import { canAfford } from '@/economy/rules';
import { NEEDS, wakesAt, FILTHY_AT } from '@/economy/needs';
import { WAKE_OPTIONS, roomOf } from '@/economy/house';

const price = (p) => (p.diamonds ? `${p.diamonds} 💎` : `${p.coins} 🪙`);

// The bedroom: a dim teen room with the bedside lamp on. Turn the lamp off
// and he gets into bed and sleeps; turn it on again and he wakes (still
// groggy, for free). Whether the lamp is on comes straight from his needs,
// so a reload mid-sleep shows the dark room.
export default function SleepPane({ needs, wallet, go, view, onDecorate }) {
  const face = faceOf(needs);
  const [line, setLine] = useState({ text: '', n: 0 });
  const filthy = !needs.asleep && (needs.dirt ?? 0) >= FILTHY_AT;
  const mins = needs.asleep ? Math.max(0, Math.ceil((wakesAt(needs) - Date.now()) / 60000)) : 0;

  const say = (text) => setLine((l) => ({ text, n: l.n + 1 }));

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

  function wakeWith(o) {
    if (!wake(o.id)) return say("You can't afford that. Let him sleep, or wake him for free.");
    say(o.quip);
  }

  const text = needs.asleep ? 'Zzz…' : line.text || (needs.energy < 40 ? 'My eyes hurt. I need a nap.' : 'Not sleepy.');
  const lamp = {
    on: !needs.asleep,
    label: needs.asleep ? 'Turn on the lamp (wake him up)' : 'Turn off the lamp',
    onToggle: toggleLamp,
  };

  return (
    <div className="sp">
      <div className="rm-wrap">
        <Room
          room="bedroom"
          house={view?.house ?? roomOf(wallet, 'bedroom')}
          preview={view?.at}
          equipped={wallet.equipped}
          mood={face.mood}
          sleepy={face.sleepy}
          dirty={face.dirty}
          grime={face.grime}
          asleep={needs.asleep}
          line={{ text, n: line.n }}
          lamp={lamp}
        />
      </div>
      <p className="rm-hint">{needs.asleep ? 'The lamp is off. Tap it to turn it on and wake him.' : '💡 Tap the lamp to switch it off. He will go to sleep.'}</p>

      <div className="rm-tools">
        <button className="pill alt" onClick={onDecorate}>
          🛋️ Decorate
        </button>
        {filthy && (
          <button className="pill" onClick={() => go?.(4)}>
            🛁 Bathroom
          </button>
        )}
      </div>

      <div className="pane-card">
        <NeedBar kind="energy" label="Energy" icon="⚡" value={needs.energy} />
        <p className="pane-note">
          {filthy
            ? 'He is filthy and refuses to get into bed. Wash him in the Bathroom first.'
            : needs.asleep
              ? `Sleeping. Energy +${Math.round((NEEDS.sleepEnergyPerHour / 60) * 10) / 10} a minute${mins ? `, wakes in about ${mins} min` : ''}.`
              : needs.energy < 40
                ? 'Dark circles! He is too sleepy. Games need energy.'
                : 'Games cost a little energy (Adventure 2, Story 5). A full bar lasts about 2 hours of play.'}
        </p>
      </div>

      <h2 className="pane-h">Wake-up options</h2>
      <p className="pane-sub">Waking him for free leaves him as sleepy as he was. These wake him on the spot and give some energy back.</p>
      <ul className="menu wakes">
        {WAKE_OPTIONS.map((o) => (
          <li key={o.id}>
            <button className="dish" onClick={() => wakeWith(o)} disabled={!needs.asleep || !canAfford(wallet, o)} aria-label={`Wake him with ${o.name}`}>
              <span className="dish-art emoji" aria-hidden="true">
                {o.icon}
              </span>
              <b>{o.name}</b>
              <span className="dish-fx">⚡ +{o.energy}</span>
              <span className="dish-cost">{needs.asleep ? price(o.price) : 'he is awake'}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
