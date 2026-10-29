'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// The button repeats what you say, in a squeaky voice. While it's on, the
// mic is watched for speech; a phrase is recorded from when you start
// talking until you go quiet, then played back faster and higher. The mic
// is ignored while he talks, so he doesn't copy himself.
//
// state: off | asking | listening | hearing | talking | denied | unsupported

const PITCH = 1.65; // playback rate: higher and faster
const QUIET_MS = 700; // this much silence ends a phrase
const MAX_MS = 6000; // a phrase is cut off here
const MIN_MS = 350; // shorter than this is a cough, not a phrase
const TICK_MS = 50;

export function useMimic({ onHear, onTalk, onDone } = {}) {
  const [state, setState] = useState('off');
  const live = useRef(null); // { stream, ctx, analyser, timer, rec, chunks, started, lastLoud, floor, busy }
  const cb = useRef({});
  cb.current = { onHear, onTalk, onDone };

  const stop = useCallback(() => {
    const m = live.current;
    live.current = null;
    if (!m) return;
    clearInterval(m.timer);
    try {
      if (m.rec?.state === 'recording') m.rec.stop();
    } catch {}
    m.player?.stop?.();
    m.stream.getTracks().forEach((t) => t.stop());
    m.ctx.close().catch(() => {});
  }, []);

  useEffect(() => stop, [stop]);

  const play = useCallback(async (blob) => {
    const m = live.current;
    if (!m) return;
    m.busy = true;
    setState('talking');
    try {
      const buf = await m.ctx.decodeAudioData(await blob.arrayBuffer());
      if (live.current !== m) return;
      const src = m.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = PITCH;
      const gain = m.ctx.createGain();
      gain.gain.value = 1.4;
      src.connect(gain).connect(m.ctx.destination);
      m.player = src;
      cb.current.onTalk?.(buf.duration / PITCH);
      await new Promise((done) => {
        src.onended = done;
        src.start();
      });
    } catch {
      // a recording the browser can't decode: just carry on listening
    }
    if (live.current !== m) return;
    m.player = null;
    cb.current.onDone?.();
    setTimeout(() => {
      if (live.current !== m) return;
      m.busy = false;
      m.lastLoud = 0;
      setState('listening');
    }, 300); // let the room go quiet before listening again
  }, []);

  const start = useCallback(async () => {
    if (live.current) return;
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setState('unsupported');
      return;
    }
    setState('asking');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch {
      setState('denied');
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Float32Array(analyser.fftSize);
    const m = { stream, ctx, analyser, rec: null, chunks: [], started: 0, lastLoud: 0, floor: 0.01, busy: false, player: null };
    live.current = m;
    setState('listening');

    m.timer = setInterval(() => {
      if (m.busy) return;
      analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      const rms = Math.sqrt(sum / data.length);
      const now = performance.now();
      const loud = rms > Math.max(0.02, m.floor * 3);
      if (!loud && !m.rec) m.floor = m.floor * 0.95 + rms * 0.05; // learn the room's hum

      if (loud) {
        m.lastLoud = now;
        if (!m.rec) {
          m.chunks = [];
          const rec = new MediaRecorder(stream);
          m.rec = rec;
          rec.ondataavailable = (e) => e.data.size && m.chunks.push(e.data);
          rec.onstop = () => {
            const long = performance.now() - m.started;
            const blob = new Blob(m.chunks, { type: rec.mimeType || 'audio/webm' });
            m.rec = null;
            if (live.current !== m) return;
            if (long < MIN_MS + QUIET_MS) return setState('listening');
            play(blob);
          };
          m.started = now;
          m.rec.start();
          setState('hearing');
          cb.current.onHear?.();
        }
      }
      if (m.rec && m.rec.state === 'recording' && (now - m.lastLoud > QUIET_MS || now - m.started > MAX_MS)) m.rec.stop();
    }, TICK_MS);
  }, [play]);

  const toggle = useCallback(() => {
    if (live.current) {
      stop();
      setState('off');
    } else start();
  }, [start, stop]);

  const off = useCallback(() => {
    if (!live.current) return;
    stop();
    setState('off');
  }, [stop]);

  return { state, on: state === 'listening' || state === 'hearing' || state === 'talking' || state === 'asking', toggle, off };
}
