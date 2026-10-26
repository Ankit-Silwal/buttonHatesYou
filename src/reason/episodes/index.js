import ep1 from './ep1';
import ep2 from './ep2';
import ep3 from './ep3';
import ep4 from './ep4';
import ep5 from './ep5';
import ep6 from './ep6';

// The whole story, in order. `start` is what Bobby can already do when an
// episode is played straight from the menu; story choices carry over from
// the save on their own.
export const ACTS = [
  { n: 1, title: 'Before Everything Went Wrong' },
  { n: 2, title: 'The Adventure' },
  { n: 3, title: 'The Price of the Mission' },
  { n: 4, title: 'The Final Episode' },
];

export const EPISODES = [
  { n: 1, act: 1, title: 'A Button With a Life', mins: 4, start: {}, play: ep1 },
  { n: 2, act: 1, title: 'The First Click', mins: 5, start: { sword: true, pendant: true }, play: ep2 },
  { n: 3, act: 2, title: 'Two Idiots and a Sword', mins: 5, start: { sword: true, pendant: true }, play: ep3 },
  { n: 4, act: 2, title: 'The Forgotten Kingdom', mins: 5, start: { sword: true, pendant: true, doubleJump: true }, play: ep4 },
  { n: 5, act: 2, title: 'The Truth Beneath the Code', mins: 5, start: { sword: true, pendant: true, doubleJump: true }, play: ep5 },
  { n: 6, act: 3, title: 'The Last Laugh', mins: 5, start: { sword: true, pendant: true, doubleJump: true, dash: true }, play: ep6 },
  { n: 7, act: 3, title: 'The False Choice', mins: 5, start: { sword: true, pendant: true, doubleJump: true, dash: true, tabbySword: true } },
  { n: 8, act: 3, title: 'The Day Everything Died', mins: 6, start: { sword: true, pendant: true, doubleJump: true, dash: true, tabbySword: true } },
  { n: 9, act: 4, title: 'I Hate You', mins: 10, start: { sword: true, pendant: true, doubleJump: true, dash: true, tabbySword: true, pendantCracked: true } },
];

export const LAST = EPISODES.length;
