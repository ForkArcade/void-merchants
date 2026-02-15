// Void Merchants — Rendering
// All render layers: start screen, galaxy map, system view, station menus, combat, HUD, narrative, game over
// Exports: window.Render
(function() {
  'use strict';
  var FA = window.FA;

  var SHIP_SIZE = 24;
  var STATION_SIZE = 20;
  var PROJ_SIZE = 12;

  // Draw a sprite centered and rotated; falls back to fallbackFn if no sprite found
  function drawRotatedSprite(ctx, category, name, x, y, angle, size, fallbackFn) {
    var sprite = typeof getSprite === 'function' && getSprite(category, name);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (sprite) {
      drawSprite(ctx, sprite, -size / 2, -size / 2, size);
    } else {
      fallbackFn(ctx);
    }
    ctx.restore();
  }

  // Draw a static sprite centered; falls back to fallbackFn
  function drawStaticSprite(ctx, category, name, x, y, size, fallbackFn, frame) {
    var sprite = typeof getSprite === 'function' && getSprite(category, name);
    if (sprite) {
      drawSprite(ctx, sprite, x - size / 2, y - size / 2, size, frame);
    } else {
      fallbackFn(ctx);
    }
  }

  function setup() {
    var cfg = FA.lookup('config', 'game');
    var colors = FA.lookup('config', 'colors');
    var W = cfg.canvasWidth;
    var H = cfg.canvasHeight;

    // ========== LAYER: Start Screen (order 0) ==========
    FA.addLayer('startScreen', function() {
      var state = FA.getState();
      if (state.screen !== 'start') return;

      FA.draw.clear(colors.bg);

      // Title
      FA.draw.text('VOID MERCHANTS', W / 2, 200, { color: '#4ef', size: 36, bold: true, align: 'center', baseline: 'middle' });

      // Subtitle
      FA.draw.text('Trade. Fight. Survive.', W / 2, 250, { color: '#aaa', size: 16, align: 'center', baseline: 'middle' });

      // Controls list
      var controls = [
        'WASD / Arrows  -  Fly / Navigate',
        'SPACE / ENTER   -  Confirm / Shoot',
        'M               -  Galaxy Map',
        '1-5             -  Station Tabs',
        'ESC             -  Back',
        'F               -  Flee (combat)'
      ];
      var cy = 340;
      for (var i = 0; i < controls.length; i++) {
        FA.draw.text(controls[i], W / 2, cy + i * 22, { color: '#888', size: 12, align: 'center', baseline: 'middle' });
      }

      // Blinking prompt
      if (Date.now() % 1000 < 500) {
        FA.draw.text('[SPACE] to begin', W / 2, 500, { color: '#4ef', size: 16, bold: true, align: 'center', baseline: 'middle' });
      }
    }, 0);

    // ========== LAYER: Galaxy Map Background (order 1) ==========
    FA.addLayer('galaxyMapBg', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'galaxy_map') return;

      var systems = Galaxy.getSystems();
      var scale = 0.7;
      var ox = W / 2;
      var oy = H / 2;
      var ctx = FA.getCtx();

      ctx.strokeStyle = colors.connection;
      ctx.lineWidth = 1;

      for (var i = 0; i < systems.length; i++) {
        var sys = systems[i];
        var sx = sys.x * scale + ox;
        var sy = sys.y * scale + oy;
        var conns = sys.connections;
        for (var c = 0; c < conns.length; c++) {
          var target = systems[conns[c]];
          if (conns[c] > i) {
            var tx = target.x * scale + ox;
            var ty = target.y * scale + oy;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(tx, ty);
            ctx.stroke();
          }
        }
      }
    }, 1);

    // ========== LAYER: Galaxy Map Systems (order 2) ==========
    FA.addLayer('galaxyMapSystems', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'galaxy_map') return;

      var systems = Galaxy.getSystems();
      var player = Player.getShip();
      var scale = 0.7;
      var ox = W / 2;
      var oy = H / 2;

      // Draw fuel range circle
      var curSys = systems[player.currentSystem];
      if (curSys) {
        var curX = curSys.x * scale + ox;
        var curY = curSys.y * scale + oy;

        // Find max jump range in pixels: find the farthest connected system reachable with current fuel
        var maxDist = 0;
        for (var r = 0; r < systems.length; r++) {
          if (r !== player.currentSystem && Galaxy.isConnected(player.currentSystem, r)) {
            var fuelNeeded = Galaxy.fuelForJump(player.currentSystem, r);
            if (fuelNeeded <= player.fuel) {
              var d = Math.hypot(systems[r].x - curSys.x, systems[r].y - curSys.y);
              if (d > maxDist) maxDist = d;
            }
          }
        }
        if (maxDist > 0) {
          FA.draw.withAlpha(0.3, function() {
            FA.draw.strokeCircle(curX, curY, maxDist * scale + 10, colors.fuelRange, 2);
          });
        }
      }

      // Draw each system
      for (var i = 0; i < systems.length; i++) {
        var sys = systems[i];
        var sx = sys.x * scale + ox;
        var sy = sys.y * scale + oy;

        // Faction color
        var factionColor = '#666';
        if (sys.faction) {
          var faction = FA.lookup('factions', sys.faction);
          if (faction) factionColor = faction.color;
        }

        var radius = 3 + sys.population;
        FA.draw.circle(sx, sy, radius, factionColor);

        // System name
        FA.draw.text(sys.name, sx, sy + radius + 4, { color: '#667', size: 9, align: 'center', baseline: 'top' });

        // Selected system: yellow ring
        if (state.selectedSystem === i) {
          FA.draw.strokeCircle(sx, sy, radius + 4, colors.selected, 2);
        }

        // Player's current system: pulsing ring
        if (i === player.currentSystem) {
          var pulseAlpha = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
          FA.draw.withAlpha(pulseAlpha, function() {
            FA.draw.strokeCircle(sx, sy, radius + 6, '#4ef', 2);
          });
        }
      }
    }, 2);

    // ========== LAYER: Galaxy Map Info Panel (order 3) ==========
    FA.addLayer('galaxyMapInfo', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'galaxy_map') return;
      if (state.selectedSystem == null) return;

      var sys = Galaxy.getSystem(state.selectedSystem);
      if (!sys) return;

      var player = Player.getShip();
      var px = W - 280;
      var py = H - 200;
      var pw = 260;
      var ph = 180;

      // Panel background
      FA.draw.withAlpha(0.85, function() {
        FA.draw.rect(px, py, pw, ph, '#000510');
      });
      FA.draw.strokeRect(px, py, pw, ph, '#334', 1);

      // System name
      FA.draw.text(sys.name, px + 10, py + 10, { color: '#fff', size: 14, bold: true });

      // Economy
      FA.draw.text('Economy: ' + sys.economy, px + 10, py + 32, { color: '#aaa', size: 11 });

      // Tech level
      FA.draw.text('Tech Level: ' + sys.techLevel, px + 10, py + 48, { color: '#aaa', size: 11 });

      // Danger
      var dangerStr = '';
      for (var d = 0; d < sys.danger; d++) dangerStr += '*';
      if (sys.danger === 0) dangerStr = 'Safe';
      FA.draw.text('Danger: ', px + 10, py + 64, { color: '#aaa', size: 11 });
      FA.draw.text(dangerStr, px + 70, py + 64, { color: '#f44', size: 11 });

      // Faction
      var fName = 'Independent';
      var fColor = '#666';
      if (sys.faction) {
        var fac = FA.lookup('factions', sys.faction);
        if (fac) { fName = fac.name; fColor = fac.color; }
      }
      FA.draw.text('Faction: ', px + 10, py + 80, { color: '#aaa', size: 11 });
      FA.draw.text(fName, px + 75, py + 80, { color: fColor, size: 11 });

      // Fuel cost
      var fuelCost = Galaxy.fuelForJump(player.currentSystem, state.selectedSystem);
      var connected = Galaxy.isConnected(player.currentSystem, state.selectedSystem);

      if (state.selectedSystem === player.currentSystem) {
        FA.draw.text('You are here', px + 10, py + 110, { color: '#4ef', size: 12, bold: true });
      } else if (!connected) {
        FA.draw.text('Not connected', px + 10, py + 110, { color: '#f44', size: 12, bold: true });
      } else {
        FA.draw.text('Fuel cost: ' + fuelCost, px + 10, py + 110, { color: '#aaa', size: 11 });
        if (player.fuel >= fuelCost) {
          FA.draw.text('ENTER to jump', px + 10, py + 135, { color: '#4ef', size: 12, bold: true });
        } else {
          FA.draw.text('Not enough fuel', px + 10, py + 135, { color: '#f44', size: 12, bold: true });
        }
      }
    }, 3);

    // ========== LAYER: System View Background (order 10) ==========
    FA.addLayer('systemViewBg', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'system_view') return;

      var stars = state.starfield;
      if (!stars) return;

      var ctx = FA.getCtx();
      var camX = FA.camera.x;
      var camY = FA.camera.y;

      // Draw starfield with parallax
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var sx = ((s.x - camX * 0.3) % (W * 3) + W * 3) % (W * 3) - W;
        var sy = ((s.y - camY * 0.3) % (H * 3) + H * 3) % (H * 3) - H;
        if (sx < 0 || sx > W || sy < 0 || sy > H) continue;
        FA.draw.withAlpha(s.brightness, function() {
          FA.draw.circle(sx, sy, s.size, colors.starfield);
        });
      }

      // Draw central star
      var starX = 0 - camX;
      var starY = 0 - camY;
      if (starX > -100 && starX < W + 100 && starY > -100 && starY < H + 100) {
        ctx.save();
        var grad = ctx.createRadialGradient(starX, starY, 0, starX, starY, 30);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.3, '#ff8');
        grad.addColorStop(1, 'rgba(255,136,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(starX, starY, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }, 10);

    // ========== LAYER: System View Objects (order 11) ==========
    FA.addLayer('systemViewObjects', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'system_view') return;

      var player = Player.getShip();
      var camX = FA.camera.x;
      var camY = FA.camera.y;
      var ctx = FA.getCtx();

      // Draw stations
      var stations = Galaxy.getStations(player.currentSystem);
      for (var i = 0; i < stations.length; i++) {
        var st = stations[i];
        var stx = st.x - camX;
        var sty = st.y - camY;

        // Station sprite or fallback square
        drawStaticSprite(ctx, 'ui', 'station', stx, sty, STATION_SIZE, function() {
          FA.draw.rect(stx - 6, sty - 6, 12, 12, '#88a');
          FA.draw.strokeRect(stx - 7, sty - 7, 14, 14, '#aac', 1);
        });

        // Station name
        FA.draw.text(st.name, stx, sty + 12, { color: '#667', size: 9, align: 'center', baseline: 'top' });

        // Dock prompt if close
        var dx = player.x - st.x;
        var dy = player.y - st.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 60) {
          FA.draw.text('SPACE to dock', stx, sty - 18, { color: '#4ef', size: 11, bold: true, align: 'center', baseline: 'middle' });
        }
      }

      // Draw NPCs
      var npcs = FA.getState().npcs || [];
      for (var ni = 0; ni < npcs.length; ni++) {
        var npc = npcs[ni];
        var nx = npc.x - camX;
        var ny = npc.y - camY;

        // Skip if off-screen
        if (nx < -50 || nx > W + 50 || ny < -50 || ny > H + 50) continue;

        // NPC faction color
        var npcColor = '#888';
        if (npc.faction) {
          var npcFac = FA.lookup('factions', npc.faction);
          if (npcFac) npcColor = npcFac.color;
        }

        // NPC sprite name based on faction
        var npcSpriteName = npc.faction === 'pirates' ? 'pirate' :
                            npc.faction === 'federation' ? 'militaryPatrol' :
                            npc.faction === 'rebels' ? 'rebelFighter' :
                            npc.faction === 'scientists' ? 'bountyHunter' :
                            npc.faction === 'merchants' ? 'merchantCruiser' : 'pirate';
        var npcSize = npc.shipType === 'trader' ? 18 : 20;

        drawRotatedSprite(ctx, 'enemies', npcSpriteName, nx, ny, npc.angle || 0, npcSize, function(c) {
          c.beginPath();
          c.moveTo(0, -8);
          c.lineTo(-5, 6);
          c.lineTo(5, 6);
          c.closePath();
          c.fillStyle = npcColor;
          c.fill();
        });

        // Faction label
        if (npc.faction) {
          FA.draw.text(npc.faction.charAt(0).toUpperCase(), nx, ny + npcSize / 2 + 6, { color: npcColor, size: 8, align: 'center', baseline: 'top' });
        }
      }

      // Draw player ship
      var px = player.x - camX;
      var py = player.y - camY;

      // Engine glow if thrusting
      if (FA.isHeld('up')) {
        var eSprite = typeof getSprite === 'function' && getSprite('effects', 'engineFlame');
        if (eSprite) {
          var eFrame = Math.floor(Date.now() / 150) % spriteFrames(eSprite);
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(player.angle);
          drawSprite(ctx, eSprite, -6, 4, 12, eFrame);
          ctx.restore();
        } else {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(player.angle);
          ctx.beginPath();
          ctx.arc(0, 10, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#f84';
          ctx.fill();
          ctx.restore();
        }
      }

      // Player ship sprite or fallback triangle
      drawRotatedSprite(ctx, 'player', player.shipTypeId || 'shuttle', px, py, player.angle, SHIP_SIZE, function(c) {
        c.beginPath();
        c.moveTo(0, -12);
        c.lineTo(-8, 8);
        c.lineTo(8, 8);
        c.closePath();
        c.fillStyle = colors.playerShip;
        c.fill();
      });
    }, 11);

    // ========== LAYER: Station Menu (order 20) ==========
    FA.addLayer('stationMenu', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'station') return;

      var player = Player.getShip();
      var ctx = FA.getCtx();

      // Dark background overlay
      FA.draw.withAlpha(0.92, function() {
        FA.draw.rect(0, 0, W, H, '#000510');
      });

      // Station name header
      var stations = Galaxy.getStations(player.currentSystem);
      var stationName = stations.length > 0 ? stations[0].name : 'Station';
      FA.draw.text(stationName, W / 2, 25, { color: '#fff', size: 18, bold: true, align: 'center', baseline: 'middle' });

      // 5 tabs
      var tabNames = ['Trade', 'Shipyard', 'Fuel', 'Missions', 'Repair'];
      var tabW = 180;
      var tabH = 30;
      var tabStartX = (W - tabW * 5) / 2;
      var tabY = 55;

      for (var t = 0; t < 5; t++) {
        var tx = tabStartX + t * tabW;
        var isActive = state.stationTab === t;
        FA.draw.rect(tx, tabY, tabW - 2, tabH, isActive ? '#224' : '#111');
        FA.draw.strokeRect(tx, tabY, tabW - 2, tabH, isActive ? '#4ef' : '#333', 1);
        FA.draw.text((t + 1) + '. ' + tabNames[t], tx + tabW / 2 - 1, tabY + tabH / 2, {
          color: isActive ? '#4ef' : '#888',
          size: 12,
          bold: isActive,
          align: 'center',
          baseline: 'middle'
        });
      }

      var contentY = 105;
      var contentX = 60;
      var curSys = Galaxy.getSystem(player.currentSystem);

      // --- Tab 0: Trade ---
      if (state.stationTab === 0) {
        var commodities = FA.lookupAll('commodities');
        var cids = Object.keys(commodities);

        // Column headers
        FA.draw.text('Commodity', contentX, contentY, { color: '#888', size: 11 });
        FA.draw.text('Buy', contentX + 200, contentY, { color: '#888', size: 11, align: 'center' });
        FA.draw.text('Sell', contentX + 300, contentY, { color: '#888', size: 11, align: 'center' });
        FA.draw.text('Cargo', contentX + 400, contentY, { color: '#888', size: 11, align: 'center' });

        for (var ci = 0; ci < cids.length; ci++) {
          var cid = cids[ci];
          var com = commodities[cid];
          var rowY = contentY + 25 + ci * 28;
          var isSelected = state.menuIndex === ci;

          if (isSelected) {
            FA.draw.rect(contentX - 5, rowY - 3, 500, 24, 'rgba(78,238,255,0.08)');
          }

          FA.draw.text(com.name, contentX, rowY, { color: isSelected ? '#fff' : '#ccc', size: 12 });

          var buyP = curSys ? Galaxy.getBuyPrice(cid, curSys) : 0;
          var sellP = curSys ? Galaxy.getSellPrice(cid, curSys) : 0;
          FA.draw.text(buyP + 'cr', contentX + 200, rowY, { color: '#fd4', size: 12, align: 'center' });

          // Color sell price: green if sell > buy (profit when buying here), red if less
          var sellColor = sellP > buyP ? colors.profit : (sellP < buyP ? colors.loss : '#ccc');
          FA.draw.text(sellP + 'cr', contentX + 300, rowY, { color: sellColor, size: 12, align: 'center' });

          // Player cargo quantity
          var cargoQty = 0;
          var cargo = player.cargo;
          for (var cg = 0; cg < cargo.length; cg++) {
            if (cargo[cg].id === cid) { cargoQty = cargo[cg].quantity; break; }
          }
          FA.draw.text(cargoQty > 0 ? String(cargoQty) : '-', contentX + 400, rowY, { color: cargoQty > 0 ? '#fff' : '#444', size: 12, align: 'center' });
        }

        // Trade route hints
        if (curSys) {
          var routes = Galaxy.findTradeRoutes(player.currentSystem);
          if (routes.length > 0) {
            var routeY = contentY + 25 + cids.length * 28 + 20;
            FA.draw.text('Best routes from here:', contentX, routeY, { color: '#888', size: 11 });
            for (var ri = 0; ri < Math.min(3, routes.length); ri++) {
              var rt = routes[ri];
              FA.draw.text(rt.commodityName + ' -> ' + rt.systemName + ' (+' + rt.profit + 'cr)', contentX + 10, routeY + 18 + ri * 18, { color: colors.profit, size: 10 });
            }
          }
        }
      }

      // --- Tab 1: Shipyard ---
      if (state.stationTab === 1) {
        var shipTypes = FA.lookupAll('shipTypes');
        var sids = Object.keys(shipTypes);

        FA.draw.text('Ship', contentX, contentY, { color: '#888', size: 11 });
        FA.draw.text('Hull', contentX + 140, contentY, { color: '#888', size: 11, align: 'center' });
        FA.draw.text('Shield', contentX + 200, contentY, { color: '#888', size: 11, align: 'center' });
        FA.draw.text('Cargo', contentX + 260, contentY, { color: '#888', size: 11, align: 'center' });
        FA.draw.text('Fuel', contentX + 320, contentY, { color: '#888', size: 11, align: 'center' });
        FA.draw.text('Wpns', contentX + 380, contentY, { color: '#888', size: 11, align: 'center' });
        FA.draw.text('Price', contentX + 460, contentY, { color: '#888', size: 11, align: 'center' });

        for (var si = 0; si < sids.length; si++) {
          var sid = sids[si];
          var ship = shipTypes[sid];
          var sRowY = contentY + 25 + si * 26;
          var isCurrent = player.shipTypeId === sid;
          var isSelShip = state.menuIndex === si;

          if (isCurrent) {
            FA.draw.rect(contentX - 5, sRowY - 3, 540, 22, 'rgba(78,238,255,0.06)');
          }
          if (isSelShip) {
            FA.draw.strokeRect(contentX - 5, sRowY - 3, 540, 22, '#4ef', 1);
          }

          var nameColor = isCurrent ? '#4ef' : '#ccc';
          FA.draw.text(ship.name + (isCurrent ? ' [OWNED]' : ''), contentX, sRowY, { color: nameColor, size: 12 });
          FA.draw.text(String(ship.maxHull), contentX + 140, sRowY, { color: '#f88', size: 12, align: 'center' });
          FA.draw.text(String(ship.maxShield), contentX + 200, sRowY, { color: '#8ff', size: 12, align: 'center' });
          FA.draw.text(String(ship.maxCargo), contentX + 260, sRowY, { color: '#ccc', size: 12, align: 'center' });
          FA.draw.text(String(ship.maxFuel), contentX + 320, sRowY, { color: '#88f', size: 12, align: 'center' });
          FA.draw.text(String(ship.weaponSlots), contentX + 380, sRowY, { color: '#fa0', size: 12, align: 'center' });
          FA.draw.text(ship.price > 0 ? ship.price + 'cr' : 'Free', contentX + 460, sRowY, { color: '#fd4', size: 12, align: 'center' });
        }

        // Weapons section
        var weaponTypes = FA.lookupAll('weaponTypes');
        var wids = Object.keys(weaponTypes);
        var weaponY = contentY + 25 + sids.length * 26 + 20;

        FA.draw.text('Weapons', contentX, weaponY, { color: '#fa0', size: 13, bold: true });
        for (var wi = 0; wi < wids.length; wi++) {
          var wid = wids[wi];
          var wpn = weaponTypes[wid];
          var wRowY = weaponY + 22 + wi * 22;
          var equipped = player.weapons.indexOf(wid) !== -1;

          FA.draw.text(wpn.name + (equipped ? ' [EQP]' : ''), contentX, wRowY, { color: equipped ? wpn.color : '#aaa', size: 11 });
          FA.draw.text('DMG:' + wpn.damage, contentX + 200, wRowY, { color: '#ccc', size: 10 });
          FA.draw.text('RNG:' + wpn.range, contentX + 280, wRowY, { color: '#ccc', size: 10 });
          FA.draw.text(wpn.price + 'cr', contentX + 380, wRowY, { color: '#fd4', size: 10 });
        }
      }

      // --- Tab 2: Fuel ---
      if (state.stationTab === 2) {
        var fuelPriceBase = cfg.fuelPriceBase;
        var fuelPrice = curSys ? Math.round(fuelPriceBase * (curSys.techLevel > 5 ? 0.8 : 1.2)) : fuelPriceBase;
        var fuelNeeded = player.maxFuel - player.fuel;
        var fuelCost = fuelNeeded * fuelPrice;

        FA.draw.text('Fuel', W / 2, contentY + 20, { color: '#fff', size: 16, bold: true, align: 'center' });

        FA.draw.text('Current Fuel:', contentX + 100, contentY + 60, { color: '#aaa', size: 12 });
        FA.draw.bar(contentX + 100, contentY + 80, 300, 20, player.fuel / player.maxFuel, colors.fuelBar, '#222');
        FA.draw.text(Math.floor(player.fuel) + ' / ' + player.maxFuel, contentX + 250, contentY + 84, { color: '#fff', size: 12, align: 'center', baseline: 'top' });

        FA.draw.text('Price per unit: ' + fuelPrice + 'cr', contentX + 100, contentY + 120, { color: '#aaa', size: 12 });
        FA.draw.text('Refuel cost: ' + fuelCost + 'cr', contentX + 100, contentY + 140, { color: '#fd4', size: 12 });

        if (fuelNeeded > 0) {
          FA.draw.text('ENTER to refuel', W / 2, contentY + 190, { color: '#4ef', size: 14, bold: true, align: 'center' });
        } else {
          FA.draw.text('Tank is full', W / 2, contentY + 190, { color: '#4f4', size: 14, align: 'center' });
        }
      }

      // --- Tab 3: Missions ---
      if (state.stationTab === 3) {
        FA.draw.text('Available Missions', contentX, contentY, { color: '#fff', size: 14, bold: true });

        var availMissions = state.availableMissions || [];
        if (availMissions.length === 0) {
          FA.draw.text('No missions available at this station.', contentX, contentY + 30, { color: '#666', size: 12 });
        } else {
          for (var mi = 0; mi < availMissions.length; mi++) {
            var miss = availMissions[mi];
            var mRowY = contentY + 30 + mi * 40;
            var isMSel = state.menuIndex === mi;

            if (isMSel) {
              FA.draw.rect(contentX - 5, mRowY - 3, 600, 36, 'rgba(78,238,255,0.08)');
            }

            FA.draw.text(miss.title, contentX, mRowY, { color: isMSel ? '#fff' : '#ccc', size: 12 });
            FA.draw.text('Reward: ' + miss.reward + 'cr', contentX + 400, mRowY, { color: '#fd4', size: 11 });
            FA.draw.text('Type: ' + miss.type, contentX, mRowY + 16, { color: '#888', size: 10 });
          }
        }

        // Active missions
        var activeMissions = Player.getActiveMissions();
        var activeY = contentY + 30 + Math.max(1, availMissions.length) * 40 + 30;
        FA.draw.text('Active Missions (' + activeMissions.length + '/' + cfg.maxMissions + ')', contentX, activeY, { color: '#4ef', size: 13, bold: true });

        if (activeMissions.length === 0) {
          FA.draw.text('No active missions.', contentX, activeY + 22, { color: '#666', size: 11 });
        } else {
          for (var ai = 0; ai < activeMissions.length; ai++) {
            var am = activeMissions[ai];
            var aRowY = activeY + 22 + ai * 28;
            FA.draw.text(am.title, contentX, aRowY, { color: '#ccc', size: 11 });
            FA.draw.text(am.reward + 'cr', contentX + 400, aRowY, { color: '#fd4', size: 11 });
          }
        }
      }

      // --- Tab 4: Repair ---
      if (state.stationTab === 4) {
        var repairPrice = curSys ? Math.round(5 * (curSys.techLevel > 5 ? 0.7 : 1.3)) : 5;
        var hullNeeded = player.maxHull - player.hull;
        var repairCost = hullNeeded * repairPrice;

        FA.draw.text('Hull Repair', W / 2, contentY + 20, { color: '#fff', size: 16, bold: true, align: 'center' });

        FA.draw.text('Current Hull:', contentX + 100, contentY + 60, { color: '#aaa', size: 12 });
        FA.draw.bar(contentX + 100, contentY + 80, 300, 20, player.hull / player.maxHull, colors.hullBar, '#222');
        FA.draw.text(Math.floor(player.hull) + ' / ' + player.maxHull, contentX + 250, contentY + 84, { color: '#fff', size: 12, align: 'center', baseline: 'top' });

        FA.draw.text('Price per HP: ' + repairPrice + 'cr', contentX + 100, contentY + 120, { color: '#aaa', size: 12 });
        FA.draw.text('Repair cost: ' + repairCost + 'cr', contentX + 100, contentY + 140, { color: '#fd4', size: 12 });

        if (hullNeeded > 0) {
          FA.draw.text('ENTER to repair', W / 2, contentY + 190, { color: '#4ef', size: 14, bold: true, align: 'center' });
        } else {
          FA.draw.text('Hull is pristine', W / 2, contentY + 190, { color: '#4f4', size: 14, align: 'center' });
        }
      }

      // ESC to undock
      FA.draw.text('ESC to undock', W / 2, H - 30, { color: '#888', size: 12, align: 'center', baseline: 'middle' });
    }, 20);

    // ========== LAYER: Combat Background (order 30) ==========
    FA.addLayer('combatBg', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'combat') return;

      var stars = state.starfield;
      var camX = FA.camera.x;
      var camY = FA.camera.y;

      // Starfield with camera offset
      if (stars) {
        for (var i = 0; i < stars.length; i++) {
          var s = stars[i];
          var sx = ((s.x - camX * 0.3) % (W * 3) + W * 3) % (W * 3) - W;
          var sy = ((s.y - camY * 0.3) % (H * 3) + H * 3) % (H * 3) - H;
          if (sx < 0 || sx > W || sy < 0 || sy > H) continue;
          FA.draw.withAlpha(s.brightness * 0.5, function() {
            FA.draw.circle(sx, sy, s.size, colors.starfield);
          });
        }
      }

      // Arena boundary lines (dim)
      var arenaW = cfg.combatArenaWidth;
      var arenaH = cfg.combatArenaHeight;
      FA.draw.withAlpha(0.15, function() {
        FA.draw.strokeRect(-camX, -camY, arenaW, arenaH, '#446', 2);
      });
    }, 30);

    // ========== LAYER: Combat Ships (order 31) ==========
    FA.addLayer('combatShips', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'combat') return;

      var player = Player.getShip();
      var camX = FA.camera.x;
      var camY = FA.camera.y;
      var ctx = FA.getCtx();

      // Draw player ship
      var px = player.x - camX;
      var py = player.y - camY;

      // Engine glow
      if (FA.isHeld('up')) {
        var ceSprite = typeof getSprite === 'function' && getSprite('effects', 'engineFlame');
        if (ceSprite) {
          var ceFrame = Math.floor(Date.now() / 150) % spriteFrames(ceSprite);
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(player.angle);
          drawSprite(ctx, ceSprite, -6, 5, 12, ceFrame);
          ctx.restore();
        } else {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(player.angle);
          ctx.beginPath();
          ctx.arc(0, 12, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#f84';
          ctx.fill();
          ctx.restore();
        }
      }

      // Player ship sprite or fallback triangle
      drawRotatedSprite(ctx, 'player', player.shipTypeId || 'shuttle', px, py, player.angle, SHIP_SIZE, function(c) {
        c.beginPath();
        c.moveTo(0, -12);
        c.lineTo(-8, 8);
        c.lineTo(8, 8);
        c.closePath();
        c.fillStyle = colors.playerShip;
        c.fill();
      });

      // Shield glow
      if (player.shield > 0) {
        var shieldAlpha = (player.shield / player.maxShield) * 0.5;
        FA.draw.withAlpha(shieldAlpha, function() {
          FA.draw.strokeCircle(px, py, 18, colors.shieldBar, 2);
        });
      }

      // Draw enemies
      var enemies = Combat.getEnemies();
      for (var e = 0; e < enemies.length; e++) {
        var en = enemies[e];
        var ex = en.x - camX;
        var ey = en.y - camY;

        // Enemy faction color
        var eColor = colors.enemyShip;
        if (en.faction) {
          var eFac = FA.lookup('factions', en.faction);
          if (eFac) eColor = eFac.color;
        }

        // Enemy sprite or fallback triangle
        var enemySpriteName = en.faction === 'pirates' ? (en.shipType === 'corvette' ? 'pirateHeavy' : 'pirate') :
                              en.faction === 'federation' ? 'militaryPatrol' :
                              en.faction === 'rebels' ? 'rebelFighter' :
                              en.faction === 'scientists' ? 'bountyHunter' : 'pirate';
        drawRotatedSprite(ctx, 'enemies', enemySpriteName, ex, ey, en.angle || 0, SHIP_SIZE, function(c) {
          c.beginPath();
          c.moveTo(0, -10);
          c.lineTo(-7, 7);
          c.lineTo(7, 7);
          c.closePath();
          c.fillStyle = eColor;
          c.fill();
        });

        // Health bar above enemy
        var hpRatio = en.hull / (en.maxHull || 1);
        FA.draw.bar(ex - 15, ey - 20, 30, 4, hpRatio, hpRatio > 0.3 ? '#f84' : '#f44', '#222');

        // Shield indicator
        if (en.shield > 0) {
          var esAlpha = (en.shield / (en.maxShield || 1)) * 0.4;
          FA.draw.withAlpha(esAlpha, function() {
            FA.draw.strokeCircle(ex, ey, 15, '#8ff', 1);
          });
        }
      }
    }, 31);

    // ========== LAYER: Combat Projectiles (order 32) ==========
    FA.addLayer('combatProjectiles', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'combat') return;

      var projectiles = Combat.getProjectiles();
      var camX = FA.camera.x;
      var camY = FA.camera.y;
      var ctx = FA.getCtx();

      for (var i = 0; i < projectiles.length; i++) {
        var p = projectiles[i];
        var px = p.x - camX;
        var py = p.y - camY;

        // Projectile sprite or fallback line
        var projAngle = Math.atan2(p.vx, -p.vy);
        var projName = (p.char === '*') ? 'missile' : 'laser';
        var projSprite = typeof getSprite === 'function' && getSprite('effects', projName);
        if (projSprite) {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(projAngle);
          drawSprite(ctx, projSprite, -PROJ_SIZE / 2, -PROJ_SIZE / 2, PROJ_SIZE);
          ctx.restore();
        } else {
          var len = 4;
          var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          var nx = speed > 0 ? p.vx / speed : 0;
          var ny = speed > 0 ? p.vy / speed : 0;
          ctx.strokeStyle = p.color || '#0ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px - nx * len, py - ny * len);
          ctx.lineTo(px + nx * len, py + ny * len);
          ctx.stroke();
        }
      }
    }, 32);

    // ========== LAYER: Combat Effects (order 33) ==========
    FA.addLayer('combatEffects', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'combat') return;

      var effects = FA.getEffects();
      var camX = FA.camera.x;
      var camY = FA.camera.y;

      var ctx = FA.getCtx();
      for (var i = 0; i < effects.length; i++) {
        var eff = effects[i];
        var ex = (eff.x || 0) - camX;
        var ey = (eff.y || 0) - camY;
        var alpha = FA.clamp(eff.life / (eff.maxLife || 1000), 0, 1);

        if (eff.type === 'explosion' || eff.radius) {
          var explSprite = typeof getSprite === 'function' && getSprite('effects', 'explosion');
          if (explSprite) {
            var explFrame = alpha > 0.5 ? 0 : 1;
            var explSize = 16 + (1 - alpha) * 24;
            FA.draw.withAlpha(alpha, function() {
              drawSprite(ctx, explSprite, ex - explSize / 2, ey - explSize / 2, explSize, explFrame);
            });
          } else {
            var radius = (1 - alpha) * (eff.radius || 20);
            FA.draw.withAlpha(alpha, function() {
              FA.draw.circle(ex, ey, radius, eff.color || '#f84');
            });
          }
        } else if (eff.type === 'shieldHit') {
          var shieldSprite = typeof getSprite === 'function' && getSprite('effects', 'shieldHit');
          if (shieldSprite) {
            FA.draw.withAlpha(alpha * 0.6, function() {
              drawSprite(ctx, shieldSprite, ex - 12, ey - 12, 24);
            });
          } else {
            FA.draw.withAlpha(alpha * 0.6, function() {
              FA.draw.strokeCircle(ex, ey, eff.radius || 18, '#4ff', 2);
            });
          }
        } else {
          FA.draw.withAlpha(alpha, function() {
            FA.draw.circle(ex, ey, 2, eff.color || '#fff');
          });
        }
      }

      // Floating damage numbers
      FA.drawFloats();
    }, 33);

    // ========== LAYER: HUD (order 40) ==========
    FA.addLayer('hud', function() {
      var state = FA.getState();
      if (state.screen !== 'playing') return;

      var player = Player.getShip();
      var curSys = Galaxy.getSystem(player.currentSystem);

      // Top-left: system name + economy
      if (curSys) {
        FA.draw.text(curSys.name, 15, 12, { color: colors.hudBright, size: 12, bold: true });
        FA.draw.text(curSys.economy, 15, 28, { color: colors.hud, size: 10 });
      }

      // Top-right: credits
      FA.draw.text(player.credits + ' cr', W - 15, 12, { color: colors.credits, size: 14, bold: true, align: 'right' });

      // Bottom-left: status bars
      var barX = 15;
      var barW = 100;
      var barH = 8;

      // Hull bar
      FA.draw.text('HULL', barX, H - 65, { color: colors.hullBar, size: 9 });
      FA.draw.bar(barX + 35, H - 65, barW, barH, player.hull / player.maxHull, colors.hullBar, '#222');

      // Shield bar
      FA.draw.text('SHLD', barX, H - 50, { color: colors.shieldBar, size: 9 });
      FA.draw.bar(barX + 35, H - 50, barW, barH, player.shield / player.maxShield, colors.shieldBar, '#222');

      // Fuel bar
      FA.draw.text('FUEL', barX, H - 35, { color: colors.fuelBar, size: 9 });
      FA.draw.bar(barX + 35, H - 35, barW, barH, player.fuel / player.maxFuel, colors.fuelBar, '#222');

      // Bottom-right: cargo + mission hint
      FA.draw.text('Cargo: ' + Player.getCargoUsed() + '/' + player.maxCargo, W - 15, H - 50, { color: colors.hud, size: 11, align: 'right' });

      var missions = Player.getActiveMissions();
      if (missions.length > 0) {
        FA.draw.text(missions[0].title, W - 15, H - 32, { color: '#c8b4ff', size: 10, align: 'right' });
      }

      // Control hints per view
      var hint = '';
      if (state.view === 'galaxy_map') hint = 'Arrows: select system | ENTER: jump | M: close map';
      else if (state.view === 'system_view') hint = 'WASD: fly | SPACE: dock (near station) | M: galaxy map';
      else if (state.view === 'combat') hint = 'WASD: fly | SPACE: shoot | F: flee';
      else if (state.view === 'station') hint = '1-5: tabs | Arrows: navigate | ENTER: buy | ESC: sell/undock';
      if (hint) {
        FA.draw.text(hint, W / 2, H - 12, { color: '#556', size: 10, align: 'center' });
      }
    }, 40);

    // ========== LAYER: Narrative Bar (order 45) ==========
    FA.addLayer('narrativeBar', function() {
      var state = FA.getState();
      if (state.screen !== 'playing') return;
      if (!state.narrativeMessage || state.narrativeMessage.life <= 0) return;

      var msg = state.narrativeMessage;
      var alpha = FA.clamp(msg.life / msg.maxLife, 0, 1);

      FA.draw.withAlpha(0.7 * alpha, function() {
        FA.draw.rect(0, 0, W, 40, '#000');
      });

      FA.draw.withAlpha(alpha, function() {
        FA.draw.text(msg.text, W / 2, 20, {
          color: msg.color || colors.narrative,
          size: 14,
          align: 'center',
          baseline: 'middle'
        });
      });
    }, 45);

    // ========== LAYER: Game Over Screen (order 50) ==========
    FA.addLayer('gameOverScreen', function() {
      var state = FA.getState();
      if (state.screen !== 'victory' && state.screen !== 'defeat') return;

      var player = Player.getShip();
      var scoring = FA.lookup('config', 'scoring');

      // Overlay
      FA.draw.withAlpha(0.85, function() {
        FA.draw.rect(0, 0, W, H, '#000');
      });

      // Title
      var isVictory = state.screen === 'victory';
      var titleText = isVictory ? 'VICTORY' : 'DEFEAT';
      var titleColor = isVictory ? '#4f4' : '#f44';
      FA.draw.text(titleText, W / 2, 150, { color: titleColor, size: 30, bold: true, align: 'center', baseline: 'middle' });

      // Score breakdown
      var visited = Object.keys(Player.getVisitedSystems()).length;
      var minutes = Math.floor(player.gameTime / 60000);
      var hasArtifact = FA.narrative && FA.narrative.getVar && FA.narrative.getVar('artifact_delivered');

      var tradeScore = player.creditsEarned * scoring.creditMultiplier;
      var systemScore = visited * scoring.systemsVisitedMultiplier;
      var missionScore = player.missionsCompleted * scoring.missionsCompletedMultiplier;
      var killScore = player.kills * scoring.killMultiplier;
      var survivalScore = minutes * scoring.survivalPerMinute;
      var artifactScore = hasArtifact ? scoring.artifactBonus : 0;
      var totalScore = tradeScore + systemScore + missionScore + killScore + survivalScore + artifactScore;

      var scoreY = 230;
      var lineH = 25;
      var leftX = W / 2 - 180;
      var rightX = W / 2 + 180;

      var lines = [
        { label: 'Trade profit: ' + player.creditsEarned + ' x ' + scoring.creditMultiplier, value: tradeScore, color: '#fd4' },
        { label: 'Systems visited: ' + visited + ' x ' + scoring.systemsVisitedMultiplier, value: systemScore, color: '#4af' },
        { label: 'Missions completed: ' + player.missionsCompleted + ' x ' + scoring.missionsCompletedMultiplier, value: missionScore, color: '#c8b4ff' },
        { label: 'Kills: ' + player.kills + ' x ' + scoring.killMultiplier, value: killScore, color: '#f84' },
        { label: 'Survival: ' + minutes + ' min x ' + scoring.survivalPerMinute, value: survivalScore, color: '#4f4' }
      ];

      if (hasArtifact) {
        lines.push({ label: 'Artifact bonus', value: '+' + artifactScore, color: '#f4f' });
      }

      for (var li = 0; li < lines.length; li++) {
        var line = lines[li];
        FA.draw.text(line.label, leftX, scoreY + li * lineH, { color: line.color, size: 13 });
        FA.draw.text('= ' + line.value, rightX, scoreY + li * lineH, { color: '#fff', size: 13, align: 'right' });
      }

      // Total
      var totalY = scoreY + lines.length * lineH + 15;
      FA.draw.rect(leftX, totalY - 5, rightX - leftX, 2, '#555');
      FA.draw.text('TOTAL', leftX, totalY + 5, { color: '#fff', size: 16, bold: true });
      FA.draw.text(String(totalScore), rightX, totalY + 5, { color: titleColor, size: 16, bold: true, align: 'right' });

      // Narrative ending text
      var currentNodeId = FA.narrative ? FA.narrative.currentNode : null;
      if (currentNodeId) {
        var narText = FA.lookup('narrativeText', currentNodeId);
        if (narText) {
          FA.draw.text(narText.text, W / 2, totalY + 55, { color: narText.color, size: 13, align: 'center' });
        }
      }

      // Restart prompt
      if (Date.now() % 1000 < 700) {
        FA.draw.text('[R] to restart', W / 2, 550, { color: '#aaa', size: 14, align: 'center', baseline: 'middle' });
      }
    }, 50);
  }

  // === EXPORT ===
  window.Render = {
    setup: setup
  };
})();
