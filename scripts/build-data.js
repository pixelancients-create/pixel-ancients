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
async function od(p, tries = 4) {
  const wait = Math.max(0, last + 1100 - Date.now());
  if (wait) await sleep(wait);
  last = Date.now();
  const url = API + p + (KEY ? (p.includes('?') ? '&' : '?') + 'api_key=' + KEY : '');
  const res = await fetch(url);
  if (res.status === 429 && tries > 1) { await sleep(10000); return od(p, tries - 1); }
  if (!res.ok) throw new Error(`${res.status} ${p}`);
  return res.json();
}

const slimPub = m => Object.fromEntries(S.MATCH_FIELDS.map(f => [f, m[f]]));   // keep only the fields scoring and gear use
const slimLeague = m => ({ match_id: m.match_id, radiant_win: m.radiant_win, start_time: m.start_time, duration: m.duration,
  players: (m.players || []).map(p => ({ account_id: p.account_id, player_slot: p.player_slot, hero_id: p.hero_id,
    kills: p.kills, deaths: p.deaths, assists: p.assists, personaname: p.personaname })) });

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

  fs.writeFileSync(outFile, JSON.stringify(out));
  console.log(`Wrote data.json: ${roster.length} players (${roster.filter(p => p.linked).length} self-linked), ${out.leagueMatches.length} league matches, ${out.warnings.length} warnings`);
  out.warnings.forEach(w => console.log('  warning:', w));
})();
