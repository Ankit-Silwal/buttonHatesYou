import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { geo, mesh } from './assets';

// The button in 3D: a fat push-button on two little legs, with stubby arms,
// wearing the outfit from the shop. Its face is on the front (-z, the way it
// runs), so from the chase camera you mostly see its back, until it glances
// round at you. The feet are at the group's origin.
const INK = '#3a2620';
const SCARVES = { red: '#d8433a', sage: '#8fb08a', striped: '#efe6d2', rainbow: '#f39ac0' };

const sphere = (r, w = 20, h = 14) => geo(`sphere:${r}:${w}`, () => new THREE.SphereGeometry(r, w, h));
const box = (w, h, d, r = 0) => geo(`rbox:${w}:${h}:${d}:${r}`, () => (r ? new RoundedBoxGeometry(w, h, d, 4, r) : new THREE.BoxGeometry(w, h, d)));
const cyl = (rt, rb, h, n = 20, open = false) => geo(`cyl:${rt}:${rb}:${h}:${n}:${open}`, () => new THREE.CylinderGeometry(rt, rb, h, n, 1, open));
const cone = (r, h, n = 16) => geo(`cone:${r}:${h}`, () => new THREE.ConeGeometry(r, h, n));
const capsule = (r, l) => geo(`capsule:${r}:${l}`, () => new THREE.CapsuleGeometry(r, l, 6, 12));
const torus = (r, t, arc = Math.PI * 2) => geo(`torus:${r}:${t}:${arc}`, () => new THREE.TorusGeometry(r, t, 10, 28, arc));

