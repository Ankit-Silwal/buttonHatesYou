'use client';

import { useState } from 'react';
import { levelState } from '@/economy/levels';
import { useProfile } from '@/profile/useProfile';
import LevelSheet, { Ring } from './LevelSheet';
import './levels.css';

// The level chip for the home screen's top bar: the level number in a ring
// of its three missions, with a "!" once it can be claimed. Tapping it opens
// the level sheet; the props are passed on to it (see LevelSheet).
export default function LevelChip({ go, openWardrobe, openDecor, openFood }) {
  const { wallet, ready } = useProfile();
  const [open, setOpen] = useState(false);
  if (!ready) return null;
  const st = levelState(wallet);
  const label = st.max ? 'All levels cleared' : `Level ${st.level}: ${st.done} of 3 missions done${st.ready ? ', ready to level up' : ''}`;
  return (
    <>
      <button type="button" className={`chip icon-chip lv-chip ${st.ready ? 'hot' : ''}`} onClick={() => setOpen(true)} aria-label={label} title={label}>
        <Ring done={st.max ? 3 : st.done} level={st.level} size={34} ready={st.ready} />
        {st.ready && <span className="perk-badge">!</span>}
      </button>
      {open && <LevelSheet onClose={() => setOpen(false)} go={go} openWardrobe={openWardrobe} openDecor={openDecor} openFood={openFood} />}
    </>
  );
}

// The same, around the home screen's profile button: a ring of the level's
// three missions drawn round `children` (the button), and a level-number
// badge. The ring and the badge open the level sheet; the button itself
// still goes where it goes.
export function LevelRing({ children, go, openWardrobe, openDecor, openFood }) {
  const { wallet, ready } = useProfile();
  const [open, setOpen] = useState(false);
  if (!ready) return children;
  const st = levelState(wallet);
  const done = st.max ? 3 : st.done;
  const label = st.max ? 'All levels cleared' : `Level ${st.level}: ${st.done} of 3 missions done${st.ready ? ', ready to level up' : ''}`;
  const r = 34;
  const c = 2 * Math.PI * r;
  const gap = 5;
  const seg = c / 3 - gap;
  return (
    <span className={`lv-around ${st.ready ? 'ready' : ''}`}>
      <button type="button" className="lv-around-hit" onClick={() => setOpen(true)} aria-label={label} title={label} tabIndex={-1} />
      <svg className="lv-around-ring" viewBox="0 0 76 76" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <circle key={i} cx="38" cy="38" r={r} fill="none" strokeWidth="4.5" strokeLinecap="round" className={i < done ? 'on' : ''} strokeDasharray={`${seg} ${c - seg}`} strokeDashoffset={c / 4 - i * (c / 3) - gap / 2} />
        ))}
      </svg>
      {children}
      <button type="button" className="lv-around-badge" onClick={() => setOpen(true)} aria-label={label} title={label}>
        {st.level}
        {st.ready && <i aria-hidden="true">!</i>}
      </button>
      {open && <LevelSheet onClose={() => setOpen(false)} go={go} openWardrobe={openWardrobe} openDecor={openDecor} openFood={openFood} />}
    </span>
  );
}
