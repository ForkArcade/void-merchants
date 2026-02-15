// Space Trader — Combat
// Real-time combat: weapons, projectiles, shields, damage, AI
// Exports: window.Combat
(function() {
  'use strict';
  var FA = window.FA;

  var _active = false;
  var _enemies = [];
  var _projectiles = [];
  var _context = null;
  var _cooldowns = {};   // weaponSlot -> remaining cooldown ms

  // === START COMBAT ===
  // enemies: [{ shipType, faction, ai, weapons, hull, maxHull, shield, maxShield, x, y, angle, vx, vy }]
  // context: { systemId, reason } — 'pirate_attack', 'faction_hostile', 'mission_combat'
  function start(enemies, context) {
    _active = true;
    _enemies = enemies;
    _projectiles = [];
    _cooldowns = {};
    _context = context;

    // TODO: Position player at center, spread enemies around the arena edges
    // TODO: Initialize enemy states (hull, shield from shipType definitions)
    // TODO: Set ship positions using FA.rand() for varied spawns

    FA.emit('combat:start', { enemies: enemies.length, reason: context.reason });
    FA.playSound('alarm');
  }

  // === MAIN UPDATE ===
  // Called every tick during combat view
  function update(dt) {
    if (!_active) return;

    var cfg = FA.lookup('config', 'game');
    var player = Player.getShip();

    // --- Player input ---
    // Thrust: WASD / arrows (real-time, FA.isHeld)
    // TODO: Apply thrust to player ship based on angle
    // TODO: Apply turn based on left/right input
    // TODO: Fire weapons on shoot action (per-slot cooldown)

    // --- Update cooldowns ---
    for (var slot in _cooldowns) {
      _cooldowns[slot] = Math.max(0, _cooldowns[slot] - dt);
    }

    // --- Update projectiles ---
    // TODO: Move each projectile by speed * direction
    // TODO: Check lifetime, remove expired
    // TODO: Check collision with enemies (player projectiles) and player (enemy projectiles)
    // TODO: On hit: damage shield first, then hull. Emit entity:damaged.
    // TODO: On kill: remove enemy, add loot, increment kills. Emit entity:killed.

    // --- Enemy AI ---
    for (var i = 0; i < _enemies.length; i++) {
      updateEnemyAI(_enemies[i], player, dt);
    }

    // --- Shield recharge ---
    Player.rechargeShield(dt);

    // --- Check win/lose ---
    if (_enemies.length === 0) {
      end(true);
    }
    if (player.hull <= 0) {
      end(false);
    }
  }

  // === ENEMY AI ===
  // Patterns: 'aggressive' (charge + fire), 'defensive' (circle + snipe), 'coward' (flee when hurt)
  function updateEnemyAI(enemy, player, dt) {
    // TODO: Calculate angle to player: atan2(player.x - enemy.x, -(player.y - enemy.y))
    // TODO: Rotate towards player (turn speed based on ship type)
    // TODO: Based on AI pattern:
    //   'aggressive': fly toward player, fire when aimed (< 0.3 rad) and close (< 300px)
    //   'defensive': maintain 200px distance, circle, fire when aimed
    //   'coward': flee when shield < 20%, otherwise aggressive
    // TODO: Update position with velocity + friction
    // TODO: Fire projectiles (3x longer cooldown than player)
  }

  // === PROJECTILE ===

  function spawnProjectile(shooter, weaponTypeId, isPlayer) {
    var weapon = FA.lookup('weaponTypes', weaponTypeId);
    if (!weapon) return;

    _projectiles.push({
      x: shooter.x + Math.sin(shooter.angle) * 20,
      y: shooter.y - Math.cos(shooter.angle) * 20,
      vx: Math.sin(shooter.angle) * weapon.speed,
      vy: -Math.cos(shooter.angle) * weapon.speed,
      damage: weapon.damage,
      color: weapon.color,
      life: weapon.range,
      isPlayer: isPlayer,
      char: weapon.char
    });

    FA.playSound(weaponTypeId === 'cannon' ? 'cannon' : 'laser');
  }

  // === COLLISION ===

  function checkCollisions() {
    // TODO: For each projectile:
    //   If isPlayer: check against each enemy (radius 20px)
    //   If !isPlayer: check against player ship (radius 20px)
    //   On hit: apply damage, remove projectile, add float text, emit event
  }

  // === END COMBAT ===

  function end(victory) {
    _active = false;

    if (victory) {
      // TODO: Calculate loot: random credits + random cargo from killed enemies
      // TODO: Add reputation change based on faction of killed enemies
      // TODO: Check if pirate_king killed for narrative
      FA.emit('combat:end', { victory: true, kills: _context.kills || 0 });
    } else {
      FA.emit('combat:end', { victory: false });
    }
  }

  // === FLEE ===
  // Attempt escape: compare player speed to average enemy speed
  // Costs fuel, chance based on speed ratio

  function flee() {
    var cfg = FA.lookup('config', 'game');
    var player = Player.getShip();

    if (player.fuel < cfg.fleeFuelCost) return false;

    var avgEnemySpeed = 0;
    for (var i = 0; i < _enemies.length; i++) {
      var etype = FA.lookup('shipTypes', _enemies[i].shipType);
      avgEnemySpeed += (etype ? etype.speed : 3);
    }
    avgEnemySpeed /= Math.max(1, _enemies.length);

    var chance = player.speed / (player.speed + avgEnemySpeed);
    if (Math.random() < chance) {
      player.fuel -= cfg.fleeFuelCost;
      _active = false;
      FA.emit('combat:end', { victory: false, fled: true });
      return true;
    }

    FA.addFloat(player.x, player.y - 30, 'ESCAPE FAILED', '#f44', 1000);
    return false;
  }

  // === ACCESS ===

  function isActive() { return _active; }
  function getEnemies() { return _enemies; }
  function getProjectiles() { return _projectiles; }

  // === EXPORT ===
  window.Combat = {
    start: start,
    update: update,
    isActive: isActive,
    end: end,
    flee: flee,
    spawnProjectile: spawnProjectile,
    getEnemies: getEnemies,
    getProjectiles: getProjectiles
  };
})();
