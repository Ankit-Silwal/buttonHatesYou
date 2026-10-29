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

The button lives in three rooms you can decorate: the **Living Room**, the
**Kitchen** and the **Bedroom**. He lives in them in his outfit, breathes,
blinks and pulls faces that match how he feels.

- **Decorate every room.** Each room has a "Decorate" button that opens a
  bottom sheet (`src/house/DecorSheet.jsx`) with Walls / Floors / Furniture.
  Tap an item to preview it in that room, lit and animated, with a "Previewing"
  tag; nothing is charged until you press Buy, then Place it or Take down.
  Every room has its **own** wallpaper, floor and furniture, drawn by the shared
  `Room` component (`src/house/Room.jsx`, `room.css`) with hand-drawn SVG pieces
  (`src/house/art.jsx`). You buy a piece once and can put it in every room it
  fits (`rooms` in the catalog): the kitchen has a counter, stove, coffee
  machine, toaster, fruit bowl, spice shelf, pendant, table with stools and an
  island; the bedroom has a wardrobe, study desk, floor mirror, string lights
  and nightstands; plants, rugs, lamps and posters fit several rooms.
  **Furniture goes anywhere.** While a room's Decorate sheet is open its pieces
  can be dragged around the room with mouse, touch or pen (arrow keys move the
  focused one, Delete takes it out); the selected piece gets a dashed outline and
  a small × to take it out. Each kind of piece stays in its band: ceiling pieces
  hang from the top, wall pieces stay on the wall, counter pieces on the
  kitchen counter, floor pieces and rugs on the floor. Up to **10 pieces per
  room** (the Furniture tab shows `7/10`); a new piece drops at a free spot.
  Pieces further forward are drawn in front, and far enough forward they stand
  in front of the button. The bedroom's bed and bedside lamp keep their fixed
  spots (the lamp is how he goes to sleep).
  `/house` is the full-screen version of the same sheet, with a tab per room.
- **Feed him.** In the Kitchen the fridge holds silly button food: a browser
  cookie, a USB stick sandwich, an AA battery smoothie, hot glue hot dogs… Each
  restores hunger and/or energy and some have side effects (hiccups, a sugar
  rush, a glow, a glitch). Food is **stock**: the Buy food sheet (a grid of the
  whole menu) buys one dish into the fridge (`stock` event, cap 99); the strip in
  the Kitchen shows only what he owns, and tapping one feeds it (free, from the
  pantry). Chest snacks land in the same strip.
- **Needs.** Hunger and energy run 0–100 and drift down with real time, even
  while the app is closed, but time alone never drags them below 15.
- **Sleep.** The Bedroom is a dim room with his bedside lamp on. Tap the lamp
  (a real button, "Turn off the lamp") and the room fades to dark, the moon
  shines through the window, he climbs into bed and Zzz float up. Energy refills
  over about 2 hours and he wakes on his own when it is full; tap the lamp again
  to switch it on and wake him for free. Whether the lamp is on is derived from
  his real state, so a reload mid-sleep shows the dark room. Everyone has a free
  old mattress and a free bedside lamp: the bed and the lamp can be swapped for
  better ones but never taken down, so he can always sleep.
- **Energy gates games.** An Adventure run costs 2 energy (a full bar is about 2 hours of play), a story
  episode/chapter or Please Don't costs 5. Too tired or asleep, and he refuses
  with a link home. Food is cheap and naps are free, so nobody is stuck.

Code: the catalog, rooms (`ROOMS`: their spots and required pieces) and foods are
in `src/economy/house.js`, the needs math in `src/economy/needs.js`, and the
wallet events (`decor`, `place`, `unplace`, `feed`, `sleep`, `wake`, `play`) in
`applyHouseEvent` in `src/economy/rules.js`. `room` is `living` (the default, so
events queued before the other rooms still work), `kitchen` or `bedroom`.
A room is `{ wall, floor, place, items }`: the living room is `wallet.house`,
the others `wallet.rooms.kitchen / bedroom`. `place` holds only the fixed spots
(`bed`, `nightstand`); every other piece is in `items: [{ item, x, y }]`, with x
and y in percent of the piece's band (its band comes from the spots it lists in
the catalog, see `bandOf` in `house.js`; `Pieces.jsx` / `pieces.css` draw the
bands for each room).
- `{ type: 'decor', spot, item, room? }` puts up a wallpaper (`spot: 'wall'`), a
  floor (`'floor'`), or swaps the bed / bedside lamp (never taken down).
