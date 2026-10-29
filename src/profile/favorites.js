'use client';

import { useCallback, useSyncExternalStore } from 'react';

// The games the player starred, in the order they starred them. Kept in this
// browser only (it's a preference, not progress, so it never syncs), and
// shared by every component that asks, so the Games grid re-sorts the moment
// one is toggled.
const KEY = 'bhy.favorites';
const EMPTY = [];
let ids = null;
const listeners = new Set();

function read() {
  if (ids) return ids;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    ids = Array.isArray(v) ? v.filter((x) => typeof x === 'string') : EMPTY;
  } catch {
    ids = EMPTY;
  }
  return ids;
}

function write(next) {
  ids = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((f) => f());
}

const subscribe = (f) => {
  listeners.add(f);
  const onStorage = (e) => {
    if (e.key !== KEY) return;
    ids = null;
    f();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(f);
    window.removeEventListener('storage', onStorage);
  };
};

// [ids, toggle(id)]: toggle stars a game (added last) or un-stars it.
export function useFavorites() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((id) => {
    const now = read();
    write(now.includes(id) ? now.filter((x) => x !== id) : [...now, id]);
  }, []);
  return [list, toggle];
}
