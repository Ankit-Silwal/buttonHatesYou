# Button Hates You

A button that really doesn't want to be pressed, living in its little room
(think Talking Tom, but it hates you). Poke it, play mini-games to earn 🪙 coins
and 💎 diamonds, and spend them dressing it up: colors, eyes, ears, scarves, hats.
Whatever it wears shows up inside the games too.

The first mini-game is **Please Don't**: land 65 real clicks on the button while
it runs, cries, calls its friends, wrecks its own house and finally turns into a
boss. Finishing it pays 20 🪙 + 1 💎.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Google sign-in and the backend

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: an OAuth Client ID (type "Web application") from
  the Google Cloud console, with `http://localhost:3000` under *Authorized JavaScript origins*
- `SESSION_SECRET`: any long random string
- `MONGODB_URI` (optional): without it, accounts are stored in `data/users.json`,
  which is fine locally but won't work on hosts without a disk (Vercel)

Without these the game still works fully as a guest; sign-in just shows "soon".

### How saving works (offline first)

Coins, diamonds and outfits live in the browser cache (localStorage) first, so
everything works offline. Every change is recorded as an event (`reward`, `buy`,
`equip`) in an outbox. When you're signed in and online, the outbox goes to
`/api/sync`. The server replays the events with the same rules
(`src/economy/rules.js`), using its own price and reward table, skips anything
it has already seen, and its answer becomes the new truth. Guest progress is
uploaded the first time you sign in.

## Please Don't: how it plays

| Clicks | What happens |
| --- | --- |
| 0–4 | It asks nicely, then grows legs |
| 5–16 | It dodges, says NOPE, calls friends (click them and they pop), and the house crashes |
| 17–32 | It cries, its family comes to beg, it offers a fake peace deal, and holds a funeral |
| 33–50 | A decoy army shows up (only the real one blinks; click a fake to pop it until your next real hit), it hides in disguise, there's a chase, and the house collapses |
| 51–65 | Boss fight: balloon pop, platform climb, whack-a-button, shell game, then Simon, a bomb and a final smash |
| +20 | "Just to make sure I'm dead." |

Stuck? There are two skips, and both make you type a silly phrase (no pasting):
- ⏩ skips ahead a little: to the next event in the story, or one round of a boss minigame
- ⏭ skips the whole level: to the next act in the story, or the rest of the current boss minigame

You will be called a loser either way.

Missing the button hurts too: every click on empty space cracks the wall and knocks the furniture crooked, and the button will ask why you are breaking its house.

Progress is saved in localStorage, and every boss hit is a checkpoint.

## Code

- `src/components/Hub.jsx` is the home room; `Wardrobe.jsx` is the shop; `Account.jsx` is Google sign-in
- `src/economy/` has the catalog (items, prices, games and their rewards) and the wallet rules shared by browser and server
- `src/profile/store.js` is the offline-first profile cache and sync
- `src/avatar/look.js` + `src/app/avatar.css` dress the button
- `src/app/api/` has the backend: `auth/google`, `auth/logout`, `me`, `sync`; `src/server/` has the session and database code
- `src/components/Game.jsx` renders the Please Don't stage and starts the engine
- `src/game/story.js` handles clicks 0–50 (the `AT` table at the top sets when each beat happens), the post-game and saving/resuming
- `src/game/boss.js` has the five boss minigames
- `src/game/core.js` has shared state and helpers
- `src/game/skip.js` is the type-a-silly-phrase skip dialog
- `src/game/sound.js` makes quiet synthesized sounds (no audio files)

To test a section, open `/games/please-dont?at=55` to jump to any click count (test runs don't pay out).

### Adding a mini-game

Add it to `GAMES` in `src/economy/catalog.js` (id, page, reward), give it a page under `src/app/games/`, and call `grantReward('<id>')` from `@/profile/store` when the player finishes.
