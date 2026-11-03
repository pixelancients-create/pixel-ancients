/*
 * Pixel Ancients — the only file admins need to edit.
 *
 * Add a player:      copy the line the Register page gives you into `players`.
 * Add a lobby match: paste its match ID into `leagueMatches` (request a parse on opendota.com first).
 * New season:        change `season`, empty `leagueMatches`.
 */
window.LEAGUE_CONFIG = {
  leagueName: 'Pixel Ancients',
  discordInvite: 'https://discord.gg/qbFUqfJdgA',                // e.g. 'https://discord.gg/yourcode' — shows a Join button when filled
  // Home page explainer video (click to play). A file in the site or a YouTube link; '' hides the section.
  explainerVideo: 'media/pixel-ancients-promo-40s.mp4',
  explainerPoster: 'media/pixel-ancients-promo-poster.jpg',   // still shown before it plays (files only)
  timezoneOffsetHours: 8,           // Malaysia time; weeks start Monday 00:00 in this timezone

  // Switch whole sections on or off. Off = hidden from the site; the code stays ready for later.
  features: {
    league: false,                  // lobby-match League ELO ladder (needs lobby nights + admins)
    avatars: true,                  // pixel avatars + Avatar locker
    guilds: true,                   // guilds + Fight Night battles (needs avatars and the Discord login)
  },

  season: {
    name: 'Trial Season',
    start: '2026-11-09',            // a Monday
    weeks: 2,                       // regular weeks; a finals week follows
  },

  scoring: {
    modes: ['turbo', 'allpick'],    // game modes that score: 'turbo' and/or 'allpick' (ranked and unranked All Pick)
    // Points for a WIN by party size: 1 = solo ... 5 = five-stack. Bigger parties win more often, so each win is worth less.
    partyWin: { 1: 12, 2: 11, 3: 10, 4: 9, 5: 8 },
    // Gentler on parties, if stacks feel punished after the trial:  { 1: 12, 2: 12, 3: 11, 4: 10, 5: 9 }
    loss: 2,                        // every counted loss, any party size
    abandon: -5,
    dailyCap: 6,                    // counted games per day
    weeklyCap: 24,                  // counted games per week (the first 24 count)
    minGames: 12,                   // counted games needed to place in a week's final top 3
    kdaThreshold: 6,                // (kills + assists) / max(deaths, 1); counts toward gear, no points
    minDurationSeconds: { turbo: 600, allpick: 900 },   // shorter games are remakes
  },

  // Guild battles: avatars fight 5v5 automatically on Fight Night. Best record at season end = Season Champion.
  guilds: {
    fightDays: [6, 0],              // 6 = Saturday, 0 = Sunday
    fightHour: 21,                  // 9pm league time (the Supabase schedule must match, see README)
    minMembers: 3,                  // smaller guilds sit out; empty slots are filled by Lane Creep bots
    underdog: 0.75,                 // weaker guild gets this x the power gap as +% attack and HP (0 = off)
    switchCooldown: true,           // after leaving a guild, a player can't fight for a new one until the next Monday
  },

  elo: {
    start: 1000,
    kNew: 40,                       // K-factor for a player's first games of the season
    newPlayerGames: 5,
    k: 24,
    minGamesForLadder: 5,
  },

  registration: {
    minTotalMatches: 100,           // anti-smurf rule
  },

  // Optional: Discord login so players can dress their avatars (see README, "Avatars").
  // Leave empty and avatars still show, wearing each player's best unlocked gear.
  avatars: {
    supabaseUrl: 'https://fjwcveqejoxjpfpkjvfq.supabase.co',                // e.g. 'https://abcdefgh.supabase.co'
    supabaseAnonKey: 'sb_publishable_r5K4nf4YP3JEpJUGsKTsVw_GDscYiDl',            // the project's public "anon" key (safe to publish)
  },

  // Taunts: the weekly top 3 show their avatar's taunt animation and a speech bubble.
  taunts: {
    maxLength: 40,                  // characters; 40 fits the bubble on every screen size
    // English slurs and abuse are blocked automatically, including disguised spellings.
    // Add local-language slurs or insults here (any case; disguised spellings are caught too).
    blockedWords: [],
    allowedWords: [],               // words wrongly blocked by the filter, e.g. a player's name
  },

  // With Discord login connected (avatars above), players add themselves on the Join page,
  // so this list can stay empty. Use it for anyone you'd rather add by hand.
  // Friend ID = the number on the player's Dota 2 profile (32-bit account ID).
  // discordId = optional; filled in automatically when that player links on the Join page.
  players: [
    // { id: 123456789, name: 'Jia', discord: 'jia', discordId: '' },
  ],

  // Match IDs of community lobby games for this season.
  leagueMatches: [
    // 8012345678,
  ],

  cacheMinutes: 15,                 // how long a visitor's browser reuses OpenDota results
  demo: false,                      // true = show generated sample data instead of real players
};
