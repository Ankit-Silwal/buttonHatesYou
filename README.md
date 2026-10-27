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

Coins, diamonds, outfits, the house and the button's needs live in the browser cache (localStorage) first, so
everything works offline. Every change is recorded as an event (`run`, `claim`,
`buy`, `equip`, and the house and needs events) in an outbox. When you're signed in and online, the outbox goes to
`/api/sync`. The server replays the events with the same rules
(`src/economy/rules.js`), using its own price and reward table (an Adventure
run sends its score, never its payout; see [Economy](#economy)), skips anything
it has already seen, and its answer becomes the new truth. Guest progress is
uploaded the first time you sign in.

## The house and the button's needs

`/house` is the button's room. He lives there in his outfit, breathes, blinks
and pulls faces that match how he feels.

- **Decorate.** Buy wallpapers (Cozy Cream, Night City, Space Station…),
  floors, and furniture for fixed spots: ceiling, two wall spots, the bed,
  a corner, floor left/right and a rug. Everything is a hand-drawn SVG
  (`src/house/art.jsx`). Tapping an item previews it in the real room, lit and
  animated, with a "Previewing" tag; nothing is charged until you press Buy.
- **Feed him.** Silly button food: a browser cookie, a USB stick sandwich, an
  AA battery smoothie, hot glue hot dogs… Each restores hunger and/or energy
  (the meters show a ghost of the result before you buy) and some have side
  effects (hiccups, a sugar rush, a glow, a glitch).
- **Needs.** Hunger and energy run 0–100 and drift down with real time, even
  while the app is closed, but time alone never drags them below 15.
- **Sleep.** Put him to bed (everyone has a free old mattress). The lights
  dim, Zzz float up and energy refills over about an hour; he wakes on his own
  when it's full, or when you wake him.
- **Energy gates games.** An Adventure run costs 10 energy, a story
  episode/chapter or Please Don't costs 15. Too tired or asleep, and he refuses
  with a link home. Food is cheap and naps are free, so nobody is stuck.

Code: the catalog and foods are in `src/economy/house.js`, the needs math in
`src/economy/needs.js`, and the new wallet events (`decor`, `feed`, `sleep`,
`wake`, `play`) in `applyHouseEvent` in `src/economy/rules.js`, so the server
validates purchases and needs exactly like outfits. Needs events carry the time
they happened; the server never accepts one later than its own clock or earlier
than the previous one. `src/profile/needs.js` has the `useNeeds()` hook, and
`src/house/EnergyGate.jsx` the `useEnergyGate(kind)` hook every game calls when
it starts. Profiles saved before the house existed get defaults
(`normalize()` in rules.js).

## How I Met Your Cursor

The story before The Reason, and the opposite of it: funny, romantic and
wholesome. Bobby meets Cursor (a cursor who points at things for a living)
and Tabby, survives the worst first date ever, and marries Bella. 6 chapters,
about 30 minutes, on the same engine as The Reason. Cursor is a companion:
click anything glowing (or press R) and he flies over and presses it. Each
chapter pays 15 🪙 the first time; finishing pays 60 🪙 + 4 💎.

- `src/cursor/chapters/chN.js`: one file per chapter; `index.js` lists them
- `src/cursor/foes.js`: its enemies and bosses (Tax Collector, Karen Popup,
  Lord 404, the CAPTCHA Golem, Error 500)
- `src/cursor/companion.js`: Cursor, and glowing switches he can press
- `src/reason/StoryGame.jsx`: the menu and episode runner both story games share

## The Story page

`/story` (📖 Story on the home screen) tells the whole series in order: How I
Met Your Cursor, The Reason, then The Button That Hates You. Every part's premise is readable; each chapter's
retelling unlocks once that chapter is finished in its game (read from each
game's save in localStorage). The text lives in `src/story/content.js`.

## The Reason

The prequel: why the button hates you. A Swordigo-style platformer in 9
episodes (about 50 minutes). Bobby, his wife Bella and his best friend Tabby
the Tab key are helping a mysterious Player save Clicktopia for THE ADMIN,
until it turns out the Player's clicks are what the Admin needed all along.
In the final episode Bobby becomes the boss and you play as the cursor.
Each episode pays 15 🪙 the first time; finishing pays 80 🪙 + 5 💎.

Controls: ← → move · Space jump (twice once unlocked) · J attack (three
presses for a combo, ↓ + J in the air to bounce) · K dash · Q Tabby's slam ·
E talk / use · Esc pause. Phones get an on-screen pad.

- `src/reason/engine.js`: fixed-step loop, input, collisions, camera, and
  the script API episodes `await` (`say`, `choose`, `walk`, `reach`, `card`…)
- `src/reason/actors.js`: Bobby's controller, NPCs, Tabby as a companion,
  enemies, pickups and moving/falling/vanishing platforms
- `src/reason/bosses.js`, `src/reason/finale.js`: the bosses, the cursor
  player and THE ADMIN
- `src/reason/draw.js`: everything is drawn with canvas shapes (no assets)
- `src/reason/audio.js`: synthesized effects and a tiny step sequencer for
  the music (the boss theme is the village theme, in minor)
- `src/reason/episodes/epN.js`: one file per episode; `index.js` lists them
  and what Bobby can already do when one is started from the menu

## Economy

Coins (🪙) come from playing; diamonds (💎) are rare. All numbers live in
`src/economy/catalog.js` (`STORY_REWARDS`, `RUN_LIMITS`, each Adventure
game's `payout`) and the rules in `src/economy/rules.js`, which the browser
and the server both run. `node scripts/check-economy.mjs` checks them.

**Adventure runs pay every time, by score, in rising tiers.** A game's first
`per` units pay `base` coins in total, the next `per` pay `2 × base`, then
`3 × base`, and so on; a partial tier pays its share, rounded down. Flappy
Regret (`per` 10 pipes, `base` 25): 10 pipes pay 25, 15 pay 50, 20 pay 75,
30 pay 150, 40 pay 250. Every game uses `base` 25, with `per` set so the old
"goal" score is about one and a half tiers:

| Game | per tier | decent run | great run |
| --- | --- | --- | --- |
| Flappy Regret | 10 pipes | 15 → 50 | 30 → 150 |
| Pop Tantrum | 1000 points | 1500 → 50 | 3000 → 150 |
| Snack Attack | 25 snacks | 40 → 55 | 75 → 150 |
| Copy Me | 5 rounds | 8 → 55 | 15 → 150 |
| Sky Hop | 2000 m | 3000 → 50 | 6000 → 150 |
| Whack-a-Button | 20 bonks | 30 → 50 | 60 → 150 |
| Run Away | 600 m | 1000 → 58 | 1800 → 150 |
| Tower of Regret | 12 floors | 20 → 58 | 36 → 150 |
| Slice Spree | 30 slices | 50 → 58 | 90 → 150 |

Button Run instead pays exactly the coins the button picked up (the counter in
the corner; x2 coins count double), typically 30 to 100 a run.

Diamonds from runs: 1 💎 the first time a run in a game pays 100+, and 1 more
for a run paying 200+ that is at least 1.5 times that game's best payout so
far. That is at most about three per game, ever.

**Story games pay big, once.** The first finish of each part pays, and the
wallet remembers it (`claimed`), so replays (or wiping a story save) pay
nothing, on the server too:

| Story | Each part | Finale | Total |
| --- | --- | --- | --- |
| The Reason (9 episodes) | 200 🪙 | 1500 🪙 + 10 💎 | 3100 🪙 + 10 💎 |
| How I Met Your Cursor (6 chapters) | 200 🪙 | 1200 🪙 + 8 💎 | 2200 🪙 + 8 💎 |
| Please Don't | | 800 🪙 + 5 💎 | 800 🪙 + 5 💎 |

**Prices** (outfits; coins about ×8, diamonds ×2, so a new player starts with
300 🪙, enough for one cheap item):

| Old | New |
| --- | --- |
| 30 🪙 | 250 🪙 |
| 40 🪙 | 300 🪙 |
| 50 🪙 | 400 🪙 |
| 60 🪙 | 450 🪙 |
| 70 🪙 | 550 🪙 |
| 80 🪙 | 600 🪙 |
| 90 🪙 | 700 🪙 |
| 100 🪙 | 800 🪙 |
| 120 🪙 | 950 🪙 |
| 2 / 3 / 5 💎 | 4 / 6 / 10 💎 |

The balance, with a typical run worth about 50 🪙: a cheap item (250 to 400)
takes 5 to 8 runs, a mid one (450 to 600) about 10, the dearest coin items
(700 to 950, or house items up to 3000) a few evenings, and diamond items real
dedication: the story games give 23 💎 in total and Adventure runs a few each,
while the outfits alone cost 36 💎. A run costs 10 energy in the house's needs;
food that restores that costs about 15 🪙, so playing always comes out ahead.

**Anti-cheat.** A run event carries `{ game, score, extra (coins grabbed), ms
(time played), at }`, never a payout. The server recomputes the payout with
the same function and clamps the inputs: the score (or coins) can't exceed
the game's `rate` per second of play plus half a tier of slack; runs can't
overlap (each run's play time must fit between the end of the previous run and
this one's end, and `at` is capped at the server clock), so all paid play time
fits in real time; one run counts at most 30 minutes and pays at most 400 🪙;
and past 3000 🪙 from runs in a (UTC) day, further runs pay a quarter. Story
rewards are paid once per claim id, and event ids are never applied twice.

**Old saves.** Events queued before this change still work: old `reward`
events pay their old small amounts (a limited number of times each). A guest's
old queue is folded once into a plain wallet under the old prices (so nothing
already bought is re-priced), and still uploaded when they first sign in.

## Adventure games

The Games screen has two shelves: **Story** (How I Met Your Cursor, The Reason,
Please Don't) and **Adventure**, nine short arcade games starring the button
in whatever it's wearing:

| Game | What you do | How a run pays |
| --- | --- | --- |
| Button Run | A 3D lane runner down a giant keyboard, with power-ups (magnet, wings, spring shoes, bubble wrap, incognito, x2) | 1 🪙 per coin grabbed (2 with x2) |
| Flappy Regret | Tap to flap the button through pipes | 25 🪙 per 10 pipes, rising |
| Pop Tantrum | Pop groups of same-colored buttons in 25 taps | 25 🪙 per 1000 points, rising |
| Snack Attack | Catch falling snacks, dodge bombs | 25 🪙 per 25 snacks, rising |
| Copy Me | Repeat the button's growing tune | 25 🪙 per 5 rounds, rising |
| Sky Hop | Bounce up from cloud to cloud | 25 🪙 per 2000 meters, rising |
| Whack-a-Button | Bonk clones, spare the ones holding a heart | 25 🪙 per 20 bonks, rising |
| Run Away | Jump and duck while the button flees the cursor | 25 🪙 per 600 meters, rising |
| Tower of Regret | Drop swinging clones to stack a tower | 25 🪙 per 12 floors, rising |
| Slice Spree | Swipe to slice what flies up, just not the button | 25 🪙 per 30 slices, rising |

Every run pays, by how it went; there is no goal score. See [Economy](#economy).
Best scores are kept on the device.

- `src/adventure/AdventureGame.jsx`: title card, canvas loop, pause, results
  and payouts, shared by all ten (routed from `/games/adventure/[id]`)
- `src/adventure/kit.js`: the 480x800 canvas, the button drawn in its outfit,
  speech bubbles and particles
- `src/adventure/games/<id>.js`: one file per game; `index.js` describes
  what a game has to export

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

- `src/house/` is the button's house (`/house`): the room, its art, the shop and the energy gate
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

Add it to `GAMES` in `src/economy/catalog.js` (id, name, emoji, card color, page, category, reward) and it shows up on its shelf of the Games screen (`/games`). Its card picture comes from `PAINT` in `src/components/gameArt.js` (story games draw a scene with the game's own drawing code; Adventure games list how long to run and where to crop); without one the card shows the emoji. Give it a page under `src/app/games/`, and when the player finishes, call `claimStory('<id>')` from `@/profile/store` (a one-time reward listed in `STORY_REWARDS`) or, for an Adventure game, give it a `payout` and let `AdventureGame.jsx` call `recordRun`.

A quick arcade game is easier: write `src/adventure/games/<id>.js`, list it in
`src/adventure/games/index.js`, and add an `adventure` entry to `GAMES` with its
`howTo`, `goal`, `unit` and `quips`. The page, title card and payout come for free.
