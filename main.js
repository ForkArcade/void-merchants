// Space Trader — Entry Point
// Keybindings, view state machine, game loop, ForkArcade integration
(function() {
  'use strict';
  var FA = window.FA;
  var cfg = FA.lookup('config', 'game');
  var colors = FA.lookup('config', 'colors');

  FA.initCanvas('game', cfg.canvasWidth, cfg.canvasHeight);

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

  // === GAME START ===
  function startGame() {
    Galaxy.init(cfg.galaxySeed);
    Player.init();

    FA.resetState({
      screen: 'playing',
      view: 'galaxy_map',
      gameTime: 0,
      selectedSystem: null,
      stationTab: 0,
      menuIndex: 0,
      narrativeMessage: null,
      starfield: generateStarfield(200)
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
        x: FA.rand(0, cfg.canvasWidth * 3),
        y: FA.rand(0, cfg.canvasHeight * 3),
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.5
      });
    }
    return stars;
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
      // TODO: Arrow keys / click to select system
      // TODO: ENTER to jump to selected system (if connected and enough fuel)
      // TODO: ESC to switch to system view (if already in a system)
      if (data.action === 'back') {
        state.view = 'system_view';
      }
      if (data.action === 'confirm' && state.selectedSystem != null) {
        if (Player.jumpTo(state.selectedSystem)) {
          state.view = 'system_view';
          state.selectedSystem = null;

          // Narrative triggers
          var visited = Object.keys(Player.getVisitedSystems()).length;
          if (visited === 2) showNarrative('first_jump');
          if (visited === 5) showNarrative('trader_life');
        }
      }
    }

    // --- System View ---
    else if (state.view === 'system_view') {
      if (data.action === 'map') {
        state.view = 'galaxy_map';
      }
      if (data.action === 'confirm') {
        // TODO: If near a station, dock
        // state.view = 'station';
        // state.stationTab = 0;
        // state.menuIndex = 0;
        // FA.playSound('dock');
      }
    }

    // --- Station ---
    else if (state.view === 'station') {
      if (data.action === 'back') {
        state.view = 'system_view';
      }
      // Tab switching
      if (data.action === 'tab1') state.stationTab = 0;
      if (data.action === 'tab2') state.stationTab = 1;
      if (data.action === 'tab3') state.stationTab = 2;
      if (data.action === 'tab4') state.stationTab = 3;
      if (data.action === 'tab5') state.stationTab = 4;

      // TODO: Menu navigation with up/down
      // TODO: Confirm action (buy/sell/accept) with ENTER
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
    player.gameTime += dt;

    // --- View-specific updates ---

    if (state.view === 'galaxy_map') {
      // TODO: Handle click-based system selection
      // TODO: Keyboard-based system selection (up/down/left/right through connected systems)
    }

    if (state.view === 'system_view') {
      // TODO: Player ship movement (WASD, real-time: FA.isHeld)
      //   Apply thrust forward/backward
      //   Apply rotation left/right
      //   Update position: x += vx, y += vy
      //   Apply friction: vx *= 0.98, vy *= 0.98

      // TODO: Check proximity to stations for dock prompt
      // TODO: Random encounters (pirates based on system danger level)
      //   If encounter triggered: Combat.start(enemies, context)
      //   state.view = 'combat';
    }

    if (state.view === 'station') {
      // Station is menu-based, no real-time update needed
    }

    if (state.view === 'combat') {
      Combat.update(dt);

      // Check if combat ended
      if (!Combat.isActive()) {
        // TODO: Handle victory/defeat
        //   Victory: return to system view, show loot
        //   Defeat: check if player dead -> game over
        if (player.hull <= 0) {
          showNarrative('defeat');
          state.screen = 'defeat';
          var score = Player.computeScore();
          FA.emit('game:over', { victory: false, score: score });
        } else {
          state.view = 'system_view';
        }
      }
    }

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
    // TODO: Check active missions for expiration, auto-fail if timed out

    // --- Stranded check ---
    // TODO: If fuel = 0 and no station in current system and no reachable systems:
    //   showNarrative('defeat');
    //   state.screen = 'defeat';
    //   FA.emit('game:over', { victory: false, score: Player.computeScore() });

    // --- Narrative sync ---
    if (typeof ForkArcade !== 'undefined' && FA.narrative) {
      ForkArcade.updateNarrative({
        variables: FA.narrative.getVar ? undefined : undefined, // TODO: pass current variables
        currentNode: FA.narrative.getNode(),
        graph: FA.lookup('config', 'narrative').graph,
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
