'use client';

import StoryGame from '@/reason/StoryGame';
import { PARTS, CHAPTERS } from './chapters';

const KEYS = (
  <>
    <b>← →</b> move · <b>Space</b> jump · <b>J</b> attack · <b>Q</b> Tabby · <b>E</b> talk / use · <b>click</b> or <b>R</b> Cursor presses glowing things · <b>Esc</b> pause
  </>
);

// Bobby with Cursor floating beside him, for the menu.
const HERO = (
  <div className="reason-bobby cursor-hero" aria-hidden="true">
    <span className="body" />
    <span className="pal">
      <svg viewBox="0 0 24 32">
        <path d="M2 2 L2 26 L8 20 L12 30 L16 28 L12 18 L20 18 Z" />
      </svg>
    </span>
  </div>
);

const CONFIG = {
  saveKey: 'buttonHatesYou.cursor.v1',
  episodes: CHAPTERS,
  acts: PARTS,
  story: 'cursor', // pays STORY_REWARDS 'cursor:<n>', once each
  unit: 'Chapter',
  title: 'How I Met Your Cursor',
  kicker: 'Button Quest · the story before The Reason',
  sub: 'Before Button hated you, you were the best wingman he ever had. 6 chapters · about 30 minutes.',
  theme: 'cursor-theme',
  hero: HERO,
  keys: KEYS,
};

export default function CursorGame() {
  return <StoryGame cfg={CONFIG} />;
}
