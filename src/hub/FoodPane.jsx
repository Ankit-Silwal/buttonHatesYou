'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Art } from '@/house/art';
import RoomScene from './RoomScene';
import { feed } from '@/profile/store';
import { faceOf } from '@/profile/needs';
import { FOODS, FREE_FOOD, isBroke, roomOf } from '@/economy/house';
import Hint from './Hint';
import { Sound } from '@/game/sound';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const HUNGRY = ['I could eat a keyboard.', 'My tummy is making dial-up noises.', 'Feed me. Please. Do not tell anyone I said please.'];
const FULL = ["I'm stuffed. Absolutely stuffed.", 'One more bite and I pop.'];
const NAAH = ['Naah.', 'Naaah. Not hungry.', 'Nope. Full. Go away.', 'Ew. Later. Maybe never.'];
const YUM = ['Mmm!', 'Oh, that hit the spot.', 'Okay. That was good. Do not get used to it.'];
const FULL_AT = 85; // above this he turns food down
const DRAG_PX = 8; // moving this far turns a press into a drag

// "Naah": a grumpy two-note no.
function naah() {
  Sound.init();
  Sound.tone(300, 0.16, 'triangle', 0.6, 240);
  Sound.tone(250, 0.3, 'triangle', 0.6, 160, 0.17);
}

// The kitchen: a real room with the button standing in it. What he owns is
// in a strip under him: drag a food to his mouth to feed him. Hungry, he
// opens wide as it comes close; full, he leans away, pulls a face and says
// naah, and won't take it. The Buy food pill
// opens the whole menu. When he's broke the cheapest food is free (FREE_FOOD), so
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

  // Dragging a food: a copy follows the finger; near him he either opens
  // wide (hungry) or leans away (full). Dropped on him, he eats it or not.
  const [drag, setDrag] = useState(null); // { f, x, y, near, moved }
  const [react, setReact] = useState(null); // 'yum' | 'naah', for a moment
  const reactTimer = useRef(0);
  const press = useRef(null);
  useEffect(() => () => clearTimeout(reactTimer.current), []);
  const full = needs.hunger > FULL_AT;
  const moment = (r, ms) => {
    setReact(r);
    clearTimeout(reactTimer.current);
    reactTimer.current = setTimeout(() => setReact(null), ms);
  };
  // How close a point is to his mouth, in widths of him (Infinity off-screen).
  const fromMouth = (x, y) => {
    const r = document.querySelector('.pane-food .hero')?.getBoundingClientRect();
    if (!r) return Infinity;
    return Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height * 0.62)) / r.width;
  };
  const NEAR = 0.85; // he notices it coming
  const IN_MOUTH = 0.32; // dropped here, it's in his mouth
  function grab(e, f) {
    if (eating || needs.asleep) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    press.current = { f, x0: e.clientX, y0: e.clientY };
  }
  function slide(e) {
    const p = press.current;
    if (!p) return;
    const moved = Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > DRAG_PX;
    if (!moved && !drag) return;
    const d = fromMouth(e.clientX, e.clientY);
    setDrag({ f: p.f, x: e.clientX, y: e.clientY, near: d < NEAR, mouth: d < IN_MOUTH });
  }
  function drop(e) {
    const p = press.current;
    press.current = null;
    if (!p) return;
    const wasDrag = !!drag;
    setDrag(null);
    if (!wasDrag) return nudge();
    const d = fromMouth(e.clientX, e.clientY);
    if (d < IN_MOUTH || (full && d < NEAR)) offer(p.f);
  }

  // A tap on a food: he wants it brought over, not waved at.
  function nudge() {
    if (needs.asleep) return say('Zzz…');
    if (full) {
      naah();
      moment('naah', 1300);
      return say(pick(NAAH));
    }
    say(pick(['Bring it here. To my mouth.', 'Closer. I am not coming to get it.', 'Food goes in the face. My face.']));
  }

  function offer(f) {
    if (needs.asleep) return say('Zzz… (he is asleep. Wake him up in the Bedroom first)');
    if (full) {
      naah();
      moment('naah', 1300);
      return say(pick(NAAH));
    }
    eat(f);
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
      moment('yum', 1800);
      say(charity ? `Free food? For me? ...I still hate you. ${f.quip}` : pick([f.quip, f.quip, pick(YUM)]));
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
  const offering = drag?.near ? (full ? 'refuse' : 'open') : null;
  const pose = react === 'naah' ? 'refuse' : offering ?? (needs.hunger < 25 && !needs.asleep && !eating ? 'tummy' : undefined);
  const mood = eating ? 'scared' : react === 'yum' ? 'happy' : react === 'naah' || offering === 'refuse' ? 'annoyed' : face.mood;
  // a food in the strip: drag it to him, or tap it (Enter/Space too)
  const food = (f) => ({
    onPointerDown: (e) => grab(e, f),
    onPointerMove: slide,
    onPointerUp: drop,
    onPointerCancel: () => {
      press.current = null;
      setDrag(null);
    },
    onKeyDown: (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), offer(f)),
  });

  return (
    <RoomScene
      kind="kitchen"
      sky={sky}
      house={view?.house ?? roomOf(wallet, 'kitchen')}
      preview={view?.at}
      edit={edit}
      equipped={wallet.equipped}
      mood={mood}
      sleepy={face.sleepy}
      dirty={face.dirty}
      grime={face.grime}
      asleep={needs.asleep}
      fx={fx}
      eating={eating}
      pose={pose}
      line={line}
      onPoke={() => say(needs.asleep ? 'Zzz…' : stock.length ? 'Food. Not fingers. Bring me food.' : 'The fridge is empty. Buy me something.')}
      tray={
        <>
          {stock.length ? (
            <ul className="stock" aria-label="Food in the fridge">
              {stock.map((f) => {
                const n = wallet.pantry[f.id];
                return (
                  <li key={f.id}>
                    <button className={`stock-item ${drag?.f === f ? 'lifted' : ''}`} {...food(f)} disabled={!!eating || needs.asleep} aria-label={`Feed ${f.name}, ${n} in the fridge`}>
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
            <ul className="stock" aria-label="Free food">
              <li>
                <button className={`stock-item ${drag?.f === FREE_FOOD ? 'lifted' : ''}`} {...food(FREE_FOOD)} disabled={!!eating || needs.asleep} aria-label={`Feed ${FREE_FOOD.name}, free because you're out of coins`}>
                  <Art id={FREE_FOOD.id} />
                  <small>{FREE_FOOD.name}</small>
                  <span className="stock-count free" aria-hidden="true">
                    Free
                  </span>
                </button>
              </li>
            </ul>
          ) : null}
          <Hint active={active && !eating && !drag} show={!needs.asleep && needs.hunger < 60} from={feedMe} to={feedMe === '.stock-item' ? '.hero' : undefined} />
          {drag &&
            createPortal(
              <span className={`food-drag ${drag.near ? (full ? 'no' : drag.mouth ? 'yes in' : 'yes') : ''}`} style={{ left: drag.x, top: drag.y }} aria-hidden="true">
                <Art id={drag.f.id} />
              </span>,
              document.body
            )}
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
