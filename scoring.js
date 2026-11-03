/*
 * Pixel Ancients scoring — shared by the website (browser) and the hourly data job (Node).
 * Pure functions only: give it raw OpenDota data + config, get leaderboards back.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LeagueScoring = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const DAY = 86400;
  const GAME_MODES = { 23: 'turbo', 22: 'allpick' };

  // ---- time helpers (weeks run Monday 00:00 -> Sunday 23:59 in league local time) ----
  function localDay(ts, tz) { return Math.floor((ts + tz * 3600) / DAY); }
  function weekStartDay(ts, tz) { const d = localDay(ts, tz); return d - ((d + 3) % 7); } // 1970-01-01 was a Thursday
  function dayToTs(day, tz) { return day * DAY - tz * 3600; }
  function weekRange(weekDay, tz) { return { start: dayToTs(weekDay, tz), end: dayToTs(weekDay + 7, tz) }; }
  function parseLocalDate(str, tz) {
    const [y, m, d] = str.split('-').map(Number);
    return Date.UTC(y, m - 1, d) / 1000 - tz * 3600;
  }
  function seasonWeeks(cfg) {
    const tz = cfg.timezoneOffsetHours;
    const first = weekStartDay(parseLocalDate(cfg.season.start, tz), tz);
    return Array.from({ length: cfg.season.weeks }, (_, i) => first + i * 7);
  }
  function seasonRange(cfg) {
    const weeks = seasonWeeks(cfg), tz = cfg.timezoneOffsetHours;
    // includes the finals week after the last regular week
    return { start: dayToTs(weeks[0], tz), end: dayToTs(weeks[weeks.length - 1] + 14, tz) };
  }

  // Which game modes score. config.scoring.modes, e.g. ['turbo'] or ['turbo', 'allpick'].
  function countedModes(cfg) { const known = Object.values(GAME_MODES); return (cfg.scoring.modes || ['turbo']).filter(x => known.includes(x)); }
  const PARTY_LABEL = ['Solo', 'Duo', 'Trio', '4-stack', '5-stack'];
  const partyLabel = n => PARTY_LABEL[Math.max(1, Math.min(5, n)) - 1];
  // Fields requested from OpenDota's /players/{id}/matches (asking for any field means asking for all of them).
  const MATCH_FIELDS = ['match_id', 'player_slot', 'radiant_win', 'duration', 'game_mode', 'lobby_type', 'hero_id', 'start_time',
    'kills', 'deaths', 'assists', 'leaver_status', 'party_size', 'last_hits', 'denies', 'gold_per_min', 'hero_damage', 'tower_damage', 'hero_healing'];
  const matchesQuery = () => MATCH_FIELDS.map(f => `project=${f}`).join('&');

  const isRadiant = slot => slot < 128;
  const kdaOf = (k, d, a) => ((k || 0) + (a || 0)) / Math.max(d || 0, 1);

  function rankRows(rows, key) {
    let prev = null, rnk = 0;
    rows.forEach((r, i) => { const v = key(r); if (v !== prev) { rnk = i + 1; prev = v; } r.rank = rnk; });
    return rows;
  }

  // ---- Weekly Points from pubs ----
  // members: [{id, name}], raw: { [accountId]: [OpenDota /players/{id}/matches rows] }
  // Win points depend on party size (solo wins are worth the most); every loss earns the same.
  // Party size = the bigger of OpenDota's party_size and the number of registered members on your team.
  function scorePubs(members, raw, cfg) {
    const s = cfg.scoring, tz = cfg.timezoneOffsetHours;
    const allowed = countedModes(cfg);
    const byMatch = new Map();
    for (const p of members) for (const m of raw[p.id] || []) {
      if (!byMatch.has(m.match_id)) byMatch.set(m.match_id, []);
      byMatch.get(m.match_id).push({ id: p.id, radiant: isRadiant(m.player_slot) });
    }
    const out = {};
    for (const p of members) {
      const list = (raw[p.id] || []).slice().sort((a, b) => a.start_time - b.start_time);
      const perDay = new Map(), perWeek = new Map();
      const entries = [];
      for (const m of list) {
        const mode = GAME_MODES[m.game_mode];
        if (!mode || !allowed.includes(mode)) continue;
        const mates = (byMatch.get(m.match_id) || []).filter(x => x.id !== p.id && x.radiant === isRadiant(m.player_slot));
        const party = Math.max(1, Math.min(5, Math.max(m.party_size || 1, mates.length + 1)));
        const e = {
          match_id: m.match_id, start_time: m.start_time, mode, hero_id: m.hero_id, party,
          kills: m.kills || 0, deaths: m.deaths || 0, assists: m.assists || 0, duration: m.duration || 0,
          last_hits: m.last_hits || 0, denies: m.denies || 0, gpm: m.gold_per_min || 0, hero_damage: m.hero_damage || 0,
          tower_damage: m.tower_damage || 0, hero_healing: m.hero_healing || 0,
          points: 0, tags: [], counted: true, result: null,
        };
        if (mates.length) { e.tags.push('Stack'); e.stackWith = mates.map(x => x.id); }   // gear stat: played with members
        const win = m.radiant_win == null ? null : isRadiant(m.player_slot) === !!m.radiant_win;
        if ((m.leaver_status || 0) >= 2) {
          e.points = s.abandon; e.result = 'abandon'; e.tags.push('Abandon'); entries.push(e); continue;
        }
        if (e.duration < s.minDurationSeconds[mode]) { e.counted = false; e.tags.push('Remake'); entries.push(e); continue; }
        if (win === null) { e.counted = false; e.tags.push('No result'); entries.push(e); continue; }
        e.result = win ? 'win' : 'loss';
        const day = localDay(m.start_time, tz), wk = weekStartDay(m.start_time, tz);
        if ((perDay.get(day) || 0) >= s.dailyCap) { e.counted = false; e.tags.push('Over daily cap'); entries.push(e); continue; }
        if (s.weeklyCap && (perWeek.get(wk) || 0) >= s.weeklyCap) { e.counted = false; e.tags.push('Over weekly cap'); entries.push(e); continue; }
        perDay.set(day, (perDay.get(day) || 0) + 1); perWeek.set(wk, (perWeek.get(wk) || 0) + 1);
        e.points = win ? s.partyWin[party] : s.loss;
        if (kdaOf(e.kills, e.deaths, e.assists) >= s.kdaThreshold) e.tags.push('KDA');   // gear stat only, no points
        entries.push(e);
      }
      out[p.id] = entries;
    }
    return out;
  }

  // Order: points, then KDA over the period, then fewer deaths. Still level = shared rank.
  const tieKey = r => `${r.points}|${r.kda.toFixed(4)}|${r.deaths}`;
  function sortAndRank(rows, pointsOf, final) {
    rows.sort((a, b) => (final ? (b.qualified - a.qualified) : 0) || pointsOf(b) - pointsOf(a) || b.kda - a.kda || a.deaths - b.deaths || a.name.localeCompare(b.name));
    let prev = null, rnk = 0, n = 0;
    for (const r of rows) {
      if (final && !r.qualified) { r.rank = null; continue; }
      n++; const k = tieKey({ points: pointsOf(r), kda: r.kda, deaths: r.deaths });
      if (k !== prev) { rnk = n; prev = k; }
      r.rank = rnk;
    }
    // flag players level on points with someone, so the table can say what broke the tie
    rows.forEach(r => { r.tiebreak = rows.some(o => o !== r && pointsOf(o) === pointsOf(r) && o.played > 0 && r.played > 0 && (!final || o.qualified === r.qualified)); });
    return rows;
  }

  // opts.final: the week is over, so only qualified players (minGames) are ranked.
  function weeklyTable(members, scored, weekDay, cfg, opts = {}) {
    const { start, end } = weekRange(weekDay, cfg.timezoneOffsetHours);
    const min = cfg.scoring.minGames || 0;
    const rows = members.map(p => {
      const es = (scored[p.id] || []).filter(e => e.start_time >= start && e.start_time < end);
      const r = { id: p.id, name: p.name, points: 0, wins: 0, losses: 0, abandons: 0, turbo: 0, allpick: 0, stacks: 0, kdaBonuses: 0,
        kills: 0, deaths: 0, assists: 0, party: [0, 0, 0, 0, 0] };
      for (const e of es) {
        if (!e.counted) continue;
        r.points += e.points;
        if (e.result === 'win') r.wins++;
        else if (e.result === 'loss') r.losses++;
        else if (e.result === 'abandon') r.abandons++;
        if (e.result !== 'abandon') { r[e.mode]++; r.kills += e.kills; r.deaths += e.deaths; r.assists += e.assists; r.party[e.party - 1]++; }
        if (e.tags.includes('Stack')) r.stacks++;
        if (e.tags.includes('KDA')) r.kdaBonuses++;
      }
      r.games = r.wins + r.losses + r.abandons;
      r.played = r.wins + r.losses;
      r.kda = kdaOf(r.kills, r.deaths, r.assists);
      r.qualified = r.played >= min;
      r.needs = Math.max(0, min - r.played);
      r.entries = es.slice().sort((a, b) => b.start_time - a.start_time);
      return r;
    });
    return sortAndRank(rows, r => r.points, !!opts.final);
  }

  function seasonTable(members, scored, cfg) {
    const weeks = seasonWeeks(cfg);
    const rows = members.map(p => {
      const wk = weeks.map(w => weeklyTable([p], scored, w, cfg)[0]);
      const perWeek = wk.map(r => r.points);
      const sum = k => wk.reduce((a, r) => a + r[k], 0);
      const r = { id: p.id, name: p.name, perWeek, total: perWeek.reduce((a, b) => a + b, 0),
        kills: sum('kills'), deaths: sum('deaths'), assists: sum('assists'), played: sum('played') };
      r.kda = kdaOf(r.kills, r.deaths, r.assists);
      return r;
    });
    return { weeks, rows: sortAndRank(rows, r => r.total, false) };
  }

  // ---- League ELO from lobby matches ----
  // leagueMatches: OpenDota /matches/{id} objects (players[], radiant_win, start_time)
  function computeElo(members, leagueMatches, cfg) {
    const e = cfg.elo, ids = new Set(members.map(p => p.id));
    const { start, end } = seasonRange(cfg);
    const st = {};
    members.forEach(p => { st[p.id] = { id: p.id, name: p.name, rating: e.start, games: 0, wins: 0, losses: 0, last: 0 }; });
    const ms = leagueMatches
      .filter(m => m && Array.isArray(m.players) && m.radiant_win != null && m.start_time >= start && m.start_time < end)
      .sort((a, b) => a.start_time - b.start_time);
    const log = [];
    for (const m of ms) {
      const ratingOf = x => (ids.has(x.account_id) ? st[x.account_id].rating : e.start);
      const avg = arr => (arr.length ? arr.reduce((s, x) => s + ratingOf(x), 0) / arr.length : e.start);
      const rad = m.players.filter(x => isRadiant(x.player_slot));
      const dire = m.players.filter(x => !isRadiant(x.player_slot));
      const radAvg = avg(rad), direAvg = avg(dire);
      const expRad = 1 / (1 + Math.pow(10, (direAvg - radAvg) / 400));
      const changes = m.players.map(x => {
        const radiant = isRadiant(x.player_slot);
        const base = { radiant, hero_id: x.hero_id, kills: x.kills, deaths: x.deaths, assists: x.assists };
        if (!ids.has(x.account_id)) return { ...base, id: null, name: x.personaname || 'Guest', delta: null };
        const p = st[x.account_id];
        const S = radiant === !!m.radiant_win ? 1 : 0;
        const E = radiant ? expRad : 1 - expRad;
        const K = p.games < e.newPlayerGames ? e.kNew : e.k;
        return { ...base, id: p.id, name: p.name, delta: Math.round(K * (S - E)), win: S === 1 };
      });
      for (const c of changes) {
        if (c.id == null) continue;
        const p = st[c.id];
        p.rating += c.delta; p.games++; p.last = c.delta;
        if (c.win) p.wins++; else p.losses++;
      }
      log.push({ match_id: m.match_id, start_time: m.start_time, duration: m.duration, radiant_win: !!m.radiant_win,
        radAvg: Math.round(radAvg), direAvg: Math.round(direAvg), changes });
    }
    const all = Object.values(st).filter(p => p.games > 0).sort((a, b) => b.rating - a.rating || b.wins - a.wins);
    const ladder = rankRows(all.filter(p => p.games >= e.minGamesForLadder), p => p.rating);
    const provisional = all.filter(p => p.games < e.minGamesForLadder);
    return { ladder, provisional, matches: log.reverse() };
  }

  // Roster = players in config.js + players who linked their own Dota account (Supabase "players" table).
  // A config entry owns its Dota account; a linked row fills in its Discord ID if config left it blank.
  function mergeRoster(cfgPlayers, dbRows) {
    const out = (cfgPlayers || []).map(p => ({ ...p, id: Number(p.id) }));
    for (const r of Array.isArray(dbRows) ? dbRows : []) {
      if (!r || !Number(r.account_id) || !r.discord_id) continue;
      const id = Number(r.account_id), did = String(r.discord_id);
      const cfg = out.find(p => p.id === id);
      if (cfg) { if (!cfg.discordId) { cfg.discordId = did; cfg.linked = true; cfg.linkedAt = r.linked_at; } continue; }
      if (out.some(p => String(p.discordId || '') === did)) continue;
      out.push({ id, name: r.name, discord: '', discordId: did, linked: true, linkedAt: r.linked_at });
    }
    return out;
  }

  return {
    GAME_MODES, MATCH_FIELDS, matchesQuery, countedModes, localDay, weekStartDay, weekRange, dayToTs, parseLocalDate, seasonWeeks, seasonRange,
    scorePubs, weeklyTable, seasonTable, computeElo, kdaOf, isRadiant, partyLabel, PARTY_LABEL, mergeRoster,
  };
});