export function buildButton(look) {
  const mats = [];
  const m = (color, o = {}) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
    mats.push(material);
    return material;
  };
  const skin = new THREE.MeshPhysicalMaterial({ color: look.color, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 });
  mats.push(skin);
  const dark = m(look.dark, { roughness: 0.45 });
  const ink = m(INK, { roughness: 0.7 });
  const white = m('#ffffff', { roughness: 0.15 });
  const black = m('#16141c', { roughness: 0.25 });
  const pink = m('#ff8fa8', { roughness: 0.6, transparent: true, opacity: 0.7 });

  const root = new THREE.Group(); // feet on the ground
  const tilt = new THREE.Group(); // leaning into turns, tumbling on a crash
  const turn = new THREE.Group(); // glancing back over its shoulder
  const body = new THREE.Group(); // squash and stretch, bobbing
  root.add(tilt);
  tilt.add(turn);
  turn.add(body);
  tilt.position.y = 0.5;
  turn.position.y = -0.5;

  const add = (parent, geometry, material, x = 0, y = 0, z = 0) => {
    const part = mesh(geometry, material);
    part.position.set(x, y, z);
    parent.add(part);
    return part;
  };

  // the body: a darker rim under a shiny round cap
  add(body, box(0.94, 0.5, 0.76, 0.2), dark, 0, 0.47, 0);
  add(body, box(0.9, 0.64, 0.72, 0.25), skin, 0, 0.7, 0);
  // a power symbol on its back, so the back isn't plain
  const power = add(body, torus(0.11, 0.025, Math.PI * 1.6), dark, 0, 0.7, 0.365);
  power.rotation.z = Math.PI / 2 + Math.PI * 0.2;
  add(body, box(0.05, 0.15, 0.03), dark, 0, 0.79, 0.37);

  // the face
  const face = new THREE.Group();
  face.position.set(0, 0, -0.36);
  body.add(face);
  const eyes = [];
  const pupils = [];
  const brows = [];
  for (const side of [-1, 1]) {
    const eye = add(face, sphere(0.115), white, side * 0.17, 0.75, 0);
    eye.scale.set(1, 1.15, 0.45);
    eyes.push(eye);
    const pupil = add(face, sphere(0.06), look.eyes === 'hearts' ? m('#ff4f7b') : look.eyes === 'stars' ? m('#ffd84d', { emissive: '#7a5a00' }) : black, side * 0.17, 0.73, -0.045);
    pupil.scale.set(1, 1, 0.5);
    pupils.push(pupil);
    const brow = add(face, box(0.19, 0.045, 0.04), ink, side * 0.17, 0.91, -0.01);
    brows.push(brow);
  }
  if (look.eyes === 'googly') for (const e of eyes) e.scale.multiplyScalar(1.3);
  if (look.eyes === 'sleepy') {
    for (const side of [-1, 1]) {
      const lid = add(face, geo('lid', () => new THREE.SphereGeometry(0.125, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)), skin, side * 0.17, 0.75, 0);
      lid.scale.set(1, 1.15, 0.5);
    }
  }
  if (look.eyes === 'shades') {
    for (const side of [-1, 1]) add(face, box(0.24, 0.15, 0.04, 0.03), black, side * 0.17, 0.76, -0.07);
    add(face, box(0.12, 0.03, 0.03), black, 0, 0.79, -0.07);
  }
  if (look.eyes === 'chill') {
    for (const side of [-1, 1]) {
      const lid = add(face, geo('lid', () => new THREE.SphereGeometry(0.125, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)), skin, side * 0.17, 0.745, 0);
      lid.scale.set(1, 1.15, 0.5);
    }
  }
  if (look.eyes === 'glasses') {
    const wire = m('#3b3a45', { metalness: 0.6, roughness: 0.3 });
    for (const side of [-1, 1]) add(face, torus(0.14, 0.014), wire, side * 0.17, 0.75, -0.07);
    add(face, box(0.08, 0.016, 0.016), wire, 0, 0.79, -0.07);
  }
  if (look.eyes === 'aviators') {
    const gold = m('#d9b24f', { metalness: 0.8, roughness: 0.25 });
    const lens = m('#18161e', { roughness: 0.15 });
    for (const side of [-1, 1]) {
      const l = add(face, sphere(0.15), lens, side * 0.18, 0.74, -0.07);
      l.scale.set(1.05, 1.1, 0.12);
      add(face, torus(0.155, 0.012), gold, side * 0.18, 0.74, -0.075).scale.set(1.05, 1.1, 1);
    }
    add(face, box(0.1, 0.016, 0.016), gold, 0, 0.82, -0.075);
  }
  if (look.eyes === 'visor') {
    add(face, box(0.68, 0.15, 0.06, 0.04), black, 0, 0.76, -0.07);
    add(face, box(0.29, 0.07, 0.02), m('#46e6ff', { emissive: '#46e6ff', emissiveIntensity: 1.2 }), -0.15, 0.76, -0.105);
    add(face, box(0.29, 0.07, 0.02), m('#ff4fd0', { emissive: '#ff4fd0', emissiveIntensity: 1.2 }), 0.15, 0.76, -0.105);
  }
  const mouths = {
    flat: add(face, box(0.16, 0.035, 0.03), ink, 0, 0.58, -0.01),
    open: add(face, sphere(0.075), black, 0, 0.57, 0),
    frown: add(face, torus(0.07, 0.02, Math.PI), ink, 0, 0.53, -0.01),
  };
  mouths.open.scale.set(1.1, 1, 0.4);
  const tears = [-1, 1].map((side) => {
    const t = add(face, sphere(0.04), m('#7cc9ff', { roughness: 0.1 }), side * 0.2, 0.62, -0.06);
    t.scale.set(1, 1.5, 1);
    return t;
  });

  // legs and arms swing from their hips and shoulders
  const legs = [-1, 1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.2, 0.26, 0);
    body.add(hip);
    add(hip, cyl(0.055, 0.05, 0.2, 10), ink, 0, -0.1, 0);
    add(hip, box(0.17, 0.08, 0.26, 0.035), ink, 0, -0.22, -0.04);
    return hip;
  });
  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.46, 0.58, 0);
    shoulder.rotation.z = side * 0.35;
    body.add(shoulder);
    add(shoulder, capsule(0.05, 0.16), dark, 0, -0.12, 0);
    add(shoulder, sphere(0.075), skin, 0, -0.24, 0);
    return shoulder;
  });

  // the outfit
  const ring = (y, r, t, material, kx = 1.04, kz = 0.84) => {
    const rg = add(body, torus(r, t), material, 0, y, 0);
    rg.rotation.x = Math.PI / 2;
    rg.scale.set(kx, kz, 1);
    return rg;
  };
  const OUTFIT_COLORS = { tee: '#2e3140', hoodie: '#6a6e86', track: '#2d4a74', denim: '#4c6f99', varsity: '#7a3040', blazer: '#363942', leather: '#1b1a20', puffer: '#3d7a74' };
  if (OUTFIT_COLORS[look.outfit]) {
    const kind = look.outfit;
    const cloth = m(OUTFIT_COLORS[kind], kind === 'leather' ? { roughness: 0.3, metalness: 0.25 } : { roughness: 0.85 });
    const puff = kind === 'puffer';
    add(body, box(puff ? 1.0 : 0.97, 0.33, puff ? 0.84 : 0.79, 0.15), cloth, 0, 0.355, 0);
    const trim = m(kind === 'varsity' ? '#ece3cf' : kind === 'track' ? '#e9e4d6' : kind === 'denim' ? '#3a5a82' : kind === 'puffer' ? '#2f625d' : kind === 'hoodie' ? '#575b72' : '#454a5c', { roughness: 0.8 });
    ring(0.52, puff ? 0.45 : 0.43, puff ? 0.06 : 0.035, trim, 1.04, 0.84);
    if (kind === 'hoodie') {
      const hood = add(body, sphere(0.2), trim, 0, 0.48, 0.36);
      hood.scale.set(1.8, 0.7, 0.8);
      add(body, box(0.4, 0.1, 0.03, 0.02), m('#575b72'), 0, 0.28, -0.4);
    } else if (kind === 'track') {
      for (const side of [-1, 1]) add(body, box(0.03, 0.3, 0.6), trim, side * 0.495, 0.355, 0);
      add(body, box(0.015, 0.25, 0.015), m('#ddddee'), 0, 0.36, -0.4);
    } else if (kind === 'varsity') {
      ring(0.46, 0.45, 0.02, trim, 1.04, 0.84);
      add(body, sphere(0.06), trim, -0.2, 0.34, -0.39).scale.set(1, 1, 0.3);
    } else if (kind === 'blazer') {
      add(body, box(0.14, 0.28, 0.02), m('#f0eee8'), 0, 0.37, -0.4);
      for (const side of [-1, 1]) {
        const lapel = add(body, box(0.09, 0.26, 0.02), m('#4a4d58'), side * 0.1, 0.38, -0.405);
        lapel.rotation.z = -side * 0.25;
      }
    } else if (kind === 'leather') {
      const zip = add(body, box(0.014, 0.3, 0.014), m('#b9bcc6', { metalness: 0.8, roughness: 0.25 }), 0.04, 0.36, -0.4);
      zip.rotation.z = -0.2;
    } else if (kind === 'denim') {
      for (const side of [-1, 1]) add(body, box(0.14, 0.1, 0.02), m('#3a5a82'), side * 0.2, 0.3, -0.4);
    } else if (puff) {
      for (const y of [0.26, 0.36, 0.44]) ring(y, 0.47, 0.012, m('#27524e'), 1.06, 0.88);
    } else if (kind === 'tee') {
      add(body, box(0.1, 0.1, 0.015, 0.02), m('#e3b95a'), 0, 0.3, -0.4);
    }
  }
  let scarfTail = null;
  if (look.scarf === 'lanyard') {
    ring(0.54, 0.4, 0.016, m('#c24f4f'));
    add(body, box(0.13, 0.17, 0.015, 0.01), m('#f4f1ea'), 0, 0.33, -0.41);
  } else if (look.scarf === 'bandana') {
    const bm = m('#b0413e', { roughness: 0.8 });
    ring(0.48, 0.44, 0.045, bm);
    const tri = add(body, cone(0.2, 0.26, 3), bm, 0, 0.34, -0.37);
    tri.rotation.z = Math.PI;
    tri.scale.set(1, 1, 0.25);
  } else if (look.scarf === 'chain') {
    const gold = m('#e0b954', { metalness: 0.8, roughness: 0.25 });
    ring(0.5, 0.42, 0.012, gold);
    add(body, sphere(0.04), gold, 0, 0.44, -0.4);
  }
  if (SCARVES[look.scarf]) {
    const sm = m(SCARVES[look.scarf], { roughness: 0.8 });
    ring(0.42, 0.46, 0.075, sm);
    scarfTail = new THREE.Group();
    scarfTail.position.set(0.18, 0.42, 0.38);
    body.add(scarfTail);
    add(scarfTail, box(0.15, 0.36, 0.05, 0.02), sm, 0, -0.16, 0);
  }
  const head = new THREE.Group();
  head.position.y = 1.0;
  body.add(head);
  if (look.ears) {
    const em = look.ears === 'devil' ? m('#b3202a') : dark;
    for (const side of [-1, 1]) {
      let ear;
      if (look.ears === 'bear') ear = add(head, sphere(0.12), em, side * 0.3, 0.02, 0);
      else if (look.ears === 'bunny') {
        ear = add(head, capsule(0.065, 0.3), em, side * 0.22, 0.2, 0);
        ear.rotation.z = -side * 0.15;
      } else {
        ear = add(head, cone(0.1, 0.24), em, side * 0.3, 0.06, 0);
        ear.rotation.z = -side * (look.ears === 'devil' ? 0.45 : 0.2);
      }
    }
  }
  if (look.ears === 'earbuds') {
    for (const side of [-1, 1]) add(body, sphere(0.05), white, side * 0.455, 0.7, 0).scale.set(0.6, 1.2, 1);
  } else if (look.ears === 'headphones') {
    const can = m('#2d2c38', { roughness: 0.4 });
    const band = add(body, torus(0.5, 0.032, Math.PI), m('#25242d', { roughness: 0.4 }), 0, 0.7, 0);
    band.scale.set(0.97, 0.66, 1);
    for (const side of [-1, 1]) {
      add(body, cyl(0.14, 0.14, 0.1, 20), can, side * 0.5, 0.7, 0).rotation.z = Math.PI / 2;
      add(body, cyl(0.07, 0.07, 0.11, 16), m('#d9574d'), side * 0.5, 0.7, 0).rotation.z = Math.PI / 2;
    }
  }
  if (look.hat === 'headband') {
    const r = add(head, torus(0.375, 0.038), m('#c4473f', { roughness: 0.8 }), 0, -0.04, 0);
    r.rotation.x = Math.PI / 2;
    r.scale.set(1, 0.75, 1);
  } else if (look.hat === 'cap') {
    const navy = m('#2f4a73', { roughness: 0.85 });
    const dome = add(head, geo('cap', () => new THREE.SphereGeometry(0.36, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)), navy, 0, -0.07, 0);
    dome.scale.set(1.2, 0.95, 0.98);
    add(head, sphere(0.035), m('#e8e2d2'), 0, 0.27, 0);
    const brim = add(head, box(0.56, 0.025, 0.3, 0.012), m('#1f3250', { roughness: 0.8 }), 0, -0.06, -0.46);
    brim.rotation.x = 0.06;
  } else if (look.hat === 'bucket') {
    add(head, cyl(0.28, 0.35, 0.26, 24), m('#8c926c', { roughness: 0.9 }), 0, 0.06, 0);
    add(head, cyl(0.42, 0.56, 0.05, 28), m('#767b58', { roughness: 0.9 }), 0, -0.04, 0);
  } else if (look.hat === 'beret') {
    const b = add(head, sphere(0.34), m('#7a3b52', { roughness: 0.9 }), 0.03, -0.0, 0);
    b.scale.set(1.2, 0.4, 1.1);
    b.rotation.z = -0.2;
    add(head, cyl(0.02, 0.025, 0.07, 8), m('#5e2a3d'), 0.1, 0.15, 0);
  }
  if (look.hat === 'top') {
    add(head, cyl(0.34, 0.34, 0.03, 28), black, 0, 0.0, 0);
    add(head, cyl(0.21, 0.21, 0.38, 28), black, 0, 0.2, 0);
    add(head, cyl(0.215, 0.215, 0.07, 28), m('#c0392b'), 0, 0.06, 0);
  } else if (look.hat === 'beanie') {
    add(head, geo('beanie', () => new THREE.SphereGeometry(0.33, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)), m('#5b9bd5', { roughness: 0.9 }), 0, -0.06, 0);
    add(head, cyl(0.34, 0.34, 0.09, 28), m('#3b77ad', { roughness: 0.9 }), 0, -0.04, 0);
    add(head, sphere(0.08), m('#ffffff', { roughness: 1 }), 0, 0.3, 0);
  } else if (look.hat === 'party') {
    const hat = new THREE.Group();
    hat.rotation.z = 0.2;
    head.add(hat);
    add(hat, cone(0.18, 0.46), m('#a58bd6'), 0, 0.2, 0);
    add(hat, sphere(0.06), m('#ffd84d'), 0, 0.45, 0);
  } else if (look.hat === 'crown') {
    const gold = m('#f2c14e', { metalness: 0.7, roughness: 0.25 });
    add(head, cyl(0.24, 0.24, 0.14, 24, true), gold, 0, 0.04, 0);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      add(head, cone(0.06, 0.16, 8), gold, Math.cos(a) * 0.22, 0.19, Math.sin(a) * 0.22);
    }
  }

  // power-up gear, hidden until needed
  const wings = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.3, 0.72, 0.3);
    body.add(pivot);
    const w = add(pivot, sphere(0.3), m('#ffffff', { roughness: 0.6 }), side * 0.38, 0.05, 0);
    w.scale.set(1.3, 0.55, 0.12);
    pivot.visible = false;
    return pivot;
  });
  const bubble = add(body, sphere(0.85, 32, 20), m('#bfefff', { transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.2, depthWrite: false }), 0, 0.55, 0);
  bubble.castShadow = false;
  bubble.visible = false;
  const magnet = new THREE.Group();
  magnet.position.set(0, 1.45, 0);
  body.add(magnet);
  add(magnet, torus(0.16, 0.06, Math.PI), m('#e0453a'), 0, 0, 0).rotation.z = Math.PI;
  for (const side of [-1, 1]) add(magnet, cyl(0.06, 0.06, 0.1, 12), m('#d6d9e6', { metalness: 0.8, roughness: 0.2 }), side * 0.16, 0.05, 0);
  magnet.visible = false;
  const coil = geo('spring', () => {
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const a = (i / 80) * Math.PI * 2 * 4;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.07, (i / 80) * 0.22, Math.sin(a) * 0.07));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.014, 6);
  });
  const springs = legs.map((hip) => {
    const s = add(hip, coil, m('#7cc6a4', { metalness: 0.6, roughness: 0.3 }), 0, -0.48, -0.04);
    s.visible = false;
    return s;
  });

  let opacity = 1;
  const moods = {
    angry: { brow: 0.35, browY: 0.9, mouth: 'flat' },
    shout: { brow: -0.15, browY: 0.95, mouth: 'open' },
    worried: { brow: -0.4, browY: 0.93, mouth: 'open' },
    sad: { brow: -0.35, browY: 0.9, mouth: 'frown' },
  };

  // s: { t, phase, air, slide, mood, glance, lean, spin, alpha, wings, bubble, magnet, spring, squash }
  function update(s) {
    const run = !s.air && !s.slide;
    const swing = run ? Math.sin(s.phase) : 0;
    legs[0].rotation.x = run ? swing * 0.9 : s.air ? 0.7 : 0;
    legs[1].rotation.x = run ? -swing * 0.9 : s.air ? -0.4 : 0;
    arms[0].rotation.x = run ? -swing * 1.1 : s.air ? -2.4 : 0.3;
    arms[1].rotation.x = run ? swing * 1.1 : s.air ? -2.4 : 0.3;
    for (const leg of legs) leg.visible = !s.slide;

    const sq = s.slide ? 0.45 : s.squash;
    body.scale.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.5);
    body.position.y = run ? Math.abs(Math.sin(s.phase)) * 0.07 : 0;
    if (s.slide) body.position.y = -0.12;
    tilt.rotation.z = s.lean;
    tilt.rotation.x = s.spin;
    turn.rotation.y = s.glance * Math.PI * 0.55; // a look over its shoulder, not a U-turn
    if (scarfTail) scarfTail.rotation.x = 0.5 + Math.sin(s.t * 18) * 0.25;

    const mood = moods[s.mood] ?? moods.angry;
    brows.forEach((b, i) => {
      b.rotation.z = (i ? -1 : 1) * mood.brow;
      b.position.y = mood.browY;
    });
    for (const [k, v] of Object.entries(mouths)) v.visible = k === mood.mouth;
    for (const t of tears) t.visible = s.mood === 'sad';
    const blink = s.t % 3.7 < 0.12 ? 0.15 : 1;
    for (const e of eyes) e.scale.y = (look.eyes === 'googly' ? 1.5 : 1.15) * blink;
    if (look.eyes === 'googly') pupils.forEach((p, i) => (p.position.y = 0.72 + Math.sin(s.t * 9 + i * 2) * 0.03));

    for (const w of wings) {
      w.visible = !!s.wings;
      w.rotation.z = (w.position.x < 0 ? 1 : -1) * Math.sin(s.t * 16) * 0.5;
    }
    bubble.visible = !!s.bubble;
    bubble.scale.setScalar(1 + Math.sin(s.t * 5) * 0.03);
    magnet.visible = !!s.magnet;
    magnet.rotation.y = s.t * 3;
    for (const sp of springs) sp.visible = !!s.spring && !s.slide;

    if (s.alpha !== opacity) {
      opacity = s.alpha;
      for (const material of mats) {
        if (material === bubble.material || material === pink) continue;
        material.transparent = opacity < 1;
        material.opacity = opacity;
        material.needsUpdate = true;
      }
    }
  }

  return { root, update };
}
