import { ToneMode } from '../types';
import { NF as NF_VALS } from '../constants/data';

let actx: AudioContext | null = null;
const bufCache: Record<string, AudioBuffer> = {};

interface ActiveNoise {
  src: AudioBufferSourceNode | OscillatorNode;
  g: GainNode;
  c: AudioContext;
  type: string;
  ex?: (AudioNode & { stop?: (when?: number) => void })[];
  hz?: number;
  mode?: ToneMode;
}

let activeNz: ActiveNoise | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!actx) {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        actx = new AudioCtx();
      }
    } catch {
      return null;
    }
  }
  if (actx && actx.state === 'suspended') {
    actx.resume().catch(() => {});
  }
  return actx;
}

function getBufferFor(c: AudioContext, type: string): AudioBuffer {
  if (bufCache[type]) return bufCache[type];
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);

  if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  } else if (type === 'brown') {
    let last = 0;
    for (let i = 0; i < len; i++) {
      const wb = Math.random() * 2 - 1;
      last = (last + 0.02 * wb) / 1.02;
      d[i] = last * 3.5;
    }
  } else {
    for (let i = 0; i < len; i++) {
      d[i] = Math.random() * 2 - 1;
    }
  }

  bufCache[type] = buf;
  return buf;
}

export function startNoise(
  type: string,
  vol: number,
  hz: number = 528,
  toneMode: ToneMode = 'pure'
): boolean {
  const c = getAudioContext();
  if (!c) return false;
  stopNoise(true);

  if (type === 'tone') {
    const o = c.createOscillator();
    const tg = c.createGain();
    const ex: (AudioNode & { stop?: (when?: number) => void })[] = [];
    tg.gain.value = 0;
    o.type = 'sine';

    if (toneMode === 'pulse') {
      o.frequency.value = 220;
      const m = c.createGain();
      m.gain.value = 0.5;
      const lfo = c.createOscillator();
      const ld = c.createGain();
      lfo.frequency.value = hz;
      ld.gain.value = 0.5;
      lfo.connect(ld);
      ld.connect(m.gain);
      o.connect(m);
      m.connect(tg);
      lfo.start();
      ex.push(lfo);
    } else {
      o.frequency.value = hz;
      o.connect(tg);
    }

    tg.connect(c.destination);
    o.start();
    tg.gain.linearRampToValueAtTime(vol * NF_VALS.tone, c.currentTime + 0.4);
    activeNz = { src: o, g: tg, c, type: 'tone', ex, hz, mode: toneMode };
    return true;
  }

  const src = c.createBufferSource();
  src.buffer = getBufferFor(c, type === 'rain' ? 'white' : type);
  src.loop = true;
  let node: AudioNode = src;

  if (type === 'rain') {
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 700;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 7500;
    src.connect(hp);
    hp.connect(lp);
    node = lp;
  }

  const g = c.createGain();
  g.gain.value = 0;
  node.connect(g);
  g.connect(c.destination);
  src.start();
  g.gain.linearRampToValueAtTime(vol * (NF_VALS[type] || 0.5), c.currentTime + 0.4);
  activeNz = { src, g, c, type };
  return true;
}

export function stopNoise(quick: boolean = false) {
  if (!activeNz) return;
  const o = activeNz;
  activeNz = null;
  try {
    o.g.gain.cancelScheduledValues(o.c.currentTime);
    o.g.gain.setValueAtTime(o.g.gain.value, o.c.currentTime);
    o.g.gain.linearRampToValueAtTime(0, o.c.currentTime + (quick ? 0.05 : 0.4));
    if ('stop' in o.src) {
      o.src.stop(o.c.currentTime + (quick ? 0.08 : 0.45));
    }
    (o.ex || []).forEach((x) => {
      if (x && typeof x.stop === 'function') {
        x.stop(o.c.currentTime + (quick ? 0.08 : 0.45));
      }
    });
  } catch {
    // ignore
  }
}

export function updateNoiseVolume(vol: number) {
  if (activeNz) {
    const factor = activeNz.type === 'tone' ? NF_VALS.tone : (NF_VALS[activeNz.type] || 0.5);
    activeNz.g.gain.setTargetAtTime(vol * factor, activeNz.c.currentTime, 0.05);
  }
}

export function isNoiseActive(): boolean {
  return activeNz !== null;
}

export function getActiveNoiseInfo() {
  return activeNz ? { type: activeNz.type, hz: activeNz.hz, mode: activeNz.mode } : null;
}

export function playBeep(n: number, freq: number) {
  const c = getAudioContext();
  if (!c) return;
  const t0 = c.currentTime;
  for (let i = 0; i < n; i++) {
    const o = c.createOscillator();
    const g = c.createGain();
    const t = t0 + i * 0.4;
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + 0.32);
  }
}
