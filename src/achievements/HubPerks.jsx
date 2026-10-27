'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProfile } from '@/profile/useProfile';
import { readyCount } from '@/economy/achievements';
import { ChestDialog, useChest } from './Chest';

// The trophy and the daily chest on the home screen, under the wallet:
// a badge counts the achievement levels waiting to be claimed, and the chest
// bounces when today's one is still shut.
export default function HubPerks() {
  const { wallet, ready } = useProfile();
  const chest = useChest();
  const [open, setOpen] = useState(false);
  if (!ready) return null;
  const n = readyCount(wallet);

  return (
    <>
      <div className="hub-perks">
        <Link href="/achievements" className={`chip perk ${n ? 'hot' : ''}`} aria-label={n ? `Achievements: ${n} ready to claim` : 'Achievements'}>
          <span className="perk-ico" aria-hidden="true">
            🏆
          </span>
          <span className="label">Achievements</span>
          {n > 0 && <span className="perk-badge">{n}</span>}
        </Link>
        <button className={`chip perk ${chest?.ready ? 'hot chest-ready' : ''}`} onClick={() => setOpen(true)} aria-label={chest?.ready ? 'Daily chest: ready to open' : 'Daily chest'}>
          <span className="perk-ico" aria-hidden="true">
            🎁
          </span>
          <span className="label">{chest?.ready ? 'Chest ready!' : 'Chest'}</span>
          {chest?.ready && <span className="perk-badge">!</span>}
        </button>
      </div>
      {open && <ChestDialog onClose={() => setOpen(false)} />}
    </>
  );
}
