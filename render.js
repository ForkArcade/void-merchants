// Space Trader — Rendering
// All render layers: start screen, galaxy map, system view, station menus, combat, HUD, narrative, game over
// Exports: window.Render
(function() {
  'use strict';
  var FA = window.FA;

  function setup() {
    var cfg = FA.lookup('config', 'game');
    var colors = FA.lookup('config', 'colors');
    var W = cfg.canvasWidth;
    var H = cfg.canvasHeight;

    // ========== LAYER: Start Screen (order 0) ==========
    // Title: "SPACE TRADER"
    // Subtitle: game description
    // Controls summary
    // [SPACE] to begin
    FA.addLayer('startScreen', function() {
      var state = FA.getState();
      if (state.screen !== 'start') return;

      // TODO: Draw title text centered (large, accent color)
      // TODO: Draw subtitle (smaller, dimmer)
      // TODO: Draw controls list:
      //   WASD / Arrows — Navigate / Fly
      //   SPACE / ENTER — Confirm / Shoot
      //   M — Galaxy Map
      //   1-5 — Station Tabs
      //   ESC — Back
      //   F — Flee (combat)
      // TODO: Draw blinking "[SPACE] to begin" prompt
      // TODO: Optional — starfield background animation
    }, 0);

    // ========== LAYER: Galaxy Map Background (order 1) ==========
    // Connections between systems as dim lines
    FA.addLayer('galaxyMapBg', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'galaxy_map') return;

      // TODO: Draw connection lines between systems
      //   For each system, for each connection: draw line from system.x to connected.x
      //   Offset everything to center the galaxy on canvas: ox = W/2, oy = H/2
      //   Scale factor to fit galaxy on screen (~0.7)
      //   Color: colors.connection
    }, 1);

    // ========== LAYER: Galaxy Map Systems (order 2) ==========
    // Systems as circles colored by faction
    // Selected system highlighted
    // Player position marker
    FA.addLayer('galaxyMapSystems', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'galaxy_map') return;

      // TODO: Draw fuel range circle (dashed) around player's current system
      //   Radius = max jumpable distance with current fuel
      //   Color: colors.fuelRange

      // TODO: For each system:
      //   Circle colored by faction (faction.color, or #666 for independent)
      //   Size based on population (3 + population)
      //   System name below the circle (small text)
      //   If selected: highlight ring (colors.selected)

      // TODO: Draw player marker on current system (pulsing or distinct shape)
    }, 2);

    // ========== LAYER: Galaxy Map Info Panel (order 3) ==========
    // Selected system details: name, economy, tech, danger, faction
    // Trade route hints
    FA.addLayer('galaxyMapInfo', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'galaxy_map') return;

      // TODO: If a system is selected (state.selectedSystem != null):
      //   Draw info panel (bottom-right corner, semi-transparent bg)
      //   System name (bold)
      //   Economy type, Tech level, Danger level
      //   Controlling faction (colored)
      //   Distance and fuel cost from current system
      //   "ENTER to jump" or "Out of range" / "Not connected"
    }, 3);

    // ========== LAYER: System View Background (order 10) ==========
    // Starfield + central star
    FA.addLayer('systemViewBg', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'system_view') return;

      // TODO: Draw scrolling starfield (random dots, parallax with camera)
      // TODO: Draw central star (large glowing circle at system center)
    }, 10);

    // ========== LAYER: System View Objects (order 11) ==========
    // Stations, NPC ships, player ship
    FA.addLayer('systemViewObjects', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'system_view') return;

      // TODO: Draw stations as sprites or fallback icons
      //   Position: orbit around star at fixed distances
      //   Show dock prompt when player is nearby

      // TODO: Draw NPC ships (if any in system)
      //   Colored by faction

      // TODO: Draw player ship
      //   Rotated sprite or fallback triangle
      //   ctx.save(); ctx.translate(sx, sy); ctx.rotate(player.angle); draw; ctx.restore();
      //   Engine glow when thrusting
    }, 11);

    // ========== LAYER: Station Menu (order 20) ==========
    // Full-screen overlay when docked
    // 5 tabs: Trade(1) Shipyard(2) Fuel(3) Missions(4) Repair(5)
    FA.addLayer('stationMenu', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'station') return;

      // TODO: Draw semi-transparent background overlay
      // TODO: Draw station name header
      // TODO: Draw 5 tab buttons at top (highlight active tab)
      //   Tab 1: Trade — commodity list with buy/sell prices
      //     Columns: Name | Buy Price | Sell Price | Stock | Cargo | [Buy] [Sell]
      //     Color code: profit green, loss red
      //     Arrow keys to navigate rows, ENTER to buy/sell
      //   Tab 2: Shipyard — available ships + weapons
      //     Ship list: Name | Hull | Shield | Cargo | Fuel | Speed | Weapons | Price
      //     Current ship highlighted
      //     Weapon list below
      //   Tab 3: Fuel — refuel slider
      //     Current fuel / max fuel bar
      //     Price per unit (varies by system economy)
      //     ENTER to refuel to max
      //   Tab 4: Missions — available missions from local factions
      //     List: Type | Destination | Reward | Faction | Deadline
      //     ENTER to accept (max 3 active)
      //     Active missions shown below
      //   Tab 5: Repair — hull repair
      //     Current hull / max hull bar
      //     Price per HP
      //     ENTER to repair to max
      // TODO: Draw ESC to undock prompt
    }, 20);

    // ========== LAYER: Combat Arena (order 30) ==========
    // Space background + arena bounds
    FA.addLayer('combatBg', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'combat') return;

      // TODO: Starfield background (scrolls with camera)
      // TODO: Arena boundary indicators (dim lines at edges)
    }, 30);

    // ========== LAYER: Combat Ships (order 31) ==========
    FA.addLayer('combatShips', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'combat') return;

      // TODO: Draw player ship (centered, rotated)
      //   Shield glow circle when shield > 0
      //   Hull damage indicators (cracks/sparks)

      // TODO: Draw enemy ships
      //   Colored by faction
      //   Health bar above each enemy
      //   AI pattern indicator (optional)
    }, 31);

    // ========== LAYER: Combat Projectiles (order 32) ==========
    FA.addLayer('combatProjectiles', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'combat') return;

      // TODO: Draw each projectile as colored line or sprite
      //   Length based on speed, color from weapon definition
    }, 32);

    // ========== LAYER: Combat Effects (order 33) ==========
    FA.addLayer('combatEffects', function() {
      var state = FA.getState();
      if (state.screen !== 'playing' || state.view !== 'combat') return;

      // TODO: Draw explosions, shield hits, engine flames from FA.getEffects()
      // TODO: Draw floating text (damage numbers) from FA.drawFloats()
    }, 33);

    // ========== LAYER: HUD (order 40) ==========
    // Always visible during gameplay
    FA.addLayer('hud', function() {
      var state = FA.getState();
      if (state.screen !== 'playing') return;

      // TODO: Top-left: Current system name + economy
      // TODO: Top-right: Credits (gold color, icon)
      // TODO: Bottom-left:
      //   Hull bar (red)
      //   Shield bar (cyan)
      //   Fuel bar (blue)
      // TODO: Bottom-right:
      //   Cargo: used / max
      //   Active mission hint (if any)
      // TODO: Mini-info for current view:
      //   Galaxy map: "Arrow keys to select, ENTER to jump, M to close"
      //   System view: "WASD to fly, SPACE near station to dock, M for map"
      //   Combat: "WASD to fly, SPACE to shoot, F to flee"
    }, 40);

    // ========== LAYER: Narrative Bar (order 45) ==========
    // Fade-out narrative text at top of screen
    FA.addLayer('narrativeBar', function() {
      var state = FA.getState();
      if (state.screen !== 'playing') return;
      if (!state.narrativeMessage || state.narrativeMessage.life <= 0) return;

      // TODO: Draw narrative text centered at top
      //   Semi-transparent black background bar
      //   Text with color from narrativeText definition
      //   Alpha fades based on remaining life / maxLife
    }, 45);

    // ========== LAYER: Game Over Screen (order 50) ==========
    // Victory or defeat screen with score breakdown
    FA.addLayer('gameOverScreen', function() {
      var state = FA.getState();
      if (state.screen !== 'victory' && state.screen !== 'defeat') return;

      // TODO: Semi-transparent overlay
      // TODO: Title: "VICTORY" (green) or "DEFEAT" (red)
      // TODO: Score breakdown:
      //   Trade profit: X × 1 = Y
      //   Systems visited: X × 50 = Y
      //   Missions completed: X × 200 = Y
      //   Kills: X × 100 = Y
      //   Survival: X min × 10 = Y
      //   Artifact bonus: +5000 (if delivered)
      //   TOTAL: Z
      // TODO: Narrative ending text (from current narrative node)
      // TODO: "[R] to restart"
    }, 50);
  }

  // === EXPORT ===
  window.Render = {
    setup: setup
  };
})();
