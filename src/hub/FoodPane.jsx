'use client';

import { useEffect, useRef, useState } from 'react';
import { Art } from '@/house/art';
import RoomScene from './RoomScene';
import { NeedHud } from './NeedBar';
import { feed } from '@/profile/store';
import { faceOf } from '@/profile/needs';
import { FOODS, roomOf } from '@/economy/house';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const HUNGRY = ['I could eat a keyboard.', 'My tummy is making dial-up noises.', 'Feed me. Please. Do not tell anyone I said please.'];
const FULL = ["I'm stuffed. Absolutely stuffed.", 'One more bite and I pop.'];

// The kitchen: a real room with the button standing in it. What he owns is
// in a strip under him (tap a food to feed it, free); the Buy food pill opens
// the whole menu. `view` is what the decorating sheet is trying out in this
// room; `onDecorate` and `onBuy` open the sheets.
export default function FoodPane({ needs, wallet, active, sky, view, quip, onDecorate, onBuy }) {
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
  const stock = FOODS.filter((f) => (wallet.pantry?.[f.id] || 0) > 0);

  // A fresh remark each time this panel comes into view.
  useEffect(() => {
    if (!active) return;
    say(needs.asleep ? 'Zzz…' : needs.hunger < 25 ? pick(HUNGRY) : needs.hunger > 92 ? pick(FULL) : stock.length ? 'What is on the menu?' : 'The fridge is empty. Typical.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (quip?.pane === 'food') say(quip.text);
  }, [quip]);

  function eat(f) {
    if (needs.asleep) return say('Zzz… (he is asleep. Wake him up in the Bedroom first)');
    if ((wallet.pantry?.[f.id] || 0) < 1) return say('None of those left. Buy some more?');
    if (!feed(f.id)) return say('Something went wrong. Try again.');
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

  const note = needs.asleep
    ? 'Asleep. Wake him in the Bedroom.'
    : needs.hunger < 20
      ? 'Too hungry to play! Feed him.'
      : needs.hunger < 25
        ? 'He looks bored. A snack would help.'
        : 'A game needs a tummy at least 20 full.';

  return (
    <RoomScene
      kind="kitchen"
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
      onPoke={() => say(needs.asleep ? 'Zzz…' : stock.length ? 'Tap something from the fridge, not me.' : 'The fridge is empty. Buy me something.')}
      hud={<NeedHud kind="hunger" icon="🍔" label="Hunger" value={needs.hunger} note={note} />}
      tray={
        <>
          {stock.length ? (
            <ul className="stock" aria-label="Food in the fridge. Tap one to feed it to him.">
              {stock.map((f) => {
                const n = wallet.pantry[f.id];
                return (
                  <li key={f.id}>
                    <button className="stock-item" onClick={() => eat(f)} disabled={!!eating || needs.asleep} aria-label={`Feed ${f.name}, ${n} in the fridge`}>
                      <Art id={f.id} />
                      <small>{f.name}</small>
                      <span className="stock-count" aria-hidden="true">
                        {n}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="stock-empty">Fridge is empty: buy some food</p>
          )}
          <div className="rs-pills">
            <button className="pill" onClick={onBuy} style={{ '--i': 0 }}>
              <span className="ico">🛒</span> Buy food
            </button>
            <button className="pill house-btn" onClick={onDecorate} style={{ '--i': 1 }}>
              <span className="ico">🛋️</span> Decorate
            </button>
          </div>
        </>
      }
    />
  );
}
