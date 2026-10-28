'use client';

import { useState } from 'react';
import Avatar from '@/components/Avatar';
import NeedBar from './NeedBar';
import { sleep, wake } from '@/profile/store';
import { faceOf } from '@/profile/needs';
import { canAfford } from '@/economy/rules';
import { NEEDS, wakesAt, FILTHY_AT } from '@/economy/needs';
import { WAKE_OPTIONS } from '@/economy/house';

const price = (p) => (p.diamonds ? `${p.diamonds} 💎` : `${p.coins} 🪙`);

// The far-right panel: the bedroom. Put him to bed, wake him up for free
// (still groggy) or pay for a wake-up that gives some energy back.
export default function SleepPane({ needs, wallet, go }) {
  const face = faceOf(needs);
  const [line, setLine] = useState('');
  const mins = needs.asleep ? Math.max(0, Math.ceil((wakesAt(needs) - Date.now()) / 60000)) : 0;

  function toggle() {
    if (needs.asleep) {
      wake();
      setLine(needs.energy > 90 ? 'Good morning. I still hate you.' : 'Ugh. Five more minutes would have been nice.');
    } else {
      if (needs.energy >= 99) return setLine("I'm not tired. Nice try.");
      if ((needs.dirt ?? 0) >= FILTHY_AT) return setLine("Ew, no. I'm not getting into bed like this. Clean me first!");
      if (sleep()) setLine('Lights out. Do not press anything.');
    }
  }

  function wakeWith(o) {
    if (!wake(o.id)) return setLine("You can't afford that. Let him sleep, or wake him for free.");
    setLine(o.quip);
  }

  const text = needs.asleep ? 'Zzz…' : line || (needs.energy < 40 ? 'My eyes hurt. I need a nap.' : 'Not sleepy.');

  return (
    <div className="sp">
      <div className={`bedroom ${needs.asleep ? 'asleep' : ''}`}>
        <div className="bed-moon" aria-hidden="true" />
        <p className="ph-bubble on">{text}</p>
        <div className="bed">
          <Avatar size="clamp(86px, 17vh, 130px)" equipped={wallet.equipped} mood={face.mood} sleepy={face.sleepy} />
          {needs.asleep && (
            <span className="zz" aria-hidden="true">
              <i>z</i>
              <i>z</i>
              <i>Z</i>
            </span>
          )}
          <span className="bed-blanket" aria-hidden="true" />
        </div>
      </div>

      <div className="pane-card">
        <NeedBar kind="energy" label="Energy" icon="⚡" value={needs.energy} />
        <div className="needs-row">
          <p className="pane-note">
            {!needs.asleep && (needs.dirt ?? 0) >= FILTHY_AT
              ? 'He is filthy and refuses to get into bed. Wash him in the Bathroom first.'
              : needs.asleep
              ? `Sleeping. Energy +${Math.round((NEEDS.sleepEnergyPerHour / 60) * 10) / 10} a minute${mins ? `, up in about ${mins} min` : ''}.`
              : needs.energy < 40
                ? 'Dark circles! He is too sleepy. Games need energy.'
                : 'Games cost a little energy (Adventure 2, Story 5). A full bar lasts about 2 hours of play.'}
          </p>
          <button className={`pill sleep-btn ${needs.asleep ? 'awake' : ''}`} onClick={toggle}>
            {needs.asleep ? '☀️ Wake up (free)' : '🌙 Go to sleep'}
          </button>
          {!needs.asleep && (needs.dirt ?? 0) >= FILTHY_AT && (
            <button className="pill alt" onClick={() => go?.(4)}>
              🛁 Bathroom
            </button>
          )}
        </div>
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
