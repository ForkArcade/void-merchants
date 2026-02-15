// Space Trader — Entry Point
// Keybindings, view state machine, game loop, ForkArcade integration
(function() {
  'use strict';
  var FA = window.FA;
  var cfg = FA.lookup('config', 'game');
  var colors = FA.lookup('config', 'colors');
  var W = cfg.canvasWidth;
  var H = cfg.canvasHeight;

  FA.initCanvas('game', W, H);

  // === KEYBINDINGS ===
  FA.bindKey('up',       ['w', 'ArrowUp']);
  FA.bindKey('down',     ['s', 'ArrowDown']);
  FA.bindKey('left',     ['a', 'ArrowLeft']);
  FA.bindKey('right',    ['d', 'ArrowRight']);
  FA.bindKey('confirm',  ['Enter', ' ']);
  FA.bindKey('shoot',    [' ']);
  FA.bindKey('back',     ['Escape', 'Backspace']);
  FA.bindKey('boost',    ['Shift']);
  FA.bindKey('flee',     ['f']);
  FA.bindKey('map',      ['m']);
  FA.bindKey('restart',  ['r']);
  FA.bindKey('tab1',     ['1']);
  FA.bindKey('tab2',     ['2']);
  FA.bindKey('tab3',     ['3']);
  FA.bindKey('tab4',     ['4']);
  FA.bindKey('tab5',     ['5']);

  // === NARRATIVE FLAGS ===
  // Track which narrative triggers have already fired so they only fire once
  var narrativeFlags = {};

  // === NARRATIVE HELPER ===
  function showNarrative(nodeId) {
    var text = FA.lookup('narrativeText', nodeId);
    if (!text) return;

    var state = FA.getState();
    state.narrativeMessage = { text: text.text, color: text.color, life: 4000, maxLife: 4000 };

    if (FA.narrative) {
      FA.narrative.transition(nodeId, text.text);
    }
  }

  // Fire a narrative trigger only once
  function triggerNarrative(key, nodeId) {
    if (narrativeFlags[key]) return;
    narrativeFlags[key] = true;
    showNarrative(nodeId);
  }

  // === GAME START ===
  function startGame() {
    Galaxy.init(cfg.galaxySeed);
    Player.init();
    narrativeFlags = {};

    FA.resetState({
      screen: 'playing',
      view: 'galaxy_map',
      gameTime: 0,
      selectedSystem: null,
      stationTab: 0,
      menuIndex: 0,
      narrativeMessage: null,
      starfield: generateStarfield(200),
      nearStation: -1,
      availableMissions: [],
      dockStation: null,
      encounterCooldown: 8000,
      selectionList: []
    });

    // Initialize narrative
    var narrativeCfg = FA.lookup('config', 'narrative');
    if (FA.narrative && narrativeCfg) {
      FA.narrative.init(narrativeCfg);
    }

    showNarrative('arrival');
  }

  // Generate random starfield for background rendering
  function generateStarfield(count) {
    var stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: FA.rand(0, W * 3),
        y: FA.rand(0, H * 3),
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.5
      });
    }
    return stars;
  }

  // === HELPERS ===

  // Get the list of commodities as an array of { id, data }
  function getCommodityList() {
    var all = FA.lookupAll('commodities');
    var list = [];
    for (var cid in all) {
      list.push({ id: cid, data: all[cid] });
    }
    return list;
  }

  // Get the list of ship types as an array of { id, data }
  function getShipList() {
    var all = FA.lookupAll('shipTypes');
    var list = [];
    for (var sid in all) {
      list.push({ id: sid, data: all[sid] });
    }
    return list;
  }

  // Get the list of weapon types as an array of { id, data }
  function getWeaponList() {
    var all = FA.lookupAll('weaponTypes');
    var list = [];
    for (var wid in all) {
      list.push({ id: wid, data: all[wid] });
    }
    return list;
  }

  // Count how many of a commodity the player has
  function playerCargoQty(commodityId) {
    var cargo = Player.getCargo();
    for (var i = 0; i < cargo.length; i++) {
      if (cargo[i].id === commodityId) return cargo[i].quantity;
    }
    return 0;
  }

  // Get max items for a station tab's menu
  function getMenuItemCount(state) {
    var tab = state.stationTab;
    if (tab === 0) return getCommodityList().length;
    if (tab === 1) return getShipList().length + getWeaponList().length;
    if (tab === 2) return 1; // refuel button
    if (tab === 3) return state.availableMissions.length + Player.getActiveMissions().length;
    if (tab === 4) return 1; // repair button
    return 0;
  }

  // Build selection list for galaxy map keyboard navigation
  function buildSelectionList(currentSystemId) {
    var sys = Galaxy.getSystem(currentSystemId);
    if (!sys) return [];
    return sys.connections.slice();
  }

  // === INPUT (one-shot actions) ===
  FA.on('input:action', function(data) {
    var state = FA.getState();

    // --- Start screen ---
    if (state.screen === 'start' && data.action === 'confirm') {
      startGame();
      return;
    }

    // --- Game over screen ---
    if ((state.screen === 'victory' || state.screen === 'defeat') && data.action === 'restart') {
      FA.resetState({ screen: 'start', view: 'start' });
      return;
    }

    if (state.screen !== 'playing') return;

    // --- Galaxy Map ---
    if (state.view === 'galaxy_map') {
      var currentSys = Player.getCurrentSystem();
      var connections = Galaxy.getSystem(currentSys).connections;

      if (data.action === 'back') {
        state.view = 'system_view';
        state.selectedSystem = null;
        return;
      }

      // Keyboard navigation: cycle through connected systems
      if (data.action === 'up' || data.action === 'right') {
        if (connections.length === 0) return;
        if (state.selectedSystem == null) {
          state.selectedSystem = connections[0];
        } else {
          var idx = connections.indexOf(state.selectedSystem);
          idx = (idx + 1) % connections.length;
          state.selectedSystem = connections[idx];
        }
        return;
      }
      if (data.action === 'down' || data.action === 'left') {
        if (connections.length === 0) return;
        if (state.selectedSystem == null) {
          state.selectedSystem = connections[connections.length - 1];
        } else {
          var idx2 = connections.indexOf(state.selectedSystem);
          idx2 = (idx2 - 1 + connections.length) % connections.length;
          state.selectedSystem = connections[idx2];
        }
        return;
      }

      // Confirm: jump to selected system
      if (data.action === 'confirm' && state.selectedSystem != null) {
        var targetId = state.selectedSystem;
        if (Galaxy.isConnected(currentSys, targetId)) {
          var fuelNeeded = Galaxy.fuelForJump(currentSys, targetId);
          var player = Player.getShip();
          if (player.fuel >= fuelNeeded) {
            Player.jumpTo(targetId);
            state.view = 'system_view';
            state.selectedSystem = null;
            state.nearStation = -1;
            state.encounterCooldown = 5000;

            // Reset player position in new system
            player.x = 0;
            player.y = 0;
            player.vx = 0;
            player.vy = 0;
            player.angle = 0;

            // Narrative triggers
            var visited = Object.keys(Player.getVisitedSystems()).length;
            if (visited === 2) triggerNarrative('first_jump', 'first_jump');
            if (visited >= 5) triggerNarrative('trader_life', 'trader_life');
          }
        }
        return;
      }
    }

    // --- System View ---
    else if (state.view === 'system_view') {
      if (data.action === 'map') {
        state.view = 'galaxy_map';
        state.selectedSystem = null;
        return;
      }
      if (data.action === 'confirm' && state.nearStation >= 0) {
        var stations = Galaxy.getStations(Player.getCurrentSystem());
        if (stations[state.nearStation]) {
          state.view = 'station';
          state.dockStation = state.nearStation;
          state.stationTab = 0;
          state.menuIndex = 0;
          state.availableMissions = Galaxy.generateMissions(Player.getCurrentSystem());
          FA.playSound('dock');
        }
        return;
      }
    }

    // --- Station ---
    else if (state.view === 'station') {
      if (data.action === 'back') {
        // If on trade tab and player has cargo of selected commodity, sell 1
        if (state.stationTab === 0) {
          var comList = getCommodityList();
          if (state.menuIndex < comList.length) {
            var selCom = comList[state.menuIndex];
            var qty = playerCargoQty(selCom.id);
            if (qty > 0) {
              var sys = Galaxy.getSystem(Player.getCurrentSystem());
              var sellPrice = Galaxy.getSellPrice(selCom.id, sys);
              if (Player.sellCommodity(selCom.id, 1, sellPrice)) {
                FA.playSound('trade');
                // First trade narrative trigger
                triggerNarrative('first_trade', 'first_trade');
              }
              return;
            }
          }
        }
        // Undock
        state.view = 'system_view';
        state.dockStation = null;
        return;
      }

      // Tab switching
      if (data.action === 'tab1') { state.stationTab = 0; state.menuIndex = 0; return; }
      if (data.action === 'tab2') { state.stationTab = 1; state.menuIndex = 0; return; }
      if (data.action === 'tab3') { state.stationTab = 2; state.menuIndex = 0; return; }
      if (data.action === 'tab4') { state.stationTab = 3; state.menuIndex = 0; return; }
      if (data.action === 'tab5') { state.stationTab = 4; state.menuIndex = 0; return; }

      // Menu navigation
      var maxItems = getMenuItemCount(state);
      if (data.action === 'up' && maxItems > 0) {
        state.menuIndex = (state.menuIndex - 1 + maxItems) % maxItems;
        return;
      }
      if (data.action === 'down' && maxItems > 0) {
        state.menuIndex = (state.menuIndex + 1) % maxItems;
        return;
      }

      // Confirm action based on tab
      if (data.action === 'confirm') {
        var currentSysObj = Galaxy.getSystem(Player.getCurrentSystem());
        var ship = Player.getShip();

        // Tab 0: Trade — buy 1 unit of selected commodity
        if (state.stationTab === 0) {
          var commodities = getCommodityList();
          if (state.menuIndex < commodities.length) {
            var com = commodities[state.menuIndex];
            var buyPrice = Galaxy.getBuyPrice(com.id, currentSysObj);
            if (Player.buyCommodity(com.id, 1, buyPrice)) {
              FA.playSound('trade');
            }
          }
          return;
        }

        // Tab 1: Shipyard — buy ship or weapon
        if (state.stationTab === 1) {
          var ships = getShipList();
          var weapons = getWeaponList();
          if (state.menuIndex < ships.length) {
            // Buy ship
            var shipItem = ships[state.menuIndex];
            if (shipItem.id !== ship.shipTypeId) {
              Player.buyShip(shipItem.id);
            }
          } else {
            // Buy weapon
            var wIdx = state.menuIndex - ships.length;
            if (wIdx < weapons.length) {
              var weaponItem = weapons[wIdx];
              // Buy into next available slot, or slot 0
              var slot = ship.weapons.length < ship.weaponSlots ? ship.weapons.length : 0;
              Player.buyWeapon(weaponItem.id, slot);
            }
          }
          return;
        }

        // Tab 2: Fuel — refuel to max
        if (state.stationTab === 2) {
          var fuelPrice = Math.round(cfg.fuelPriceBase * (1 + currentSysObj.danger * 0.1));
          var fuelNeeded = ship.maxFuel - ship.fuel;
          if (fuelNeeded > 0) {
            Player.refuel(fuelNeeded, fuelPrice);
          }
          return;
        }

        // Tab 3: Missions — accept mission from available, or show active
        if (state.stationTab === 3) {
          if (state.menuIndex < state.availableMissions.length) {
            var mission = state.availableMissions[state.menuIndex];
            if (Player.acceptMission(mission)) {
              state.availableMissions.splice(state.menuIndex, 1);
              if (state.menuIndex >= getMenuItemCount(state) && state.menuIndex > 0) {
                state.menuIndex--;
              }
            }
          }
          return;
        }

        // Tab 4: Repair — repair to max
        if (state.stationTab === 4) {
          var repairPrice = Math.round(10 * (1 + currentSysObj.techLevel * 0.05));
          var repairNeeded = ship.maxHull - ship.hull;
          if (repairNeeded > 0) {
            Player.repairHull(repairNeeded, repairPrice);
          }
          return;
        }
      }
    }

    // --- Combat ---
    else if (state.view === 'combat') {
      if (data.action === 'flee') {
        if (Combat.flee()) {
          state.view = 'system_view';
        }
      }
    }
  });

  // === SCORE SUBMISSION ===
  FA.on('game:over', function(data) {
    if (typeof ForkArcade !== 'undefined') {
      ForkArcade.submitScore(data.score);
    }
  });

  // === GAME LOOP ===
  FA.setUpdate(function(dt) {
    var state = FA.getState();
    if (state.screen !== 'playing') return;

    var player = Player.getShip();
    state.gameTime = (state.gameTime || 0) + dt;
    player.gameTime = state.gameTime;

    // --- Galaxy Map View ---
    if (state.view === 'galaxy_map') {
      // Handle click-based system selection
      var click = FA.consumeClick();
      if (click) {
        var systems = Galaxy.getSystems();
        var scale = 0.7;
        var ox = W / 2;
        var oy = H / 2;
        var bestDist = 25; // max click distance in screen pixels
        var bestId = null;
        for (var i = 0; i < systems.length; i++) {
          var sx = systems[i].x * scale + ox;
          var sy = systems[i].y * scale + oy;
          var d = Math.hypot(click.x - sx, click.y - sy);
          if (d < bestDist) {
            bestDist = d;
            bestId = systems[i].id;
          }
        }
        if (bestId !== null) {
          state.selectedSystem = bestId;
        }
      }
    }

    // --- System View ---
    if (state.view === 'system_view') {
      // Player ship movement
      if (FA.isHeld('left')) {
        player.angle -= player.turnSpeed * dt;
      }
      if (FA.isHeld('right')) {
        player.angle += player.turnSpeed * dt;
      }
      if (FA.isHeld('up')) {
        player.vx += Math.sin(player.angle) * player.speed * 0.04;
        player.vy -= Math.cos(player.angle) * player.speed * 0.04;
      }
      if (FA.isHeld('down')) {
        player.vx -= Math.sin(player.angle) * player.speed * 0.015;
        player.vy += Math.cos(player.angle) * player.speed * 0.015;
      }

      // Friction
      player.vx *= 0.99;
      player.vy *= 0.99;

      // Position
      player.x += player.vx;
      player.y += player.vy;

      // Camera follow
      FA.camera.x = player.x - W / 2;
      FA.camera.y = player.y - H / 2;

      // Check proximity to stations
      var stations = Galaxy.getStations(Player.getCurrentSystem());
      state.nearStation = -1;
      for (var si = 0; si < stations.length; si++) {
        var sdx = player.x - stations[si].x;
        var sdy = player.y - stations[si].y;
        var sdist = Math.sqrt(sdx * sdx + sdy * sdy);
        if (sdist < 60) {
          state.nearStation = si;
          break;
        }
      }

      // Encounter system (pirate encounters)
      var currentSysData = Galaxy.getSystem(Player.getCurrentSystem());
      state.encounterCooldown = (state.encounterCooldown || 0) - dt;
      if (state.encounterCooldown <= 0 && currentSysData.danger > 0) {
        var encounterChance = currentSysData.danger * 0.0001;
        if (Math.random() < encounterChance) {
          // Create pirate enemies
          var enemyCount = FA.rand(1, Math.min(2, currentSysData.danger));
          var enemies = [];
          for (var e = 0; e < enemyCount; e++) {
            enemies.push({
              shipType: 'fighter',
              faction: 'pirates',
              ai: 'aggressive',
              weapons: ['laser']
            });
          }
          Combat.start(enemies, { systemId: Player.getCurrentSystem(), reason: 'pirate_attack' });
          state.view = 'combat';
          state.encounterCooldown = 8000;

          // Narrative trigger
          triggerNarrative('pirate_encounter', 'pirate_encounter');
          return;
        }
        state.encounterCooldown = 1000; // check again in 1s
      }

      // Shield recharge outside combat
      Player.rechargeShield(dt);
    }

    // --- Combat View ---
    if (state.view === 'combat') {
      Combat.update(dt);

      // Check if combat ended
      if (!Combat.isActive()) {
        if (player.hull <= 0) {
          showNarrative('defeat');
          state.screen = 'defeat';
          var score = Player.computeScore();
          FA.emit('game:over', { victory: false, score: score });
        } else {
          state.view = 'system_view';
          // Award kills to player
          // (Combat module handles credit rewards)
        }
      }
    }

    // --- Station View ---
    // No real-time update needed for station

    // --- Market fluctuation ---
    Galaxy.updateMarkets(dt);

    // --- Effects & floats ---
    FA.updateEffects(dt);
    FA.updateFloats(dt);

    // --- Narrative timer ---
    if (state.narrativeMessage && state.narrativeMessage.life > 0) {
      state.narrativeMessage.life -= dt;
    }

    // --- Mission timeout check ---
    var activeMissions = Player.getActiveMissions();
    for (var mi = activeMissions.length - 1; mi >= 0; mi--) {
      var m = activeMissions[mi];
      if (m.timeout && (state.gameTime - m.startTime) > m.timeout) {
        Player.failMission(m.id);
      }
    }

    // --- Mission completion checks ---
    var missions = Player.getActiveMissions();
    for (var mc = missions.length - 1; mc >= 0; mc--) {
      var mission = missions[mc];

      // Delivery: at destination system with enough cargo
      if (mission.type === 'delivery' && Player.getCurrentSystem() === mission.destination) {
        var cargoQty = playerCargoQty(mission.commodity);
        if (cargoQty >= mission.quantity) {
          // Remove the required cargo
          Player.sellCommodity(mission.commodity, mission.quantity, 0);
          Player.completeMission(mission.id);
        }
      }

      // Exploration: just visit the system
      if (mission.type === 'exploration' && Player.getCurrentSystem() === mission.destination) {
        Player.completeMission(mission.id);
      }

      // Combat missions: tracked via kills in combat context (handled by combat module events)
    }

    // --- Stranded check ---
    if (player.fuel <= 0) {
      var stationsHere = Galaxy.getStations(Player.getCurrentSystem());
      var reachable = Galaxy.getSystemsInRange(Player.getCurrentSystem(), player.fuel);
      if (stationsHere.length === 0 && reachable.length === 0) {
        showNarrative('defeat');
        state.screen = 'defeat';
        var strandedScore = Player.computeScore();
        FA.emit('game:over', { victory: false, score: strandedScore });
      }
    }

    // --- Reputation-based narrative triggers ---
    if (Player.getReputation('federation') > 10) {
      triggerNarrative('federation_contact', 'federation_contact');
    }
    if (Player.getReputation('merchants') > 10) {
      triggerNarrative('merchant_guild', 'merchant_guild');
    }

    // --- Narrative sync ---
    if (typeof ForkArcade !== 'undefined' && FA.narrative) {
      var narrativeCfg = FA.lookup('config', 'narrative');
      ForkArcade.updateNarrative({
        currentNode: FA.narrative.getNode(),
        graph: narrativeCfg ? narrativeCfg.graph : null,
        events: FA.narrative.getEvents ? FA.narrative.getEvents() : []
      });
    }

    FA.clearInput();
  });

  // === RENDER ===
  FA.setRender(function() {
    FA.draw.clear(colors.bg);
    FA.renderLayers();
  });

  // === INITIALIZE ===
  Render.setup();

  FA.resetState({
    screen: 'start',
    view: 'start'
  });

  if (typeof ForkArcade !== 'undefined') {
    ForkArcade.onReady(function() {});
  }

  FA.start();
})();
