'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Wallet from '@/components/Wallet';
import { useNeeds } from '@/profile/needs';
import { buy, decorate, feed, sleep, wake } from '@/profile/store';
import { owns, canAfford } from '@/economy/rules';
import { HOUSE_ITEMS, HOUSE_ITEM, FOODS, FOOD, SPOT } from '@/economy/house';
import { NEEDS, wakesAt } from '@/economy/needs';
import { Art } from './art';
import Room from './Room';

const TABS = [
  { id: 'food', name: 'Food', icon: '🍪' },
  { id: 'furniture', name: 'Furniture', icon: '🛋️' },
  { id: 'wall', name: 'Walls', icon: '🖼️' },
  { id: 'floor', name: 'Floors', icon: '🪵' },
];

const FX_TEXT = {
  sugar: 'Side effect: a sugar rush. He will bounce off the walls for a bit.',
  hiccup: 'Side effect: hiccups. Loud ones.',
  glow: 'Side effect: he glows. Briefly. Probably safe.',
  glitch: 'Side effect: a short glitch. He goes a bit low-res.',
};

const MOOD_LINES = {
  hungry: ['I could eat a keyboard. Feed me.', 'My tummy is making dial-up noises.'],
  tired: ["I'm running on 2% battery.", 'Need. Nap. Now.'],
  sad: ['Hungry AND tired. This is your fault.'],
  smug: ['Fed, rested and still not pressing myself. Iconic.', 'Welcome to my house. Wipe your cursor.'],
  calm: ['Oh. You again. Make yourself at home. Not too much.', 'Mind the rug. It was expensive. You paid.'],
  sleep: ['Zzz… (do not press)'],
};
const WANT = ['Is that for me? Gimme.', "I'd eat that. Reluctantly.", 'Ooh. Pay for it and it is mine.', 'Smells like a hardware store. Yum.'];
const POKES = ["Hands off. I'm at home.", 'This is MY house. No pressing.', 'Ow. Rude.', 'Do you poke everyone in their own living room?'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const priceText = (p) => (p.diamonds ? `${p.diamonds} 💎` : `${p.coins} 🪙`);

function Meter({ label, icon, value, ghost, kind }) {
  const v = Math.round(value);
  const g = ghost != null ? Math.round(Math.min(100, ghost)) : null;
  return (
    <div className={`meter meter-${kind} ${v < 25 ? 'low' : ''}`}>
      <div className="meter-head">
        <span className="meter-ico" aria-hidden="true">
          {icon}
        </span>
        <span className="meter-label">{label}</span>
        <b className="meter-num">
          {v}
          {g != null && g > v && <span className="meter-plus"> → {g}</span>}
        </b>
      </div>
      <div className="meter-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v}>
        {g != null && g > v && <i className="meter-ghost" style={{ width: `${g}%` }} />}
        <i className="meter-fill" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export default function House() {
  const needs = useNeeds();
  const { profile } = needs;
  const { wallet } = profile;
  const [tab, setTab] = useState('food');
  const [trying, setTrying] = useState(null); // item or food id being previewed
  const [spot, setSpot] = useState(null); // where the previewed furniture goes
  const [line, setLine] = useState({ text: '', mood: null, n: 0 });
  const [eating, setEating] = useState(null); // { id, n }
  const [fx, setFx] = useState(null);
  const timers = useRef({});

  const later = (key, ms, fn) => {
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(fn, ms);
  };
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const say = useCallback((text, mood = null, ms = 3400) => {
    setLine((l) => ({ text, mood, n: l.n + 1 }));
    clearTimeout(timers.current.say);
    timers.current.say = setTimeout(() => setLine((l) => ({ ...l, text: '', mood: null })), ms);
  }, []);

  // Say hello once we know how he's doing.
  const greeted = useRef(false);
  useEffect(() => {
    if (!needs.ready || greeted.current) return;
    greeted.current = true;
    say(pick(MOOD_LINES[needs.mood] ?? MOOD_LINES.calm), null, 4200);
  }, [needs.ready, needs.mood, say]);

  const item = trying ? HOUSE_ITEM[trying] : null;
  const food = trying ? FOOD[trying] : null;
  const have = item ? owns(wallet, item) : false;

  // What the room shows: the real house, plus whatever is being tried.
  let house = wallet.house;
  let previewAt = null;
  if (item && item.kind !== 'furniture' && wallet.house[item.kind] !== item.id) {
    house = { ...house, [item.kind]: item.id };
    previewAt = item.kind;
  } else if (item?.kind === 'furniture' && spot && wallet.house.place[spot] !== item.id) {
    const place = { ...house.place };
    for (const s of Object.keys(place)) if (place[s] === item.id) delete place[s];
    place[spot] = item.id;
    house = { ...house, place };
    previewAt = spot;
  }

  function choose(id) {
    if (trying === id) return cancel();
    const it = HOUSE_ITEM[id];
    setTrying(id);
    if (it?.kind === 'furniture') {
      const where = Object.keys(wallet.house.place).find((s) => wallet.house.place[s] === id);
      setSpot(where ?? it.spots.find((s) => !wallet.house.place[s]) ?? it.spots[0]);
    }
    const f = FOOD[id];
    if (f) say(needs.asleep ? 'Zzz… (wake him up to feed him)' : `${f.name}? ${pick(WANT)}`, 'smug', 4000);
  }

  function cancel() {
    setTrying(null);
    setSpot(null);
  }

  function broke() {
    say("You're broke. Go play something.", 'annoyed');
  }

  function buyItem() {
    if (!buy(item.id)) return broke();
    if (item.kind === 'furniture') decorate(spot, item.id);
    else decorate(item.kind, item.id);
    say(pick(["Fine. It's actually nice. Don't tell anyone.", 'Ooh. Fancy.', 'Finally, some taste in here.']), 'smug');
    cancel();
  }

  function applyItem() {
    decorate(item.kind === 'furniture' ? spot : item.kind, item.id);
    say(pick(['There. Perfect.', 'Hmm. Acceptable.', 'Move it again and I scream.']), 'smug');
    cancel();
  }

  function takeDown() {
    const where = Object.keys(wallet.house.place).find((s) => wallet.house.place[s] === item.id);
    if (where) decorate(where, null);
    say('Back in the box it goes.', 'calm');
    cancel();
  }

  function eat() {
    if (needs.asleep) return say("He's asleep. Wake him up first.", null);
    if (!feed(food.id)) return broke();
    const id = food.id;
    setEating({ id, n: Date.now() });
    setFx(null);
    say('Om nom nom…', 'scared', 1400);
    later('eat', 1300, () => {
      setEating(null);
      say(FOOD[id].quip, 'smug', 3600);
      if (FOOD[id].fx) {
        setFx(FOOD[id].fx);
        later('fx', FOOD[id].fx === 'glow' ? 6000 : 3800, () => setFx(null));
      }
    });
  }

  function toggleSleep() {
    if (needs.asleep) {
      wake();
      say(needs.energy > 90 ? 'Good morning. I still hate you.' : 'Ugh. Five more minutes would have been nice.', 'annoyed');
    } else {
      if (needs.energy >= 99) return say("I'm not tired. Nice try.", 'smug');
      if (!sleep()) return;
      cancel();
      say('Lights out. Do not press anything.', 'tired', 2400);
    }
  }

  function poke() {
    if (needs.asleep) return say('Zzz… *mumbles* …not the button…', null, 2200);
    say(pick(POKES), pick(['annoyed', 'angry', 'smug']), 2200);
  }

  const mood = line.mood ?? (needs.mood === 'hungry' ? 'sad' : needs.mood === 'sleep' ? 'sleep' : needs.mood);
  const ghost = food && !needs.asleep ? { hunger: needs.hunger + food.hunger, energy: needs.energy + food.energy } : null;
  const wakeIn = needs.asleep ? Math.max(0, Math.ceil((wakesAt(needs) - Date.now()) / 60000)) : 0;
  const short = (it) =>
    it?.price && !canAfford(wallet, it)
      ? it.price.diamonds
        ? `need ${it.price.diamonds - wallet.diamonds} more 💎`
        : `need ${it.price.coins - wallet.coins} more 🪙`
      : null;

  const list = tab === 'food' ? FOODS : HOUSE_ITEMS.filter((i) => i.kind === tab);

  return (
    <main className="house" data-asleep={needs.asleep || undefined}>
      <header className="house-top">
        <div className="row">
          <Link href="/" className="chip home" aria-label="Home">
            🏠
          </Link>
          <Wallet profile={profile} />
        </div>
        <Link href="/games" className="chip">
          🎮<span className="label"> Games</span>
        </Link>
      </header>

      <div className="house-main">
        <section className="house-stage" aria-label="The button's room">
          <Room
            house={house}
            preview={previewAt}
            equipped={wallet.equipped}
            mood={eating ? 'scared' : mood}
            asleep={needs.asleep}
            fx={fx}
            eating={eating}
            offer={food && !eating && !needs.asleep ? food.id : null}
            line={line}
            onPoke={poke}
          />
        </section>

        <aside className="house-panel">
          <div className="needs-card">
            <Meter kind="hunger" label="Hunger" icon="🍔" value={needs.hunger} ghost={ghost?.hunger} />
            <Meter kind="energy" label="Energy" icon="⚡" value={needs.energy} ghost={ghost?.energy} />
            <div className="needs-row">
              <p className="needs-note">
                {needs.asleep
                  ? `Sleeping. Energy +${Math.round(NEEDS.sleepEnergyPerHour / 60 * 10) / 10} a minute${wakeIn ? `, up in about ${wakeIn} min` : ''}.`
                  : needs.energy < 25
                    ? 'Too tired for most games. Feed him or let him nap.'
                    : 'Games cost energy: Adventure 10, Story 15.'}
              </p>
              <button className={`pill sleep-btn ${needs.asleep ? 'awake' : ''}`} onClick={toggleSleep}>
                {needs.asleep ? '☀️ Wake up' : '🌙 Sleep'}
              </button>
            </div>
          </div>

          <div className="shop">
            <div className="shop-tabs" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => {
                    setTab(t.id);
                    cancel();
                  }}
                >
                  <span aria-hidden="true">{t.icon}</span> {t.name}
                </button>
              ))}
            </div>

            <div className="shop-grid">
              {list.map((it) => {
                const isFood = tab === 'food';
                const mine = !isFood && owns(wallet, it);
                const inUse = !isFood && (it.kind === 'furniture' ? Object.values(wallet.house.place).includes(it.id) : wallet.house[it.kind] === it.id);
                return (
                  <button key={it.id} className={`shop-tile ${trying === it.id ? 'trying' : ''}`} aria-pressed={inUse} onClick={() => choose(it.id)}>
                    {inUse && <span className="check">✓</span>}
                    <span className="thumb" data-kind={isFood ? 'food' : it.kind}>
                      {it.kind === 'wall' || it.kind === 'floor' ? (
                        <span className={`swatch ${it.kind === 'wall' ? 'hs-wall' : 'hs-floor'}`} {...{ [`data-${it.kind}`]: it.id }} />
                      ) : (
                        <Art id={it.id} />
                      )}
                    </span>
                    <span className="name">{it.name}</span>
                    <span className="cost">
                      {isFood ? (
                        <>
                          {priceText(it.price)}
                          <em>
                            {it.hunger ? ` 🍔+${it.hunger}` : ''}
                            {it.energy ? ` ⚡+${it.energy}` : ''}
                          </em>
                        </>
                      ) : inUse ? (
                        it.kind === 'furniture' ? 'Placed' : 'In use'
                      ) : mine ? (
                        'Owned'
                      ) : (
                        priceText(it.price)
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {(item || food) && (
        <div className="house-buybar" role="region" aria-label="Preview">
          <div className="bb-info">
            <span className="bb-tag">{food ? 'Taste test' : have ? 'Your stuff' : 'Previewing'}</span>
            <b>{(item ?? food).name}</b>
            <span className="bb-note">
              {food
                ? `${food.hunger ? `Hunger +${food.hunger}` : ''}${food.hunger && food.energy ? ', ' : ''}${food.energy ? `energy +${food.energy}` : ''}. ${FX_TEXT[food.fx] ?? 'No side effects. Allegedly.'}`
                : item.kind === 'furniture'
                  ? have
                    ? 'Pick a spot, then place it.'
                    : 'Shown in your room. Nothing is charged until you buy.'
                  : have
                    ? 'Shown in your room.'
                    : 'Shown in your room. Nothing is charged until you buy.'}
              {short(item ?? food) && <span className="bb-short"> · {short(item ?? food)}</span>}
            </span>
            {item?.kind === 'furniture' && item.spots.length > 1 && (
              <div className="bb-spots" role="radiogroup" aria-label="Where it goes">
                {item.spots.map((s) => (
                  <button key={s} role="radio" aria-checked={spot === s} onClick={() => setSpot(s)}>
                    {SPOT[s].name}
                    {wallet.house.place[s] && wallet.house.place[s] !== item.id ? ' (swap)' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="bb-actions">
            <button className="pill ghost" onClick={cancel}>
              Cancel
            </button>
            {food ? (
              <button className="pill" onClick={eat} disabled={needs.asleep || !canAfford(wallet, food)}>
                Feed · {priceText(food.price)}
              </button>
            ) : !have ? (
              <button className="pill" onClick={buyItem} disabled={!canAfford(wallet, item)}>
                Buy · {priceText(item.price)}
              </button>
            ) : item.kind === 'furniture' && wallet.house.place[spot] === item.id ? (
              item.spots.includes('bed') ? null : (
                <button className="pill alt" onClick={takeDown}>
                  Take down
                </button>
              )
            ) : item.kind !== 'furniture' && wallet.house[item.kind] === item.id ? null : (
              <button className="pill" onClick={applyItem}>
                {item.kind === 'furniture' ? 'Place it' : 'Use this'}
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
