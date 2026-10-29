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
