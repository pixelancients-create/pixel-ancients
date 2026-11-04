/*
 * Pixel avatars: 32x32 layered sprites, all original art drawn in code.
 * Gear is themed on how people play MOBAs (last hits, ganks, warding, rampages) but every design is the league's own.
 * Items unlock from a player's season stats; nothing is bought, so there is nothing to cheat.
 */
(function (root) {
  const SIZE = 32;
  const FRAMES = 4;

  // ---------- look options (always free) ----------
  const SKINS = ['#f6d2b0', '#e3a87e', '#c08259', '#8a5534'];
  const HAIR_STYLES = [
    { id: 'short', name: 'Short' }, { id: 'spiky', name: 'Spiky' },
    { id: 'long', name: 'Long' }, { id: 'mohawk', name: 'Mohawk' },
    { id: 'bob', name: 'Bob' }, { id: 'ponytail', name: 'Ponytail' },
    { id: 'twintails', name: 'Twin Tails' }, { id: 'buns', name: 'Space Buns' },
    { id: 'topknot', name: 'Top Knot' }, { id: 'afro', name: 'Afro' },
    { id: 'swept', name: 'Side Swept' }, { id: 'shaved', name: 'Shaved' },
  ];
  const HAIR_COLORS = ['#2b2420', '#6b3f22', '#e3c169', '#b8432d', '#e8e4dc', '#4a6fd1',
    '#e86fa6', '#8a5ad6', '#36b79a', '#e0782e', '#8d9196'];   // + pink, purple, mint, ginger, ash grey
  const TUNICS = ['#3d6ec9', '#4f9a3a', '#b63a2c', '#7a4bb3', '#2f9a92',
    '#e0689f', '#de7a2c', '#d9b13a', '#e4ddcc', '#34363b', '#7b5434'];   // + pink, orange, yellow, cream, charcoal, brown

  const RARITY = {
    starter:   { name: 'Starter',   color: '#8e8981' },
    common:    { name: 'Common',    color: '#b9c1c6' },
    rare:      { name: 'Rare',      color: '#4f95ea' },
    epic:      { name: 'Epic',      color: '#a66be8' },
    legendary: { name: 'Legendary', color: '#f0a63a' },
    unique:    { name: 'Unique',    color: '#ff3b30' },
  };

  // ---------- unlockable items (ordered easiest -> hardest within a slot) ----------
  const SLOTS = [
    { id: 'head', name: 'Head', items: [
      { id: 'none', name: 'Bare Head', rarity: 'starter', free: true },
      { id: 'headband', name: 'Laning Headband', rarity: 'starter', free: true },
      { id: 'gg_mask', name: 'GG Mask', rarity: 'common', stat: 'losses', need: 10 },
      { id: 'last_pick_hood', name: 'Last Pick Hood', rarity: 'common', stat: 'heroesInWeek', need: 5 },
      { id: 'pathfinder_goggles', name: 'Hero Pool Goggles', rarity: 'common', stat: 'heroesPlayed', need: 10 },
      { id: 'kill_cap', name: 'Kill Count Cap', rarity: 'common', stat: 'totalKills', need: 150 },
      { id: 'tower_helm', name: 'Tower Dive Helm', rarity: 'rare', stat: 'seasonPoints', need: 175 },
      { id: 'midlane_mask', name: 'Mid 1v1 Mask', rarity: 'rare', stat: 'wins', need: 15 },
      { id: 'night_owl_hood', name: 'Night Cycle Hood', rarity: 'rare', stat: 'nightGames', need: 10 },
      { id: 'gpm_circlet', name: 'Gold Advantage Circlet', rarity: 'rare', stat: 'bestGpm', need: 1200 },
      { id: 'xp_visor', name: 'Experience Visor', rarity: 'rare', stat: 'bestXpm', need: 1000 },
      { id: 'rampage_helm', name: 'Rampage Helm', rarity: 'epic', stat: 'wins', need: 25 },
      { id: 'unbroken_helm', name: 'High Ground Helm', rarity: 'epic', stat: 'weekStreak', need: 4 },
      { id: 'tormentor_horns', name: 'Tormentor Horns', rarity: 'epic', stat: 'weekendWins', need: 20 },
      { id: 'signature_helm', name: 'Signature Hero Helm', rarity: 'epic', stat: 'sameHeroWins', need: 10 },
      { id: 'weekly_crown', name: "Ancient's Crown", rarity: 'legendary', stat: 'weekWins', need: 1, animated: true },
      { id: 'mega_creeps_crown', name: 'Mega Creeps Crown', rarity: 'legendary', stat: 'longWin45', need: 1, animated: true },
      { id: 'marathon_crown', name: 'Marathon Crown', rarity: 'legendary', stat: 'bestDayWins', need: 7, animated: true },
      { id: 'team_wipe_crown', name: 'Team Wipe Crown', rarity: 'legendary', stat: 'rampages', need: 1, parsed: true, animated: true },
    ] },
    { id: 'body', name: 'Body', items: [
      { id: 'tunic', name: 'Recruit Tunic', rarity: 'starter', free: true },
      { id: 'feeder_bib', name: "Feeder's Bib", rarity: 'common', stat: 'feedGames', need: 10 },
      { id: 'weekend_vest', name: 'Pub Star Vest', rarity: 'common', stat: 'weekendGames', need: 15 },
      { id: 'farm_apron', name: 'Farm Simulator Apron', rarity: 'common', stat: 'totalLastHits', need: 1000 },
      { id: 'jungler_leathers', name: 'Jungle Farm Leathers', rarity: 'common', stat: 'games', need: 30 },
      { id: 'team_jersey', name: 'Team Jersey', rarity: 'common', stat: 'partyGames', need: 10 },
      { id: 'support_robe', name: 'Position 5 Robe', rarity: 'rare', stat: 'kdaBonuses', need: 10 },
      { id: 'salve_robes', name: 'Healing Salve Robes', rarity: 'rare', stat: 'totalHealing', need: 15000 },
      { id: 'space_vest', name: 'Space Creator Vest', rarity: 'rare', stat: 'assistGames20', need: 20 },
      { id: 'turbo_jumpsuit', name: 'Turbo Jumpsuit', rarity: 'rare', stat: 'turboGames', need: 60 },
      { id: 'offlane_plate', name: 'Offlane Plate', rarity: 'epic', stat: 'leagueGames', need: 10, noLeague: { stat: 'games', need: 60 } },
      { id: 'collector_coat', name: 'Flex Pick Coat', rarity: 'epic', stat: 'heroesPlayed', need: 25 },
      { id: 'comeback_cuirass', name: 'Comeback Cuirass', rarity: 'epic', stat: 'longWins35', need: 3 },
      { id: 'draft_armor', name: 'Draft Day Armor', rarity: 'epic', stat: 'allpickGames', need: 25 },
      { id: 'punching_bag_plate', name: 'Punching Bag Plate', rarity: 'epic', stat: 'bestDamageTaken', need: 40000, parsed: true },
      { id: 'champion_mail', name: 'Hard Carry Mail', rarity: 'legendary', stat: 'weekTop3', need: 3, animated: true },
      { id: 'pos1_silk', name: 'Pos 1 Silk', rarity: 'legendary', stat: 'bestHeroDamage', need: 60000, animated: true },
      { id: 'million_plate', name: 'Million Damage Plate', rarity: 'legendary', stat: 'totalHeroDamage', need: 1000000, animated: true },
      { id: 'unkillable_carapace', name: 'Unkillable Carapace', rarity: 'legendary', stat: 'bestDamageTakenWin', need: 60000, parsed: true, animated: true },
    ] },
    { id: 'cape', name: 'Cape', items: [
      { id: 'none', name: 'No Cape', rarity: 'starter', free: true },
      { id: 'tango_wrap', name: 'Tango Wrap', rarity: 'common', stat: 'assistGames10', need: 10 },
      { id: 'weekend_cape', name: 'Weekend Warrior Cape', rarity: 'common', stat: 'fullWeekends', need: 2 },
      { id: 'gank_cloak', name: 'Smoke Gank Cloak', rarity: 'rare', stat: 'stacks', need: 10 },
      { id: 'comet_cape', name: 'Snowball Cape', rarity: 'rare', stat: 'winStreak', need: 5 },
      { id: 'scan_cloak', name: 'Scan Cloak', rarity: 'rare', stat: 'bestWeekGames', need: 20 },
      { id: 'duo_banner', name: 'Duo Lane Banner', rarity: 'rare', stat: 'duoWins', need: 10 },
      { id: 'arcane_mantle', name: 'Arcane Mantle', rarity: 'rare', stat: 'arcaneRunes', need: 15, parsed: true },
      { id: 'dire_banner', name: 'Dire War Banner', rarity: 'epic', stat: 'leagueGames', need: 5, noLeague: { stat: 'wins', need: 40 } },
      { id: 'radiant_banner', name: 'Radiant War Banner', rarity: 'epic', stat: 'leagueWins', need: 5, noLeague: { stat: 'wins', need: 25 } },
      { id: 'stomp_cape', name: 'Stomp Cape', rarity: 'epic', stat: 'fastWins', need: 10 },
      { id: 'farmer_mantle', name: "Farmer's Mantle", rarity: 'epic', stat: 'totalGold', need: 500000 },
      { id: 'multikill_mantle', name: 'Multi-Kill Mantle', rarity: 'epic', stat: 'ultraKills', need: 3, parsed: true },
      { id: 'sunfire_cape', name: 'Beyond Godlike Cape', rarity: 'legendary', stat: 'winStreak', need: 10, animated: true },
      { id: 'defender_mantle', name: 'Ancient Defender Mantle', rarity: 'legendary', stat: 'longWins40', need: 5, animated: true },
      { id: 'perfect_week_cloak', name: 'Perfect Week Cloak', rarity: 'legendary', stat: 'bestWeekWins', need: 12, animated: true },
    ] },
    { id: 'weapon', name: 'Weapon', items: [
      { id: 'training_sword', name: 'Creep Sword', rarity: 'starter', free: true },
      { id: 'lasthit_dagger', name: 'Last-Hit Dagger', rarity: 'common', stat: 'games', need: 15 },
      { id: 'deny_dirk', name: 'Deny Dirk', rarity: 'common', stat: 'denies', need: 50 },
      { id: 'harass_whip', name: 'Lane Harass Whip', rarity: 'common', stat: 'games10Kills', need: 10 },
      { id: 'twin_hatchets', name: 'Ultra Kill Hatchets', rarity: 'rare', stat: 'bestKills', need: 15 },
      { id: 'ward_lantern', name: "Ward-Keeper's Lantern", rarity: 'rare', stat: 'kdaBonuses', need: 5 },
      { id: 'cleave_axe', name: 'Cleave Axe', rarity: 'rare', stat: 'heroDmg30Games', need: 5 },
      { id: 'farm_sickle', name: 'Farm Sickle', rarity: 'rare', stat: 'bestLastHits', need: 350 },
      { id: 'throne_breaker', name: 'Throne Breaker', rarity: 'epic', stat: 'seasonPoints', need: 525 },
      { id: 'dusk_sabre', name: 'Wave Clear Sabre', rarity: 'epic', stat: 'activeDays', need: 20 },
      { id: 'wombo_maul', name: 'Wombo Combo Maul', rarity: 'epic', stat: 'bestAssists', need: 30 },
      { id: 'ascendant_staff', name: 'Level 30 Staff', rarity: 'legendary', stat: 'elo', need: 1100, animated: true, noLeague: { stat: 'seasonPoints', need: 1200 } },
      { id: 'starforged_spear', name: 'Teamfight Spear', rarity: 'legendary', stat: 'bestKda', need: 15, animated: true },
      { id: 'crit_blade', name: 'Crit Blade', rarity: 'legendary', stat: 'bestKills', need: 20, animated: true },
    ] },
    { id: 'offhand', name: 'Off-hand', items: [
      { id: 'none', name: 'Empty Hand', rarity: 'starter', free: true },
      { id: 'creep_buckler', name: 'Creep Block Buckler', rarity: 'common', stat: 'deny5Games', need: 10 },
      { id: 'throw_gloves', name: 'Throw Gloves', rarity: 'common', stat: 'losses', need: 20 },
      { id: 'tango_pouch', name: 'Tango Pouch', rarity: 'common', stat: 'totalAssists', need: 300 },
      { id: 'founder_pennant', name: "Founder's Pennant", rarity: 'rare', stat: 'founder', need: 1 },
      { id: 'deny_shield', name: 'Deny Shield', rarity: 'rare', stat: 'denies', need: 150 },
      { id: 'hex_talisman', name: 'Hex Talisman', rarity: 'rare', stat: 'stackWins', need: 15 },
      { id: 'mana_charm', name: 'Mana Charm', rarity: 'rare', stat: 'allpickWins', need: 10 },
      { id: 'humility_urn', name: 'Urn of Humility', rarity: 'rare', stat: 'noKillWins', need: 3 },
      { id: 'ward_satchel', name: 'Ward Satchel', rarity: 'rare', stat: 'obsPlaced', need: 50, parsed: true },
      { id: 'tank_bulwark', name: 'Tank Mode Bulwark', rarity: 'epic', stat: 'deathlessWins', need: 10 },
      { id: 'glimmer_lantern', name: 'Glimmer Lantern', rarity: 'epic', stat: 'bestHealing', need: 10000, animated: true },
      { id: 'bounty_purse', name: 'Bounty Purse', rarity: 'epic', stat: 'bountyRunes', need: 40, parsed: true, animated: true },
      { id: 'second_life_shield', name: 'Second Life Shield', rarity: 'legendary', stat: 'comebackWins', need: 5, animated: true },
      { id: 'aegis_buckler', name: 'Aegis Buckler', rarity: 'legendary', stat: 'aegis', need: 3, animated: true },
    ] },
    { id: 'boots', name: 'Boots', items: [
      { id: 'none', name: 'Recruit Shoes', rarity: 'starter', free: true },
      { id: 'tp_sandals', name: 'TP Out Sandals', rarity: 'common', stat: 'daysInWeek', need: 5 },
      { id: 'rotation_boots', name: 'Rotation Boots', rarity: 'common', stat: 'assistGames15', need: 10 },
      { id: 'morning_jog', name: 'Morning Jog Shoes', rarity: 'common', stat: 'morningGames', need: 10 },
      { id: 'juke_boots', name: 'Juke Path Boots', rarity: 'rare', stat: 'lowDeathWins', need: 10 },
      { id: 'courier_slippers', name: 'Courier Slippers', rarity: 'rare', stat: 'bestDayGames', need: 6 },
      { id: 'phase_steps', name: 'Phase Steps', rarity: 'rare', stat: 'turboWins', need: 20 },
      { id: 'dewarder_boots', name: "Dewarder's Boots", rarity: 'rare', stat: 'wardsKilled', need: 20, parsed: true },
      { id: 'rat_treads', name: 'Rat Doto Treads', rarity: 'epic', stat: 'towerDamage', need: 75000 },
      { id: 'deny_dancer', name: 'Deny Dancer Boots', rarity: 'epic', stat: 'bestDenies', need: 25 },
      { id: 'water_waders', name: 'Water Rune Waders', rarity: 'epic', stat: 'waterRunes', need: 20, parsed: true },
      { id: 'backdoor_greaves', name: 'Backdoor Greaves', rarity: 'legendary', stat: 'towerDmg8Games', need: 3, animated: true },
      { id: 'siege_treads', name: 'Siege Treads', rarity: 'legendary', stat: 'bestTowerDamage', need: 20000, animated: true },
    ] },
    { id: 'pet', name: 'Pet', items: [
      { id: 'none', name: 'No Pet', rarity: 'starter', free: true },
      { id: 'lucky_cat', name: 'Bounty Rune Cat', rarity: 'common', stat: 'activeDays', need: 7 },
      { id: 'lane_frog', name: 'Stack Frog', rarity: 'common', stat: 'stacks', need: 1 },
      { id: 'creep_buddy', name: 'Lane Creep Buddy', rarity: 'common', stat: 'games', need: 25 },
      { id: 'lunch_lizard', name: 'Lunch Break Lizard', rarity: 'common', stat: 'lunchGames', need: 10 },
      { id: 'tilt_kitten', name: 'Tilt Kitten', rarity: 'common', stat: 'lossStreak', need: 5 },
      { id: 'sentry_owl', name: 'Sentry Owl', rarity: 'common', stat: 'senPlaced', need: 30, parsed: true },
      { id: 'slime_buddy', name: 'Haste Slime', rarity: 'rare', stat: 'games', need: 50 },
      { id: 'sentry_eye', name: 'Sentry Eye', rarity: 'rare', stat: 'kdaBonuses', need: 20 },
      { id: 'rune_sprite', name: 'Rune Sprite', rarity: 'rare', stat: 'activeDays', need: 30 },
      { id: 'night_foal', name: 'Night Vision Foal', rarity: 'rare', stat: 'nightGames', need: 15 },
      { id: 'solo_sloth', name: 'Solo Queue Sloth', rarity: 'rare', stat: 'soloWins', need: 15 },
      { id: 'bottle_crab', name: 'Bottle Crab', rarity: 'rare', stat: 'runes', need: 50, parsed: true },
      { id: 'boulder_pup', name: 'Neutral Camp Pup', rarity: 'epic', stat: 'leagueWins', need: 10, noLeague: { stat: 'stacks', need: 25 } },
      { id: 'little_ghost', name: 'Fog of War Ghost', rarity: 'epic', stat: 'nightGames', need: 25 },
      { id: 'one_trick_pony', name: 'One-Trick Pony', rarity: 'epic', stat: 'sameHeroGames', need: 25 },
      { id: 'stack_parrot', name: 'Stack Parrot', rarity: 'epic', stat: 'fiveStackWins', need: 5, animated: true },
      { id: 'ember_drake', name: 'Power Rune Drake', rarity: 'legendary', stat: 'bestWeek', need: 160, animated: true },
      { id: 'drop_mimic', name: 'Neutral Drop Mimic', rarity: 'legendary', stat: 'games', need: 100, animated: true },
      { id: 'pool_hydra', name: 'Hero Pool Hydra', rarity: 'legendary', stat: 'heroesWon', need: 30, animated: true },
    ] },
    { id: 'aura', name: 'Aura', items: [
      { id: 'none', name: 'No Aura', rarity: 'starter', free: true },
      { id: 'fountain_glow', name: 'Fountain Glow', rarity: 'common', stat: 'games', need: 50 },
      { id: 'leafstorm', name: 'Haste Rune Aura', rarity: 'rare', stat: 'weekendGames', need: 30 },
      { id: 'first_blood', name: 'First Blood Aura', rarity: 'rare', stat: 'seasonPoints', need: 350 },
      { id: 'bronze_aura', name: 'Bronze Podium Aura', rarity: 'rare', stat: 'weekThird', need: 1 },
      { id: 'smoke_aura', name: 'Smoke Cloud Aura', rarity: 'rare', stat: 'stacks', need: 40 },
      { id: 'shrine_aura', name: 'Shrine Aura', rarity: 'rare', stat: 'totalHealing', need: 30000 },
      { id: 'storm', name: 'Double Damage Aura', rarity: 'epic', stat: 'wins', need: 40 },
      { id: 'snowfall', name: 'Glyph Aura', rarity: 'epic', stat: 'kdaBonuses', need: 25 },
      { id: 'runner_up_aura', name: 'Runner-Up Aura', rarity: 'epic', stat: 'weekSecond', need: 1 },
      { id: 'godlike', name: 'Godlike Aura', rarity: 'legendary', stat: 'seasonPoints', need: 875, animated: true },
      { id: 'rampage_aura', name: 'Rampage Aura', rarity: 'legendary', stat: 'bestKills', need: 25, animated: true },
      { id: 'mega_creeps_aura', name: 'Mega Creeps Aura', rarity: 'legendary', stat: 'games', need: 200, animated: true },
      { id: 'bloodmoon', name: 'Bloodmoon Aura', rarity: 'unique', stat: 'weekWins', need: 3, animated: true },
    ] },
  ];

  const STAT_TEXT = {
    seasonPoints: n => `Earn ${n} season points`,
    allpickWins: n => `Win ${n} All Pick games`,
    turboWins: n => `Win ${n} Turbo games`,
    weekWins: n => (n === 1 ? 'Top the weekly leaderboard once' : `Top the weekly leaderboard ${n} times`),
    weekTop3: n => `Finish top 3 on the weekly leaderboard ${n} times`,
    games: n => `Play ${n} games this season`,
    kdaBonuses: n => `Finish ${n} games with KDA 6+`,
    leagueGames: n => `Play ${n} league matches`,
    leagueWins: n => `Win ${n} league matches`,
    stacks: n => (n === 1 ? 'Play a game with another member' : `Play ${n} games with other members`),
    allpickGames: n => `Play ${n} All Pick games`,
    bestWeek: n => `Score ${n} points in one week`,
    elo: n => `Reach ${n} League ELO`,
    wins: n => `Win ${n} games this season`,
    heroesPlayed: n => `Play ${n} different heroes`,
    nightGames: n => `Play ${n} games between midnight and 6am`,
    weekendGames: n => `Play ${n} weekend games`,
    activeDays: n => `Play on ${n} different days`,
    weekStreak: n => `Play in ${n} weeks in a row`,
    winStreak: n => `Win ${n} games in a row`,
    bestKills: n => `Get ${n} kills in one game`,
    bestKda: n => `Finish a game with KDA ${n}+`,
    turboGames: n => `Play ${n} Turbo games`,
    losses: n => `Lose ${n} games (it happens)`,
    feedGames: n => `Die 10+ times in ${n} games`,
    heroesInWeek: n => `Play ${n} different heroes in one week`,
    daysInWeek: n => `Play on ${n} different days in one week`,
    bestWeekGames: n => `Play ${n} scoring games in one week`,
    bestGpm: n => `Reach ${n} GPM in one game`,
    totalLastHits: n => `Get ${k(n)} last hits this season`,
    bestLastHits: n => `Get ${n} last hits in one game`,
    denies: n => `Deny ${n} creeps this season`,
    deny5Games: n => `Get 5+ denies in ${n} games`,
    totalHealing: n => `Heal ${k(n)} this season`,
    bestHeroDamage: n => `Deal ${k(n)} hero damage in one game`,
    heroDmg30Games: n => `Deal 30k+ hero damage in ${n} games`,
    towerDamage: n => `Deal ${k(n)} tower damage this season`,
    towerDmg8Games: n => `Deal 8k+ tower damage in ${n} games`,
    bestAssists: n => `Get ${n} assists in one game`,
    assistGames10: n => `Get 10+ assists in ${n} games`,
    assistGames15: n => `Get 15+ assists in ${n} games`,
    assistGames20: n => `Get 20+ assists in ${n} games`,
    games10Kills: n => `Get 10+ kills in ${n} games`,
    lowDeathWins: n => `Win ${n} games dying 3 times or less`,
    deathlessWins: n => `Win ${n} games without dying`,
    weekendWins: n => `Win ${n} weekend games`,
    stackWins: n => `Win ${n} games with other members`,
    comebackWins: n => `Win ${n} games straight after losing 3 in a row`,
    fastWins: n => `Win ${n} games in under 18 minutes`,
    longWins35: n => `Win ${n} games lasting 35+ minutes`,
    longWins40: n => `Win ${n} games lasting 40+ minutes`,
    longWin45: n => (n === 1 ? 'Win a game lasting 45+ minutes' : `Win ${n} games lasting 45+ minutes`),
    sameHeroGames: n => `Play ${n} games on the same hero`,
    founder: () => "Play a game in the season's first week (never comes back)",
    weekSecond: n => (n === 1 ? 'Finish 2nd on the weekly leaderboard' : `Finish 2nd on the weekly leaderboard ${n} times`),
    weekThird: n => (n === 1 ? 'Finish 3rd on the weekly leaderboard' : `Finish 3rd on the weekly leaderboard ${n} times`),
    // expansion 2
    totalKills: n => `Get ${n} kills this season`,
    bestXpm: n => `Reach ${n} XPM in one game`,
    sameHeroWins: n => `Win ${n} games on the same hero`,
    bestDayWins: n => `Win ${n} games in one day`,
    partyGames: n => `Play ${n} games in a party`,
    totalHeroDamage: n => `Deal ${n >= 1e6 ? n / 1e6 + 'M' : k(n)} hero damage this season`,
    fullWeekends: n => `Play on both Saturday and Sunday in ${n} weekends`,
    duoWins: n => `Win ${n} duo games`,
    totalGold: n => `Earn ${k(n)} gold this season`,
    bestWeekWins: n => `Win ${n} games in one week`,
    totalAssists: n => `Get ${n} assists this season`,
    noKillWins: n => `Win ${n} games without getting a kill`,
    bestHealing: n => `Heal ${k(n)} in one game`,
    aegis: n => (n === 1 ? 'Snatch the Aegis' : `Snatch the Aegis ${n} times`),
    morningGames: n => `Play ${n} games between 6am and noon`,
    bestDayGames: n => `Play ${n} games in one day`,
    bestDenies: n => `Deny ${n} creeps in one game`,
    bestTowerDamage: n => `Deal ${k(n)} tower damage in one game`,
    lunchGames: n => `Play ${n} games between 12pm and 2pm`,
    lossStreak: n => `Lose ${n} games in a row (it happens)`,
    soloWins: n => `Win ${n} solo games`,
    fiveStackWins: n => `Win ${n} games as a full 5-stack`,
    heroesWon: n => `Win with ${n} different heroes`,
    // from parsed games (OpenDota replay parsing)
    obsPlaced: n => `Place ${n} observer wards this season`,
    senPlaced: n => `Place ${n} sentry wards this season`,
    wardsKilled: n => `Destroy ${n} enemy wards this season`,
    rampages: n => (n === 1 ? 'Get a Rampage' : `Get ${n} Rampages`),
    ultraKills: n => `Get ${n} Ultra Kills (4 kills in a row)`,
    bestDamageTaken: n => `Take ${k(n)} damage in one game`,
    bestDamageTakenWin: n => `Take ${k(n)} damage in one game and still win`,
    runes: n => `Pick up ${n} runes this season`,
    bountyRunes: n => `Pick up ${n} Bounty runes this season`,
    arcaneRunes: n => `Pick up ${n} Arcane runes this season`,
    waterRunes: n => `Pick up ${n} Water runes this season`,
  };
  const k = n => (n >= 1000 && n % 1000 === 0 ? `${n / 1000}k` : n.toLocaleString('en-US'));

  // ---------- stats from the leaderboard data ----------
  // Stats as of `now`: only games played before then count, so past weeks can be replayed for "new gear" detection.
  // parsed: replay stats from data.json, { [matchId]: { t: when they were read, p: { [accountId]: {...} } } }.
  // Only replay stats read before `now` count, so a past Fight Night never changes when a late parse arrives.
  function computeStats(members, allScored, elo, cfg, now, parsed) {
    const S = root.LeagueScoring, tz = cfg.timezoneOffsetHours;
    const scored = {};
    members.forEach(m => { scored[m.id] = (allScored[m.id] || []).filter(e => e.start_time < now); });
    const { start, end } = S.seasonRange(cfg);
    const weeks = S.seasonWeeks(cfg);
    const curWeek = S.weekStartDay(now, tz);
    const stats = {};
    members.forEach(m => {
      stats[m.id] = { seasonPoints: 0, games: 0, wins: 0, turboWins: 0, allpickWins: 0, allpickGames: 0, stacks: 0,
        kdaBonuses: 0, weekWins: 0, weekTop3: 0, bestWeek: 0, leagueGames: 0, leagueWins: 0, elo: cfg.elo.start,
        heroesPlayed: 0, nightGames: 0, weekendGames: 0, activeDays: 0, weekStreak: 0, winStreak: 0, bestKills: 0, bestKda: 0, turboGames: 0,
        losses: 0, feedGames: 0, heroesInWeek: 0, daysInWeek: 0, bestWeekGames: 0, bestGpm: 0, totalLastHits: 0, bestLastHits: 0, denies: 0,
        deny5Games: 0, totalHealing: 0, bestHeroDamage: 0, heroDmg30Games: 0, towerDamage: 0, towerDmg8Games: 0, bestAssists: 0,
        assistGames10: 0, assistGames15: 0, assistGames20: 0, games10Kills: 0, lowDeathWins: 0, deathlessWins: 0, weekendWins: 0,
        stackWins: 0, comebackWins: 0, fastWins: 0, longWins35: 0, longWins40: 0, longWin45: 0, sameHeroGames: 0, founder: 0,
        weekSecond: 0, weekThird: 0,
        totalKills: 0, bestXpm: 0, sameHeroWins: 0, bestDayWins: 0, partyGames: 0, totalHeroDamage: 0, fullWeekends: 0, duoWins: 0,
        totalGold: 0, bestWeekWins: 0, totalAssists: 0, noKillWins: 0, bestHealing: 0, morningGames: 0, bestDayGames: 0, bestDenies: 0,
        bestTowerDamage: 0, lunchGames: 0, lossStreak: 0, soloWins: 0, fiveStackWins: 0, heroesWon: 0,
        // from parsed replays
        parsedGames: 0, rampages: 0, ultraKills: 0, bestDamageTaken: 0, bestDamageTakenWin: 0, arcaneRunes: 0, bountyRunes: 0, waterRunes: 0,
        runes: 0, obsPlaced: 0, senPlaced: 0, wardsKilled: 0, aegis: 0 };
    });
    const until = Math.min(end, now);
    for (const m of members) {
      const s = stats[m.id];
      const heroes = new Set(), days = new Set(), weeksPlayed = new Set();
      const wkDays = new Map(), wkHeroes = new Map(), wkGames = new Map(), heroGames = new Map();
      const addTo = (map, key, val) => { if (!map.has(key)) map.set(key, new Set()); map.get(key).add(val); };
      const inc = (map, key) => map.set(key, (map.get(key) || 0) + 1);
      let run = 0, lossRun = 0;
      const dayGames = new Map(), dayWins = new Map(), wkWins = new Map(), heroWins = new Map(), heroesWon = new Set();
      for (const e of scored[m.id] || []) {
        if (!e.counted || e.start_time < start || e.start_time >= until) continue;
        if (e.result === 'abandon') { run = 0; continue; }
        const local = new Date((e.start_time + tz * 3600) * 1000);
        const hour = local.getUTCHours(), dow = local.getUTCDay();
        heroes.add(e.hero_id); days.add(S.localDay(e.start_time, tz)); weeksPlayed.add(S.weekStartDay(e.start_time, tz));
        if (hour < 6) s.nightGames++;
        if (dow === 0 || dow === 6) s.weekendGames++;
        if (e.mode === 'turbo') s.turboGames++;
        s.bestKills = Math.max(s.bestKills, e.kills || 0);
        s.bestKda = Math.max(s.bestKda, Math.floor(kda(e)));
        run = e.result === 'win' ? run + 1 : 0;
        s.winStreak = Math.max(s.winStreak, run);
        // per-game milestones (last hits, damage, healing, game length...)
        const won = e.result === 'win', mins = (e.duration || 0) / 60, wk = S.weekStartDay(e.start_time, tz);
        if (!won) s.losses++;
        if (e.deaths >= 10) s.feedGames++;
        if (e.kills >= 10) s.games10Kills++;
        const a = e.assists || 0;
        s.bestAssists = Math.max(s.bestAssists, a);
        if (a >= 10) s.assistGames10++; if (a >= 15) s.assistGames15++; if (a >= 20) s.assistGames20++;
        s.totalLastHits += e.last_hits || 0; s.bestLastHits = Math.max(s.bestLastHits, e.last_hits || 0);
        s.denies += e.denies || 0; if ((e.denies || 0) >= 5) s.deny5Games++;
        s.bestGpm = Math.max(s.bestGpm, e.gpm || 0);
        s.bestHeroDamage = Math.max(s.bestHeroDamage, e.hero_damage || 0); if ((e.hero_damage || 0) >= 30000) s.heroDmg30Games++;
        s.towerDamage += e.tower_damage || 0; if ((e.tower_damage || 0) >= 8000) s.towerDmg8Games++;
        s.totalHealing += e.hero_healing || 0;
        if (won) {
          if (e.deaths <= 3) s.lowDeathWins++;
          if (e.deaths === 0) s.deathlessWins++;
          if (dow === 0 || dow === 6) s.weekendWins++;
          if (e.tags.includes('Stack')) s.stackWins++;
          if (lossRun >= 3) s.comebackWins++;
          if (mins < 18) s.fastWins++;
          if (mins >= 35) s.longWins35++; if (mins >= 40) s.longWins40++; if (mins >= 45) s.longWin45++;
        }
        lossRun = won ? 0 : lossRun + 1;
        s.lossStreak = Math.max(s.lossStreak, lossRun);
        const day = S.localDay(e.start_time, tz), party = partyAt(e, now);
        inc(dayGames, day);
        s.totalKills += e.kills || 0; s.totalAssists += a; s.totalHeroDamage += e.hero_damage || 0;
        s.totalGold += Math.round((e.gpm || 0) * mins);
        s.bestXpm = Math.max(s.bestXpm, e.xpm || 0); s.bestHealing = Math.max(s.bestHealing, e.hero_healing || 0);
        s.bestDenies = Math.max(s.bestDenies, e.denies || 0); s.bestTowerDamage = Math.max(s.bestTowerDamage, e.tower_damage || 0);
        if (hour >= 6 && hour < 12) s.morningGames++;
        if (hour >= 12 && hour < 14) s.lunchGames++;
        if (party >= 2) s.partyGames++;
        if (won) {
          inc(dayWins, day); inc(wkWins, wk); inc(heroWins, e.hero_id); heroesWon.add(e.hero_id);
          if (!e.kills) s.noKillWins++;
          if (party === 1) s.soloWins++; if (party === 2) s.duoWins++; if (party === 5) s.fiveStackWins++;
        }
        const pr = parsed && parsed[e.match_id];
        const x = pr && pr.t <= now && pr.p && pr.p[m.id];
        if (x) {
          s.parsedGames++;
          s.rampages += x.ram || 0; s.ultraKills += x.ult || 0; s.aegis += x.aeg || 0;
          s.bestDamageTaken = Math.max(s.bestDamageTaken, x.dt || 0); if (won) s.bestDamageTakenWin = Math.max(s.bestDamageTakenWin, x.dt || 0);
          s.arcaneRunes += x.arc || 0; s.bountyRunes += x.bty || 0; s.waterRunes += x.wat || 0; s.runes += x.run || 0;
          s.obsPlaced += x.obs || 0; s.senPlaced += x.sen || 0; s.wardsKilled += x.wk || 0;
        }
        addTo(wkDays, wk, S.localDay(e.start_time, tz)); addTo(wkHeroes, wk, e.hero_id); inc(wkGames, wk); inc(heroGames, e.hero_id);
        if (wk === weeks[0]) s.founder = 1;
      }
      s.heroesPlayed = heroes.size; s.activeDays = days.size; s.heroesWon = heroesWon.size;
      for (const v of dayGames.values()) s.bestDayGames = Math.max(s.bestDayGames, v);
      for (const v of dayWins.values()) s.bestDayWins = Math.max(s.bestDayWins, v);
      for (const v of wkWins.values()) s.bestWeekWins = Math.max(s.bestWeekWins, v);
      for (const v of heroWins.values()) s.sameHeroWins = Math.max(s.sameHeroWins, v);
      // a full weekend = a game on a Saturday and on the Sunday after it (1970-01-01, day 0, was a Thursday, so Saturdays are day % 7 === 2)
      for (const d of days) if (((d % 7) + 7) % 7 === 2 && days.has(d + 1)) s.fullWeekends++;
      for (const v of wkDays.values()) s.daysInWeek = Math.max(s.daysInWeek, v.size);
      for (const v of wkHeroes.values()) s.heroesInWeek = Math.max(s.heroesInWeek, v.size);
      for (const v of wkGames.values()) s.bestWeekGames = Math.max(s.bestWeekGames, v);
      for (const v of heroGames.values()) s.sameHeroGames = Math.max(s.sameHeroGames, v);
      let streak = 0;
      for (const w of weeks) { if (weeksPlayed.has(w)) { streak++; s.weekStreak = Math.max(s.weekStreak, streak); } else if (w < curWeek) streak = 0; }
    }
    for (const m of members) for (const e of scored[m.id] || []) {
      if (!e.counted || e.start_time < start || e.start_time >= until) continue;
      const s = stats[m.id];
      s.seasonPoints += pointsAt(e, now);
      if (e.result === 'win' || e.result === 'loss') { s.games++; if (e.mode === 'allpick') s.allpickGames++; }
      if (e.result === 'win') { s.wins++; if (e.mode === 'turbo') s.turboWins++; else s.allpickWins++; }
      if (e.tags.includes('Stack')) s.stacks++;
      if (e.tags.includes('KDA')) s.kdaBonuses++;
    }
    for (const w of weeks) {
      if (w > curWeek) break;
      S.weeklyTable(members, scored, w, cfg, { final: w < curWeek }).forEach(r => {
        const s = stats[r.id];
        s.bestWeek = Math.max(s.bestWeek, r.points);
        if (w < curWeek && r.games > 0 && r.rank != null) { if (r.rank === 1) s.weekWins++; if (r.rank === 2) s.weekSecond++; if (r.rank === 3) s.weekThird++; if (r.rank <= 3) s.weekTop3++; }
      });
    }
    [...elo.ladder, ...elo.provisional].forEach(p => {
      const s = stats[p.id];
      if (s) { s.leagueGames = p.games; s.leagueWins = p.wins; s.elo = p.rating; }
    });
    return stats;
  }

  const kda = e => ((e.kills || 0) + (e.assists || 0)) / Math.max(e.deaths || 0, 1);
  // a game's party size and points as they stood at `now`: the parsed party size only counts once the hourly job had read it
  const partyAt = (e, now) => (e.partyP && e.partyT <= now ? e.partyP : e.party0 || e.party || 1);
  const pointsAt = (e, now) => (e.points0 != null && e.party !== e.party0 && !(e.partyT <= now) ? e.points0 : e.points);
  const isUnlocked = (item, st) => !!item.free || (!!st && (st[item.stat] || 0) >= item.need);
  const progress = (item, st) => (item.free ? 1 : Math.min(1, Math.max(0, (st ? st[item.stat] || 0 : 0) / item.need)));
  const requirement = item => (item.free ? 'Starter gear' : STAT_TEXT[item.stat](item.need));
  const findItem = (slot, id) => (SLOTS.find(s => s.id === slot) || { items: [] }).items.find(i => i.id === id);

  function hash(n) { let h = Number(n) >>> 0 || 7; h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return h >>> 0; }

  // Until a player saves their own look, they wear their best unlocked item in every slot.
  function defaultLoadout(id, st) {
    const h = hash(id);
    const lo = {
      skin: h % SKINS.length,
      // defaults pick from the original 4 styles / 6 hair colours / 5 tunics, so adding options never changes anyone's default look
      hair: HAIR_STYLES[(h >>> 3) % 4].id,
      hairColor: (h >>> 6) % 6,
      tunic: (h >>> 9) % 5,
    };
    for (const slot of SLOTS) {
      const unlocked = slot.items.filter(i => isUnlocked(i, st));
      lo[slot.id] = unlocked[unlocked.length - 1].id;
    }
    return lo;
  }

  // Merge a saved loadout over the default, dropping anything invalid or still locked.
  function sanitize(saved, id, st) {
    const base = defaultLoadout(id, st);
    if (!saved || typeof saved !== 'object') return base;
    const lo = { ...base };
    const idx = (v, len) => (Number.isInteger(v) && v >= 0 && v < len ? v : null);
    if (idx(saved.skin, SKINS.length) != null) lo.skin = saved.skin;
    if (HAIR_STYLES.some(h => h.id === saved.hair)) lo.hair = saved.hair;
    if (idx(saved.hairColor, HAIR_COLORS.length) != null) lo.hairColor = saved.hairColor;
    if (idx(saved.tunic, TUNICS.length) != null) lo.tunic = saved.tunic;
    for (const slot of SLOTS) {
      const it = findItem(slot.id, saved[slot.id]);
      if (it && isUnlocked(it, st)) lo[slot.id] = it.id;
    }
    return lo;
  }

  const isAnimated = lo => SLOTS.some(sl => { const it = findItem(sl.id, lo[sl.id]); return it && it.animated; });

  // ---------- pixel drawing ----------
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * f))));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  const grid = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  function pen(t) {
    const P = (x, y, c) => { if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) t[y][x] = c; };
    const R = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(x + i, y + j, c); };
    const D = (pts, c) => pts.forEach(([x, y]) => P(x, y, c));
    return { P, R, D };
  }

  const C = {
    gold: '#e2b957', goldD: '#b98c2f', goldL: '#fff1b8', steel: '#9aa3ab', steelL: '#d5dbe0', steelD: '#6c747c',
    iron: '#3a3f47', ironD: '#262a30', wood: '#7a5232', leather: '#5a3a22', dark: '#2a1a14',
    red: '#c23c2a', redL: '#e8553e', green: '#8fc84f', greenD: '#4f8a2e', ember: '#ff7a3d', flame: '#ffcf4a',
  };

  // Each item draws itself; `f` is the animation frame (0-3).
  const DRAW = {
    aura: {
      first_blood: (g, f) => ring(g, ['#7a1d12', '#c23c2a', '#ff7a3d'], f, false),
      leafstorm: (g, f) => {
        ring(g, ['#2f6b2a', '#5fa04a', '#c8e89a'], f, false);
        const { D } = pen(g); D([[2, 8], [3, 9], [29, 11], [28, 12], [4, 27], [27, 26], [15, 1], [16, 2]], '#8fd06a'); D([[3, 8], [28, 11], [5, 27], [26, 26]], '#e2b957');
      },
      snowfall: (g, f) => {
        ring(g, ['#5f8fb8', '#a8d4f0', '#ffffff'], f, false);
        const { D } = pen(g);
        [[4, 5], [27, 6], [2, 20], [29, 22], [15, 0]].forEach(([x, y]) => D([[x, y], [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]], '#e6f4ff'));
      },
      storm: (g, f) => { ring(g, ['#2a4f9a', '#4f95ea', '#e6f4ff'], f, false); const { D } = pen(g); D([[3, 3], [4, 4], [3, 5], [4, 6], [28, 4], [27, 5], [28, 6], [27, 7]], '#e6f4ff'); },
      godlike: (g, f) => ring(g, ['#b98c2f', '#f0c560', '#fff6d0'], f, true),
      bloodmoon: (g, f) => {
        const { P, R } = pen(g);
        const deep = '#5a0f0a', blood = '#a3181a', red = '#e8302a', hot = '#ff6a4a', white = '#ffd9cc';
        const r = 13 + [0, 0.4, 0.8, 0.4][f];
        for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
          const d = Math.hypot(x - 15.5, y - 17);
          if (Math.abs(d - r) < 0.7) P(x, y, f === 2 ? white : hot);
          else if (d > r - 2.6 && d <= r - 0.7 && (x + y) % 2 === 0) P(x, y, red);
          else if (d >= r + 0.7 && d < r + 2.2 && (x + y + f) % 2 === 0) P(x, y, blood);
          else if (d >= r + 2.2 && d < r + 3 && (x * 3 + y * 5 + f) % 4 === 0) P(x, y, deep);
        }
        // flame tongues rising off the top of the halo
        [7, 10, 13, 16, 19, 22, 25].forEach((x, i) => {
          const base = Math.round(17 - Math.sqrt(Math.max(0, r * r - (x - 15.5) ** 2))) - 1;
          const h = [3, 2, 4, 2, 3, 4, 2][(i + f) % 7];
          for (let k = 0; k < h; k++) P(x, base - k, k === h - 1 ? white : k > h / 2 ? hot : red);
        });
        // drifting embers
        [[3, 24], [28, 22], [5, 10], [27, 9], [1, 17], [30, 15]].forEach(([x, y], i) => P(x, (y - f * 2 - i + 32) % 32, i % 2 ? hot : red));
      },
    },
    cape: {
      comet_cape: g => {
        const { R, P, D } = pen(g);
        R(9, 17, 14, 12, '#1e2a52'); R(9, 17, 1, 12, '#141c38'); R(22, 17, 1, 12, '#141c38');
        D([[10, 18], [21, 20], [11, 24], [20, 27], [16, 28], [12, 21]], '#ffffff');
        D([[13, 28], [14, 27], [15, 26], [16, 25], [17, 24]], '#6fb7ff'); P(18, 23, '#e6f4ff'); D([[12, 28], [13, 29]], '#3d6ec9');
        for (let x = 9; x < 23; x++) P(x, 29, x % 2 ? '#1e2a52' : null);
      },
      sunfire_cape: (g, f) => {
        const { R, P } = pen(g);
        R(9, 17, 14, 4, '#f0c560'); R(9, 21, 14, 4, '#ff9a3d'); R(9, 25, 14, 3, '#e8553e');
        R(9, 17, 1, 11, '#c87a2a'); R(22, 17, 1, 11, '#c87a2a'); P(9, 16, C.gold); P(22, 16, C.gold);
        for (let x = 9; x < 23; x++) { const h = [1, 2, 0, 2, 1, 0, 2][(x + f) % 7]; for (let k = 0; k <= h; k++) P(x, 28 + k, k === h ? C.flame : C.redL); }
      },
      gank_cloak: g => {
        const { R, P } = pen(g);
        R(9, 16, 14, 13, '#2a2433'); R(10, 16, 12, 2, '#3a3247');
        for (let x = 9; x < 23; x++) { P(x, x % 3 ? 29 : 28, '#5b3a9e'); if (x % 2) P(x, 27, '#7a4bb3'); }
        P(8, 25, '#7a4bb3'); P(23, 24, '#7a4bb3'); P(7, 22, '#5b3a9e'); P(24, 21, '#5b3a9e');
      },
      dire_banner: g => {
        const { R, P } = pen(g);
        R(9, 17, 14, 12, '#4a1712'); R(9, 17, 1, 12, '#2e0e0b'); R(22, 17, 1, 12, '#2e0e0b');
        for (let x = 9; x < 23; x++) P(x, 28 + (x % 3 === 0 ? 1 : 0), x % 2 ? C.redL : C.ember);
        P(9, 16, C.iron); P(22, 16, C.iron);
      },
      radiant_banner: g => {
        const { R, P } = pen(g);
        R(9, 17, 14, 12, '#3f7d2e'); R(9, 17, 1, 12, '#2c5a20'); R(22, 17, 1, 12, '#2c5a20');
        R(9, 28, 14, 1, C.gold); for (let x = 10; x < 23; x += 3) P(x, 29, C.gold);
        P(9, 16, C.gold); P(22, 16, C.gold);
      },
    },
    body: {
      weekend_vest: (g, f, lo) => {
        const { R, P } = pen(g); const v = '#3e5a34', vD = '#2c4224';
        DRAW.body.tunic(g, f, lo);
        R(12, 16, 3, 5, v); R(17, 16, 3, 5, vD); R(12, 16, 8, 1, v);
        P(13, 18, '#c23c2a'); P(13, 19, '#e2b957'); P(18, 18, '#4f95ea'); P(14, 17, '#c9b48a'); P(17, 17, '#c9b48a');
      },
      collector_coat: g => {
        const { R, P, D } = pen(g); const c = '#6a2232', cD = '#4a1622';
        R(12, 16, 8, 11, c); R(11, 23, 10, 4, c); R(19, 16, 1, 11, cD); R(20, 23, 1, 4, cD);
        R(10, 16, 2, 6, c); R(20, 16, 2, 6, cD); R(15, 17, 2, 9, '#e6e0d2'); D([[14, 16], [17, 16], [14, 17], [17, 17]], C.gold);
        D([[13, 18], [13, 20], [18, 19]], C.gold); P(13, 19, '#4f95ea'); P(18, 18, C.green); P(18, 20, C.red);
        R(11, 26, 10, 1, cD); R(10, 21, 2, 1, C.gold); R(20, 21, 2, 1, C.gold);
      },
      tunic: (g, f, lo) => {
        const { R, P } = pen(g); const t = TUNICS[lo ? lo.tunic : 0], tD = shade(t, 0.72);
        R(12, 16, 8, 7, t); R(19, 16, 1, 7, tD); R(10, 16, 2, 6, t); R(20, 16, 2, 6, tD);
        R(12, 21, 8, 1, C.leather); P(15, 21, C.gold); P(16, 21, C.gold);
      },
      jungler_leathers: g => {
        const { R, P } = pen(g); const l = '#8a5e36', lD = '#5e3e22';
        R(12, 16, 8, 7, l); R(19, 16, 1, 7, lD); R(10, 16, 2, 6, l); R(20, 16, 2, 6, lD);
        for (let i = 0; i < 6; i++) P(12 + i, 17 + i, '#3e2814');
        for (let x = 11; x < 21; x++) P(x, 16, x % 2 ? '#d8c69a' : '#b8a678'); P(10, 16, '#d8c69a'); P(21, 16, '#b8a678');
        R(12, 21, 8, 1, '#3e2814'); P(18, 21, C.steel); R(10, 19, 2, 1, '#3e2814'); R(20, 19, 2, 1, '#3e2814');
      },
      support_robe: g => {
        const { R, P, D } = pen(g); const w = '#e6e0d2', wD = '#b8b0a0', teal = '#2f9a92';
        R(12, 16, 8, 11, w); R(11, 23, 10, 4, w); R(19, 16, 1, 11, wD); R(20, 23, 1, 4, wD);
        R(10, 16, 2, 6, w); R(20, 16, 2, 6, wD); R(11, 26, 10, 1, teal); R(10, 21, 2, 1, teal); R(20, 21, 2, 1, teal);
        D([[15, 17], [16, 17], [14, 18], [15, 18], [16, 18], [17, 18], [15, 19], [16, 19]], C.green);
        R(12, 21, 8, 1, teal);
      },
      offlane_plate: g => {
        const { R, P } = pen(g);
        R(12, 16, 8, 6, C.iron); R(19, 16, 1, 6, C.ironD); R(10, 16, 2, 6, C.iron); R(20, 16, 2, 6, C.ironD);
        R(8, 15, 5, 2, C.ironD); R(19, 15, 5, 2, C.ironD); P(8, 14, C.steelL); P(23, 14, C.steelL); P(9, 14, C.steel); P(22, 14, C.steel);
        R(15, 17, 2, 4, C.red); R(12, 21, 8, 1, C.red); P(13, 18, C.steelD); P(18, 18, C.steelD);
      },
      champion_mail: (g, f) => {
        const { R, P } = pen(g);
        R(12, 16, 8, 6, C.gold); R(19, 16, 1, 6, C.goldD); R(10, 16, 2, 6, C.gold); R(20, 16, 2, 6, C.goldD);
        R(9, 15, 4, 2, C.gold); R(19, 15, 4, 2, C.goldD); P(9, 14, C.gold); P(22, 14, C.goldD);
        R(13, 17, 3, 3, C.red); R(16, 17, 3, 3, C.greenD); P(15, 17, C.redL); P(16, 17, C.green);
        R(12, 21, 8, 1, C.goldD); P(15, 21, C.redL); P(16, 21, C.green);
        const glint = [[12, 16], [14, 18], [17, 19], [19, 21]][f]; P(glint[0], glint[1], C.goldL);
      },
    },
    head: {
      pathfinder_goggles: g => {
        const { R, P } = pen(g);
        R(11, 7, 10, 1, '#5a3a22'); R(10, 7, 1, 2, '#5a3a22'); R(21, 7, 1, 2, '#5a3a22');
        R(12, 5, 3, 3, C.goldD); R(17, 5, 3, 3, C.goldD); P(13, 6, '#6fd0e8'); P(18, 6, '#6fd0e8'); P(12, 5, C.gold); P(17, 5, C.gold); R(15, 6, 2, 1, '#5a3a22');
      },
      night_owl_hood: g => {
        const { R, P, D } = pen(g); const h = '#2a2d4a', hD = '#1c1e33';
        R(10, 4, 12, 5, h); P(10, 4, null); P(21, 4, null); R(13, 3, 6, 1, h); D([[15, 2], [16, 2]], h);
        R(10, 8, 12, 1, hD); R(10, 9, 1, 6, h); R(21, 9, 1, 6, hD); R(9, 12, 1, 4, hD); R(22, 12, 1, 4, hD);
        D([[18, 5], [19, 5], [19, 6]], '#f2e6a6'); P(12, 5, '#3a3e64');
      },
      unbroken_helm: g => {
        const { R, P, D } = pen(g); const b = '#a8743a', bL = '#d8a55e', bD = '#7a5228', w = '#e8e4dc';
        R(10, 4, 12, 5, b); P(10, 4, null); P(21, 4, null); R(11, 4, 10, 1, bL); R(10, 8, 12, 1, bD);
        R(15, 9, 2, 3, b); R(10, 9, 1, 3, bD); R(21, 9, 1, 3, bD); P(15, 6, bD); P(16, 6, bD);
        D([[9, 6], [8, 5], [9, 5], [7, 4], [8, 4], [7, 3], [6, 3]], w); D([[22, 6], [23, 5], [22, 5], [24, 4], [23, 4], [24, 3], [25, 3]], w);
        D([[8, 6], [6, 4], [23, 6], [25, 4]], '#b8b0a0');
      },
      headband: g => { const { R, P } = pen(g); R(11, 8, 10, 1, C.red); P(21, 8, C.red); P(22, 9, C.red); P(22, 10, C.redL); },
      tower_helm: g => {
        const { R, P, D } = pen(g);
        R(10, 4, 12, 5, C.steel); R(10, 3, 12, 1, C.steelD);
        D([[10, 2], [11, 2], [14, 2], [15, 2], [16, 2], [17, 2], [20, 2], [21, 2]], C.steel);
        R(12, 5, 2, 1, C.steelL); R(10, 9, 12, 1, C.steelD); R(10, 10, 1, 3, C.steelD); R(21, 10, 1, 3, C.steelD);
        P(15, 6, C.red); P(16, 6, C.red); P(15, 7, C.redL);
      },
      midlane_mask: g => {
        const { R, P } = pen(g);
        R(11, 10, 10, 3, '#1c1f24'); R(11, 10, 10, 1, C.steelD); P(13, 11, '#ff5a3d'); P(18, 11, '#ff5a3d');
        P(15, 12, C.steelD); P(16, 12, C.steelD); P(10, 11, '#8a2a1e'); P(21, 11, '#8a2a1e'); P(22, 12, '#8a2a1e'); P(22, 13, C.red);
      },
      rampage_helm: g => {
        const { R, P, D } = pen(g);
        R(10, 4, 12, 5, C.iron); P(10, 4, null); P(21, 4, null); R(12, 5, 2, 1, '#5a616b'); R(10, 8, 12, 1, C.ironD);
        R(15, 1, 2, 3, C.red); D([[17, 0], [18, 1], [14, 0]], C.redL); P(16, 0, C.ember);
        D([[9, 5], [8, 4], [7, 3]], C.steelL); D([[22, 5], [23, 4], [24, 3]], C.steelL);
        R(10, 9, 1, 3, C.ironD); R(21, 9, 1, 3, C.ironD);
      },
      weekly_crown: (g, f) => {
        const { R, P, D } = pen(g);
        R(11, 6, 10, 2, C.gold); R(11, 7, 10, 1, C.goldD);
        R(15, 2, 2, 4, C.gold); D([[12, 4], [12, 5], [19, 4], [19, 5], [11, 5], [20, 5]], C.gold);
        P(15, 3, C.green); P(16, 3, C.green); P(13, 6, C.red); P(18, 6, C.red); P(16, 2, C.goldL);
        const sp = [[10, 2], [21, 3], [17, 0], [13, 1]][f]; P(sp[0], sp[1], '#ffffff');
        const sp2 = [[13, 1], [10, 2], [21, 3], [17, 0]][f]; P(sp2[0], sp2[1], C.goldL);
      },
    },
    weapon: {
      twin_hatchets: g => {
        const { R, P } = pen(g);
        R(22, 16, 1, 7, C.wood); R(23, 16, 2, 3, C.steel); P(25, 17, C.steelL); P(25, 16, C.steelL); P(23, 18, C.steelD);
        R(9, 16, 1, 7, C.wood); R(7, 16, 2, 3, C.steel); P(6, 17, C.steelL); P(6, 16, C.steelL); P(8, 18, C.steelD);
        P(22, 23, C.leather); P(9, 23, C.leather);
      },
      dusk_sabre: g => {
        const { R, D } = pen(g); const bl = '#c8b8f0', ed = '#7a5ab8';
        D([[22, 20], [22, 19], [22, 18], [22, 17], [23, 16], [23, 15], [23, 14], [24, 13], [24, 12], [25, 11]], bl);
        D([[23, 20], [23, 19], [23, 18], [23, 17], [24, 15], [24, 14], [25, 12], [26, 11]], ed);
        R(21, 21, 3, 1, C.gold); R(22, 22, 1, 2, '#3b2f2a'); D([[22, 24]], C.gold);
      },
      starforged_spear: (g, f) => {
        const { R, P, D } = pen(g);
        R(23, 6, 1, 23, '#4a3a6a'); R(23, 6, 1, 1, C.gold); R(23, 12, 1, 1, C.gold);
        P(23, 1, '#ffffff'); R(22, 2, 3, 2, '#e6f4ff'); P(23, 3, '#6fb7ff'); R(22, 4, 3, 1, '#a8d4f0'); P(23, 5, '#a8d4f0');
        D([[24, 7], [24, 8], [25, 9]], C.red);
        const st = [[[20, 1], [26, 4]], [[21, 0], [26, 2]], [[20, 3], [25, 0]], [[21, 4], [26, 1]]][f];
        st.forEach(([x, y]) => P(x, y, '#ffffff'));
      },
      training_sword: g => { const { R, P } = pen(g); R(22, 12, 2, 9, '#a0703e'); R(23, 12, 1, 9, C.wood); P(22, 11, '#a0703e'); R(21, 21, 4, 1, C.leather); R(22, 22, 2, 2, '#3b2f2a'); },
      lasthit_dagger: g => {
        const { R, D } = pen(g);
        R(22, 22, 2, 2, '#3b2f2a'); R(21, 21, 4, 1, C.leather);
        D([[22, 20], [23, 20], [22, 19], [23, 19], [23, 18], [24, 18], [23, 17], [24, 17], [24, 16]], C.steelL);
        D([[23, 19], [24, 17]], C.steel); D([[24, 15], [25, 16]], C.green);
      },
      ward_lantern: (g, f) => {
        const { R, P, D } = pen(g);
        R(23, 9, 1, 20, C.wood); D([[23, 8], [24, 7], [25, 7], [26, 8]], C.iron);
        R(25, 9, 3, 5, C.iron); R(26, 10, 1, 3, '#b8f58a'); P(25, 10, '#7fd650'); P(27, 12, '#7fd650'); P(26, 14, C.ironD);
      },
      throne_breaker: g => {
        const { R, P } = pen(g);
        R(23, 10, 1, 18, C.wood); P(23, 27, C.ironD);
        R(20, 5, 7, 5, C.steel); R(20, 5, 7, 1, C.steelL); R(20, 9, 7, 1, C.steelD); R(20, 7, 7, 1, C.red);
        P(19, 6, C.steelD); P(19, 8, C.steelD); P(27, 6, C.steelD); P(27, 8, C.steelD);
      },
      ascendant_staff: (g, f) => {
        const { R, P, D } = pen(g);
        for (let y = 8; y < 29; y++) P(23, y, y % 2 ? '#3a1d18' : '#5a2a20');
        D([[22, 7], [24, 7], [22, 6], [24, 6], [23, 8]], C.gold);
        P(23, 2, C.redL); R(22, 3, 1, 2, C.red); R(24, 3, 1, 2, C.greenD); P(23, 3, '#ffd9c8'); P(23, 4, C.green); P(23, 5, C.greenD);
        const fl = [[[21, 2], [25, 1], [23, 0]], [[21, 1], [25, 2], [22, 0]], [[22, 1], [24, 0], [25, 3]], [[21, 3], [24, 1], [23, 0]]][f];
        fl.forEach(([x, y], i) => P(x, y, i === 2 ? C.flame : C.ember));
      },
    },
    pet: {
      lucky_cat: g => {
        const { R, P, D } = pen(g); const w = '#f4f0e8', wD = '#d6cfc2';
        R(2, 24, 5, 5, w); R(6, 24, 1, 5, wD); R(1, 20, 6, 4, w); D([[1, 19], [6, 19]], w); D([[1, 20], [6, 20]], '#e8a35a');
        D([[2, 22], [5, 22]], C.dark); P(3, 23, '#e88f7a'); P(4, 23, '#e88f7a');
        R(2, 24, 5, 1, C.red); P(4, 25, C.gold); R(7, 21, 1, 3, w); P(7, 20, w); D([[3, 27], [5, 26]], '#e8a35a');
      },
      slime_buddy: g => {
        const { R, P, D } = pen(g); const t = '#3fc9b4', tD = '#2a9a88';
        R(2, 25, 7, 4, t); R(3, 24, 5, 1, t); R(4, 23, 3, 1, t); R(2, 28, 7, 1, tD); R(8, 25, 1, 3, tD);
        D([[3, 25], [4, 24]], '#c8fff4'); D([[4, 26], [7, 26]], C.dark); R(5, 27, 2, 1, tD);
      },
      little_ghost: g => {
        const { R, P, D } = pen(g); const w = '#e6eef8', wD = '#b8c8dc';
        R(1, 20, 6, 7, w); R(2, 19, 4, 1, w); R(6, 21, 1, 6, wD);
        D([[1, 27], [3, 27], [5, 27]], w); D([[2, 27], [4, 27], [6, 27]], wD);
        R(2, 22, 1, 2, '#2a2d4a'); R(5, 22, 1, 2, '#2a2d4a'); P(3, 25, '#2a2d4a'); P(4, 25, '#2a2d4a');
        D([[0, 18], [7, 17], [8, 24]], '#a8d4f0');
      },
      lane_frog: g => { const { R, P } = pen(g); R(2, 25, 6, 4, '#5fb04a'); R(3, 27, 4, 1, '#a6dd7a'); R(2, 23, 2, 2, '#5fb04a'); R(6, 23, 2, 2, '#5fb04a'); P(2, 23, '#ffffff'); P(6, 23, '#ffffff'); P(3, 24, C.dark); P(7, 24, C.dark); },
      night_foal: g => {
        const { R, P, D } = pen(g);
        const coat = '#3a3640', coatD = '#26232b', coatL = '#55505c', fire = '#c23c2a', fireL = '#e8553e', ember = '#ff7a3d';
        // small dark wings with red-tipped feathers
        const rows = [[22, 4, 7], [21, 5, 8], [20, 6, 8], [19, 7, 8]];
        rows.forEach(([y, a, b]) => R(a, y, b - a + 1, 1, '#6a6474'));
        D([[6, 21], [7, 20]], '#8a8494');
        D([[8, 19], [8, 20], [8, 21], [7, 22]], fire); P(8, 18, fireL);
        // round, chubby body
        R(1, 23, 8, 4, coat); R(2, 22, 6, 1, coat); R(2, 27, 6, 1, coatD); R(1, 26, 8, 1, coatD);
        P(1, 23, null); P(8, 23, coatD); D([[3, 23], [4, 23]], coatL);
        // flame tail
        D([[9, 23], [9, 24], [9, 25]], fire); D([[9, 22], [8, 26]], fireL); P(9, 21, ember);
        // short stubby legs with ember hooves
        [2, 4, 5, 7].forEach(x => { P(x, 28, x > 4 ? coatD : coat); P(x, 29, ember); });
        // head facing left, glowing eye, flame mane
        R(0, 19, 3, 4, coat); P(0, 19, null); P(2, 18, coat); P(1, 18, coatD);
        P(1, 20, '#ff3b30'); D([[0, 21], [0, 22]], coatL);
        D([[3, 18], [3, 19], [3, 20], [3, 21], [4, 19], [4, 20]], fire); D([[3, 17], [4, 18], [2, 17]], fireL); P(4, 17, ember);
      },
      boulder_pup: g => {
        const { R, P, D } = pen(g); const st = '#7d858c', stD = '#596067', stL = '#a3abb2', moss = '#5fa04a', mossL = '#8fd06a';
        R(2, 23, 7, 6, st); R(1, 24, 1, 4, st); R(9, 25, 1, 3, stD); R(2, 28, 7, 1, stD);
        R(3, 22, 5, 1, moss); D([[4, 21], [6, 21], [2, 23], [8, 23]], moss); D([[5, 21], [4, 22]], mossL);
        R(0, 23, 3, 3, stL); P(0, 23, null); P(1, 24, '#b8f58a'); P(0, 26, stD); P(1, 26, '#e6e0d2');
        D([[5, 25], [6, 26], [7, 25]], stD); P(4, 27, stD);
        R(3, 29, 2, 1, '#3e4248'); R(7, 29, 2, 1, '#3e4248');
      },
      ember_drake: (g, f) => {
        const { R, P, D } = pen(g);
        R(2, 24, 5, 5, '#c8432d'); R(3, 26, 3, 2, '#f2b07a'); R(1, 21, 4, 3, '#c8432d'); P(2, 22, C.flame); P(0, 22, '#f2b07a');
        D([[7, 28], [8, 27], [8, 26]], '#c8432d');
        if (f % 2 === 0) { R(5, 20, 3, 1, C.redL); R(6, 21, 2, 1, C.redL); P(7, 22, C.redL); }
        else { R(5, 22, 3, 1, C.redL); R(6, 23, 2, 1, C.redL); P(8, 23, C.redL); }
        const puff = [[[0, 20]], [[0, 19], [1, 20]], [[1, 18]], []][f]; puff.forEach(([x, y]) => P(x, y, C.ember));
      },
    },
  };

  // ---------- expansion gear (boots, off-hand and more for every slot) ----------
  // Where each foot sits for a leg pose: foot box (x, y, 4x2) and the first column of the leg above it.
  const FEET = {
    stand: [{ x: 11, y: 27, lx: 12 }, { x: 17, y: 27, lx: 17 }],
    split: [{ x: 10, y: 27, lx: 11 }, { x: 18, y: 27, lx: 18 }],
    tuck: [{ x: 12, y: 25, lx: 12 }, { x: 16, y: 25, lx: 17 }],
    runA: [{ x: 9, y: 25, lx: 11 }, { x: 18, y: 27, lx: 17 }],
    runB: [{ x: 10, y: 27, lx: 12 }, { x: 19, y: 25, lx: 18 }],
  };
  // o: main, sole, cuff, toe, shaft (rows of boot above the foot), extra(P, foot, side, f)
  function boot(g, feet, o, f) {
    const { P, R } = pen(g);
    (feet || FEET.stand).forEach((ft, i) => {
      const { x, y, lx } = ft, outer = i === 0 ? x : x + 3;
      R(x, y, 4, 1, o.main); R(x, y + 1, 4, 1, o.sole);
      if (o.toe) P(outer, y, o.toe);
      for (let k = 1; k <= (o.shaft || 0); k++) R(lx, y - k, 3, 1, k === o.shaft ? (o.cuff || o.main) : o.main);
      if (o.extra) o.extra(P, ft, i, f);
    });
  }
  const disc = (P, cx, cy, r, fill, rim) => {
    for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r - 0.6) P(x, y, fill); else if (d <= r + 0.4) P(x, y, rim);
    }
  };

  DRAW.boots = {
    tp_sandals: (g, f, lo, feet) => boot(g, feet, { main: '#b88a5a', sole: '#5a3a22', shaft: 1, cuff: '#6fb7ff',
      extra: (P, { x, y }) => { P(x + 1, y, '#6fb7ff'); P(x + 2, y, '#d6f0ff'); } }),
    rotation_boots: (g, f, lo, feet) => boot(g, feet, { main: '#4f8a2e', sole: '#2c4224', toe: '#8fc84f', shaft: 2, cuff: '#8fc84f' }),
    juke_boots: (g, f, lo, feet) => boot(g, feet, { main: '#4a3a6a', sole: '#26202f', toe: '#c8b8f0', shaft: 2, cuff: '#a66be8',
      extra: (P, { x, y, lx }, i) => P(i === 0 ? lx : lx + 2, y - 1, '#ffffff') }),
    rat_treads: (g, f, lo, feet) => boot(g, feet, { main: '#596067', sole: '#2a2d30', toe: '#d5dbe0', shaft: 2, cuff: '#9aa3ab',
      extra: (P, { x, y, lx }) => { P(x + 1, y + 1, '#4a4f55'); P(x + 3, y + 1, '#4a4f55'); P(lx + 1, y - 1, '#e2b957'); } }),
    backdoor_greaves: (g, f, lo, feet) => boot(g, feet, { main: '#e2b957', sole: '#b98c2f', toe: '#fff1b8', shaft: 3, cuff: '#fff1b8',
      extra: (P, { x, y, lx }, i) => {
        P(lx + 1, y - 2, '#c23c2a');
        const heel = i === 0 ? x + 3 : x;
        const fl = [[0, 1], [1, 0], [0, 2], [1, 1]][(f + i) % 4];
        P(heel + (i === 0 ? fl[0] : -fl[0]), y + 2, '#ff7a3d'); if (fl[1]) P(heel + (i === 0 ? 1 : -1) * fl[1], y + 1 + fl[1] % 2, '#ffcf4a');
      } }),
  };

  DRAW.offhand = {
    creep_buckler: g => {
      const { P } = pen(g);
      disc(P, 9, 20, 3, '#8a5e36', '#4e3420');
      P(9, 20, C.steelL); P(8, 19, '#a8784a'); P(10, 21, '#6e4a2a'); P(9, 17, C.steel); P(9, 23, C.steel);
    },
    throw_gloves: g => {
      const { P, R } = pen(g); const red = '#c23c2a', redD = '#8a2a1e';
      R(8, 19, 4, 4, red); R(9, 18, 3, 1, red); P(7, 20, red); P(7, 21, redD); R(8, 22, 4, 1, redD);
      P(9, 19, '#ff8a6e'); R(9, 23, 3, 1, '#e6e0d2'); P(11, 20, redD);
    },
    founder_pennant: g => {
      const { P, R, D } = pen(g);
      R(9, 9, 1, 17, C.wood); P(9, 8, C.gold);
      R(4, 10, 5, 4, '#b63a2c'); R(5, 14, 4, 1, '#b63a2c'); R(6, 15, 3, 1, '#b63a2c'); P(8, 16, '#b63a2c');
      R(4, 10, 5, 1, C.gold); D([[6, 12], [7, 12], [6, 11], [7, 13]], C.gold); P(5, 12, C.goldL);
    },
    deny_shield: g => {
      const { P, R } = pen(g); const st = C.steel, rim = C.steelD;
      [[16, 6, 11], [17, 6, 11], [18, 6, 11], [19, 6, 11], [20, 7, 10], [21, 7, 10], [22, 8, 9]].forEach(([y, a, b]) => {
        R(a, y, b - a + 1, 1, st); P(a, y, rim); P(b, y, rim);
      });
      R(6, 16, 6, 1, rim); P(8, 23, rim); P(9, 23, rim);
      R(8, 17, 2, 3, '#e6f4ff'); R(8, 21, 2, 1, '#e6f4ff'); P(7, 17, C.steelL);
    },
    hex_talisman: (g) => {
      const { P, D } = pen(g); const v = '#7a4bb3', vL = '#c8a8ff';
      D([[10, 23], [9, 24]], C.goldD);
      D([[8, 25], [7, 26], [8, 26], [9, 26], [6, 27], [7, 27], [8, 27], [9, 27], [10, 27], [7, 28], [8, 28], [9, 28], [8, 29]], v);
      P(8, 26, vL); P(7, 27, vL); P(8, 27, '#ffffff'); D([[5, 25], [11, 26], [10, 29]], '#b48aff');
    },
    tank_bulwark: g => {
      const { P, R } = pen(g);
      R(5, 15, 7, 11, C.iron); R(5, 15, 7, 1, C.gold); R(5, 25, 7, 1, C.gold); R(5, 15, 1, 11, C.gold); R(11, 15, 1, 11, C.goldD);
      R(6, 16, 5, 1, '#4e555e'); R(8, 17, 1, 8, C.ironD); R(6, 20, 5, 1, C.ironD);
      [[6, 17], [10, 17], [6, 23], [10, 23]].forEach(([x, y]) => P(x, y, C.steelL)); P(8, 20, C.red);
    },
    second_life_shield: (g, f) => {
      const { P, D } = pen(g);
      disc(P, 8.5, 20, 3.6, C.gold, C.goldD);
      const core = [['#c23c2a', '#ff7a3d'], ['#e8553e', '#ffcf4a'], ['#ff7a3d', '#ffffff'], ['#e8553e', '#ffcf4a']][f];
      D([[8, 19], [9, 19], [8, 20], [9, 20], [8, 21], [9, 21]], core[0]); D([[7, 20], [10, 20], [8, 18], [9, 18]], core[0]);
      P(8, 20, core[1]); P(9, 19, core[1]);
      const orbit = [[5, 17], [12, 17], [12, 23], [5, 23]][f]; P(orbit[0], orbit[1], '#ffffff');
    },
  };

  Object.assign(DRAW.head, {
    gg_mask: g => {
      const { P, R } = pen(g); const w = '#ece6da', wD = '#c4bcac';
      R(12, 10, 8, 3, w); R(12, 12, 8, 1, wD); P(11, 10, w); P(20, 10, wD);
      R(13, 11, 1, 2, C.dark); R(18, 11, 1, 2, C.dark); P(10, 10, '#5a3a22'); P(21, 10, '#5a3a22');
      P(13, 13, '#6fb7ff'); P(13, 14, '#a8d4f0');
    },
    last_pick_hood: g => {
      const { P, R, D } = pen(g); const h = '#5c6168', hD = '#41454b', trim = '#e8853e';
      R(10, 4, 12, 5, h); P(10, 4, null); P(21, 4, null); R(13, 3, 6, 1, h); D([[15, 2], [16, 2], [17, 1]], h);
      R(10, 8, 12, 1, trim); R(10, 9, 1, 6, h); R(21, 9, 1, 6, hD); R(9, 12, 1, 4, hD); R(22, 12, 1, 4, hD);
      R(11, 9, 10, 1, '#3a3e44'); P(12, 5, '#7a8088'); P(18, 2, trim);
    },
    gpm_circlet: g => {
      const { P, R, D } = pen(g);
      R(11, 8, 10, 1, C.gold); P(11, 8, C.goldD); P(20, 8, C.goldD);
      R(15, 6, 2, 2, '#ffcf4a'); P(15, 6, '#fff1b8'); D([[14, 7], [17, 7]], C.goldD);
      P(10, 9, C.gold); P(21, 9, C.gold); P(10, 10, '#ffcf4a'); P(21, 10, '#ffcf4a');
    },
    tormentor_horns: g => {
      const { P, D } = pen(g); const h = '#3a3247', hL = '#5a4e6e', tip = '#b48aff';
      D([[11, 7], [10, 6], [10, 5], [9, 4], [9, 3], [8, 2]], h); D([[11, 6], [10, 4]], hL); P(8, 1, tip); P(7, 1, '#e6d8ff');
      D([[20, 7], [21, 6], [21, 5], [22, 4], [22, 3], [23, 2]], h); D([[20, 6], [21, 4]], hL); P(23, 1, tip); P(24, 1, '#e6d8ff');
    },
    mega_creeps_crown: (g, f) => {
      const { P, R, D } = pen(g); const p = '#5b3a9e', pL = '#7a4bb3';
      R(11, 6, 10, 2, p); R(11, 5, 10, 1, pL); R(11, 7, 10, 1, C.gold);
      D([[11, 4], [11, 3], [14, 4], [14, 3], [14, 2], [17, 4], [17, 3], [17, 2], [20, 4], [20, 3]], pL);
      D([[12, 4], [15, 4], [16, 4], [18, 4], [19, 4], [13, 4]], p);
      const gems = ['#ff5a3d', '#8fc84f', '#4f95ea', '#ffcf4a'];
      [[11, 2], [14, 1], [17, 1], [20, 2]].forEach(([x, y], i) => P(x, y, gems[(i + f) % 4]));
      P(15, 6, C.goldL); P(16, 6, C.gold);
    },
  });

  Object.assign(DRAW.body, {
    feeder_bib: (g, f, lo) => {
      DRAW.body.tunic(g, f, lo);
      const { P, R } = pen(g);
      R(13, 16, 6, 5, '#f4f0e8'); R(14, 21, 4, 1, '#f4f0e8'); R(18, 16, 1, 5, '#d6cfc2');
      P(12, 16, '#d6cfc2'); P(19, 16, '#d6cfc2');
      P(14, 18, '#c23c2a'); P(15, 19, '#e8553e'); P(17, 17, '#e8853e'); P(16, 20, '#c23c2a'); P(15, 17, '#e2b957');
    },
    farm_apron: (g, f, lo) => {
      DRAW.body.tunic(g, f, lo);
      const { P, R } = pen(g); const a = '#a07a4e', aD = '#7a5a36';
      R(13, 17, 6, 7, a); R(18, 17, 1, 7, aD); P(13, 16, aD); P(18, 16, aD); R(12, 21, 8, 1, '#5a3a22');
      R(14, 22, 4, 2, aD); P(15, 22, '#ffcf4a'); P(16, 22, C.gold); P(15, 23, C.goldD);
    },
    salve_robes: g => {
      const { P, R, D } = pen(g); const w = '#d8ecc8', wD = '#a8c498', tr = '#4f8a2e';
      R(12, 16, 8, 11, w); R(11, 23, 10, 4, w); R(19, 16, 1, 11, wD); R(20, 23, 1, 4, wD);
      R(10, 16, 2, 6, w); R(20, 16, 2, 6, wD); R(11, 26, 10, 1, tr); R(10, 21, 2, 1, tr); R(20, 21, 2, 1, tr); R(12, 21, 8, 1, tr);
      D([[16, 17], [15, 18], [16, 18], [17, 18], [14, 19], [15, 19], [16, 19]], '#5fa04a'); P(17, 17, '#8fd06a'); P(15, 20, '#3e7a28');
      D([[14, 24], [17, 25]], '#e8553e');
    },
    space_vest: (g, f, lo) => {
      DRAW.body.tunic(g, f, lo);
      const { P, R, D } = pen(g); const n = '#1e2a52', nD = '#141c38';
      R(12, 16, 3, 6, n); R(17, 16, 3, 6, nD); R(10, 16, 2, 2, n); R(20, 16, 2, 2, nD);
      D([[13, 17], [12, 19], [14, 20], [18, 18], [17, 20], [11, 16]], '#ffffff'); D([[13, 19], [18, 16]], '#a8d4f0');
      R(12, 21, 8, 1, '#141c38'); P(15, 21, '#a66be8'); P(16, 21, '#a66be8');
    },
    comeback_cuirass: g => {
      const { P, R, D } = pen(g); const b = '#a8743a', bL = '#d8a55e', bD = '#7a5228';
      R(12, 16, 8, 6, b); R(19, 16, 1, 6, bD); R(10, 16, 2, 6, b); R(20, 16, 2, 6, bD);
      R(9, 15, 4, 2, bL); R(19, 15, 4, 2, b); R(12, 16, 7, 1, bL);
      R(15, 17, 2, 1, '#ffcf4a'); R(14, 18, 4, 1, '#ffcf4a'); R(13, 19, 6, 1, '#ffcf4a'); R(15, 20, 2, 1, '#ffcf4a'); P(15, 17, '#fff1b8'); P(13, 17, bL);
      R(12, 21, 8, 1, bD); P(15, 21, C.gold); P(16, 21, C.gold);
    },
    pos1_silk: (g, f) => {
      const { P, R } = pen(g); const c = '#9a1f2a', cD = '#6a1420', cL = '#c8323e';
      R(12, 16, 8, 11, c); R(11, 23, 10, 4, c); R(19, 16, 1, 11, cD); R(20, 23, 1, 4, cD);
      R(10, 16, 2, 6, c); R(20, 16, 2, 6, cD); R(11, 26, 10, 1, C.gold); R(10, 21, 2, 1, C.gold); R(20, 21, 2, 1, C.gold);
      for (let i = 0; i < 6; i++) P(13 + i, 16 + i, C.gold);
      R(15, 16, 2, 1, C.goldL); P(14, 24, cL); P(17, 25, cL);
      const sh = [[13, 18], [17, 17], [18, 23], [12, 24]][f]; P(sh[0], sh[1], '#ff8a8a'); P(sh[0] + 1, sh[1], cL);
    },
  });

  Object.assign(DRAW.cape, {
    tango_wrap: g => {
      const { R, P } = pen(g); const l = '#3f7d2e', lD = '#2c5a20', lL = '#5fa04a';
      R(9, 17, 14, 10, l); R(9, 17, 1, 10, lD); R(22, 17, 1, 10, lD);
      for (let x = 9; x < 23; x++) { P(x, 27, x % 3 === 1 ? null : lL); if (x % 3 === 0) P(x, 28, lL); }
      for (let y = 18; y < 27; y++) P(15 + (y % 2), y, lD);
      P(12, 20, lL); P(19, 22, lL); P(9, 16, '#8a5e36'); P(22, 16, '#8a5e36');
    },
    scan_cloak: g => {
      const { R, P } = pen(g); const t = '#1f3d4a', tD = '#142a33';
      R(9, 17, 14, 12, t); R(9, 17, 1, 12, tD); R(22, 17, 1, 12, tD);
      for (let x = 9; x < 23; x++) { const d = Math.hypot(x - 15.5, 6); P(x, 23 + Math.round(Math.sqrt(Math.max(0, 49 - (x - 15.5) ** 2)) / 2), d < 9 ? '#6fe0f0' : '#3a8a9a'); }
      P(15, 22, '#e6fbff'); P(16, 22, '#6fe0f0'); P(12, 26, '#6fe0f0'); P(20, 27, '#3a8a9a');
      for (let x = 9; x < 23; x += 2) P(x, 29, t);
    },
    stomp_cape: g => {
      const { R, P, D } = pen(g); const s = '#4a3a30', sD = '#33281f';
      R(9, 17, 14, 11, s); R(9, 17, 1, 11, sD); R(22, 17, 1, 11, sD);
      for (let x = 9; x < 23; x++) P(x, 28, x % 4 === 0 ? null : sD);
      D([[16, 18], [15, 19], [14, 20], [15, 21], [16, 21], [17, 22], [16, 23], [15, 24], [16, 25]], '#ffcf4a');
      D([[17, 21], [14, 21]], '#e8853e'); P(9, 16, C.steel); P(22, 16, C.steel);
    },
    defender_mantle: (g, f) => {
      const { R, P, D } = pen(g); const w = '#e6e0d2', wD = '#b8b0a0';
      R(9, 17, 14, 12, w); R(9, 17, 1, 12, wD); R(22, 17, 1, 12, wD); R(9, 28, 14, 1, '#4f8a2e');
      for (let x = 10; x < 23; x += 2) P(x, 29, C.gold);
      R(9, 17, 14, 1, C.gold); P(9, 16, C.gold); P(22, 16, C.gold);
      // the league's own crystal, glowing
      const glow = ['#ffd9cc', '#fff1b8', '#d8ffb8', '#fff1b8'][f];
      D([[15, 20], [16, 20], [14, 21], [15, 21], [14, 22], [15, 22], [14, 23], [15, 23], [15, 24]], '#e8553e');
      D([[17, 21], [16, 21], [17, 22], [16, 22], [17, 23], [16, 23], [16, 24]], '#8fc84f');
      P(15, 19, glow); P(16, 19, glow); R(13, 25, 6, 1, '#6c747c');
      const sp = [[12, 20], [19, 19], [20, 24], [11, 24]][f]; P(sp[0], sp[1], glow);
    },
  });

  Object.assign(DRAW.weapon, {
    deny_dirk: g => {
      const { R, P } = pen(g);
      R(22, 22, 2, 2, '#3b2f2a'); R(21, 21, 4, 1, C.iron); P(21, 20, C.iron); P(24, 20, C.iron);
      R(22, 15, 2, 6, C.steelL); R(23, 15, 1, 6, C.steel); P(22, 14, C.steelL); P(22, 21, '#6fb7ff'); P(23, 21, '#a8d4f0');
    },
    harass_whip: g => {
      const { R, D } = pen(g);
      R(22, 20, 2, 4, C.leather); R(22, 19, 2, 1, C.gold);
      D([[23, 18], [24, 17], [25, 16], [26, 16], [27, 17], [28, 18], [28, 19], [27, 20], [26, 20]], '#8a5e36');
      D([[25, 19], [25, 18]], '#8a5e36'); D([[24, 19], [24, 20]], '#c23c2a');
    },
    cleave_axe: g => {
      const { R, P, D } = pen(g);
      R(23, 8, 1, 21, C.wood); P(23, 28, C.ironD);
      R(24, 8, 3, 7, C.steel); R(27, 9, 1, 5, C.steelL); R(24, 8, 3, 1, C.steelL); R(24, 14, 3, 1, C.steelD);
      D([[22, 9], [21, 10], [22, 11]], C.steelD); P(24, 11, C.red); P(25, 11, C.red);
    },
    farm_sickle: g => {
      const { R, P, D } = pen(g);
      R(23, 17, 1, 8, C.wood); R(22, 24, 3, 1, C.leather);
      D([[23, 16], [24, 15], [25, 14], [26, 13], [27, 13], [28, 14], [28, 15], [27, 16]], C.steelL);
      D([[24, 16], [25, 15], [26, 14]], C.steel); P(24, 20, C.gold); P(25, 21, '#ffcf4a');
    },
    wombo_maul: g => {
      const { R, P } = pen(g);
      R(23, 10, 1, 19, C.wood); R(23, 18, 1, 1, C.leather); R(23, 20, 1, 1, C.leather);
      R(20, 3, 8, 7, C.iron); R(21, 2, 6, 1, C.iron); R(21, 10, 6, 1, C.ironD);
      R(20, 3, 8, 1, '#4e555e'); R(20, 5, 8, 1, C.gold); R(20, 8, 8, 1, C.gold);
      R(22, 6, 3, 2, '#ff7a3d'); P(23, 6, '#ffcf4a'); P(28, 6, C.steelD);
    },
    crit_blade: (g, f) => {
      const { R, P, D } = pen(g);
      R(23, 3, 1, 17, C.steelL); R(22, 4, 1, 16, '#e6f4ff'); R(24, 4, 1, 16, '#c8323e'); P(23, 2, '#ffffff');
      R(20, 20, 7, 1, C.gold); P(20, 19, C.gold); P(26, 19, C.gold); R(23, 21, 1, 3, '#3b2f2a'); P(23, 24, C.red);
      P(23, 20, '#ff3b30');
      const sp = [[[20, 4], [26, 8]], [[21, 2], [26, 5]], [[26, 3], [20, 7]], [[25, 1], [21, 9]]][f];
      sp.forEach(([x, y], i) => { P(x, y, i ? '#ffcf4a' : '#ffffff'); });
    },
  });

  Object.assign(DRAW.pet, {
    creep_buddy: g => {
      const { R, P, D } = pen(g); const b = '#8a5e36', bD = '#5e3e22';
      R(2, 23, 5, 5, b); R(6, 23, 1, 5, bD); R(2, 22, 5, 1, C.steel); R(3, 21, 3, 1, C.steel); P(4, 20, C.red);
      D([[3, 24], [5, 24]], C.dark); P(4, 26, bD);
      R(2, 28, 2, 1, '#3b2f2a'); R(5, 28, 2, 1, '#3b2f2a');
      D([[7, 25], [8, 24], [8, 23], [9, 22]], C.wood); P(9, 21, C.wood);
    },
    sentry_eye: g => {
      const { P, R, D } = pen(g); const w = '#eef2f6', wD = '#c4ccd6';
      R(2, 19, 5, 5, w); R(3, 18, 3, 1, w); R(3, 24, 3, 1, wD); R(6, 19, 1, 5, wD); P(2, 19, null); P(6, 19, null);
      R(3, 20, 3, 3, '#4f95ea'); P(4, 21, '#141c38'); P(3, 20, '#ffffff');
      D([[0, 20], [1, 21], [0, 22]], '#a8d4f0'); D([[8, 20], [7, 21], [8, 22]], '#a8d4f0');
      R(3, 28, 3, 1, '#2a2d30');
    },
    rune_sprite: g => {
      const { P, D } = pen(g); const c = '#6fe0f0', cL = '#e6fbff';
      D([[4, 20], [3, 21], [4, 21], [5, 21], [2, 22], [3, 22], [4, 22], [5, 22], [6, 22], [3, 23], [4, 23], [5, 23], [4, 24]], c);
      P(4, 22, cL); P(4, 21, cL); D([[4, 18], [1, 22], [7, 22], [4, 26]], '#3a8a9a');
      D([[1, 19], [7, 19], [7, 25], [1, 25]], cL); P(4, 28, '#2a2d30'); P(3, 28, '#2a2d30'); P(5, 28, '#2a2d30');
    },
    one_trick_pony: g => {
      const { R, P, D } = pen(g); const w = '#efe8dc', wD = '#c8bca8', sp = '#8a5e36';
      R(2, 23, 7, 3, w); R(2, 26, 7, 1, wD); R(5, 23, 3, 2, sp);
      [2, 3, 7, 8].forEach(x => { R(x, 27, 1, 2, x % 2 ? wD : w); P(x, 29, '#3b2f2a'); });
      R(0, 19, 3, 4, w); P(0, 19, null); P(2, 18, w); P(1, 20, C.dark); P(0, 22, wD);
      D([[3, 18], [3, 19], [3, 20], [3, 21], [4, 20], [4, 21]], sp); D([[9, 23], [9, 24], [10, 25]], sp);
      P(6, 24, '#ffcf4a'); P(5, 23, '#ffcf4a'); P(7, 23, '#ffcf4a');
    },
    drop_mimic: (g, f) => {
      const { R, P, D } = pen(g); const wd = '#8a5e36', wdD = '#5e3e22';
      const open = [0, 1, 2, 1][f];
      R(1, 25, 8, 4, wd); R(1, 28, 8, 1, wdD); R(1, 26, 8, 1, C.gold); P(4, 27, C.goldL); P(5, 27, C.gold);
      const ly = 24 - open;
      R(1, ly - 1, 8, 2, wd); R(1, ly - 2, 8, 1, wdD); R(4, ly - 1, 2, 1, C.gold);
      if (open) {
        R(1, ly + 1, 8, open, '#2a0e0a');
        D([[2, ly + 1], [4, ly + 1], [6, ly + 1], [8, ly + 1]], '#ffffff'); D([[3, 24], [5, 24], [7, 24]], '#ffffff');
        if (open === 2) { P(3, ly + 2, '#ffcf4a'); P(6, ly + 2, '#ffcf4a'); P(9, 25, '#e8553e'); }
      }
      R(1, 29, 2, 1, '#3b2f2a'); R(7, 29, 2, 1, '#3b2f2a');
    },
  });


  // ---------- expansion 2: 27 more items ----------
  Object.assign(DRAW.head, {
    kill_cap: g => {               // red cap with a white kill tally
      const { R, P, D } = pen(g); const c = '#b63a2c', cD = '#8a2a1e';
      R(11, 4, 10, 4, c); R(12, 3, 8, 1, c); R(19, 4, 2, 4, cD); R(10, 7, 1, 1, c);
      R(11, 8, 13, 1, '#5a1a12'); P(23, 8, '#3a100a'); P(16, 2, cD);
      D([[13, 5], [13, 6], [15, 5], [15, 6], [17, 5], [17, 6]], '#f4f0e8'); D([[12, 5], [18, 6]], '#f4f0e8');
    },
    xp_visor: g => {               // headset with a glowing scouter lens over one eye
      const { R, P, D } = pen(g);
      R(11, 6, 10, 1, '#3a3f47'); P(10, 7, '#3a3f47'); R(21, 7, 1, 4, '#3a3f47'); R(21, 10, 1, 2, '#262a30');
      R(17, 10, 4, 3, '#6fe0f0'); R(17, 10, 4, 1, '#262a30'); P(20, 11, '#e6fbff'); P(17, 12, '#3a8a9a'); R(18, 13, 3, 1, '#262a30');
      D([[19, 11], [18, 11]], '#a8f0ff'); P(22, 9, '#e8553e');
    },
    signature_helm: g => {         // full knight helm with a star crest and a plume
      const { R, P, D } = pen(g); const m = '#7a6a9a', mL = '#a898c8', mD = '#54486e';
      R(10, 4, 12, 6, m); P(10, 4, null); P(21, 4, null); R(11, 3, 10, 1, m); R(11, 4, 10, 1, mL);
      R(10, 9, 1, 4, mD); R(21, 9, 1, 4, mD); R(10, 9, 12, 1, mD);
      D([[15, 5], [16, 5], [14, 6], [15, 6], [16, 6], [17, 6], [15, 7], [16, 7], [14, 8], [17, 8]], C.gold); P(15, 6, C.goldL);
      D([[17, 2], [18, 1], [19, 1], [20, 1], [21, 2], [22, 2], [23, 3], [23, 4]], '#c8323e'); D([[19, 2], [20, 2], [22, 3]], '#e8553e');
    },
    marathon_crown: (g, f) => {    // gold laurel wreath with little flapping wings
      const { R, P, D } = pen(g); const lf = '#5fa04a', lfD = '#3e7a28';
      R(11, 7, 10, 1, C.gold); R(11, 8, 10, 1, C.goldD);
      D([[11, 6], [13, 6], [15, 6], [17, 6], [19, 6]], lf); D([[12, 6], [14, 6], [16, 5], [18, 6], [20, 6]], lfD); P(16, 6, C.gold); P(15, 5, C.goldL);
      const up = f % 2 === 0;
      D(up ? [[9, 6], [8, 5], [7, 4], [9, 5]] : [[9, 7], [8, 7], [7, 7], [9, 6]], '#f4f0e8');
      D(up ? [[22, 6], [23, 5], [24, 4], [22, 5]] : [[22, 7], [23, 7], [24, 7], [22, 6]], '#f4f0e8');
      const sp = [[12, 4], [20, 3], [16, 3], [11, 3]][f]; P(sp[0], sp[1], '#ffffff');
    },
  });
  Object.assign(DRAW.body, {
    team_jersey: g => {            // blue sports jersey, number 5
      const { R, P, D } = pen(g); const j = '#2f5fb8', jD = '#204688', w = '#f4f0e8';
      R(12, 16, 8, 7, j); R(19, 16, 1, 7, jD); R(10, 16, 2, 6, j); R(20, 16, 2, 6, jD);
      R(10, 19, 2, 1, w); R(20, 19, 2, 1, w); R(14, 16, 4, 1, w); P(15, 17, w); P(16, 17, w);
      D([[14, 18], [15, 18], [16, 18], [14, 19], [14, 20], [15, 20], [16, 20], [16, 21], [14, 22], [15, 22], [16, 22]], w);
      R(12, 22, 8, 1, jD);
    },
    turbo_jumpsuit: g => {         // orange racing suit with black stripes and a bolt
      const { R, P, D } = pen(g); const o = '#e8742a', oD = '#b8561c', bk = '#2a1a14';
      R(12, 16, 8, 8, o); R(19, 16, 1, 8, oD); R(10, 16, 2, 6, o); R(20, 16, 2, 6, oD);
      R(10, 18, 2, 1, bk); R(20, 18, 2, 1, bk); R(16, 16, 1, 8, '#d6cfc2');
      D([[13, 17], [14, 18], [13, 19], [14, 20]], '#ffcf4a'); D([[18, 17], [18, 18]], bk); R(12, 21, 8, 1, bk); P(16, 21, C.steelL);
    },
    draft_armor: g => {            // teal plate with gold pauldrons and a draft scroll
      const { R, P, D } = pen(g); const t = '#2f6b6a', tD = '#1f4a4a', tL = '#4a8f8c';
      R(12, 16, 8, 6, t); R(19, 16, 1, 6, tD); R(10, 16, 2, 6, t); R(20, 16, 2, 6, tD); R(12, 16, 7, 1, tL);
      R(9, 15, 4, 2, C.gold); R(19, 15, 4, 2, C.goldD); P(9, 14, C.goldL); P(22, 14, C.gold);
      R(14, 17, 4, 4, '#ece6da'); R(14, 17, 4, 1, '#c4bcac'); R(14, 20, 4, 1, '#c4bcac'); D([[15, 18], [16, 18], [15, 19]], '#7a5232');
      R(12, 21, 8, 1, C.goldD); P(16, 21, C.gold);
    },
    million_plate: (g, f) => {     // black-and-gold heavy plate with a pulsing red core
      const { R, P, D } = pen(g); const b = '#24262c', bL = '#3a3e46';
      R(12, 16, 8, 6, b); R(10, 16, 2, 6, b); R(20, 16, 2, 6, '#1a1c20'); R(12, 16, 8, 1, bL);
      R(8, 14, 5, 3, C.gold); R(19, 14, 5, 3, C.goldD); D([[8, 13], [10, 12], [23, 13], [21, 12]], C.goldL); P(8, 16, C.goldD); P(23, 16, '#8a6a20');
      D([[13, 17], [18, 17], [13, 20], [18, 20]], C.gold); R(12, 21, 8, 1, C.gold);
      const core = ['#a3181a', '#e8302a', '#ff6a4a', '#e8302a'][f];
      R(15, 18, 2, 2, core); P(14, 18, '#a3181a'); P(17, 19, '#a3181a'); P(15, 17, '#a3181a'); P(16, 20, '#a3181a');
      if (f === 2) { P(15, 18, '#ffd9cc'); }
    },
  });
  Object.assign(DRAW.cape, {
    weekend_cape: g => {           // purple cape with a sunny diagonal stripe
      const { R, P } = pen(g); const v = '#5b3a9e', vD = '#3f2870';
      R(9, 17, 14, 12, v); R(9, 17, 1, 12, vD); R(22, 17, 1, 12, vD);
      for (let i = 0; i < 12; i++) { P(10 + i, 18 + i, '#ffcf4a'); P(11 + i, 18 + i, '#e2b957'); }
      for (let x = 9; x < 23; x += 2) P(x, 29, v); P(9, 16, C.gold); P(22, 16, C.gold);
    },
    duo_banner: g => {             // split red and blue banner with two stars and tassels
      const { R, P, D } = pen(g);
      R(9, 17, 7, 11, '#b63a2c'); R(16, 17, 7, 11, '#2f5fb8'); R(9, 17, 1, 11, '#8a2a1e'); R(22, 17, 1, 11, '#204688');
      R(9, 17, 14, 1, C.gold); D([[12, 21], [11, 22], [12, 22], [13, 22], [12, 23]], '#f4f0e8'); D([[19, 21], [18, 22], [19, 22], [20, 22], [19, 23]], '#f4f0e8');
      for (let x = 9; x < 23; x++) P(x, 28, x % 2 ? C.gold : null); D([[10, 29], [14, 29], [18, 29], [21, 29]], C.goldD);
      P(9, 16, C.gold); P(22, 16, C.gold);
    },
    farmer_mantle: g => {          // wheat-brown mantle sewn with gold coins
      const { R, P, D } = pen(g); const m = '#8a6a3a', mD = '#5e4626';
      R(9, 17, 14, 11, m); R(9, 17, 1, 11, mD); R(22, 17, 1, 11, mD); R(9, 17, 14, 2, '#a8844a');
      [[11, 21], [15, 20], [19, 22], [13, 25], [17, 25], [20, 26]].forEach(([x, y]) => { D([[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]], C.gold); P(x, y, C.goldL); });
      for (let x = 9; x < 23; x++) P(x, 28, x % 3 ? mD : C.gold); D([[10, 29], [13, 29], [16, 29], [19, 29], [22, 29]], C.gold);
    },
    perfect_week_cloak: (g, f) => { // deep blue royal cloak with seven twinkling stars (one per day)
      const { R, P } = pen(g); const n = '#1c2a6a', nD = '#121c48';
      R(9, 17, 14, 12, n); R(9, 17, 1, 12, nD); R(22, 17, 1, 12, nD); R(9, 17, 14, 1, C.gold); R(9, 28, 14, 1, C.gold);
      for (let x = 10; x < 23; x += 2) P(x, 29, C.goldD);
      [[10, 22], [12, 20], [14, 23], [16, 21], [18, 24], [20, 20], [21, 23]].forEach(([x, y], i) => P(x, y, (i + f) % 4 === 0 ? '#ffffff' : (i + f) % 2 ? C.goldL : '#a8c4ff'));
      P(9, 16, C.gold); P(22, 16, C.gold); P(16, 26, '#e8553e');
    },
  });
  Object.assign(DRAW.offhand, {
    tango_pouch: g => {            // little leather pouch with leaves poking out
      const { R, P, D } = pen(g); const l = '#8a5e36', lD = '#5e3e22';
      R(6, 21, 5, 4, l); R(7, 25, 3, 1, l); R(10, 21, 1, 4, lD); R(6, 21, 5, 1, lD); P(8, 22, C.gold);
      D([[7, 20], [7, 19], [6, 18], [9, 20], [9, 19], [10, 18], [8, 19]], '#5fa04a'); D([[6, 17], [10, 17], [8, 18]], '#8fd06a');
    },
    mana_charm: g => {             // blue crystal charm on a short chain
      const { P, D } = pen(g);
      D([[9, 19], [9, 20], [8, 21]], C.steel);
      D([[8, 22], [7, 23], [8, 23], [9, 23], [6, 24], [7, 24], [8, 24], [9, 24], [10, 24], [7, 25], [8, 25], [9, 25], [8, 26]], '#3d6ec9');
      D([[8, 23], [7, 24], [8, 24]], '#8fc0ff'); P(8, 24, '#e6f4ff'); D([[5, 23], [11, 25], [8, 28]], '#6fb7ff');
    },
    humility_urn: g => {           // small bronze urn with a teal glow
      const { R, P, D } = pen(g); const b = '#a8743a', bD = '#7a5228', bL = '#d8a55e';
      R(6, 21, 6, 5, b); R(7, 26, 4, 1, bD); R(7, 20, 4, 1, bD); R(7, 19, 4, 1, b); R(11, 21, 1, 5, bD); D([[7, 22], [7, 23]], bL);
      R(6, 23, 6, 1, bD); D([[5, 21], [5, 22], [12, 21], [12, 22]], bD);
      D([[8, 18], [9, 17], [10, 18], [9, 16]], '#6fe0d0'); P(9, 18, '#c8fff4');
    },
    glimmer_lantern: (g, f) => {   // hand lantern with a soft violet glow
      const { R, P, D } = pen(g);
      D([[8, 17], [9, 16], [10, 17]], C.iron); R(9, 17, 1, 2, C.iron);
      R(7, 19, 5, 6, C.iron); R(8, 20, 3, 4, ['#b48aff', '#c8a8ff', '#e6d8ff', '#c8a8ff'][f]); P(9, 21, '#ffffff'); R(7, 25, 5, 1, C.ironD);
      const sp = [[[5, 19], [13, 23]], [[5, 22], [13, 19]], [[6, 26], [12, 18]], [[13, 21], [5, 24]]][f];
      sp.forEach(([x, y]) => P(x, y, '#e6d8ff'));
    },
    aegis_buckler: (g, f) => {     // round gold buckler with a white wing and a glowing rim
      const { P, D } = pen(g);
      disc(P, 8.5, 21, 3.8, '#e2b957', '#b98c2f');
      D([[7, 20], [8, 19], [9, 19], [10, 20], [7, 21], [8, 21], [9, 20], [6, 22], [7, 22], [8, 22]], '#f4f0e8'); D([[6, 21], [10, 19]], '#ffffff');
      P(9, 22, '#c23c2a'); P(10, 22, '#e8553e');
      const g2 = [[5, 18], [12, 18], [12, 24], [5, 24]][f]; P(g2[0], g2[1], '#fff1b8'); P(8, 16 + (f % 2), '#ffffff');
    },
  });
  Object.assign(DRAW.boots, {
    morning_jog: (g, f, lo, feet) => boot(g, feet, { main: '#e8e4dc', sole: '#8e8981', toe: '#e8742a', shaft: 1, cuff: '#e8742a',
      extra: (P, { x, y }) => P(x + 1, y, '#e8742a') }),
    courier_slippers: (g, f, lo, feet) => boot(g, feet, { main: '#b63a2c', sole: '#6a1f14', toe: '#e8553e', shaft: 0,
      extra: (P, { x, y }, i) => { P(i === 0 ? x : x + 3, y - 1, '#f4f0e8'); P(x + 1, y + 1, '#8a2a1e'); } }),
    phase_steps: (g, f, lo, feet) => boot(g, feet, { main: '#2f9a92', sole: '#1c5e58', toe: '#9ff0e6', shaft: 2, cuff: '#9ff0e6',
      extra: (P, { x, y }, i) => { const h = i === 0 ? x + 4 : x - 1; P(h, y, '#5fc8bc'); P(h + (i === 0 ? 1 : -1), y + 1, '#3a8a82'); } }),
    deny_dancer: (g, f, lo, feet) => boot(g, feet, { main: '#5b3a9e', sole: '#2a1a3a', toe: '#c8a8ff', shaft: 2, cuff: '#e2b957',
      extra: (P, { x, y, lx }) => { P(lx + 1, y - 1, '#ffcf4a'); P(x + 2, y, '#7a4bb3'); } }),
    siege_treads: (g, f, lo, feet) => boot(g, feet, { main: '#3a3f47', sole: '#1c1f24', toe: '#d5dbe0', shaft: 3, cuff: '#c23c2a',
      extra: (P, { x, y, lx }, i) => {
        P(lx, y - 2, '#d5dbe0'); P(lx + 2, y - 2, '#d5dbe0'); P(x + 1, y + 1, '#596067'); P(x + 2, y + 1, '#596067');
        const sp = [[0, 2], [1, 3], [2, 2], [3, 3]][(f + i * 2) % 4]; P(x + sp[0], y + sp[1] - 1 + 1, '#ff7a3d');
      } }),
  });
  Object.assign(DRAW.pet, {
    lunch_lizard: g => {           // green lizard with its lunch bowl
      const { R, P, D } = pen(g); const l = '#5fa04a', lD = '#3e7a28', lL = '#8fd06a';
      R(1, 25, 6, 3, l); R(1, 27, 6, 1, lD); R(0, 24, 3, 2, l); P(0, 24, lL); P(1, 24, C.dark);
      D([[7, 26], [8, 26], [9, 25], [9, 24], [8, 23]], l); D([[2, 28], [5, 28]], lD); P(3, 25, lL); P(5, 25, lL);
      R(6, 22, 4, 2, '#f4f0e8'); R(6, 24, 4, 1, '#c4bcac'); D([[7, 21], [8, 21]], '#f4f0e8'); P(8, 21, '#c23c2a'); P(7, 22, '#e2b957');
    },
    tilt_kitten: g => {            // grumpy grey kitten with an anger mark
      const { R, P, D } = pen(g); const c = '#8d9196', cD = '#62666c';
      R(2, 24, 6, 4, c); R(2, 28, 2, 1, cD); R(6, 28, 2, 1, cD); R(7, 24, 1, 4, cD);
      R(1, 20, 6, 4, c); D([[1, 19], [6, 19]], c); D([[1, 20], [6, 20]], '#e88f7a');
      D([[2, 22], [3, 21], [5, 21], [6, 22]], C.dark); P(4, 23, '#e88f7a'); D([[3, 23], [5, 23]], cD);
      D([[8, 24], [9, 23], [9, 22], [10, 21]], c);
      D([[7, 17], [9, 17], [8, 16], [8, 18]], '#e8553e');
    },
    solo_sloth: g => {             // sleepy brown sloth with headphones
      const { R, P, D } = pen(g); const b = '#8a6a4a', bD = '#5e4626', f = '#d8c69a';
      R(1, 22, 7, 7, b); R(2, 21, 5, 1, b); R(7, 23, 1, 6, bD); R(1, 28, 7, 1, bD);
      R(2, 23, 5, 3, f); D([[2, 24], [3, 24]], bD); D([[5, 24], [6, 24]], bD); P(3, 24, C.dark); P(5, 24, C.dark); P(4, 25, bD);
      R(1, 20, 7, 1, '#2a2d30'); R(0, 21, 1, 3, '#2a2d30'); R(8, 21, 1, 3, '#2a2d30'); P(0, 22, '#e8553e'); P(8, 22, '#e8553e');
    },
    stack_parrot: (g, f) => {      // bright parrot flapping its wings
      const { R, P, D } = pen(g); const r = '#d6402c', y = '#ffcf4a', bl = '#3d6ec9';
      R(2, 21, 4, 6, r); R(3, 20, 3, 1, r); P(2, 21, '#e8553e'); P(3, 21, '#ffffff'); P(3, 22, C.dark);
      D([[1, 22], [0, 23], [1, 23]], '#f4f0e8'); P(0, 24, C.dark);
      const up = f % 2 === 0;
      if (up) D([[6, 21], [7, 20], [8, 19], [6, 22], [7, 21], [8, 20]], bl); else D([[6, 23], [7, 23], [8, 24], [6, 24], [7, 24], [8, 25]], bl);
      R(5, 23, 1, 3, y); D([[4, 27], [5, 28], [3, 28], [4, 29]], bl); D([[3, 27], [5, 27]], y);
      R(2, 28, 1, 1, '#3b2f2a'); R(4, 28, 1, 1, '#3b2f2a');
    },
    pool_hydra: (g, f) => {        // little three-headed teal serpent, heads bobbing
      const { R, P, D } = pen(g); const t = '#2f9a92', tD = '#1c5e58', tL = '#6fe0d0';
      R(1, 25, 9, 4, t); R(1, 28, 9, 1, tD); R(2, 24, 7, 1, t); D([[3, 26], [6, 26], [8, 27]], tL); D([[10, 27], [11, 28]], t);
      const bob = [[0, 1, 0], [1, 0, 1], [0, 0, 1], [1, 1, 0]][f];
      [[2, 19], [5, 16], [8, 19]].forEach(([nx, top], i) => {
        const y0 = top + bob[i];
        for (let y = y0 + 3; y < 25; y++) P(nx + ((y + i) % 3 === 0 ? 1 : 0), y, y % 2 ? t : tD);
        R(nx - 1, y0, 3, 3, t); P(nx - 2, y0 + 1, t); P(nx - 2, y0 + 2, tD); P(nx + 1, y0 + 2, tD);
        P(nx, y0, '#ffcf4a'); P(nx - 1, y0, tL); P(nx - 3, y0 + 2, '#e8553e');
      });
    },
  });

  // ---------- expansion 2b: items from parsed games ----------
  Object.assign(DRAW.head, {
    team_wipe_crown: (g, f) => {   // dark iron crown; its five red gems light up one by one
      const { R, P, D } = pen(g);
      R(11, 6, 10, 2, '#2a2d33'); R(11, 7, 10, 1, '#1c1e22'); R(11, 5, 10, 1, '#3a3e46');
      D([[11, 4], [11, 3], [13, 4], [15, 4], [15, 3], [15, 2], [16, 2], [16, 3], [16, 4], [18, 4], [20, 4], [20, 3]], '#3a3e46');
      [[12, 6], [14, 6], [16, 5], [18, 6], [20, 6]].forEach(([x, y], i) => P(x, y, i <= f + 1 ? (i === f + 1 ? '#ff6a4a' : '#e8302a') : '#5a0f0a'));
      P(15, 1, f === 3 ? '#ffffff' : '#ffd9cc');
    },
  });
  Object.assign(DRAW.body, {
    punching_bag_plate: g => {     // dented, patched-up leather plate
      const { R, P, D } = pen(g); const l = '#7a5232', lD = '#54381f';
      R(12, 16, 8, 7, l); R(19, 16, 1, 7, lD); R(10, 16, 2, 6, l); R(20, 16, 2, 6, lD);
      R(13, 17, 3, 3, '#9aa3ab'); R(13, 17, 3, 1, '#d5dbe0'); P(14, 18, '#6c747c');
      D([[17, 18], [18, 19], [17, 20], [18, 21]], '#e8e4dc'); D([[16, 19], [19, 20]], '#c4bcac');
      D([[12, 21], [13, 21], [14, 21], [15, 21], [16, 21], [17, 21], [18, 21], [19, 21]], '#3e2814'); P(11, 18, '#e8e4dc'); P(20, 17, '#e8553e');
    },
    unkillable_carapace: (g, f) => { // dark green beetle shell with gold edges and a breathing core
      const { R, P, D } = pen(g); const c = '#1f3a24', cL = '#2f5a34', cD = '#142618';
      R(12, 16, 8, 7, c); R(10, 16, 2, 6, c); R(20, 16, 2, 6, cD); R(15, 16, 2, 7, cD);
      R(8, 14, 5, 3, cL); R(19, 14, 5, 3, c); D([[8, 14], [9, 13], [23, 14], [22, 13]], C.gold);
      D([[12, 16], [13, 17], [19, 16], [18, 17]], C.gold); R(12, 22, 8, 1, C.goldD);
      const core = ['#5fa04a', '#8fd06a', '#c8ffa8', '#8fd06a'][f]; D([[13, 19], [14, 20], [18, 19], [17, 20]], core);
    },
  });
  Object.assign(DRAW.cape, {
    arcane_mantle: g => {          // violet cape with an arcane sigil
      const { R, P, D } = pen(g); const v = '#4a2a7a', vD = '#321c54';
      R(9, 17, 14, 12, v); R(9, 17, 1, 12, vD); R(22, 17, 1, 12, vD);
      D([[15, 20], [16, 20], [14, 21], [17, 21], [13, 22], [18, 22], [13, 23], [18, 23], [14, 24], [17, 24], [15, 25], [16, 25]], '#c8a8ff');
      D([[15, 22], [16, 23], [16, 22], [15, 23]], '#e6d8ff'); for (let x = 9; x < 23; x += 2) P(x, 29, v); P(9, 16, '#c8a8ff'); P(22, 16, '#c8a8ff');
    },
    multikill_mantle: g => {       // crimson cape with four white slashes
      const { R, P } = pen(g); const r = '#8a1f1a', rD = '#5e1410';
      R(9, 17, 14, 12, r); R(9, 17, 1, 12, rD); R(22, 17, 1, 12, rD); R(9, 17, 14, 1, '#2a1a14');
      [11, 14, 17, 20].forEach(x => { for (let k = 0; k < 6; k++) P(x + (k > 2 ? 1 : 0), 20 + k, k === 0 ? '#ffffff' : '#e8e4dc'); });
      for (let x = 9; x < 23; x++) P(x, 29, x % 2 ? r : null); P(9, 16, C.iron); P(22, 16, C.iron);
    },
  });
  Object.assign(DRAW.offhand, {
    ward_satchel: g => {           // satchel with a yellow ward-eye poking out
      const { R, P, D } = pen(g); const l = '#5e3e22', lL = '#8a5e36';
      R(5, 21, 7, 5, lL); R(5, 21, 7, 1, l); R(11, 21, 1, 5, l); R(5, 25, 7, 1, l); P(8, 23, C.gold);
      R(7, 16, 1, 5, C.wood); R(6, 14, 3, 3, '#ffcf4a'); P(7, 15, '#2a1a14'); P(6, 14, '#fff1b8');
      R(9, 18, 1, 3, C.wood); R(9, 17, 2, 2, '#6fb7ff'); P(10, 17, '#e6f4ff');
    },
    bounty_purse: (g, f) => {      // fat gold purse with a coin popping out
      const { R, P, D } = pen(g); const p = '#b98c2f', pL = '#e2b957';
      R(6, 21, 6, 5, p); R(5, 22, 8, 3, p); R(7, 20, 4, 1, '#8a6a20'); D([[6, 21], [7, 22]], pL); P(9, 23, '#fff1b8');
      R(8, 19, 2, 1, '#c23c2a');
      const cy = 18 - [0, 1, 2, 1][f]; R(8, cy - 1, 2, 2, '#ffcf4a'); P(8, cy - 1, '#fff1b8');
    },
  });
  Object.assign(DRAW.boots, {
    dewarder_boots: (g, f, lo, feet) => boot(g, feet, { main: '#2a3a5a', sole: '#141c2e', toe: '#a8d4f0', shaft: 2, cuff: '#e2b957',
      extra: (P, { x, y, lx }) => { P(lx + 1, y - 1, '#6fb7ff'); P(x + 2, y, '#3d4e78'); } }),
    water_waders: (g, f, lo, feet) => boot(g, feet, { main: '#2f6fb8', sole: '#1c3f6a', toe: '#8fc0ff', shaft: 3, cuff: '#8fc0ff',
      extra: (P, { x, y, lx }, i) => { P(lx + 1, y - 2, '#e6f4ff'); P(i === 0 ? x - 1 : x + 4, y + 1, '#6fb7ff'); } }),
  });
  Object.assign(DRAW.pet, {
    sentry_owl: g => {             // round blue owl with big sentry eyes
      const { R, P, D } = pen(g); const o = '#3d5a8a', oL = '#6f8fc0', oD = '#2a3e60';
      R(2, 21, 6, 7, o); R(3, 20, 4, 1, o); D([[2, 20], [7, 20], [1, 19], [8, 19]], oD); R(7, 22, 1, 6, oD);
      R(2, 22, 3, 3, '#e6f4ff'); R(5, 22, 3, 3, '#e6f4ff'); P(3, 23, '#2a6fd1'); P(6, 23, '#2a6fd1'); P(3, 22, '#ffffff');
      P(4, 25, '#e2b957'); P(5, 25, '#e2b957'); R(3, 26, 4, 1, oL); D([[3, 28], [6, 28]], '#e2b957');
    },
    bottle_crab: g => {            // little red crab hauling a glowing rune bottle
      const { R, P, D } = pen(g); const c = '#c8432d', cD = '#8a2a1e';
      R(1, 26, 7, 3, c); R(2, 25, 5, 1, c); R(1, 28, 7, 1, cD); D([[2, 24], [5, 24]], '#f4f0e8'); D([[2, 23], [5, 23]], C.dark);
      D([[0, 29], [2, 29], [5, 29], [7, 29]], cD); D([[0, 25], [0, 24], [8, 25], [8, 24], [9, 23]], c);
      R(8, 19, 3, 5, '#a8d4f0'); R(9, 18, 1, 1, '#a8d4f0'); P(9, 17, '#8a5e36'); R(8, 21, 3, 3, '#6fe0f0'); P(9, 22, '#ffffff');
    },
  });
  Object.assign(DRAW.aura, {
    fountain_glow: (g, f) => {
      ring(g, ['#2a6f8a', '#5fc8e8', '#e6fbff'], f, false);
      const { D } = pen(g); D([[3, 26], [4, 27], [28, 25], [27, 26], [15, 0], [16, 1]], '#a8ecff');
    },
    bronze_aura: (g, f) => ring(g, ['#7a4a22', '#c8834a', '#ffd9b0'], f, false),
    runner_up_aura: (g, f) => { ring(g, ['#6c747c', '#c8d0d6', '#ffffff'], f, false); const { D } = pen(g); D([[15, 0], [16, 0], [15, 1]], '#ffffff'); },
    smoke_aura: (g, f) => {
      ring(g, ['#3a2f4a', '#6b5a8a', '#c8b8f0'], f, false);
      const { R } = pen(g); [[1, 24], [26, 26], [3, 8], [27, 10]].forEach(([x, y]) => { R(x, y, 3, 2, '#6b5a8a'); R(x + 1, y - 1, 2, 1, '#8a7aa8'); });
    },
    shrine_aura: (g, f) => {
      ring(g, ['#2f6b2a', '#8fd06a', '#f4ffd8'], f, false);
      const { D } = pen(g); [[3, 5], [27, 7], [2, 21], [28, 23]].forEach(([x, y]) => D([[x, y], [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]], '#c8f5a0'));
    },
    rampage_aura: (g, f) => {
      ring(g, ['#5a130d', '#34363d', '#ff5a3d'], f, true);   // dark ember: smoky black ring, deep red outer edge, red sparks
      const { P } = pen(g);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + f * 0.16, r = 15 + ((i + f) % 2) * 1.5;
        P(Math.round(15.5 + Math.cos(a) * r), Math.round(17 + Math.sin(a) * r), i % 2 ? '#ffcf4a' : '#ff5a3d');
      }
    },
    mega_creeps_aura: (g, f) => {
      ring(g, ['#3a1f6a', '#7a4bb3', '#ffcf4a'], f, true);
      const { P } = pen(g); [[2, 4], [29, 5], [1, 28], [30, 27]].forEach(([x, y], i) => { if ((i + f) % 2 === 0) { P(x, y, '#ffcf4a'); P(x + 1, y, '#e2b957'); } });
    },
  });

  function ring(g, pal, f, rotate) {
    const { P } = pen(g);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const d = Math.hypot(x - 15.5, y - 17);
      const phase = rotate ? f : 0;
      if (d > 11 && d < 15.5 && (x + y + phase) % 2 === 0) P(x, y, pal[d > 14 ? 0 : 1]);
      else if (d >= 15.5 && d < 16.5 && (x * 7 + y * 13 + phase * 3) % 5 === 0) P(x, y, pal[0]);
    }
    const sparks = [[4, 6], [27, 8], [6, 2], [25, 3], [29, 14], [2, 13]];
    sparks.forEach(([x, y], i) => { if (!rotate || (i + f) % 2 === 0) P(x, y, pal[2]); });
  }

  function outline(g, color = '#160d0a') {
    const og = g.map(r => r.slice());
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (g[y][x]) continue;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const yy = y + dy, xx = x + dx; return yy >= 0 && yy < SIZE && xx >= 0 && xx < SIZE && g[yy][xx]; });
      if (n) og[y][x] = color;
    }
    return og;
  }

  // ---------- poses ----------
  // Every avatar is built from separate parts (cape, legs, torso, arms, head, hair, weapon, pet)
  // moved independently each tick (about 150ms), plus effects: afterimages, slash trails, dust,
  // a hit flash, a side-on turn and lying down. Idle and every taunt are frame-by-frame sequences.
  const IDLE_LEN = 16;
  const POSE0 = { lift: 0, body: 0, legs: 0, legsMode: 'stand', shiftX: 0, headX: 0, headY: 0, armL: 'down', armR: 'down',
    cape: 0, hair: 0, blink: false, wink: false, pet: 0, flip: false, squeeze: false, rot: false, flash: false,
    ghosts: null, slash: null, dust: null, sparkle: null, stars: null, burst: null };
  const P_ = o => ({ ...POSE0, ...o });

  const TAUNT_SEQ = {
    // jump: anticipation crouch, launch, tucked apex with fist pump, fall, squash landing
    hop: [
      {}, { body: 1, legsMode: 'split', armL: 'mid', armR: 'mid' }, { body: 2, legsMode: 'split', dust: 'both' },
      { lift: -4, armL: 'up', armR: 'mid', hair: 1, cape: 1 }, { lift: -6, legsMode: 'tuck', armL: 'up', armR: 'mid', sparkle: 'fist', hair: 1 },
      { lift: -6, legsMode: 'tuck', armL: 'up', armR: 'mid', sparkle: 'fist2' }, { lift: -3, armL: 'mid', armR: 'mid', hair: -1, cape: -1 },
      { body: 2, legsMode: 'split', dust: 'both', armL: 'mid', armR: 'mid' }, { body: 1 }, {},
    ],
    // look back over the shoulder and wave
    spin: [
      {}, { squeeze: true, hair: -1, cape: 1 }, { flip: true, armL: 'mid' }, { flip: true, armL: 'up', wink: true },
      { flip: true, armL: 'mid', wink: true }, { flip: true, armL: 'up', wink: true, sparkle: 'fist' }, { flip: true, armL: 'mid' },
      { squeeze: true, hair: 1, cape: -1 }, { body: 1 }, {},
    ],
    // three-hit combo: overhead slash, lunging thrust, jumping uppercut
    combo: [
      {}, { armR: 'up', shiftX: -1, body: 1 }, { armR: 'mid', shiftX: 1, slash: 'over', legsMode: 'split' },
      { armR: 'down', shiftX: 1, slash: 'over2', legsMode: 'split' }, { armR: 'mid', shiftX: 0 },
      { armR: 'mid', shiftX: 2, slash: 'side', legsMode: 'runA', dust: 'L' }, { armR: 'mid', shiftX: 2, slash: 'side2', legsMode: 'runA' },
      { armR: 'down', body: 2, legsMode: 'split' }, { armR: 'up', lift: -3, shiftX: 1, slash: 'up', legsMode: 'tuck' },
      { armR: 'up', lift: -2, shiftX: 1, slash: 'up2', sparkle: 'fist' }, { body: 2, legsMode: 'split', dust: 'both' }, {},
    ],
    // dash forward leaving afterimages, show off, dash back
    dash: [
      {}, { shiftX: -1, body: 1, legsMode: 'split' }, { shiftX: 2, ghosts: [-3, -6], legsMode: 'runA', dust: 'L', hair: -1, cape: -1 },
      { shiftX: 3, ghosts: [-3, -6, -9], legsMode: 'runB', hair: -1, cape: -1 }, { shiftX: 3, ghosts: [-3], legsMode: 'split', dust: 'R' },
      { shiftX: 3, armL: 'up', wink: true }, { shiftX: 3, armL: 'up', wink: true, sparkle: 'fist' },
      { shiftX: 1, ghosts: [3, 6], legsMode: 'runB', hair: 1, cape: 1 }, { shiftX: 0, ghosts: [3], legsMode: 'runA', dust: 'R' }, {},
    ],
    // run in place: striding legs, pumping arms, dust
    run: [
      { legsMode: 'runA', armL: 'down', armR: 'mid', body: 0, cape: -1, hair: -1, dust: 'R' }, { legsMode: 'stand', body: 1, cape: -1 },
      { legsMode: 'runB', armL: 'mid', armR: 'down', body: 0, cape: -1, hair: -1, dust: 'L' }, { legsMode: 'stand', body: 1, cape: -1 },
      { legsMode: 'runA', armL: 'down', armR: 'mid', body: 0, cape: -1, hair: -1, dust: 'R' }, { legsMode: 'stand', body: 1, cape: -1 },
      { legsMode: 'runB', armL: 'mid', armR: 'down', body: 0, cape: -1, hair: -1, dust: 'L' }, { legsMode: 'stand', body: 1, cape: -1 },
    ],
    // get hit, keel over, see stars, pop back up with a wink
    buyback: [
      {}, { flash: true, shiftX: -1, blink: true }, { shiftX: -2, body: 1, armL: 'mid', armR: 'mid', blink: true },
      { shiftX: -2, body: 3, legsMode: 'split', blink: true }, { rot: true, dust: 'both', blink: true },
      { rot: true, blink: true, stars: 0 }, { rot: true, blink: true, stars: 1 }, { rot: true, blink: true, stars: 2 },
      { rot: true, blink: true, stars: 0 }, { lift: -4, armL: 'up', armR: 'mid', sparkle: 'fist', legsMode: 'tuck' },
      { lift: -1, armL: 'up', wink: true }, { wink: true, body: 1, legsMode: 'split', dust: 'both' }, { wink: true, armL: 'mid' },
      { wink: true }, {}, {},
    ],
    // fists up, head shaking
    shake: [
      { headX: -1, armL: 'mid', armR: 'mid', blink: true }, { headX: 1, armL: 'mid', armR: 'mid', body: 1, blink: true },
      { headX: -1, armL: 'mid', armR: 'mid', blink: true }, { headX: 1, armL: 'mid', armR: 'mid', body: 1, blink: true },
      { armL: 'mid', armR: 'mid' }, {}, { body: 1 }, {},
    ],
    // wind up, punch skyward, firework bursts out of the fist, sparks rain down
    flex: [
      { body: 1, legsMode: 'split', armL: 'mid' }, { body: 2, legsMode: 'split', armL: 'mid', armR: 'mid' },
      { armL: 'up', armR: 'mid', headY: -1, sparkle: 'fist' },
      { armL: 'up', armR: 'mid', headY: -1, burst: 0 }, { armL: 'up', armR: 'mid', headY: -1, burst: 1 },
      { armL: 'up', armR: 'mid', headY: -1, burst: 2, wink: true }, { armL: 'up', armR: 'mid', headY: -1, burst: 3, wink: true },
      { armL: 'up', armR: 'mid', burst: 4, wink: true }, { armL: 'mid', armR: 'mid', burst: 5 }, { body: 1, armL: 'mid', burst: 6 },
      { body: 1 }, {},
    ],
  };
  // battle poses (used by the replay arena, not offered as taunts)
  Object.assign(TAUNT_SEQ, {
    b_attack: [{ armR: 'up', shiftX: -1, body: 1 }, { armR: 'mid', shiftX: 2, slash: 'side', legsMode: 'runA' }, { armR: 'mid', shiftX: 2, slash: 'side2', legsMode: 'runA' }, { armR: 'down', shiftX: 1 }],
    b_shoot: [{ armR: 'mid', armL: 'mid', body: 1 }, { armR: 'mid', armL: 'mid', shiftX: -1, sparkle: 'fist' }, { armR: 'mid', shiftX: -1 }, {}],
    b_cast: [{ armL: 'up', armR: 'up', headY: -1, sparkle: 'fist' }, { armL: 'up', armR: 'up', headY: -1, sparkle: 'fist2', lift: -1 }, { armL: 'up', armR: 'mid', sparkle: 'fist' }, { armL: 'mid' }],
    b_hurt: [{ flash: true, shiftX: -2, blink: true }, { shiftX: -1, blink: true, body: 1 }, { blink: true }, {}],
    b_ko: [{ rot: true, blink: true }],
    b_win: [{ armL: 'up', armR: 'mid', wink: true, sparkle: 'fist' }, { armL: 'up', armR: 'mid', lift: -2, wink: true, sparkle: 'fist2' }, { armL: 'up', armR: 'mid', wink: true }, { armL: 'mid', body: 1 }],
  });
  const animLength = anim => (TAUNT_SEQ[anim] ? TAUNT_SEQ[anim].length : IDLE_LEN);

  function pose(anim, tick) {
    const seq = TAUNT_SEQ[anim];
    if (seq) return P_(seq[tick % seq.length]);
    const i = tick % IDLE_LEN;
    return P_({ body: [0, 0, 0, 0, 1, 1, 1, 1][i % 8], cape: [0, 0, 1, 1, 0, 0, -1, -1][i % 8], hair: [0, 0, 0, 1, 1, 0, 0, 0][i % 8],
      blink: i === 13, pet: [0, -1, -1, 0, 0, 0, 0, 0][(i + 3) % 8] });
  }

  // where each hand sits for an arm pose, relative to its resting spot
  const HAND_OFFSET = { down: [0, 0], mid: [2, -2], up: [2, -11] };
  const mix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };

  function drawLegs(t, mode) {
    const { R } = pen(t); const pants = '#3b2f2a';
    if (mode === 'split') { R(11, 24, 3, 3, pants); R(18, 24, 3, 3, pants); R(10, 27, 4, 2, C.leather); R(18, 27, 4, 2, C.leather); }
    else if (mode === 'tuck') { R(12, 23, 3, 2, pants); R(17, 23, 3, 2, pants); R(12, 25, 4, 2, C.leather); R(16, 25, 4, 2, C.leather); }
    else if (mode === 'runA') { R(11, 23, 3, 3, pants); R(9, 25, 4, 2, C.leather); R(17, 23, 3, 4, pants); R(18, 27, 4, 2, C.leather); }
    else if (mode === 'runB') { R(12, 23, 3, 4, pants); R(10, 27, 4, 2, C.leather); R(18, 23, 3, 3, pants); R(19, 25, 4, 2, C.leather); }
    else { R(12, 23, 3, 4, pants); R(17, 23, 3, 4, pants); R(11, 27, 4, 2, C.leather); R(17, 27, 4, 2, C.leather); }
  }

  const SLASH = {
    over: [[[21, 3], [23, 3], [25, 4], [27, 5], [28, 7], [29, 9], [29, 11], [29, 13], [28, 15]], [[22, 4], [24, 4], [26, 5], [27, 7], [28, 9], [28, 11], [28, 13]]],
    over2: [[[27, 5], [28, 7], [29, 9], [29, 11]], []],
    side: [[[23, 18], [24, 18], [25, 18], [26, 18], [27, 18], [28, 18], [29, 18], [30, 18], [31, 18]], [[25, 17], [26, 17], [27, 17], [28, 17], [29, 17], [26, 19], [27, 19], [28, 19]]],
    side2: [[[28, 18], [29, 18], [30, 18], [31, 18]], []],
    up: [[[23, 27], [25, 25], [26, 23], [27, 20], [28, 17], [28, 14], [27, 11], [26, 9], [25, 7]], [[24, 26], [25, 24], [26, 21], [27, 18], [27, 15], [26, 12], [25, 10]]],
    up2: [[[27, 11], [26, 9], [25, 7]], []],
  };

  // facing: turn the head three-quarters to the right (the battle arena mirrors the right-hand team)
  function drawSprite(lo, tick = 0, anim = 'idle', facing = false) {
    const f = (tick >> 1) & 3;                       // frame for animated gear (sparkles, flames)
    const ps = pose(anim, tick);
    const bg = grid();
    const L = { cape: grid(), legs: grid(), body: grid(), arms: grid(), hair: grid(), head: grid(), weapon: grid(), off: grid(), pet: grid() };
    const item = (slot, t) => { const fn = DRAW[slot] && DRAW[slot][lo[slot]]; if (fn) fn(t, f, lo); };
    const skin = SKINS[lo.skin], skinD = shade(skin, 0.8);
    const hairC = HAIR_COLORS[lo.hairColor], hairD = shade(hairC, 0.72);

    item('aura', bg);
    item('cape', L.cape);
    drawLegs(L.legs, ps.legsMode);
    if (DRAW.boots[lo.boots]) DRAW.boots[lo.boots](L.legs, f, lo, FEET[ps.legsMode] || FEET.stand);

    // torso with its outfit; arms are re-posed below
    DRAW.body.tunic(L.body, f, lo);
    if (lo.body !== 'tunic') item('body', L.body);
    {
      const { P, R } = pen(L.body);
      const A2 = pen(L.arms);                          // raised arms sit in front of the head
      const sleeveL = L.body[18][10] || TUNICS[lo.tunic], sleeveR = L.body[18][21] || shade(TUNICS[lo.tunic], 0.72);
      const armPose = (side, mode) => {
        const left = side === 'L', x0 = left ? 10 : 20, sleeve = left ? sleeveL : sleeveR;
        if (mode === 'down') { R(x0, 22, 2, 1, skin); return; }
        for (let y = 17; y <= 22; y++) { P(x0, y, null); P(x0 + 1, y, null); }
        if (mode === 'mid') {
          if (left) { A2.R(10, 16, 2, 2, sleeve); A2.R(8, 18, 3, 1, sleeve); A2.R(8, 19, 2, 2, skin); }
          else { A2.R(20, 16, 2, 2, sleeve); A2.R(21, 18, 3, 1, sleeve); A2.R(22, 19, 2, 2, skin); }
        } else {
          if (left) { A2.R(10, 15, 2, 2, sleeve); A2.R(9, 13, 2, 2, sleeve); A2.R(8, 12, 2, 1, sleeve); A2.R(8, 10, 2, 2, skin); }
          else { A2.R(20, 15, 2, 2, sleeve); A2.R(21, 13, 2, 2, sleeve); A2.R(22, 12, 2, 1, sleeve); A2.R(22, 10, 2, 2, skin); }
        }
      };
      armPose('L', ps.armL); armPose('R', ps.armR);
    }

    // head, face, hair, headgear
    {
      const { P, R } = pen(L.head);
      R(11, 6, 10, 10, skin); R(11, 15, 10, 1, skinD);
      if (facing) R(11, 6, 1, 10, skinD); else R(20, 6, 1, 10, skinD);   // shading on the side turned away
      [[11, 6], [20, 6], [11, 15], [20, 15]].forEach(([x, y]) => P(x, y, null));
      const eL = facing ? 15 : 13, eR = facing ? 19 : 18;               // eyes slide toward the facing side
      if (ps.blink) { P(eL, 12, C.dark); P(eR, 12, C.dark); }
      else if (ps.wink) { R(eL, 11, 1, 2, C.dark); P(eR - 1, 12, C.dark); P(eR, 12, C.dark); }
      else { R(eL, 11, 1, 2, C.dark); R(eR, 11, 1, 2, C.dark); }
      if (facing) { P(20, 13, skinD); R(17, 14, 2, 1, skinD); R(10, 11, 1, 2, skin); P(10, 12, skinD); } else R(15, 14, 2, 1, skinD);   // facing: nose, mouth and the far ear
      if (!['tower_helm', 'rampage_helm', 'night_owl_hood', 'unbroken_helm', 'last_pick_hood', 'signature_helm'].includes(lo.head)) {
        const h = pen(L.hair);                         // behind the head: long hair, tails
        if (lo.hair === 'mohawk') { R(15, 2, 2, 6, hairC); P(16, 2, hairD); R(11, 7, 1, 2, hairD); R(20, 7, 1, 2, hairD); }
        else if (lo.hair === 'shaved') { R(12, 6, 8, 1, shade(skin, 0.86)); P(11, 7, shade(skin, 0.86)); P(20, 7, shade(skin, 0.86)); }
        else if (lo.hair === 'afro') {
          R(11, 2, 10, 6, hairC); R(10, 3, 1, 7, hairC); R(21, 3, 1, 7, hairD); R(9, 4, 1, 5, hairC); R(22, 4, 1, 5, hairD);
          R(12, 1, 8, 1, hairC); [[13, 3], [16, 2], [18, 4], [11, 5], [20, 6], [14, 6], [9, 6], [17, 6]].forEach(([x, y]) => P(x, y, hairD));
          R(11, 8, 1, 2, hairC); R(20, 8, 1, 2, hairD);
        }
        else {
          R(11, 5, 10, 3, hairC); R(19, 5, 2, 3, hairD); P(11, 5, null); P(20, 5, null);
          R(11, 8, 1, 2, hairC); R(20, 8, 1, 2, hairD); R(12, 8, 3, 1, hairC); R(17, 8, 2, 1, hairC);
          if (lo.hair === 'spiky') [[12, 4], [13, 3], [15, 4], [16, 3], [18, 4], [19, 3]].forEach(([x, y]) => P(x, y, hairC));
          if (lo.hair === 'long') {
            R(10, 7, 2, 5, hairC); R(20, 7, 2, 5, hairD);
            h.R(10, 12, 2, 6, hairC); h.R(20, 12, 2, 6, hairD);
          }
          if (lo.hair === 'bob') { R(10, 6, 2, 6, hairC); R(20, 6, 2, 6, hairD); R(9, 9, 1, 4, hairC); R(22, 9, 1, 4, hairD); R(10, 12, 2, 1, hairC); R(20, 12, 2, 1, hairD); R(12, 8, 7, 1, hairC); P(19, 8, hairD); }
          if (lo.hair === 'ponytail') { R(21, 5, 1, 3, hairD); P(22, 6, '#c23c2a'); P(22, 7, '#c23c2a'); h.R(22, 5, 2, 2, hairC); h.R(23, 7, 2, 7, hairC); h.R(24, 8, 1, 6, hairD); h.R(23, 14, 1, 2, hairD); }
          if (lo.hair === 'twintails') {
            R(9, 6, 2, 2, '#c23c2a'); R(21, 6, 2, 2, '#c23c2a');
            h.R(8, 8, 2, 8, hairC); h.R(22, 8, 2, 8, hairD); h.P(8, 16, hairD); h.P(23, 16, hairD); h.R(9, 7, 2, 2, hairC); h.R(21, 7, 2, 2, hairD);
          }
          if (lo.hair === 'buns') { R(10, 2, 3, 3, hairC); R(19, 2, 3, 3, hairD); P(10, 2, null); P(21, 2, null); P(12, 4, hairD); P(19, 4, hairD); }
          if (lo.hair === 'topknot') { R(14, 1, 4, 3, hairC); P(14, 1, null); P(17, 1, null); R(15, 4, 2, 1, '#c23c2a'); P(17, 3, hairD); }
          if (lo.hair === 'swept') { R(12, 8, 6, 1, hairC); R(12, 9, 4, 1, hairC); R(12, 10, 2, 1, hairD); R(10, 6, 2, 5, hairC); P(17, 8, hairD); }
        }
      }
      item('head', L.head);
    }
    item('weapon', L.weapon);
    item('offhand', L.off);
    item('pet', L.pet);

    // compose the character: each part moves with the pose
    let g = grid();
    const blit = (dst, src, dx, dy, test) => {
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        const v = src[y][x]; if (!v || (test && !test(x, y))) continue;
        const X = x + dx, Y = y + dy; if (X >= 0 && X < SIZE && Y >= 0 && Y < SIZE) dst[Y][X] = v;
      }
    };
    // jumps: tall hair or headgear would leave the top of the 32px frame, so jump lower just enough to keep the head
    // (and its 1px outline) in frame; never by more than the jump itself, so the feet never sink below the ground
    const topRow = gr => { for (let y = 0; y < SIZE; y++) if (gr[y].some(Boolean)) return y; return SIZE; };
    const headTop = Math.min(topRow(L.head), topRow(L.hair)) + ps.lift + ps.body + ps.headY;
    const lower = ps.lift < 0 ? Math.max(0, Math.min(1 - headTop, -ps.lift)) : 0;
    const up = ps.lift + ps.body + lower, sx = ps.shiftX;
    blit(g, L.cape, sx, up, (x, y) => y < 25); blit(g, L.cape, sx + ps.cape, up, (x, y) => y >= 25);
    blit(g, L.legs, sx, ps.lift + ps.legs + lower);
    blit(g, L.body, sx, up);
    blit(g, L.hair, sx + ps.hair, up + ps.headY);
    blit(g, L.head, sx + ps.headX, up + ps.headY);
    blit(g, L.arms, sx, up);
    const [lx, ly] = HAND_OFFSET[ps.armL], [rx, ry] = HAND_OFFSET[ps.armR];
    const offhand = !!(DRAW.offhand[lo.offhand]);
    if (!offhand) blit(g, L.weapon, sx - lx, up + ly, x => x < 16);   // a weapon's left-hand part, unless an off-hand item takes the hand
    else blit(g, L.off, sx - lx, up + ly);                            // shield, glove or charm in the left hand
    blit(g, L.weapon, sx + rx, up + ry, x => x >= 16);      // the main weapon, in the right hand

    if (ps.flash) g = g.map(row => row.map(v => (v ? '#ffffff' : v)));
    if (ps.squeeze) {                                       // side-on mid-turn: squash the width
      const sq = grid();
      for (let y = 0; y < SIZE; y++) for (let x = 8; x < 24; x++) { const sxp = 16 + (x - 16) * 2; if (sxp >= 0 && sxp < SIZE) sq[y][x] = g[y][sxp]; }
      g = sq;
    }
    if (ps.flip) g = g.map(row => row.slice().reverse());
    if (ps.rot) {                                           // knocked flat: rotate onto its back and drop to the floor
      const r = grid();
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) r[y][x] = g[SIZE - 1 - x][y];
      let maxY = 0; r.forEach((row, y) => { if (row.some(Boolean)) maxY = y; });
      g = grid(); blit(g, r, 0, 29 - maxY);
    }
    // pet stays on the ground, unaffected by the character's moves
    const pg = grid(); blit(pg, L.pet, 0, ps.pet);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (pg[y][x] && !g[y][x]) g[y][x] = pg[y][x];

    let out = outline(g);
    if (ps.ghosts) {                                        // afterimages trail behind a dash
      const withGhosts = grid();
      ps.ghosts.forEach((dx, i) => {
        const t = 0.45 + i * 0.18;
        for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
          const v = g[y][x], X = x + dx;
          if (v && X >= 0 && X < SIZE && !pg[y][x] && (x + y + i) % (i + 1) === 0) withGhosts[y][X] = mix(v, '#2a4f9a', t);
        }
      });
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (out[y][x]) withGhosts[y][x] = out[y][x];
      out = withGhosts;
    }
    const { P } = pen(out);
    if (ps.slash && SLASH[ps.slash]) {
      const [hot, soft] = SLASH[ps.slash];
      soft.forEach(([x, y]) => P(x + sx, y + up, '#8fc8f0')); hot.forEach(([x, y]) => P(x + sx, y + up, '#ffffff'));
    }
    if (ps.dust) {
      const puff = x0 => { P(x0, 29, '#b8b0a0'); P(x0 + 1, 30, '#8e8981'); P(x0 - 1, 30, '#d6cfc2'); P(x0, 28, '#8e8981'); };
      if (ps.dust === 'L' || ps.dust === 'both') puff(9 + sx);
      if (ps.dust === 'R' || ps.dust === 'both') puff(23 + sx);
    }
    if (ps.stars != null) {
      const pts = [[[24, 19], [28, 17], [26, 21]], [[27, 20], [25, 17], [29, 19]], [[25, 21], [29, 18], [27, 16]]][ps.stars % 3];
      pts.forEach(([x, y], i) => P(x, y, i === 0 ? '#ffe08a' : '#fff1b8'));
    }
    if (ps.burst != null) {
      // firework: a white flash at the fist, then 16 thick sparks fly out, trail, droop and fade
      const cx = 11 + sx, cy = 7 + up, k = ps.burst;
      const radius = [0, 4, 7, 10, 12, 13, 13.5][k];
      const drop = [0, 0, 0, 1, 2, 4, 6][k];
      const pal = [['#ffffff', '#fff1b8', '#ffcf4a', '#b98c2f'], ['#ffffff', '#ffb09a', '#e8553e', '#8a2a1e'], ['#ffffff', '#d8ffb8', '#8fc84f', '#4f8a2e']];
      if (k === 0) {
        [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0], [0, -2], [0, 2]].forEach(([dx, dy], j) => P(cx + dx, cy + dy, j < 5 ? '#ffffff' : '#fff1b8'));
        [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(([dx, dy]) => P(cx + dx, cy + dy, '#ffcf4a'));
      } else {
        const at = (ang, r) => [Math.round(cx + Math.cos(ang) * r), Math.round(cy + Math.sin(ang) * r + drop * (r / 13))];
        for (let i = 0; i < 16; i++) {
          if (k >= 5 && i % 2) continue;                                 // sparks burn out
          if (k >= 6 && i % 4) continue;
          const ang = (i / 16) * Math.PI * 2;
          const c = pal[i % 3], r = radius * (i % 2 ? 0.8 : 1);
          const head = k >= 4 ? c[k >= 5 ? 3 : 2] : c[0];
          const [hx, hy] = at(ang, r);
          P(hx, hy, head);
          if (k <= 3) P(hx + (Math.cos(ang) > 0 ? 1 : -1), hy, head);   // thick spark heads early on
          if (k >= 1 && k <= 5) { const [tx, ty] = at(ang, r - 1.6); P(tx, ty, k >= 4 ? c[3] : c[1]); }
          if (k >= 2 && k <= 4) { const [tx, ty] = at(ang, r - 3.2); P(tx, ty, c[2]); }
          if (k >= 3 && k <= 4) { const [tx, ty] = at(ang, r - 4.8); P(tx, ty, c[3]); }
        }
        if (k <= 2) { P(cx, cy, '#ffffff'); P(cx + 1, cy, '#fff1b8'); P(cx, cy + 1, '#fff1b8'); }
      }
    }
    if (ps.sparkle) {
      const fx = (ps.flip ? 31 - 9 : 9) + sx, base = 10 + up;
      if (ps.sparkle === 'fist') { P(fx - 1, base - 2, '#ffffff'); P(fx + 1, base - 3, '#fff1b8'); P(fx - 3, base, '#fff1b8'); }
      if (ps.sparkle === 'fist2') { P(fx, base - 3, '#ffffff'); P(fx - 2, base - 1, '#ffffff'); P(fx + 2, base, '#fff1b8'); }
      if (ps.sparkle === 'feet') { P(13, 30, '#a8d4f0'); P(18, 31, '#e6f4ff'); }
      if (ps.sparkle === 'feet2') { P(12, 31, '#e6f4ff'); P(19, 30, '#a8d4f0'); P(16, 31, '#ffffff'); }
    }
    return { g: out, bg };
  }

  function drawIcon(slot, id, f = 0, lo) {
    const g = grid();
    const fn = DRAW[slot] && DRAW[slot][id];
    if (fn) fn(g, f, lo || { tunic: 0 });
    let x0 = SIZE, y0 = SIZE, x1 = -1, y1 = -1;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (g[y][x]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    if (x1 < 0) return null;
    const og = slot === 'aura' ? g : outline(g);
    if (slot !== 'aura') { x0 = Math.max(0, x0 - 1); y0 = Math.max(0, y0 - 1); x1 = Math.min(SIZE - 1, x1 + 1); y1 = Math.min(SIZE - 1, y1 + 1); }
    return { g: og, x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  const cache = new Map();
  function paint(layers, scale, w, h, ox, oy) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    for (const { g, x0 = 0, y0 = 0, gw = SIZE, gh = SIZE } of layers) for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const v = g[y0 + y] && g[y0 + y][x0 + x];
      if (v) { ctx.fillStyle = v; ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale); }
    }
    return c.toDataURL('image/png');
  }

  function toDataURL(lo, tick = 0, anim = 'idle') {
    const len = animLength(anim);
    const tk = ((tick % len) + len) % len;
    const key = JSON.stringify(lo) + '|' + anim + '|' + tk;
    if (cache.has(key)) return cache.get(key);
    const { g, bg } = drawSprite(lo, tk, anim);
    const url = paint([{ g: bg }, { g }], 1, SIZE, SIZE, 0, 0);
    if (cache.size > 4000) cache.clear();
    cache.set(key, url);
    return url;
  }

  // One avatar frame as a 32x32 canvas (cached), for canvas scenes like the battle arena.
  const frameCache = new Map();
  function frameCanvas(lo, tick = 0, anim = 'idle', facing = false) {
    const len = animLength(anim), tk = ((tick % len) + len) % len;
    const key = JSON.stringify(lo) + '|' + anim + '|' + tk + (facing ? '|f' : '');
    let c = frameCache.get(key);
    if (c) return c;
    const { g, bg } = drawSprite(lo, tk, anim, facing);
    c = document.createElement('canvas'); c.width = SIZE; c.height = SIZE;
    const ctx = c.getContext('2d');
    for (const layer of [bg, g]) for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) { const v = layer[y][x]; if (v) { ctx.fillStyle = v; ctx.fillRect(x, y, 1, 1); } }
    if (frameCache.size > 3000) frameCache.clear();
    frameCache.set(key, c);
    return c;
  }

  function iconURL(slot, id, frame = 0, lo) {
    const it = findItem(slot, id);
    const f = it && it.animated ? frame % FRAMES : 0;
    const key = `icon|${slot}|${id}|${f}|${slot === 'body' && id === 'tunic' && lo ? lo.tunic : ''}`;
    if (cache.has(key)) return cache.get(key);
    const ic = drawIcon(slot, id, f, lo);
    if (!ic) { cache.set(key, null); return null; }
    // scale the item up by whole pixels so it fills a square icon, then centre it
    const scale = Math.max(1, Math.min(4, Math.floor(30 / Math.max(ic.w, ic.h))));
    const pw = ic.w * scale, ph = ic.h * scale, size = Math.max(32, pw + 2, ph + 2);
    const url = paint([{ g: ic.g, x0: ic.x0, y0: ic.y0, gw: ic.w, gh: ic.h }], scale, size, size, Math.floor((size - pw) / 2), Math.floor((size - ph) / 2));
    cache.set(key, url);
    return url;
  }

  // With the League switched off, items that needed league stats unlock from weekly/season goals instead.
  function configure(opts) {
    const league = !opts || opts.league !== false;
    for (const slot of SLOTS) for (const it of slot.items) {
      if (!it.noLeague) continue;
      if (!it.leagueRule) it.leagueRule = { stat: it.stat, need: it.need };
      const rule = league ? it.leagueRule : it.noLeague;
      it.stat = rule.stat; it.need = rule.need;
    }
  }

  // next locked item that is closest to unlocking
  function nextUnlock(st) {
    let best = null;
    for (const slot of SLOTS) for (const it of slot.items) {
      if (isUnlocked(it, st)) continue;
      const p = progress(it, st);
      if (!best || p > best.p) best = { item: it, slot: slot.id, p };
    }
    return best;
  }

  root.LeagueAvatars = {
    SLOTS, SKINS, HAIR_STYLES, HAIR_COLORS, TUNICS, RARITY, FRAMES, IDLE_LEN, animLength,
    configure, computeStats, isUnlocked, progress, requirement, defaultLoadout, sanitize, toDataURL, iconURL, frameCanvas, isAnimated, nextUnlock, findItem,
  };
})(typeof self !== 'undefined' ? self : this);
