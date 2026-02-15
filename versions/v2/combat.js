// Void Merchants — Projectiles & Damage
// Projectile management, collision detection, player shooting
// No combat mode — projectiles exist in the world naturally
// Exports: window.Combat
(function() {
  'use strict';
  var FA = window.FA;

  var _projectiles = [];
  var _cooldowns = {};

  function clearProjectiles() {
    _projectiles = [];
    _cooldowns = {};
  }

  // Player shooting — called every tick
  function updatePlayerShooting(dt, player) {
    // Update cooldowns
    for (var slot in _cooldowns) {
      _cooldowns[slot] = Math.max(0, _cooldowns[slot] - dt);
    }

    if (!FA.isHeld('shoot')) return;

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

  // Update projectiles: move, collisions with player and NPCs
  function updateProjectiles(dt, player, npcs) {
    for (var p = _projectiles.length - 1; p >= 0; p--) {
      var proj = _projectiles[p];
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.life -= 1;

      if (proj.life <= 0) {
        _projectiles.splice(p, 1);
        continue;
      }

      if (proj.isPlayer) {
        // Player projectile → hit NPCs
        for (var ni = npcs.length - 1; ni >= 0; ni--) {
          var npc = npcs[ni];
          var dx = proj.x - npc.x;
          var dy = proj.y - npc.y;
          if (Math.sqrt(dx * dx + dy * dy) < 20) {
            var dmg = proj.damage;
            if (npc.shield > 0) {
              var sa = Math.min(dmg, npc.shield);
              npc.shield -= sa;
              dmg -= sa;
            }
            npc.hull -= dmg;

            FA.addFloat(npc.x, npc.y - 20, '-' + proj.damage, '#f84', 800);
            FA.playSound('hit');
            _projectiles.splice(p, 1);

            // Attacked NPC becomes hostile
            if (!npc.attackedByPlayer) {
              npc.attackedByPlayer = true;
              if (npc.attitude !== 'hostile' && npc.faction) {
                Player.changeReputation(npc.faction, -5, 'attacked_ship');
              }
              npc.attitude = 'hostile';
            }

            // Kill check
            if (npc.hull <= 0) {
              FA.playSound('explosion');
              FA.addEffect({ x: npc.x, y: npc.y, life: 500, onUpdate: function(eff) { eff.radius = (1 - eff.life / 500) * 30; } });

              var reward = FA.rand(50, 200);
              Player.addCredits(reward, 'combat');
              FA.addFloat(npc.x, npc.y - 30, '+' + reward + ' CR', '#fd4', 1500);

              if (npc.faction) {
                Player.changeReputation(npc.faction, -10, 'killed_ship');
                if (npc.faction === 'pirates') {
                  Player.changeReputation('federation', 3, 'killed_pirate');
                }
              }

              npcs.splice(ni, 1);
              Player.getShip().kills++;
            }
            break;
          }
        }
      } else {
        // NPC projectile → hit player
        var pdx = proj.x - player.x;
        var pdy = proj.y - player.y;
        if (Math.sqrt(pdx * pdx + pdy * pdy) < 20) {
          var dead = Player.takeDamage(proj.damage);
          FA.addFloat(player.x, player.y - 20, '-' + proj.damage, '#f44', 800);
          FA.playSound('hit');
          _projectiles.splice(p, 1);

          if (dead) {
            FA.playSound('explosion');
            FA.addEffect({ x: player.x, y: player.y, life: 800, onUpdate: function(eff) { eff.radius = (1 - eff.life / 800) * 40; } });
          }
        }
      }
    }
  }

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

  function getProjectiles() { return _projectiles; }

  window.Combat = {
    clearProjectiles: clearProjectiles,
    updatePlayerShooting: updatePlayerShooting,
    updateProjectiles: updateProjectiles,
    spawnProjectile: spawnProjectile,
    getProjectiles: getProjectiles
  };
})();
