/*
 * Sample data for demo mode (config.js -> demo: true). Made-up players and matches,
 * generated the same way every time so the preview is stable.
 */
window.LEAGUE_DEMO = {
  generate(cfg) {
    let seed = 20261102;
    const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const pick = arr => arr[Math.floor(rnd() * arr.length)];
    const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const S = window.LeagueScoring, tz = cfg.timezoneOffsetHours;

    const heroes = { 1: 'Anti-Mage', 2: 'Axe', 3: 'Bane', 4: 'Bloodseeker', 5: 'Crystal Maiden', 6: 'Drow Ranger', 7: 'Earthshaker', 8: 'Juggernaut',
      9: 'Mirana', 10: 'Morphling', 11: 'Shadow Fiend', 12: 'Phantom Lancer', 13: 'Puck', 14: 'Pudge', 15: 'Razor', 16: 'Sand King', 17: 'Storm Spirit',
      18: 'Sven', 19: 'Tiny', 20: 'Vengeful Spirit', 21: 'Windranger', 22: 'Zeus', 23: 'Kunkka', 25: 'Lina', 26: 'Lion', 27: 'Shadow Shaman',
      28: 'Slardar', 29: 'Tidehunter', 30: 'Witch Doctor', 31: 'Lich', 32: 'Riki', 33: 'Enigma', 34: 'Tinker', 35: 'Sniper', 36: 'Necrophos',
      37: 'Warlock', 38: 'Beastmaster', 39: 'Queen of Pain', 40: 'Venomancer', 41: 'Faceless Void', 42: 'Wraith King', 43: 'Death Prophet',
      44: 'Phantom Assassin', 45: 'Pugna', 46: 'Templar Assassin', 47: 'Viper', 48: 'Luna', 49: 'Dragon Knight', 50: 'Dazzle' };
    const heroIds = Object.keys(heroes).map(Number);

    const names = ['Rapier Rizal', 'Teh Tarik TA', 'Mamak Mid', 'Kopi Carry', 'Wardbot Wei', 'Smoke Gank Siti', 'Aegis Ah Meng', 'Roshan Rani',
      'Dewdrop Daniel', 'Hex Hafiz', 'Blink Bella', 'Midas Mei', 'Tango Tan', 'Nasi Lemak Nuker'];
    const members = names.map((name, i) => ({ id: 100000101 + i * 7919, name, discord: '' }));
    const skill = Object.fromEntries(members.map((m, i) => [m.id, 0.62 - i * 0.017 + (rnd() - 0.5) * 0.08]));
    const activity = Object.fromEntries(members.map(m => [m.id, 0.5 + rnd() * 1.3]));
    const roles = Object.fromEntries(members.map(m => [m.id, rnd()]));
    const mains = Object.fromEntries(members.map(m => [m.id, pick(heroIds)]));

    const seasonStart = S.parseLocalDate(cfg.season.start, tz);
    const now = seasonStart + 24 * 86400 + 14 * 3600; // a Thursday afternoon, week 4
    const from = seasonStart - 7 * 86400;
    const raw = Object.fromEntries(members.map(m => [m.id, []]));
    let matchId = 8100000000;

    const pubRow = (id, slot, radiantWin, mode, start, dur, partySize = 1) => {
      const won = (slot < 128) === radiantWin;
      const deaths = int(0, mode === 23 ? 12 : 10), mins = dur / 60;
      const role = roles[id] != null ? roles[id] : 0.5;                 // 1 = farming core, 0 = support
      const lhPerMin = mode === 23 ? 2 + role * 12 : 1 + role * 7;
      return { match_id: matchId, player_slot: slot, radiant_win: radiantWin, duration: dur, game_mode: mode, lobby_type: mode === 22 ? pick([0, 7, 7]) : 0,
        hero_id: rnd() < 0.3 ? mains[id] : pick(heroIds), start_time: start, kills: int(won ? 4 : 1, won ? 16 + Math.round(role * 8) : 9), deaths,
        assists: int(won ? 6 : 2, won ? 24 + Math.round((1 - role) * 10) : 14),
        leaver_status: rnd() < 0.012 ? 3 : 0, party_size: partySize,
        last_hits: Math.round(lhPerMin * mins * (0.75 + rnd() * 0.5)), denies: int(0, 4 + Math.round(role * 10)),
        gold_per_min: Math.round((mode === 23 ? 520 : 300) + role * (mode === 23 ? 700 : 350) + (won ? 120 : 0) + (rnd() - 0.5) * 200),
        hero_damage: Math.round((6000 + role * 34000 + rnd() * 18000) * mins / 25),
        tower_damage: rnd() < 0.45 ? int(0, 1500) : Math.round((1500 + role * 7000 + rnd() * 3000) * (won ? 1 : 0.4)),
        hero_healing: role < 0.35 && rnd() < 0.6 ? int(1500, 9000) : int(0, 500) };
    };

    // a strong regular five-stack: these five often queue together and win most of those games
    const five = ['Kopi Carry', 'Wardbot Wei', 'Smoke Gank Siti', 'Hex Hafiz', 'Tango Tan'].map(n => members.find(m => m.name === n));
    const turboDur = () => (rnd() < 0.03 ? 300 : rnd() < 0.08 ? int(35, 48) * 60 : int(15, 34) * 60);

    // solo pubs and member stacks, day by day
    for (let day = from; day < now; day += 86400) {
      if (rnd() < 0.5) {
        const n = int(2, 4);
        for (let g = 0; g < n; g++) {
          const start = day + int(19, 23) * 3600 + g * 2100;
          if (start > now) continue;
          const radiantSide = rnd() < 0.5, radiantWin = radiantSide === (rnd() < 0.74), dur = turboDur();
          matchId += int(1, 900);
          five.forEach((x, i) => raw[x.id].push(pubRow(x.id, radiantSide ? i : 128 + i, radiantWin, 23, start, dur, 5)));
        }
      }
      for (const m of members) {
        const grind = ['Aegis Ah Meng', 'Mamak Mid', 'Rapier Rizal', 'Blink Bella'].includes(m.name) ? 1.9 : 1;   // solo grinders
        const games = Math.max(0, Math.round((rnd() * 3.6 - 0.4) * activity[m.id] * grind * (five.includes(m) ? 0.45 : 1)));
        for (let g = 0; g < games; g++) {
          const start = day + int(11, 25) * 3600 + int(0, 59) * 60;
          if (start > now) continue;
          const mode = rnd() < 0.85 ? 23 : 22;
          const dur = mode === 23 ? turboDur() : int(26, 52) * 60;
          const slot = rnd() < 0.5 ? int(0, 4) : 128 + int(0, 4);
          const mates = rnd() < 0.22 ? members.filter(x => x.id !== m.id).sort(() => rnd() - 0.5).slice(0, int(1, 2)) : [];
          const radiantSide = slot < 128;
          const p = [m, ...mates].reduce((s, x) => s + skill[x.id], 0) / (1 + mates.length);
          const ourWin = rnd() < p;
          const radiantWin = radiantSide ? ourWin : !ourWin;
          matchId += int(1, 900);
          // sometimes queued with friends who aren't members (OpenDota reports the party size)
          const party = Math.max(1 + mates.length, rnd() < 0.7 ? 1 : int(2, 3));
          raw[m.id].push(pubRow(m.id, slot, radiantWin, mode, start, dur, party));
          mates.forEach((x, i) => raw[x.id].push(pubRow(x.id, radiantSide ? (slot + 1 + i) % 5 : 128 + ((slot - 128 + 1 + i) % 5), radiantWin, mode, start, dur, party)));
        }
      }
    }

    // lobby nights: Friday and Saturday, two games each
    const league = [];
    for (let d = seasonStart; d < now; d += 86400) {
      const wd = new Date((d + tz * 3600) * 1000).getUTCDay();
      if (wd !== 5 && wd !== 6) continue;
      for (let g = 0; g < 2; g++) {
        const start = d + 21.5 * 3600 + g * 3000;
        if (start > now) continue;
        const ten = members.slice().sort(() => rnd() - 0.5).slice(0, 10);
        const rad = ten.slice(0, 5), dire = ten.slice(5);
        const sum = arr => arr.reduce((s, x) => s + skill[x.id], 0);
        const radiantWin = rnd() < 0.5 + (sum(rad) - sum(dire)) * 0.9;
        matchId += int(1000, 9000);
        league.push({ match_id: matchId, radiant_win: radiantWin, start_time: start, duration: int(30, 50) * 60,
          players: ten.map((x, i) => {
            const radiant = i < 5, won = radiant === radiantWin;
            return { account_id: x.id, player_slot: radiant ? i : 128 + i - 5, hero_id: pick(heroIds),
              kills: int(won ? 4 : 1, won ? 14 : 8), deaths: int(1, 10), assists: int(won ? 6 : 3, won ? 22 : 12), personaname: x.name };
          }) });
      }
    }
    const lines = {
      'Aegis Ah Meng': ['See you on the high ground.', 'hop'], 'Mamak Mid': ['Mid or feed. I chose mid.', 'flex'],
      'Smoke Gank Siti': ['You never saw me coming 😏', 'dash'], 'Blink Bella': ["Catch me if you can't.", 'spin'],
      'Kopi Carry': ['Carry me? I AM the carry.', 'combo'], 'Roshan Rani': ['GG. Try again Monday.', 'buyback'],
      'Wardbot Wei': ['Ward your feelings.', 'shake'], 'Dewdrop Daniel': ['Stack faster next week 😎', 'run'],
      'Teh Tarik TA': ['Teh tarik on me if you beat me', 'spin'], 'Rapier Rizal': ['Last hit? More like every hit.', 'combo'],
    };
    const taunts = {};
    members.forEach(m => { if (lines[m.name]) taunts[m.id] = { taunt: lines[m.name][0], tauntAnim: lines[m.name][1] }; });

    // XPM and replay stats (wards, runes, Aegis...): drawn from each game's own number so the rest of the sample stays the same
    const hr = (id, k) => { let h = (id * 2654435761 + k * 40503) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; };
    const parsed = {};
    for (const m of members) for (const r of raw[m.id]) {
      const role = roles[m.id], won = (r.player_slot < 128) === r.radiant_win, mins = r.duration / 60, k = r.match_id;
      r.xp_per_min = Math.round(r.gold_per_min * (1.05 + hr(k, m.id % 97) * 0.35));
      if (hr(k, 1) > 0.75) continue;                                       // about a quarter of games never get parsed
      const sup = 1 - role, q = j => hr(k, m.id % 1000 + j);
      const pr = parsed[k] || (parsed[k] = { t: r.start_time + r.duration + 5400, s: r.start_time, p: {} });
      pr.p[m.id] = { obs: Math.round(sup * mins / 3 * q(2)), sen: Math.round(sup * mins / 4 * q(3)), wk: Math.round(mins / 12 * q(4)),
        ult: q(5) < 0.05 + role * 0.08 ? 1 : 0, ram: q(6) < 0.01 + role * 0.03 ? 1 : 0,
        dt: Math.round((15000 + (1 - Math.abs(role - 0.6)) * 30000 * q(7)) * mins / 30), run: Math.round(mins / 6 * (0.4 + q(8))),
        bty: Math.round(mins / 12 * q(9) * (1 + sup)), arc: q(10) < 0.25 ? 1 : 0, wat: q(11) < 0.3 ? 1 : 0, aeg: won && role > 0.6 && q(12) < 0.18 ? 1 : 0, ps: r.party_size || 1 };
    }

    // guilds: four made-up guilds (one too small to fight) and the Fight Nights already played
    const byName = n => members.find(m => m.name === n);
    const did = m => 'demo:' + m.id;
    const joined = new Date((seasonStart - 3 * 86400) * 1000).toISOString();
    const gdefs = [
      ['g-rats', 'Radiant Rats', 'RAT', { s: 0, b: 0, f: 7 }, ['Kopi Carry', 'Wardbot Wei', 'Smoke Gank Siti', 'Hex Hafiz', 'Tango Tan']],
      ['g-dump', 'Dire Dumplings', 'DUMP', { s: 2, b: 2, f: 4 }, ['Aegis Ah Meng', 'Mamak Mid', 'Teh Tarik TA', 'Roshan Rani']],
      ['g-moon', 'Midnight Mamak', 'MOON', { s: 4, b: 3, f: 7 }, ['Rapier Rizal', 'Blink Bella', 'Nasi Lemak Nuker']],
      ['g-kopi', 'Kopi O Club', 'KOPI', { s: 8, b: 5, f: 4 }, ['Midas Mei', 'Dewdrop Daniel']],
    ];
    const guilds = gdefs.map(([id, name, tag, crest, names]) => ({ id, name, tag, crest, captain: did(byName(names[0])), recruiting: names.length < 5,
      members: names.map((n, i) => ({ discord_id: did(byName(n)), position: i + 1, joined_at: joined, prev_left_at: null })) }));
    const invites = Object.fromEntries(guilds.map(g => [g.id, 'demo' + g.tag.toLowerCase()]));
    const fightAt = [];
    for (let day = S.localDay(seasonStart, tz); S.dayToTs(day, tz) < now; day++) {
      const wd = (day + 4) % 7, at = S.dayToTs(day, tz) + 21 * 3600;
      if ((wd === 6 || wd === 0) && at < now) fightAt.push(at);
    }
    const snapshots = fightAt.map(at => ({ id: new Date((at + tz * 3600) * 1000).toISOString().slice(0, 10), at,
      data: { guilds: guilds.map(g => ({ id: g.id, name: g.name, tag: g.tag, crest: g.crest, captain: g.captain, members: g.members })), loadouts: {} } }));
    return { members, heroes, raw, league, now, taunts, guilds, invites, snapshots, parsed };
  },
};