- `{ type: 'place', item, x, y, room? }` puts an owned piece in the room or moves
  it: the piece must fit the room, x and y must be finite numbers (clamped to
  0-100, 1 decimal), one of each piece per room, at most `MAX_PIECES` (10).
- `{ type: 'unplace', item, room? }` takes it out.
While offline only a piece's last move is queued (one event per drop, never
per pointer move; `samePiece` in `src/profile/store.js`). Wallets saved when
furniture sat in named spots are migrated by `normalize()`: each piece moves to
where its spot was (`SPOT_AT`), and an old queued `decor` event for such a spot
still replays (it lands there, or takes down what still sits exactly there).
Wallets saved without `rooms` get defaults, and an old house bed moves to the
bedroom. The server
validates purchases and needs exactly like outfits. Needs events carry the time
they happened; the server never accepts one later than its own clock or earlier
than the previous one. `src/profile/needs.js` has the `useNeeds()` hook, and
`src/house/EnergyGate.jsx` the `useEnergyGate(kind)` hook every game calls when
it starts. Profiles saved before the house existed get defaults
(`normalize()` in rules.js).

## The look (matches the Android app)

The home screen's UI layer follows the Android app (`button-hates-you-android`,
its own repo): one coins-over-diamonds chip and a three-bar needs chip on the
left of the top bar, square Achievements and Daily chest chips on the right
(`compact` props on `Wallet`, `EnergyChip` and `HubPerks`), a light dock with
a soft indicator behind the active room, and flat buttons (Play and plain
pills filled, the rest neutral). Styles are in `src/hub/flat.css`. Icons are
drawn, not emoji: `src/components/Icon.jsx` (dock, buttons, chips) and
`src/components/GameIcon.jsx` (each game's line icon on its own colour, used
on the title cards). The **Games** panel is one grid of tiles; the star on a
tile pins it to a Favorites row (kept in this browser, `bhy.favorites`).

## The home screen: five panels

Swipe (or use the dock at the bottom, or the left/right arrow keys) between
**Games**, the **Living Room** (home, where he starts), the **Kitchen**, the
**Bedroom** and the **Bathroom**.

- **Games** has every mini-game and says what is stopping him from playing.
- **Living Room** is the hand-drawn room (window on the real sky, clock, shelf,
  sofa, plant, lamp) with the button on the floor, his speech bubble above and a
  row of pills (Play slides to Games, Wardrobe, Story, Decorate) at the bottom.
- **Kitchen, Bedroom and Bathroom** use the same chassis (`src/hub/RoomScene.jsx`,
  `scene.css`, props in `scene-art.jsx`): wall with wainscot, window, floor in
  perspective, shaft of light, dust, night tint from the real time. Each room
  fits the screen with no scrolling (sizes come from container units).
  What you decorated shows on top: wallpapers and floors repaint the chassis
  (reusing `room.css`), furniture is drawn where it was placed and hides the default
  prop it stands on; the Decorate sheet previews live, and while it is open the
  furniture can be dragged around the room.
- **Kitchen**: counter with sink, fridge, stove and hood, table. The food he owns
  is a sliding strip; **Buy food** opens the menu grid sheet.
- **Bedroom**: the bed and bedside lamp (the sleep switch). Lights out and the
  room goes dark. **Wake-up options** (a sheet, only while asleep): Cold Water
  Splash, Alarm Clock, Espresso Shot, Marching Band (`WAKE_OPTIONS` in
  `src/economy/house.js`); the server checks the price like any purchase. If he
  is filthy the lamp refuses and a Bathroom pill appears. Energy is a small HUD.
- **Bathroom**: drag the soap over him, then drag him into the shower stall
  (Scrub / shower pills are the keyboard fallback).

**Routing.** A fresh visit to `/` always opens the Living Room. `/games` renders
the same `Hub` with `initial="games"`. Play and the dock only slide the pager.
Coming back with the browser Back button restores the panel he left (kept in
`sessionStorage` key `bhy.pane`; `Hub.jsx` detects a Back via `popstate` or the
`back_forward` navigation type).
- **He needs both to play.** A game needs the energy *and* hunger of at least
  20 (`PLAY_MIN_HUNGER`). Hungry (under 25) makes him look bored; under 40
  energy gives him dark circles.

