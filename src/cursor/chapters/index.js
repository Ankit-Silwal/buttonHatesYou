import ch1 from './ch1';
import ch2 from './ch2';
import ch3 from './ch3';
import ch4 from './ch4';
import ch5 from './ch5';
import ch6 from './ch6';
import { installArt } from '../art';

// Every chapter gets the Cursor lighting/atmosphere layers first.
const lit = (n, play) => (g, p) => {
  installArt(g, n);
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
