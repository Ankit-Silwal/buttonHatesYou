'use client';

import Link from 'next/link';
import { useNeeds } from '@/profile/needs';
import './chip.css';

// The little energy meter on the home screen. Tapping it goes to the house.
export default function EnergyChip() {
  const n = useNeeds();
  if (!n.ready) return null;
  const e = Math.floor(n.energy);
  const label = n.asleep ? 'Asleep' : `Energy ${e} of 100`;
  return (
    <Link href="/house" className={`chip energy-chip ${e < 25 ? 'low' : ''} ${n.asleep ? 'asleep' : ''}`} title={`${label}. Tap to visit the house.`} aria-label={`${label}. Visit the house`}>
      <span aria-hidden="true">{n.asleep ? '💤' : '⚡'}</span>
      <span className="ec-bar" aria-hidden="true">
        <i style={{ width: `${e}%` }} />
      </span>
      <b>{e}</b>
    </Link>
  );
}
