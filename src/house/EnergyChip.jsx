'use client';

import { useNeeds } from '@/profile/needs';
import './chip.css';

// The two little meters on the home screen: hunger and energy. Tapping them
// opens the room that fixes the one that is lower (`go` is the pager's).
export default function EnergyChip({ go }) {
  const n = useNeeds();
  if (!n.ready) return null;
  const e = Math.floor(n.energy);
  const h = Math.floor(n.hunger);
  const label = n.asleep ? `Asleep. Hunger ${h} of 100` : `Hunger ${h} of 100, energy ${e} of 100`;
  const low = e < 25 || h < 25;
  return (
    <button
      type="button"
      className={`chip energy-chip ${low ? 'low' : ''} ${n.asleep ? 'asleep' : ''}`}
      title={label}
      aria-label={`${label}. ${h < e ? 'Open kitchen' : 'Open bedroom'}`}
      onClick={() => go?.(n.asleep || e <= h ? 3 : 2)}
    >
      <span className={`ec-one hunger ${h < 25 ? 'low' : ''}`}>
        <span aria-hidden="true">🍔</span>
        <span className="ec-bar" aria-hidden="true">
          <i style={{ width: `${h}%` }} />
        </span>
        <b>{h}</b>
      </span>
      <span className={`ec-one energy ${e < 25 ? 'low' : ''} ${n.asleep ? 'asleep' : ''}`}>
        <span aria-hidden="true">{n.asleep ? '💤' : '⚡'}</span>
        <span className="ec-bar" aria-hidden="true">
          <i style={{ width: `${e}%` }} />
        </span>
        <b>{e}</b>
      </span>
    </button>
  );
}
