'use client';

import { useSyncExternalStore } from 'react';
import { Sound } from '@/game/sound';

// Who's playing, as far as this device knows: the name they gave the first
// time, a random player id (for friend requests, later) and their settings.
// Kept in localStorage, apart from the wallet: it isn't part of the economy.
//
//   name    what he calls you ('' until you've told him)
//   id      'BHY-XXXX-XXXX', made once per device
//   sound   sound effects on
//   mic     the living room's mic button is shown

const KEY = 'buttonHatesYou.me.v1';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I
const DEFAULTS = Object.freeze({ name: '', id: '', sound: true, mic: true });

let me = null;
const listeners = new Set();

function newId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const s = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('');
  return `BHY-${s.slice(0, 4)}-${s.slice(4)}`;
}

function load() {
  if (me) return me;
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(KEY));
  } catch {}
  me = { ...DEFAULTS, ...saved };
  if (!me.id) {
    me.id = newId();
    save();
  }
  Sound.setMuted?.(!me.sound);
  return me;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(me));
  } catch {}
}

export function getMe() {
  return load();
}

export function setMe(patch) {
  me = { ...load(), ...patch };
  if ('sound' in patch) Sound.setMuted?.(!me.sound);
  save();
  listeners.forEach((fn) => fn());
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// null on the server and in the first paint, so nothing flashes.
export const useMe = () => useSyncExternalStore(subscribe, getMe, () => null);
