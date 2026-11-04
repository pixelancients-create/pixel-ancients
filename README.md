# Pixel Ancients website

*A Dota 2 community league with pixel avatars. Fan-run, not affiliated with Valve.*

A free leaderboard site for a Dota 2 community: weekly points from members' Turbo and All Pick pubs, a seasonal ELO ladder from community lobby matches, and a Copy for Discord button for the Monday results post. Every player gets a pixel-art avatar that unlocks gear from their season stats. Match data comes from [OpenDota](https://www.opendota.com); the only optional extra is a free Supabase project so players can log in with Discord and dress their avatars.

## Files

| File | What it is |
| --- | --- |
| `config.js` | **The only file you edit.** League name, season dates, scoring, players, league match IDs |
| `index.html` | The website |
| `scoring.js` | The points and ELO rules (shared by the site and the hourly job) |
| `avatars.js` | Pixel avatars: the item list, unlock rules and drawing code |
| `battle.js` | Guild battles: item battle stats, the seeded 5v5 fight, pairing and the guild league |
| `battleview.js` | The animated replay arena and GIF clips |
| `demo.js` | Sample data, used when `demo: true` |
| `supabase/schema.sql` | Database setup for avatar login (optional) |
| `scripts/build-data.js` + `.github/workflows/update-data.yml` | Phase 2: hourly job that saves `data.json` |

## What's switched on

`features` in `config.js` turns whole sections on or off:

- `league: false` (launch default): no League tab, no lobby matches, no ELO. The season winner is whoever has the most total Weekly Points, and avatar items that normally need league stats unlock from weekly and season goals instead.
- `avatars: true`: pixel avatars on the leaderboards and the Avatar locker.

Turn the League on later by setting `league: true`; everything for it is still in place.

**Which games score:** `scoring.modes` in `config.js`. It's set to `['turbo', 'allpick']`: Turbo and All Pick (ranked and unranked) both earn points and gear, and a win is worth the same in either mode. Other modes don't score. For Turbo only, change it to `['turbo']`. Remakes are ignored: Turbo games under 10 minutes and All Pick games under 15 (`minDurationSeconds`).

**Points (party-size scoring):** a win is worth more the smaller your party: solo +12, duo +11, trio +10, four +9, five +8 (`scoring.partyWin`). Every loss is +2, an abandon is -5. Party size comes from the parsed replay: the hourly job asks OpenDota to parse every counted game and reads each player's party size from it (see Replay gear below). Until a game is parsed, the site uses OpenDota's party size from the match list if it has one, else Solo, and never less than the registered members on the player's team; those games show a **?** on their party tag. A win can therefore drop from Solo +12 to 5-stack +8 a few hours after the game. A week's points lock at Monday noon local time (`PARTY_LOCK_HOURS` in `scoring.js`): a parse read after that still counts for gear but doesn't change that week's points. Only the first 6 games a day and 24 a week count (`dailyCap`, `weeklyCap`). A player needs 12 counted games in a week (`minGames`) to place in that week's final top 3; during the week the podium shows who still needs games. Ties: higher weekly KDA, then fewer deaths, then a shared spot. A gentler scale for parties is in the comment next to `partyWin`.

