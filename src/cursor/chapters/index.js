import ch1, * as m1 from './ch1';
import ch2, * as m2 from './ch2';
import ch3, * as m3 from './ch3';
import ch4, * as m4 from './ch4';
import ch5, * as m5 from './ch5';
import ch6, * as m6 from './ch6';
import { installArt } from '../art';
import * as foes from '../foes';

// Every chapter gets the Cursor lighting/atmosphere layers first.
const lit = (n, play) => (g, p) => {
  installArt(g, n);
  // dev only: the levels, so screenshots can jump straight to a scene
  if (process.env.NODE_ENV !== 'production') {
    window.__cursorLevels = { 1: m1, 2: m2, 3: m3, 4: m4, 5: m5, 6: m6 };
    window.__cursorFoes = foes;
  }
  return play(g, p);
};

// How I Met Your Cursor, in order. Grouped into three parts for the menu.
export const PARTS = [
  { n: 1, label: 'Part I', title: 'Zero Brain Cells' },
  { n: 2, label: 'Part II', title: 'Love, Actually Clicked' },
  { n: 3, label: 'Part III', title: 'Happily Ever After (For Now)' },
];

export const CHAPTERS = [
  { n: 1, act: 1, title: 'A Button, A Cursor, and Zero Brain Cells', mins: 4, start: {}, play: lit(1, ch1) },
  { n: 2, act: 1, title: 'Operation: Get a Girlfriend', mins: 5, start: {}, play: lit(2, ch2) },
  { n: 3, act: 2, title: 'The Worst First Date Ever', mins: 5, start: {}, play: lit(3, ch3) },
  { n: 4, act: 2, title: 'The Great Love Rescue', mins: 5, start: {}, play: lit(4, ch4) },
  { n: 5, act: 3, title: 'Operation: Marry Bella', mins: 6, start: {}, play: lit(5, ch5) },
  { n: 6, act: 3, title: 'The Wedding Disaster', mins: 5, start: {}, play: lit(6, ch6) },
];
