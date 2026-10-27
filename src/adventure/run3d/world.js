import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
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
const FOG = '#d98a86';
const TRAIN_TOP = 2.4;
const RAMP = 4;
const AD_LOW = 1.15;
const ROWS = Math.ceil((FAR - NEAR) / TILE) + 2;

// The sky drifts from sunset to night to morning and round again as you run.
const SKIES = [
  { top: '#0d1130', mid: '#4a3a8a', low: FOG, hemi: 0.5, sun: 1.32, env: 0.33, sunColor: '#ffd6b8', disc: '#ffe2c8', stars: 0.35, glow: 0.35 },
  { top: '#020309', mid: '#0d1433', low: '#1c2350', hemi: 0.15, sun: 0.28, env: 0.1, sunColor: '#8fa6ff', disc: '#d6e0ff', stars: 1, glow: 1 },
  { top: '#1a3a74', mid: '#6b8fcc', low: '#e9bfa6', hemi: 0.61, sun: 1.49, env: 0.36, sunColor: '#fff3e6', disc: '#ffffff', stars: 0, glow: 0.15 },
];
const SKY_LEG = 900; // meters per sky
const lerpSky = (() => {
  const out = {};
  const ca = new THREE.Color();
  const cb = new THREE.Color();
  return (dist) => {
    const leg = Math.floor(dist / SKY_LEG);
    const a = SKIES[leg % SKIES.length];
    const b = SKIES[(leg + 1) % SKIES.length];
    const f = THREE.MathUtils.smoothstep((dist / SKY_LEG) % 1, 0.75, 1);
    for (const k of Object.keys(a)) {
      if (typeof a[k] === 'number') out[k] = a[k] + (b[k] - a[k]) * f;
      else out[k] = (out[k] ?? new THREE.Color()).copy(ca.set(a[k])).lerp(cb.set(b[k]), f);
    }
    return out;
  };
})();

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
  const hemi = new THREE.HemisphereLight('#dfe4ff', '#c99a6c', 1.1);
  scene.add(hemi);
  // the button glows a little in the dark
  const glow = new THREE.PointLight('#ffb27a', 0, 9, 1.5);
  scene.add(glow);
  const stars = new THREE.Points(
    geo('stars', () => {
      const pts = [];
      for (let i = 0; i < 400; i++) {
        const a = Math.random() * Math.PI * 2;
        const h = 0.08 + Math.random() * 0.9;
        const r = Math.sqrt(1 - h * h) * 280;
        pts.push(Math.cos(a) * r, h * 280, Math.sin(a) * r);
      }
      return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    }),
    once('starmat', () => new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, transparent: true, fog: false, depthWrite: false }))
  );
  scene.add(stars);
  const light = new THREE.DirectionalLight('#fff0dc', 2.6);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  Object.assign(light.shadow.camera, { left: -10, right: 10, top: 22, bottom: -14, near: 1, far: 60 });
  light.shadow.camera.updateProjectionMatrix();
  light.shadow.bias = -0.0004;
  light.shadow.normalBias = 0.03;
  scene.add(light, light.target);

  const deskTex = canvasTexture('deskmat', 512, 512, paintDesk, true);
  deskTex.repeat.set(14, 14);
  const desk = mesh(geo('deskplane', () => new THREE.PlaneGeometry(240, 240)), mat('#ffffff', { map: deskTex, roughness: 0.8 }), { cast: false, receive: true });
  desk.rotation.x = -Math.PI / 2;
  desk.position.set(0, DESK, -100);
  scene.add(desk);

  // the keyboard: a long dark body with keycaps on it
  const kb = mesh(geo('kbbody', () => new RoundedBoxGeometry(6.2, -DESK + BODY_TOP, 260, 3, 0.15)), mat('#1a1c22', { roughness: 0.35, metalness: 0.7 }), { receive: true });
  kb.position.set(0, (DESK + BODY_TOP) / 2, -120);
  scene.add(kb);
  const keyGeo = geo('key', () => new RoundedBoxGeometry(1.44, 0.44, TILE - 0.16, 3, 0.1));
  const keys = new THREE.InstancedMesh(keyGeo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, metalness: 0.15 }), ROWS * 3);
  const sideGeo = geo('sidekey', () => new RoundedBoxGeometry(0.42, 0.44, TILE - 0.16, 3, 0.08));
  const sideKeys = new THREE.InstancedMesh(sideGeo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 }), ROWS * 2);
  keys.receiveShadow = sideKeys.receiveShadow = true;
  keys.castShadow = sideKeys.castShadow = false;
  scene.add(keys, sideKeys);
  // neon strips glowing up between the lanes and along the edges
  const neon = new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#38d6ff', emissiveIntensity: 2.2 });
  for (const x of [-0.8, 0.8, -2.36, 2.36]) {
    const strip = mesh(geo('strip', () => new THREE.BoxGeometry(0.05, 0.05, 260)), neon, { cast: false });
    strip.position.set(x, -0.16, -120);
    scene.add(strip);
  }
  // a letter printed on each keycap, picked from an 8x8 atlas per instance
  const letters = new THREE.InstancedMesh(geo('letterplane', () => new THREE.PlaneGeometry(0.46, 0.46).rotateX(-Math.PI / 2)), letterMaterial(), ROWS * 3);
  const letterIds = new THREE.InstancedBufferAttribute(new Float32Array(ROWS * 3), 1);
  letters.geometry = letters.geometry.clone();
  letters.geometry.setAttribute('letter', letterIds);
  letters.frustumCulled = false;
  scene.add(letters);

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
    // the intro starts in front of the button, looking at its face, then
    // swings round behind it
    const k = THREE.MathUtils.smootherstep(s.intro, 0, 1);
    const rad = 6.2 - 1.6 * k;
    const orbit = k * Math.PI;
    camera.position.set(s.cam.x + Math.sin(orbit) * rad * 0.9 + jx, s.cam.y + 1.1 - 2.5 * k + jy, Math.cos(orbit) * rad);
    const f = THREE.MathUtils.smoothstep(k, 0, 0.45);
    camera.lookAt(s.cam.x * 0.85 * (1 - f) + s.me.x * f, s.cam.y - 2.2 + (0.75 - s.cam.y + 2.2) * f, -10 + 10 * f);
    camera.updateMatrixWorld();
    sky.position.copy(camera.position);
    stars.position.copy(camera.position);
    const p0 = lerpSky(s.dist);
    sky.material.uniforms.top.value.copy(p0.top);
    sky.material.uniforms.mid.value.copy(p0.mid);
    sky.material.uniforms.low.value.copy(p0.low);
    scene.fog.color.copy(p0.low);
    hemi.intensity = p0.hemi;
    light.intensity = p0.sun;
    light.color.copy(p0.sunColor);
    sun.material.color.copy(p0.disc);
    stars.material.opacity = p0.stars;
    stars.visible = p0.stars > 0.01;
    glow.intensity = p0.glow * 3;
    if (scene.environment) scene.environmentIntensity = p0.env;
    // after dark the keyboard lights up like a gaming one
    keys.material.emissive.setHSL((t * 0.08) % 1, 0.9, 0.5);
    keys.material.emissiveIntensity = p0.glow * 0.04;
    neon.emissive.setHSL((0.53 + Math.sin(t * 0.3) * 0.08 + p0.glow * 0.25) % 1, 0.9, 0.55);
    neon.emissiveIntensity = 1.8 + p0.glow * 1.6;
    sideKeys.material.emissive.setHSL((t * 0.08 + 0.5) % 1, 0.9, 0.5);
    sideKeys.material.emissiveIntensity = 0.15 + p0.glow * 0.5;
    glow.position.set(s.me.x, s.me.y + 1.2, 0.6);
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
        m4.makeTranslation(LANES[l] - 0.38, gone ? -50 : 0.006, -zc + 0.45);
        letters.setMatrixAt(k * 3 + l, m4);
        letterIds.setX(k * 3 + l, ((base + k) * 7 + l * 13 + ((base + k) % 5) * 3) % LETTERS.length);
        keys.setColorAt(k * 3 + l, color.set((base + k + l) % 2 ? '#30333c' : '#2a2d35'));
      }
      for (let side = 0; side < 2; side++) {
        m4.makeTranslation(side ? 2.68 : -2.68, -0.22, -zc);
        sideKeys.setMatrixAt(k * 2 + side, m4);
        sideKeys.setColorAt(k * 2 + side, color.set((base + k + side) % 3 ? '#1d1f26' : '#24272f'));
      }
    }
    keys.instanceMatrix.needsUpdate = sideKeys.instanceMatrix.needsUpdate = letters.instanceMatrix.needsUpdate = true;
    letterIds.needsUpdate = true;
    keys.instanceColor.needsUpdate = sideKeys.instanceColor.needsUpdate = true;

    place(s.things, buildThing, (o, obj) => {
      obj.position.set(o.x ?? 0, 0, -o.z);
      // nothing gets between the camera and the button: short things vanish
      // once passed, and a train you're phasing through goes see-through
      if (o.kind === 'train') obj.visible = !(Math.abs(o.x - s.me.x) < 1 && o.z < 0.3 && o.z + o.len > -0.3 && s.me.y < o.top - 0.1);
      else if (o.kind !== 'hole' && o.kind !== 'ramp' && o.z + o.len < -0.4) obj.visible = false;
      const a = obj.userData;
      if (a.flames) a.flames.forEach((f, i) => f.scale.set(0.75 + Math.sin(t * 17 + i) * 0.08, 1.1 + Math.sin(t * 13 + i * 2) * 0.3, 1));
      if (a.lights) for (const l of a.lights) l.material.emissiveIntensity = Math.sin(t * 16) > 0 ? 2.5 : 0.8;
      if (a.pointer) a.pointer.position.y = o.cy;
      if (a.ring) a.ring.material.opacity = o.slammed ? 0.3 : 0.55 + Math.sin(t * 14) * 0.3;
      if (a.leds) a.leds.material.emissiveIntensity = 0.6 + Math.sin(t * 7 + o.z) * 0.6;
      if (a.arrows) a.arrows.material.opacity = 0.5 + Math.sin(t * 10) * 0.4;
      if (a.wobble) a.wobble.rotation.set(Math.sin(t * 20) * 0.04, o.dir * 0.3 + Math.sin(t * 9) * 0.08, 0);
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
      // glow on anything bright: neon, coins, fire, screens
      const fx = once('composer', () => {
        const composer = new EffectComposer(r);
        const pass = new RenderPass(scene, camera);
        const bloom = new UnrealBloomPass(new THREE.Vector2(w / 2, h / 2), 0.35, 0.2, 1.1);
        composer.addPass(pass);
        composer.addPass(bloom);
        composer.addPass(new OutputPass());
        return { composer, pass, bloom, w: 0, h: 0 };
      });
      if (fx.w !== w || fx.h !== h) {
        fx.composer.setSize(w, h);
        fx.bloom.resolution.set(w / 2, h / 2);
        fx.w = w;
        fx.h = h;
      }
      fx.pass.scene = scene;
      fx.pass.camera = camera;
      fx.composer.render();
      c.drawImage(r.domElement, 0, 0, W, H);
    },
  };
}