**Checking the balance:** open `yoursite/#calibrate` (it isn't in the menu). It shows each party size's real win rate and what a full 24-game week scores at that win rate. After 2–4 weeks, if one party size is clearly ahead, adjust `partyWin`.

**Explainer video on the Home page:** `explainerVideo` in `config.js` points at `media/pixel-ancients-promo-40s.mp4` (8.6 MB, click to play with sound) with `explainerPoster` as the still shown before it plays. To use a new video, replace the file (keep the name) or point `explainerVideo` at another file. A YouTube link works too (`https://youtu.be/…`); the poster isn't used then. Set it to `''` to hide the section.

## Go live in 10 minutes (Phase 1)

1. Open `config.js`. Set `leagueName`, `discordInvite` and `season.start` (a Monday).
2. Host it, either way:
   - **Netlify Drop:** go to app.netlify.com/drop and drag this whole folder onto the page. You get a link straight away.
   - **GitHub Pages:** create a public repo, upload these files, then Settings › Pages › Deploy from branch › `main` / root.
3. Add players. Once Discord login is connected (see Avatars below), players add themselves on the **Register** page and you can skip this step. Without it, open the site's **Register** page, paste a player's Friend ID, and copy the line it gives you into `players` in `config.js`. Re-upload `config.js`.

The site loads OpenDota data in each visitor's browser and caches it for 15 minutes. That's fine for up to about 25 players.

## After a lobby night (only when `league: true`)

1. Open each match on opendota.com (`opendota.com/matches/<match id>`) and click **Request parse** so the lobby game is stored.
2. Add the match IDs to `leagueMatches` in `config.js` and re-upload it. The League page recalculates everyone's ELO.

## New season

Change `season.name` and `season.start`, and empty `leagueMatches`. Weekly points history stays visible on the Weekly page.

## Phase 2: hourly data file (GitHub Pages only)

Once you have more than ~25 players, turn on the hourly job so visitors don't call OpenDota at all:

1. Make sure the repo includes `scripts/` and `.github/workflows/update-data.yml`.
2. Repo Settings › Actions › General › Workflow permissions › **Read and write**.
3. Actions tab › **Update league data** › **Run workflow** once to create `data.json`.

It then runs every hour. The site uses `data.json` while it's under 3 hours old and falls back to live loading if the job stops. Optional: add an `OPENDOTA_API_KEY` repository secret for higher limits.

## Avatars

Avatars work with no setup: every player appears on the leaderboards wearing the best gear they've unlocked. To let players log in and choose their own look, connect Discord login once (about 20 minutes):

1. **Create a Supabase project** (free) at supabase.com. Wait for it to finish setting up.
2. **Create the table:** open SQL Editor, paste everything from `supabase/schema.sql`, and click Run.
3. **Create a Discord app:** at discord.com/developers/applications click New Application. Under OAuth2, copy the Client ID and reset/copy the Client Secret. Add this redirect: `https://<your-project>.supabase.co/auth/v1/callback` (Supabase shows the exact URL in the next step).
4. **Turn on Discord login in Supabase:** Authentication › Sign In / Providers › Discord. Enable it and paste the Client ID and Secret.
5. **Allow your site:** Authentication › URL Configuration. Set Site URL to your website's address and add the same address under Redirect URLs.
6. **Connect the site:** Project Settings › API (or Data API). Copy the Project URL and the `anon` public key into `avatars` in `config.js`. The anon key is safe to publish; the database rules only let each Discord account change its own avatar.
7. **Make yourself an admin:** link your own account on the **Register** page. Then in Supabase › **Table Editor** › `players`, copy your `discord_id` and run `insert into public.league_admins values ('YOUR_DISCORD_ID');` in SQL Editor. The **Admin** page (`#admin`, linked in the footer) is only shown to admins; everyone else sees "This page isn't available."

### Players join by themselves

With Discord login connected, the **Register** page (the red Register button in the header; it turns into **My avatar** once you've linked) lets players sign up themselves. A player logs in with Discord and enters their Dota Friend ID (or pastes their OpenDota, Dotabuff or Steam profile link). The site looks the account up on OpenDota, checks it has public match data and enough matches, and asks "Is this you?". They confirm, pick a leaderboard name (slur-filtered like taunts), and they're in: on the boards, in the Avatar locker and able to join a guild. Their games from the whole season count, not just from the day they joined.

- Set up Supabase before this feature existed? Run `supabase/schema.sql` again in SQL Editor (it's safe to re-run) to add the `players` and `league_admins` tables.
- **Each Dota account and each Discord account can only be linked once.** The database enforces this, so nobody can link two accounts or grab one that's already taken.
- **Links go live straight away; there's no approval step.** If someone claims an account that isn't theirs, open **Admin**, click **Unlink** on that row (twice to confirm), and the real owner can link it. Players who picked the wrong account ask an admin to unlink it too.
- Players in `players` in `config.js` still work. A config player with an empty `discordId` gets it filled in automatically when they link their own account. Config players can't be unlinked from the Admin page; edit `config.js` for those.
- New players show up straight away for them, and for everyone else within the hour (the hourly data file picks them up too, with no extra secret needed).
- More admins: `insert into public.league_admins values ('DISCORD_ID');` in SQL Editor. Remove one with `delete from public.league_admins where discord_id = 'DISCORD_ID';`.
- **Gear catalogue:** the **Gear** tab lists every item with how to unlock it, what it does in battle and how many league players have it, with slot and rarity filters and a search box. Logged-in players also see their own progress and can filter to "Almost there". The Rules page links to it.
- **Visitor counter:** the Admin page also shows visitors (today, 7 days, 30 days, all time), a 30-day chart, the most-visited pages and how many visitors linked an account. It's anonymous: each browser gets a random code; no names, IPs or cookies are stored, and admin visits aren't counted. A browser counts once per page per 30 minutes. Already set up Supabase before this existed? Run `supabase/visitor-counter.sql` once in SQL Editor (safe to re-run; run it again after updates that add pages, such as the Gear page, so they're counted too).

**Taunts:** in the Avatar locker's Taunt tab, players pick a taunt animation and write a line of up to 40 characters. It shows on the Weekly page whenever they finish in the top 3, and the Copy for Discord post quotes it. Slurs and abusive words are blocked automatically using the open-source `obscenity` word list (`vendor/`, MIT licence), including disguised spellings like `a b c`, `@`-for-a and stretched letters. Taunts are checked while typing, on save, and again every time they're displayed, so a slur never shows even if someone bypasses the site. The built-in list is English: add Malay and other local slurs to `taunts.blockedWords` in `config.js` (disguised spellings of those are caught too). If a normal word gets blocked by mistake, add it to `taunts.allowedWords`. To remove one player's taunt straight away, edit or delete their row in the Supabase `avatars` table.

**Gear:** 121 items across 8 slots (head, body, cape, weapon, off-hand, boots, pet, aura). They unlock from season stats: points (targets scaled for the 8–12 point wins), games, wins, streaks, last hits, denies, GPM, XPM, hero and tower damage, healing, assists, kills, gold, game length, time of day, party size (solo, duo, 5-stack), games and wins in one day or week, heroes won with, comebacks, weekly podium finishes, and a few joke items for losing streaks. Founder's Pennant only unlocks for players who play in the season's first week. The last-hit, damage and healing numbers come from OpenDota's match list (the site asks for those fields by name). If OpenDota is missing a number for a match, it counts as 0, so a missing stat can only delay an unlock, never give one away.

**Replay gear:** 11 items (marked **Replay** on the Gear page) need stats only a parsed replay has: observer and sentry wards placed, wards destroyed, Ultra Kills and Rampages, damage taken, runes picked up (all, Bounty, Arcane, Water) and Aegis pickups. The hourly job handles this by itself: for every counted season game it reads `/matches/<id>`, and if OpenDota hasn't parsed the game yet it requests a parse and checks again on a later run (up to 3 requests; replays older than 12 days are skipped because Valve deletes them). The results stay in `data.json` (`parsed`), so each game costs about 2–4 OpenDota calls once, capped at 40 calls a run (`PARSE_CALLS_PER_RUN` in `scripts/build-data.js`) to stay inside the free 2,000 calls a day. Games that never get parsed just don't count toward these items. A replay stat only counts from the moment the job read it, so a Fight Night that already happened never changes when a late parse arrives. Aegis pickups come from the match's objectives log (`CHAT_MESSAGE_AEGIS` and `CHAT_MESSAGE_AEGIS_STOLEN`).

To change what unlocks what, edit the `stat` and `need` values in `avatars.js` (the targets are a first guess: check the Avatar page after week 1 and adjust). Items a player hasn't unlocked are never shown, even if saved.

## Guilds and Fight Night

Players form guilds of up to 5. Every Saturday and Sunday at 9pm (Malaysia time), every guild's pixel avatars fight another guild of similar power, automatically. The guild with the best record at the end of the season is **Season Champion**; the player with the most Weekly Points is **Season MVP**.

**One-time setup (about 10 minutes, after the Avatars setup above):**
1. In Supabase, open **SQL Editor**, paste the whole `supabase/schema.sql` again and run it. It's safe to re-run; it adds the guild tables and functions.
2. Open **Database > Extensions**, search for `pg_cron` and enable it.
3. Back in the SQL Editor, run the schedule line from the bottom of `schema.sql`:
   ```sql
   select cron.schedule('fight-night', '0 13 * * 6,0',
     $$select public.snapshot_fight(to_char(now() at time zone 'Asia/Kuala_Lumpur', 'YYYY-MM-DD'))$$);
   ```
   `0 13 * * 6,0` means 13:00 UTC (9pm Malaysia time) on Saturday and Sunday. If you change `guilds.fightDays` or `guilds.fightHour` in `config.js`, change this schedule to match.
4. `features.guilds` is already `true` in `config.js`. The new **Guilds** tab appears once the page reloads.

**How it works for players:** on the Guilds page, a logged-in player creates a guild (name, tag, pixel crest) and becomes captain. Others join with the captain's invite link or by sending a request the captain accepts. The captain sets positions (1–2 front line, 3–5 back line), can remove members and can hand over captaincy. At 9pm the database freezes every roster and saved avatar; the website then runs the fights, so everyone sees the same results and can replay any fight.

**Best of 3:** every Fight Night pairing is a best-of-3 match. The first guild to win 2 rounds takes the match (round 3 only happens at 1–1). Lineups, gear, runes and the underdog bonus stay the same each round; HP resets between rounds. The replay page plays the rounds back to back, with round tabs, and "Download GIF clip" saves the round you're watching. The guild league counts match wins; ties go to round difference, then enemy HP destroyed (averaged over rounds), then the strength of opponents faced. The Duel sandbox stays a single quick fight. The number of rounds is `ROUNDS_TO_WIN` in `battle.js`; change it only between seasons, because replays re-run past fights with the current rules.

**Rules you can change in `config.js` (`guilds`):** fight days and hour, `minMembers` (default 3; empty slots become Lane Creeps), `underdog` (default 0.35: the weaker guild gets 35% of the power gap as bonus attack and HP, capped at 40%; 0 turns it off) and `switchCooldown` (a player who leaves a guild sits out their new guild's fights until the next Monday).

**Fairness, tested on simulated seasons (8 guilds, 16 Fight Nights):** the stronger guild wins about 60% of pairings, and the season title is spread across the field (the strongest guild wins about 1 season in 4; the bottom half wins about 3 in 10). With only 3–4 guilds there's nobody close in power to pair with, so the strongest guild wins more often; it gets fairer as more guilds join. Item battle stats live in `battle.js` (`ITEMS`, `SLOT_STAT`).

**Admin tips:**
- Run a test Fight Night by hand: `select public.snapshot_fight('test-1');` in the SQL Editor, then open the Guilds page. Delete it afterwards: `delete from public.fight_snapshots where id = 'test-1';`
- A fight's result never changes once its snapshot exists, even if players change gear or guilds later.
- Guild names and tags go through the same slur filter as taunts; a blocked name is shown as "Guild (name hidden)". To rename one, edit its row in the `guilds` table.
- Supabase free projects pause after a stretch with no traffic (about a week). Normal site visits keep the project awake; if it does pause, Fight Night snapshots are skipped until you resume it in the Supabase dashboard.
- `#duel` is a just-for-fun sandbox: pick any two guilds or players and watch them fight.
- Replays have 8-bit sound effects (hits, crits, casts, heals, knockouts, victory) and background music, all made in the browser with no audio files. Each replay picks one of three loops at random (Lane Clash, Roshan Pit, High Ground Rush; never the same one twice in a row); it sits well under the sound effects and fades out under the victory fanfare. Sound starts after the viewer's first click. The Music on/off, Sound on/off and volume controls next to the replay are remembered per device. Downloaded GIF clips are silent.


## Player requirements

- Dota 2 › Settings › Options › Social › **Expose Public Match Data** on.
- At least 300 total matches (change `registration.minTotalMatches`).
