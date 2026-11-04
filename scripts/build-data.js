#!/usr/bin/env node
/*
 * Fetches every registered player's matches and every league match from OpenDota once,
 * and writes data.json next to index.html. The website reads that file, so visitors make
 * no OpenDota calls. Run by .github/workflows/update-data.yml every hour (Node 18+).
 *
 * Optional: set the OPENDOTA_API_KEY repository secret for higher limits.
 * Players come from config.js plus everyone who linked their own account on the Join page
 * (read from Supabase with the public anon key in config.js, so no extra secret is needed).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'config.js'), 'utf8'), sandbox);
const CFG = sandbox.window.LEAGUE_CONFIG;
const S = require(path.join(root, 'scoring.js'));

const API = 'https://api.opendota.com/api';
const KEY = process.env.OPENDOTA_API_KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));

let last = 0;
let calls = 0;
async function od(p, tries = 4, method = 'GET') {
  const wait = Math.max(0, last + 1100 - Date.now());
  if (wait) await sleep(wait);
  last = Date.now(); calls++;
  const url = API + p + (KEY ? (p.includes('?') ? '&' : '?') + 'api_key=' + KEY : '');
  const res = await fetch(url, { method });
  if (res.status === 429 && tries > 1) { await sleep(10000); return od(p, tries - 1, method); }
  if (!res.ok) throw new Error(`${res.status} ${p}`);
  return res.json();
}

const slimPub = m => Object.fromEntries(S.MATCH_FIELDS.map(f => [f, m[f]]));   // keep only the fields scoring and gear use
const slimLeague = m => ({ match_id: m.match_id, radiant_win: m.radiant_win, start_time: m.start_time, duration: m.duration,
  players: (m.players || []).map(p => ({ account_id: p.account_id, player_slot: p.player_slot, hero_id: p.hero_id,
    kills: p.kills, deaths: p.deaths, assists: p.assists, personaname: p.personaname })) });

// ---------- replay stats ----------
// Some gear needs stats only a parsed replay has (wards, runes, Rampages, the Aegis). For each counted season game the job reads
// /matches/{id}; if OpenDota hasn't parsed it yet it asks for a parse (POST /request/{id}) and checks again on a later run.
// Results are kept in data.json for good, so every game is read about twice and requested at most 3 times.
const PARSE_CALLS_PER_RUN = 40;            // keeps the hourly job well inside OpenDota's free 2,000 calls a day
const PARSE_TRIES = 3, RECHECK_AFTER = 40 * 60, GIVE_UP_AFTER = 12 * 86400;   // replays expire after a week or two
const AEGIS = new Set(['CHAT_MESSAGE_AEGIS', 'CHAT_MESSAGE_AEGIS_STOLEN']);
const slotIndex = ps => (ps < 128 ? ps : ps - 128 + 5);
const sumKeys = (o, min) => Object.entries(o || {}).reduce((t, [k, v]) => t + (Number(k) >= min ? Number(v) || 0 : 0), 0);
const sumAll = o => Object.values(o || {}).reduce((t, v) => t + (Number(v) || 0), 0);
function replayStats(m, ids) {
  const out = {};
  for (const p of m.players || []) {
    if (!ids.has(String(p.account_id))) continue;
    const rn = p.runes || {};
    // party size from the replay; else count teammates sharing this player's party id
    const team = (m.players || []).filter(x => (x.player_slot < 128) === (p.player_slot < 128));
    const ps = p.party_size > 0 ? p.party_size : p.party_id ? team.filter(x => x.party_id === p.party_id).length : 0;
    const aeg = (m.objectives || []).filter(o => AEGIS.has(o.type) && (o.player_slot != null ? o.player_slot === p.player_slot : o.slot === slotIndex(p.player_slot))).length;
    out[p.account_id] = Object.fromEntries(Object.entries({
      obs: p.obs_placed || 0, sen: p.sen_placed || 0, wk: (p.observer_kills || 0) + (p.sentry_kills || 0),
      ult: sumKeys(p.multi_kills, 4), ram: sumKeys(p.multi_kills, 5),            // a Rampage also counts as an Ultra Kill
      dt: Math.round(sumAll(p.damage_taken)), run: sumAll(rn),
      bty: Number(rn[5]) || 0, arc: Number(rn[6]) || 0, wat: Number(rn[7]) || 0, aeg, ps: Math.min(5, ps),
    }).filter(([, v]) => v));                                                     // zeros are left out to keep data.json small
  }
  return out;
}
const isParsed = m => !!m && (m.version != null || (m.od_data && m.od_data.has_parsed));

async function updateReplays(out, previous, roster, now) {
  out.parsed = previous.parsed || {};
  out.parseQueue = previous.parseQueue || {};
  const ids = new Set(roster.map(p => String(p.id)));
  // drop games from earlier seasons
  Object.keys(out.parsed).forEach(id => { if (out.parsed[id].s < S.seasonRange(CFG).start - 14 * 86400) delete out.parsed[id]; });
  const scored = S.scorePubs(roster, out.players, CFG);
  const { start, end } = S.seasonRange(CFG);
  const games = new Map();
  for (const list of Object.values(scored)) for (const e of list) {
    if (e.counted && e.start_time >= start && e.start_time < end && !(e.match_id in out.parsed)) games.set(String(e.match_id), e.start_time);
  }
  Object.keys(out.parseQueue).forEach(id => { if (!games.has(id)) delete out.parseQueue[id]; });
  const budget = calls + PARSE_CALLS_PER_RUN;
  let read = 0, asked = 0, waiting = 0;
  // oldest games first, so their replays are fetched before they expire
  for (const [id, at] of [...games].sort((a, b) => a[1] - b[1])) {
    if (calls >= budget) { waiting++; continue; }
    const q = out.parseQueue[id] || { n: 0, t: 0 };
    if (q.n && now - q.t < RECHECK_AFTER) { waiting++; continue; }
    try {
      const m = await od(`/matches/${id}`); read++;
      if (isParsed(m)) { out.parsed[id] = { t: now, s: at, p: replayStats(m, ids) }; delete out.parseQueue[id]; continue; }
      if (q.n >= PARSE_TRIES || now - at > GIVE_UP_AFTER) { out.parsed[id] = { t: now, s: at, p: {}, none: 1 }; delete out.parseQueue[id]; continue; }
      await od(`/request/${id}`, 1, 'POST'); asked++;
      out.parseQueue[id] = { n: q.n + 1, t: now };
    } catch (e) { out.warnings.push(`replay ${id}: ${e.message}`); }
  }
  console.log(`Replays: ${read} read, ${asked} parse requests, ${waiting} waiting, ${Object.keys(out.parsed).length} stored`);
}

async function linkedPlayers() {
  const av = CFG.avatars || {};
  if (!av.supabaseUrl || !av.supabaseAnonKey) return [];
  const res = await fetch(av.supabaseUrl.replace(/\/$/, '') + '/rest/v1/players?select=discord_id,account_id,name,linked_at&order=linked_at',
    // New publishable keys (sb_publishable_…) go in the apikey header only; legacy anon keys (JWTs, "eyJ…") also go in Authorization.
    { headers: av.supabaseAnonKey.startsWith('eyJ') ? { apikey: av.supabaseAnonKey, Authorization: 'Bearer ' + av.supabaseAnonKey } : { apikey: av.supabaseAnonKey } });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
}

(async () => {
  const tz = CFG.timezoneOffsetHours;
  const now = Math.floor(Date.now() / 1000);
  const from = Math.min(S.parseLocalDate(CFG.season.start, tz), S.dayToTs(S.weekStartDay(now, tz) - 7, tz));
  const days = Math.max(1, Math.ceil((now - from) / 86400) + 1);

  const outFile = path.join(root, 'data.json');
  const previous = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};
  const out = { generatedAt: Date.now(), heroes: previous.heroes || {}, heroImg: previous.heroImg || {}, players: {}, leagueMatches: [], warnings: [] };

  try {
    const heroes = await od('/heroes');
    out.heroes = Object.fromEntries(heroes.map(h => [h.id, h.localized_name]));
    out.heroImg = Object.fromEntries(heroes.map(h => [h.id, String(h.name || '').replace('npc_dota_hero_', '')]));   // portrait file names
  } catch (e) { out.warnings.push('heroes: ' + e.message); }

  let linked = [];
  try { linked = await linkedPlayers(); }
  catch (e) { out.warnings.push('linked players: ' + e.message + ' (using config.js players only)'); }
  const roster = S.mergeRoster(CFG.players, linked);

  for (const p of roster) {
    try {
      const rows = await od(`/players/${p.id}/matches?date=${days}&significant=0&${S.matchesQuery()}`);
      out.players[p.id] = rows.map(slimPub);
    } catch (e) {
      out.players[p.id] = (previous.players && previous.players[p.id]) || [];
      out.warnings.push(`player ${p.id}: ${e.message}`);
    }
  }

  const prevLeague = new Map((previous.leagueMatches || []).map(m => [String(m.match_id), m]));
  const leagueOn = !CFG.features || CFG.features.league !== false;
  for (const id of (leagueOn ? CFG.leagueMatches : [])) {
    if (prevLeague.has(String(id))) { out.leagueMatches.push(prevLeague.get(String(id))); continue; }
    try {
      const m = await od(`/matches/${id}`);
      if (m && m.players && m.players.length) out.leagueMatches.push(slimLeague(m));
      else out.warnings.push(`league match ${id}: not on OpenDota yet, request a parse`);
    } catch (e) { out.warnings.push(`league match ${id}: ${e.message}`); }
  }

  try { await updateReplays(out, previous, roster, now); }
  catch (e) { out.parsed = previous.parsed || {}; out.parseQueue = previous.parseQueue || {}; out.warnings.push('replays: ' + e.message); }

  fs.writeFileSync(outFile, JSON.stringify(out));
  console.log(`Wrote data.json: ${roster.length} players (${roster.filter(p => p.linked).length} self-linked), ${out.leagueMatches.length} league matches, ${out.warnings.length} warnings`);
  out.warnings.forEach(w => console.log('  warning:', w));
})();
