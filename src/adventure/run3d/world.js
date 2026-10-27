import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { getRenderer, once, geo, mat, mesh, canvasTexture, labelPlane, cursor3d, rr, FONT } from './assets';
import { buildButton } from './button';

// The 3D scene for Button Run. Game logic works in meters with z pointing
// ahead of the button; here that is -z, with the button always at z = 0.
export const W = 480;
export const H = 800;
const LANE = 1.6;
const LANES = [-LANE, 0, LANE];
const TILE = 2;
const NEAR = -4;
const FAR = 75;
const DESK = -1; // the desk top; the keyboard's keys top out at y = 0
const BODY_TOP = -0.42;
const FOG = '#ffd3bd';
const TRAIN_TOP = 2.4;
const RAMP = 4;
const AD_LOW = 1.15;
const ROWS = Math.ceil((FAR - NEAR) / TILE) + 2;

export function createWorld(look, POWERS) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(FOG, 30, 90);
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 400);

  /* ---------- sky, light, desk ---------- */
  const sky = new THREE.Mesh(
    geo('skydome', () => new THREE.SphereGeometry(300, 32, 16)),
    once('skymat', () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
        uniforms: {
          top: { value: new THREE.Color('#4a4fd6') },
          mid: { value: new THREE.Color('#ff9ec2') },
          low: { value: new THREE.Color(FOG) },
        },
        vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 low; varying vec3 vP;
          void main(){ float h = vP.y; vec3 c = h < 0.03 ? low : (h < 0.22 ? mix(low, mid, (h - 0.03) / 0.19) : mix(mid, top, clamp((h - 0.22) / 0.5, 0.0, 1.0)));
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
          }`,
      })
    )
  );
  scene.add(sky);

  const sun = new THREE.Sprite(
    once('sunmat', () =>
      new THREE.SpriteMaterial({
        fog: false,
        depthWrite: false,
        map: canvasTexture('sun', 256, 256, (c) => {
          const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
          g.addColorStop(0, 'rgba(255,250,220,1)');
          g.addColorStop(0.35, 'rgba(255,240,180,1)');
          g.addColorStop(0.42, 'rgba(255,220,170,0.5)');
          g.addColorStop(1, 'rgba(255,200,170,0)');
          c.fillStyle = g;
          c.fillRect(0, 0, 256, 256);
        }),
      })
    )
  );
  sun.scale.set(90, 90, 1);
  sun.position.set(70, 38, -250);
  scene.add(sun);

  // a soft studio around everything, so plastic and coins have something to shine with
  const r = getRenderer();
  if (r) {
    scene.environment = once('env', () => new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture);
    scene.environmentIntensity = 0.55;
  }
  scene.add(new THREE.HemisphereLight('#dfe4ff', '#c99a6c', 1.1));
  const light = new THREE.DirectionalLight('#fff0dc', 2.6);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  Object.assign(light.shadow.camera, { left: -10, right: 10, top: 22, bottom: -14, near: 1, far: 60 });
  light.shadow.camera.updateProjectionMatrix();
  light.shadow.bias = -0.0004;
  light.shadow.normalBias = 0.03;
  scene.add(light, light.target);

  const deskTex = canvasTexture('desk', 512, 512, paintWood, true);
  deskTex.repeat.set(10, 10);
  const desk = mesh(geo('deskplane', () => new THREE.PlaneGeometry(240, 240)), mat('#ffffff', { map: deskTex, roughness: 0.7 }), { cast: false, receive: true });
  desk.rotation.x = -Math.PI / 2;
  desk.position.set(0, DESK, -100);
  scene.add(desk);

  // the keyboard: a long dark body with keycaps on it
  const kb = mesh(geo('kbbody', () => new RoundedBoxGeometry(6.2, -DESK + BODY_TOP, 260, 3, 0.15)), mat('#2a2c38', { roughness: 0.5 }), { receive: true });
  kb.position.set(0, (DESK + BODY_TOP) / 2, -120);
  scene.add(kb);
  const keyGeo = geo('key', () => new RoundedBoxGeometry(1.44, 0.44, TILE - 0.16, 3, 0.1));
  const keys = new THREE.InstancedMesh(keyGeo, mat('#ffffff', { roughness: 0.45 }), ROWS * 3);
  const sideGeo = geo('sidekey', () => new RoundedBoxGeometry(0.42, 0.44, TILE - 0.16, 3, 0.08));
  const sideKeys = new THREE.InstancedMesh(sideGeo, mat('#ffffff', { roughness: 0.5 }), ROWS * 2);
  keys.receiveShadow = sideKeys.receiveShadow = true;
  keys.castShadow = sideKeys.castShadow = false;
  scene.add(keys, sideKeys);

  // far away: a row of giant app icons and the monitor you're watching on
  scene.add(backdrop());

  /* ---------- the button and its chaser ---------- */
  const me = buildButton(look);
  scene.add(me.root);
  const chaser = cursor3d();
  chaser.scale.setScalar(0.09);
  chaser.visible = false;
  scene.add(chaser);

  /* ---------- everything on the track ---------- */
  const live = new Map(); // game object -> its 3D object

  const place = (list, build, pose) => {
    for (const o of list) {
      let obj = live.get(o);
      if (!obj) {
        obj = build(o);
        obj.userData.seen = 0;
        live.set(o, obj);
        scene.add(obj);
      }
      obj.userData.seen = frame;
      obj.visible = (o.z ?? 0) < FAR + 2;
      pose(o, obj);
    }
  };

  let frame = 0;
  const m4 = new THREE.Matrix4();
  const color = new THREE.Color();
  const v = new THREE.Vector3();
  let shake = 0;

  // s: the game's state, read once a frame before drawing
  function sync(s) {
    frame++;
    const { t } = s;

    // camera: behind and above, drifting with the button, wider when fast
    shake = Math.max(shake - 1 / 60, 0);
    const jx = shake ? (Math.random() - 0.5) * shake * 0.6 : 0;
    const jy = shake ? (Math.random() - 0.5) * shake * 0.6 : 0;
    camera.fov = 58 + (s.speed - 13) * 0.45;
    camera.updateProjectionMatrix();
    camera.position.set(s.cam.x + jx, s.cam.y + 1.1 + jy, 6.2);
    camera.lookAt(s.cam.x * 0.85, s.cam.y - 2.2, -10);
    camera.updateMatrixWorld();
    sky.position.copy(camera.position);
    light.position.set(s.cam.x + 6, 16, 8);
    light.target.position.set(s.cam.x, 0, -10);

    // the desk scrolls under everything, and the keys roll toward you
    deskTex.offset.y = (s.dist / 24) % 1;
    const off = s.dist % TILE;
    const base = Math.floor(s.dist / TILE);
    const holes = s.things.filter((o) => o.kind === 'hole');
    for (let k = 0; k < ROWS; k++) {
      const z0 = NEAR + k * TILE - off;
      const zc = z0 + TILE / 2;
      for (let l = 0; l < 3; l++) {
        const gone = holes.some((o) => o.lane === l && z0 > o.z - 0.05 && z0 < o.z + o.len - 0.05);
        m4.makeTranslation(LANES[l], gone ? -50 : -0.22, -zc);
        keys.setMatrixAt(k * 3 + l, m4);
        keys.setColorAt(k * 3 + l, color.set((base + k + l) % 2 ? '#f6f3ec' : '#e6e0d2'));
      }
      for (let side = 0; side < 2; side++) {
        m4.makeTranslation(side ? 2.68 : -2.68, -0.22, -zc);
        sideKeys.setMatrixAt(k * 2 + side, m4);
        sideKeys.setColorAt(k * 2 + side, color.set((base + k + side) % 3 ? '#4a4d5e' : '#5a5e72'));
      }
    }
    keys.instanceMatrix.needsUpdate = sideKeys.instanceMatrix.needsUpdate = true;
    keys.instanceColor.needsUpdate = sideKeys.instanceColor.needsUpdate = true;

    place(s.things, buildThing, (o, obj) => {
      obj.position.set(o.lane == null ? 0 : LANES[o.lane], 0, -o.z);
      // nothing gets between the camera and the button: short things vanish
      // once passed, and a train you're phasing through goes see-through
      if (o.kind === 'train') obj.visible = !(Math.abs(LANES[o.lane] - s.me.x) < 1 && o.z < 0.3 && o.z + o.len > -0.3 && s.me.y < o.top - 0.1);
      else if (o.kind !== 'hole' && o.kind !== 'ramp' && o.z + o.len < -0.4) obj.visible = false;
      const a = obj.userData;
      if (a.flames) a.flames.forEach((f, i) => f.scale.set(0.75 + Math.sin(t * 17 + i) * 0.08, 1.1 + Math.sin(t * 13 + i * 2) * 0.3, 1));
      if (a.lights) for (const l of a.lights) l.material.emissiveIntensity = Math.sin(t * 16) > 0 ? 2.5 : 0.8;
      if (a.pointer) a.pointer.position.y = o.cy;
      if (a.ring) a.ring.material.opacity = o.slammed ? 0.3 : 0.55 + Math.sin(t * 14) * 0.3;
      if (a.leds) a.leds.material.emissiveIntensity = 0.6 + Math.sin(t * 7 + o.z) * 0.6;
    });
    place(s.coins, buildCoin, (o, obj) => {
      obj.position.set(o.x, o.y, -o.z);
      obj.rotation.y = t * 4 + o.z * 0.3;
    });
    place(s.pickups, (o) => buildPickup(o, POWERS), (o, obj) => {
      obj.position.set(o.x, 1 + Math.sin(t * 4 + o.z) * 0.15, -o.z);
      obj.userData.spin.rotation.y = t * 2;
      obj.userData.spin.rotation.x = Math.sin(t * 1.5) * 0.4;
    });
    place(s.decor, buildDecor, (o, obj) => obj.position.set(o.x, DESK, -o.z));
    for (const [o, obj] of live) {
      if (obj.userData.seen === frame) continue;
      scene.remove(obj);
      live.delete(o);
    }

    // the button
    const p = s.me;
    me.root.position.set(p.x, p.y, 0);
    me.root.visible = p.y > -3;
    me.update(s.pose);

    // the cursor: on your heels after a bump, slamming down when it gets you
    chaser.visible = s.chase > 0 || s.over;
    if (s.over) {
      const k = Math.min(1, s.overT / 0.45);
      chaser.position.set(p.x + 0.35, p.y + 1.1 + (1 - k) * 6, 0.1);
      chaser.rotation.set(0, 0, Math.PI + 0.5);
    } else if (s.chase > 0) {
      const k = Math.min(1, s.chase * 2, (5 - s.chase) * 4);
      chaser.position.set(p.x - 0.7 + Math.sin(t * 3) * 0.2, p.y + 1.3 + Math.sin(t * 9) * 0.12, 2.6 - (1 - k) * -3);
      chaser.rotation.set(-0.5, 0.3, Math.PI + 0.6);
    }
  }

  return {
    sync,
    shake(k) {
      shake = Math.max(shake, k);
    },
    // world -> screen, in the 480x800 game frame
    project(x, y, z) {
      v.set(x, y, -z).project(camera);
      return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H];
    },
    // draw the 3D frame onto the 2D canvas, at the canvas's real resolution
    render(c) {
      const r = getRenderer();
      if (!r) {
        c.fillStyle = '#2a2c38';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#fff';
        c.font = `700 20px ${FONT}`;
        c.textAlign = 'center';
        c.fillText('Button Run needs WebGL', W / 2, H / 2);
        return;
      }
      const m = c.getTransform();
      const k = Math.min(1.75, Math.max(0.5, Math.hypot(m.a, m.b)));
      const w = Math.round(W * k);
      const h = Math.round(H * k);
      const size = r.getSize(v);
      if (size.x !== w || size.y !== h) r.setSize(w, h, false);
      r.render(scene, camera);
      c.drawImage(r.domElement, 0, 0, W, H);
    },
  };
}

/* ---------- builders ---------- */
function buildThing(o) {
  const g = new THREE.Group();
  const a = g.userData;
  if (o.kind === 'block') {
    // a giant keycap, with its letter on the front
    const cap = mesh(geo('bigkey', () => new RoundedBoxGeometry(1.4, 0.82, 0.72, 4, 0.16)), mat('#f2ecdc', { roughness: 0.4 }), { receive: true });
    cap.position.set(0, 0.41, -0.36);
    const dish = mesh(geo('bigkeytop', () => new RoundedBoxGeometry(1.1, 0.1, 0.5, 3, 0.04)), mat('#fbf8f0', { roughness: 0.3 }));
    dish.position.set(0, 0.84, -0.36);
    const label = labelPlane(o.label, 1.2, 0.5, '#6a6152');
    label.position.set(0, 0.42, 0.005);
    g.add(cap, dish, label);
  } else if (o.kind === 'ad') {
    for (const side of [-1, 1]) {
      const pole = mesh(geo('pole', () => new THREE.CylinderGeometry(0.04, 0.05, AD_LOW + 0.2, 10)), mat('#b8bcc6', { metalness: 0.7, roughness: 0.3 }));
      pole.position.set(side * 0.72, (AD_LOW + 0.2) / 2, -0.12);
      g.add(pole);
    }
    const panel = mesh(geo('adpanel', () => new RoundedBoxGeometry(1.6, 1.28, 0.14, 3, 0.05)), mat('#ffffff', { roughness: 0.4 }));
    panel.position.set(0, AD_LOW + 0.64, -0.12);
    const screen = new THREE.Mesh(geo('plane:1.5:1.18', () => new THREE.PlaneGeometry(1.5, 1.18)), once(`admat:${o.label}`, () => new THREE.MeshBasicMaterial({ map: adTexture(o.label) })));
    screen.position.set(0, AD_LOW + 0.64, -0.045);
    g.add(panel, screen);
  } else if (o.kind === 'wall') {
    const wall = mesh(geo('wall', () => new RoundedBoxGeometry(1.5, 3.2, 1, 3, 0.06)), once('wallmat', () => new THREE.MeshStandardMaterial({ map: brickTexture(), roughness: 0.85, emissive: '#5a1408', emissiveIntensity: 0.25 })), { receive: true });
    wall.position.set(0, 1.6, -0.5);
    const label = labelPlane('FIREWALL', 1.4, 0.4, '#ffe9c2', 0.6);
    label.position.set(0, 2.5, 0.005);
    g.add(wall, label);
    a.flames = [];
    for (let i = 0; i < 5; i++) {
      const f = new THREE.Sprite(once('flamemat', () => new THREE.SpriteMaterial({ map: flameTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
      f.center.set(0.5, 0.08);
      f.position.set(-0.6 + i * 0.3, 3.15, -0.5 + (i % 2) * 0.3);
      g.add(f);
      a.flames.push(f);
    }
  } else if (o.kind === 'train') {
    const spam = o.moving;
    const side = once(spam ? 'trainside:spam' : 'trainside', () => new THREE.MeshStandardMaterial({ map: rackTexture(spam), roughness: 0.5, metalness: 0.2 }));
    const top = mat(spam ? '#f06a5c' : '#6b7bab', { roughness: 0.5, metalness: 0.2 });
    const front = once(`trainfront:${o.label}`, () => new THREE.MeshStandardMaterial({ map: frontTexture(o.label, spam), roughness: 0.4 }));
    const body = mesh(geo('unitbox', () => new THREE.BoxGeometry(1.44, TRAIN_TOP, 1)), [side, side, top, top, front, top], { receive: true });
    body.scale.z = o.len;
    body.position.set(0, TRAIN_TOP / 2, -o.len / 2);
    g.add(body);
    // a little railing and vents on the roof
    for (let z = 1; z < o.len - 0.5; z += 2.5) {
      const vent = mesh(geo('vent', () => new RoundedBoxGeometry(0.9, 0.12, 0.8, 2, 0.04)), mat(spam ? '#c0392b' : '#3a4568'));
      vent.position.set(0, TRAIN_TOP + 0.06, -z);
      g.add(vent);
    }
    if (spam) {
      a.lights = [-1, 1].map((s) => {
        const l = mesh(geo('headlight', () => new THREE.SphereGeometry(0.13, 14, 10)), new THREE.MeshStandardMaterial({ color: '#fff6a8', emissive: '#ffe066', emissiveIntensity: 2 }), { cast: false });
        l.position.set(s * 0.48, 0.38, 0.02);
        g.add(l);
        return l;
      });
    }
  } else if (o.kind === 'ramp') {
    const ramp = mesh(
      geo('ramp', () => {
        const s = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(RAMP, 0), new THREE.Vector2(RAMP, TRAIN_TOP)]);
        const geometry = new THREE.ExtrudeGeometry(s, { depth: 1.44, bevelEnabled: false });
        geometry.rotateY(Math.PI / 2);
        geometry.translate(-0.72, 0, 0);
        return geometry;
      }),
      mat('#f2c14e', { roughness: 0.6 }),
      { receive: true }
    );
    g.add(ramp);
    const slope = Math.atan2(TRAIN_TOP, RAMP);
    for (let i = 1; i < 6; i++) {
      const f = i / 6;
      const stripe = mesh(geo('stripe', () => new THREE.BoxGeometry(1.46, 0.04, 0.22)), mat('#2b2d3a'));
      stripe.position.set(0, f * TRAIN_TOP + 0.01, -f * RAMP);
      stripe.rotation.x = slope;
      g.add(stripe);
    }
  } else if (o.kind === 'hole') {
    // a missing key, and the glowing void underneath
    const glow = new THREE.Mesh(geo('voidplane', () => new THREE.PlaneGeometry(1.5, 3.9)), once('voidmat', () => new THREE.MeshBasicMaterial({ map: voidTexture(), fog: false })));
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(0, BODY_TOP + 0.01, -o.len / 2);
    g.add(glow);
  } else if (o.kind === 'bar') {
    const frame = mesh(geo('bar', () => new RoundedBoxGeometry(5.3, 0.62, 0.26, 3, 0.08)), mat('#ffffff', { roughness: 0.35 }));
    frame.position.set(0, 0.4, -0.15);
    const face = new THREE.Mesh(geo('plane:5.1:0.5', () => new THREE.PlaneGeometry(5.1, 0.5)), once(`barmat:${o.pct.toFixed(2)}`, () => new THREE.MeshBasicMaterial({ map: barTexture(o.pct) })));
    face.position.set(0, 0.4, -0.015);
    g.add(frame, face);
  } else if (o.kind === 'click') {
    const ring = new THREE.Mesh(geo('ring', () => new THREE.RingGeometry(0.42, 0.72, 40)), new THREE.MeshBasicMaterial({ color: '#ff3b2f', transparent: true, opacity: 0.6, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.02, -0.6);
    const pointer = new THREE.Group();
    pointer.position.set(0, 7, -0.6);
    const c = cursor3d();
    c.scale.setScalar(0.085);
    c.rotation.z = Math.PI - 0.35;
    pointer.add(c);
    g.add(ring, pointer);
    a.ring = ring;
    a.pointer = pointer;
  }
  return g;
}

function buildCoin() {
  const g = new THREE.Group();
  const coin = mesh(
    geo('coin', () => new THREE.CylinderGeometry(0.3, 0.3, 0.08, 28).rotateX(Math.PI / 2)),
    mat('#ffc83a', { metalness: 0.9, roughness: 0.18, emissive: '#8a5a00', emissiveIntensity: 0.45 }),
    { cast: false }
  );
  const star = mesh(geo('coinstar', () => new THREE.CylinderGeometry(0.17, 0.17, 0.1, 5).rotateX(Math.PI / 2)), mat('#fff0a0', { metalness: 0.7, roughness: 0.2, emissive: '#9a7a00', emissiveIntensity: 0.5 }), { cast: false });
  g.add(coin, star);
  return g;
}

function buildPickup(o, POWERS) {
  const p = POWERS[o.kind];
  const g = new THREE.Group();
  const spin = new THREE.Group();
  g.add(spin);
  const orb = mesh(geo('orb', () => new THREE.SphereGeometry(0.5, 28, 18)), mat(p.color, { transparent: true, opacity: 0.55, roughness: 0.1, emissive: p.color, emissiveIntensity: 0.35, depthWrite: false }), { cast: false });
  const ring = mesh(geo('orbring', () => new THREE.TorusGeometry(0.66, 0.04, 8, 40)), mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.8 }), { cast: false });
  spin.add(ring);
  const icon = new THREE.Sprite(
    once(`icon:${o.kind}`, () =>
      new THREE.SpriteMaterial({
        depthWrite: false,
        map: canvasTexture(`icon:${o.kind}`, 128, 128, (c) => {
          c.font = `700 ${p.icon === 'x2' ? 64 : 84}px ${FONT}`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillStyle = '#2b1d17';
          c.fillText(p.icon, 64, 70);
        }),
      })
    )
  );
  icon.scale.set(0.62, 0.62, 1);
  g.add(orb, icon);
  g.userData.spin = spin;
  return g;
}

function buildDecor(d) {
  const g = new THREE.Group();
  if (d.kind === 'pencil') {
    const wood = mesh(geo(`pencil:${d.h.toFixed(1)}`, () => new THREE.CylinderGeometry(0.2, 0.2, d.h, 6)), mat(d.color, { roughness: 0.5 }));
    wood.position.y = 0.45 + d.h / 2;
    const band = mesh(geo('band', () => new THREE.CylinderGeometry(0.21, 0.21, 0.2, 12)), mat('#c9ccd4', { metalness: 0.8, roughness: 0.3 }));
    band.position.y = 0.4;
    const eraser = mesh(geo('eraser', () => new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12)), mat('#f39ac0', { roughness: 0.9 }));
    eraser.position.y = 0.15;
    const tip = mesh(geo('tip', () => new THREE.ConeGeometry(0.2, 0.5, 6)), mat('#f1d3a2', { roughness: 0.8 }));
    tip.position.y = 0.45 + d.h + 0.25;
    const lead = mesh(geo('lead', () => new THREE.ConeGeometry(0.07, 0.17, 6)), mat('#2b2d3a'));
    lead.position.y = 0.45 + d.h + 0.42;
    g.add(wood, band, eraser, tip, lead);
    g.rotation.z = d.x > 0 ? -0.08 : 0.08;
  } else if (d.kind === 'mug') {
    const cup = mesh(geo('mug', () => new THREE.CylinderGeometry(0.6, 0.52, 1.3, 24, 1, true)), mat(d.color, { roughness: 0.3, side: THREE.DoubleSide }));
    cup.position.y = 0.65;
    const bottom = mesh(geo('mugbottom', () => new THREE.CircleGeometry(0.52, 24).rotateX(-Math.PI / 2)), mat(d.color));
    bottom.position.y = 0.02;
    const coffee = mesh(geo('coffee', () => new THREE.CircleGeometry(0.57, 24).rotateX(-Math.PI / 2)), mat('#5a3a22', { roughness: 0.2 }), { cast: false });
    coffee.position.y = 1.15;
    const handle = mesh(geo('handle', () => new THREE.TorusGeometry(0.3, 0.07, 8, 16, Math.PI)), mat(d.color, { roughness: 0.3 }));
    handle.position.set(d.x > 0 ? -0.6 : 0.6, 0.65, 0);
    handle.rotation.z = d.x > 0 ? Math.PI / 2 : -Math.PI / 2;
    g.add(cup, bottom, coffee, handle);
  } else {
    for (let i = 0; i < d.n; i++) {
      const b = mesh(geo('book', () => new RoundedBoxGeometry(1.8, 0.4, 1.3, 2, 0.04)), mat(d.colors[i % d.colors.length], { roughness: 0.7 }), { receive: true });
      b.position.y = 0.2 + i * 0.41;
      b.rotation.y = ((i * 37) % 7) * 0.05 - 0.15;
      const pages = mesh(geo('pages', () => new THREE.BoxGeometry(1.7, 0.3, 1.32)), mat('#f6f0e0'));
      pages.position.set(0.05, 0, 0);
      b.add(pages);
      g.add(b);
    }
  }
  return g;
}

// Giant app icons on the horizon, a few clouds, and the monitor you're
// watching all this on, with your cursor in it.
function backdrop() {
  const g = new THREE.Group();
  const flat = (color) => once(`flat:${color}`, () => new THREE.MeshLambertMaterial({ color, fog: false }));
  const icons = ['#e4a3c4', '#9fcfb6', '#93b4dd', '#e9cd8a', '#bba8de', '#e69c8c'];
  for (let i = 0; i < 16; i++) {
    const h = 8 + ((i * 37) % 14);
    const icon = new THREE.Mesh(geo(`icon:${h}`, () => new RoundedBoxGeometry(11, h, 5, 3, 2)), flat(icons[i % icons.length]));
    const x = (i - 7.5) * 16 + ((i * 13) % 7);
    if (Math.abs(x) < 26) continue;
    icon.position.set(x, DESK + h / 2, -190 - ((i * 23) % 30));
    g.add(icon);
  }
  const mon = new THREE.Group();
  mon.position.set(0, DESK, -200);
  const bezel = new THREE.Mesh(geo('bezel', () => new RoundedBoxGeometry(46, 28, 3, 3, 1.6)), flat('#2b2d3a'));
  bezel.position.y = 22;
  const stand = new THREE.Mesh(geo('stand', () => new THREE.BoxGeometry(6, 9, 2)), flat('#2b2d3a'));
  stand.position.set(0, 4.5, -1);
  const screen = new THREE.Mesh(geo('screen', () => new THREE.PlaneGeometry(42.5, 24.2)), once('screenmat', () => new THREE.MeshBasicMaterial({ map: screenTexture(), fog: false })));
  screen.position.set(0, 22, 1.6);
  mon.add(bezel, stand, screen);
  g.add(mon);
  const cloud = flat('#fff5ee');
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const puff = new THREE.Mesh(geo('puff', () => new THREE.SphereGeometry(5, 14, 10)), cloud);
      puff.position.set(j * 6 - 9, Math.sin(j * 2) * 2, 0);
      puff.scale.setScalar(0.8 + ((j * 7) % 3) * 0.3);
      c.add(puff);
    }
    c.position.set((i - 3) * 45 + ((i * 17) % 20), 70 + ((i * 29) % 40), -260);
    g.add(c);
  }
  return g;
}

/* ---------- painted textures ---------- */
function paintWood(c, w, h) {
  c.fillStyle = '#d6a571';
  c.fillRect(0, 0, w, h);
  const planks = 4;
  for (let i = 0; i < planks; i++) {
    const x = (i * w) / planks;
    c.fillStyle = ['#d8a774', '#cf9c68', '#dcae7c', '#d29f6b'][i];
    c.fillRect(x, 0, w / planks, h);
    c.strokeStyle = 'rgba(120,70,30,0.18)';
    c.lineWidth = 2;
    for (let j = 0; j < 9; j++) {
      c.beginPath();
      const gx = x + 10 + j * 13;
      c.moveTo(gx, 0);
      for (let y = 0; y <= h; y += 32) c.lineTo(gx + Math.sin(y * 0.03 + i + j) * 4, y);
      c.stroke();
    }
    c.fillStyle = 'rgba(80,40,15,0.35)';
    c.fillRect(x, 0, 3, h);
    c.fillRect(x, ((i * 197) % h), w / planks, 3);
  }
}

function brickTexture() {
  const tex = canvasTexture('bricks', 256, 512, (c, w, h) => {
    c.fillStyle = '#7a2414';
    c.fillRect(0, 0, w, h);
    const rows = 12;
    const bh = h / rows;
    for (let r = 0; r < rows; r++) {
      const shift = r % 2 ? 0 : 0.5;
      for (let i = -1; i < 3; i++) {
        const x = (i + shift) * (w / 2);
        c.fillStyle = ['#c8432f', '#b93b28', '#d14e36'][(r + i + 3) % 3];
        rr(c, x + 4, r * bh + 4, w / 2 - 8, bh - 8, 4);
        c.fill();
      }
    }
  });
  return tex;
}

function rackTexture(spam) {
  return canvasTexture(`rack:${spam}`, 1024, 256, (c, w, h) => {
    c.fillStyle = spam ? '#d8433a' : '#3b4770';
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 12; i++) {
      const x = 12 + i * (w / 12);
      c.fillStyle = spam ? '#b8322a' : '#2c3656';
      rr(c, x, 24, w / 12 - 24, h - 48, 8);
      c.fill();
      if (spam) {
        // envelopes along the side
        c.fillStyle = '#fff4ea';
        rr(c, x + 14, 80, w / 12 - 52, 64, 4);
        c.fill();
        c.strokeStyle = '#d8433a';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(x + 14, 82);
        c.lineTo(x + w / 24 - 12, 120);
        c.lineTo(x + w / 12 - 38, 82);
        c.stroke();
      } else {
        for (let j = 0; j < 6; j++) {
          c.fillStyle = (i + j) % 4 ? '#7cc6a4' : '#ffd84d';
          c.fillRect(x + 12, 40 + j * 30, 8, 8);
          c.fillStyle = 'rgba(255,255,255,0.12)';
          c.fillRect(x + 28, 42 + j * 30, w / 12 - 64, 4);
        }
      }
    }
  });
}

function frontTexture(label, spam) {
  return canvasTexture(`front:${label}`, 256, 420, (c, w, h) => {
    c.fillStyle = spam ? '#e0453a' : '#4a5a85';
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(15,20,40,0.85)';
    rr(c, 26, 36, w - 52, 120, 16);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.fillRect(40, 48, 40, 10);
    c.fillStyle = '#ffffff';
    c.font = `700 ${spam ? 54 : 46}px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(spam ? '✉ SPAM' : label, w / 2, 220, w - 30);
    if (!spam) {
      for (let i = 0; i < 4; i++) {
        c.fillStyle = i % 2 ? '#7cc6a4' : '#ffd84d';
        c.fillRect(46 + i * 46, 300, 22, 22);
      }
    }
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(0, h - 30, w, 30);
  });
}

