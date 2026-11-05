/*
 * Pixel Ancients guild battles.
 * Gear -> battle stats, a seeded 5v5 idle battle (same seed = same fight for everyone),
 * guild power, Fight Night pairings and the guild league table.
 * Pure functions: the site and the balance tools share this file. Needs avatars.js loaded first.
 */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LeagueBattle = api;
})(typeof self !== 'undefined' ? self : this, function (root) {
  const A = () => root.LeagueAvatars;

  // ---------- numbers ----------
  const RARITY_PTS = { starter: 0, common: 1, rare: 2, epic: 3, legendary: 4, unique: 5 };
  const BASE = { hp: 230, atk: 24, armor: 3, spd: 20, crit: 10, eva: 5 };
  // stats each slot adds per rarity point (common 1 ... legendary 4, unique 5)
  const SLOT_STAT = {
    head: { crit: 1.2, atk: 0.5 }, body: { hp: 14, armor: 0.5 }, cape: { eva: 1.2, hp: 4 }, weapon: { atk: 1.8 },
    offhand: { armor: 0.8, hp: 6 }, boots: { spd: 0.8 }, pet: {}, aura: {},
  };
  const POWER_BASE = 50, POWER_PER_PT = 10;

  // ---------- what each item does in battle ----------
  // a = ability, p = its strength, t = weapon attack type (melee by default)
  const ITEMS = {
    // head
    headband: {},
    gg_mask: { a: 'gg', p: 12 },
    last_pick_hood: { a: 'counterpick', p: 20 },
    pathfinder_goggles: { a: 'trueSight' },
    tower_helm: { a: 'shield', p: 45 },
    midlane_mask: { a: 'firstStrike', p: 80 },
    night_owl_hood: { a: 'dodgeFirst', p: 2 },
    gpm_circlet: { a: 'greed', p: 6 },
    rampage_helm: { a: 'rampage', p: 30 },
    unbroken_helm: { a: 'lastStand', p: 8 },
    tormentor_horns: { a: 'thorns', p: 30 },
    weekly_crown: { a: 'command', p: 8 },
    mega_creeps_crown: { a: 'enrage', p: 60 },
    kill_cap: { a: 'greed', p: 4 },
    xp_visor: { a: 'execute', p: 45 },
    signature_helm: { a: 'silence', p: 1 },
    marathon_crown: { a: 'enrage', p: 45 },
    team_wipe_crown: { a: 'wipe', p: 30 },
    // body
    tunic: {},
    feeder_bib: { a: 'revive', p: 20 },
    weekend_vest: { a: 'regen', p: 4 },
    farm_apron: { a: 'farm', p: 8 },
    jungler_leathers: { a: 'lifesteal', p: 10 },
    support_robe: { a: 'heal', p: 22 },
    salve_robes: { a: 'healAll', p: 14 },
    space_vest: { a: 'guard', p: 35 },
    offlane_plate: { a: 'thorns', p: 25 },
    collector_coat: { a: 'flex', p: 6 },
    comeback_cuirass: { a: 'rage', p: 65 },
    champion_mail: { a: 'hardCarry', p: 4 },
    pos1_silk: { a: 'lifesteal', p: 32 },
    team_jersey: { a: 'block', p: 15 },
    turbo_jumpsuit: { a: 'doubleStrike', p: 15 },
    draft_armor: { a: 'guard', p: 25 },
    punching_bag_plate: { a: 'tough', p: 15 },
    million_plate: { a: 'critMaster', p: 12 },
    unkillable_carapace: { a: 'harden', p: 35 },
    // cape
    tango_wrap: { a: 'regen', p: 3 },
    gank_cloak: { a: 'backstab', p: 35 },
    comet_cape: { a: 'momentum', p: 3 },
    scan_cloak: { a: 'trueSight' },
    dire_banner: { a: 'warcry', p: 12 },
    radiant_banner: { a: 'rally', p: 4 },
    stomp_cape: { a: 'stomp', p: 85 },
    sunfire_cape: { a: 'burn', p: 5 },
    defender_mantle: { a: 'ancient' },
    weekend_cape: { a: 'warcry', p: 6 },
    duo_banner: { a: 'bond', p: 12 },
    arcane_mantle: { a: 'arcane', p: 40 },
    farmer_mantle: { a: 'farm', p: 10 },
    multikill_mantle: { a: 'frenzy', p: 100 },
    perfect_week_cloak: { a: 'command', p: 6 },
    // weapon
    training_sword: {},
    lasthit_dagger: { a: 'execute', p: 60 },
    deny_dirk: { a: 'bleed', p: 4 },
    harass_whip: { a: 'harass', p: 1.5, t: 'ranged' },
    twin_hatchets: { a: 'doubleStrike', p: 30 },
    ward_lantern: { a: 'wardHeal', p: 7, t: 'magic' },
    cleave_axe: { a: 'cleave', p: 45 },
    farm_sickle: { a: 'farm', p: 12 },
    throne_breaker: { a: 'siege', p: 75 },
    dusk_sabre: { a: 'waveClear', p: 52 },
    wombo_maul: { a: 'wombo', p: 70 },
    ascendant_staff: { a: 'nuke', p: 160, t: 'magic' },
    starforged_spear: { a: 'pierce', p: 75 },
    crit_blade: { a: 'critMaster', p: 18 },
    // off-hand
    creep_buckler: { a: 'block', p: 22 },
    throw_gloves: { a: 'counter', p: 30 },
    founder_pennant: { a: 'founder', p: 1 },
    deny_shield: { a: 'block', p: 35 },
    hex_talisman: { a: 'hex' },
    tank_bulwark: { a: 'taunt' },
    second_life_shield: { a: 'revive', p: 60 },
    tango_pouch: { a: 'regen', p: 3 },
    mana_charm: { a: 'spellShield', p: 3 },
    humility_urn: { a: 'urn', p: 25 },
    ward_satchel: { a: 'vision', p: 5 },
    glimmer_lantern: { a: 'glimmer', p: 30 },
    bounty_purse: { a: 'purse', p: 2.5 },
    aegis_buckler: { a: 'revive', p: 45 },
    // boots
    tp_sandals: { a: 'tp' },
    rotation_boots: { a: 'haste', p: 0.6 },
    juke_boots: { a: 'evasion', p: 8 },
    rat_treads: { a: 'backdoor', p: 30 },
    backdoor_greaves: { a: 'blink', p: 110 },
    morning_jog: { a: 'tp' },
    courier_slippers: { a: 'courier', p: 10 },
    phase_steps: { a: 'evasion', p: 5 },
    dewarder_boots: { a: 'shieldBreak', p: 150 },
    deny_dancer: { a: 'counter', p: 25 },
    water_waders: { a: 'water', p: 30 },
    siege_treads: { a: 'siege', p: 50 },
    // pets (the pet attacks after its owner)
    lucky_cat: { a: 'bounty', p: 40 },
    lane_frog: {},
    creep_buddy: { a: 'creepBlock', p: 30 },
    slime_buddy: { a: 'petSlow', p: 1 },
    sentry_eye: { a: 'petSight' },
    rune_sprite: { a: 'petRune' },
    night_foal: { a: 'petNight', p: 8 },
    boulder_pup: { a: 'petStun', p: 22 },
    little_ghost: { a: 'petGhost', p: 10 },
    one_trick_pony: { a: 'petFocus', p: 80 },
    ember_drake: { a: 'petBreath', p: 50 },
    drop_mimic: { a: 'petChomp', p: 100 },
    lunch_lizard: { a: 'bounty', p: 25 },
    tilt_kitten: { a: 'tilt', p: 8 },
    sentry_owl: { a: 'petReveal', p: 3 },
    solo_sloth: { a: 'loneWolf', p: 35 },
    bottle_crab: { a: 'petBottle', p: 30 },
    stack_parrot: { a: 'packBonus', p: 30 },
    pool_hydra: { a: 'hydra', p: 70 },
    // auras: whole team. The same aura twice doesn't stack (like Dota).
    fountain_glow: { aura: { regen: 2 } },
    leafstorm: { aura: { spd: 1 } },
    first_blood: { aura: { firstBlood: 15 } },
    bronze_aura: { aura: { armor: 2 } },
    smoke_aura: { aura: { eva: 6 } },
    shrine_aura: { aura: { lowHeal: 30 } },
    storm: { aura: { atkPct: 10 } },
    snowfall: { aura: { shield: 25 } },
    runner_up_aura: { aura: { crit: 8 } },
    godlike: { aura: { atkPct: 7, armor: 1.5 } },
    rampage_aura: { aura: { killStack: 15 } },
    mega_creeps_aura: { aura: { late: 50 } },
    bloodmoon: { aura: { lifesteal: 8, atkPct: 5 } },
  };

  // plain-English ability text for the locker and the replay
  const ABILITY_TEXT = {
    gg: p => `When it falls, allies get +${p}% attack`,
    counterpick: p => `+${p}% damage to the strongest enemy`,
    trueSight: () => 'Attacks can\'t be dodged',
    shield: p => `Starts with a ${p} HP shield`,
    firstStrike: p => `First attack deals +${p}%`,
    dodgeFirst: p => `Dodges the first ${p} hits`,
    greed: p => `+${p} attack for every kill`,
    rampage: p => `+${p}% attack for every kill`,
    lastStand: p => `+${p} armor below 30% HP`,
    thorns: p => `Returns ${p}% of melee damage`,
    command: p => `Allies get +${p}% attack`,
    enrage: p => `+${p}% attack once the fight drags on (Mega Creeps)`,
    revive: p => `Comes back once at ${p}% HP`,
    regen: p => `Heals ${p} HP every turn`,
    farm: p => `+1 attack every turn (up to +${p})`,
    lifesteal: p => `Heals ${p}% of damage dealt`,
    heal: p => `Every 3rd turn heals the weakest ally ${p} HP`,
    healAll: p => `Every 5th turn heals every ally ${p} HP`,
    guard: p => `Takes ${p}% of the damage aimed at allies, and shrugs off 40% of it`,
    flex: p => `+${p}% to all stats`,
    rage: p => `+${p}% attack below 40% HP`,
    hardCarry: p => `+${p}% attack every turn (up to +60%)`,
    backstab: p => `Can reach the back line, +${p}% damage there`,
    momentum: p => `+${p} speed for every kill`,
    warcry: p => `Team +${p}% attack early in the fight`,
    rally: p => `Team +${p} armor early in the fight`,
    stomp: p => `Every 4th turn hits the whole front line for ${p}% and may stun`,
    burn: p => `Attacks burn for ${p} damage a turn`,
    ancient: () => 'Once a fight, saves an ally from a killing blow',
    execute: p => `+${p}% damage to enemies below 30% HP`,
    bleed: p => `Attacks bleed for ${p} damage a turn`,
    harass: p => `Hits slow the target by ${p} speed`,
    doubleStrike: p => `${p}% chance to attack twice`,
    wardHeal: p => `Each attack heals the weakest ally ${p} HP`,
    cleave: p => `Hits the enemy next to the target for ${p}%`,
    siege: p => `Ignores ${p}% of armor`,
    waveClear: p => `Every 3rd turn hits all enemies for ${p}%`,
    wombo: p => `Every 5th turn hits all enemies for ${p}% and may stun`,
    nuke: p => `Every 3rd turn blasts the weakest enemy for ${p}%`,
    pierce: p => `Also hits the enemy behind the target for ${p}%`,
    critMaster: p => `+${p}% crit chance, crits hit harder`,
    block: p => `${p}% chance to block half a hit`,
    counter: p => `${p}% chance to hit back when struck in melee`,
    founder: p => `Team +${p} speed`,
    hex: () => 'Every 4th turn hexes an enemy (it loses a turn)',
    taunt: () => 'In the front line, enemies must attack it first. Starts with a 100 HP shield',
    tp: () => 'Acts early in the first round',
    haste: p => `Team +${p} speed`,
    evasion: p => `+${p}% dodge chance`,
    backdoor: p => `Goes for the back line, +${p}% damage there`,
    blink: p => `First attack blinks onto the weakest enemy for +${p}%`,
    bounty: p => `Owner heals ${p} HP on a kill`,
    creepBlock: p => `Owner starts with a ${p} HP shield`,
    petSlow: p => `Pet hits slow by ${p} speed`,
    petSight: () => 'Owner\'s attacks can\'t be dodged',
    petRune: () => 'Every 6th turn grabs a random rune',
    petNight: p => `Owner +${p}% dodge, pet hits harder`,
    petStun: p => `Pet hits have a ${p}% stun chance`,
    petGhost: p => `Owner +${p}% dodge`,
    petFocus: p => `Pet locks onto one enemy for +${p}% damage`,
    petBreath: p => `Pet breathes on every enemy for ${p}%`,
    petChomp: p => `Pet bites for +${p}% and may stun`,
    silence: () => 'Every 4th turn silences the strongest enemy: its next special move fizzles',
    wipe: p => `After each kill, hits every enemy for ${p}%`,
    tough: p => `Takes ${p}% less damage from every hit`,
    harden: p => `The first time it drops below half HP, gains a shield worth ${p}% of its max HP`,
    bond: p => `It and the ally beside it get +${p}% attack while both stand`,
    arcane: p => `Every 4th attack is magic (ignores most armor) and deals +${p}%`,
    frenzy: p => `Each kill brings its next turn ${p}% sooner`,
    spellShield: p => `Shrugs off the first ${p} stuns, hexes or silences. Magic hurts it 25% less`,
    urn: p => `Whenever anyone falls, heals the weakest ally ${p} HP`,
    vision: p => `Enemies lose ${p}% dodge`,
    glimmer: p => `Every 4th turn cloaks the weakest ally: it dodges the next hit and heals ${p} HP`,
    purse: p => `Every enemy that falls gives the whole team +${p} attack`,
    courier: p => `Every 4th turn sends a salve: the weakest ally heals ${p} HP a turn for 3 turns`,
    shieldBreak: p => `Attacks smash shields (+${p}% damage to shields)`,
    water: p => `Once, below 40% HP, drinks a water rune and heals ${p}% of its max HP`,
    tilt: p => `Owner +${p}% attack for every ally that falls`,
    petReveal: p => `Pet hits never miss and strip ${p}% dodge (up to ${p * 4}%)`,
    loneWolf: p => `Owner +${p}% attack while its side is outnumbered`,
    petBottle: p => `Every 4th turn the pet refills a bottle: owner heals ${p} HP`,
    packBonus: p => `Pet hits +${p}% for every other pet on the team`,
    hydra: p => `Pet also bites a second enemy for ${p}%`,
  };
  const AURA_TEXT = {
    regen: v => `Team heals ${v} HP a turn`, spd: v => `Team +${v} speed`, firstBlood: v => `Team +${v}% attack after the first kill`,
    armor: v => `Team +${v} armor`, eva: v => `Team +${v}% dodge`, lowHeal: v => `Allies heal ${v} HP once when they drop below half`,
    atkPct: v => `Team +${v}% attack`, shield: v => `Team starts with a ${v} HP shield`, crit: v => `Team +${v}% crit chance`,
    killStack: v => `Team +${v}% attack for every enemy that falls`, late: v => `Team +${v}% attack late in the fight`, lifesteal: v => `Team heals ${v}% of damage dealt`,
  };
  const RUNES = {
    dd: { name: 'Amplify Damage', fx: { atkPct: 15 } },
    haste: { name: 'Haste', fx: { spd: 2.5 } },
    regen: { name: 'Regeneration', fx: { regen: 5 } },
  };

  // what an item adds in battle: its slot stats at its rarity, plus its ability
  const STAT_NAME = { hp: 'HP', atk: 'attack', armor: 'armor', spd: 'speed', crit: '% crit', eva: '% dodge' };
  function slotStatText(slot, rarity) {
    const pts = RARITY_PTS[rarity] || 0, st = SLOT_STAT[slot] || {};
    if (slot === 'pet') return pts ? `Pet hits for ${3 + pts * 3}` : '';
    return Object.entries(st).filter(() => pts).map(([k, v]) => `+${+(v * pts).toFixed(1)}${k === 'crit' || k === 'eva' ? '' : ' '}${STAT_NAME[k]}`).join(', ');
  }
  function itemBattleText(id) {
    const d = ITEMS[id];
    if (!d) return '';
    if (d.aura) return Object.entries(d.aura).map(([k, v]) => AURA_TEXT[k](v)).join('. ');
    return d.a ? ABILITY_TEXT[d.a](d.p) : '';
  }

  // ---------- seeded random ----------
  function seeded(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // ---------- avatar -> battle unit ----------
  const GEAR_SLOTS = ['head', 'body', 'cape', 'weapon', 'offhand', 'boots', 'pet', 'aura'];
  function gearOf(lo) {
    const out = [];
    for (const slot of GEAR_SLOTS) {
      const id = lo && lo[slot];
      if (!id || id === 'none') continue;
      const it = A().findItem(slot, id);
      if (it) out.push({ slot, id, it, pts: RARITY_PTS[it.rarity] || 0, def: ITEMS[id] || {} });
    }
    return out;
  }
  function avatarPower(lo) { return POWER_BASE + gearOf(lo).reduce((s, g) => s + g.pts * POWER_PER_PT, 0); }
  const BOT_POWER = 35;

  // spec: { key, name, lo, pos (1-5), bot, playerId }
  function makeUnit(spec) {
    const u = { key: spec.key, name: spec.name, lo: spec.lo, pos: spec.pos, bot: spec.bot || null, playerId: spec.playerId || null,
      maxHp: BASE.hp, atk: BASE.atk, armor: BASE.armor, spd: BASE.spd, crit: BASE.crit, critMul: 2, eva: BASE.eva,
      type: 'melee', ab: {}, pet: null, auras: [], power: POWER_BASE };
    if (spec.bot) {
      const s = spec.scale || 1;
      Object.assign(u, { maxHp: Math.round(190 * s), atk: 19 * s, armor: 1 + 2 * (s - 1), spd: 18 + (s - 1) * 3, crit: 4, eva: 0, power: Math.round(BOT_POWER * s) });
      if (spec.bot === 'guardian') u.type = spec.pos >= 3 ? 'ranged' : 'melee';
    } else {
      for (const g of gearOf(spec.lo)) {
        u.power += g.pts * POWER_PER_PT;
        for (const [k, v] of Object.entries(SLOT_STAT[g.slot])) u[k === 'hp' ? 'maxHp' : k] += v * g.pts;
        if (g.slot === 'weapon' && g.def.t) u.type = g.def.t;
        if (g.slot === 'pet') { u.pet = { name: g.it.name, id: g.id, dmg: 3 + g.pts * 3, a: g.def.a, p: g.def.p, focus: null }; continue; }
        if (g.slot === 'aura') { u.auras.push(g.id); continue; }
        if (g.def.a) u.ab[g.def.a] = (u.ab[g.def.a] || 0) + (g.def.p == null ? 1 : g.def.p);
      }
      const P = u.pet;
      if (P && P.a === 'petGhost') u.eva += P.p;
      if (P && P.a === 'petNight') { u.eva += P.p; P.dmg *= 1.25; }
      if (P && P.a === 'petSight') u.ab.trueSight = 1;
      if (P && P.a === 'creepBlock') u.ab.shield = (u.ab.shield || 0) + P.p;
      if (P && (P.a === 'tilt' || P.a === 'loneWolf')) u.ab[P.a] = P.p;
      if (u.ab.taunt) u.ab.shield = (u.ab.shield || 0) + 100;
      if (u.ab.evasion) u.eva += u.ab.evasion;
      if (u.ab.critMaster) { u.crit += u.ab.critMaster; u.critMul = 2.6; }
      if (u.ab.flex) { const f = 1 + u.ab.flex / 100; u.maxHp *= f; u.atk *= f; u.armor *= f; u.spd *= f; }
    }
    u.maxHp = Math.round(u.maxHp);
    u.hp = u.maxHp;
    u.row = u.pos <= 2 ? 0 : 1;               // positions 1-2 front line, 3-5 back line
    u.col = u.pos <= 2 ? u.pos - 1 : u.pos - 3;
    return u;
  }

  // team: { id, name, members: [{ name, lo, pos, playerId }] (missing slots -> Lane Creep bots), runes: ['dd'] }
  function buildTeam(team, side) {
    const used = new Set();
    const units = [];
    const members = (team.members || []).slice(0, 5);
    members.forEach((m, i) => {
      let pos = m.pos >= 1 && m.pos <= 5 && !used.has(m.pos) ? m.pos : null;
      if (!pos) pos = [1, 2, 3, 4, 5].find(n => !used.has(n));
      used.add(pos);
      units.push(makeUnit({ key: `${side}${i}`, name: m.name, lo: m.lo, pos, playerId: m.playerId }));
    });
    let k = units.length;
    for (const pos of [1, 2, 3, 4, 5]) if (!used.has(pos)) units.push(makeUnit({ key: `${side}${k++}`, name: team.guardians ? 'Ancient Guardian' : 'Lane Creep', bot: team.guardians ? 'guardian' : 'creep', pos, scale: team.scale || 1 }));
    units.sort((a, b) => a.pos - b.pos);
    return { id: team.id, name: team.name, side, units, runes: team.runes || [], power: units.reduce((s, u) => s + u.power, 0) };
  }

  // A bye opponent: five Ancient Guardians, real geared avatars whose gear matches the guild's power.
  function guardianTeam(power) {
    const per = power / 5, pts = Math.max(0, Math.round((per - POWER_BASE) / POWER_PER_PT));
    const slots = A().SLOTS;
    const members = [0, 1, 2, 3, 4].map(i => {
      const lo = { skin: (i + 1) % 4, hair: ['mohawk', 'spiky', 'long', 'short', 'mohawk'][i], hairColor: 4, tunic: 4 };
      const base = Math.floor(pts / slots.length), extra = pts % slots.length;
      slots.forEach((sl, k) => {
        const want = Math.min(4, base + ((k + i) % slots.length < extra ? 1 : 0));
        const exact = sl.items.filter(it => RARITY_PTS[it.rarity] === want);
        const pool = exact.length ? exact : sl.items.filter(it => RARITY_PTS[it.rarity] <= want);
        lo[sl.id] = pool[(i * 3 + k) % pool.length].id;
      });
      return { name: 'Ancient Guardian', lo, pos: i + 1 };
    });
    return { id: 'guardians', name: 'Ancient Guardians', members };
  }

  function teamPower(team) {
    const n = (team.members || []).slice(0, 5);
    return n.reduce((s, m) => s + avatarPower(m.lo), 0) + Math.max(0, 5 - n.length) * BOT_POWER;
  }

  // ---------- the battle ----------
  const MAX_ACTIONS = 320;
  const COMEBACK = 10;                                          // % attack per fallen ally
  const STACK_EXTRA = 0.2;                                      // extra copies of the same team buff add 20% each
  const SLOW_CAP = 0.15;                                        // slows take at most 15% of a fighter's speed
  function simulate(teamA, teamB, seed, opts = {}) {
    const R = seeded(String(seed));
    const T = [buildTeam(teamA, 'a'), buildTeam(teamB, 'b')];
    const all = T[0].units.concat(T[1].units);
    const ev = [];
    let n = 0;                                                      // action counter
    const log = e => { e.n = n; ev.push(e); };
    const enemiesOf = u => T[u.key[0] === 'a' ? 1 : 0];
    const teamOf = u => T[u.key[0] === 'a' ? 0 : 1];
    const alive = t => t.units.filter(u => u.hp > 0);

    // team effects: auras (unique ids), item team buffs, runes
    for (const t of T) {
      const fx = { atkPct: 0, armor: 0, spd: 0, eva: 0, crit: 0, regen: 0, shield: 0, lifesteal: 0, firstBlood: 0, lowHeal: 0, killStack: 0, late: 0, warcry: 0, rally: 0, vision: 0 };
      const ids = [...new Set(t.units.flatMap(u => u.auras))];
      ids.forEach(id => Object.entries(ITEMS[id].aura).forEach(([k, v]) => { fx[k] += v; }));
      // team buffs from items: the strongest copy counts in full, every extra copy on the team adds STACK_EXTRA of its value
      const stack = k => { const v = t.units.map(u => u.ab[k] || 0).filter(Boolean).sort((x, y) => y - x); return v.length ? v[0] + v.slice(1).reduce((s, x) => s + x * STACK_EXTRA, 0) : 0; };
      fx.atkPct += stack('command'); fx.spd += stack('founder') + stack('haste'); fx.warcry += stack('warcry'); fx.rally += stack('rally'); fx.vision += stack('vision');
      t.runes.forEach(r => RUNES[r] && Object.entries(RUNES[r].fx).forEach(([k, v]) => { fx[k] += v; }));
      const other = T[t.side === 'a' ? 1 : 0];
      t.underdog = opts.underdog && other.power > t.power ? Math.min(40, Math.round((other.power / t.power - 1) * 100 * opts.underdog)) : 0;
      fx.atkPct += t.underdog;
      t.fx = fx; t.kills = 0; t.ancientUsed = false; t.firstBloodOn = false;
      t.units.forEach(u => {
        if (t.underdog) { u.maxHp = Math.round(u.maxHp * (1 + t.underdog / 100)); u.hp = u.maxHp; }
        u.shield = (u.ab.shield || 0) + fx.shield;
        u.gauge = R() * 30 + (u.ab.tp ? 60 : 0);
        Object.assign(u, { actions: 0, kills: 0, stacksAtk: 0, flatAtk: 0, slow: 0, stun: 0, dots: [], dodged: 0, revived: false, lowHealed: false,
          dealt: 0, healed: 0, taken: 0, spdBonus: 0, farmAtk: 0, evaDebuff: 0, silenced: 0, resist: u.ab.spellShield || 0, hardened: false, drank: false, glim: false, bondIn: [] });
      });
    }
    // Duo Banner: pairs with the ally beside it (same line), else the nearest ally
    for (const u of all) if (u.ab.bond) {
      const mates = teamOf(u).units.filter(x => x !== u);
      const side = mates.filter(x => x.row === u.row && Math.abs(x.col - u.col) === 1);
      const mate = (side.length ? side : mates).slice().sort((a, b) => Math.abs(a.pos - u.pos) - Math.abs(b.pos - u.pos) || a.pos - b.pos)[0];
      if (mate) { u.bondWith = mate; mate.bondIn.push(u); }
    }
    const pending = [];                                             // Team Wipe follow-ups, run after the current turn
    const early = () => n < 40, late = () => n > 60;
    const atkOf = u => {
      const t = teamOf(u), fx = t.fx;
      let pct = fx.atkPct + u.stacksAtk + (early() ? fx.warcry : 0) + (late() ? fx.late + (u.ab.enrage || 0) : 0)
        + (t.firstBloodOn ? fx.firstBlood : 0) + t.kills * fx.killStack
        + enemiesOf(u).kills * COMEBACK;                         // comeback: each fallen ally makes the rest hit harder
      if (u.ab.rage && u.hp < u.maxHp * 0.4) pct += u.ab.rage;
      if (u.ab.hardCarry) pct += Math.min(60, u.ab.hardCarry * u.actions);
      if (u.ab.bond && u.bondWith && u.bondWith.hp > 0) pct += u.ab.bond;
      u.bondIn.forEach(x => { if (x.hp > 0) pct += x.ab.bond; });
      if (u.ab.tilt) pct += enemiesOf(u).kills * u.ab.tilt;
      if (u.ab.loneWolf && alive(t).length < alive(enemiesOf(u)).length) pct += u.ab.loneWolf;
      return (u.atk + u.flatAtk + u.farmAtk) * (1 + pct / 100);
    };
    const armorOf = u => u.armor + teamOf(u).fx.armor + (early() ? teamOf(u).fx.rally : 0) + (u.ab.lastStand && u.hp < u.maxHp * 0.3 ? u.ab.lastStand : 0);
    const spdOf = u => Math.max(u.spd * 0.5, u.spd + teamOf(u).fx.spd + u.spdBonus - u.slow);
    const evaOf = u => Math.max(0, Math.min(45, u.eva + teamOf(u).fx.eva) - enemiesOf(u).fx.vision - u.evaDebuff);
    const critOf = u => u.crit + teamOf(u).fx.crit;

    function heal(u, v, src) {
      if (u.hp <= 0 || v <= 0) return;
      const h = Math.min(Math.round(v), u.maxHp - u.hp);
      if (h <= 0) return;
      u.hp += h; if (src) src.healed += h;
      log({ k: 'heal', t: u.key, v: h, h: u.hp });
    }

    // returns true when the stun lands
    // stun break: after a stun or hex, a fighter can't be stunned again until it has had one free turn
    function stunT(t, kind) {
      if (t.actions < (t.stunGuard || 0)) return false;
      if (t.resist > 0) { t.resist--; log({ k: 'cast', u: t.key, a: 'resist' }); return false; }
      if (kind === 'hex') t.stun = Math.max(t.stun, 1); else { t.stun = 1; log({ k: 'stun', t: t.key }); }
      t.stunGuard = t.actions + 2;
      return true;
    }

    function die(u, src) {
      const t = teamOf(u);
      if (!t.ancientUsed && t.units.some(x => x !== u && x.hp > 0 && x.ab.ancient)) {
        t.ancientUsed = true; u.hp = Math.round(u.maxHp * 0.2); u.shield += 30;
        log({ k: 'save', t: u.key, h: u.hp, by: t.units.find(x => x !== u && x.hp > 0 && x.ab.ancient).key });
        return;
      }
      if (u.ab.revive && !u.revived) {
        u.revived = true; u.hp = Math.round(u.maxHp * u.ab.revive / 100); u.dots = []; u.stun = 0;
        log({ k: 'revive', t: u.key, h: u.hp });
        return;
      }
      u.hp = 0;
      log({ k: 'die', t: u.key });
      const enemy = enemiesOf(u);
      enemy.kills++;
      if (!enemy.firstBloodOn) enemy.firstBloodOn = true;
      if (u.ab.gg) t.units.forEach(x => { if (x.hp > 0) x.stacksAtk += u.ab.gg; });
      const purse = alive(enemy).reduce((s, x) => s + (x.ab.purse || 0), 0);
      if (purse) alive(enemy).forEach(x => { x.flatAtk += purse; });
      all.forEach(x => { if (x.hp > 0 && x.ab.urn) heal(weakestAlly(x), x.ab.urn, x); });
      if (src && src.hp > 0) {
        src.kills++;
        if (src.ab.greed) src.flatAtk += src.ab.greed;
        if (src.ab.rampage) src.stacksAtk += src.ab.rampage;
        if (src.ab.momentum) src.spdBonus += src.ab.momentum;
        if (src.ab.frenzy) src.gauge += src.ab.frenzy;
        if (src.ab.wipe && !src.wiping && !pending.includes(src)) pending.push(src);
        if (src.pet && src.pet.a === 'bounty') heal(src, src.pet.p, src);
      }
    }

    // apply damage after rolls; handles guard, shields, low-HP heals, thorns, death
    function damage(t, dmg, src, kind) {
      if (t.hp <= 0) return 0;
      if (src && src.key[0] !== t.key[0]) {
        const guard = teamOf(t).units.find(x => x !== t && x.hp > 0 && x.ab.guard);
        if (guard && kind !== 'dot') { const part = Math.round(dmg * Math.min(60, guard.ab.guard) / 100); dmg -= part; applyRaw(guard, part * 0.6, src, 'guard'); }
      }
      if (t.ab.tough && kind !== 'dot') dmg *= 1 - t.ab.tough / 100;
      return applyRaw(t, dmg, src, kind);
    }
    function applyRaw(t, dmg, src, kind) {
      if (t.hp <= 0) return 0;
      let d = Math.max(1, Math.round(dmg));
      if (t.shield > 0) {
        const mul = src && src.ab.shieldBreak && kind !== 'dot' ? 1 + src.ab.shieldBreak / 100 : 1;
        const s = Math.min(t.shield, d * mul); t.shield -= s; d -= Math.round(s / mul);
      }
      t.hp -= d; t.taken += d; if (src) src.dealt += d;
      if (kind === 'guard') log({ k: 'guard', t: t.key, d, h: Math.max(0, t.hp) });
      if (t.hp <= 0) die(t, src);
      else {
        if (!t.lowHealed && teamOf(t).fx.lowHeal && t.hp < t.maxHp / 2) { t.lowHealed = true; heal(t, teamOf(t).fx.lowHeal); }
        if (t.ab.harden && !t.hardened && t.hp < t.maxHp / 2) { t.hardened = true; t.shield += Math.round(t.maxHp * t.ab.harden / 100); log({ k: 'cast', u: t.key, a: 'harden' }); }
        if (t.ab.water && !t.drank && t.hp < t.maxHp * 0.4) { t.drank = true; log({ k: 'rune', u: t.key, r: 'water' }); heal(t, t.maxHp * t.ab.water / 100, t); }
      }
      return d;
    }

    function roll(s, t, mult, opts2 = {}) {
      const r = { miss: false, crit: false, block: false, d: 0 };
      const sight = s.ab.trueSight || opts2.sure;
      if (!sight) {
        if (t.glim) { t.glim = false; r.miss = true; return r; }
        if (t.ab.dodgeFirst && t.dodged < t.ab.dodgeFirst) { t.dodged++; r.miss = true; return r; }
        if (R() * 100 < evaOf(t)) { r.miss = true; return r; }
      }
      let d = atkOf(s) * mult * (0.8 + R() * 0.4);
      if (s.ab.execute && t.hp < t.maxHp * 0.3) d *= 1 + s.ab.execute / 100;
      const backBonus = (s.ab.backstab || 0) + (s.ab.backdoor || 0);
      if (backBonus && t.row === 1) d *= 1 + backBonus / 100;
      if (s.ab.counterpick && t.power === Math.max(...alive(enemiesOf(s)).map(x => x.power))) d *= 1 + s.ab.counterpick / 100;
      if (R() * 100 < critOf(s)) { d *= s.critMul; r.crit = true; }
      let arm = armorOf(t);
      if (s.type === 'magic' || opts2.magic) { arm *= 0.3; if (t.ab.spellShield) d *= 0.75; }
      if (s.ab.siege) arm *= 1 - Math.min(90, s.ab.siege) / 100;
      d *= 100 / (100 + Math.max(0, arm) * 6);
      if (t.ab.block && R() * 100 < t.ab.block) { d *= 0.5; r.block = true; }
      r.d = Math.max(1, Math.round(d));
      return r;
    }

    // one hit from s to t: rolls, damage, on-hit effects. Returns dealt damage.
    function strike(s, t, mult, tag, opts2 = {}) {
      const r = roll(s, t, mult, opts2);
      if (r.miss) { log({ k: 'hit', s: s.key, t: t.key, miss: true, a: tag }); return 0; }
      const before = t.hp;
      const dealt = damage(t, r.d, s, 'hit');
      log({ k: 'hit', s: s.key, t: t.key, d: dealt, crit: r.crit || undefined, block: r.block || undefined, a: tag, h: Math.max(0, t.hp) });
      if (before > 0 && t.hp > 0) {
        if (s.ab.burn) t.dots.push({ v: s.ab.burn, left: 3, src: s.key, kind: 'burn' });
        if (s.ab.bleed) t.dots.push({ v: s.ab.bleed, left: 3, src: s.key, kind: 'bleed' });
        if (s.ab.harass) t.slow = Math.min(t.spd * SLOW_CAP, t.slow + s.ab.harass);
        if (t.dots.length > 6) t.dots.splice(0, t.dots.length - 6);
      }
      const ls = (s.ab.lifesteal || 0) + teamOf(s).fx.lifesteal;
      if (ls && dealt) heal(s, dealt * ls / 100, s);
      if (t.ab.thorns && s.type === 'melee' && !opts2.noRetaliate && dealt) applyRaw(s, dealt * t.ab.thorns / 100, t, 'thorns') && log({ k: 'thorns', s: t.key, t: s.key, h: Math.max(0, s.hp) });
      if (t.ab.counter && t.hp > 0 && s.type === 'melee' && !opts2.noRetaliate && R() * 100 < t.ab.counter) {
        log({ k: 'counter', s: t.key, t: s.key });
        strike(t, s, 0.5, 'counter', { noRetaliate: true });
      }
      return dealt;
    }

    function pickTarget(s, opts2 = {}) {
      const foes = alive(enemiesOf(s));
      if (!foes.length) return null;
      if (!opts2.anyRow) {
        const taunt = foes.filter(e => e.ab.taunt && e.row === 0);
        if (taunt.length) return taunt[0];
      }
      const front = foes.filter(e => e.row === 0), back = foes.filter(e => e.row === 1);
      let pool = foes;
      if (s.ab.backdoor || s.ab.backstab) { if (back.length && R() < 0.7) pool = back; }
      else if (s.type === 'melee' && front.length && !opts2.anyRow) pool = front;
      if (R() < 0.4) return pool.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a));
      return pool[Math.floor(R() * pool.length)];
    }
    const weakestAlly = u => alive(teamOf(u)).reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a));

    function act(u) {
      n++; u.actions++;
      log({ k: 'act', u: u.key });
      // damage over time and regeneration happen at the start of the turn
      for (const d of u.dots.slice()) {
        if (u.hp <= 0) break;
        const src = all.find(x => x.key === d.src);
        if (d.kind === 'hot') { heal(u, d.v, src); d.left--; continue; }
        const dealt = applyRaw(u, d.v, src, 'dot');
        log({ k: 'dot', t: u.key, d: dealt, kind: d.kind, h: Math.max(0, u.hp) });
        d.left--;
      }
      u.dots = u.dots.filter(d => d.left > 0);
      if (u.hp <= 0) return;
      const regen = (u.ab.regen || 0) + teamOf(u).fx.regen;
      if (regen && u.hp < u.maxHp) heal(u, regen, u);
      if (u.ab.farm) u.farmAtk = Math.min(u.ab.farm, u.farmAtk + 1);
      if (u.stun > 0) { u.stun--; log({ k: 'stunned', u: u.key }); return; }

      // a silenced hero's next special move fizzles
      const can = () => { if (!u.silenced) return true; u.silenced = 0; log({ k: 'cast', u: u.key, a: 'fizzle' }); return false; };
      // support actions on top of the attack
      if (u.ab.silence && u.actions % 4 === 0) {
        const foes = alive(enemiesOf(u)).filter(x => !x.silenced);
        const casters = foes.filter(x => x.ab.heal || x.ab.healAll || x.ab.hex || x.ab.nuke || x.ab.wombo || x.ab.waveClear || x.ab.stomp || x.ab.glimmer || x.ab.courier || x.ab.silence);
        const pool = casters.length ? casters : foes;
        if (pool.length) {
          const t = pool.reduce((a, b) => (b.power > a.power ? b : a));
          log({ k: 'cast', u: u.key, a: 'silence', t: t.key });
          if (t.resist > 0) { t.resist--; log({ k: 'cast', u: t.key, a: 'resist' }); } else t.silenced = 1;
        }
      }
      if (u.ab.glimmer && u.actions % 4 === 0 && can()) { const t = weakestAlly(u); t.glim = true; log({ k: 'cast', u: u.key, a: 'glimmer', t: t.key }); heal(t, u.ab.glimmer, u); }
      if (u.ab.courier && u.actions % 4 === 0 && can()) { const t = weakestAlly(u); log({ k: 'cast', u: u.key, a: 'courier', t: t.key }); t.dots.push({ v: u.ab.courier, left: 3, src: u.key, kind: 'hot' }); }
      if (u.ab.heal && u.actions % 3 === 0 && can()) { const t = weakestAlly(u); log({ k: 'cast', u: u.key, a: 'heal' }); heal(t, u.ab.heal, u); }
      if (u.ab.healAll && u.actions % 5 === 0 && can()) { log({ k: 'cast', u: u.key, a: 'healAll' }); alive(teamOf(u)).forEach(t => heal(t, u.ab.healAll, u)); }
      if (u.ab.hex && u.actions % 4 === 0 && can()) {
        const foes = alive(enemiesOf(u));
        if (foes.length) { const t = foes.reduce((a, b) => (b.power > a.power ? b : a)); log({ k: 'cast', u: u.key, a: 'hex', t: t.key }); stunT(t, 'hex'); }
      }

      // damage specials replace the normal attack on their turn
      const foes = alive(enemiesOf(u));
      if (!foes.length) return;
      if (u.ab.nuke && u.actions % 3 === 0 && can()) {
        const t = foes.reduce((a, b) => (b.hp < a.hp ? b : a));
        log({ k: 'cast', u: u.key, a: 'nuke', t: t.key }); strike(u, t, u.ab.nuke / 100, 'nuke', { magic: true, sure: true, noRetaliate: true });
      } else if (u.ab.wombo && u.actions % 5 === 0 && can()) {
        log({ k: 'cast', u: u.key, a: 'wombo' });
        foes.forEach(t => { strike(u, t, u.ab.wombo / 100, 'wombo', { noRetaliate: true }); if (t.hp > 0 && R() < 0.3) stunT(t);  });
      } else if (u.ab.waveClear && u.actions % 3 === 0 && can()) {
        log({ k: 'cast', u: u.key, a: 'waveClear' }); foes.forEach(t => strike(u, t, u.ab.waveClear / 100, 'waveClear', { noRetaliate: true }));
      } else if (u.ab.stomp && u.actions % 4 === 0 && can()) {
        const front = foes.filter(t => t.row === 0); const hitList = front.length ? front : foes;
        log({ k: 'cast', u: u.key, a: 'stomp' });
        hitList.forEach(t => { strike(u, t, u.ab.stomp / 100, 'stomp', { noRetaliate: true }); if (t.hp > 0 && R() < 0.25) stunT(t);  });
      } else {
        let t, mult = 1, tag;
        if (u.ab.blink && u.actions === 1) { t = foes.reduce((a, b) => (b.hp < a.hp ? b : a)); mult += u.ab.blink / 100; tag = 'blink'; log({ k: 'cast', u: u.key, a: 'blink', t: t.key }); }
        else t = pickTarget(u);
        if (u.ab.firstStrike && u.actions === 1) { mult += u.ab.firstStrike / 100; tag = tag || 'firstStrike'; }
        const o = {};
        if (u.ab.arcane && u.actions % 4 === 0) { mult += u.ab.arcane / 100; o.magic = true; tag = tag || 'arcane'; log({ k: 'cast', u: u.key, a: 'arcane', t: t.key }); }
        strike(u, t, mult, tag, o);
        if (u.ab.cleave) {
          const side = alive(enemiesOf(u)).filter(x => x !== t && x.row === t.row && Math.abs(x.col - t.col) === 1);
          side.forEach(x => strike(u, x, u.ab.cleave / 100, 'cleave', { noRetaliate: true }));
        }
        if (u.ab.pierce) {
          const behind = alive(enemiesOf(u)).filter(x => x.row === 1 && t.row === 0).sort((a, b) => Math.abs(a.col - t.col) - Math.abs(b.col - t.col))[0];
          if (behind) strike(u, behind, u.ab.pierce / 100, 'pierce', { noRetaliate: true });
        }
        if (u.ab.doubleStrike && u.hp > 0 && R() * 100 < u.ab.doubleStrike) {
          const t2 = t.hp > 0 ? t : pickTarget(u);
          if (t2) strike(u, t2, 1, 'double');
        }
        if (u.ab.wardHeal) heal(weakestAlly(u), u.ab.wardHeal, u);
      }

      runPending();
      // the pet follows up
      const P = u.pet;
      if (P && u.hp > 0) {
        const pf = alive(enemiesOf(u));
        if (pf.length) {
          if (P.a === 'petRune' && u.actions % 6 === 0) {
            const r = ['dd', 'haste', 'regen'][Math.floor(R() * 3)];
            if (r === 'dd') u.stacksAtk += 12; else if (r === 'haste') u.spdBonus += 2; else heal(u, 35, u);
            log({ k: 'rune', u: u.key, r });
          }
          if (P.a === 'petBottle' && u.actions % 4 === 0 && u.hp < u.maxHp) { log({ k: 'cast', u: u.key, a: 'bottle' }); heal(u, P.p, u); }
          const hitPet = (t, mult, tag) => {
            if (P.a !== 'petReveal' && R() * 100 < evaOf(t) * 0.5) { log({ k: 'pet', s: u.key, t: t.key, miss: true }); return; }
            let d = P.dmg * mult * (0.85 + R() * 0.3);
            if (P.a === 'packBonus') d *= 1 + P.p / 100 * alive(teamOf(u)).filter(x => x !== u && x.pet).length;
            d *= 100 / (100 + Math.max(0, armorOf(t)) * 6);
            const dealt = damage(t, d, u, 'pet');
            log({ k: 'pet', s: u.key, t: t.key, d: dealt, a: tag, h: Math.max(0, t.hp) });
            if (t.hp > 0 && P.a === 'petSlow') t.slow = Math.min(t.spd * SLOW_CAP, t.slow + P.p);
            if (t.hp > 0 && P.a === 'petReveal') t.evaDebuff = Math.min(P.p * 4, t.evaDebuff + P.p);
            if (t.hp > 0 && ((P.a === 'petStun' && R() * 100 < P.p) || (P.a === 'petChomp' && R() < 0.2))) stunT(t);
          };
          if (P.a === 'petBreath') pf.forEach(t => hitPet(t, P.p / 100, 'breath'));
          else {
            let t;
            if (P.a === 'petFocus') { if (!P.focus || P.focus.hp <= 0) P.focus = pf.reduce((a, b) => (b.power > a.power ? b : a)); t = P.focus; }
            else t = pf[Math.floor(R() * pf.length)];
            hitPet(t, P.a === 'petFocus' || P.a === 'petChomp' ? 1 + P.p / 100 : 1);
            if (P.a === 'hydra') { const t2 = alive(enemiesOf(u)).filter(x => x !== t); if (t2.length) hitPet(t2[Math.floor(R() * t2.length)], P.p / 100, 'hydra'); }
          }
        }
      }
    }

    function runPending() {
      while (pending.length) {
        const w = pending.shift();
        const foes = alive(enemiesOf(w));
        if (w.hp <= 0 || !foes.length) continue;
        log({ k: 'cast', u: w.key, a: 'wipe' });
        w.wiping = true;
        foes.forEach(t => strike(w, t, w.ab.wipe / 100, 'wipe', { noRetaliate: true }));
        w.wiping = false;
      }
    }

    let winner = null, reason = 'ko';
    outer: for (let tick = 0; tick < 5000; tick++) {
      for (const u of all) if (u.hp > 0) u.gauge += spdOf(u);
      const ready = all.filter(u => u.hp > 0 && u.gauge >= 100).sort((a, b) => b.gauge - a.gauge || a.key.localeCompare(b.key));
      for (const u of ready) {
        if (u.hp <= 0) continue;
        u.gauge -= 100;
        act(u);
        runPending();
        const aAlive = alive(T[0]).length, bAlive = alive(T[1]).length;
        if (!aAlive || !bAlive) { winner = aAlive ? 0 : 1; break outer; }
        if (n >= MAX_ACTIONS) break outer;
      }
    }
    const hpPct = t => t.units.reduce((s, u) => s + Math.max(0, u.hp) / u.maxHp, 0) / t.units.length;
    if (winner == null) { reason = 'time'; const a = hpPct(T[0]), b = hpPct(T[1]); winner = a === b ? (R() < 0.5 ? 0 : 1) : (a > b ? 0 : 1); }
    log({ k: 'end', w: winner, reason });
    const mvp = all.filter(u => u.key[0] === (winner ? 'b' : 'a')).reduce((a, b) => ((b.dealt + b.healed) > (a.dealt + a.healed) ? b : a));
    return {
      winner, reason, actions: n, events: ev,
      teams: T.map(t => ({ id: t.id, name: t.name, power: t.power, runes: t.runes, underdog: t.underdog,
        units: t.units.map(u => ({ key: u.key, name: u.name, lo: u.lo, pos: u.pos, row: u.row, col: u.col, bot: u.bot, playerId: u.playerId,
          maxHp: u.maxHp, hp: Math.max(0, u.hp), type: u.type, power: u.power, dealt: u.dealt, healed: u.healed, taken: u.taken, kills: u.kills, pet: u.pet ? u.pet.name : null })),
        hpLeft: hpPct(t) })),
      mvp: mvp.key,
    };
  }

  // ---------- Fight Night ----------
  // Fight times inside the season: the configured weekdays at the configured local hour.
  function fightTimes(cfg, S) {
    const g = cfg.guilds || {}, tz = cfg.timezoneOffsetHours;
    const days = g.fightDays || [6, 0], hour = g.fightHour == null ? 21 : g.fightHour;
    const { start, end } = S.seasonRange(cfg);
    const out = [];
    for (let day = S.localDay(start, tz); S.dayToTs(day, tz) < end; day++) {
      const wd = (day + 4) % 7;                                  // 1970-01-01 was a Thursday
      if (days.includes(wd)) out.push(S.dayToTs(day, tz) + hour * 3600);
    }
    return out;
  }
  const fightId = (ts, tz) => new Date((ts + tz * 3600) * 1000).toISOString().slice(0, 10);

  // Pair guilds by power: strongest with the next closest, avoiding an immediate rematch when possible.
  // guilds: [{ id, power }], recent: { [guildId]: [opponentIds of the last fights] }
  function pairGuilds(guilds, recent = {}) {
    const list = guilds.slice().sort((a, b) => b.power - a.power || String(a.id).localeCompare(String(b.id)));
    const pairs = [];
    while (list.length) {
      const g = list.shift();
      if (!list.length) { pairs.push([g, null]); break; }
      const avoid = new Set((recent[g.id] || []).slice(-1));
      const ranked = list.map((o, i) => ({ o, i, diff: Math.abs(o.power - g.power) })).sort((a, b) => a.diff - b.diff || a.i - b.i);
      const pick = ranked.find(r => !avoid.has(r.o.id)) || ranked[0];
      list.splice(list.indexOf(pick.o), 1);
      pairs.push([g, pick.o]);
    }
    return pairs;
  }

  // Run one Fight Night from its snapshot. snapshot: { id, at, guilds: [{ id, name, tag, crest, members: [{ name, lo, pos, playerId }], runes }] }
  const UNDERDOG = 0.35;                                         // weaker guild gets this x the power gap as +% attack and HP
  // Fight Night matches are best of 3: first guild to win 2 rounds takes the match. Same frozen lineups every round,
  // HP resets between rounds, the underdog bonus and runes apply each round, and each round has its own seed,
  // so every visitor sees exactly the same rounds.
  const ROUNDS_TO_WIN = 2;
  const roundSeed = (base, n) => (n === 0 ? base : `${base}|r${n + 1}`);   // round 1 keeps the old single-fight seed
  function playMatch(a, b, base, opts) {
    const rounds = [], wins = [0, 0];
    while (wins[0] < ROUNDS_TO_WIN && wins[1] < ROUNDS_TO_WIN) {
      const res = simulate(a, b, roundSeed(base, rounds.length), opts);
      rounds.push(res); wins[res.winner]++;
    }
    return { rounds, score: wins, winner: wins[0] > wins[1] ? 0 : 1 };
  }
  // MVP of the match: most damage + healing over all rounds, on the guild that won the match.
  function matchMvp(m) {
    const tot = {};
    m.rounds.forEach(r => r.teams.forEach(t => t.units.forEach(u => { const x = tot[u.key] || (tot[u.key] = { key: u.key, name: u.name, v: 0 }); x.v += u.dealt + u.healed; })));
    const side = m.winner === 0 ? 'a' : 'b';
    return Object.values(tot).filter(x => x.key[0] === side).sort((x, y) => y.v - x.v || x.key.localeCompare(y.key))[0];
  }
  const fightOpts = (snapshot, b) => ({ underdog: b ? (snapshot.underdog == null ? UNDERDOG : snapshot.underdog) : 0 });

  function runFightNight(snapshot, recent = {}) {
    const eligible = snapshot.guilds.filter(g => (g.members || []).length >= (snapshot.minMembers || 3));
    const withPower = eligible.map(g => ({ ...g, power: teamPower(g) }));
    const pairs = pairGuilds(withPower, recent);
    return pairs.map(([a, b], i) => {
      const opp = b || guardianTeam(a.power);
      const m = playMatch(a, opp, `${snapshot.id}|${a.id}|${opp.id}`, fightOpts(snapshot, b));
      const first = m.rounds[0], mvp = matchMvp(m);
      // enemy HP destroyed, averaged over the rounds played (a tiebreaker in the guild league)
      const destroyed = [0, 1].map(s => m.rounds.reduce((x, r) => x + (1 - r.teams[1 - s].hpLeft), 0) / m.rounds.length);
      return { fight: snapshot.id, at: snapshot.at, idx: i, a: a.id, b: b ? b.id : null, winner: m.winner, score: m.score,
        rounds: m.rounds.map(r => ({ winner: r.winner, reason: r.reason, hpLeft: r.teams.map(t => t.hpLeft), actions: r.actions })),
        reason: m.rounds[m.rounds.length - 1].reason, actions: m.rounds.reduce((x, r) => x + r.actions, 0),
        power: [a.power, b ? b.power : Math.round(first.teams[1].power)], hpLeft: m.rounds[m.rounds.length - 1].teams.map(t => t.hpLeft), destroyed,
        mvp: mvp.key, mvpName: mvp.name, underdog: first.teams.map(t => t.underdog) };
    });
  }

  // Run a whole season of fight nights in order (recent opponents feed the next pairing).
  function runSeason(snapshots) {
    const recent = {}, results = [];
    for (const snap of snapshots.slice().sort((a, b) => a.at - b.at)) {
      const night = runFightNight(snap, recent);
      night.forEach(r => {
        results.push(r);
        if (r.b) { (recent[r.a] = recent[r.a] || []).push(r.b); (recent[r.b] = recent[r.b] || []).push(r.a); }
      });
    }
    return results;
  }

  // Re-run one match for the replay viewer (exact same rounds): returns every round's full fight.
  function replay(snapshot, result) {
    const g = id => snapshot.guilds.find(x => x.id === id);
    const a = g(result.a), b = result.b ? g(result.b) : guardianTeam(teamPower(a));
    return playMatch(a, b, `${snapshot.id}|${a.id}|${b.id}`, fightOpts(snapshot, result.b)).rounds;
  }

  // Guild league: match wins, then round difference, then how much enemy HP was destroyed, then the power of opponents faced.
  function leagueTable(results, guilds) {
    const row = id => rows[id] || (rows[id] = { id, w: 0, l: 0, rw: 0, rl: 0, played: 0, destroyed: 0, oppPower: 0, streak: '', last: [] });
    const rows = {};
    guilds.forEach(g => row(g.id));
    for (const r of results) {
      const sides = [[r.a, 0], [r.b, 1]];
      for (const [id, s] of sides) {
        if (!id) continue;
        const x = row(id), won = r.winner === s;
        x.played++; won ? x.w++ : x.l++;
        const sc = r.score || [r.winner === 0 ? 1 : 0, r.winner === 1 ? 1 : 0];
        x.rw += sc[s]; x.rl += sc[1 - s];
        x.destroyed += r.destroyed ? r.destroyed[s] : 1 - r.hpLeft[1 - s];
        x.oppPower += r.power[1 - s];
        x.last.push(won ? 'W' : 'L');
      }
    }
    const list = Object.values(rows).filter(x => guilds.some(g => g.id === x.id));
    list.forEach(x => { x.last = x.last.slice(-5); x.destroyedPct = x.played ? x.destroyed / x.played : 0; });
    // order: match wins, then rounds won minus rounds lost, then enemy HP destroyed, then the power of opponents faced
    list.sort((a, b) => (b.played ? 1 : 0) - (a.played ? 1 : 0) || b.w - a.w || (b.rw - b.rl) - (a.rw - a.rl) || b.destroyed - a.destroyed || b.oppPower - a.oppPower || a.l - b.l);
    let prev = null, rnk = 0;
    list.forEach((x, i) => { const k = `${x.w}|${x.rw - x.rl}|${x.destroyed.toFixed(4)}|${x.oppPower}`; if (k !== prev) { rnk = i + 1; prev = k; } x.rank = x.played ? rnk : null; });
    return list;
  }

  // Runes for a fight: last finished week's qualified top 3 give their guild a rune.
  function runesFor(weekTable) {
    const out = {};
    (weekTable || []).filter(r => r.rank != null && r.rank <= 3 && r.played > 0).forEach(r => { out[r.id] = ['dd', 'haste', 'regen'][r.rank - 1]; });
    return out;
  }

  return {
    ITEMS, RUNES, RARITY_PTS, BASE, BOT_POWER, ABILITY_TEXT, AURA_TEXT, itemBattleText, slotStatText, avatarPower, teamPower, makeUnit, buildTeam,
    simulate, guardianTeam, UNDERDOG, ROUNDS_TO_WIN, playMatch, fightTimes, fightId, pairGuilds, runFightNight, runSeason, replay, leagueTable, runesFor, seeded,
  };
});
