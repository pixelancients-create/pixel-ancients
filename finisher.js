/*
 * Pixel Ancients — Fight Night finisher (visual only; never changes a result).
 * PixelFinisher.find(result)            -> { n, killer, victim } for the last knockout, or null
 * PixelFinisher.create(sc, info, opts)  -> finisher state (kind: 'melee' | 'ranged' | 'magic' | 'mini')
 * PixelFinisher.draw(ctx, f, tf)        -> draws the frame at tf ms since the finisher started; false when done
 *
 * Timeline (full, 7.6 s): hitstop 0–0.6 · call-out 0.6–2.0 · strike 2.0–3.4 · shatter 3.4–4.2 · hold 4.2–6.2 · hero pose 6.2–7.6
 */
(function (root) {
  const A = () => root.LeagueAvatars;
  const W = 480, H = 300, SPR = 64;
  const FONT = '"Fira Sans", system-ui, sans-serif', SERIF = 'Cinzel, Georgia, serif';
  // the K.O. hold after the shatter: melee goes straight to the hero pose once the shards are done
  const HOLD = { melee: 100, ranged: 2000, magic: 2000 }, HERO_LEN = 3400, GUILD_LEN = 3200;
  const timeline = style => { const T = { call: 600, strike: 2000, shatter: 3400, hold: 4200 }; T.hero = T.hold + HOLD[style]; T.guild = T.hero + HERO_LEN; T.end = T.guild + GUILD_LEN; return T; };
  const LEN = { mini: 900 };
  const STRIKE = { melee: "EXECUTIONER'S CUT", ranged: 'LAST SHOT', magic: 'ANCIENT NOVA' };
  // one palette per finisher: main accent, hot highlight, near-white core, deep shadow
  const PAL = {
    melee: { main: '#ff4a1c', hot: '#ffa53a', core: '#fff0d2', deep: '#3a0904', tint: 'rgba(60,10,4,' },
    ranged: { main: '#ffd02a', hot: '#fff08a', core: '#ffffff', deep: '#3a2c00', tint: 'rgba(50,38,0,' },
    magic: { main: '#a050ff', hot: '#d4a6ff', core: '#f6ecff', deep: '#170530', tint: 'rgba(22,6,44,' },
  };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const eOut = p => 1 - Math.pow(1 - clamp(p), 3);
  const eIn = p => Math.pow(clamp(p), 3);
  const eIO = p => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  const eBack = p => { p = clamp(p); const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
  const seeded = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; };

  // ---- who dealt the final blow ----
  // how the round ended: 'blow' (a fighter landed the last hit), 'dot' (burn/bleed tick), 'time' (won on HP left)
  // returns { how, n, killer, victim, side } — killer is null unless how === 'blow'
  function find(result) {
    const ev = result.events, end = ev.find(e => e.k === 'end'); if (!end) return null;
    const winSide = end.w === 0 ? 'a' : 'b', side = k => (k || '')[0];
    if (result.reason === 'time') return { how: 'time', n: end.n, killer: null, victim: null, side: winSide };
    const die = [...ev].reverse().find(e => e.k === 'die' && e.n <= end.n && side(e.t) !== winSide); if (!die) return { how: 'time', n: end.n, killer: null, victim: null, side: winSide };
    const step = ev.filter(e => e.n === die.n);
    const hit = [...step].reverse().find(e => (e.k === 'hit' || e.k === 'pet' || e.k === 'thorns') && e.t === die.t && e.s && side(e.s) === winSide && !e.miss);
    if (!hit) return { how: 'dot', n: die.n, killer: null, victim: die.t, side: winSide };
    return { how: 'blow', n: die.n, killer: hit.s, victim: die.t, side: winSide };
  }

  // What plays at the end of a round. decider = this round decides the match (round 3, or round 2 of a 2–0).
  //  rounds 1–2: a player's last hit -> full finisher ('ROUND WON'); time out, burn/bleed tick or a bot's kill -> mini
  //  deciding round: always a full finisher ('MATCH POINT') for a player of the winning guild:
  //    last hit -> that player · burn/bleed -> whoever applied it · time out or a bot's kill -> the top damage dealer
  //  bots (Lane Creeps, Ancient Guardians) never get the spotlight; if the Guardians win the deciding round, nothing plays.
  // returns null | { kind: 'full', n, killer, victim, how, decider } | { kind: 'mini', n, victim, how, decider }
  function plan(result, { decider = false } = {}) {
    const info = find(result); if (!info) return null;
    const wi = info.side === 'a' ? 0 : 1, team = result.teams[wi], lose = result.teams[1 - wi];
    const isBot = u => !u || !!u.bot || team.id === 'guardians' && u.key[0] === info.side || u.name === 'Ancient Guardian';
    const unit = key => result.teams.flatMap(t => t.units).find(u => u.key === key);
    const players = team.id === 'guardians' ? [] : team.units.filter(u => !u.bot);
    let killer = null;
    if (info.how === 'blow' && !isBot(unit(info.killer))) killer = info.killer;
    if (!decider) return killer ? { kind: 'full', n: info.n, killer, victim: info.victim, how: info.how, decider } : { kind: 'mini', n: info.n, victim: info.victim, how: info.how, decider };
    if (!players.length) return null;
    if (!killer && info.how === 'dot') {
      const tick = [...result.events].reverse().find(e => e.k === 'dot' && e.t === info.victim && e.n === info.n && e.s);
      if (tick && tick.s[0] === info.side && players.some(u => u.key === tick.s)) killer = tick.s;
    }
    if (!killer) killer = players.slice().sort((x, y) => (y.dealt || 0) - (x.dealt || 0) || x.key.localeCompare(y.key))[0].key;
    let victim = info.victim;
    if (!victim) {   // time out: the enemy closest to falling takes the hit
      const left = lose.units.filter(u => u.hp > 0); const pool = left.length ? left : lose.units;
      victim = pool.slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0].key;
    }
    return { kind: 'full', n: info.n, killer, victim, how: info.how, decider };
  }

  // sound cues for a finisher: [ms after start, PixelSFX name]
  function cues(f) {
    if (f.kind === 'mini') return [[0, 'f_mini']];
    const T = f.T, S = T.strike, out = [[0, 'f_freeze'], [T.call, 'f_whoosh'], [T.call + 120, 'f_card']];
    if (f.taunt) out.push([T.call + 480, 'f_taunt']);
    if (f.style === 'melee') out.push([S, 'f_charge'], [S + 380, 'f_dash'], [S + 570, 'f_slash'], [S + 680, 'f_slash'], [S + 780, 'f_impact'], [S + 1000, 'f_split']);
    if (f.style === 'ranged') out.push([S, 'f_gather'], [S + 520, 'f_beam'], [S + 870, 'f_slowmo'], [S + 1150, 'f_burst']);
    if (f.style === 'magic') out.push([S, 'f_rune'], [S + 500, 'f_crack'], [S + 850, 'f_pillar']);
    out.push([T.shatter, 'f_shatter']);
    if (HOLD[f.style] > 600) out.push([T.hold, 'f_hold']);
    out.push([T.hero, 'f_hero']); if (f.taunt) out.push([T.hero + 520, 'f_taunt']);
    if (f.matchEnd !== false) out.push([T.guild, 'f_guild']);
    return out;
  }

  // ---- drawing helpers ----
  function text(ctx, s, x, y, color, size, align = 'center', weight = 900, font = FONT) {
    ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size / 4.5); ctx.strokeStyle = 'rgba(8,6,5,0.95)'; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y);
  }
  const px = (ctx, x, y, s, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), s, s); };
  function sprite(ctx, u, anim, tick, x, y, size, opt = {}) {
    const c = A().frameCanvas(opt.lo || u.lo, tick, anim, true);
    ctx.save(); ctx.imageSmoothingEnabled = false; if (opt.alpha != null) ctx.globalAlpha = clamp(opt.alpha);
    const flip = opt.face ? opt.face === 'left' : u.side === 'b';
    if (flip) { ctx.translate(x + size, y); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0, size, size); } else ctx.drawImage(c, x, y, size, size);
    ctx.restore();
  }
  function tinted(u, anim, tick, color, plain) {
    const lo = plain ? { ...u.lo, aura: 'none', pet: 'none' } : u.lo;
    const c = A().frameCanvas(lo, tick, anim, true), s = document.createElement('canvas'); s.width = c.width; s.height = c.height;
    const x = s.getContext('2d'); x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, s.width, s.height); return s;
  }
  function drawCanvas(ctx, cv, u, x, y, size, alpha = 1) {
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = clamp(alpha);
    if (u.side === 'b') { ctx.translate(x + size, y); ctx.scale(-1, 1); ctx.drawImage(cv, 0, 0, size, size); } else ctx.drawImage(cv, x, y, size, size);
    ctx.restore();
  }
  function bars(ctx, h) { if (h <= 0) return; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h); }
  function ring(ctx, cx, cy, r, color, th, squash = 0.5, from = 0, to = 1) {
    const n = Math.max(24, Math.round(r * 1.5));
    for (let i = Math.floor(n * from); i < n * to; i++) { const a = i / n * Math.PI * 2; px(ctx, cx + Math.cos(a) * r - th / 2, cy + Math.sin(a) * r * squash - th / 2, th, color); }
  }
  function crystal(ctx, cx, cy, s) {
    const rows = [[0, 1], [-1, 2], [-2, 3], [-2, 3], [-3, 4], [-3, 4], [-2, 3], [-2, 3], [-1, 2], [0, 1]];
    rows.forEach(([a, b], i) => { for (let x = a; x < b; x++) px(ctx, cx + x * s, cy + (i - 5) * s, s, x < 0 ? '#e8553e' : x < 1 ? (i < 5 ? '#ff9a7a' : '#c8f5a0') : '#8fc84f'); });
  }
  function glow(ctx, x, y, r, color, a) {   // soft radial light (the one non-pixel thing: light, not objects)
    if (a <= 0 || r <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(a); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  function bubble(ctx, s, x, y, sc) {
    if (!s || sc <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    ctx.font = `700 11px ${FONT}`; const w = Math.ceil(ctx.measureText(s).width) + 16, h = 20;
    ctx.fillStyle = '#0c0d0e'; ctx.fillRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4);
    ctx.fillStyle = '#f4efe6'; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = '#0c0d0e'; ctx.fillRect(-w / 2 + 8, h / 2 + 2, 6, 2); ctx.fillRect(-w / 2 + 6, h / 2 + 4, 4, 2); ctx.fillStyle = '#f4efe6'; ctx.fillRect(-w / 2 + 8, h / 2, 4, 2);
    ctx.fillStyle = '#0c0d0e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, 0, 1);
    ctx.restore();
  }

  // ---- setup ----
  function create(sc, info, opts = {}) {
    const k0 = info.killer ? sc.units[info.killer] : null, k = k0 && !k0.bot && opts.kind !== 'mini' ? k0 : null,   // bots (Lane Creeps, Ancient Guardians) never get the spotlight
      v = info.victim ? sc.units[info.victim] : null;
    const K = opts.K || 2, type = k && k.type === 'ranged' ? 'ranged' : k && k.type === 'magic' ? 'magic' : 'melee', kind = k ? (opts.kind || type) : 'mini';
    const hide = [k0, v].filter(Boolean).map(u => [u, u.x]); hide.forEach(([u]) => { u.x = -9999; });
    const base = document.createElement('canvas'); base.width = W * K; base.height = H * K;
    const bx = base.getContext('2d'); bx.scale(K, K); bx.imageSmoothingEnabled = false; opts.drawScene(bx);
    hide.forEach(([u, x]) => { u.x = x; });
    const grey = document.createElement('canvas'); grey.width = base.width; grey.height = base.height;
    const gx = grey.getContext('2d');
    if ('filter' in gx) { gx.filter = 'grayscale(1) brightness(0.4) contrast(1.05)'; gx.drawImage(base, 0, 0); }
    if (!('filter' in gx) || gx.getImageData(Math.floor(grey.width / 2), Math.floor(grey.height / 2), 1, 1).data[3] === 0) {
      const img = bx.getImageData(0, 0, base.width, base.height), d = img.data;
      for (let i = 0; i < d.length; i += 4) { const g = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) * 0.4; d[i] = g; d[i + 1] = g; d[i + 2] = g * 1.1; }
      gx.putImageData(img, 0, 0);
    }
    const style = kind === 'mini' ? type : kind, P = k ? PAL[style] : { ...PAL.melee, main: '#e2b957', hot: '#ffe08a' };
    if (!k) return { k: null, v, kind, P, base, grey, len: LEN.mini, how: info.how, team_name: opts.team || '', side: info.side };
    const dir = k.side === 'a' ? 1 : -1;
    let behind = v.x + dir * 50; if (behind < 6 || behind > W - SPR - 6) behind = v.x - dir * 50;
    const T = timeline(style);
    const team = Object.values(sc.units).filter(u => u.side === k.side).sort((a, b) => a.pos - b.pos);
    return { k, v, kind, style, P, dir, behind, base, grey, T, team, len: kind === 'mini' ? LEN.mini : opts.matchEnd === false ? T.guild : T.end,
      crest: opts.crest || null, tag: opts.guild || '', matchEnd: opts.matchEnd, label: opts.matchEnd === false ? 'ROUND WON' : 'MATCH POINT', score: opts.score || '', mvp: opts.mvp || '',
      taunt: opts.taunt != null ? opts.taunt : (k.lo && k.lo.taunt) || '', guild: opts.guild || '', team_name: opts.team || '', crestColors: opts.crestColors || [],
      kc: { x: k.x + SPR / 2, y: k.y + SPR / 2 }, vc: { x: v.x + SPR / 2, y: v.y + SPR / 2 },
      sil: { kAtk: tinted(k, 'b_attack', 2, '#0c0d0e', true), vHurt: tinted(v, 'b_hurt', 1, '#0c0d0e', true), kW: tinted(k, 'b_attack', 2, '#f4efe6', true), vW: tinted(v, 'b_hurt', 1, '#f4efe6', true),
        vFlash: tinted(v, 'idle', 0, '#ffffff', true), kGhost: tinted(k, 'b_attack', 1, P.main, true), kHot: tinted(k, 'b_cast', 1, P.hot, true), vHot: tinted(v, 'b_hurt', 2, P.hot, true) } };
  }

  // ---- camera: zoom z on (fx,fy), tilt rot (radians), shake sh ----
  const C = (z = 1, fx = W / 2, fy = H / 2, rot = 0, sh = [0, 0]) => ({ z, fx, fy, rot, sh });
  function inCam(ctx, c, fn) {
    ctx.save(); ctx.translate(W / 2 + c.sh[0], H / 2 + c.sh[1]); ctx.rotate(c.rot); ctx.scale(c.z, c.z); ctx.translate(-c.fx, -c.fy); ctx.imageSmoothingEnabled = false; fn(); ctx.restore();
  }
  const toScreen = (c, x, y) => { const dx = (x - c.fx) * c.z, dy = (y - c.fy) * c.z, cs = Math.cos(c.rot), sn = Math.sin(c.rot); return [W / 2 + c.sh[0] + dx * cs - dy * sn, H / 2 + c.sh[1] + dx * sn + dy * cs]; };
  function world(ctx, f, c, g = 1, dark = 0, tint = 0) {
    ctx.fillStyle = '#050405'; ctx.fillRect(0, 0, W, H);
    inCam(ctx, c, () => { ctx.drawImage(f.base, -40, -40, W + 80, H + 80); if (g > 0) { ctx.globalAlpha = clamp(g); ctx.drawImage(f.grey, -40, -40, W + 80, H + 80); ctx.globalAlpha = 1; } });
    if (dark > 0) { ctx.fillStyle = `rgba(5,4,6,${clamp(dark)})`; ctx.fillRect(0, 0, W, H); }
    if (tint > 0) { ctx.fillStyle = f.P.tint + clamp(tint) + ')'; ctx.fillRect(0, 0, W, H); }
  }
  const shake = (t, amp, seed = 1) => amp <= 0 ? [0, 0] : [Math.round(Math.sin(t / 13 + seed) * amp), Math.round(Math.cos(t / 17 + seed * 2) * amp * 0.7)];
  function title(ctx, s, a, color) { if (a <= 0) return; ctx.globalAlpha = clamp(a); text(ctx, s, W / 2, 15, color || '#fff6e6', 14, 'center', 900, SERIF); ctx.globalAlpha = 1; }
  function flash(ctx, color, a) { if (a <= 0) return; ctx.globalAlpha = clamp(a); ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  function embers(ctx, t, P, n, seed, rise = 1) {   // drifting sparks in the finisher colour
    const R = seeded('emb' + seed);
    for (let i = 0; i < n; i++) {
      const x0 = R() * W, sp = 12 + R() * 30, ph = R() * 10000, life = 2500 + R() * 2000, q = ((t + ph) % life) / life;
      const x = x0 + Math.sin((t + ph) / 400) * 8, y = H + 10 - q * (H + 30) * rise;
      ctx.globalAlpha = clamp(Math.sin(q * Math.PI) * 0.9); px(ctx, x, y, R() < 0.25 ? 3 : 2, R() < 0.5 ? P.main : P.hot);
    }
    ctx.globalAlpha = 1;
  }
  function speedLines(ctx, cx, cy, t, P, n = 60, r0 = 80) {
    const L = seeded('lines');
    for (let i = 0; i < n; i++) {
      const a = L() * Math.PI * 2, r = r0 + L() * 50 + ((t * 0.5 + L() * 300) % 140), len = 30 + L() * 140;
      ctx.globalAlpha = 0.3 + L() * 0.55; ctx.fillStyle = L() < 0.6 ? P.main : P.hot;
      for (let s = 0; s < len; s += 3) ctx.fillRect(Math.round(cx + Math.cos(a) * (r + s)), Math.round(cy + Math.sin(a) * (r + s) * 0.8), 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- mini version (rounds 1–2) ----------
  function drawMini(ctx, f, tf) {
    const { k, v, P } = f;
    if (!k) return drawMiniPlain(ctx, f, tf);
    const g = tf < 560 ? eOut(tf / 140) : 1 - eOut((tf - 560) / 340), bh = 16 * (tf < 560 ? eOut(tf / 160) : 1 - eOut((tf - 560) / 340));
    const c = C(lerp(1, 1.08, eOut(tf / 300)) - 0.08 * eOut((tf - 560) / 340), lerp(W / 2, (k.x + v.x) / 2 + SPR / 2, 0.35), H / 2, 0, shake(tf, tf < 140 ? 3 : 0));
    world(ctx, f, c, g);
    inCam(ctx, c, () => {
      glow(ctx, f.kc.x, f.kc.y, 46, P.main, 0.55 * (1 - eOut((tf - 560) / 340)));
      sprite(ctx, v, 'b_hurt', tf < 70 ? 0 : 2, v.x, v.y, SPR, { alpha: tf < 560 ? 1 : 1 - 0.58 * eOut((tf - 560) / 200) });
      sprite(ctx, k, 'b_attack', tf < 560 ? 2 : 3, k.x, k.y, SPR);
    });
    bars(ctx, bh);
    const p = eBack((tf - 80) / 260), a = tf > 760 ? 1 - (tf - 760) / 140 : 1;
    if (tf > 80) {
      const [sx, sy] = toScreen(c, f.kc.x, k.y);
      ctx.globalAlpha = clamp(a); const s = `ROUND WON · ${k.name}`; ctx.font = `800 10px ${FONT}`; const w = ctx.measureText(s).width + 18;
      const x = clamp(sx - w / 2, 6, W - w - 6), y = sy - 32 + (1 - p) * 8;
      ctx.fillStyle = 'rgba(10,8,7,0.92)'; ctx.fillRect(x, y, w * clamp(p * 1.3), 20); ctx.fillStyle = P.main; ctx.fillRect(x, y, 3, 20); ctx.fillRect(x, y + 19, w * clamp(p * 1.3), 1);
      if (p > 0.5) text(ctx, s, x + 10, y + 10, '#fff6e6', 10, 'left', 800);
      ctx.globalAlpha = 1;
    }
    return tf < f.len;
  }

  // mini for rounds won on time or by a burn/bleed tick: no single killer, so the guild takes the tag
  function drawMiniPlain(ctx, f, tf) {
    const { v, P } = f;
    const g = tf < 560 ? eOut(tf / 140) : 1 - eOut((tf - 560) / 340), bh = 16 * (tf < 560 ? eOut(tf / 160) : 1 - eOut((tf - 560) / 340));
    const c = C(lerp(1, 1.06, eOut(tf / 300)) - 0.06 * eOut((tf - 560) / 340), W / 2, H / 2, 0, shake(tf, v && tf < 140 ? 3 : 0));
    world(ctx, f, c, g);
    if (v) inCam(ctx, c, () => { glow(ctx, v.x + SPR / 2, v.y + SPR / 2, 40, '#ff8a3d', 0.6 * (1 - eOut((tf - 560) / 340))); sprite(ctx, v, 'b_hurt', tf < 70 ? 0 : 2, v.x, v.y, SPR, { alpha: tf < 560 ? 1 : 1 - 0.58 * eOut((tf - 560) / 200) }); });
    bars(ctx, bh);
    const p = eBack((tf - 80) / 260), a = tf > 760 ? 1 - (tf - 760) / 140 : 1;
    if (tf > 80) {
      ctx.globalAlpha = clamp(a); const s = `ROUND WON · ${(f.team_name || '').toUpperCase()}`, sub = f.how === 'time' ? 'on HP left' : 'finished by a damage tick';
      ctx.font = `800 11px ${FONT}`; const w = ctx.measureText(s).width + 24, x = W / 2 - w / 2, y = 70 + (1 - p) * 8;
      ctx.fillStyle = 'rgba(10,8,7,0.92)'; ctx.fillRect(x, y, w * clamp(p * 1.3), 30); ctx.fillStyle = P.main; ctx.fillRect(x, y, 3, 30); ctx.fillRect(x, y + 29, w * clamp(p * 1.3), 1);
      if (p > 0.5) { text(ctx, s, W / 2, y + 11, '#fff6e6', 11, 'center', 800); text(ctx, sub, W / 2, y + 23, '#9aa3ab', 8, 'center', 700); }
      ctx.globalAlpha = 1;
    }
    return tf < f.len;
  }

  // ---------- 3: the strike, per style ----------
  function strikeMelee(ctx, f, t) {          // t: 0..1400
    const { k, v, P, vc, dir } = f, by = v.y - 6;
    // 0–380 wind-up: camera tilts, killer crouches, warm energy gathers on the blade
    if (t < 380) {
      const p = t / 380, c = C(lerp(1.25, 1.45, eIO(p)), lerp(f.kc.x, (f.kc.x + vc.x) / 2, 0.3), f.kc.y, dir * -0.06 * eIO(p), shake(t, 1.5 * p));
      world(ctx, f, c, 1, 0.35, 0.35 * p);
      inCam(ctx, c, () => {
        glow(ctx, f.kc.x + dir * 14, f.kc.y - 6, 20 + 34 * p, P.main, 0.8);
        const R = seeded('gather' + Math.floor(t / 40));
        for (let i = 0; i < 18; i++) { const a = R() * Math.PI * 2, d = (1 - ((t / 380 + R()) % 1)) * 60; px(ctx, f.kc.x + dir * 14 + Math.cos(a) * d, f.kc.y - 6 + Math.sin(a) * d, 2, R() < 0.5 ? P.hot : P.main); }
        sprite(ctx, v, 'idle', 0, v.x, v.y, SPR);
        sprite(ctx, k, 'b_cast', 0, k.x - dir * 4 * p, k.y + 3 * p, SPR);
        drawCanvas(ctx, f.sil.kHot, k, k.x - dir * 4 * p, k.y + 3 * p, SPR, 0.25 + 0.35 * Math.sin(t / 30) ** 2);
      });
      bars(ctx, 30); title(ctx, STRIKE.melee, p * 3, P.hot); return;
    }
    // 380–560 dash: afterimages streak to behind the victim
    if (t < 560) {
      const p = eIn((t - 380) / 180), c = C(lerp(1.45, 1.15, eOut(p)), lerp(f.kc.x, vc.x, p), lerp(f.kc.y, vc.y, p), dir * -0.06 * (1 - p), shake(t, 2));
      world(ctx, f, c, 1, 0.4, 0.3);
      const S = seeded('streaks'); ctx.fillStyle = P.main;
      for (let i = 0; i < 40; i++) { ctx.globalAlpha = 0.3 + S() * 0.5; ctx.fillRect(Math.round(((S() * W) - dir * (t - 380) * 3) % W + (dir < 0 ? W : 0)), Math.round(30 + S() * 240), 30 + S() * 90, 1); }
      ctx.globalAlpha = 1;
      inCam(ctx, c, () => {
        sprite(ctx, v, 'idle', 0, v.x, v.y, SPR);
        for (let g = 6; g >= 1; g--) { const q = clamp(p - g * 0.09); drawCanvas(ctx, f.sil.kGhost, k, lerp(k.x, f.behind, q), lerp(k.y, by, q), SPR, 0.12 * (7 - g)); }
        sprite(ctx, k, 'b_attack', 1, lerp(k.x, f.behind, p), lerp(k.y, by, p), SPR);
      });
      bars(ctx, 30); title(ctx, STRIKE.melee, 1, P.hot); return;
    }
    // 560–780 two quick cuts in an X, each with a micro hitstop
    const xcut = (ctx2, a, len, w, ox = vc.x, oy = vc.y) => { ctx2.save(); ctx2.translate(ox, oy); ctx2.rotate(a); ctx2.fillStyle = '#0c0d0e'; ctx2.fillRect(-len / 2, -w - 2, len, w * 2 + 4); ctx2.fillStyle = P.main; ctx2.fillRect(-len / 2, -w, len, w * 2); ctx2.fillStyle = P.core; ctx2.fillRect(-len / 2, -Math.max(1, w / 2), len, Math.max(2, w)); ctx2.restore(); };
    if (t < 780) {
      const q = t - 560, c = C(1.3, vc.x, vc.y, dir * 0.04, shake(q, q % 110 < 40 ? 4 : 1));
      world(ctx, f, c, 1, 0.45, 0.35);
      inCam(ctx, c, () => {
        glow(ctx, vc.x, vc.y, 60, P.main, 0.6);
        sprite(ctx, v, 'b_hurt', 1 + (Math.floor(q / 55) % 2), v.x + (q % 110 < 40 ? dir * 3 : 0), v.y, SPR);
        sprite(ctx, k, 'b_attack', 1 + (Math.floor(q / 110) % 2), f.behind, by, SPR, { face: f.behind > v.x ? 'left' : 'right' });
        if (q > 10) xcut(ctx, 0.7, 90 * eOut((q - 10) / 50), 2);
        if (q > 120) xcut(ctx, -0.7, 90 * eOut((q - 120) / 50), 2);
      });
      if (q % 110 < 30) flash(ctx, P.core, 0.3);
      bars(ctx, 30); title(ctx, STRIKE.melee, 1, P.hot); return;
    }
    // 780–1000 impact frame: staged silhouettes, the big cut (black on white → white on black → red on black)
    const slashBig = (ctx2, ox, oy, gp) => { ctx2.save(); ctx2.translate(ox, oy); ctx2.rotate(dir * -0.42); const L = W * 1.4 * gp; ctx2.fillStyle = '#0c0d0e'; ctx2.fillRect(-L / 2, -7, L, 14); ctx2.fillStyle = P.main; ctx2.fillRect(-L / 2, -5, L, 10); ctx2.fillStyle = P.hot; ctx2.fillRect(-L / 2, -2, L, 4); ctx2.fillStyle = '#fff'; ctx2.fillRect(-L / 2, -1, L, 2); ctx2.restore(); };
    if (t < 1000) {
      const q = t - 780, ph = q < 70 ? 0 : q < 130 ? 1 : 2, zoom = 1 + 0.08 * eOut(q / 220);
      ctx.fillStyle = ph === 0 ? '#f4efe6' : ph === 1 ? '#0c0d0e' : P.deep; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);
      const cx = W / 2, ys = 64;
      drawCanvas(ctx, ph === 1 ? f.sil.vW : ph === 2 ? f.sil.vHot : f.sil.vHurt, v, cx - 70 * dir - 70, ys + 10, 140);
      drawCanvas(ctx, ph === 1 ? f.sil.kW : f.sil.kAtk, k, cx + 70 * dir - 80, ys - 6, 160);
      slashBig(ctx, cx - 70 * dir, ys + 80, eOut(q / 50));
      ctx.restore();
      bars(ctx, 30); title(ctx, STRIKE.melee, 1, P.hot); return;
    }
    // 1000–1400 the whole screen splits along the cut, a burning seam, then snaps back
    const q = t - 1000, p = q < 260 ? eOut(q / 160) : 1 - eIO((q - 260) / 140), gap = 9 * p, a = dir * -0.42;
    const c = C(1.1, vc.x, vc.y, dir * 0.03, shake(q, 3 * (1 - q / 400)));
    const half = (sign) => {
      ctx.save();
      ctx.translate(vc.x * 0 + W / 2, H / 2); ctx.rotate(a); ctx.beginPath(); ctx.rect(-W, sign < 0 ? -H * 1.5 : 0, W * 2, H * 1.5); ctx.rotate(-a); ctx.translate(-W / 2, -H / 2);
      ctx.clip(); ctx.translate(-Math.sin(a) * gap * sign / 2 + Math.cos(a) * gap * sign * 0.8, Math.cos(a) * gap * sign / 2 + Math.sin(a) * gap * sign * 0.8);
      world(ctx, f, c, 1, 0.35, 0.25);
      inCam(ctx, c, () => { sprite(ctx, v, 'b_hurt', 2, v.x, v.y, SPR); sprite(ctx, k, 'b_attack', 3, f.behind, by, SPR, { face: f.behind > v.x ? 'left' : 'right' }); });
      ctx.restore();
    };
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    half(-1); half(1);
    // the seam (through the screen centre, along the cut)
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(a);
    ctx.globalAlpha = clamp(p * 1.5); ctx.fillStyle = P.main; ctx.fillRect(-W, -gap / 2 - 1, W * 2, gap + 2); ctx.fillStyle = P.hot; ctx.fillRect(-W, -gap / 4, W * 2, gap / 2); ctx.globalAlpha = 1;
    const R = seeded('seam' + Math.floor(q / 50)); for (let i = 0; i < 40; i++) px(ctx, (R() - 0.5) * W * 1.6, (R() - 0.5) * (gap + 14), 2, R() < 0.5 ? P.hot : P.core);
    ctx.restore();
    bars(ctx, 30); title(ctx, STRIKE.melee, 1 - q / 400, P.hot);
  }

  function strikeRanged(ctx, f, t) {
    const { k, v, P, vc, dir } = f;
    const sx0 = f.kc.x + dir * 22, sy0 = f.kc.y - 4, sx1 = vc.x, sy1 = vc.y;
    // 0–520 charge: light gathers into the weapon, a lens flare grows, the camera creeps in
    if (t < 520) {
      const p = t / 520, c = C(lerp(1.5, 1.9, eIO(p)), sx0 - dir * 30, sy0, dir * 0.03 * p, shake(t, 2 * p * p));
      world(ctx, f, c, 1, 0.45 + 0.2 * p, 0.25 * p);
      inCam(ctx, c, () => {
        sprite(ctx, k, 'b_shoot', 0, k.x, k.y, SPR);
        drawCanvas(ctx, f.sil.kHot, k, k.x, k.y, SPR, 0.2 + 0.3 * p);
        const R = seeded('light' + Math.floor(t / 33));
        for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, d = (1 - ((t / 300 + R()) % 1)) * 90; ctx.globalAlpha = 0.5 + R() * 0.5; ctx.fillStyle = R() < 0.5 ? P.hot : P.core; ctx.fillRect(Math.round(sx0 + Math.cos(a) * d), Math.round(sy0 + Math.sin(a) * d), Math.max(1, Math.round(d / 20)), 1); }
        ctx.globalAlpha = 1;
        glow(ctx, sx0, sy0, 10 + 40 * eIn(p), P.main, 0.9);
        glow(ctx, sx0, sy0, 4 + 12 * p, P.core, 1);
      });
      const [fx, fy] = toScreen(c, sx0, sy0);
      ctx.globalAlpha = 0.6 * eIn(p); ctx.fillStyle = P.hot; ctx.fillRect(0, Math.round(fy), W, 1); ctx.fillStyle = P.core; ctx.fillRect(fx - 60 * p, Math.round(fy) - 1, 120 * p, 3); ctx.globalAlpha = 1;
      bars(ctx, 30); title(ctx, STRIKE.ranged, p * 3, P.hot); return;
    }
    // 520–1150 the shot: speed-of-light streak, camera rides it, time slows right before impact
    const shotAt = q => [lerp(sx0, sx1, q), lerp(sy0, sy1, q) - Math.sin(q * Math.PI) * 8];
    if (t < 1150) {
      const u = (t - 520) / 630, p = u < 0.55 ? u / 0.55 * 0.85 : 0.85 + 0.15 * eOut((u - 0.55) / 0.45);   // fast, then slow-motion
      const [ax, ay] = shotAt(p), z = lerp(1.9, 2.3, u);
      const c = C(z, clamp(ax - dir * 20, 120, W - 120), clamp(ay, 80, H - 80), dir * -0.02, shake(t, u < 0.55 ? 2 : 0.5));
      world(ctx, f, c, 1, 0.5, 0.2);
      const S = seeded('streak'), spd = u < 0.55 ? 6 : 1.2;
      for (let i = 0; i < 60; i++) { const yy = 30 + S() * 240, l = 40 + S() * 180, xx = ((S() * W - dir * t * spd * (0.6 + S())) % (W + 300) + W + 300) % (W + 300) - 150; ctx.globalAlpha = 0.25 + S() * 0.5; ctx.fillStyle = i % 3 ? P.hot : P.core; ctx.fillRect(Math.round(xx), Math.round(yy), l, 1); }
      ctx.globalAlpha = 1;
      inCam(ctx, c, () => {
        sprite(ctx, k, 'b_shoot', 2, k.x, k.y, SPR);
        sprite(ctx, v, u > 0.92 ? 'b_hurt' : 'idle', 0, v.x, v.y, SPR);
        // the beam: a long hard streak behind the head
        for (let i = 60; i >= 0; i--) { const q = clamp(p - i * 0.008); if (q <= 0) continue; const [tx, ty] = shotAt(q); const th = i < 8 ? 4 : i < 25 ? 3 : 2; ctx.globalAlpha = 1 - i / 62; px(ctx, tx - th / 2, ty - th / 2, th, i < 4 ? P.core : i % 4 ? P.main : P.hot); }
        ctx.globalAlpha = 1;
        glow(ctx, ax, ay, 26, P.main, 0.9); glow(ctx, ax, ay, 9, P.core, 1);
        const ang = Math.atan2(sy1 - sy0, sx1 - sx0); ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang);
        ctx.fillStyle = '#fff'; ctx.fillRect(-16, -1, 18, 3); ctx.fillStyle = P.main; ctx.fillRect(2, -3, 4, 7); ctx.fillStyle = P.core; ctx.fillRect(6, -1, 3, 3); ctx.restore();
      });
      bars(ctx, 30); title(ctx, STRIKE.ranged, 1, P.hot); return;
    }
    // 1150–1400 impact: light burst, rays out of the victim, camera snaps back
    const q = t - 1150, p = eOut(q / 250), c = C(lerp(2.3, 1.2, p), vc.x, vc.y, 0, shake(q, 5 * (1 - p)));
    world(ctx, f, c, 1, 0.4, 0.2);
    inCam(ctx, c, () => {
      ctx.save(); ctx.translate(vc.x, vc.y); ctx.rotate(q / 400); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI * 2 / 16); ctx.globalAlpha = 0.5 * (1 - p * 0.6); ctx.fillStyle = i % 2 ? P.main : P.hot; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(260, -(i % 2 ? 6 : 12)); ctx.lineTo(260, i % 2 ? 6 : 12); ctx.closePath(); ctx.fill(); }
      ctx.restore(); ctx.globalAlpha = 1;
      glow(ctx, vc.x, vc.y, 90, P.main, 1 - p * 0.5);
      sprite(ctx, k, 'b_shoot', 3, k.x, k.y, SPR);
      drawCanvas(ctx, f.sil.vFlash, v, v.x, v.y, SPR);
    });
    flash(ctx, P.core, 0.85 * (1 - eOut(q / 120)));
    bars(ctx, 30); title(ctx, STRIKE.ranged, 1 - q / 250, P.hot);
  }

  function strikeMagic(ctx, f, t) {
    const { k, v, P, vc, dir } = f, foot = v.y + SPR - 4;
    const lift = t < 500 ? 0 : -8 * eOut((t - 500) / 400);
    const c = C(lerp(1.15, 1.35, eIO(t / 900)) - (t > 900 ? 0.25 * eOut((t - 900) / 150) : 0), lerp(W / 2, vc.x, 0.45), lerp(H / 2, vc.y - 20, 0.45), dir * 0.035 * Math.sin(t / 700), shake(t, t > 900 && t < 1150 ? 5 * (1 - (t - 900) / 250) : t > 500 ? 0.8 : 0));
    world(ctx, f, c, 1, 0.45 + 0.25 * eOut(t / 400), 0.55 * eOut(t / 400));
    // mist: slow purple fog bands
    const M = seeded('mist'); for (let i = 0; i < 9; i++) { const yy = 60 + M() * 220, xx = ((M() * W + t * (0.02 + M() * 0.04) * (i % 2 ? 1 : -1)) % (W + 200)) - 100; glow(ctx, xx, yy, 60 + M() * 50, P.main, 0.12); }
    inCam(ctx, c, () => {
      // caster: glowing, arms up
      glow(ctx, f.kc.x, f.kc.y - 6, 40 + 6 * Math.sin(t / 90), P.main, 0.7);
      ring(ctx, f.kc.x, k.y + SPR - 4, 24 + 3 * Math.sin(t / 120), P.hot, 2);
      sprite(ctx, k, 'b_cast', Math.floor(t / 120), k.x, k.y, SPR);
      drawCanvas(ctx, f.sil.kHot, k, k.x, k.y, SPR, 0.25 + 0.2 * Math.sin(t / 60));
      // rune circle drawing itself under the victim, spinning
      const rp = eOut(t / 500), spin = t / 900;
      ctx.save(); ctx.translate(vc.x, foot); ctx.scale(1, 0.45); ctx.rotate(spin);
      ring(ctx, 0, 0, 44, P.main, 3, 1, 0, rp); ring(ctx, 0, 0, 34, P.hot, 2, 1, 0, rp);
      for (let i = 0; i < 8; i++) { if (i / 8 > rp) break; const a = i / 8 * Math.PI * 2; ctx.save(); ctx.translate(Math.cos(a) * 39, Math.sin(a) * 39); ctx.rotate(a); ctx.fillStyle = P.core; ctx.fillRect(-2, -3, 4, 2); ctx.fillRect(-1, -1, 2, 4); ctx.fillRect(1, 1, 2, 2); ctx.restore(); }
      ctx.restore();
      glow(ctx, vc.x, foot, 60 * rp, P.main, 0.45);
      // rising motes
      const R = seeded('motes'); for (let i = 0; i < 30; i++) { const q = ((t / 1400 + R()) % 1); ctx.globalAlpha = Math.sin(q * Math.PI); px(ctx, vc.x + (R() - 0.5) * 80, foot - q * 120, 2, R() < 0.5 ? P.hot : P.core); } ctx.globalAlpha = 1;
      // victim lifted by the spell
      sprite(ctx, v, t > 900 ? 'b_hurt' : 'idle', t > 900 ? 2 : 0, v.x, v.y + lift, SPR);
      drawCanvas(ctx, f.sil.vHot, v, v.x, v.y + lift, SPR, t > 500 ? 0.2 + 0.2 * Math.sin(t / 50) : 0);
      // the sky cracks open above (500–850), then the pillar drops (850–930) and stays, pulsing
      if (t > 500) {
        const cp = eOut((t - 500) / 350), top = 34, cy = top + 4;
        const Z = seeded('crack'); let x = vc.x - 70 * cp, y = cy; ctx.fillStyle = P.core;
        for (let i = 0; i < 28 * cp; i++) { const nx = x + 5, ny = cy + (Z() - 0.5) * 10; for (let s = 0; s < 5; s++) px(ctx, lerp(x, nx, s / 5), lerp(y, ny, s / 5), 2, i % 3 ? P.hot : P.core); x = nx; y = ny; }
        glow(ctx, vc.x, cy, 70 * cp, P.main, 0.8);
        crystal(ctx, vc.x - 2, cy + 18 + Math.sin(t / 80) * 2, 3);
      }
      if (t > 850) {
        const drop = eIn((t - 850) / 80), yEnd = lerp(34, foot, drop), pulse = t > 930 ? 1 + 0.3 * Math.sin((t - 930) / 30) : 1;
        [[34, P.tint + '0.55)'], [26, P.main], [14, P.hot], [6, P.core], [2, '#ffffff']].forEach(([w, cc]) => { const ww = Math.round(w * pulse * (t > 930 ? 1 : 0.7)); ctx.fillStyle = cc; ctx.fillRect(Math.round(vc.x - ww / 2), 34, ww, yEnd - 34); });
        glow(ctx, vc.x, (34 + yEnd) / 2, 110, P.main, 0.6);
        if (t > 930) { drawCanvas(ctx, f.sil.vFlash, v, v.x, v.y + lift, SPR); const rp2 = eOut((t - 930) / 470); ring(ctx, vc.x, foot, 20 + rp2 * 110, P.main, 3); ring(ctx, vc.x, foot, 12 + rp2 * 70, P.core, 2); }
      }
    });
    if (t > 920 && t < 990) flash(ctx, P.core, 0.7 * (1 - (t - 920) / 70));
    bars(ctx, 30); title(ctx, STRIKE.magic, clamp(t / 200) * (t > 1250 ? 1 - (t - 1250) / 150 : 1), P.hot);
  }


  // ---------- 7: the guild's victory banner ----------
  const GOLD = { main: '#e2b957', hot: '#ffe08a', core: '#fff7dc', deep: '#2a1a05', tint: 'rgba(40,26,4,' };
  function laurel(ctx, cx, cy, side, grow) {   // a gold pixel laurel branch curving up beside the crest
    const n = Math.floor(11 * clamp(grow));
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (0.5 + i * 0.085), r = 50;
      const x = cx + side * Math.cos(a - Math.PI / 2) * r * 0.9 + side * 8, y = cy + 34 - Math.sin(a - Math.PI / 2) * r - 6;
      const bx = cx + side * (Math.sin(Math.PI * i / 22) * 46 + 10), by = cy + 40 - i * 8;
      px(ctx, bx, by, 3, '#6b4a14');
      // a leaf pair: outer and inner, gold with a light edge
      [[side * 7, -3], [-side * 5, -6]].forEach(([dx, dy], j) => {
        ctx.fillStyle = '#0c0705'; ctx.fillRect(Math.round(bx + dx - 4), Math.round(by + dy - 2), 9, 5);
        ctx.fillStyle = j ? '#c08a24' : '#e2b957'; ctx.fillRect(Math.round(bx + dx - 3), Math.round(by + dy - 1), 7, 3);
        ctx.fillStyle = '#ffe08a'; ctx.fillRect(Math.round(bx + dx - 2), Math.round(by + dy - 1), 3, 1);
      });
    }
  }
  function ribbon(ctx, cx, cy, w, h, open) {          // a gold-edged banner ribbon with folded tails
    const ww = Math.round(w * eOut(open)); if (ww < 4) return;
    const x0 = Math.round(cx - ww / 2), y0 = Math.round(cy - h / 2);
    // tails
    if (open > 0.6) {
      const ta = clamp((open - 0.6) / 0.4);
      [[-1, x0], [1, x0 + ww]].forEach(([s, ex]) => {
        const tx = ex + s * 4, tw = 34 * ta;
        ctx.fillStyle = '#5c1410'; ctx.beginPath(); ctx.moveTo(tx, y0 + 8); ctx.lineTo(tx + s * tw, y0 + 8); ctx.lineTo(tx + s * (tw - 10), y0 + 8 + (h - 4) / 2); ctx.lineTo(tx + s * tw, y0 + h + 4); ctx.lineTo(tx, y0 + h + 4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#3a0b08'; ctx.fillRect(Math.min(tx, tx + s * 6), y0 + 8, 6, h - 4);
      });
    }
    ctx.fillStyle = '#0c0705'; ctx.fillRect(x0 - 3, y0 - 3, ww + 6, h + 6);
    ctx.fillStyle = GOLD.main; ctx.fillRect(x0 - 2, y0 - 2, ww + 4, h + 4);
    ctx.fillStyle = '#8a1c14'; ctx.fillRect(x0, y0, ww, h);
    ctx.fillStyle = '#a8261b'; ctx.fillRect(x0, y0, ww, 3);
    ctx.fillStyle = '#5c1410'; ctx.fillRect(x0, y0 + h - 3, ww, 3);
    for (let x = x0 + 4; x < x0 + ww - 4; x += 8) px(ctx, x, y0 + h - 6, 2, 'rgba(226,185,87,0.5)');
  }
  function guildVictory(ctx, f, t, bh) {
    const P = GOLD, team = f.team, k = f.k;
    world(ctx, f, C(1.04), 1, 0.62, 0);
    // fresh gold flash from the hero pose
    if (t < 140) flash(ctx, P.core, 0.6 * (1 - t / 140));
    // gold rays + a warm floor glow
    ctx.save(); ctx.translate(W / 2, 96); ctx.rotate(-t / 3000); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 18; i++) { ctx.rotate(Math.PI * 2 / 18); ctx.fillStyle = i % 2 ? P.main : P.hot; ctx.globalAlpha = (i % 2 ? 0.14 : 0.06) * eOut(t / 500); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(360, -22); ctx.lineTo(360, 22); ctx.closePath(); ctx.fill(); }
    ctx.restore(); ctx.globalAlpha = 1;
    glow(ctx, W / 2, 96, 120, '#e2b957', 0.45 * eOut(t / 500));
    glow(ctx, W / 2, 262, 160, '#a8261b', 0.35 * eOut(t / 700));
    // confetti: gold + the guild's own crest colours
    const conf = [P.main, P.hot, '#e8553e', '#fff7dc'].concat(f.crestColors || []);
    const R = seeded('confetti');
    for (let i = 0; i < 70; i++) {
      const x0 = R() * W, sp = 40 + R() * 60, ph = R() * 4000, x = x0 + Math.sin((t + ph) / 300) * 10, y = -10 + ((t * sp / 1000 + ph / 20) % (H + 20));
      if (t < 300 + R() * 500) continue;
      ctx.fillStyle = conf[i % conf.length]; ctx.fillRect(Math.round(x), Math.round(y), (t + i * 90) % 400 < 200 ? 3 : 1, 2);
    }
    // the five who won, in a line, popping up one by one in the win pose
    const n = team.length, gap = 66, x0 = W / 2 - (n - 1) * gap / 2;
    team.forEach((u, i) => {
      const at = 760 + Math.abs(i - (n - 1) / 2) * 120, q = eBack((t - at) / 320); if (t < at) return;
      const size = 52 * q, x = x0 + i * gap - size / 2, y = 212 + (52 - size);
      if (u.key === k.key) glow(ctx, x0 + i * gap, 236, 34, f.P.main, 0.6);
      sprite(ctx, { ...u, side: 'a' }, 'b_win', Math.floor((t + i * 70) / 130), x, y, size, { face: i < n / 2 ? 'right' : 'left', alpha: u.bot ? 0.7 : 1 });
      if (q > 0.9) text(ctx, u.name.length > 10 ? u.name.slice(0, 9) + '…' : u.name, x0 + i * gap, 268, u.key === k.key ? f.P.hot : '#e6dfd4', 9, 'center', 700);
    });
    // crest drops in, flanked by laurels
    const cp = eBack(t / 460), cy = lerp(-40, 66, cp), cs = 4;
    laurel(ctx, W / 2, cy, -1, (t - 300) / 500); laurel(ctx, W / 2, cy, 1, (t - 300) / 500);
    ring(ctx, W / 2, cy, 40, '#7a5418', 3, 1); ring(ctx, W / 2, cy, 38, '#e2b957', 2, 1, 0, clamp((t - 200) / 400));
    glow(ctx, W / 2, cy, 50, '#ffe08a', 0.55);
    if (f.crest) { ctx.imageSmoothingEnabled = false; ctx.drawImage(f.crest, Math.round(W / 2 - 8 * cs), Math.round(cy - 8 * cs), 16 * cs, 16 * cs); }
    else crystal(ctx, W / 2 - 3, cy, 5);
    // VICTORY: big gold letters with a shine that sweeps across
    const vp = eBack((t - 260) / 360);
    if (t > 260) {
      const vc = document.createElement('canvas'), K = 3; vc.width = W * K; vc.height = 60 * K; const x = vc.getContext('2d'); x.scale(K, K);
      x.font = `900 40px ${SERIF}`; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.lineJoin = 'round'; x.lineWidth = 9; x.strokeStyle = '#140c04'; x.strokeText('VICTORY', W / 2, 30);
      x.lineWidth = 5; x.strokeStyle = '#7a5418'; x.strokeText('VICTORY', W / 2, 30);
      const g = x.createLinearGradient(0, 12, 0, 48); g.addColorStop(0, '#fff7dc'); g.addColorStop(0.45, '#ffd56a'); g.addColorStop(0.55, '#d99a2e'); g.addColorStop(1, '#ffe08a');
      x.fillStyle = g; x.fillText('VICTORY', W / 2, 30);
      const sw = ((t - 600) % 1800) / 700;                              // shine band every 1.8 s
      if (sw > 0 && sw < 1) { x.globalCompositeOperation = 'source-atop'; const bx = lerp(80, 400, sw); const sg = x.createLinearGradient(bx - 30, 0, bx + 30, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.95)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = sg; x.fillRect(0, 0, W, 60); }
      ctx.save(); ctx.translate(W / 2, 128); ctx.scale(vp, vp); glow(ctx, 0, 0, 120, '#e2b957', 0.35); ctx.drawImage(vc, -W / 2, -30, W, 60); ctx.restore();
      if (t > 260 && t < 360) flash(ctx, P.core, 0.4 * (1 - (t - 260) / 100));
    }
    // ribbon with the guild name unfurls under it
    const ro = clamp((t - 480) / 380);
    ribbon(ctx, W / 2, 172, 280, 30, ro);
    if (ro > 0.7) {
      ctx.globalAlpha = clamp((ro - 0.7) / 0.3);
      text(ctx, (f.team_name || '').toUpperCase(), W / 2, 173, '#fff3cf', 17, 'center', 900, SERIF);
      ctx.globalAlpha = 1;
    }
    // match line
    if (t > 1000) {
      ctx.globalAlpha = eOut((t - 1000) / 300);
      const line = [f.score ? `Wins the match ${f.score}` : 'Wins the match', f.mvp ? `MVP ${f.mvp}` : ''].filter(Boolean).join('   ·   ');
      text(ctx, line, W / 2, 196, '#e6dfd4', 9, 'center', 700);
      ctx.globalAlpha = 1;
    }
    bars(ctx, bh);
    // sparkles twinkling on the crest and letters
    for (let i = 0; i < 6; i++) { const S = seeded('tw' + i), ph = (t + S() * 1200) % 1200; if (ph > 300) continue; const a = Math.sin(ph / 300 * Math.PI); const sx = W / 2 + (S() - 0.5) * 220, sy = 100 + S() * 50; ctx.globalAlpha = a; px(ctx, sx - 1, sy - 4, 2, '#fff'); px(ctx, sx - 1, sy + 2, 2, '#fff'); px(ctx, sx - 4, sy - 1, 2, '#fff'); px(ctx, sx + 2, sy - 1, 2, '#fff'); px(ctx, sx - 1, sy - 1, 2, '#fff'); ctx.globalAlpha = 1; }
  }

  // ---------- full finisher ----------
  function draw(ctx, f, tf) {
    if (f.kind === 'mini') return drawMini(ctx, f, tf);
    const { k, v, P, kc, vc, dir, T } = f;
    const bh = 30 * (tf < T.guild ? eOut(tf / 260) : 1 - eOut((tf - T.guild) / 300));
    const kEnd = f.style === 'melee' ? { x: f.behind, y: v.y - 6 } : { x: k.x, y: k.y };
    const kFace = f.style === 'melee' ? { face: f.behind > v.x ? 'left' : 'right' } : {};

    if (tf < T.call) {                                                   // 1 HITSTOP — freeze, slow push-in, colour drains
      const t = tf, c = C(lerp(1, 1.12, eOut(t / 600)), lerp(W / 2, (kc.x + vc.x) / 2, eOut(t / 600) * 0.6), lerp(H / 2, (kc.y + vc.y) / 2, eOut(t / 600) * 0.6), 0, shake(t, t < 160 ? 4 : 0));
      world(ctx, f, c, eOut(t / 220), 0.1 * eOut(t / 400));
      inCam(ctx, c, () => {
        glow(ctx, vc.x, vc.y, 30 + 40 * eOut(t / 300), P.main, 0.8 * (1 - t / 600));
        sprite(ctx, k, 'b_attack', 2, k.x + (k.type === 'melee' ? dir * 22 : 0), k.y, SPR);
        sprite(ctx, v, 'b_hurt', t < 80 ? 0 : 1, v.x, v.y, SPR);
        const sp = eOut(t / 300); ctx.globalAlpha = clamp(1 - t / 500);
        for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, r = 6 + sp * 34; px(ctx, vc.x + Math.cos(a) * r - 2, vc.y + Math.sin(a) * r - 2, i % 2 ? 4 : 3, i % 3 ? P.core : P.main); }
        ctx.globalAlpha = 1;
      });
      if (t < 60) flash(ctx, P.core, 0.4);
      bars(ctx, bh);
      return true;
    }
    if (tf < T.strike) {                                                 // 2 CALL-OUT — whip zoom + tilt onto the killer
      const t = tf - T.call, zp = eOut(t / 220), z = lerp(1.12, 2.4, zp) + 0.12 * eIO(t / 1400);
      const fx = lerp((kc.x + vc.x) / 2, kc.x + dir * 50, zp), fy = lerp((kc.y + vc.y) / 2, kc.y + 8, zp);
      const c = C(z, fx, fy, dir * lerp(0, -0.07, zp), shake(t, t < 120 ? 3 : 0));
      world(ctx, f, c, 1, 0.3 * zp, 0.45 * zp);
      const [sx, sy] = toScreen(c, kc.x, kc.y);
      speedLines(ctx, sx, sy, t, P, 66, 90);
      inCam(ctx, c, () => {
        glow(ctx, kc.x, kc.y, 40 + 6 * Math.sin(t / 80), P.main, 0.9);
        sprite(ctx, k, 'b_cast', Math.floor(t / 110), k.x, k.y, SPR);
        drawCanvas(ctx, f.sil.kHot, k, k.x, k.y, SPR, 0.12 + 0.12 * Math.sin(t / 70));
      });
      bars(ctx, bh);
      const cp = eBack((t - 120) / 360), cx = lerp(-400, 0, cp), y = 216;
      if (t > 120) {
        ctx.save(); ctx.translate(cx, y); ctx.transform(1, 0, -0.2, 1, 0, 0);
        ctx.fillStyle = 'rgba(10,8,7,0.94)'; ctx.fillRect(56, -27, 338, 54); ctx.fillStyle = P.main; ctx.fillRect(56, -27, 7, 54); ctx.fillRect(56, 24, 338, 3);
                ctx.restore();
        ctx.save(); ctx.translate(cx, 0);
        text(ctx, f.label, 88, y - 14, P.hot, 10, 'left', 800);
        text(ctx, k.name.toUpperCase(), 84, y + 6, '#fff6e6', 25, 'left', 900, SERIF);
        if (f.guild) text(ctx, `[${f.guild}]`, 378, y + 6, '#9aa3ab', 10, 'right', 700);
        ctx.restore();
      }
      if (t > 480 && f.taunt) bubble(ctx, f.taunt, clamp(sx + 125, 120, W - 110), 74, eBack((t - 480) / 240));
      if (t > 1250) flash(ctx, '#000', (t - 1250) / 150 * 0.6);
      return true;
    }
    if (tf < T.shatter) {                                                // 3 STRIKE
      const t = tf - T.strike;
      if (f.style === 'melee') strikeMelee(ctx, f, t); else if (f.style === 'ranged') strikeRanged(ctx, f, t); else strikeMagic(ctx, f, t);
      return true;
    }
    if (tf < T.hero) {                                                   // 4 SHATTER (0.8 s) + 5 HOLD (2 s, slow motion)
      const t = tf - T.shatter, held = t > 800, ht = Math.max(0, t - 800);
      const slow = held ? 800 + ht * 0.1 : t;                           // shards and rings drop to 10% speed in the hold
      const p = clamp(slow / 900);
      const amp = held ? 0 : 6 * (1 - eOut(t / 800));
      const push = held ? eIO(ht / 2000) : 0;
      const c = C(lerp(1.06, 1.22, push), lerp(W / 2, (kEnd.x + SPR / 2 + vc.x) / 2, push * 0.8), lerp(H / 2, (kEnd.y + vc.y) / 2 + SPR / 2, push * 0.8), dir * -0.025 * push, shake(t, amp));
      world(ctx, f, c, 1, 0.25 + 0.15 * push, 0.35);
      embers(ctx, tf, P, held ? 40 : 20, 'hold');
      inCam(ctx, c, () => {
        glow(ctx, kEnd.x + SPR / 2, kEnd.y + SPR / 2, 44, P.main, 0.5 + 0.15 * Math.sin(tf / 200));
        sprite(ctx, k, held ? 'idle' : 'b_attack', held ? Math.floor(tf / 160) : 3, kEnd.x, kEnd.y, SPR, kFace);
        const rp = eOut(p); ctx.globalAlpha = clamp(1 - rp * 0.85);
        ring(ctx, vc.x, vc.y + 18, 14 + rp * 110, P.main, 3); ring(ctx, vc.x, vc.y + 18, 8 + rp * 70, P.core, 2);
        ctx.globalAlpha = 1;
        // shards: the victim's own sprite cut into 8x8 pieces, flung outward
        const src = A().frameCanvas({ ...v.lo, aura: 'none' }, 0, 'idle', true), n = 8, cell = src.width / n, s = SPR / n, S = seeded('shards' + v.key), secs = slow / 1000;
        ctx.imageSmoothingEnabled = false;
        for (let gy = 0; gy < n; gy++) for (let gx = 0; gx < n; gx++) {
          const dx = gx - n / 2 + 0.5, dy = gy - n / 2 + 0.5, a = Math.atan2(dy, dx) + (S() - 0.5) * 0.7, sp = 110 + S() * 200, spin = (S() - 0.5) * 8;
          const sgn = v.side === 'b' ? -1 : 1, col = v.side === 'b' ? n - 1 - gx : gx;
          const x = v.x + col * s + Math.cos(a) * sp * secs * sgn, y = v.y + gy * s + Math.sin(a) * sp * secs * 0.8 - 120 * secs + 380 * secs * secs;
          ctx.save(); ctx.globalAlpha = clamp(held ? 0.85 - ht / 2600 : 1); ctx.translate(Math.round(x) + s / 2, Math.round(y) + s / 2); ctx.rotate(Math.round(spin * secs * 4) * Math.PI / 4); if (sgn < 0) ctx.scale(-1, 1);
          ctx.drawImage(src, gx * cell, gy * cell, cell, cell, -s / 2, -s / 2, s, s); ctx.restore();
        }
        for (let i = 0; i < 50; i++) { const S2 = seeded('spark' + i), a = S2() * Math.PI * 2, d = (20 + S2() * 150) * eOut(p); ctx.globalAlpha = clamp(1 - p * 0.8); px(ctx, vc.x + Math.cos(a) * d, vc.y + Math.sin(a) * d * 0.7, S2() < 0.3 ? 3 : 2, S2() < 0.5 ? P.main : P.core); }
        ctx.globalAlpha = 1;
      });
      if (t < 90) flash(ctx, P.core, 0.6 * (1 - t / 90));
      bars(ctx, bh);
      // K.O. slams in, then hangs with a slow glow; the final-blow line sits under it during the hold
      if (t > 80) {
        const kp = eBack((t - 80) / 260), [sx, sy] = toScreen(c, vc.x, v.y - 10);
        const ky = clamp(sy, 62, H - 80);
        ctx.save(); ctx.translate(clamp(sx, 70, W - 70), ky); ctx.scale(kp * (1 + 0.03 * push), kp * (1 + 0.03 * push));
        glow(ctx, 0, 0, 50, P.main, 0.5 + 0.2 * Math.sin(tf / 180));
        text(ctx, 'K.O.', 0, 0, '#fff6e6', 30, 'center', 900, SERIF);
        ctx.restore();
        if (held && HOLD[f.style] > 600) { ctx.globalAlpha = eOut(ht / 400); text(ctx, `${k.name.toUpperCase()}  ·  ${STRIKE[f.style]}`, W / 2, H - 46, P.hot, 11, 'center', 800); ctx.globalAlpha = 1; }
      }
      if (tf > T.hero - 160) flash(ctx, P.core, (tf - (T.hero - 160)) / 160 * 0.8);
      return true;
    }
    if (tf < T.guild) {                                                  // 6 FINAL BLOW HERO POSE (3.4 s, taunt readable)
      const t = tf - T.hero, p = eOut(t / 420);
      world(ctx, f, C(1.04), 1, 0.2 + 0.4 * eOut(t / 300), 0.3);
      if (t < 120) flash(ctx, P.core, 0.8 * (1 - t / 120));
      ctx.save(); ctx.translate(W / 2, 140); ctx.rotate(t / 2200); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 14; i++) { ctx.rotate(Math.PI * 2 / 14); ctx.fillStyle = i % 2 ? P.main : P.hot; ctx.globalAlpha = (i % 2 ? 0.16 : 0.08) * eOut(t / 400); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(340, -28); ctx.lineTo(340, 28); ctx.closePath(); ctx.fill(); }
      ctx.restore(); ctx.globalAlpha = 1;
      embers(ctx, tf, P, 30, 'hero');
      const size = lerp(SPR, 128, eBack(t / 420)), x = lerp(kEnd.x, W / 2 - 64, p) + (128 - size) / 2, y = lerp(kEnd.y, 80, p) + (128 - size);
      glow(ctx, W / 2, 150, 90, P.main, 0.5 * p);
      ctx.globalAlpha = eOut(t / 300); ring(ctx, W / 2, 206, 42 + 8 * Math.sin(t / 200), P.main, 2); ctx.globalAlpha = 1;
      sprite(ctx, k, 'b_win', Math.floor(t / 130), x, y, size, { face: 'right' });
      crystal(ctx, W / 2 - 2, 62 + Math.sin(t / 180) * 2, 3);
      // their taunt, big enough to read, pops beside the head and stays
      if (f.taunt && t > 520) bubble(ctx, f.taunt, W / 2 + 118, 92, eBack((t - 520) / 260) * 1.15);
      const bp = eOut((t - 220) / 320);
      if (bp > 0) {
        ctx.globalAlpha = bp; ctx.fillStyle = 'rgba(10,8,7,0.9)'; ctx.fillRect(0, 222, W, 44); ctx.fillStyle = P.main; ctx.fillRect(W / 2 - W / 2 * bp, 222, W * bp, 1);
        text(ctx, f.label, W / 2, 233, P.hot, 9, 'center', 800);
        text(ctx, k.name.toUpperCase(), W / 2, 251, '#fff6e6', 18, 'center', 900, SERIF);
        ctx.globalAlpha = 1;
      }
      bars(ctx, bh);
      if (t > HERO_LEN - 140) flash(ctx, '#fff3cf', (t - (HERO_LEN - 140)) / 140 * 0.85);
      return true;
    }
    if (f.matchEnd === false) return false;                                // rounds 1–2: back to the normal round result
    guildVictory(ctx, f, tf - T.guild, bh);                                 // 7 GUILD VICTORY (then holds)
    return tf < T.end;
  }

  root.PixelFinisher = { find, plan, create, draw, cues, LEN, PAL, timeline };
})(typeof self !== 'undefined' ? self : this);
