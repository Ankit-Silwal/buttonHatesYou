'use client';

import { useEffect, useRef, useState } from 'react';
import { Art } from '@/house/art';
import RoomScene from './RoomScene';
import { NeedHud } from './NeedBar';
import { feed } from '@/profile/store';
import { faceOf } from '@/profile/needs';
import { FOODS, FREE_FOOD, isBroke, roomOf } from '@/economy/house';
import Hint from './Hint';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const HUNGRY = ['I could eat a keyboard.', 'My tummy is making dial-up noises.', 'Feed me. Please. Do not tell anyone I said please.'];
const FULL = ["I'm stuffed. Absolutely stuffed.", 'One more bite and I pop.'];

// The kitchen: a real room with the button standing in it. What he owns is
// in a strip under him (tap a food to feed it, free); the Buy food pill opens
// the whole menu. When he's broke the cheapest food is free (FREE_FOOD), so
// he first makes you admit you're poor, then hands it over with a Free tag. `view` is what the decorating sheet is trying out in this
// room; `onDecorate` and `onBuy` open the sheets.
export default function FoodPane({ needs, wallet, active, sky, view, edit, quip, onDecorate, onBuy, onPotions }) {
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
  const broke = isBroke(wallet);
  const [begged, setBegged] = useState(false); // said "I'm poor" while broke
  useEffect(() => {
    if (!broke) setBegged(false);
  }, [broke]);

  // A fresh remark each time this panel comes into view.
  useEffect(() => {
    if (!active) return;
    say(needs.asleep ? 'Zzz…' : needs.hunger < 25 ? pick(HUNGRY) : needs.hunger > 92 ? pick(FULL) : broke && !begged ? 'No coins? Say it. Say "I’m poor."' : stock.length ? 'What is on the menu?' : 'The fridge is empty. Typical.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (quip?.pane === 'food') say(quip.text);
  }, [quip]);

  function beg() {
    setBegged(true);
    say(`Wow. Okay. That was sad to watch. Here, a free ${FREE_FOOD.name}. Feed me.`);
  }

  function eat(f) {
    if (needs.asleep) return say('Zzz… (he is asleep. Wake him up in the Bedroom first)');
    const charity = broke && f.id === FREE_FOOD.id;
    if (!charity && (wallet.pantry?.[f.id] || 0) < 1) return say('None of those left. Buy some more?');
    if (!feed(f.id)) return say('Something went wrong. Try again.');
    setEating({ id: f.id, n: Date.now() });
    setFx(null);
    say('Om nom nom…');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setEating(null);
      say(charity ? `Free food? For me? ...I still hate you. ${f.quip}` : f.quip);
      if (f.fx) {
        setFx(f.fx);
        clearTimeout(fxTimer.current);
        fxTimer.current = setTimeout(() => setFx(null), f.fx === 'glow' ? 6000 : 3800);
      }
    }, 1300);
  }

  // Stuck while he's hungry? Point at what feeds him: the fridge, the
  // "I'm poor" button, or the shop.
  const feedMe = stock.length || (broke && begged) ? '.stock-item' : broke ? '.pill.beg' : '.pill.buy';

  return (
    <RoomScene
      kind="kitchen"
      sky={sky}
      house={view?.house ?? roomOf(wallet, 'kitchen')}
      preview={view?.at}
      edit={edit}
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
      hud={<NeedHud kind="hunger" icon="🍔" label="Hunger" value={needs.hunger} />}
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
          ) : broke && !begged ? (
            <div className="stock-beg">
              <button className="pill beg" onClick={beg} disabled={needs.asleep}>
                <span className="ico">😔</span> I&apos;m poor
              </button>
            </div>
          ) : broke ? (
            <ul className="stock" aria-label="You're out of coins, so this one is free. Tap it to feed him.">
              <li>
                <button className="stock-item" onClick={() => eat(FREE_FOOD)} disabled={!!eating || needs.asleep} aria-label={`Feed ${FREE_FOOD.name}, free because you're out of coins`}>
                  <Art id={FREE_FOOD.id} />
                  <small>{FREE_FOOD.name}</small>
                  <span className="stock-count free" aria-hidden="true">
                    Free
                  </span>
                </button>
              </li>
            </ul>
          ) : null}
          <Hint active={active && !eating} show={!needs.asleep && needs.hunger < 60} from={feedMe} />
          <div className="rs-pills">
            <button className="pill buy" onClick={onBuy} style={{ '--i': 0 }}>
              <span className="ico">🛒</span> Buy food
            </button>
            <button className="pill alt" onClick={onPotions} style={{ '--i': 1 }}>
              <span className="ico">🧪</span> Potions
            </button>
            <button className="pill house-btn" onClick={onDecorate} style={{ '--i': 2 }}>
              <span className="ico">🛋️</span> Decorate
            </button>
          </div>
        </>
      }
    />
  );
}
