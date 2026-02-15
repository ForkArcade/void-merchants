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
    // Don't overlap — skip if a message is still visible
    if (state.narrativeMessage && state.narrativeMessage.life > 1000) return;
    state.narrativeMessage = { text: text.text, color: text.color, life: 5000, maxLife: 5000 };

    // Update platform narrative (direct set, no edge validation)
    if (FA.narrative) {
      FA.narrative.currentNode = nodeId;
      FA.narrative._events.push(text.text);
      if (FA.narrative._events.length > 20) FA.narrative._events.shift();
      FA.narrative._sync();
    }
  }

  // Fire a narrative trigger only once
  function triggerNarrative(key, nodeId) {
    if (narrativeFlags[key]) return;
    narrativeFlags[key] = true;
    showNarrative(nodeId);
  }

  // Contextual message (not tied to narrative graph, repeatable)
  function showContextMessage(text, color) {
    var state = FA.getState();
    if (state.narrativeMessage && state.narrativeMessage.life > 1000) return;
    state.narrativeMessage = { text: text, color: color || '#aaa', life: 4000, maxLife: 4000 };
  }

  // === GAME START ===
  function startGame() {
    Galaxy.init(cfg.galaxySeed);
    Player.init();
    narrativeFlags = {};

    FA.resetState({
      screen: 'playing',
      view: 'system_view',
      gameTime: 0,
      selectedSystem: null,
      stationTab: 0,
      menuIndex: 0,
      narrativeMessage: null,
      starfield: generateStarfield(200),
      nearStation: -1,
      availableMissions: [],
      dockStation: null,
      selectionList: [],
      npcs: []
    });

    // Initialize narrative
    var narrativeCfg = FA.lookup('config', 'narrative');
    if (FA.narrative && narrativeCfg) {
      FA.narrative.init(narrativeCfg);
    }
    Combat.clearProjectiles();

    // Position player near first station
    var ship = Player.getShip();
    var startStations = Galaxy.getStations(Player.getCurrentSystem());
    if (startStations.length > 0) {
      ship.x = startStations[0].x + 80;
      ship.y = startStations[0].y;
    }

    showNarrative('arrival');
  }

  // === NPC SYSTEM ===
  // NPCs have attitudes: hostile (attack), neutral (ignore), friendly (patrol)
  // Attitude is driven by faction reputation — changes dynamically

  function createNPC(shipType, faction, x, y) {
    var shipDef = FA.lookup('shipTypes', shipType);
    var rep = Player.getReputation(faction);

    // Initial attitude based on faction + reputation
    var attitude = 'neutral';
    if (faction === 'pirates') {
      attitude = rep > 20 ? 'neutral' : 'hostile';
    } else if (rep < -30) {
      attitude = 'hostile';
    } else if (rep > 20) {
      attitude = 'friendly';
    }

    return {
      shipType: shipType,
      faction: faction,
      attitude: attitude,
      attackedByPlayer: false,
      hull: shipDef ? shipDef.maxHull : 30,
      maxHull: shipDef ? shipDef.maxHull : 30,
      shield: shipDef ? shipDef.maxShield : 10,
      maxShield: shipDef ? shipDef.maxShield : 10,
      speed: shipDef ? shipDef.speed : 3,
      turnSpeed: shipDef ? shipDef.turnSpeed : 0.04,
      weapons: shipType === 'trader' ? [] : ['laser'],
      x: x, y: y,
      vx: 0, vy: 0,
      angle: Math.random() * Math.PI * 2,
      cooldown: 0,
      targetX: FA.rand(-300, 300), targetY: FA.rand(-300, 300)
    };
  }

  function spawnSystemNPCs(systemId) {
    var sys = Galaxy.getSystem(systemId);
    if (!sys) return [];
    var npcs = [];
    var stations = Galaxy.getStations(systemId);

    // Trader near stations in populated systems
    if (stations.length > 0 && sys.population >= 3) {
      var st = stations[FA.rand(0, stations.length - 1)];
      npcs.push(createNPC('trader', 'merchants', st.x + FA.rand(-100, 100), st.y + FA.rand(-100, 100)));
    }

    // Faction patrol
    if (sys.faction && sys.faction !== 'pirates' && sys.population >= 2) {
      npcs.push(createNPC('fighter', sys.faction, FA.rand(-400, 400), FA.rand(-400, 400)));
    }

    // Pirates in dangerous systems
    if (sys.danger >= 2) {
      var sign = Math.random() > 0.5 ? 1 : -1;
      npcs.push(createNPC('fighter', 'pirates', FA.rand(300, 600) * sign, FA.rand(300, 600) * -sign));
    }
    if (sys.danger >= 4) {
      var sign2 = Math.random() > 0.5 ? 1 : -1;
      npcs.push(createNPC('corvette', 'pirates', FA.rand(400, 700) * sign2, FA.rand(400, 700) * -sign2));
    }

    return npcs;
  }

  function updateNPCs(npcs, stations, player, dt) {
    for (var i = 0; i < npcs.length; i++) {
      var npc = npcs[i];

      // Recompute attitude from reputation (unless manually aggro'd)
      if (!npc.attackedByPlayer) {
        var rep = Player.getReputation(npc.faction);
        if (npc.faction === 'pirates') {
          npc.attitude = rep > 20 ? 'neutral' : 'hostile';
        } else if (rep < -30) {
          npc.attitude = 'hostile';
        } else if (rep > 20) {
          npc.attitude = 'friendly';
        } else {
          npc.attitude = 'neutral';
        }
      }

      if (npc.attitude === 'hostile') {
        updateHostileNPC(npc, player, dt);
      } else {
        updatePassiveNPC(npc, stations, dt);
      }

      // Shield recharge
      npc.shield = Math.min(npc.maxShield, npc.shield + 0.001 * dt);
    }
  }

  function updateHostileNPC(npc, player, dt) {
    var dx = player.x - npc.x;
    var dy = player.y - npc.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var desiredAngle = Math.atan2(dx, -dy);

    var angleDiff = desiredAngle - npc.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    var turnAmount = npc.turnSpeed * dt;
    if (angleDiff > turnAmount) npc.angle += turnAmount;
    else if (angleDiff < -turnAmount) npc.angle -= turnAmount;
    else npc.angle = desiredAngle;

    // Chase if far, circle if close
    if (dist > 200) {
      npc.vx += Math.sin(npc.angle) * npc.speed * 0.01;
      npc.vy -= Math.cos(npc.angle) * npc.speed * 0.01;
    } else if (dist < 150) {
      npc.angle += 0.01 * dt;
      npc.vx += Math.sin(npc.angle) * npc.speed * 0.008;
      npc.vy -= Math.cos(npc.angle) * npc.speed * 0.008;
    }

    // Fire when aimed and in range
    npc.cooldown = Math.max(0, npc.cooldown - dt);
    if (Math.abs(angleDiff) < 0.3 && dist < 300 && npc.cooldown <= 0 && npc.weapons.length > 0) {
      var weaponId = npc.weapons[0];
      var weaponDef = FA.lookup('weaponTypes', weaponId);
      if (weaponDef) {
        Combat.spawnProjectile(npc, weaponId, false);
        npc.cooldown = weaponDef.cooldown * 4;
      }
    }

    npc.vx *= 0.99;
    npc.vy *= 0.99;
    npc.x += npc.vx;
    npc.y += npc.vy;
  }

  function updatePassiveNPC(npc, stations, dt) {
    var dx = npc.targetX - npc.x;
    var dy = npc.targetY - npc.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 30) {
      if (stations.length > 0 && Math.random() > 0.3) {
        var st = stations[FA.rand(0, stations.length - 1)];
        npc.targetX = st.x + FA.rand(-50, 50);
        npc.targetY = st.y + FA.rand(-50, 50);
      } else {
        npc.targetX = FA.rand(-500, 500);
        npc.targetY = FA.rand(-500, 500);
      }
      return;
    }

    var desiredAngle = Math.atan2(dx, -dy);
    var angleDiff = desiredAngle - npc.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    var turnRate = 0.002 * dt;
    if (angleDiff > turnRate) npc.angle += turnRate;
    else if (angleDiff < -turnRate) npc.angle -= turnRate;
    else npc.angle = desiredAngle;

    npc.vx += Math.sin(npc.angle) * npc.speed * 0.005;
    npc.vy -= Math.cos(npc.angle) * npc.speed * 0.005;

    npc.vx *= 0.99;
    npc.vy *= 0.99;
    npc.x += npc.vx;
    npc.y += npc.vy;
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

      if (data.action === 'back' || data.action === 'map') {
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

            // Position player at system edge (arriving from jump)
            player.x = FA.rand(-200, 200);
            player.y = FA.rand(-200, 200);
            player.vx = 0;
            player.vy = 0;
            player.angle = 0;

            // Spawn NPCs for new system
            state.npcs = spawnSystemNPCs(targetId);
            Combat.clearProjectiles();

            // Narrative triggers
            var visited = Object.keys(Player.getVisitedSystems()).length;
            if (visited === 2) triggerNarrative('first_jump', 'first_jump');
            if (visited >= 5) triggerNarrative('trader_life', 'trader_life');

            // Contextual narrative on system entry
            var hasHostile = false;
            var hostileFaction = null;
            for (var npi = 0; npi < state.npcs.length; npi++) {
              if (state.npcs[npi].attitude === 'hostile') {
                hasHostile = true;
                hostileFaction = state.npcs[npi].faction;
              }
            }
            if (hasHostile) {
              if (hostileFaction === 'pirates') {
                if (!narrativeFlags['pirate_encounter']) {
                  triggerNarrative('pirate_encounter', 'pirate_encounter');
                } else {
                  var destDanger = Galaxy.getSystem(targetId);
                  showContextMessage('Void Raider territory — danger level ' + (destDanger ? destDanger.danger : '?') + '.', '#f44');
                }
              } else if (hostileFaction) {
                var hostFac = FA.lookup('factions', hostileFaction);
                showContextMessage((hostFac ? hostFac.name : hostileFaction) + ' forces hostile — your reputation precedes you.', '#f84');
              }
            } else {
              var destCtx = Galaxy.getSystem(targetId);
              if (destCtx && destCtx.faction) {
                var ctxFac = FA.lookup('factions', destCtx.faction);
                if (ctxFac) showContextMessage(ctxFac.name + ' space. Scanning clear.', '#4af');
              }
            }
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
        player.vx += Math.sin(player.angle) * player.speed * 0.02;
        player.vy -= Math.cos(player.angle) * player.speed * 0.02;
      }
      if (FA.isHeld('down')) {
        player.vx -= Math.sin(player.angle) * player.speed * 0.008;
        player.vy += Math.cos(player.angle) * player.speed * 0.008;
      }

      // Star gravity — pull player toward center (0,0)
      var distToStar = Math.sqrt(player.x * player.x + player.y * player.y);
      if (distToStar > 20) {
        var grav = 0.003;
        player.vx -= (player.x / distToStar) * grav;
        player.vy -= (player.y / distToStar) * grav;
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

      // Orbit stations around star
      var stations = Galaxy.getStations(Player.getCurrentSystem());
      for (var oi = 0; oi < stations.length; oi++) {
        var orb = stations[oi];
        orb.orbitAngle += dt * 0.00005 * (1 + oi * 0.3);
        orb.x = Math.cos(orb.orbitAngle) * orb.orbitRadius;
        orb.y = Math.sin(orb.orbitAngle) * orb.orbitRadius;
      }
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

      // NPC update
      if (state.npcs && state.npcs.length > 0) {
        updateNPCs(state.npcs, stations, player, dt);
      }

      // Shooting and projectile collisions
      Combat.updatePlayerShooting(dt, player);
      Combat.updateProjectiles(dt, player, state.npcs || []);

      // Player death check
      if (player.hull <= 0) {
        showNarrative('defeat');
        state.screen = 'defeat';
        var score = Player.computeScore();
        FA.emit('game:over', { victory: false, score: score });
      }

      // Shield recharge
      Player.rechargeShield(dt);
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

    // --- Narrative progression ---
    // Full story arc: 4 acts, driven by gameplay milestones
    var numVisited = Object.keys(Player.getVisitedSystems()).length;

    // Act 2: Faction encounters (reputation-based)
    if (Player.getReputation('federation') > 10) {
      triggerNarrative('federation_contact', 'federation_contact');
    }
    if (Player.getReputation('merchants') > 10) {
      triggerNarrative('merchant_guild', 'merchant_guild');
    }
    if (Player.getReputation('rebels') > 10) {
      triggerNarrative('rebel_sympathy', 'rebel_sympathy');
    }

    // Act 2: Events
    if (player.kills >= 1 && narrativeFlags['pirate_encounter']) {
      triggerNarrative('smuggler_offer', 'smuggler_offer');
    }
    if (numVisited >= 10 && narrativeFlags['trader_life']) {
      triggerNarrative('distress_signal', 'distress_signal');
    }
    if (Player.getReputation('federation') > 30 || Player.getReputation('merchants') > 30 || Player.getReputation('rebels') > 30) {
      triggerNarrative('faction_choice', 'faction_choice');
    }

    // Act 3: The Artifact
    if (numVisited >= 12 && player.missionsCompleted >= 2 && narrativeFlags['faction_choice']) {
      triggerNarrative('artifact_rumor', 'artifact_rumor');
    }
    if (narrativeFlags['artifact_rumor'] && state.view === 'station') {
      var artSys = Galaxy.getSystem(Player.getCurrentSystem());
      if (artSys && artSys.faction === 'scientists') {
        triggerNarrative('artifact_found', 'artifact_found');
      }
    }
    if (narrativeFlags['artifact_found']) {
      var dangerSys = Galaxy.getSystem(Player.getCurrentSystem());
      if (dangerSys && dangerSys.danger >= 2) {
        triggerNarrative('artifact_hunted', 'artifact_hunted');
      }
    }
    if (narrativeFlags['artifact_hunted'] && state.view === 'station') {
      triggerNarrative('artifact_decision', 'artifact_decision');
    }

    // Act 4: Climax
    if (narrativeFlags['artifact_decision'] && player.kills >= 5) {
      triggerNarrative('pirate_king', 'pirate_king');
    }
    if (narrativeFlags['pirate_king'] && numVisited >= 18) {
      triggerNarrative('final_run', 'final_run');
    }
    if (narrativeFlags['final_run'] && state.view === 'station') {
      var finalSys = Galaxy.getSystem(Player.getCurrentSystem());
      if (finalSys && finalSys.faction === 'scientists') {
        triggerNarrative('delivery', 'delivery');
      }
    }

    // Victory: after delivery, end game
    if (narrativeFlags['delivery']) {
      if (!state.victoryTimer) {
        state.victoryTimer = 5000;
        if (Player.getReputation('scientists') > Player.getReputation('merchants')) {
          showNarrative('victory_science');
        } else {
          showNarrative('victory_power');
        }
      }
      state.victoryTimer -= dt;
      if (state.victoryTimer <= 0) {
        state.screen = 'victory';
        var victoryScore = Player.computeScore();
        FA.emit('game:over', { victory: true, score: victoryScore });
      }
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
