'use client';

import { useEffect, useRef, useState } from 'react';
import { Art } from '@/house/art';
import Room from '@/house/Room';
import NeedBar from './NeedBar';
import { feed } from '@/profile/store';
import { faceOf } from '@/profile/needs';
import { canAfford } from '@/economy/rules';
import { FOODS, roomOf } from '@/economy/house';

const price = (p) => (p.diamonds ? `${p.diamonds} 💎` : `${p.coins} 🪙`);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const HUNGRY = ['I could eat a keyboard.', 'My tummy is making dial-up noises.', 'Feed me. Please. Do not tell anyone I said please.'];
const FULL = ["I'm stuffed. Absolutely stuffed.", 'One more bite and I pop.'];

// The kitchen: a real room with the button standing in it. The fridge holds
// the menu, and one tap buys and feeds. `view` is what the decorating sheet
// is trying out in this room; `onDecorate` opens that sheet.
export default function FoodPane({ needs, wallet, active, sky, view, onDecorate }) {
  const face = faceOf(needs);
  const [eating, setEating] = useState(null); // { id, n }
  const [fx, setFx] = useState(null);
  const [line, setLine] = useState({ text: '', n: 0 });
  const timer = useRef(0);
  const fxTimer = useRef(0);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(fxTimer.current);
    },
    []
  );

  const say = (text) => setLine((l) => ({ text, n: l.n + 1 }));

  // A fresh remark each time this panel comes into view.
  useEffect(() => {
    if (!active) return;
    say(needs.asleep ? 'Zzz…' : needs.hunger < 25 ? pick(HUNGRY) : needs.hunger > 92 ? pick(FULL) : 'What is on the menu?');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function eat(f) {
    if (needs.asleep) return say('Zzz… (he is asleep. Wake him up in the Bedroom first)');
    if (!feed(f.id)) return say("You're broke. Go play something.");
    setEating({ id: f.id, n: Date.now() });
    setFx(null);
    say('Om nom nom…');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setEating(null);
      say(f.quip);
      if (f.fx) {
        setFx(f.fx);
        clearTimeout(fxTimer.current);
        fxTimer.current = setTimeout(() => setFx(null), f.fx === 'glow' ? 6000 : 3800);
      }
    }, 1300);
  }

  return (
    <div className="fp">
      <div className="rm-wrap">
        <Room
          room="kitchen"
          sky={sky}
          house={view?.house ?? roomOf(wallet, 'kitchen')}
          preview={view?.at}
          equipped={wallet.equipped}
          mood={eating ? 'scared' : face.mood}
          sleepy={face.sleepy}
          dirty={face.dirty}
          grime={face.grime}
          asleep={needs.asleep}
          fx={fx}
          eating={eating}
          line={line}
        />
      </div>

      <div className="rm-tools">
        <button className="pill alt" onClick={onDecorate}>
          🛋️ Decorate
        </button>
      </div>

      <div className="pane-card">
        <NeedBar kind="hunger" label="Hunger" icon="🍔" value={needs.hunger} />
        <p className="pane-note">
          {needs.asleep
            ? 'He is asleep. Wake him up in the Bedroom before dinner.'
            : needs.hunger < 20
              ? 'Too hungry to play! Feed him.'
              : needs.hunger < 25
                ? 'He looks bored. A snack would help.'
                : 'A game needs a tummy at least 20 full.'}
        </p>
      </div>

      <section className="fridge" aria-label="Fridge and pantry">
        <h2 className="fridge-h">
          <span aria-hidden="true">🧊</span> Fridge
          <small>tap a dish to buy and eat it</small>
        </h2>
        <ul className="menu">
          {FOODS.map((f) => {
            const free = wallet.pantry?.[f.id] || 0;
            const poor = !free && !canAfford(wallet, f);
            return (
              <li key={f.id}>
                <button className="dish" onClick={() => eat(f)} disabled={!!eating || poor || needs.asleep} aria-label={`Feed ${f.name}`}>
                  <span className="dish-art">
                    <Art id={f.id} />
                  </span>
                  <b>{f.name}</b>
                  <span className="dish-fx">
                    {f.hunger ? `🍔 +${f.hunger}` : ''} {f.energy ? `⚡ +${f.energy}` : ''}
                  </span>
                  <span className="dish-cost">{free ? `🎁 ${free} free` : price(f.price)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
