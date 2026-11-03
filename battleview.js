/*
 * Pixel Ancients battle music: three original 8-bit loops synthesised with the Web Audio API (no audio files).
 * PixelMusic.play(id) / .playRandom() / .next() / .stop() / .setVolume(0..1) / .setMuted(bool) / .rotate = true|false
 */
(function (root) {
  const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const midi = n => { const m = n.match(/^([A-G][#b]?)(\d)$/); return 12 * (+m[2] + 1) + NOTE[m[1]]; };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const CHORD = { m: [0, 3, 7], M: [0, 4, 7] };
  const chord = c => { const m = c.match(/^([A-G][#b]?)(m?)$/); return { root: NOTE[m[1]], ivs: CHORD[m[2] ? 'm' : 'M'] }; };
  // lead: one string per bar, 16 tokens (note, '.' = hold, '-' = rest)
  const bars = s => s.split('|').map(b => b.trim().split(/\s+/));

  const TRACKS = {
    lane: {
      title: 'Lane Clash', mood: 'Heroic and driving: the default fight theme', bpm: 150, bass: 'octave', drums: 'rock', lead: 0.25,
      chords: 'Am Am F G Am Am F E F G Am Am F G E E'.split(' '),
      melody: bars(`A4 . . C5 . E5 . . D5 . C5 . B4 . C5 . | A4 . . . E4 . G4 . A4 . . . - - - - |
        F4 . A4 . C5 . . . B4 . A4 . G4 . . . | G4 . B4 . D5 . . . E5 . D5 . B4 . G4 . |
        A4 . . C5 . E5 . . A5 . G5 . E5 . C5 . | D5 . . . C5 . B4 . C5 . . . - - - - |
        F4 . A4 . C5 . F5 . E5 . . . D5 . C5 . | B4 . . . G#4 . . . E4 . . . - - - - |
        C5 . . . A4 . C5 . D5 . . . B4 . D5 . | E5 . . . . . . . C5 . D5 . E5 . G5 . |
        A5 . . . . . G5 . E5 . . . C5 . . . | A4 . C5 . E5 . A5 . G5 . E5 . C5 . . . |
        F5 . . . E5 . D5 . C5 . . . B4 . A4 . | G4 . . . B4 . D5 . G5 . F5 . D5 . B4 . |
        G#4 . . . B4 . . . E5 . . . G#5 . . . | B5 . . . . . . . - - - - E5 . G#5 .`),
    },
    roshan: {
      title: 'Roshan Pit', mood: 'Dark and heavy: a slow, menacing grind', bpm: 128, bass: 'gallop', drums: 'heavy', lead: 0.22, vib: 7,
      chords: 'Dm Dm Eb Dm Dm Dm Bb C Gm Gm Eb Eb Dm Dm A A'.split(' '),
      melody: bars(`D5 . . . . . . . F5 . . . E5 . D5 . | Eb5 . . . . . . . D5 . . . - - - - |
        Bb4 . . . G4 . . . Eb5 . . . D5 . . . | D5 . . . . . . . - - A4 . D5 . F5 . |
        A5 . . . G5 . F5 . E5 . . . F5 . E5 . | D5 . . . . . . . - - - - - - - - |
        F5 . . . D5 . Bb4 . C5 . . . E5 . G5 . | E5 . . . C5 . . . G4 . . . - - - - |
        G5 . . . F5 . D5 . Bb4 . . . D5 . G5 . | A5 . . . G5 . F5 . D5 . . . - - - - |
        Eb5 . . . G5 . Bb5 . G5 . . . Eb5 . . . | F5 . . . Eb5 . D5 . C5 . . . Bb4 . . . |
        A4 . . . D5 . F5 . A5 . . . . . . . | G5 . F5 . E5 . D5 . F5 . . . - - - - |
        C#5 . . . E5 . . . A5 . . . G5 . E5 . | C#5 . . . . . . . A4 . . . - - - -`),
    },
    highground: {
      title: 'High Ground Rush', mood: 'Fast and frantic: a last-push sprint', bpm: 166, bass: 'fifths', drums: 'dance', lead: 0.22,
      chords: 'Em C G D Em C G B C D Em Em C D G B'.split(' '),
      melody: bars(`E5 . B4 . E5 . G5 . F#5 . E5 . D5 . B4 . | C5 . E5 . G5 . . . A5 . G5 . E5 . C5 . |
        D5 . G5 . B5 . . . A5 . G5 . F#5 . D5 . | F#5 . . . E5 . D5 . A4 . . . D5 . F#5 . |
        G5 . . . F#5 . E5 . B4 . E5 . G5 . B5 . | A5 . . . G5 . E5 . C5 . . . E5 . G5 . |
        B5 . A5 . G5 . D5 . G5 . . . B4 . D5 . | D#5 . . . F#5 . . . B5 . . . A5 . F#5 . |
        G5 . . . E5 . . . C5 . E5 . G5 . C6 . | A5 . . . F#5 . . . D5 . F#5 . A5 . D6 . |
        B5 . . . . . . . G5 . A5 . B5 . E6 . | D6 . B5 . G5 . E5 . B4 . . . - - - - |
        C6 . . . B5 . A5 . G5 . . . E5 . G5 . | A5 . . . G5 . F#5 . D5 . . . F#5 . A5 . |
        G5 . . . B5 . D6 . . . . . B5 . G5 . | F#5 . . . D#5 . . . B4 . . . - - - -`),
    },
  };
  const IDS = Object.keys(TRACKS);

  // ---------- audio plumbing ----------
  let ctx = null, out = null, volume = 0.45, muted = false, noiseBuf = null, waves = {};
  function setup(c) {
    const g = c.createGain(); g.gain.value = muted ? 0 : volume;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000;   // takes the fizz off the square waves
    g.connect(lp); lp.connect(c.destination);
    const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), d = nb.getChannelData(0); let hold = 0, v = 0;
    for (let i = 0; i < d.length; i++) { if (hold-- <= 0) { v = Math.random() * 2 - 1; hold = 2; } d[i] = v; }
    const pulse = duty => { const n = 64, re = new Float32Array(n), im = new Float32Array(n); for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(Math.PI * k * duty); return c.createPeriodicWave(re, im); };
    return { out: g, noiseBuf: nb, waves: { p25: pulse(0.25), p125: pulse(0.125) } };
  }
  function ensure() {
    if (!ctx) { const AC = root.AudioContext || root.webkitAudioContext; if (!AC) return null; ctx = new AC(); ({ out, noiseBuf, waves } = setup(ctx)); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function osc(c, o, w, t, f, dur, gain, { vib = 0, slide = 0 } = {}) {
    const n = c.createOscillator(), g = c.createGain();
    if (w === 'tri' || w === 'sine') n.type = w === 'tri' ? 'triangle' : 'sine'; else n.setPeriodicWave(w);
    n.frequency.setValueAtTime(f, t); if (slide) n.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
    if (vib && dur > 0.2) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = vib; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(0.25, dur)); l.connect(lg); lg.connect(n.frequency); l.start(t); l.stop(t + dur + 0.05); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.setValueAtTime(gain, t + Math.max(0.01, dur - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(g); g.connect(o); n.start(t); n.stop(t + dur + 0.02);
  }
  function nz(c, o, nb, t, dur, gain, type, f) {
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = nb; fl.type = type; fl.frequency.value = f; g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(o); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  const kick = (c, o, t, g = 0.55) => { const n = c.createOscillator(), a = c.createGain(); n.type = 'sine'; n.frequency.setValueAtTime(150, t); n.frequency.exponentialRampToValueAtTime(42, t + 0.14); a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); n.connect(a); a.connect(o); n.start(t); n.stop(t + 0.22); };

  const DRUMS = {        // 16 steps: k = kick, s = snare, h = hat, o = open hat
    rock:  'k.h.s.h.k.hkshoh',
    heavy: 'k..kh.h.s..kh.hh',
    dance: 'khhhkhshkhhhkhsh',
  };
  // schedule one 16th step of a track at time t (c = context, a = {out, noiseBuf, waves})
  function step(c, a, tr, i, t) {
    const sp = 60 / tr.bpm / 4, total = tr.chords.length * 16, s = i % total, bar = Math.floor(s / 16), pos = s % 16;
    const ch = chord(tr.chords[bar]), o = a.out;
    // lead
    const tok = tr.melody[bar][pos];
    if (tok && tok !== '.' && tok !== '-') {
      let len = 1; for (let j = s + 1; j < total; j++) { const tk = tr.melody[Math.floor(j / 16)][j % 16]; if (tk === '.') len++; else break; }
      osc(c, o, a.waves.p25, t, hz(midi(tok)), len * sp * 0.95, tr.lead * 0.5, { vib: tr.vib || 5.5 });
      osc(c, o, a.waves.p125, t + sp * 0.75, hz(midi(tok)), len * sp * 0.9, tr.lead * 0.12);          // soft echo
    }
    // arpeggio (quiet, every 16th)
    const arpNotes = [0, 1, 2, 1].map(k => 60 + ch.root + ch.ivs[k] + (ch.root > 4 ? -12 : 0) + 12);
    osc(c, o, a.waves.p125, t, hz(arpNotes[pos % 4] + (pos >= 8 ? 12 : 0)), sp * 0.8, 0.045);
    // bass
    const r = 36 + ch.root + (ch.root > 6 ? -12 : 0) + 12;
    if (tr.bass === 'octave' && pos % 2 === 0) osc(c, o, 'tri', t, hz(r + (pos % 4 === 2 ? 12 : 0)), sp * 1.8, 0.42);
    if (tr.bass === 'gallop' && [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15].includes(pos)) osc(c, o, 'tri', t, hz(r - (pos % 4 === 0 ? 0 : 0)), sp * 0.9, 0.45);
    if (tr.bass === 'fifths' && pos % 2 === 0) osc(c, o, 'tri', t, hz(r + (pos % 8 === 4 ? 7 : 0) + (pos === 14 ? 12 : 0)), sp * 1.7, 0.4);
    // drums (+ a snare roll into every 4th bar)
    const d = DRUMS[tr.drums][pos], fill = bar % 4 === 3 && pos >= 12;
    if (d === 'k') kick(c, o, t, tr.drums === 'heavy' ? 0.65 : 0.55);
    if (d === 's' || fill) nz(c, o, a.noiseBuf, t, 0.12, fill ? 0.12 + (pos - 12) * 0.04 : 0.22, 'bandpass', 1800);
    if (d === 'h') nz(c, o, a.noiseBuf, t, 0.03, 0.07, 'highpass', 7000);
    if (d === 'o') nz(c, o, a.noiseBuf, t, 0.14, 0.08, 'highpass', 6000);
    if (s === 0) { nz(c, o, a.noiseBuf, t, 0.9, 0.12, 'highpass', 4000); }   // crash at the top of the loop
  }

  // ---------- live player (look-ahead scheduler) ----------
  let cur = null, idx = 0, nextT = 0, timer = 0, loops = 0, listeners = [], stopSeq = 0;
  const emit = () => listeners.forEach(f => f(api.state()));
  function tick() {
    if (!cur || !ctx) return;
    const tr = TRACKS[cur], sp = 60 / tr.bpm / 4, total = tr.chords.length * 16;
    while (nextT < ctx.currentTime + 0.15) {
      if (idx > 0 && idx % total === 0) {
        loops++;
        if (api.rotate) { const n = IDS[(IDS.indexOf(cur) + 1) % IDS.length]; cur = n; idx = 0; emit(); continue; }
      }
      step(ctx, { out, noiseBuf, waves }, TRACKS[cur], idx, nextT); idx++; nextT += sp;
    }
  }
  const api = {
    tracks: IDS.map(id => ({ id, title: TRACKS[id].title, mood: TRACKS[id].mood, bpm: TRACKS[id].bpm, seconds: Math.round(TRACKS[id].chords.length * 16 * 60 / TRACKS[id].bpm / 4) })),
    rotate: false,
    play(id) { if (!ensure() || !TRACKS[id]) return; stopSeq++; if (out) { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.value = muted ? 0 : volume; } cur = id; idx = 0; loops = 0; nextT = ctx.currentTime + 0.06; clearInterval(timer); timer = setInterval(tick, 25); tick(); emit(); },
    playRandom(except) { const pool = IDS.filter(i => i !== except); api.play(pool[Math.floor(Math.random() * pool.length)]); },
    next() { api.play(IDS[(IDS.indexOf(cur) + 1) % IDS.length] || IDS[0]); },
    stop(fade = 0.05) {
      clearInterval(timer); timer = 0; cur = null;
      if (out && ctx) { const g = out.gain; g.cancelScheduledValues(ctx.currentTime); g.setValueAtTime(g.value, ctx.currentTime); g.setTargetAtTime(0, ctx.currentTime, fade); const me = ++stopSeq; setTimeout(() => { if (out && me === stopSeq && !cur) { g.cancelScheduledValues(ctx.currentTime); g.value = muted ? 0 : volume; } }, fade * 6000); }
      emit();
    },
    ready() { return !!ctx && ctx.state === 'running'; },
    setVolume(v) { volume = Math.max(0, Math.min(1, v)); if (out) out.gain.value = muted ? 0 : volume; },
    setMuted(m) { muted = !!m; if (out) out.gain.value = muted ? 0 : volume; emit(); },
    get muted() { return muted; }, get volume() { return volume; },
    state() { return { playing: cur, muted, volume }; },
    onChange(f) { listeners.push(f); },
    unlock() { ensure(); },
    async renderOffline(id, AC) {   // test hook: whole loop into an OfflineAudioContext
      const tr = TRACKS[id], a = setup(AC), sp = 60 / tr.bpm / 4;
      for (let i = 0; i < tr.chords.length * 16; i++) step(AC, a, tr, i, 0.05 + i * sp);
      return AC.startRendering();
    },
    _check() { return IDS.map(id => TRACKS[id].melody.map((b, k) => b.length === 16 ? null : `${id} bar ${k + 1}: ${b.length} steps`)).flat().filter(Boolean).concat(IDS.map(id => TRACKS[id].melody.length === TRACKS[id].chords.length ? null : `${id}: ${TRACKS[id].melody.length} melody bars vs ${TRACKS[id].chords.length} chords`).filter(Boolean)); },
  };
  root.PixelMusic = api;
})(typeof window !== 'undefined' ? window : this);

/*
 * Pixel Ancients battle sounds: 8-bit effects synthesised with the Web Audio API (no audio files).
 * PixelSFX.play(name), .setVolume(0..1), .setMuted(bool). Sound only starts after a click (browser rule).
 */
(function (root) {
  let ctx = null, master = null, noiseBuf = null, volume = 0.6, muted = false, lastAt = {};
  function ensure() {
    if (!ctx) {
      const AC = root.AudioContext || root.webkitAudioContext; if (!AC) return null;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : volume;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); let hold = 0, v = 0;
      for (let i = 0; i < d.length; i++) { if (hold-- <= 0) { v = Math.random() * 2 - 1; hold = 3; } d[i] = v; }   // chunky 8-bit noise
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // square/triangle tone with a pitch slide and a quick decay
  function tone(t, { f0, f1 = f0, dur, type = 'square', gain = 0.25, attack = 0.004, vib = 0, delay = 0 }) {
    const o = ctx.createOscillator(), g = ctx.createGain(), s = t + delay;
    o.type = type; o.frequency.setValueAtTime(f0, s);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), s + dur);
    if (vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = vib; lg.gain.value = f0 * 0.12; l.connect(lg); lg.connect(o.frequency); l.start(s); l.stop(s + dur); }
    g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(gain, s + attack); g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
    o.connect(g); g.connect(master); o.start(s); o.stop(s + dur + 0.02);
  }
  function noise(t, { dur, gain = 0.25, filter = 'lowpass', f0 = 3000, f1 = f0, q = 0.7, delay = 0 }) {
    const n = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(), s = t + delay;
    n.buffer = noiseBuf; fl.type = filter; fl.Q.value = q; fl.frequency.setValueAtTime(f0, s);
    if (f1 !== f0) fl.frequency.exponentialRampToValueAtTime(f1, s + dur);
    g.gain.setValueAtTime(gain, s); g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
    n.connect(fl); fl.connect(g); g.connect(master); n.start(s); n.stop(s + dur + 0.02);
  }
  const notes = (t, list, step, opts) => list.forEach((f, i) => tone(t, { f0: f, dur: step * 1.1, delay: i * step, ...opts }));

  const SOUNDS = {
    hit:     t => { noise(t, { dur: 0.07, gain: 0.32, f0: 2200, f1: 500 }); tone(t, { f0: 300, f1: 110, dur: 0.08, gain: 0.18 }); },
    shot:    t => { tone(t, { f0: 1500, f1: 380, dur: 0.11, gain: 0.16 }); noise(t, { dur: 0.04, gain: 0.08, filter: 'highpass', f0: 3000 }); },
    cast:    t => { notes(t, [660, 880, 1320, 1760], 0.045, { type: 'square', gain: 0.1 }); tone(t, { f0: 2640, dur: 0.22, type: 'triangle', gain: 0.06, delay: 0.16, vib: 18 }); },
    crit:    t => { tone(t, { f0: 180, f1: 45, dur: 0.24, type: 'sine', gain: 0.5 }); noise(t, { dur: 0.16, gain: 0.35, f0: 4000, f1: 300 }); tone(t, { f0: 1760, dur: 0.09, gain: 0.12, delay: 0.03 }); tone(t, { f0: 2349, dur: 0.12, gain: 0.08, delay: 0.08 }); },
    miss:    t => noise(t, { dur: 0.14, gain: 0.42, filter: 'bandpass', f0: 600, f1: 3200, q: 1.2 }),
    block:   t => { tone(t, { f0: 1850, dur: 0.12, gain: 0.12 }); tone(t, { f0: 2470, dur: 0.16, gain: 0.08, delay: 0.01 }); noise(t, { dur: 0.03, gain: 0.12, filter: 'highpass', f0: 5000 }); },
    heal:    t => { notes(t, [880, 1175, 1568], 0.07, { type: 'triangle', gain: 0.16 }); },
    stun:    t => tone(t, { f0: 420, f1: 300, dur: 0.34, gain: 0.12, vib: 22 }),
    pet:     t => tone(t, { f0: 1200, f1: 1900, dur: 0.06, gain: 0.13 }),
    rune:    t => notes(t, [523, 659, 784, 1046, 1318, 1568], 0.035, { gain: 0.1 }),
    ko:      t => { tone(t, { f0: 620, f1: 70, dur: 0.38, gain: 0.18 }); noise(t, { dur: 0.1, gain: 0.18, f0: 900, f1: 200, delay: 0.3 }); },
    revive:  t => { notes(t, [392, 523, 659, 784], 0.065, { type: 'square', gain: 0.12 }); tone(t, { f0: 1046, dur: 0.3, type: 'triangle', gain: 0.12, delay: 0.26, vib: 8 }); },
    big:     t => { tone(t, { f0: 130, f1: 32, dur: 0.6, type: 'sine', gain: 0.6 }); noise(t, { dur: 0.5, gain: 0.4, f0: 2500, f1: 120 }); tone(t, { f0: 90, f1: 40, dur: 0.35, gain: 0.15, delay: 0.02 }); },
    victory: t => { notes(t, [523, 659, 784], 0.11, { gain: 0.14 }); tone(t, { f0: 1046, dur: 0.7, gain: 0.14, delay: 0.33, vib: 6 }); tone(t, { f0: 523, dur: 0.7, type: 'triangle', gain: 0.18, delay: 0.33 }); },
  };
  const GAP = { hit: 0.05, shot: 0.05, pet: 0.06, miss: 0.08, block: 0.08 };   // thins out repeats at high speed

  root.PixelSFX = {
    names: Object.keys(SOUNDS),
    play(name, speed = 1) {
      if (muted || !SOUNDS[name] || !ensure()) return;
      if (ctx.state !== 'running') return;   // not unlocked yet: skip rather than queue (avoids a burst on the first tap)
      const now = ctx.currentTime, gap = (GAP[name] || 0.03) * Math.max(1, speed);
      if (lastAt[name] && now - lastAt[name] < gap) return;
      lastAt[name] = now; SOUNDS[name](now + 0.005);
    },
    setVolume(v) { volume = Math.max(0, Math.min(1, v)); if (master) master.gain.value = muted ? 0 : volume; },
    setMuted(m) { muted = !!m; if (master) master.gain.value = muted ? 0 : volume; },
    get muted() { return muted; }, get volume() { return volume; },
    unlock() { ensure(); },
    _render(name, AC) {   // test hook: renders one sound into an OfflineAudioContext
      const saved = [ctx, master, noiseBuf]; ctx = AC; master = AC.createGain(); master.connect(AC.destination); noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; SOUNDS[name](0.01); [ctx, master, noiseBuf] = saved; },
  };
})(typeof window !== 'undefined' ? window : this);

/*
 * Battle replay arena: plays a LeagueBattle.simulate() result on a pixel canvas,
 * with playback controls and a GIF clip of the finish. Browser only.
 */
(function (root) {
  const A = () => root.LeagueAvatars;
  const W = 480, H = 300, SPR = 64;
  const STEP = 520;                              // ms per action at 1x
  // sprite top-left for each side / row / column (side b is mirrored)
  const SPOTS = { 0: [[150, 98], [150, 178]], 1: [[66, 56], [66, 136], [66, 216]] };
  const spot = (side, row, col) => { const [x, y] = SPOTS[row][col] || SPOTS[row][0]; return side === 'a' ? [x, y] : [W - x - SPR, y]; };
  const BOT_LOOK = {
    creep: { skin: 1, hair: 'short', hairColor: 0, tunic: 1, head: 'tower_helm', body: 'tunic', cape: 'none', weapon: 'training_sword', offhand: 'creep_buckler', boots: 'none', pet: 'none', aura: 'none' },
    guardian: { skin: 3, hair: 'mohawk', hairColor: 4, tunic: 4, head: 'unbroken_helm', body: 'offlane_plate', cape: 'radiant_banner', weapon: 'throne_breaker', offhand: 'none', boots: 'rat_treads', pet: 'none', aura: 'none' },
  };
  const CAST_NAME = { nuke: 'Nuke!', wombo: 'Wombo Combo!', waveClear: 'Wave Clear!', stomp: 'Stomp!', heal: 'Heal', healAll: 'Mass Heal', hex: 'Hex!', blink: 'Blink!' };
  const RUNE_NAME = { dd: 'Double Damage', haste: 'Haste', regen: 'Regen' };
  const FONT = '"Fira Sans", system-ui, sans-serif';

  // ---------- scene state ----------
  function makeScene(result) {
    const units = {};
    result.teams.forEach((t, ti) => t.units.forEach(u => {
      const side = ti ? 'b' : 'a';
      const [x, y] = spot(side, u.row, u.col);
      units[u.key] = { ...u, side, x, y, lo: u.bot ? BOT_LOOK[u.bot] : u.lo, hpNow: u.maxHp, alive: true, anim: 'idle', animT0: 0, dx: 0, phase: (x * 7 + y) % 16 };
    }));
    const steps = [];
    for (const e of result.events) { if (!steps[e.n]) steps[e.n] = []; steps[e.n].push(e); }
    return { result, units, steps, floaters: [], shots: [], shouts: [], applied: 0, ended: false, flash: 0 };
  }

  // which sound each replay event makes
  function soundOf(sc, e) {
    const U = k => sc.units[k];
    if (e.k === 'cast') return e.a === 'wombo' || e.a === 'stomp' || e.a === 'waveClear' ? 'big' : 'cast';
    if (e.k === 'hit') { if (e.miss) return 'miss'; if (!e.d || e.block) return 'block'; if (e.crit) return 'crit'; const s = U(e.s); return s && s.type !== 'melee' ? 'shot' : 'hit'; }
    if (e.k === 'pet') return e.miss ? null : 'pet';
    if (e.k === 'heal') { const t = U(e.t); return t && e.v >= t.maxHp * 0.2 ? 'heal' : null; }   // regen / lifesteal ticks stay quiet
    return { die: 'ko', revive: 'revive', save: 'revive', stun: 'stun', rune: 'rune', end: 'victory' }[e.k] || null;
  }
  // one step can hold many events: keep every special sound once, but only the strongest attack sound
  const ATTACK = ['crit', 'hit', 'shot', 'block', 'miss', 'pet'];
  function stepSounds(sc, evs) {
    const out = new Set(); let atk = null;
    const healCast = evs.some(e => e.k === 'cast' && (e.a === 'heal' || e.a === 'healAll'));
    for (const e of evs) {
      const snd = e.k === 'heal' && healCast ? 'heal' : soundOf(sc, e);
      if (!snd) continue;
      if (ATTACK.includes(snd)) { if (atk == null || ATTACK.indexOf(snd) < ATTACK.indexOf(atk)) atk = snd; }
      else out.add(snd);
    }
    if (atk) out.add(atk);
    return [...out];
  }

  function applyStep(sc, i, now) {
    const evs = sc.steps[i] || [];
    if (sc.sfx) stepSounds(sc, evs).forEach(n => sc.sfx(n));
    for (const e of evs) {
      const U = k => sc.units[k];
      if (e.k === 'act') { const u = U(e.u); u.anim = 'b_attack'; u.animT0 = now; if (u.type !== 'melee') u.anim = 'b_shoot'; u.lunge = u.type === 'melee' ? now : 0; }
      else if (e.k === 'cast') { const u = U(e.u); u.anim = 'b_cast'; u.animT0 = now; u.lunge = 0; sc.shouts.push({ x: u.x + SPR / 2, y: u.y - 14, text: CAST_NAME[e.a] || e.a, t0: now, color: '#ffcf4a' }); if (e.a === 'wombo' || e.a === 'stomp' || e.a === 'waveClear') sc.flash = now; }
      else if (e.k === 'hit' || e.k === 'pet') {
        const s = U(e.s), t = U(e.t);
        if (s && t && (s.type !== 'melee' || e.k === 'pet')) sc.shots.push({ x0: s.x + SPR / 2, y0: s.y + SPR / 2, x1: t.x + SPR / 2, y1: t.y + SPR / 2, t0: now, color: e.k === 'pet' ? '#8fc84f' : s.type === 'magic' ? '#b48aff' : '#ffd27a' });
        if (e.miss) { sc.floaters.push({ x: t.x + SPR / 2, y: t.y + 6, text: 'MISS', color: '#9aa3ab', t0: now + 120 }); continue; }
        t.hpNow = e.h; t.anim = 'b_hurt'; t.animT0 = now + 120;
        sc.floaters.push({ x: t.x + SPR / 2 + (e.k === 'pet' ? 10 : 0), y: t.y + 4, text: e.d ? e.d + (e.crit ? '!' : '') : 'SHIELD', color: !e.d ? '#a8d4f0' : e.crit ? '#ffcf4a' : e.k === 'pet' ? '#c8f5a0' : '#ffffff', big: !!e.crit && !!e.d, t0: now + 120 });
        if (e.block) sc.floaters.push({ x: t.x + SPR / 2, y: t.y - 6, text: 'BLOCK', color: '#a8d4f0', t0: now + 160 });
      } else if (e.k === 'dot' || e.k === 'guard' || e.k === 'thorns') {
        const t = U(e.t); if (!t) continue;
        if (e.h != null) t.hpNow = e.h;
        if (e.d) sc.floaters.push({ x: t.x + SPR / 2 + 12, y: t.y + 14, text: String(e.d), color: e.kind === 'burn' ? '#ff9a3d' : e.kind === 'bleed' ? '#e8553e' : '#d6cfc2', t0: now + 60 });
      } else if (e.k === 'heal') { const t = U(e.t); t.hpNow = e.h; sc.floaters.push({ x: t.x + SPR / 2 - 10, y: t.y + 10, text: '+' + e.v, color: '#8fd06a', t0: now + 150 }); }
      else if (e.k === 'die') { const t = U(e.t); t.alive = false; t.hpNow = 0; t.anim = 'b_ko'; t.animT0 = now + 250; }
      else if (e.k === 'revive') { const t = U(e.t); t.alive = true; t.hpNow = e.h; t.anim = 'b_cast'; t.animT0 = now + 250; sc.shouts.push({ x: t.x + SPR / 2, y: t.y - 14, text: 'Buyback!', color: '#ffcf4a', t0: now + 250 }); }
      else if (e.k === 'save') { const t = U(e.t); t.hpNow = e.h; sc.shouts.push({ x: t.x + SPR / 2, y: t.y - 14, text: 'Saved!', color: '#8fd06a', t0: now + 200 }); }
      else if (e.k === 'stun' || e.k === 'stunned') { const t = U(e.t || e.u); sc.floaters.push({ x: t.x + SPR / 2, y: t.y - 4, text: e.k === 'stun' ? 'STUN' : 'zzz', color: '#a8d4f0', t0: now + 160 }); }
      else if (e.k === 'rune') { const u = U(e.u); sc.shouts.push({ x: u.x + SPR / 2, y: u.y - 14, text: 'Rune: ' + RUNE_NAME[e.r], color: '#6fe0f0', t0: now }); }
      else if (e.k === 'counter') { const u = U(e.s); sc.shouts.push({ x: u.x + SPR / 2, y: u.y - 14, text: 'Counter!', color: '#ffb09a', t0: now }); }
      else if (e.k === 'end') { sc.ended = true; sc.endT = now; Object.values(sc.units).forEach(u => { if (u.alive && (u.side === 'a') === (e.w === 0)) { u.anim = 'b_win'; u.animT0 = now + 400; } }); }
    }
  }

  // ---------- drawing ----------
  function drawBg(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#16110f'); g.addColorStop(1, '#0c0d0e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // pixel floor
    for (let y = 160; y < H; y += 8) for (let x = 0; x < W; x += 8) { if ((x / 8 + y / 8) % 2) { ctx.fillStyle = 'rgba(255,255,255,0.025)'; ctx.fillRect(x, y, 8, 8); } }
    ctx.fillStyle = 'rgba(232,85,62,0.10)'; ctx.fillRect(0, 0, W / 2, H);
    ctx.fillStyle = 'rgba(143,200,79,0.07)'; ctx.fillRect(W / 2, 0, W / 2, H);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(W / 2 - 1, 40, 2, H - 40);
  }
  function text(ctx, s, x, y, color, size = 10, align = 'center', weight = 700) {
    ctx.font = `${weight} ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,8,7,0.9)'; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  function drawUnit(ctx, u, now) {
    const animTick = Math.max(0, Math.floor((now - u.animT0) / 130));
    let anim = u.anim, tick = animTick;
    const len = A().animLength(anim);
    if (anim !== 'idle' && anim !== 'b_ko' && anim !== 'b_win' && animTick >= len) { u.anim = anim = u.alive ? 'idle' : 'b_ko'; tick = Math.floor(now / 150) + u.phase; }
    if (anim === 'idle') tick = Math.floor(now / 150) + u.phase;
    if (anim === 'b_win') tick = animTick % len;
    if (!u.alive && anim !== 'b_ko') { anim = 'b_ko'; tick = 0; }
    let dx = 0;
    if (u.lunge && now - u.lunge < 360) { const p = (now - u.lunge) / 360; dx = Math.sin(p * Math.PI) * 26 * (u.side === 'a' ? 1 : -1); }
    const c = A().frameCanvas(u.lo, tick, anim, true);   // turned toward the enemy; side b is mirrored
    ctx.save();
    ctx.globalAlpha = u.alive ? 1 : 0.42;
    ctx.imageSmoothingEnabled = false;
    if (u.side === 'b') { ctx.translate(u.x + dx + SPR, u.y); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0, SPR, SPR); }
    else ctx.drawImage(c, u.x + dx, u.y, SPR, SPR);
    ctx.restore();
    if (u.alive) {
      const w = 40, x = u.x + (SPR - w) / 2, y = u.y - 4, pct = Math.max(0, u.hpNow / u.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(x - 1, y - 1, w + 2, 5);
      ctx.fillStyle = pct > 0.5 ? '#8fc84f' : pct > 0.25 ? '#e2b957' : '#e8553e'; ctx.fillRect(x, y, Math.round(w * pct), 3);
    }
    text(ctx, u.name.length > 13 ? u.name.slice(0, 12) + '…' : u.name, u.x + SPR / 2, u.y + SPR + 4, u.alive ? '#d6cfc2' : '#6c645c', 8, 'center', 600);
  }
  function drawHud(ctx, sc) {
    const [ta, tb] = sc.result.teams;
    const side = (t, side) => {
      const left = side === 'a';
      const hp = Object.values(sc.units).filter(u => u.side === side).reduce((s, u) => s + Math.max(0, u.hpNow) / u.maxHp, 0) / 5;
      const x = left ? 10 : W - 10;
      text(ctx, t.name.toUpperCase(), x, 11, left ? '#ffb09a' : '#c8f5a0', 11, left ? 'left' : 'right', 800);
      const badges = [`${Math.round(t.power)} power`].concat((t.runes || []).map(r => RUNE_NAME[r])).concat(t.underdog ? [`Underdog +${t.underdog}%`] : []);
      text(ctx, badges.join(' · '), x, 24, '#9aa3ab', 8, left ? 'left' : 'right', 600);
      const bw = 170, bx = left ? 10 : W - 10 - bw;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx, 32, bw, 4);
      ctx.fillStyle = left ? '#e8553e' : '#8fc84f'; const fill = Math.round(bw * hp); ctx.fillRect(left ? bx : bx + bw - fill, 32, fill, 4);
    };
    side(ta, 'a'); side(tb, 'b');
    text(ctx, 'VS', W / 2, 18, '#e2b957', 13, 'center', 900);
  }
  function drawFx(ctx, sc, now) {
    for (const s of sc.shots) {
      const p = (now - s.t0) / 160; if (p < 0 || p > 1) continue;
      const x = s.x0 + (s.x1 - s.x0) * p, y = s.y0 + (s.y1 - s.y0) * p - Math.sin(p * Math.PI) * 14;
      ctx.fillStyle = s.color; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
    }
    sc.shots = sc.shots.filter(s => now - s.t0 < 200);
    for (const f of sc.floaters) {
      const p = (now - f.t0) / 800; if (p < 0) continue;
      ctx.globalAlpha = Math.max(0, 1 - p * p);
      text(ctx, f.text, f.x, f.y - p * 22, f.color, f.big ? 15 : 10, 'center', 800);
      ctx.globalAlpha = 1;
    }
    sc.floaters = sc.floaters.filter(f => now - f.t0 < 800);
    for (const s of sc.shouts) {
      const p = (now - s.t0) / 1000; if (p < 0) continue;
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, p - 0.6) * 2.5);
      text(ctx, s.text, s.x, s.y - p * 6, s.color, 11, 'center', 800);
      ctx.globalAlpha = 1;
    }
    sc.shouts = sc.shouts.filter(s => now - s.t0 < 1000);
    if (sc.flash && now - sc.flash < 140) { ctx.fillStyle = `rgba(255,240,200,${0.18 * (1 - (now - sc.flash) / 140)})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawEnd(ctx, sc, now) {
    if (!sc.ended) return;
    const p = Math.min(1, (now - sc.endT - 500) / 400); if (p <= 0) return;
    const w = sc.result.teams[sc.result.winner];
    ctx.globalAlpha = p * 0.85; ctx.fillStyle = '#0c0d0e'; ctx.fillRect(0, 124, W, 54); ctx.globalAlpha = p;
    text(ctx, 'VICTORY', W / 2, 140, '#e2b957', 18, 'center', 900);
    text(ctx, w.name + (sc.result.reason === 'time' ? ' · won on HP left' : ''), W / 2, 162, '#f4efe6', 11, 'center', 700);
    ctx.globalAlpha = 1;
  }
  function draw(ctx, sc, now) {
    drawBg(ctx);
    const order = Object.values(sc.units).sort((a, b) => a.y - b.y);
    order.filter(u => !u.alive).forEach(u => drawUnit(ctx, u, now));
    order.filter(u => u.alive).forEach(u => drawUnit(ctx, u, now));
    drawFx(ctx, sc, now); drawHud(ctx, sc); drawEnd(ctx, sc, now);
  }

  // advance the scene to time t (ms since start at 1x)
  function advance(sc, t) {
    const last = sc.steps.length - 1;
    while (sc.applied <= last && sc.applied * STEP <= t) { applyStep(sc, sc.applied, sc.applied * STEP); sc.applied++; }
  }

  // ---------- player ----------
  function mount(el, result, opts = {}) {
    el.innerHTML = `
      <div class="arena-stage"><canvas width="${W}" height="${H}"></canvas></div>
      <div class="arena-bar">
        <button class="btn" data-a="play">Pause</button>
        <button class="btn" data-a="speed">Speed 1x</button>
        <button class="btn" data-a="skip">Skip to end</button>
        <button class="btn" data-a="restart">Replay</button>
        ${opts.gif === false ? '' : '<button class="btn" data-a="gif">Download GIF clip</button>'}
        ${root.PixelMusic ? '<button class="btn" data-a="music" aria-pressed="false"></button>' : ''}
        ${root.PixelSFX ? '<button class="btn" data-a="sound" aria-pressed="false"></button><input class="arena-vol" type="range" min="0" max="100" aria-label="Sound volume" style="width:84px;accent-color:#e8553e;vertical-align:middle;margin-left:-2px">' : ''}
        <span class="arena-msg" role="status"></span>
      </div>`;
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    let sc = makeScene(result), t = 0, speed = 1, playing = opts.autoplay !== false, lastFrame = 0, raf = 0, dead = false;
    // ---- sound: on by default, mute + volume remembered on this device ----
    const SFX = root.PixelSFX, keep = { get(k, d) { try { const v = localStorage.getItem('pa:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem('pa:' + k, JSON.stringify(v)); } catch {} } };
    const sndBtn = el.querySelector('[data-a="sound"]'), volIn = el.querySelector('.arena-vol');
    // ---- music: a random track per replay (never the same twice in a row), well under the sound effects ----
    const MUS = root.PixelMusic, MUSIC_LEVEL = 0.35, musBtn = el.querySelector('[data-a="music"]');
    const syncSound = () => {
      if (SFX) { sndBtn.textContent = SFX.muted ? '🔇 Sound off' : '🔊 Sound on'; sndBtn.setAttribute('aria-pressed', String(!SFX.muted)); volIn.value = Math.round(SFX.volume * 100); }
      if (MUS && musBtn) { musBtn.textContent = MUS.muted ? '🎵 Music off' : '🎵 Music on'; musBtn.setAttribute('aria-pressed', String(!MUS.muted)); }
    };
    const pickTrack = () => { const ids = MUS.tracks.map(x => x.id), last = keep.get('lastTrack', null), pool = ids.filter(i => i !== last); const id = pool[Math.floor(Math.random() * pool.length)]; keep.set('lastTrack', id); return id; };
    let track = MUS ? pickTrack() : null;
    if (SFX) { SFX.setMuted(keep.get('sfxMuted', false)); SFX.setVolume(keep.get('sfxVol', 0.6)); }
    if (MUS) { MUS.setMuted(keep.get('musicMuted', false)); MUS.setVolume((SFX ? SFX.volume : 0.6) * MUSIC_LEVEL); }
    syncSound();
    const musicTick = () => {
      if (!MUS) return;
      const want = !dead && playing && !sc.ended && !MUS.muted;
      if (want && !MUS.state().playing && MUS.ready()) MUS.play(track);
      else if (!want && MUS.state().playing) MUS.stop(sc.ended ? 0.45 : 0.08);   // fades out under the victory fanfare
    };
    const live = s => { if (SFX) s.sfx = name => { if (playing) SFX.play(name, speed); }; return s; };
    sc = live(sc);
    if (SFX) {
      const unlock = () => { SFX.unlock(); if (MUS) MUS.unlock(); document.removeEventListener('pointerdown', unlock, true); document.removeEventListener('keydown', unlock, true); };
      document.addEventListener('pointerdown', unlock, true); document.addEventListener('keydown', unlock, true);   // browsers allow sound after the first tap or key press
      volIn.oninput = () => { SFX.setVolume(volIn.value / 100); if (MUS) MUS.setVolume(SFX.volume * MUSIC_LEVEL); keep.set('sfxVol', SFX.volume); if (SFX.muted && +volIn.value > 0) { SFX.setMuted(false); keep.set('sfxMuted', false); } syncSound(); };
    }
    const reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { const f = sc.sfx; sc.sfx = null; advance(sc, Infinity); sc.sfx = f; t = sc.steps.length * STEP + 2000; playing = false; }
    const loop = ts => {
      if (dead || !el.isConnected) { dead = true; if (MUS) MUS.stop(); return; }
      const dt = lastFrame ? Math.min(100, ts - lastFrame) : 0; lastFrame = ts;
      if (playing) t += dt * speed;
      advance(sc, t);
      draw(ctx, sc, t); musicTick();
      if (sc.ended && t - sc.endT > 2500 && playing) { playing = false; setBtn(); if (opts.onEnd) opts.onEnd(); }
      raf = requestAnimationFrame(loop);
    };
    const setBtn = () => { el.querySelector('[data-a="play"]').textContent = playing ? 'Pause' : sc.ended ? 'Done' : 'Play'; };
    el.querySelector('.arena-bar').onclick = async e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      const act = a.dataset.a;
      if (act === 'play') { if (!sc.ended) playing = !playing; setBtn(); }
      if (act === 'speed') { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; a.textContent = `Speed ${speed}x`; }
      if (act === 'skip') { const f = sc.sfx; sc.sfx = null; t = sc.steps.length * STEP + 600; advance(sc, t); sc.sfx = f; sc.floaters = []; sc.shots = []; sc.shouts = []; }
      if (act === 'restart') { sc = live(makeScene(result)); t = 0; playing = true; setBtn(); if (MUS) { MUS.stop(); track = pickTrack(); } }
      if (act === 'music' && MUS) { MUS.unlock(); MUS.setMuted(!MUS.muted); keep.set('musicMuted', MUS.muted); syncSound(); }
      if (act === 'sound' && SFX) { SFX.unlock(); SFX.setMuted(!SFX.muted); keep.set('sfxMuted', SFX.muted); syncSound(); if (!SFX.muted) SFX.play('pet'); }
      if (act === 'gif') {
        const msg = el.querySelector('.arena-msg'); msg.textContent = 'Making the clip…'; a.disabled = true;
        await new Promise(r => setTimeout(r, 30));
        try {
          const bytes = gifClip(result, opts), name = (opts.fileName || 'pixel-ancients-fight') + '.gif';
          const size = `${(bytes.length / 1024 / 1024).toFixed(1)} MB`;
          // inside the Claude preview, files go through its save prompt; on the real site, a normal download
          const dl = root.claude && typeof root.claude.use === 'function' ? await root.claude.use('downloads') : null;
          if (dl) {
            try { await dl.save({ filename: name, data: new Blob([bytes]) }); msg.textContent = `Saved a ${size} clip. Drop it in Discord.`; }
            catch (err) { msg.textContent = err && err.code === 'declined' ? 'Clip not saved.' : 'Saving isn\'t available here.'; }
          } else {
            const url = URL.createObjectURL(new Blob([bytes], { type: 'image/gif' }));
            const link = document.createElement('a'); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
            msg.textContent = `Saved a ${size} clip. Drop it in Discord.`;
          }
        } catch (err) { msg.textContent = 'Couldn\'t make the clip on this device.'; }
        a.disabled = false;
      }
    };
    raf = requestAnimationFrame(loop);
    return { stop() { dead = true; cancelAnimationFrame(raf); if (MUS) MUS.stop(); }, scene: () => sc, time: () => t };
  }

  // ---------- GIF clip of the finish ----------
  // Renders the last ~12 actions plus the victory screen at 12 fps and encodes a GIF in the browser.
  function gifClip(result, opts = {}) {
    const fps = 12, speed = 1.6, scale = opts.gifScale || 1;
    const sc = makeScene(result);
    const total = sc.steps.length;
    const startStep = Math.max(1, total - (opts.gifSteps || 12));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
    let t = startStep * STEP - 10;
    advance(sc, t); sc.floaters = []; sc.shots = []; sc.shouts = [];
    const frames = [];
    const end = total * STEP + 2200;
    while (t < end && frames.length < 160) {
      advance(sc, t); draw(ctx, sc, t);
      frames.push(ctx.getImageData(0, 0, W, H).data);
      t += (1000 / fps) * speed;
    }
    return encodeGif(frames, W, H, Math.round(100 / fps), scale);
  }

  // Minimal GIF89a encoder: one global palette (most common colors), LZW, looping.
  function encodeGif(frames, w, h, delayCs) {
    const counts = new Map();
    frames.forEach((f, fi) => { if (fi % 3) return; for (let i = 0; i < f.length; i += 8) { const k = ((f[i] >> 3) << 10) | ((f[i + 1] >> 3) << 5) | (f[i + 2] >> 3); counts.set(k, (counts.get(k) || 0) + 1); } });
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 256).map(([k]) => k);
    while (top.length < 256) top.push(0);
    const pal = top.map(k => [((k >> 10) & 31) << 3 | 4, ((k >> 5) & 31) << 3 | 4, (k & 31) << 3 | 4]);
    const lut = new Int16Array(32768).fill(-1);
    const nearest = k => {
      if (lut[k] >= 0) return lut[k];
      const r = ((k >> 10) & 31) << 3, g = ((k >> 5) & 31) << 3, b = (k & 31) << 3;
      let best = 0, bd = 1e9;
      for (let i = 0; i < 256; i++) { const p = pal[i], d = (p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2; if (d < bd) { bd = d; best = i; } }
      lut[k] = best; return best;
    };
    const out = [];
    const b = v => out.push(v & 255), w16 = v => { b(v); b(v >> 8); }, str = s => { for (const c of s) b(c.charCodeAt(0)); };
    str('GIF89a'); w16(w); w16(h); b(0xf7); b(0); b(0);
    pal.forEach(p => { b(p[0]); b(p[1]); b(p[2]); });
    b(0x21); b(0xff); b(11); str('NETSCAPE2.0'); b(3); b(1); w16(0); b(0);
    const idx = new Uint8Array(w * h);
    for (const f of frames) {
      for (let i = 0, j = 0; j < idx.length; i += 4, j++) idx[j] = nearest(((f[i] >> 3) << 10) | ((f[i + 1] >> 3) << 5) | (f[i + 2] >> 3));
      b(0x21); b(0xf9); b(4); b(0); w16(delayCs); b(0); b(0);
      b(0x2c); w16(0); w16(0); w16(w); w16(h); b(0);
      lzw(idx, 8, out);
    }
    b(0x3b);
    return new Uint8Array(out);
  }
  function lzw(pixels, minCode, out) {
    out.push(minCode);
    const clear = 1 << minCode, eoi = clear + 1;
    let dict = new Map(), next = eoi + 1, size = minCode + 1;
    let buf = 0, bits = 0; const block = [];
    const emit = code => { buf |= code << bits; bits += size; while (bits >= 8) { block.push(buf & 255); buf >>= 8; bits -= 8; if (block.length === 255) { out.push(255, ...block); block.length = 0; } } };
    emit(clear);
    let prefix = pixels[0];
    for (let i = 1; i < pixels.length; i++) {
      const k = pixels[i], key = prefix * 256 + k;
      const hit = dict.get(key);
      if (hit !== undefined) { prefix = hit; continue; }
      emit(prefix);
      if (next === 4096) { emit(clear); dict = new Map(); next = eoi + 1; size = minCode + 1; }
      else { if (next >= (1 << size)) size++; dict.set(key, next++); }
      prefix = k;
    }
    emit(prefix); emit(eoi);
    if (bits > 0) block.push(buf & 255);
    if (block.length) out.push(block.length, ...block);
    out.push(0);
  }

  root.LeagueArena = { mount, gifClip, encodeGif, makeScene, STEP, W, H };
})(typeof self !== 'undefined' ? self : this);