const LETTERS = 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890!?@#&*+=<>/';

// Basic material reading one cell of the letter atlas per instance.
function letterMaterial() {
  return once('lettermat', () => {
    const map = canvasTexture('letters', 512, 512, (c) => {
      c.fillStyle = '#c9cfdb';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = `700 40px ${FONT}`;
      [...LETTERS].forEach((ch, i) => c.fillText(ch, (i % 8) * 64 + 32, Math.floor(i / 8) * 64 + 34));
    });
    const m = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, opacity: 0.85 });
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float letter;')
        .replace(
          '#include <uv_vertex>',
          '#include <uv_vertex>\nvMapUv = (uv + vec2(mod(letter, 8.0), 7.0 - floor(letter / 8.0))) / 8.0;'
        );
    };
    return m;
  });
}

/* ---------- builders ---------- */
function buildThing(o) {
  const g = new THREE.Group();
  const a = g.userData;
  if (o.kind === 'mouse') {
    // a giant computer mouse skidding sideways, cable whipping behind it
    const wob = new THREE.Group();
    g.add(wob);
    const shell = mesh(geo('mouseshell', () => new THREE.SphereGeometry(0.66, 32, 20).scale(1, 0.7, 1.35)), mat('#1d1f27', { roughness: 0.18, metalness: 0.4 }));
    shell.position.set(0, 0.36, -0.65);
    const wheel = mesh(geo('mousewheel', () => new THREE.CylinderGeometry(0.1, 0.1, 0.08, 18).rotateZ(Math.PI / 2)), mat('#4fd1ff', { emissive: '#4fd1ff', emissiveIntensity: 1.5 }));
    wheel.position.set(0, 0.72, -0.25);
    const seam = mesh(geo('mouseseam', () => new THREE.BoxGeometry(0.02, 0.05, 0.55)), mat('#9aa0ab'));
    seam.position.set(0, 0.72, -0.1);
    const glow = mesh(geo('mouseglow', () => new THREE.TorusGeometry(0.58, 0.025, 8, 40).rotateX(Math.PI / 2).scale(1, 1, 1.32)), mat('#4fd1ff', { emissive: '#4fd1ff', emissiveIntensity: 2 }), { cast: false });
    glow.position.set(0, 0.08, -0.65);
    wob.add(shell, wheel, seam, glow);
    a.wobble = wob;
  } else if (o.kind === 'slider') {
    const cap = mesh(geo('bigkey', () => new RoundedBoxGeometry(1.4, 0.82, 0.72, 4, 0.16)), mat('#ffd9a0', { roughness: 0.35 }), { receive: true });
    cap.position.set(0, 0.41, -0.36);
    const label = labelPlane(o.label, 1.2, 0.5, '#7a5520');
    label.position.set(0, 0.42, 0.005);
    const arrows = labelPlane('◀ ▶', 1.2, 0.3, '#ff7a1c', 0.9);
    arrows.material = arrows.material.clone();
    arrows.position.set(0, 1.05, -0.36);
    g.add(cap, label, arrows);
    a.arrows = arrows;
  } else if (o.kind === 'block') {
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
    // low rails along the roof edges, clear of the middle where you run
    for (const side of [-1, 1]) {
      const rail = mesh(geo('rail', () => new THREE.BoxGeometry(0.08, 0.1, 1)), mat(spam ? '#c0392b' : '#3a4568', { metalness: 0.5, roughness: 0.4 }));
      rail.scale.z = o.len - 0.4;
      rail.position.set(side * 0.66, TRAIN_TOP + 0.05, -o.len / 2);
      g.add(rail);
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
          // a white badge so the icon reads from far away
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.arc(64, 64, 58, 0, Math.PI * 2);
          c.fill();
          c.lineWidth = 8;
          c.strokeStyle = p.color;
          c.stroke();
          c.font = `700 ${p.icon === 'x2' ? 56 : 70}px ${FONT}`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillStyle = '#2b1d17';
          c.fillText(p.icon, 64, 70);
        }),
      })
    )
  );
  icon.scale.set(0.78, 0.78, 1);
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

