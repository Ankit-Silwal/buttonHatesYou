// The button's needs: hunger and energy, 0-100 (100 = full), and dirt,
// 0-100 (100 = filthy; it only goes up with time and games, and a wash resets it).
// Shared by the browser and the server. Needs are stored as the values at
// one moment (`at`, a ms timestamp) and everything after that is computed
// from the clock, so they also drift while the app is closed. Both sides run
// the same math on the same timestamps, so they always agree.

export const NEEDS = {
  hungerPerHour: 4, // awake: about a day from full to empty
  energyPerHour: 3, // awake, doing nothing
  sleepHungerFactor: 0.5, // asleep, he gets hungry at half speed
  sleepEnergyPerHour: 50, // asleep: empty to full in 2 hours
  floor: 15, // time alone never drags a need below this
  dirtPerHour: 1.5, // awake, just living
  sleepDirtFactor: 0.3, // asleep, he hardly gets dirtier
};

// What each kind of game costs to start.
// A full bar is about 2 hours of play (a run takes a minute or two), and 2 hours
// of sleep fills it again.
export const PLAY_COST = { adventure: 2, story: 5 };
// ...and how much dirt it kicks up.
export const PLAY_DIRT = { adventure: 1.5, story: 3 };
// From here he looks grubby, and from FILTHY_AT he refuses to go to bed.
export const DIRTY_AT = 40;
export const FILTHY_AT = 75;
// Playing also takes a full-enough tummy: below this he is too hungry to play.
export const PLAY_MIN_HUNGER = 20;

export const DEFAULT_NEEDS = Object.freeze({ hunger: 80, energy: 80, dirt: 0, asleep: false, at: 0 });

const H = 3_600_000;
const clamp = (v) => Math.min(100, Math.max(0, v));
const round = (v) => Math.round(v * 100) / 100;
// Decay stops at the floor, and never pulls up something already below it.
const decay = (v, by) => (v <= NEEDS.floor ? v : Math.max(NEEDS.floor, v - by));

export function normalizeNeeds(n) {
  const num = (v, d) => (Number.isFinite(v) ? clamp(v) : d);
  return {
    hunger: num(n?.hunger, DEFAULT_NEEDS.hunger),
    energy: num(n?.energy, DEFAULT_NEEDS.energy),
    dirt: num(n?.dirt, 0),
    asleep: n?.asleep === true,
    at: Number.isFinite(n?.at) && n.at > 0 ? n.at : 0,
  };
}

// The needs as they are at time `t`. `at: 0` means the clock hasn't started
// (a brand new player): nothing has drifted yet.
export function needsAt(n, t) {
  if (!n.at || !(t > n.at)) return n;
  let { hunger, energy, asleep } = n;
  let dirt = n.dirt ?? 0;
  let from = n.at;
  if (asleep) {
    // He wakes up on his own the moment energy is full.
    const full = from + ((100 - energy) / NEEDS.sleepEnergyPerHour) * H;
    const until = Math.min(t, full);
    const h = (until - from) / H;
    hunger = decay(hunger, NEEDS.hungerPerHour * NEEDS.sleepHungerFactor * h);
    dirt = Math.min(100, dirt + NEEDS.dirtPerHour * NEEDS.sleepDirtFactor * h);
    energy = Math.min(100, energy + NEEDS.sleepEnergyPerHour * h);
    from = until;
    if (until >= full) {
      asleep = false;
      energy = 100;
    }
  }
  if (!asleep && t > from) {
    const h = (t - from) / H;
    hunger = decay(hunger, NEEDS.hungerPerHour * h);
    energy = decay(energy, NEEDS.energyPerHour * h);
    dirt = Math.min(100, dirt + NEEDS.dirtPerHour * h);
  }
  return { hunger: round(hunger), energy: round(energy), dirt: round(dirt), asleep, at: t };
}

// When the next wake-up happens, for a sleeping button.
export const wakesAt = (n) => (n.asleep ? n.at + ((100 - n.energy) / NEEDS.sleepEnergyPerHour) * H : null);

// Tired eyes show from here down (dark circles under them).
export const SLEEPY_BELOW = 40;

// How the button feels, for its face and its lines.
export function moodOf(n) {
  if (n.asleep) return 'sleep';
  if (n.hunger < 25 && n.energy < 25) return 'sad';
  if (n.hunger < 25) return 'hungry';
  if (n.energy < 25) return 'tired';
  if (n.hunger > 70 && n.energy > 70) return 'smug';
  return 'calm';
}
