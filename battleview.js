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
        ${root.PixelSFX ? '<button class="btn" data-a="sound" aria-pressed="false"></button><input class="arena-vol" type="range" min="0" max="100" aria-label="Sound volume" style="width:84px;accent-color:#e8553e;vertical-align:middle;margin-left:-2px">' : ''}
        <span class="arena-msg" role="status"></span>
      </div>`;
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    let sc = makeScene(result), t = 0, speed = 1, playing = opts.autoplay !== false, lastFrame = 0, raf = 0, dead = false;
    // ---- sound: on by default, mute + volume remembered on this device ----
    const SFX = root.PixelSFX, keep = { get(k, d) { try { const v = localStorage.getItem('pa:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem('pa:' + k, JSON.stringify(v)); } catch {} } };
    const sndBtn = el.querySelector('[data-a="sound"]'), volIn = el.querySelector('.arena-vol');
    const syncSound = () => { if (!SFX) return; sndBtn.textContent = SFX.muted ? '🔇 Sound off' : '🔊 Sound on'; sndBtn.setAttribute('aria-pressed', String(!SFX.muted)); volIn.value = Math.round(SFX.volume * 100); };
    if (SFX) { SFX.setMuted(keep.get('sfxMuted', false)); SFX.setVolume(keep.get('sfxVol', 0.6)); syncSound(); }
    const live = s => { if (SFX) s.sfx = name => { if (playing) SFX.play(name, speed); }; return s; };
    sc = live(sc);
    if (SFX) {
      const unlock = () => { SFX.unlock(); document.removeEventListener('pointerdown', unlock, true); document.removeEventListener('keydown', unlock, true); };
      document.addEventListener('pointerdown', unlock, true); document.addEventListener('keydown', unlock, true);   // browsers allow sound after the first tap or key press
      volIn.oninput = () => { SFX.setVolume(volIn.value / 100); keep.set('sfxVol', SFX.volume); if (SFX.muted && +volIn.value > 0) { SFX.setMuted(false); keep.set('sfxMuted', false); } syncSound(); };
    }
    const reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { const f = sc.sfx; sc.sfx = null; advance(sc, Infinity); sc.sfx = f; t = sc.steps.length * STEP + 2000; playing = false; }
    const loop = ts => {
      if (dead || !el.isConnected) { dead = true; return; }
      const dt = lastFrame ? Math.min(100, ts - lastFrame) : 0; lastFrame = ts;
      if (playing) t += dt * speed;
      advance(sc, t);
      draw(ctx, sc, t);
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
      if (act === 'restart') { sc = live(makeScene(result)); t = 0; playing = true; setBtn(); }
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
    return { stop() { dead = true; cancelAnimationFrame(raf); }, scene: () => sc, time: () => t };
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
