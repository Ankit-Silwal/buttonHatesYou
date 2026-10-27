'use client';

import { useEffect, useState } from 'react';
import { useProfile } from './useProfile';
import { getProfile, play } from './store';
import { needsAt, moodOf, PLAY_COST } from '@/economy/needs';

// The button's needs as they are right now. Hunger and energy drift with the
// clock, so this re-reads them every few seconds (every second while asleep,
// so the energy meter visibly fills).
export function useNeeds() {
  const profile = useProfile();
  const [now, setNow] = useState(0);
  const asleep = profile.wallet.needs?.asleep;
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), asleep ? 1000 : 5000);
    return () => clearInterval(t);
  }, [asleep]);
  const needs = needsAt(profile.wallet.needs, Math.max(now, profile.wallet.needs.at));
  return { ...needs, mood: moodOf(needs), ready: profile.ready && now > 0, profile };
}

export const currentNeeds = () => needsAt(getProfile().wallet.needs, Date.now());

// Why a game can't start right now: null when it can.
export function whyNot(kind) {
  const n = currentNeeds();
  if (n.asleep) return 'asleep';
  if (n.energy < PLAY_COST[kind]) return 'tired';
  return null;
}

// Starting a game: spends the energy and returns true, or returns false
// (and spends nothing) when he's asleep or too tired.
export const spendEnergy = (kind) => play(kind);

export { PLAY_COST };