// A city of glass towers on the horizon, lit window by window, and the
// monitor you're watching all this on, with your cursor in it.
function backdrop() {
  const g = new THREE.Group();
  const flat = (color) => once(`flat:${color}`, () => new THREE.MeshLambertMaterial({ color, fog: false }));
  const tower = once('towermat', () => new THREE.MeshLambertMaterial({ color: '#1a1f33', emissive: '#ffffff', emissiveMap: windowTexture(), emissiveIntensity: 0.9, fog: false }));
  for (let i = 0; i < 26; i++) {
    const h = 14 + ((i * 37) % 46);
    const w = 8 + ((i * 11) % 9);
    const x = (i - 12.5) * 11 + ((i * 13) % 7);
    if (Math.abs(x) < 30) continue;
    const t = new THREE.Mesh(geo(`tower:${w}:${h}`, () => new THREE.BoxGeometry(w, h, 8)), tower);
    t.position.set(x, DESK + h / 2, -200 - ((i * 23) % 40));
    g.add(t);
  }
  const mon = new THREE.Group();
  mon.position.set(0, DESK, -200);
  const bezel = new THREE.Mesh(geo('bezel', () => new RoundedBoxGeometry(46, 27, 1.6, 3, 0.6)), flat('#0c0d11'));
  bezel.position.y = 22;
  const stand = new THREE.Mesh(geo('stand', () => new THREE.BoxGeometry(3, 9, 1.5)), flat('#2a2d36'));
  stand.position.set(0, 4.5, -1);
  const screen = new THREE.Mesh(geo('screen', () => new THREE.PlaneGeometry(44.4, 25.4)), once('screenmat', () => new THREE.MeshBasicMaterial({ map: screenTexture(), fog: false })));
  screen.position.set(0, 22, 0.85);
  mon.add(bezel, stand, screen);
  g.add(mon);
  return g;
}