## Energy boosts, potions and free food

- **Energy boosts work awake too.** The Bedroom's Wake-up options (Cold Water
  Splash, Alarm Clock, Espresso Shot, Marching Band) become **Energy boosts**
  while he's awake: same price, same energy, no nap needed. Asleep, they
  still wake him. It's the same `wake` event with an `item`; the rules just
  no longer require him to be asleep.
- **Potions** (`POTIONS` in `src/economy/house.js`, the 🧪 Potions pill in the
  Kitchen and Bedroom) are bought and drunk on the spot and fill a need
  right up: Bottomless Tummy Tonic (hunger, 200 🪙), Bottled Nap (energy,
  250 🪙) and the Fill Everything Elixir (hunger, energy and clean, 2 💎).
  Potions are kept like food: buying one (`{ type: 'stockpotion', item }`)
  puts it on the shelf in the Kitchen and the Bedroom, and drinking uses the
  stash first. When he's exhausted the Bedroom offers bed or a potion; while
  he's asleep it offers to wake him with one (opening the shop on Bottled Nap
  if there's none).
  Three nasty ones do the opposite and cost more: Instant Munchies (hunger
  to 10, 900 🪙), Liquid Yawn (energy to 10, 1000 🪙) and Mud Smoothie
  (dirt to 90, 900 🪙), handy when a level wants him fed, napped or washed.
  Liquid Shower (clean) is retired: the bathroom has its shower. Event:
  `{ type: 'potion', item, at }`; drinking one wakes him.
- **Free food when broke.** If you can't afford any food and the fridge is
  empty, the cheapest food (`FREE_FOOD`, the Browser Cookie) is free: he
  first makes you tap "I'm poor", then it shows in the Kitchen strip with
  a Free tag. The server checks `isBroke`
  too, so it's only free while you really are broke.

## Getting dirty, and the Bathroom

A third need, **dirt**, creeps up with time (slowly) and with every game he
plays (`PLAY_DIRT`: Adventure 6, a story 8). Past `DIRTY_AT` (40) he looks
grubby; past `FILTHY_AT` (75) flies circle him, and **he refuses to go to bed**
until he is washed (the server enforces it too, in `rules.js`).

The fifth room, the **Bathroom**: drag the soap over him to scrub (or press
Enter on the soap), and once he is lathered drag him into the shower (or press
"Turn on the shower"). The rinse records a `wash` event and resets his dirt. A
small 🫧 bar on the home screen shows how clean he is.

## Undressing for a bath

In the Bathroom he won't be scrubbed with clothes on: drag him to the
clothes stand and he takes them off ("Don't look at me!", hands over
himself, blushing). After the shower, drag him back to the stand to put
them on again. Until then he wears nothing anywhere (rooms, games,
profile) and the wardrobe can't dress him. This is only how he looks:
`src/profile/undress.js` keeps it on the device, and what he owns and has
equipped doesn't change.

## Teen look and wardrobe

The button's art got a more grown-up finish (relaxed eyes, thin brows, a subtler
sheen) and the wardrobe a **Clothes** slot (tee, hoodie, track, denim, varsity,
blazer, leather, puffer), plus new muted colours, glasses/aviators/visor,
earbuds and headphones, a lanyard/bandana/gold chain, and caps, bucket hats,
berets and headbands. The house has matching teen furniture (gaming desk and
chair, guitar, record player, LED strips, photo wall, skate decks...) and
loft/studio/graffiti walls. Items live in `src/economy/catalog.js` and
`src/economy/house.js`; the CSS avatar is `src/app/avatar.css`, the in-game
canvas one `src/adventure/kit.js`.

## Retired games

The arcade matches the Android app: Snack Attack, Freeze!, Inbox Zero, Shaken
Not Stirred, Cursor Pong and Wobble Walk were taken out (and their source).
Their catalog entries stay, marked `retired` (`RETIRED` in
`src/economy/catalog.js`), so runs already in a wallet's history still replay,
and the Stress Eater achievement stays hidden for the same reason. They are
not listed and their pages 404. `PLAYABLE` is the list of games you can play.

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

