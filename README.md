# please don't.

A small browser game about a button that really doesn't want to be pressed.
Land 75 real clicks on it while it runs, cries, calls its friends, wrecks its
own house and finally turns into a boss.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## How it plays

| Clicks | What happens |
| --- | --- |
| 0–4 | It asks nicely, then grows legs |
| 5–20 | It dodges, says NOPE, calls friends (click them and they pop), and the house crashes |
| 21–40 | It cries, its family comes to beg, it offers a fake peace deal, and holds a funeral |
| 41–60 | A decoy army shows up (only the real one blinks), it hides in disguise, there's a chase, and the house collapses |
| 61–75 | Boss fight: balloon pop, platform climb, whack-a-button, shell game, then Simon, a bomb and a final smash |
| +20 | "Just to make sure I'm dead." |

Progress is saved in localStorage, and every boss hit is a checkpoint.

## Code

- `src/components/Game.jsx` renders the stage and starts the engine
- `src/game/story.js` handles clicks 0–60, the post-game and saving/resuming
- `src/game/boss.js` has the five boss minigames
- `src/game/core.js` has shared state and helpers
- `src/game/sound.js` makes quiet synthesized sounds (no audio files)

To test a section, open `/?at=55` to jump to any click count.