function adTexture(label) {
  return canvasTexture(`ad:${label}`, 320, 252, (c, w, h) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#3b6fd8';
    c.fillRect(0, 0, w, 44);
    c.fillStyle = '#e0453a';
    rr(c, w - 40, 8, 30, 28, 6);
    c.fill();
    c.fillStyle = '#fff';
    c.font = `700 24px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('×', w - 25, 23);
    c.fillStyle = '#e0453a';
    c.font = `700 46px ${FONT}`;
    c.fillText(label, w / 2, 112, w - 20);
    c.fillStyle = '#3fae5a';
    rr(c, w / 2 - 60, 170, 120, 46, 10);
    c.fill();
    c.fillStyle = '#fff';
    c.font = `700 26px ${FONT}`;
    c.fillText('OK', w / 2, 194);
  });
}

function barTexture(pct) {
  return canvasTexture(`bar:${pct.toFixed(2)}`, 1024, 100, (c, w, h) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#d6d9e6';
    rr(c, 12, 14, w - 24, h - 28, 14);
    c.fill();
    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#3fae5a');
    g.addColorStop(1, '#7cdc8a');
    c.fillStyle = g;
    rr(c, 12, 14, (w - 24) * pct, h - 28, 14);
    c.fill();
    c.fillStyle = '#1b1b22';
    c.font = `700 44px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(`LOADING ${Math.floor(pct * 100)}%`, w / 2, h / 2 + 2);
  });
}