/* ---------- painted textures ---------- */
// A dark desk mat with a faint grid.
function paintDesk(c, w, h) {
  c.fillStyle = '#1b1c22';
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 2500; i++) {
    c.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`;
    c.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  c.strokeStyle = 'rgba(120,140,200,0.10)';
  c.lineWidth = 2;
  for (let x = 0; x <= w; x += 64) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, h);
    c.stroke();
    c.beginPath();
    c.moveTo(0, x);
    c.lineTo(w, x);
    c.stroke();
  }
}

function windowTexture() {
  return canvasTexture('windows', 128, 256, (c, w, h) => {
    c.fillStyle = '#000000';
    c.fillRect(0, 0, w, h);
    for (let y = 6; y < h; y += 12) {
      for (let x = 6; x < w; x += 12) {
        const r = Math.random();
        if (r < 0.55) continue;
        c.fillStyle = r < 0.8 ? 'rgba(255,214,150,0.9)' : r < 0.93 ? 'rgba(120,200,255,0.9)' : 'rgba(255,120,200,0.9)';
        c.fillRect(x, y, 6, 7);
      }
    }
  });
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
    g.addColorStop(0, '#16224d');
    g.addColorStop(1, '#3a56c9');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    const icons = ['#ff5f8f', '#38d6ff', '#ffb020', '#8c6bff'];
    for (let i = 0; i < 4; i++) {
      c.fillStyle = icons[i];
      rr(c, 24, 20 + i * 64, 44, 44, 10);
      c.fill();
    }
    c.fillStyle = 'rgba(10,12,20,0.75)';
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
