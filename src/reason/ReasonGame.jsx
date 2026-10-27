'use client';

import StoryGame from './StoryGame';
import { ACTS, EPISODES } from './episodes';

const KEYS = (
  <>
    <b>← →</b> move · <b>Space</b> jump · <b>J</b> attack · <b>K</b> dash · <b>Q</b> Tabby · <b>E</b> talk / use · <b>Esc</b> pause
  </>
);

const CONFIG = {
  saveKey: 'buttonHatesYou.reason.v1',
  episodes: EPISODES,
  acts: ACTS,
  story: 'reason', // pays STORY_REWARDS 'reason:<n>', once each
  unit: 'Episode',
  title: 'The Reason',
  kicker: 'A prequel to The Button That Hates You',
  sub: 'Why the button hates you. 9 episodes · about 50 minutes.',
  keys: KEYS,
};

export default function ReasonGame() {
  return <StoryGame cfg={CONFIG} />;
}
