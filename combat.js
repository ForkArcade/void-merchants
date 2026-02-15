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
  var _enemyCooldowns = []; // per-enemy cooldown timers

  // === START COMBAT ===
  // enemies: [{ shipType, faction, ai, weapons, hull, maxHull, shield, maxShield }]
  // context: { systemId, reason } — 'pirate_attack', 'faction_hostile', 'mission_combat'
  function start(enemies, context) {
    _active = true;
    _projectiles = [];
    _cooldowns = {};
    _context = context || {};
    _context.kills = 0;

    // Position player at center
    var player = Player.getShip();
    player.x = 0;
    player.y = 0;
    player.vx = 0;
    player.vy = 0;
    player.angle = 0;

    // Spread enemies at 400-600px radius around center
    _enemies = [];
    _enemyCooldowns = [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      var shipDef = FA.lookup('shipTypes', e.shipType);
      var spawnAngle = (Math.PI * 2 * i) / enemies.length + (Math.random() - 0.5) * 0.5;
      var spawnDist = FA.rand(400, 600);

      _enemies.push({
        shipType: e.shipType,
        faction: e.faction,
        ai: e.ai || 'aggressive',
        weapons: e.weapons || ['laser'],
        hull: e.hull || (shipDef ? shipDef.maxHull : 30),
        maxHull: e.maxHull || (shipDef ? shipDef.maxHull : 30),
        shield: e.shield || (shipDef ? shipDef.maxShield : 10),
        maxShield: e.maxShield || (shipDef ? shipDef.maxShield : 10),
        speed: shipDef ? shipDef.speed : 3,
        turnSpeed: shipDef ? shipDef.turnSpeed : 0.04,
        x: Math.sin(spawnAngle) * spawnDist,
        y: -Math.cos(spawnAngle) * spawnDist,
        vx: 0,
        vy: 0,
        angle: spawnAngle + Math.PI, // face center
        cooldown: 0
      });
      _enemyCooldowns.push(0);
    }

    FA.emit('combat:start', { enemies: _enemies.length, reason: _context.reason });
    FA.playSound('alarm');
  }

  // === MAIN UPDATE ===
  // Called every tick during combat view
  function update(dt) {
    if (!_active) return;

    var player = Player.getShip();

    // --- Player input ---
    // Turn
    if (FA.isHeld('left')) {
      player.angle -= player.turnSpeed * dt;
    }
    if (FA.isHeld('right')) {
      player.angle += player.turnSpeed * dt;
    }

    // Thrust
    if (FA.isHeld('up')) {
      player.vx += Math.sin(player.angle) * player.speed * 0.04;
      player.vy -= Math.cos(player.angle) * player.speed * 0.04;
    }

    // Friction
    player.vx *= 0.99;
    player.vy *= 0.99;

    // Position
    player.x += player.vx;
    player.y += player.vy;

    // --- Player shooting ---
    if (FA.isHeld('shoot')) {
      for (var w = 0; w < player.weapons.length; w++) {
        var weaponId = player.weapons[w];
        var slotKey = 'p_' + w;
        if (!_cooldowns[slotKey]) _cooldowns[slotKey] = 0;
        if (_cooldowns[slotKey] <= 0) {
          var weapon = FA.lookup('weaponTypes', weaponId);
          if (weapon) {
            spawnProjectile(player, weaponId, true);
            _cooldowns[slotKey] = weapon.cooldown;
          }
        }
      }
    }

    // --- Update cooldowns ---
    for (var slot in _cooldowns) {
      _cooldowns[slot] = Math.max(0, _cooldowns[slot] - dt);
    }

    // --- Update projectiles ---
    for (var p = _projectiles.length - 1; p >= 0; p--) {
      var proj = _projectiles[p];
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.life -= 1;

      if (proj.life <= 0) {
        _projectiles.splice(p, 1);
        continue;
      }

      // Collision detection
      if (proj.isPlayer) {
        // Check against enemies
        for (var ei = _enemies.length - 1; ei >= 0; ei--) {
          var enemy = _enemies[ei];
          var dx = proj.x - enemy.x;
          var dy = proj.y - enemy.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 20) {
            // Apply damage: shield first, then hull
            var dmg = proj.damage;
            if (enemy.shield > 0) {
              var shieldAbsorb = Math.min(dmg, enemy.shield);
              enemy.shield -= shieldAbsorb;
              dmg -= shieldAbsorb;
            }
            enemy.hull -= dmg;

            FA.emit('entity:damaged', { entity: 'enemy', faction: enemy.faction, damage: proj.damage });
            FA.addFloat(enemy.x, enemy.y - 20, '-' + proj.damage, '#f84', 800);
            FA.playSound('hit');

            // Remove projectile
            _projectiles.splice(p, 1);

            // Check kill
            if (enemy.hull <= 0) {
              FA.emit('entity:killed', { entity: 'enemy', faction: enemy.faction, shipType: enemy.shipType });
              FA.playSound('explosion');

              // Explosion effect
              FA.addEffect({
                x: enemy.x,
                y: enemy.y,
                life: 500,
                onUpdate: function(eff, eDt) {
                  eff.radius = (1 - eff.life / 500) * 30;
                }
              });

              _enemies.splice(ei, 1);
              _enemyCooldowns.splice(ei, 1);
              _context.kills = (_context.kills || 0) + 1;
            }
            break;
          }
        }
      } else {
        // Enemy projectile: check against player
        var pdx = proj.x - player.x;
        var pdy = proj.y - player.y;
        var pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (pdist < 20) {
          var dead = Player.takeDamage(proj.damage);
          FA.addFloat(player.x, player.y - 20, '-' + proj.damage, '#f44', 800);
          FA.playSound('hit');

          _projectiles.splice(p, 1);

          if (dead) {
            FA.playSound('explosion');
            FA.addEffect({
              x: player.x,
              y: player.y,
              life: 800,
              onUpdate: function(eff, eDt) {
                eff.radius = (1 - eff.life / 800) * 40;
              }
            });
          }
        }
      }
    }

    // --- Enemy AI ---
    for (var i = 0; i < _enemies.length; i++) {
      updateEnemyAI(_enemies[i], player, dt, i);
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
  function updateEnemyAI(enemy, player, dt, index) {
    // Calculate desired angle to player
    var desiredAngle = Math.atan2(player.x - enemy.x, -(player.y - enemy.y));

    // Calculate angle difference (shortest path)
    var angleDiff = desiredAngle - enemy.angle;
    // Normalize to -PI..PI
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    var turnAmount = enemy.turnSpeed * dt;
    var distToPlayer = Math.sqrt(
      (player.x - enemy.x) * (player.x - enemy.x) +
      (player.y - enemy.y) * (player.y - enemy.y)
    );
    var absAngleDiff = Math.abs(angleDiff);

    var shouldThrust = false;
    var shouldFire = false;
    var aiType = enemy.ai;

    // Coward switches to flee mode when hurt
    if (aiType === 'coward' && enemy.hull < enemy.maxHull * 0.3) {
      // Flee: turn AWAY from player and thrust
      var fleeAngle = desiredAngle + Math.PI;
      var fleeDiff = fleeAngle - enemy.angle;
      while (fleeDiff > Math.PI) fleeDiff -= Math.PI * 2;
      while (fleeDiff < -Math.PI) fleeDiff += Math.PI * 2;

      if (fleeDiff > turnAmount) {
        enemy.angle += turnAmount;
      } else if (fleeDiff < -turnAmount) {
        enemy.angle -= turnAmount;
      } else {
        enemy.angle = fleeAngle;
      }
      shouldThrust = true;
      shouldFire = false;
    } else {
      // Rotate toward player (for all non-fleeing modes)
      if (angleDiff > turnAmount) {
        enemy.angle += turnAmount;
      } else if (angleDiff < -turnAmount) {
        enemy.angle -= turnAmount;
      } else {
        enemy.angle = desiredAngle;
      }

      if (aiType === 'aggressive' || (aiType === 'coward' && enemy.hull >= enemy.maxHull * 0.3)) {
        // Fly toward player
        shouldThrust = distToPlayer > 80;
        // Fire when aimed and close
        shouldFire = absAngleDiff < 0.3 && distToPlayer < 350;
      } else if (aiType === 'defensive') {
        // Try to keep ~200px distance
        if (distToPlayer > 250) {
          shouldThrust = true;
        } else if (distToPlayer < 150) {
          // Back off: add perpendicular movement (circling)
          enemy.angle += 0.02 * dt;
          shouldThrust = true;
        } else {
          // Circle at optimal distance
          enemy.angle += 0.015 * dt;
          shouldThrust = true;
        }
        // Fire when aimed
        shouldFire = absAngleDiff < 0.3 && distToPlayer < 400;
      }
    }

    // Apply thrust
    if (shouldThrust) {
      enemy.vx += Math.sin(enemy.angle) * enemy.speed * 0.03;
      enemy.vy -= Math.cos(enemy.angle) * enemy.speed * 0.03;
    }

    // Friction
    enemy.vx *= 0.99;
    enemy.vy *= 0.99;

    // Position
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;

    // Shield recharge (slow)
    enemy.shield = Math.min(enemy.maxShield, enemy.shield + 0.001 * dt);

    // Fire weapons (3x longer cooldown than player)
    enemy.cooldown = Math.max(0, enemy.cooldown - dt);
    if (shouldFire && enemy.cooldown <= 0) {
      var weaponId = enemy.weapons[0] || 'laser';
      var weaponDef = FA.lookup('weaponTypes', weaponId);
      if (weaponDef) {
        spawnProjectile(enemy, weaponId, false);
        enemy.cooldown = weaponDef.cooldown * 3;
      }
    }
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

  // === END COMBAT ===

  function end(victory) {
    if (!_active) return;
    _active = false;

    if (victory) {
      var reward = FA.rand(100, 400);
      Player.addCredits(reward, 'combat');
      FA.addFloat(0, -30, '+' + reward + ' CR', '#fd4', 1500);
      FA.emit('combat:end', { victory: true, kills: _context.kills || 0, credits: reward });
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