function flameTexture() {
  return canvasTexture('flame', 128, 256, (c, w, h) => {
    const layers = [
      ['rgba(255,70,20,0.9)', 1],
      ['rgba(255,150,30,0.95)', 0.72],
      ['rgba(255,235,140,1)', 0.42],
    ];
    for (const [color, k] of layers) {
      const bw = (w / 2) * k * 0.9;
      const top = h - h * 0.92 * k;
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(w / 2, top);
      c.bezierCurveTo(w / 2 + bw * 0.3, top + h * 0.3 * k, w / 2 + bw * 1.1, h - h * 0.35 * k, w / 2, h - 6);
      c.bezierCurveTo(w / 2 - bw * 1.1, h - h * 0.35 * k, w / 2 - bw * 0.3, top + h * 0.3 * k, w / 2, top);
      c.fill();
    }
  });
}

function voidTexture() {
  return canvasTexture('void', 128, 256, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, h / 1.6);
    g.addColorStop(0, '#05030a');
    g.addColorStop(0.6, '#1a0f33');
    g.addColorStop(1, '#6b3fd6');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
}

function screenTexture() {
  return canvasTexture('screen', 512, 292, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#a8dcff');
    g.addColorStop(1, '#5b8fe0');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    const icons = ['#f39ac0', '#7cc6a4', '#f2c14e', '#a58bd6'];
    for (let i = 0; i < 4; i++) {
      c.fillStyle = icons[i];
      rr(c, 24, 20 + i * 64, 44, 44, 10);
      c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.fillRect(0, h - 28, w, 28);
    // a big pointer, watching
    c.save();
    c.translate(300, 90);
    c.scale(4.5, 4.5);
    c.beginPath();
    for (const [x, y] of [[0, 0], [0, 22], [5.5, 17], [9.5, 26], [13, 24.5], [9, 15.5], [16, 15.5]]) c.lineTo(x, y);
    c.closePath();
    c.fillStyle = '#fff';
    c.fill();
    c.lineWidth = 1.4;
    c.strokeStyle = '#111';
    c.stroke();
    c.restore();
  });
}
