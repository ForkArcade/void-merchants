// Space Trader — Data
// Config, commodities, ship types, weapons, factions, sounds, narrative
(function() {
  'use strict';
  var FA = window.FA;

  // === CONFIG ===
  FA.register('config', 'game', {
    canvasWidth: 1000,
    canvasHeight: 800,
    galaxySeed: 42,
    systemCount: 40,
    startCredits: 1000,
    startFuel: 100,
    maxFuel: 200,
    fuelPerJump: 15,
    fuelPriceBase: 5,
    tradeTax: 0.05,
    maxCargo: 20,
    maxMissions: 3,
    missionTimeout: 300000,
    shieldRechargeRate: 0.002,
    combatArenaWidth: 2000,
    combatArenaHeight: 1600,
    playerSpeed: 4,
    playerTurnSpeed: 0.05,
    bulletSpeed: 8,
    bulletLife: 120,
    shootCooldown: 200,
    fleeSpeedThreshold: 0.8,
    fleeFuelCost: 10,
    hostileRepThreshold: -50,
    allyRepThreshold: 50,
    marketUpdateInterval: 18000
  });

  FA.register('config', 'colors', {
    bg: '#000a14',
    starfield: '#ffffff',
    gridLine: '#0a1a2a',
    playerShip: '#4ef',
    enemyShip: '#f84',
    friendlyShip: '#4f4',
    fuelBar: '#4af',
    shieldBar: '#4ff',
    hullBar: '#f44',
    credits: '#fd4',
    narrative: '#c8b4ff',
    hud: '#aaa',
    hudBright: '#fff',
    selected: '#ff0',
    connection: '#1a2a3a',
    fuelRange: '#224',
    profit: '#4f4',
    loss: '#f44',
    neutral: '#888'
  });

  FA.register('config', 'scoring', {
    creditMultiplier: 1,
    systemsVisitedMultiplier: 50,
    missionsCompletedMultiplier: 200,
    killMultiplier: 100,
    survivalPerMinute: 10,
    artifactBonus: 5000
  });

  // === COMMODITIES ===
  // economyMod: multiplier per economy type — <1 = cheap (source), >1 = expensive (demand)
  FA.register('commodities', 'food', {
    name: 'Food', basePrice: 20, unit: 't',
    economyMod: { agricultural: 0.5, industrial: 1.2, mining: 1.5, tech: 1.1, military: 1.3, 'trade-hub': 0.9 }
  });
  FA.register('commodities', 'minerals', {
    name: 'Minerals', basePrice: 40, unit: 't',
    economyMod: { agricultural: 1.3, industrial: 0.8, mining: 0.4, tech: 1.6, military: 1.0, 'trade-hub': 0.9 }
  });
  FA.register('commodities', 'machinery', {
    name: 'Machinery', basePrice: 80, unit: 't',
    economyMod: { agricultural: 1.4, industrial: 0.5, mining: 1.3, tech: 0.8, military: 1.1, 'trade-hub': 0.9 }
  });
  FA.register('commodities', 'electronics', {
    name: 'Electronics', basePrice: 150, unit: 't',
    economyMod: { agricultural: 1.8, industrial: 1.2, mining: 1.5, tech: 0.4, military: 1.0, 'trade-hub': 0.7 }
  });
  FA.register('commodities', 'weapons', {
    name: 'Weapons', basePrice: 200, unit: 't',
    economyMod: { agricultural: 1.6, industrial: 1.0, mining: 1.2, tech: 0.8, military: 0.5, 'trade-hub': 0.9 }
  });
  FA.register('commodities', 'luxuries', {
    name: 'Luxuries', basePrice: 250, unit: 't',
    economyMod: { agricultural: 1.5, industrial: 1.4, mining: 1.8, tech: 1.0, military: 1.3, 'trade-hub': 0.6 }
  });
  FA.register('commodities', 'narcotics', {
    name: 'Narcotics', basePrice: 300, unit: 't', illegal: true,
    economyMod: { agricultural: 0.3, industrial: 1.2, mining: 1.0, tech: 0.8, military: 2.0, 'trade-hub': 1.5 }
  });
  FA.register('commodities', 'medicine', {
    name: 'Medicine', basePrice: 100, unit: 't',
    economyMod: { agricultural: 1.2, industrial: 1.0, mining: 1.4, tech: 0.5, military: 0.9, 'trade-hub': 0.8 }
  });

  // === SHIP TYPES ===
  FA.register('shipTypes', 'shuttle', {
    name: 'Shuttle', maxHull: 40, maxShield: 15, maxCargo: 10, maxFuel: 80,
    speed: 4, turnSpeed: 0.003, weaponSlots: 1, price: 0, char: 'S'
  });
  FA.register('shipTypes', 'trader', {
    name: 'Trader', maxHull: 70, maxShield: 25, maxCargo: 40, maxFuel: 150,
    speed: 3, turnSpeed: 0.0025, weaponSlots: 1, price: 5000, char: 'T'
  });
  FA.register('shipTypes', 'fighter', {
    name: 'Fighter', maxHull: 50, maxShield: 40, maxCargo: 10, maxFuel: 120,
    speed: 6, turnSpeed: 0.005, weaponSlots: 3, price: 8000, char: 'F'
  });
  FA.register('shipTypes', 'corvette', {
    name: 'Corvette', maxHull: 100, maxShield: 60, maxCargo: 25, maxFuel: 200,
    speed: 4, turnSpeed: 0.003, weaponSlots: 4, price: 15000, char: 'C'
  });
  FA.register('shipTypes', 'freighter', {
    name: 'Freighter', maxHull: 130, maxShield: 35, maxCargo: 80, maxFuel: 250,
    speed: 2, turnSpeed: 0.002, weaponSlots: 2, price: 20000, char: 'H'
  });

  // === WEAPON TYPES ===
  FA.register('weaponTypes', 'laser', {
    name: 'Pulse Laser', damage: 4, cooldown: 500, speed: 5, range: 150, color: '#0ff', price: 500, char: '|'
  });
  FA.register('weaponTypes', 'cannon', {
    name: 'Cannon', damage: 10, cooldown: 1500, speed: 4, range: 120, color: '#fa0', price: 1500, char: 'o'
  });
  FA.register('weaponTypes', 'missile', {
    name: 'Missile', damage: 20, cooldown: 3000, speed: 3, range: 220, color: '#f44', price: 3000, char: '*'
  });
  FA.register('weaponTypes', 'beam', {
    name: 'Mining Beam', damage: 2, cooldown: 200, speed: 7, range: 100, color: '#4f4', price: 800, char: ':'
  });

  // === FACTIONS ===
  FA.register('factions', 'federation', {
    name: 'Terran Federation', color: '#4af', alignment: 'lawful',
    ally: 'merchants', enemy: 'pirates',
    systemShare: 0.3
  });
  FA.register('factions', 'merchants', {
    name: 'Merchant Guild', color: '#fd4', alignment: 'neutral',
    ally: 'federation', enemy: 'pirates',
    systemShare: 0.2
  });
  FA.register('factions', 'pirates', {
    name: 'Void Raiders', color: '#f44', alignment: 'hostile',
    ally: null, enemy: 'federation',
    systemShare: 0.15
  });
  FA.register('factions', 'scientists', {
    name: 'Science Enclave', color: '#4ff', alignment: 'neutral',
    ally: null, enemy: null,
    systemShare: 0.1
  });
  FA.register('factions', 'rebels', {
    name: 'Free Systems', color: '#f84', alignment: 'neutral',
    ally: 'pirates', enemy: 'federation',
    systemShare: 0.15
  });

  // === SOUNDS ===
  FA.defineSound('laser', function(actx, dest) {
    var osc = actx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, actx.currentTime + 0.08);
    osc.connect(dest); osc.start(); osc.stop(actx.currentTime + 0.08);
  });

  FA.defineSound('cannon', function(actx, dest) {
    var osc = actx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, actx.currentTime + 0.15);
    var g = actx.createGain();
    g.gain.setValueAtTime(0.6, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.2);
    osc.connect(g); g.connect(dest); osc.start(); osc.stop(actx.currentTime + 0.2);
  });

  FA.defineSound('jump', function(actx, dest) {
    var osc = actx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, actx.currentTime + 0.4);
    var g = actx.createGain();
    g.gain.setValueAtTime(0.5, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.5);
    osc.connect(g); g.connect(dest); osc.start(); osc.stop(actx.currentTime + 0.5);
  });

  FA.defineSound('dock', function(actx, dest) {
    var osc = actx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, actx.currentTime + 0.15);
    osc.connect(dest); osc.start(); osc.stop(actx.currentTime + 0.15);
  });

  FA.defineSound('trade', function(actx, dest) {
    var t = actx.currentTime;
    [500, 700, 900].forEach(function(freq, i) {
      var osc = actx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      osc.connect(dest); osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 0.1);
    });
  });

  FA.defineSound('alarm', function(actx, dest) {
    var osc = actx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, actx.currentTime);
    osc.frequency.setValueAtTime(600, actx.currentTime + 0.15);
    osc.frequency.setValueAtTime(400, actx.currentTime + 0.3);
    osc.connect(dest); osc.start(); osc.stop(actx.currentTime + 0.3);
  });

  FA.defineSound('explosion', function(actx, dest) {
    var osc = actx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, actx.currentTime + 0.3);
    var g = actx.createGain();
    g.gain.setValueAtTime(0.8, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.3);
    osc.connect(g); g.connect(dest); osc.start(); osc.stop(actx.currentTime + 0.3);
  });

  // === NARRATIVE ===
  FA.register('config', 'narrative', {
    startNode: 'arrival',
    variables: {
      credits_earned: 0,
      systems_visited: 0,
      kills: 0,
      missions_completed: 0,
      faction_federation: 0,
      faction_merchants: 0,
      faction_pirates: 0,
      faction_scientists: 0,
      faction_rebels: 0,
      has_artifact: false,
      artifact_delivered: false,
      pirate_king_defeated: false,
      distress_answered: false,
      smuggling_done: false
    },
    graph: {
      nodes: [
        // Act 1: Arrival & Survival
        { id: 'arrival',            type: 'scene',  label: 'Arrival' },
        { id: 'first_trade',       type: 'scene',  label: 'First Trade' },
        { id: 'first_jump',        type: 'scene',  label: 'First Jump' },
        { id: 'trader_life',       type: 'scene',  label: 'Trader Life' },

        // Act 2: Faction Encounters
        { id: 'federation_contact', type: 'scene',  label: 'Federation Contact' },
        { id: 'pirate_encounter',   type: 'scene',  label: 'Pirate Encounter' },
        { id: 'merchant_guild',     type: 'scene',  label: 'Merchant Guild' },
        { id: 'rebel_sympathy',     type: 'scene',  label: 'Rebel Sympathy' },

        // Act 2: Choices
        { id: 'distress_signal',   type: 'choice', label: 'Distress Signal' },
        { id: 'smuggler_offer',    type: 'choice', label: 'Smuggler Offer' },
        { id: 'faction_choice',    type: 'choice', label: 'Choose Your Side' },

        // Act 3: The Artifact
        { id: 'artifact_rumor',    type: 'scene',  label: 'Artifact Rumor' },
        { id: 'artifact_found',    type: 'scene',  label: 'Artifact Found' },
        { id: 'artifact_hunted',   type: 'scene',  label: 'Hunted' },

        // Act 3: Choices
        { id: 'artifact_decision', type: 'choice', label: 'What to Do With It' },

        // Act 4: Climax
        { id: 'pirate_king',       type: 'scene',  label: 'Pirate King' },
        { id: 'final_run',         type: 'scene',  label: 'Final Run' },
        { id: 'delivery',          type: 'scene',  label: 'Delivery' },

        // Endings
        { id: 'victory_science',   type: 'scene',  label: 'Victory: Science' },
        { id: 'victory_power',     type: 'scene',  label: 'Victory: Power' },
        { id: 'defeat',            type: 'scene',  label: 'Defeat' }
      ],
      edges: [
        // Act 1
        { from: 'arrival',            to: 'first_trade' },
        { from: 'first_trade',       to: 'first_jump' },
        { from: 'first_jump',        to: 'trader_life' },

        // Act 1 -> Act 2
        { from: 'trader_life',       to: 'federation_contact' },
        { from: 'trader_life',       to: 'pirate_encounter' },
        { from: 'trader_life',       to: 'merchant_guild' },

        // Act 2 faction paths
        { from: 'federation_contact', to: 'distress_signal' },
        { from: 'pirate_encounter',   to: 'smuggler_offer' },
        { from: 'merchant_guild',     to: 'faction_choice' },
        { from: 'federation_contact', to: 'faction_choice' },
        { from: 'pirate_encounter',   to: 'faction_choice' },
        { from: 'merchant_guild',     to: 'rebel_sympathy' },
        { from: 'rebel_sympathy',     to: 'faction_choice' },

        // Side paths -> artifact
        { from: 'distress_signal',   to: 'artifact_rumor' },
        { from: 'distress_signal',   to: 'trader_life' },
        { from: 'smuggler_offer',    to: 'artifact_rumor' },
        { from: 'smuggler_offer',    to: 'trader_life' },

        // Act 2 -> Act 3
        { from: 'faction_choice',    to: 'artifact_rumor' },

        // Act 3
        { from: 'artifact_rumor',    to: 'artifact_found' },
        { from: 'artifact_found',    to: 'artifact_hunted' },
        { from: 'artifact_hunted',   to: 'artifact_decision' },

        // Act 3 -> Act 4
        { from: 'artifact_decision', to: 'pirate_king' },
        { from: 'artifact_decision', to: 'final_run' },
        { from: 'pirate_king',       to: 'final_run' },
        { from: 'final_run',         to: 'delivery' },

        // Endings
        { from: 'delivery',          to: 'victory_science' },
        { from: 'delivery',          to: 'victory_power' },

        // Defeat from anywhere
        { from: 'arrival',           to: 'defeat' },
        { from: 'trader_life',      to: 'defeat' },
        { from: 'pirate_encounter',  to: 'defeat' },
        { from: 'artifact_hunted',   to: 'defeat' },
        { from: 'pirate_king',       to: 'defeat' },
        { from: 'final_run',         to: 'defeat' }
      ]
    }
  });

  // === NARRATIVE TEXT ===
  // Act 1
  FA.register('narrativeText', 'arrival', {
    text: 'Emergency landing. Hull damaged, credits low. Welcome to the frontier.',
    color: '#c8b4ff'
  });
  FA.register('narrativeText', 'first_trade', {
    text: 'First profit. Every credit counts out here.',
    color: '#4f4'
  });
  FA.register('narrativeText', 'first_jump', {
    text: 'Hyperspace jump complete. The galaxy opens up before you.',
    color: '#4af'
  });
  FA.register('narrativeText', 'trader_life', {
    text: 'Trade routes established. But the frontier has its own rules...',
    color: '#c8b4ff'
  });

  // Act 2
  FA.register('narrativeText', 'federation_contact', {
    text: 'Federation patrol. They want order. You want profit.',
    color: '#4af'
  });
  FA.register('narrativeText', 'pirate_encounter', {
    text: 'Pirates. They take what they want — unless you fight back.',
    color: '#f44'
  });
  FA.register('narrativeText', 'merchant_guild', {
    text: 'The Merchant Guild offers protection. For a price.',
    color: '#fd4'
  });
  FA.register('narrativeText', 'rebel_sympathy', {
    text: 'The Free Systems fight for independence. A worthy cause?',
    color: '#f84'
  });
  FA.register('narrativeText', 'distress_signal', {
    text: 'Distress signal detected. Help could bring allies... or trouble.',
    color: '#ff8'
  });
  FA.register('narrativeText', 'smuggler_offer', {
    text: 'Smuggling run. Big credits. Bigger consequences.',
    color: '#fa0'
  });
  FA.register('narrativeText', 'faction_choice', {
    text: 'Every faction wants your loyalty. Choose wisely.',
    color: '#c8b4ff'
  });

  // Act 3
  FA.register('narrativeText', 'artifact_rumor', {
    text: 'Whispers of an alien artifact. Something ancient. Something powerful.',
    color: '#f4f'
  });
  FA.register('narrativeText', 'artifact_found', {
    text: 'The artifact pulses with unknown energy. Everyone will want this.',
    color: '#f4f'
  });
  FA.register('narrativeText', 'artifact_hunted', {
    text: 'They know you have it. Every faction. Every pirate. Run.',
    color: '#f44'
  });
  FA.register('narrativeText', 'artifact_decision', {
    text: 'Deliver to the scientists? Sell for power? Your choice shapes the frontier.',
    color: '#c8b4ff'
  });

  // Act 4
  FA.register('narrativeText', 'pirate_king', {
    text: 'The Pirate King blocks your path. This ends now.',
    color: '#f44'
  });
  FA.register('narrativeText', 'final_run', {
    text: 'Final jump. The Science Enclave awaits. Hold together.',
    color: '#4ff'
  });
  FA.register('narrativeText', 'delivery', {
    text: 'The artifact is delivered. The frontier will never be the same.',
    color: '#4f4'
  });

  // Endings
  FA.register('narrativeText', 'victory_science', {
    text: 'Knowledge prevails. The frontier enters a new era of discovery.',
    color: '#4ff'
  });
  FA.register('narrativeText', 'victory_power', {
    text: 'Power seized. The frontier bows to a new authority.',
    color: '#fa0'
  });
  FA.register('narrativeText', 'defeat', {
    text: 'Lost in the void. The frontier claims another soul.',
    color: '#f44'
  });

})();
