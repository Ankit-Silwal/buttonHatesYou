'use client';

import { useEffect, useRef, useState } from 'react';
import Avatar from '@/components/Avatar';
import { Art } from '@/house/art';
import NeedBar from './NeedBar';
import { feed } from '@/profile/store';
import { faceOf } from '@/profile/needs';
import { canAfford } from '@/economy/rules';
import { FOODS } from '@/economy/house';

const price = (p) => (p.diamonds ? `${p.diamonds} 💎` : `${p.coins} 🪙`);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const HUNGRY = ['I could eat a keyboard.', 'My tummy is making dial-up noises.', 'Feed me. Please. Do not tell anyone I said please.'];
const FULL = ["I'm stuffed. Absolutely stuffed.", 'One more bite and I pop.'];

// The right panel: the fridge. One tap buys and feeds.
export default function FoodPane({ needs, wallet, active }) {
  const face = faceOf(needs);
  const [eating, setEating] = useState(null); // { id, n }
  const [quip, setQuip] = useState('');
  const [hello, setHello] = useState('');
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  // A fresh remark each time this panel comes into view.
  useEffect(() => {
    if (!active) return;
    setHello(needs.asleep ? 'Zzz…' : needs.hunger < 25 ? pick(HUNGRY) : needs.hunger > 92 ? pick(FULL) : 'What is on the menu?');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function eat(f) {
    if (needs.asleep) return setQuip('Zzz… (he is asleep. Wake him up in the Bedroom first)');
    if (!feed(f.id)) return setQuip("You're broke. Go play something.");
    setEating({ id: f.id, n: Date.now() });
    setQuip('Om nom nom…');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setEating(null);
      setQuip(f.quip);
    }, 1300);
  }

  const text = quip || hello;

  return (
    <div className="fp">
      <div className="pane-hero">
        <p className={`ph-bubble ${text ? 'on' : ''}`}>{text}</p>
        <div className="ph-stage">
          <Avatar size="clamp(96px, 20vh, 150px)" equipped={wallet.equipped} mood={eating ? 'scared' : face.mood} sleepy={face.sleepy} className="has-legs" />
          {eating && (
            <span key={eating.n} className="ph-food">
              <Art id={eating.id} />
            </span>
          )}
        </div>
      </div>

      <div className="pane-card">
        <NeedBar kind="hunger" label="Hunger" icon="🍔" value={needs.hunger} />
        <p className="pane-note">
          {needs.hunger < 20 ? 'Too hungry to play! Feed him.' : needs.hunger < 25 ? 'He looks bored. A snack would help.' : 'A game needs a tummy at least 20 full.'}
        </p>
      </div>

      <ul className="menu">
        {FOODS.map((f) => {
          const free = wallet.pantry?.[f.id] || 0;
          const poor = !free && !canAfford(wallet, f);
          return (
            <li key={f.id}>
              <button className="dish" onClick={() => eat(f)} disabled={!!eating || poor} aria-label={`Feed ${f.name}`}>
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
    </div>
  );
}
