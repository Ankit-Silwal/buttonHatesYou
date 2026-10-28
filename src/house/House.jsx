'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Wallet from '@/components/Wallet';
import { useNeeds, faceOf } from '@/profile/needs';
import { ROOMS, ROOM_IDS, roomOf } from '@/economy/house';
import Room, { skyOf } from './Room';
import DecorSheet from './DecorSheet';

const MOOD_LINES = {
  hungry: ['I could eat a keyboard. Feed me.', 'My tummy is making dial-up noises.'],
  tired: ["I'm running on 2% battery.", 'Need. Nap. Now.'],
  sad: ['Hungry AND tired. This is your fault.'],
  smug: ['Fed, rested and still not pressing myself. Iconic.', 'Welcome to my house. Wipe your cursor.'],
  calm: ['Oh. You again. Make yourself at home. Not too much.', 'Mind the rug. It was expensive. You paid.'],
  sleep: ['Zzz… (do not press)'],
};
const POKES = ["Hands off. I'm at home.", 'This is MY house. No pressing.', 'Ow. Rude.', 'Do you poke everyone in their own living room?'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// The full-screen decorating page: a big view of any of the three rooms and
// the same decorating sheet the home screen uses. Food moved to the Kitchen,
// bedtime to the Bedroom (the lamp).
export default function House() {
  const needs = useNeeds();
  const { profile } = needs;
  const { wallet } = profile;
  const [room, setRoom] = useState('living');
  const [open, setOpen] = useState(true);
  const [view, setView] = useState(null); // { house, at }: what is being tried
  const [line, setLine] = useState({ text: '', n: 0 });
  const [sky, setSky] = useState('day');
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const say = useCallback((text, ms = 3400) => {
    setLine((l) => ({ text, n: l.n + 1 }));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLine((l) => ({ ...l, text: '' })), ms);
  }, []);

  useEffect(() => {
    const d = new Date();
    setSky(skyOf(d.getHours() + d.getMinutes() / 60));
  }, []);

  const greeted = useRef(false);
  useEffect(() => {
    if (!needs.ready || greeted.current) return;
    greeted.current = true;
    say(pick(MOOD_LINES[needs.mood] ?? MOOD_LINES.calm), 4200);
  }, [needs.ready, needs.mood, say]);

  const face = faceOf(needs);
  const house = view?.house ?? roomOf(wallet, room);

  function switchRoom(id) {
    setRoom(id);
    setView(null);
  }

  return (
    <main className="house" data-sheet={open || undefined}>
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
        <div className="tabs house-rooms" role="tablist" aria-label="Rooms">
          {ROOM_IDS.map((id) => (
            <button key={id} role="tab" aria-selected={room === id} onClick={() => switchRoom(id)}>
              <span aria-hidden="true">{ROOMS[id].icon}</span> {ROOMS[id].name}
            </button>
          ))}
        </div>

        <section className="house-stage" aria-label={`The ${ROOMS[room].name}`}>
          <Room
            key={room}
            room={room}
            sky={sky}
            house={house}
            preview={view?.at}
            equipped={wallet.equipped}
            mood={face.mood}
            sleepy={face.sleepy}
            dirty={face.dirty}
            grime={face.grime}
            asleep={needs.asleep}
            line={line}
            onPoke={() => say(needs.asleep ? 'Zzz… *mumbles* …not the button…' : pick(POKES), 2200)}
          />
        </section>

        {!open && (
          <button className="pill big" onClick={() => setOpen(true)}>
            <span className="ico">🛋️</span> Decorate
          </button>
        )}
      </div>

      {open && <DecorSheet key={room} room={room} wallet={wallet} onPreview={setView} onClose={() => setOpen(false)} fullLink={false} />}
    </main>
  );
}
