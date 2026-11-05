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
    // ---- finisher (Fight Night final blow) ----
    f_freeze:  t => { tone(t, { f0: 170, f1: 38, dur: 0.5, type: 'sine', gain: 0.65 }); noise(t, { dur: 0.22, gain: 0.45, f0: 3200, f1: 180 }); tone(t, { f0: 2637, dur: 0.5, type: 'triangle', gain: 0.07, delay: 0.05, vib: 7 }); },
    f_whoosh:  t => { noise(t, { dur: 0.32, gain: 0.32, filter: 'bandpass', f0: 300, f1: 4200, q: 1.4 }); tone(t, { f0: 220, f1: 880, dur: 0.28, type: 'triangle', gain: 0.05 }); },
    f_card:    t => { tone(t, { f0: 110, f1: 55, dur: 0.3, type: 'sine', gain: 0.55 }); noise(t, { dur: 0.08, gain: 0.3, f0: 2000, f1: 300 }); notes(t, [440, 523, 659], 0.0, { dur: 0.42, gain: 0.07 }); tone(t, { f0: 880, dur: 0.42, type: 'triangle', gain: 0.08, vib: 5 }); },
    f_taunt:   t => { tone(t, { f0: 988, f1: 1319, dur: 0.07, gain: 0.1 }); tone(t, { f0: 1319, f1: 1760, dur: 0.08, gain: 0.08, delay: 0.07 }); },
    // melee: charge, dash, two cuts, the big impact, the burning split
    f_charge:  t => { tone(t, { f0: 140, f1: 720, dur: 0.4, gain: 0.1, vib: 26 }); noise(t, { dur: 0.4, gain: 0.16, filter: 'bandpass', f0: 400, f1: 2600, q: 2 }); },
    f_dash:    t => { noise(t, { dur: 0.2, gain: 0.4, filter: 'highpass', f0: 800, f1: 5000 }); tone(t, { f0: 600, f1: 1800, dur: 0.16, gain: 0.06 }); },
    f_slash:   t => { noise(t, { dur: 0.12, gain: 0.45, filter: 'highpass', f0: 7000, f1: 1500 }); tone(t, { f0: 1400, f1: 320, dur: 0.1, gain: 0.12 }); },
    f_impact:  t => { tone(t, { f0: 150, f1: 28, dur: 0.9, type: 'sine', gain: 0.8 }); noise(t, { dur: 0.7, gain: 0.5, f0: 5000, f1: 90 }); tone(t, { f0: 98, f1: 49, dur: 0.5, gain: 0.16 }); tone(t, { f0: 1976, dur: 0.6, type: 'triangle', gain: 0.07, delay: 0.04, vib: 9 }); },
    f_split:   t => { noise(t, { dur: 0.45, gain: 0.22, filter: 'bandpass', f0: 1800, f1: 600, q: 0.9 }); tone(t, { f0: 330, f1: 220, dur: 0.4, gain: 0.06, vib: 30 }); },
    // ranged: light gathering, the speed-of-light shot, slow motion, the burst
    f_gather:  t => { tone(t, { f0: 330, f1: 2640, dur: 0.52, type: 'triangle', gain: 0.12 }); tone(t, { f0: 660, f1: 5280, dur: 0.52, type: 'sine', gain: 0.05, vib: 14 }); noise(t, { dur: 0.52, gain: 0.08, filter: 'highpass', f0: 6000, f1: 2000 }); },
    f_beam:    t => { tone(t, { f0: 3136, f1: 520, dur: 0.24, gain: 0.16 }); noise(t, { dur: 0.18, gain: 0.3, filter: 'highpass', f0: 4000, f1: 1200 }); tone(t, { f0: 1568, f1: 260, dur: 0.3, type: 'triangle', gain: 0.1 }); },
    f_slowmo:  t => { tone(t, { f0: 392, f1: 98, dur: 0.36, type: 'triangle', gain: 0.14 }); noise(t, { dur: 0.36, gain: 0.1, filter: 'lowpass', f0: 1200, f1: 200 }); },
    f_burst:   t => { tone(t, { f0: 140, f1: 35, dur: 0.6, type: 'sine', gain: 0.6 }); notes(t, [1568, 2093, 2637, 3136], 0.03, { gain: 0.08 }); noise(t, { dur: 0.45, gain: 0.35, filter: 'highpass', f0: 2500, f1: 600 }); },
    // magic: rune circle, the sky cracking, the pillar slam, a low hum
    f_rune:    t => { notes(t, [220, 262, 311, 370, 440], 0.09, { type: 'triangle', gain: 0.12, vib: 6 }); tone(t, { f0: 110, dur: 0.9, type: 'sine', gain: 0.22, vib: 3 }); },
    f_crack:   t => { for (let i = 0; i < 6; i++) noise(t, { dur: 0.05, gain: 0.3, filter: 'bandpass', f0: 1200 + i * 500, q: 3, delay: i * 0.05 }); tone(t, { f0: 1760, f1: 880, dur: 0.35, gain: 0.05, vib: 20 }); },
    f_pillar:  t => { tone(t, { f0: 1400, f1: 90, dur: 0.12, gain: 0.14 }); tone(t, { f0: 120, f1: 26, dur: 1.0, type: 'sine', gain: 0.85, delay: 0.08 }); noise(t, { dur: 0.8, gain: 0.5, f0: 3500, f1: 80, delay: 0.08 }); tone(t, { f0: 311, dur: 0.8, type: 'triangle', gain: 0.08, delay: 0.1, vib: 5 }); },
    // shared: the shatter, the slow hold, the final-blow pose, the guild fanfare, the mini
    f_shatter: t => { noise(t, { dur: 0.5, gain: 0.35, filter: 'highpass', f0: 6000, f1: 2500 }); [3520, 2794, 4186, 3136, 4699, 2349, 3951].forEach((f, i) => tone(t, { f0: f, f1: f * 0.92, dur: 0.12, type: 'triangle', gain: 0.07, delay: 0.02 + i * 0.045 })); tone(t, { f0: 90, f1: 30, dur: 0.5, type: 'sine', gain: 0.45 }); },
    f_hold:    t => { tone(t, { f0: 55, dur: 1.9, type: 'sine', gain: 0.18, vib: 2 }); tone(t, { f0: 659, dur: 1.6, type: 'triangle', gain: 0.03, delay: 0.2, vib: 4 }); },
    f_hero:    t => { notes(t, [392, 523, 659, 784], 0.09, { gain: 0.12 }); tone(t, { f0: 1046, dur: 0.9, gain: 0.12, delay: 0.36, vib: 6 }); tone(t, { f0: 523, dur: 0.9, type: 'triangle', gain: 0.18, delay: 0.36 }); tone(t, { f0: 131, f1: 65, dur: 0.4, type: 'sine', gain: 0.4 }); },
    f_guild:   t => {
      const drum = d => { tone(t, { f0: 120, f1: 40, dur: 0.22, type: 'sine', gain: 0.55, delay: d }); noise(t, { dur: 0.12, gain: 0.25, f0: 1800, f1: 200, delay: d }); };
      [0, 0.18, 0.36, 0.72].forEach(drum);
      notes(t, [523, 523, 523], 0.18, { gain: 0.12 }); tone(t, { f0: 659, dur: 0.34, gain: 0.13, delay: 0.54 });
      [[523, 659, 784], [587, 740, 880]].forEach((ch, j) => ch.forEach(f => tone(t, { f0: f, dur: 0.36, gain: 0.07, delay: 0.72 + j * 0.36 })));
      [1046, 1318, 1568].forEach(f => tone(t, { f0: f, dur: 1.6, gain: 0.07, delay: 1.44, vib: 5 })); tone(t, { f0: 262, dur: 1.6, type: 'triangle', gain: 0.2, delay: 1.44 });
      noise(t, { dur: 1.4, gain: 0.16, filter: 'highpass', f0: 7000, f1: 4000, delay: 1.44 }); drum(1.44);
    },
    f_mini:    t => { tone(t, { f0: 160, f1: 50, dur: 0.3, type: 'sine', gain: 0.45 }); noise(t, { dur: 0.12, gain: 0.3, f0: 3000, f1: 300 }); tone(t, { f0: 784, dur: 0.09, gain: 0.1, delay: 0.12 }); tone(t, { f0: 1046, dur: 0.2, gain: 0.1, delay: 0.2, vib: 6 }); },
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
  const CAST_NAME = { nuke: 'Nuke!', wombo: 'Wombo Combo!', waveClear: 'Wave Clear!', stomp: 'Stomp!', heal: 'Heal', healAll: 'Mass Heal', hex: 'Hex!', blink: 'Blink!', silence: 'Silence!', fizzle: 'Fizzled', resist: 'Resisted', wipe: 'Team Wipe!', harden: 'Harden!', arcane: 'Arcane!', glimmer: 'Glimmer', courier: 'Courier', bottle: 'Bottle' };
  const RUNE_NAME = { dd: 'Amplify Damage', haste: 'Haste', regen: 'Regeneration', water: 'Water' };
  // short effect text for a rune, from the battle settings (e.g. "+15% atk")
  function runeFx(r) {
    const B = root.LeagueBattle, fx = B && B.RUNES[r] ? B.RUNES[r].fx : {};
    return Object.entries(fx).map(([k, v]) => (k === 'atkPct' ? `+${v}% atk` : k === 'spd' ? `+${v} spd` : k === 'regen' ? `+${v} HP/turn` : '')).filter(Boolean).join(' ');
  }
  const runeImg = (r, now) => { const A = root.LeagueAvatars; return A && A.runeCanvas ? A.runeCanvas(r, Math.floor((now || 0) / 260) & 3) : null; };
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
    return { result, units, steps, floaters: [], shots: [], shouts: [], applied: 0, ended: false, flash: 0, scene: sceneFor(result) };
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
    // round start: each guild's runes float up over its team
    if (i === 0) sc.result.teams.forEach((t, ti) => (t.runes || []).forEach((r, k) => {
      const side = ti ? 'b' : 'a', us = Object.values(sc.units).filter(u => u.side === side && u.row === 0);
      const cx = us.length ? us.reduce((s, u) => s + u.x, 0) / us.length + SPR / 2 : (side === 'a' ? 180 : W - 180);
      sc.shouts.push({ x: cx, y: 92, text: 'Rune: ' + RUNE_NAME[r], color: '#6fe0f0', t0: now + 150 + k * 1500, rune: r, long: true });
    }));
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
      else if (e.k === 'rune') { const u = U(e.u); sc.shouts.push({ x: u.x + SPR / 2, y: u.y - 14, text: 'Rune: ' + RUNE_NAME[e.r], color: '#6fe0f0', t0: now, rune: e.r }); }
      else if (e.k === 'counter') { const u = U(e.s); sc.shouts.push({ x: u.x + SPR / 2, y: u.y - 14, text: 'Counter!', color: '#ffb09a', t0: now }); }
      else if (e.k === 'end') { sc.ended = true; sc.endT = now; Object.values(sc.units).forEach(u => { if (u.alive && (u.side === 'a') === (e.w === 0)) { u.anim = 'b_win'; u.animT0 = now + 400; } }); }
    }
  }

  // ---------- drawing ----------
  // ---------- battleground: a dim, original pixel scene ----------
  // Left half: scorched "dire-style" ground with dead trees, ember cracks and a dark spire.
  // Right half: grassy "radiant-style" ground with trees and a pale stone spire. A shallow river splits them,
  // with a rune spot that glows slowly. Everything stays low-contrast so the fighters read first.
  const BG = {};
  function bgCanvas() {
    const cv = document.createElement('canvas'), K = 3; cv.width = W * K; cv.height = H * K;
    const c = cv.getContext('2d'); c.scale(K, K); c.imageSmoothingEnabled = false;
    const px = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const finish = () => {
      // faint team tint per half, a soft vignette, and a plain header strip for names and HP bars
      px(0, 40, W / 2, H - 40, 'rgba(232,85,62,0.035)'); px(W / 2, 40, W / 2, H - 40, 'rgba(143,200,79,0.03)');
      const v = c.createRadialGradient(W / 2, H / 2 + 20, 120, W / 2, H / 2 + 20, 330); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
      const hd = c.createLinearGradient(0, 0, 0, 44); hd.addColorStop(0, 'rgba(10,9,9,0.92)'); hd.addColorStop(1, 'rgba(10,9,9,0)'); c.fillStyle = hd; c.fillRect(0, 0, W, 44);
      return cv;
    };
    return { cv, c, px, rnd, finish };
  }
  // Scene 1 — River: scorched ground and a dark spire on the left, grass and a pale spire on the right, a river between
  function buildRiver() {
    const { c, px, rnd, finish } = bgCanvas();
    const riverX = y => 240 + Math.round(Math.sin(y / 38) * 7);          // centre line of the river
    // ground
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120d0c'); g.addColorStop(1, '#0d0c0b'); px(0, 0, W, H, g);
    for (let y = 40; y < H; y++) { const rx = riverX(y); px(0, y, rx - 20, 1, y % 2 ? '#1c1210' : '#1a110f'); px(rx + 20, y, W - rx - 20, 1, y % 2 ? '#111a10' : '#10180f'); }
    // ground speckle: ash and embers on the left, grass tufts on the right
    for (let i = 0; i < 420; i++) {
      const x = Math.floor(rnd() * W), y = 44 + Math.floor(rnd() * (H - 46)), rx = riverX(y);
      if (Math.abs(x - rx) < 24) continue;
      if (x < rx) px(x, y, 2, 1, rnd() < 0.08 ? 'rgba(232,85,62,0.35)' : 'rgba(90,60,50,0.35)');
      else { const col = rnd() < 0.5 ? 'rgba(95,160,74,0.28)' : 'rgba(60,110,50,0.32)'; px(x, y, 1, 2, col); px(x + 1, y + 1, 1, 1, col); }
    }
    // ember cracks (left)
    [[18, 196, 26], [120, 270, 30], [60, 118, 18], [182, 240, 20]].forEach(([x, y, len]) => { for (let k = 0; k < len; k++) px(x + k, y + Math.round(Math.sin(k / 3) * 1.5), 1, 1, k % 5 ? 'rgba(194,60,42,0.30)' : 'rgba(255,122,61,0.45)'); });
    // stone path tiles (right)
    for (let k = 0; k < 7; k++) { const x = 300 + k * 22, y = 286 - (k % 2) * 3; px(x, y, 12, 5, 'rgba(120,130,120,0.16)'); px(x, y, 12, 1, 'rgba(200,210,200,0.10)'); }
    // river
    for (let y = 40; y < H; y++) {
      const rx = riverX(y), w = 15 + Math.round(Math.sin(y / 23) * 2);
      px(rx - w - 3, y, 3, 1, 'rgba(60,70,60,0.5)'); px(rx + w, y, 3, 1, 'rgba(60,70,60,0.5)');                         // banks
      px(rx - w, y, w * 2, 1, y % 2 ? '#10232c' : '#0f2230');
      if ((y * 7) % 11 === 0) px(rx - w + ((y * 13) % (w * 2 - 6)), y, 6, 1, 'rgba(150,200,230,0.13)');               // ripples
    }
    // dead trees (left) and leafy trees (right), in the margins and the back
    const dead = (x, y, h) => { px(x, y - h, 2, h, '#24171a'); px(x - 4, y - h + 4, 4, 1, '#24171a'); px(x - 5, y - h + 3, 1, 1, '#24171a'); px(x + 2, y - h + 7, 5, 1, '#24171a'); px(x + 6, y - h + 6, 1, 1, '#24171a'); px(x - 3, y - h + 10, 3, 1, '#24171a'); };
    const tree = (x, y, s) => { px(x, y - 4, 2, 4, '#2a2014'); px(x - s, y - 4 - s, s * 2 + 2, s, '#173016'); px(x - s + 1, y - 5 - s * 2 + 2, s * 2, s - 1, '#1c3a1a'); px(x - s + 2, y - 4 - s, 3, 1, '#28502a'); px(x - 1, y - 5 - s * 2 + 1, 4, 1, '#28502a'); };
    [[14, 262, 22], [40, 200, 16], [8, 150, 18], [196, 66, 14], [30, 92, 12]].forEach(([x, y, h]) => dead(x, y, h));
    [[462, 262, 6], [438, 196, 5], [470, 150, 5], [284, 70, 4], [452, 96, 4]].forEach(([x, y, s]) => tree(x, y, s));
    // distant spires: dark with a red crystal (left), pale stone with a green crystal (right)
    const spire = (x, body, edge, crystal, glow) => {
      px(x, 70, 14, 64, body); px(x + 2, 62, 10, 8, body); px(x + 4, 56, 6, 6, body); px(x, 70, 2, 64, edge); px(x - 2, 132, 18, 4, body);
      const rg = c.createRadialGradient(x + 7, 50, 1, x + 7, 50, 18); rg.addColorStop(0, glow); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.fillRect(x - 12, 32, 38, 38);
      px(x + 5, 46, 4, 7, crystal); px(x + 6, 44, 2, 2, crystal);
    };
    spire(22, '#1d1416', '#2c1c1e', '#c23c2a', 'rgba(232,85,62,0.28)');
    spire(444, '#262b28', '#353c37', '#6fd16a', 'rgba(143,200,79,0.22)');
    return finish();
  }
  // Scene 2 — Cavern: a deep lair with stalactites, a glowing pit in the middle, crystals and cave mushrooms
  function buildCavern() {
    const { c, px, rnd, finish } = bgCanvas();
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d0b10'); g.addColorStop(1, '#100e13'); px(0, 0, W, H, g);
    for (let y = 40; y < H; y += 2) px(0, y, W, 1, 'rgba(255,255,255,0.012)');
    // floor stones and pebbles
    for (let i = 0; i < 300; i++) { const x = Math.floor(rnd() * W), y = 60 + Math.floor(rnd() * (H - 62)); if (Math.abs(x - 240) < 30 && y > 150) continue; px(x, y, 1 + Math.floor(rnd() * 3), 1, rnd() < 0.5 ? 'rgba(120,110,140,0.20)' : 'rgba(70,64,84,0.35)'); }
    // stalactites hanging from the ceiling, behind the header
    for (let x = 4; x < W; x += 14 + Math.floor(rnd() * 10)) { const h = 10 + Math.floor(rnd() * 22); for (let k = 0; k < h; k++) { const w = Math.max(1, Math.round((h - k) / h * 6)); px(x - (w >> 1), 36 + k, w, 1, k % 3 ? '#1a1620' : '#221d2a'); } }
    // the pit: a wide sunken crater with a rim of stones and a faint ember glow at the bottom
    for (let y = 226; y < 272; y++) { const t = (y - 249) / 23, w = Math.round(Math.sqrt(Math.max(0, 1 - t * t)) * 26); if (w <= 0) continue; px(240 - w, y, w * 2, 1, y < 236 ? '#0c0b10' : '#07060a'); px(240 - w - 3, y, 3, 1, 'rgba(110,100,130,0.40)'); px(240 + w, y, 3, 1, 'rgba(70,64,84,0.55)'); }
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2, x = Math.round(240 + Math.cos(a) * 29), y = Math.round(249 + Math.sin(a) * 25); px(x - 2, y - 1, 4, 3, 'rgba(90,82,104,0.55)'); px(x - 2, y - 1, 4, 1, 'rgba(150,140,170,0.35)'); }
    const pg = c.createRadialGradient(240, 254, 2, 240, 254, 26); pg.addColorStop(0, 'rgba(255,122,61,0.26)'); pg.addColorStop(0.6, 'rgba(120,40,20,0.10)'); pg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = pg; c.fillRect(208, 224, 64, 50);
    // crystal clusters in the corners (purple, left / teal, right)
    const crystal = (x, y, col, hi) => { [[0, 0, 3, 10], [3, 3, 3, 7], [-3, 4, 3, 6], [6, 6, 2, 4]].forEach(([dx, dy, w, h]) => { px(x + dx, y - h + dy, w, h, col); px(x + dx, y - h + dy, 1, h, hi); }); };
    crystal(18, 120, 'rgba(138,90,214,0.55)', 'rgba(200,170,255,0.45)'); crystal(30, 270, 'rgba(138,90,214,0.45)', 'rgba(200,170,255,0.35)');
    crystal(452, 124, 'rgba(54,183,154,0.50)', 'rgba(170,255,230,0.40)'); crystal(440, 272, 'rgba(54,183,154,0.45)', 'rgba(170,255,230,0.35)');
    // bones near the pit
    [[206, 286], [262, 176], [218, 160], [274, 292]].forEach(([x, y]) => { px(x, y, 6, 1, 'rgba(220,210,190,0.30)'); px(x - 1, y - 1, 2, 3, 'rgba(220,210,190,0.30)'); px(x + 5, y - 1, 2, 3, 'rgba(220,210,190,0.30)'); });
    // stone pillars at both edges
    [[6, '#17141c', '#201b27'], [460, '#17141c', '#201b27']].forEach(([x, b, e]) => { px(x, 60, 14, 240, b); px(x, 60, 2, 240, e); for (let y = 76; y < 300; y += 26) px(x, y, 14, 1, 'rgba(0,0,0,0.5)'); });
    return finish();
  }
  // Scene 3 — Frost: a winter field at night with pines, a frozen river and drifting snow
  function buildFrost() {
    const { c, px, rnd, finish } = bgCanvas();
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d1116'); g.addColorStop(1, '#141a20'); px(0, 0, W, H, g);
    for (let y = 40; y < H; y++) px(0, y, W, 1, y % 2 ? 'rgba(190,210,225,0.035)' : 'rgba(190,210,225,0.02)');
    for (let i = 0; i < 360; i++) { const x = Math.floor(rnd() * W), y = 44 + Math.floor(rnd() * (H - 46)); if (Math.abs(x - 240) < 22) continue; px(x, y, 1 + Math.floor(rnd() * 2), 1, rnd() < 0.6 ? 'rgba(210,225,240,0.20)' : 'rgba(150,170,190,0.25)'); }
    // frozen river with cracks
    const rx = y => 240 + Math.round(Math.sin(y / 44 + 1) * 6);
    for (let y = 40; y < H; y++) { const x = rx(y), w = 14; px(x - w - 2, y, 2, 1, 'rgba(210,225,240,0.25)'); px(x + w, y, 2, 1, 'rgba(210,225,240,0.25)'); px(x - w, y, w * 2, 1, y % 2 ? '#18303c' : '#172d3a'); }
    [[232, 70, 14], [244, 140, 12], [236, 210, 16], [246, 262, 10]].forEach(([x, y, n]) => { for (let k = 0; k < n; k++) px(x + Math.round(Math.sin(k) * 3) + (k >> 1), y + k, 1, 1, 'rgba(220,240,255,0.35)'); });
    // pines with snow caps
    const pine = (x, y, h) => { px(x, y - 3, 2, 3, '#1c1710'); for (let k = 0; k < h; k++) { const w = Math.max(1, Math.round((k + 1) / h * 9)); px(x + 1 - w, y - 3 - h + k, w * 2, 1, k % 2 ? '#10241f' : '#122a24'); if (k % 4 === 0) px(x + 1 - w, y - 3 - h + k, w * 2, 1, 'rgba(220,235,245,0.35)'); } };
    [[22, 284, 30], [44, 214, 22], [14, 160, 26], [36, 108, 18], [200, 80, 14], [458, 284, 30], [436, 214, 22], [466, 160, 26], [444, 108, 18], [280, 80, 14]].forEach(([x, y, h]) => pine(x, y, h));
    // a small campfire glow on the left, an ice shard on the right
    const fg = c.createRadialGradient(54, 290, 1, 54, 290, 26); fg.addColorStop(0, 'rgba(255,150,70,0.30)'); fg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = fg; c.fillRect(24, 262, 60, 38);
    px(50, 292, 9, 2, '#2a1a10'); px(52, 288, 2, 4, 'rgba(255,170,80,0.7)'); px(55, 287, 2, 5, 'rgba(255,120,60,0.7)');
    [[0, 0, 3, 14], [3, 4, 3, 10], [-3, 6, 3, 8]].forEach(([dx, dy, w, h]) => { px(450 + dx, 290 - h + dy, w, h, 'rgba(150,210,240,0.35)'); px(450 + dx, 290 - h + dy, 1, h, 'rgba(230,250,255,0.45)'); });
    return finish();
  }
  // Only River is switched on for now. To rotate scenes, add { id: 'cavern', build: buildCavern } and { id: 'frost', build: buildFrost } to this list.
  const SCENES = [{ id: 'river', build: buildRiver }];
  // Each fight (and each round of a best-of-3) picks a scene from its own content, so a replay always looks the same for everyone.
  function sceneFor(result) {
    const key = `${result.teams.map(t => t.name).join('|')}|${result.actions}|${result.winner}`;
    let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return h % SCENES.length;
  }
  function drawBg(ctx, now = 0, scene = 0) {
    const sc = SCENES[scene] || SCENES[0];
    if (!BG[sc.id]) BG[sc.id] = sc.build();
    ctx.drawImage(BG[sc.id], 0, 0, W, H);
    const p = 0.5 + 0.5 * Math.sin(now / 900);
    if (sc.id === 'river') {             // rune spot in the river: a slow, faint pulse
      const rx = 240 + Math.round(Math.sin(250 / 38) * 7), ry = 250;
      ctx.fillStyle = `rgba(120,200,255,${0.10 + 0.10 * p})`; ctx.fillRect(rx - 5, ry - 1, 10, 2); ctx.fillRect(rx - 1, ry - 5, 2, 10);
      ctx.fillStyle = `rgba(200,240,255,${0.25 + 0.25 * p})`; ctx.fillRect(rx - 1, ry - 1, 2, 2);
    } else if (sc.id === 'cavern') {     // cave mushrooms breathe a soft teal glow
      [[40, 212], [196, 292], [288, 160], [430, 214], [212, 70]].forEach(([x, y], i) => {
        const q = 0.5 + 0.5 * Math.sin(now / 1100 + i * 1.7);
        ctx.fillStyle = `rgba(63,208,192,${0.08 + 0.10 * q})`; ctx.fillRect(x - 4, y - 5, 10, 8);
        ctx.fillStyle = 'rgba(40,60,60,0.8)'; ctx.fillRect(x, y - 1, 2, 3);
        ctx.fillStyle = `rgba(110,240,220,${0.35 + 0.25 * q})`; ctx.fillRect(x - 2, y - 3, 6, 2);
      });
    } else if (sc.id === 'frost') {      // a few snowflakes drifting down
      for (let i = 0; i < 16; i++) {
        const sp = 18 + (i % 5) * 6, x = ((i * 67 + now / 90 * (i % 2 ? 1 : -1) + Math.sin(now / 1500 + i) * 6) % W + W) % W, y = 40 + ((i * 41 + now / 1000 * sp) % (H - 40));
        ctx.fillStyle = `rgba(230,240,250,${0.25 + (i % 3) * 0.08})`; ctx.fillRect(Math.round(x), Math.round(y), i % 4 ? 1 : 2, i % 4 ? 1 : 2);
      }
    }
  }
  function text(ctx, s, x, y, color, size = 10, align = 'center', weight = 700) {
    ctx.font = `${weight} ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,8,7,0.9)'; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  function drawUnit(ctx, u, now) {
    if (u.gone) return;                                   // shattered by a finisher
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
    text(ctx, u.name.length > 13 ? u.name.slice(0, 12) + '…' : u.name, u.x + SPR / 2, u.y + SPR + 4, u.alive ? '#e6dfd4' : '#6c645c', 9, 'center', 600);
  }
  // one line of badges ("1240 power · [rune] Amplify Damage +15% atk"), rune icons drawn in front of their text
  function drawBadges(ctx, badges, x, y, left, now) {
    ctx.font = `600 8px ${FONT}`;
    const IC = 9, gap = 3, sep = ' · ', sepW = ctx.measureText(sep).width;
    let widths = badges.map(b => ctx.measureText(b.s).width + (b.r ? IC + gap : 0));
    let total = widths.reduce((s, w) => s + w, 0) + sepW * (badges.length - 1);
    // too long to fit before the VS: runes show just their icon and effect (their names are in the round-start shout)
    if (total > 196) { badges = badges.map(b => (b.r ? { ...b, s: runeFx(b.r) } : b)); widths = badges.map(b => ctx.measureText(b.s).width + (b.r ? IC + gap : 0)); total = widths.reduce((s, w) => s + w, 0) + sepW * (badges.length - 1); }
    let cx = left ? x : x - total;
    badges.forEach((b, i) => {
      if (i) { text(ctx, sep, cx, y, '#9aa3ab', 8, 'left', 600); cx += sepW; }
      if (b.r) { const im = runeImg(b.r, now); if (im) { ctx.imageSmoothingEnabled = false; ctx.drawImage(im, cx, y - IC / 2 - 0.5, IC, IC); } cx += IC + gap; }
      text(ctx, b.s, cx, y, b.r ? '#d9e6ec' : '#9aa3ab', 8, 'left', 600);
      cx += ctx.measureText(b.s).width;
    });
  }
  function drawHud(ctx, sc, now) {
    const [ta, tb] = sc.result.teams;
    const side = (t, side) => {
      const left = side === 'a';
      const hp = Object.values(sc.units).filter(u => u.side === side).reduce((s, u) => s + Math.max(0, u.hpNow) / u.maxHp, 0) / 5;
      const x = left ? 10 : W - 10;
      text(ctx, t.name.toUpperCase(), x, 11, left ? '#ffb09a' : '#c8f5a0', 11, left ? 'left' : 'right', 800);
      const badges = [{ s: `${Math.round(t.power)} power` }].concat((t.runes || []).map(r => ({ s: `${RUNE_NAME[r]} ${runeFx(r)}`, r }))).concat(t.underdog ? [{ s: `Underdog +${t.underdog}%` }] : []);
      drawBadges(ctx, badges, x, 24, left, now);
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
      const len = s.long ? 1600 : 1000, p = (now - s.t0) / len; if (p < 0) continue;
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, p - 0.6) * 2.5);
      const y = s.y - p * (s.long ? 18 : 6);
      if (s.rune) { const im = runeImg(s.rune, now); if (im) { ctx.imageSmoothingEnabled = false; const z = s.long ? 22 : 14; ctx.drawImage(im, s.x - z / 2, y - z - 8, z, z); } }
      text(ctx, s.text, s.x, y, s.color, 11, 'center', 800);
      ctx.globalAlpha = 1;
    }
    sc.shouts = sc.shouts.filter(s => now - s.t0 < (s.long ? 1600 : 1000));
    if (sc.flash && now - sc.flash < 140) { ctx.fillStyle = `rgba(255,240,200,${0.18 * (1 - (now - sc.flash) / 140)})`; ctx.fillRect(0, 0, W, H); }
  }
  function drawEnd(ctx, sc, now) {
    if (!sc.ended) return;
    const p = Math.min(1, (now - sc.endT - 500) / 400); if (p <= 0) return;
    const w = sc.result.teams[sc.result.winner];
    ctx.globalAlpha = p * 0.85; ctx.fillStyle = '#0c0d0e'; ctx.fillRect(0, 124, W, 54); ctx.globalAlpha = p;
    text(ctx, sc.endTitle || 'VICTORY', W / 2, 140, '#e2b957', 18, 'center', 900);
    text(ctx, sc.endSub || (w.name + (sc.result.reason === 'time' ? ' · won on HP left' : '')), W / 2, 162, '#f4efe6', 11, 'center', 700);
    ctx.globalAlpha = 1;
  }
  function draw(ctx, sc, now) {
    drawBg(ctx, now, sc.scene);
    const order = Object.values(sc.units).sort((a, b) => a.y - b.y);
    order.filter(u => !u.alive).forEach(u => drawUnit(ctx, u, now));
    order.filter(u => u.alive).forEach(u => drawUnit(ctx, u, now));
    drawFx(ctx, sc, now); drawHud(ctx, sc, now); drawEnd(ctx, sc, now);
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
        <button class="btn" data-a="speed">Speed ${[1, 2, 4].includes(opts.speed) ? opts.speed : 1}x</button>
        <button class="btn" data-a="skip">Skip to end</button>
        <button class="btn" data-a="restart">Replay</button>
        ${opts.gif === false ? '' : '<button class="btn" data-a="gif">Download GIF clip</button>'}
        ${root.PixelMusic ? '<button class="btn" data-a="music" aria-pressed="false"></button>' : ''}
        ${root.PixelSFX ? '<button class="btn" data-a="sound" aria-pressed="false"></button><input class="arena-vol" type="range" min="0" max="100" aria-label="Sound volume" style="width:84px;accent-color:#e8553e;vertical-align:middle;margin-left:-2px">' : ''}
        <span class="arena-msg" role="status"></span>
      </div>`;
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
    // draw at the screen's real resolution (not 480x300 blown up), so names and numbers stay sharp; pixel art stays crisp
    const K = Math.max(2, Math.min(4, Math.round(((el.clientWidth || W * 2) * (root.devicePixelRatio || 1)) / W)));
    cv.width = W * K; cv.height = H * K; ctx.scale(K, K);
    ctx.imageSmoothingEnabled = false;
    // opts.endTitle / opts.endSub replace the "VICTORY" banner (used for best-of-3 rounds); opts.speed carries the speed across rounds
    const titled = s => { if (opts.endTitle) s.endTitle = opts.endTitle; if (opts.endSub) s.endSub = opts.endSub; return s; };
    // ---- finisher (Fight Night only: opts.finisher = { decider, team names, crest, score, mvp, tag, taunt(lo) }) ----
    const FIN = opts.finisher && root.PixelFinisher;
    const planFin = () => (FIN ? FIN.plan(result, { decider: !!opts.finisher.decider }) : null);
    let fplan = planFin(), fin = null;
    const freezeAt = p => p.n * STEP + 130;
    let sc = titled(makeScene(result)), t = 0, speed = [1, 2, 4].includes(opts.speed) ? opts.speed : 1, playing = opts.autoplay !== false, lastFrame = 0, raf = 0, dead = false;
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
    const live = s => { if (SFX) s.sfx = name => { if (playing && !(fplan && name === 'victory')) SFX.play(name, fin ? 1 : speed); }; return s; };   // a finisher brings its own fanfare
    sc = live(sc);
    if (SFX) {
      const unlock = () => { SFX.unlock(); if (MUS) MUS.unlock(); document.removeEventListener('pointerdown', unlock, true); document.removeEventListener('keydown', unlock, true); };
      document.addEventListener('pointerdown', unlock, true); document.addEventListener('keydown', unlock, true);   // browsers allow sound after the first tap or key press
      volIn.oninput = () => { SFX.setVolume(volIn.value / 100); if (MUS) MUS.setVolume(SFX.volume * MUSIC_LEVEL); keep.set('sfxVol', SFX.volume); if (SFX.muted && +volIn.value > 0) { SFX.setMuted(false); keep.set('sfxMuted', false); } syncSound(); };
    }
    const reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { const f = sc.sfx; sc.sfx = null; advance(sc, Infinity); sc.sfx = f; t = sc.steps.length * STEP + 2000; playing = false; }
    const startFin = () => {
      t = freezeAt(fplan); advance(sc, t);
      const o = opts.finisher, wi = sc.result.winner, ku = fplan.killer && sc.units[fplan.killer];
      const f = FIN.create(sc, fplan, { K, kind: fplan.kind === 'mini' ? 'mini' : undefined, matchEnd: fplan.decider,
        team: (o.names || [])[wi] || sc.result.teams[wi].name, guild: (o.tags || [])[wi] || '', crest: o.crest || null, crestColors: o.crestColors || [],
        score: o.score || '', mvp: o.mvp || '', taunt: ku && o.taunt ? o.taunt(ku) : '',
        drawScene: c => { const keep = [sc.floaters, sc.shots, sc.shouts, sc.flash]; sc.floaters = []; sc.shots = []; sc.shouts = []; sc.flash = 0; draw(c, sc, t); [sc.floaters, sc.shots, sc.shouts, sc.flash] = keep; sc.floaters = []; sc.shots = []; sc.shouts = []; } });
      fin = { f, tf: 0, ci: 0, cues: FIN.cues(f), done: false, hold: false };
    };
    // a full finisher leaves the victim shattered; rounds 1–2 then go back to the normal round result
    const endFin = () => {
      fin.done = true;
      if (fin.f.matchEnd && fin.f.kind !== 'mini') { fin.hold = true; return; }
      if (fin.f.kind !== 'mini' && fin.f.v) fin.f.v.gone = true;
      if (sc.ended) sc.endT = t - (fin.f.kind === 'mini' ? 0 : 400);
    };
    // reduced motion: no finisher animation; a deciding round shows the settled guild victory screen
    if (reduce && fplan && fplan.decider && fplan.kind === 'full') { startFin(); fin.ci = fin.cues.length; fin.tf = fin.f.T.guild + 3000; endFin(); }
    else if (reduce && fplan) { fplan = null; }
    const finCues = () => { while (fin.ci < fin.cues.length && fin.cues[fin.ci][0] <= fin.tf) { const n = fin.cues[fin.ci++][1]; if (SFX && playing) SFX.play(n, 1); } };
    const loop = ts => {
      if (dead || !el.isConnected) { dead = true; if (MUS) MUS.stop(); return; }
      const dt = lastFrame ? Math.min(100, ts - lastFrame) : 0; lastFrame = ts;
      if (fplan && !fin && playing && t + dt * speed >= freezeAt(fplan)) startFin();
      if (fin && (!fin.done || fin.hold)) {
        // the finisher always runs at normal speed; the guild victory screen keeps animating once it settles
        if (playing || (fin.hold && !reduce)) fin.tf += dt;
        if (!fin.done) finCues();
        const more = FIN.draw(ctx, fin.f, fin.tf);
        if (!fin.done && !more) { endFin(); if (fin.hold) { playing = false; setBtn(); if (opts.onEnd) opts.onEnd(); } }
        musicTick();
        raf = requestAnimationFrame(loop);
        return;
      }
      if (playing) t += dt * speed;
      advance(sc, t);
      draw(ctx, sc, t); musicTick();
      if (sc.ended && t - sc.endT > 2500 && playing) { playing = false; setBtn(); if (opts.onEnd) opts.onEnd(); }
      raf = requestAnimationFrame(loop);
    };
    const setBtn = () => { el.querySelector('[data-a="play"]').textContent = playing ? 'Pause' : sc.ended && (!fin || fin.done) && (!fplan || fin) ? 'Done' : 'Play'; };
    el.querySelector('.arena-bar').onclick = async e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      const act = a.dataset.a;
      if (act === 'play') { if (!sc.ended || (fin && !fin.done)) playing = !playing; setBtn(); }
      if (act === 'speed') { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; a.textContent = `Speed ${speed}x`; }
      if (act === 'skip') {
        const f = sc.sfx; sc.sfx = null;
        if (fplan && (!fin || !fin.done)) {
          // skip the finisher too: straight to the guild victory screen, or to the round result
          if (!fin) startFin();
          if (fin.f.matchEnd && fin.f.kind !== 'mini') { fin.tf = fin.f.T.guild; fin.ci = fin.cues.findIndex(c => c[0] >= fin.f.T.guild); if (fin.ci < 0) fin.ci = fin.cues.length; sc.sfx = f; if (!playing) { playing = true; setBtn(); } return; }
          endFin();
        }
        t = sc.steps.length * STEP + 600; advance(sc, t); sc.sfx = f; sc.floaters = []; sc.shots = []; sc.shouts = [];
      }
      if (act === 'restart') { sc = live(titled(makeScene(result))); t = 0; playing = true; fin = null; fplan = planFin(); setBtn(); if (MUS) { MUS.stop(); track = pickTrack(); } }
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
    return { stop() { dead = true; cancelAnimationFrame(raf); if (MUS) MUS.stop(); }, scene: () => sc, time: () => t, speed: () => speed };
  }

  // ---------- GIF clip of the finish ----------
  // Renders the last actions plus the victory screen and encodes a GIF in the browser.
  // With a Fight Night finisher the clip runs into it (at normal speed) and ends on the round result or the guild victory screen.
  // Frames are kept as 15-bit colour keys (half the memory of RGBA) so the longer finisher clip fits on phones.
  function gifClip(result, opts = {}) {
    const FIN = opts.finisher && root.PixelFinisher;
    const fplan = FIN ? FIN.plan(result, { decider: !!opts.finisher.decider }) : null;
    const fps = fplan ? 10 : 12, speed = 1.6, scale = opts.gifScale || 1;
    const sc = makeScene(result); if (opts.endTitle) sc.endTitle = opts.endTitle; if (opts.endSub) sc.endSub = opts.endSub;
    const total = sc.steps.length;
    const startStep = Math.max(1, total - (opts.gifSteps || (fplan ? 8 : 12)));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
    let t = startStep * STEP - 10;
    advance(sc, t); sc.floaters = []; sc.shots = []; sc.shouts = [];
    const frames = [], grab = () => { const d = ctx.getImageData(0, 0, W, H).data, k = new Uint16Array(W * H); for (let i = 0, j = 0; j < k.length; i += 4, j++) k[j] = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3); frames.push(k); };
    const MAX = fplan ? 190 : 160;
    let end = total * STEP + 2200;
    if (fplan) {
      const freeze = fplan.n * STEP + 130;
      while (t < freeze && frames.length < MAX) { advance(sc, t); draw(ctx, sc, t); grab(); t += (1000 / fps) * speed; }
      t = freeze; advance(sc, t);
      const o = opts.finisher, wi = result.winner, ku = fplan.killer && sc.units[fplan.killer];
      const f = FIN.create(sc, fplan, { K: 1, kind: fplan.kind === 'mini' ? 'mini' : undefined, matchEnd: fplan.decider,
        team: (o.names || [])[wi] || result.teams[wi].name, guild: (o.tags || [])[wi] || '', crest: o.crest || null, crestColors: o.crestColors || [],
        score: o.score || '', mvp: o.mvp || '', taunt: ku && o.taunt ? o.taunt(ku) : '',
        drawScene: c => { sc.floaters = []; sc.shots = []; sc.shouts = []; sc.flash = 0; draw(c, sc, t); } });
      const len = f.matchEnd && f.kind !== 'mini' ? f.len + 1500 : f.len;
      for (let tf = 0; tf < len && frames.length < MAX; tf += 1000 / fps) { ctx.clearRect(0, 0, W, H); FIN.draw(ctx, f, Math.min(tf, f.len + 1500)); grab(); }
      if (f.matchEnd && f.kind !== 'mini') return encodeGif(frames, W, H, Math.round(100 / fps), scale);
      if (f.kind !== 'mini' && f.v) f.v.gone = true;
      sc.floaters = []; sc.shouts = []; if (sc.ended) sc.endT = t - 400;
      end = t + 2600;
    }
    while (t < end && frames.length < MAX) {
      advance(sc, t); draw(ctx, sc, t); grab();
      t += (1000 / fps) * speed;
    }
    return encodeGif(frames, W, H, Math.round(100 / fps), scale);
  }

  // Minimal GIF89a encoder: one global palette (most common colors), LZW, looping.
  function encodeGif(frames, w, h, delayCs) {
    const counts = new Map();
    const keyed = frames.length && frames[0] instanceof Uint16Array;   // frames are RGBA data or 15-bit colour keys
    frames.forEach((f, fi) => { if (fi % 3) return; if (keyed) { for (let j = 0; j < f.length; j += 2) counts.set(f[j], (counts.get(f[j]) || 0) + 1); return; } for (let i = 0; i < f.length; i += 8) { const k = ((f[i] >> 3) << 10) | ((f[i + 1] >> 3) << 5) | (f[i + 2] >> 3); counts.set(k, (counts.get(k) || 0) + 1); } });
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
      if (keyed) for (let j = 0; j < idx.length; j++) idx[j] = nearest(f[j]);
      else for (let i = 0, j = 0; j < idx.length; i += 4, j++) idx[j] = nearest(((f[i] >> 3) << 10) | ((f[i + 1] >> 3) << 5) | (f[i + 2] >> 3));
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
