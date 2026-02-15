// Space Trader — Player
// Player state, ship, cargo, fuel, credits, reputation, missions
// Exports: window.Player
(function() {
  'use strict';
  var FA = window.FA;

  var _player = null;

  // === INITIALIZATION ===
  // Create player with starter shuttle, starting credits, full fuel

  function init() {
    var cfg = FA.lookup('config', 'game');
    var shipType = FA.lookup('shipTypes', 'shuttle');

    _player = {
      shipTypeId: 'shuttle',
      hull: shipType.maxHull,
      maxHull: shipType.maxHull,
      shield: shipType.maxShield,
      maxShield: shipType.maxShield,
      fuel: cfg.startFuel,
      maxFuel: shipType.maxFuel,
      maxCargo: shipType.maxCargo,
      speed: shipType.speed,
      turnSpeed: shipType.turnSpeed,
      weapons: ['laser'],       // equipped weapon IDs (max = weaponSlots)
      weaponSlots: shipType.weaponSlots,
      cargo: [],                // [{ id, name, quantity }]
      credits: cfg.startCredits,
      creditsEarned: 0,         // total earned from trade (for scoring)
      currentSystem: 0,         // system ID
      visitedSystems: {},       // { systemId: true }
      reputation: {},           // { factionId: number (-100..100) }
      missions: [],             // active missions (max 3)
      missionsCompleted: 0,
      kills: 0,
      gameTime: 0,

      // Combat state (used in system view)
      x: 0, y: 0,
      vx: 0, vy: 0,
      angle: 0,
      angVel: 0
    };

    // Initialize reputations at 0
    var factions = FA.lookupAll('factions');
    for (var fid in factions) {
      _player.reputation[fid] = 0;
    }

    _player.visitedSystems[0] = true;
  }

  // === SHIP ACCESS ===

  function getShip() {
    return _player;
  }

  function getCurrentSystem() {
    return _player.currentSystem;
  }

  function getVisitedSystems() {
    return _player.visitedSystems;
  }

  function getCredits() {
    return _player.credits;
  }

  // === CREDITS ===

  function addCredits(amount, reason) {
    _player.credits += amount;
    if (amount > 0) _player.creditsEarned += amount;
    FA.emit('credits:changed', { amount: amount, reason: reason, total: _player.credits });
  }

  // === CARGO ===

  function getCargo() {
    return _player.cargo;
  }

  function getCargoUsed() {
    var total = 0;
    for (var i = 0; i < _player.cargo.length; i++) {
      total += _player.cargo[i].quantity;
    }
    return total;
  }

  // Buy commodity at station. Returns true if successful.
  function buyCommodity(commodityId, quantity, pricePerUnit) {
    var commodity = FA.lookup('commodities', commodityId);
    if (!commodity) return false;

    var totalCost = pricePerUnit * quantity;
    if (_player.credits < totalCost) return false;
    if (getCargoUsed() + quantity > _player.maxCargo) return false;

    _player.credits -= totalCost;

    // Add to existing cargo or create new entry
    var found = false;
    for (var i = 0; i < _player.cargo.length; i++) {
      if (_player.cargo[i].id === commodityId) {
        _player.cargo[i].quantity += quantity;
        found = true;
        break;
      }
    }
    if (!found) {
      _player.cargo.push({ id: commodityId, name: commodity.name, quantity: quantity });
    }

    FA.emit('trade:buy', { commodity: commodityId, quantity: quantity, price: totalCost });
    return true;
  }

  // Sell commodity at station. Returns true if successful.
  function sellCommodity(commodityId, quantity, pricePerUnit) {
    for (var i = 0; i < _player.cargo.length; i++) {
      if (_player.cargo[i].id === commodityId && _player.cargo[i].quantity >= quantity) {
        var revenue = pricePerUnit * quantity;
        _player.cargo[i].quantity -= quantity;
        if (_player.cargo[i].quantity <= 0) _player.cargo.splice(i, 1);

        addCredits(revenue, 'trade');
        FA.emit('trade:sell', { commodity: commodityId, quantity: quantity, price: revenue });
        return true;
      }
    }
    return false;
  }

  // === FUEL ===

  function refuel(amount, pricePerUnit) {
    var canBuy = Math.min(amount, _player.maxFuel - _player.fuel);
    var cost = canBuy * pricePerUnit;
    if (_player.credits < cost) {
      canBuy = Math.floor(_player.credits / pricePerUnit);
      cost = canBuy * pricePerUnit;
    }
    if (canBuy <= 0) return false;

    _player.credits -= cost;
    _player.fuel += canBuy;
    return true;
  }

  // === NAVIGATION ===

  function jumpTo(systemId) {
    var fuelCost = Galaxy.fuelForJump(_player.currentSystem, systemId);
    if (_player.fuel < fuelCost) return false;

    _player.fuel -= fuelCost;
    _player.currentSystem = systemId;
    _player.visitedSystems[systemId] = true;

    FA.emit('jump:complete', { systemId: systemId, fuelUsed: fuelCost });
    FA.playSound('jump');
    return true;
  }

  // === REPUTATION ===

  function getReputation(factionId) {
    return _player.reputation[factionId] || 0;
  }

  function changeReputation(factionId, delta, reason) {
    if (!_player.reputation.hasOwnProperty(factionId)) return;
    _player.reputation[factionId] = FA.clamp(_player.reputation[factionId] + delta, -100, 100);
    FA.emit('reputation:changed', { faction: factionId, delta: delta, reason: reason, value: _player.reputation[factionId] });
  }

  // === MISSIONS ===

  function acceptMission(mission) {
    var cfg = FA.lookup('config', 'game');
    if (_player.missions.length >= cfg.maxMissions) return false;

    mission.id = FA.uid();
    mission.startTime = _player.gameTime;
    _player.missions.push(mission);

    FA.emit('mission:accepted', mission);
    return true;
  }

  function completeMission(missionId) {
    for (var i = 0; i < _player.missions.length; i++) {
      if (_player.missions[i].id === missionId) {
        var mission = _player.missions.splice(i, 1)[0];
        addCredits(mission.reward, 'mission');
        if (mission.repFaction) changeReputation(mission.repFaction, mission.repDelta || 10, 'mission');
        _player.missionsCompleted++;

        FA.emit('mission:completed', mission);
        return true;
      }
    }
    return false;
  }

  function failMission(missionId) {
    for (var i = 0; i < _player.missions.length; i++) {
      if (_player.missions[i].id === missionId) {
        var mission = _player.missions.splice(i, 1)[0];
        if (mission.repFaction) changeReputation(mission.repFaction, -(mission.repDelta || 5), 'mission_failed');
        FA.emit('mission:failed', mission);
        return true;
      }
    }
    return false;
  }

  function getActiveMissions() {
    return _player.missions;
  }

  // === SHIP UPGRADES ===

  function buyShip(shipTypeId) {
    var newType = FA.lookup('shipTypes', shipTypeId);
    if (!newType) return false;

    // Trade-in: current ship at 50% of its original price
    var currentType = FA.lookup('shipTypes', _player.shipTypeId);
    var tradeIn = Math.floor((currentType.price || 0) * 0.5);
    var cost = newType.price - tradeIn;

    if (_player.credits < cost) return false;

    _player.credits -= cost;
    _player.shipTypeId = shipTypeId;
    _player.hull = newType.maxHull;
    _player.maxHull = newType.maxHull;
    _player.shield = newType.maxShield;
    _player.maxShield = newType.maxShield;
    _player.maxFuel = newType.maxFuel;
    _player.fuel = Math.min(_player.fuel, newType.maxFuel);
    _player.maxCargo = newType.maxCargo;
    _player.speed = newType.speed;
    _player.turnSpeed = newType.turnSpeed;
    _player.weaponSlots = newType.weaponSlots;

    // Drop weapons that exceed new slot count
    while (_player.weapons.length > newType.weaponSlots) {
      _player.weapons.pop();
    }

    // Drop cargo that exceeds new capacity
    while (getCargoUsed() > newType.maxCargo && _player.cargo.length > 0) {
      _player.cargo.pop();
    }

    return true;
  }

  function buyWeapon(weaponTypeId, slot) {
    var weapon = FA.lookup('weaponTypes', weaponTypeId);
    if (!weapon) return false;
    if (slot >= _player.weaponSlots) return false;
    if (_player.credits < weapon.price) return false;

    _player.credits -= weapon.price;
    _player.weapons[slot] = weaponTypeId;
    return true;
  }

  // === DAMAGE ===

  function takeDamage(amount) {
    // Shield absorbs first
    if (_player.shield > 0) {
      var shieldDmg = Math.min(amount, _player.shield);
      _player.shield -= shieldDmg;
      amount -= shieldDmg;
    }
    _player.hull -= amount;

    FA.emit('entity:damaged', { entity: 'player', damage: amount });

    if (_player.hull <= 0) {
      _player.hull = 0;
      FA.emit('entity:killed', { entity: 'player' });
      return true; // dead
    }
    return false;
  }

  function repairHull(amount, pricePerUnit) {
    var canRepair = Math.min(amount, _player.maxHull - _player.hull);
    var cost = canRepair * pricePerUnit;
    if (_player.credits < cost) {
      canRepair = Math.floor(_player.credits / pricePerUnit);
      cost = canRepair * pricePerUnit;
    }
    if (canRepair <= 0) return false;

    _player.credits -= cost;
    _player.hull += canRepair;
    return true;
  }

  function rechargeShield(dt) {
    var cfg = FA.lookup('config', 'game');
    _player.shield = Math.min(_player.maxShield, _player.shield + cfg.shieldRechargeRate * dt);
  }

  // === SCORING ===

  function computeScore() {
    var scoring = FA.lookup('config', 'scoring');
    var visited = Object.keys(_player.visitedSystems).length;
    var minutes = Math.floor(_player.gameTime / 60000);

    var score = (_player.creditsEarned * scoring.creditMultiplier)
              + (visited * scoring.systemsVisitedMultiplier)
              + (_player.missionsCompleted * scoring.missionsCompletedMultiplier)
              + (_player.kills * scoring.killMultiplier)
              + (minutes * scoring.survivalPerMinute);

    if (FA.narrative && FA.narrative.getVar('artifact_delivered')) {
      score += scoring.artifactBonus;
    }

    return score;
  }

  // === EXPORT ===
  window.Player = {
    init: init,
    getShip: getShip,
    getCurrentSystem: getCurrentSystem,
    getVisitedSystems: getVisitedSystems,
    getCredits: getCredits,
    addCredits: addCredits,
    getCargo: getCargo,
    getCargoUsed: getCargoUsed,
    buyCommodity: buyCommodity,
    sellCommodity: sellCommodity,
    refuel: refuel,
    jumpTo: jumpTo,
    getReputation: getReputation,
    changeReputation: changeReputation,
    acceptMission: acceptMission,
    completeMission: completeMission,
    failMission: failMission,
    getActiveMissions: getActiveMissions,
    buyShip: buyShip,
    buyWeapon: buyWeapon,
    takeDamage: takeDamage,
    repairHull: repairHull,
    rechargeShield: rechargeShield,
    computeScore: computeScore
  };
})();