Coins (🪙) come from playing (and from [levels](#levels)); diamonds (💎)
come from [achievements](#achievements-and-the-daily-chest), every 5th level
and, rarely, the daily chest. All numbers live in
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
| Copy Me | 5 rounds | 8 → 55 | 15 → 150 |
| Sky Hop | 2000 m | 3000 → 50 | 6000 → 150 |
| Whack-a-Button | 20 bonks | 30 → 50 | 60 → 150 |
| Run Away | 600 m | 1000 → 58 | 1800 → 150 |
| Tower of Regret | 12 floors | 20 → 58 | 36 → 150 |
| Slice Spree | 30 slices | 50 → 58 | 90 → 150 |

Button Run instead pays exactly the coins the button picked up (the counter in
the corner; x2 coins count double), typically 30 to 100 a run.

Runs pay coins only. (They used to pay 1 💎 for a game's first 100+ run and
for big personal bests; that value now lives in each game's "score N"
achievement.)

**Story games pay big, once.** The first finish of each part pays, and the
wallet remembers it (`claimed`), so replays (or wiping a story save) pay
nothing, on the server too:

| Story | Each part | Finale | Total |
| --- | --- | --- | --- |
| The Reason (9 episodes) | 200 🪙 | 1500 🪙 | 3100 🪙 |
| How I Met Your Cursor (6 chapters) | 200 🪙 | 1200 🪙 | 2200 🪙 |
| Please Don't | | ??? (nothing: the prize is a mystery) | — |

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
dedication: achievements pay 163 💎 in all (the story finales' diamonds moved
there), while the diamond outfits cost 36 💎 and the diamond house items 42.
The rest goes on continues in Adventure (1, 2, then 3 💎 per crash in a run)
and the odd Floppy Disk Waffle. A run costs 2 energy in the house's needs;
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
A continued run (see [Adventure games](#adventure-games)) is still one run
event: its `ms` is the play time of all its segments, so it fits these caps
like any other; the `continue` events only spend diamonds (1, 2, 3; refused
past the 3rd or without the diamonds).

**Old saves.** Events queued before this change still work: old `reward`
events pay their old small amounts (a limited number of times each). A guest's
old queue is folded once into a plain wallet under the old prices (so nothing
already bought is re-priced), and still uploaded when they first sign in.
Diamonds already earned the old way are kept.

## Achievements and the daily chest

40 achievements. Most have five medals: Bronze, Silver and Gold, then
Platinum and Diamond far beyond (x4 and x15 of Gold); the stories keep
three. New ones count baths, stocked food, energy boosts, free wake-ups,
outfit changes, furniture moves, potions, coin chests, Continues, levels,
hard quests, things owned, medals and wallpaper changes (`countUses` in
rules.js). Three Legendary ones have a single medal and pay one coin: play
on 1,000 days, use a code, and finish every other achievement. Daily comes
first on the page.

**Achievements** (`/achievements`, the 🏆 on the home screen, whose badge
counts the levels ready to claim) are the only steady source of diamonds.
Each has three medals, Bronze, Silver and Gold, claimed by hand and in order
with a Claim button. The table lives in `src/economy/achievements.js`:

| Achievement | Goal | Bronze | Silver | Gold |
| --- | --- | --- | --- | --- |
| Pipe Dreams | pipes in Flappy Regret | 10 · 1 💎 | 20 · 2 💎 | 40 · 3 💎 |
| Family Feud | points in Pop Tantrum | 1000 · 1 | 2000 · 2 | 4000 · 3 |
| Elephant Brain | rounds in Copy Me | 5 · 1 | 10 · 2 | 20 · 3 |
| Social Distancing | meters in Sky Hop | 2000 · 1 | 4000 · 2 | 8000 · 3 |
| Anger Management | bonks in Whack-a-Button | 20 · 1 | 40 · 2 | 80 · 3 |
| Restraining Order | meters in Run Away | 600 · 1 | 1200 · 2 | 2400 · 3 |
| Back Problems | floors in Tower of Regret | 12 · 1 | 24 · 2 | 48 · 3 |
| Knife to Meet You | slices in Slice Spree | 30 · 1 | 60 · 2 | 120 · 3 |
| Coin Goblin | coins grabbed in one Button Run | 50 · 1 | 100 · 2 | 200 · 3 |
| Professional Loser | Adventure runs finished | 10 · 1 | 50 · 3 | 200 · 6 |
| Capitalism Enjoyer | 🪙 earned from runs | 1000 · 1 | 10000 · 3 | 50000 · 6 |
| Emotional Damage | episodes of The Reason | 1 · 1 | 5 · 3 | 9 · 8 |
| Hopeless Romantic | chapters of How I Met Your Cursor | 1 · 1 | 3 · 3 | 6 · 6 |
| Bookworm | story parts in all | 3 · 1 | 8 · 2 | 15 · 4 |
| Drip Check | outfit items owned | 1 · 1 | 6 · 2 | 15 · 4 |
| Interior Disaster | furniture owned | 3 · 1 | 8 · 2 | 15 · 4 |
| Feng Shui Crimes | wallpapers and floors owned | 1 · 1 | 4 · 2 | 8 · 4 |
| Feeding Frenzy | snacks fed | 10 · 1 | 50 · 2 | 200 · 4 |
| Nap Champion | naps | 3 · 1 | 15 · 2 | 50 · 4 |
| Can't Stay Away | different days played | 3 · 1 | 10 · 3 | 30 · 6 |
| Treasure Goblin | daily chests opened | 5 · 1 | 25 · 2 | 100 · 4 |
| Streak Freak | chest streak (days in a row) | 3 · 1 | 7 · 2 | 30 · 5 |

That is 22 achievements, 66 medals and 163 💎. Score medals sit at one, two
and four of the game's pay tiers, so a new player's first decent run (10
pipes, say) is already a Bronze, and ten runs another. Please Don't has no
achievement: it pays nothing, on purpose.

**Stats the server can check.** Achievements look at `statsOf(wallet)`, built
only from what the shared `applyEvent` has already accepted: `wallet.stats`
(per-game best score as `applyRun` clamped it, runs, coins paid by runs, snacks
eaten, naps, distinct UTC days with a timed event, chests and streaks) plus
what the wallet already proves (story parts in `claimed`, items in `owned`).
Wallets from before stats start counting from zero, except best scores, which
start at the lowest score that pays the game's remembered best payout. A
continued Adventure run is still one `run` event, with its final score.

**Claiming** is an `{ type: 'achieve', ach, level }` event (`ach` is the
achievement id; `id` is the event's own id). It is accepted only for the next
unclaimed level (`wallet.achieved[ach] + 1`) and only once that level's stat is
there; then it pays that level's diamonds. The server replays it with the same
function, so a claim the browser made up is just dropped. After a run or a
story part makes a level claimable, its results card says "Achievement ready!".

**The daily chest** (🎁 on the home screen and the top of the achievements
page) opens once per UTC day with an `{ type: 'chest', at }` event. Its loot
comes from `chestLoot(wallet.seed, day, streak)` in `src/economy/chest.js`, a
seeded generator: the seed is made from the account id on the server (a guest
gets a random one), and no event can change it, so the browser can show the
loot right away and can't choose it. A chest holds 50 to 150 🪙, a 40% chance
of a free snack (kept in `wallet.pantry`; the house eats free snacks before
paying for one), a 25% chance of full energy, and a 4% chance of 1 💎. Every
7th day of a streak is a big chest: 300 to 500 🪙, a Floppy Disk Waffle, full
energy and 1 💎. The day is the event's `at`, capped at the server clock; it
must be later than the last chest's day and at most 7 days old (so a chest
opened offline still counts, but nobody can backdate a year of them). Days
played use the same 7-day limit.

**The coin chest** (the "Can't wait? Buy one." row at the bottom of the
daily chest) costs 500 🪙 and is a `{ type: 'buychest', at }` event. It takes
5 taps to open, and each tap may bump it up one rarity (6.9% from common,
14.5% from rare, 12% from epic), which comes out at about 70% common, 22%
rare, 7% epic and 1% legendary. Common holds 250 to 350 🪙 (40% a snack),
rare 450 to 600 🪙 (50% a snack, 15% 1 💎), epic 900 to 1200 🪙, 1 💎 and a
Floppy Disk Waffle, and legendary 500 🪙, 3 💎 and a piece of furniture you
don't own priced 2000 🪙 or more (or 3000 🪙 and 5 💎 once you own them all).
On average that's about 473 🪙 of stuff (a 💎 counted as 150 🪙): a little
under the price, so it's a treat, not a money printer, and about 0.13 💎 a
chest. Everything, tap by tap, comes from `boughtChest(seed, n, owned)` in
`src/economy/chest.js`, with `n` the wallet's `stats.boughtChests`, so the
server pays the same chest; `node scripts/check-economy.mjs` checks the odds
and the average.

## Levels

There are 200 levels (`src/economy/levels.js`). The level chip in the top bar
(`src/levels/LevelChip.jsx`, the level number in a ring of its three missions,
with a "!" when it's ready) opens the level sheet (`LevelSheet.jsx`): three
mission cards, each with a Go button, the reward, a Level up button and the
next few unlocks.

Every level has three missions, all worked out from the level number:

1. **Play**: reach a score in one run of an Adventure game. The game rotates
   through the nine Adventure games, and the target goes from 0.4 of a pay tier
   at level 1 (4 Flappy pipes) up to 3 tiers at level 200 (30 pipes). Button
   Run counts coins grabbed, 50 to a "tier". Only runs played during the level
   count (`lv.best`, the score as `applyRun` clamped it).
2. **Buy**: own a particular item. The items are the coin-priced outfits and
   house items, cheapest first, with outfits and house items taking turns, so
   prices go up level by level. If you already own it, that counts. Every 4th
   level asks you to stock N foods for the fridge instead (3 + level/25,
   counted by `stats.stocked`).
3. **Care**: feed him, put him to bed, or wash him. These rotate, and the
   number goes up by one every 30 levels (feeding counts double).

**Level up** is an `{ type: 'levelup', level }` event, claimed by hand. It
only works for the current level (cleared + 1) and only once all three
missions are done. It pays coins worth about half of the next level's buy
mission. For levels 1 to 3 that's exactly half, rounded down, so it's never
enough on its own. The share drops to a quarter by level 200, and level 200
pays 5000. Every 5th level also pays diamonds: 1 + level/50. The next level
then starts counting from that moment (`lv.at`).

The wallet keeps `lv = { n, at, best }`. A wallet saved before levels gets
`n: 0` and its counters as they are now, the first time any event is applied,
so the browser and the server agree.

**Unlocks:**

| After level | Unlocks |
| --- | --- |
| 1 | Please Don't |
| 50 | How I Met Your Cursor |
| 59 / 89 / 129 | Jukebox / Robot Chef / Galaxy Projector go on sale (the buy missions of levels 60, 90 and 130) |
| 100 | The Reason |
| 194 to 199 | Cursor's Collection (Pointer Rug, Pointer Pendant, Loading Hourglass, Pointer Neon, Golden Cursor, Cursor's Wallpaper: the buy missions of levels 195 to 200, 6000 to 10000 🪙) |

Locked story games show a padlock on their Games tile, and their page shows a
locked card. The rules also refuse a story reward for a story that's still
locked. If you've already claimed part of a story, you keep it. Items with a
`level` can't be bought before that level, and the shops show them with a
padlock.

**Characters** are the outfit slot `char` (the wardrobe's Character tab). Bobby
is the default. The others join you in the stories, not by level: each has an
`unlock.claim`, the story part where you meet or beat them, and you own them
once that part is finished (played, not skipped):

| Character | Finish |
| --- | --- |
| Tabby | How I Met Your Cursor, chapter 1 (he joins the gang) |
| Karen Popup | chapter 3 (beaten at the restaurant) |
| Lord 404 | chapter 4 (beaten in the Glitchy Forest) |
| Bella | chapter 5 (Operation: Marry Bella) |
| Cursor | all six chapters |
| Old Backspace | The Reason, episode 4 (The Forgotten Kingdom) |

The part's results card says who joined. Each one sets `data-char` on the avatar
(`src/app/avatar-chars.css`) and brings its own colours (the Color slot only
paints Bobby). In the canvas games they show up as their colour.

**Moving furniture** (`src/house/art-moving.jsx`, `moving.css`) keeps moving
on its own. There's one coin piece per room, locked behind a level: Jukebox
(living room, 9000 🪙), Robot Chef (kitchen, 10500 🪙) and Galaxy Projector
(bedroom, 12000 🪙). There's also one diamond piece per room: Roaring Fireplace
280 💎, Popcorn Machine 200 💎 and Pet Raincloud 240 💎. A year of play brings in
about 330 💎 in all.

**Balance** (`node scripts/check-economy.mjs` walks the 200 levels). A typical
player plays 18 decent runs a day plus the daily chest, about 1080 🪙 a day:
level 10 within the first day, 50 in about 8 days, 100 in about a month, and
200 in about 4.5 months. A casual player (8 runs a day) takes about 16 days to
reach 50 and 9 months to reach 200. Even someone at the daily run cap needs
about 7 weeks.

## Codes

Profile → Settings → Codes. `CODES` in `src/economy/codes.js`; each works
once per wallet, as an event `{ type: 'code', code }` the server replays like
any other (case and spaces don't matter). `DSAISUSELESS` gives 9,999,999
coins and diamonds, clears every level and finishes every story part (so
every character joins you). (It replaced `ISUCKATCODING`,
which is retired: refused when typed, still replayed for wallets that used
it, and the two pay once between them.) The table ships to the browser,
so anyone reading the source can find the codes. `COMMON`, `RARE`, `EPIC` and
`LEGENDARY` each give a free chest of that rarity (`forcedChest` in
`src/economy/chest.js`), opened with the usual five taps.

## Adventure games

The Games screen has two shelves: **Story** (How I Met Your Cursor, The Reason,
Please Don't) and **Adventure**, nine short arcade games starring the button
in whatever it's wearing:

| Game | What you do | How a run pays |
| --- | --- | --- |
| Button Run | A 3D lane runner down a giant keyboard, with power-ups (magnet, wings, spring shoes, bubble wrap, incognito, x2) | 1 🪙 per coin grabbed (2 with x2) |
| Flappy Regret | Tap to flap the button through pipes | 25 🪙 per 10 pipes, rising |
| Pop Tantrum | Pop groups of same-colored buttons in 25 taps | 25 🪙 per 1000 points, rising |
| Copy Me | Repeat the button's growing tune | 25 🪙 per 5 rounds, rising |
| Sky Hop | Bounce up from cloud to cloud | 25 🪙 per 2000 meters, rising |
| Whack-a-Button | Bonk clones, spare the ones holding a heart | 25 🪙 per 20 bonks, rising |
| Run Away | Jump and duck while the button flees the cursor | 25 🪙 per 600 meters, rising |
| Tower of Regret | Drop swinging clones to stack a tower | 25 🪙 per 12 floors, rising |
| Slice Spree | Swipe to slice what flies up, just not the button | 25 🪙 per 30 slices, rising |

Every run pays, by how it went; there is no goal score. See [Economy](#economy).
Best scores are kept on the device.

**Continue with diamonds.** When a run ends, a "Continue?" card shows over
the frozen game for 5 seconds: pay 1 💎 to carry on from the crash with the
same score, then 2 💎, then 3 💎; a run gets at most 3 continues, and the 4th
crash goes straight to the results. Space/Enter continues, Esc or "No thanks"
(or the timer) declines. Without enough diamonds the button is disabled and
points to Achievements. Each game's `revive()` (see `games/index.js`) puts it
back in a fair state: Flappy clears the nearby pipes and hovers until the next
tap; Pop adds 10 taps;
Copy Me replays the same tune; Sky Hop drops a wide rescue cloud; Whack adds
15 s (the pace keeps rising); Run Away and Button Run clear the track ahead,
stand the button back up and ease the speed back in; Tower of Regret drops the
missed clone and widens the top floor; Slice Spree gives a life back and
clears the air. Most add about 2 s of blinking invulnerability. Paying is a
`{ type: 'continue', game, n, at }` wallet event (`applyContinueEvent` in
`rules.js`), checked on the server like a purchase; the run event at the end
pays by the final score, with `ms` covering all its segments and
`continues` saying how many it used, so the usual caps still hold.

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

- `src/house/` is the button's house: the `Room` renderer and its art, the decorating sheet (`DecorSheet.jsx`), the `/house` editor and the energy gate
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
