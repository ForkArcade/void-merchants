// Space Trader — Galaxy
// Procedural galaxy, star systems, stations, economy simulation
// Exports: window.Galaxy
(function() {
  'use strict';
  var FA = window.FA;

  var _systems = [];
  var _rng = null;
  var _marketTime = 0;

  // === GALAXY INITIALIZATION ===
  // Generate systems from seed, assign factions by territory, create station markets

  function init(seed) {
    var cfg = FA.lookup('config', 'game');
    _rng = FA.createRNG(seed);
    _systems = FA.generateGalaxy(seed, cfg.systemCount);
    _marketTime = 0;

    // Assign factions by proximity to faction "capitals"
    // Pick one system per faction as capital, then assign nearest unowned systems
    // Use faction.systemShare to determine how many systems each faction controls
    var factions = FA.lookupAll('factions');
    var factionIds = Object.keys(factions);

    // TODO: Pick capital systems (spread evenly across galaxy)
    // TODO: Assign remaining systems to nearest faction capital
    // TODO: Leave some systems as 'independent' (no faction)
    // TODO: Create station objects for each system with market inventories
  }

  // === SYSTEM ACCESS ===

  function getSystem(id) {
    return _systems[id] || null;
  }

  function getSystems() {
    return _systems;
  }

  // Returns station data: { name, market: { commodityId: { supply, buyPrice, sellPrice } } }
  function getStation(systemId, stationIndex) {
    // TODO: Generate station data for the given system
    // Station name = system name + station type suffix
    // Market prices = computePrice() for each commodity
    return null;
  }

  function getConnections(systemId) {
    var sys = _systems[systemId];
    return sys ? sys.connections : [];
  }

  // === MARKET SIMULATION ===

  // Price formula:
  //   price = basePrice * economyMod[system.economy] * (0.8 + fluctuation * 0.4) * (1 + danger * 0.05)
  //   fluctuation = sin(marketTime * 0.001 + systemId * 7.3) * 0.5 + 0.5
  function computePrice(commodityId, system) {
    var commodity = FA.lookup('commodities', commodityId);
    if (!commodity) return 0;

    var mod = commodity.economyMod[system.economy] || 1.0;
    var fluctuation = Math.sin(_marketTime * 0.001 + system.id * 7.3) * 0.5 + 0.5;
    var dangerBonus = 1 + system.danger * 0.05;

    return Math.round(commodity.basePrice * mod * (0.8 + fluctuation * 0.4) * dangerBonus);
  }

  // Buy price = computePrice (what you pay)
  // Sell price = computePrice * (1 - tradeTax) (what you receive)
  function getBuyPrice(commodityId, system) {
    return computePrice(commodityId, system);
  }

  function getSellPrice(commodityId, system) {
    var cfg = FA.lookup('config', 'game');
    return Math.round(computePrice(commodityId, system) * (1 - cfg.tradeTax));
  }

  // Update market fluctuation timer
  function updateMarkets(dt) {
    _marketTime += dt;
  }

  // === NAVIGATION ===

  function jumpDistance(fromId, toId) {
    var a = _systems[fromId], b = _systems[toId];
    if (!a || !b) return Infinity;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  // Fuel cost proportional to distance
  function fuelForJump(fromId, toId) {
    var cfg = FA.lookup('config', 'game');
    var dist = jumpDistance(fromId, toId);
    return Math.ceil(cfg.fuelPerJump * (dist / 200));
  }

  // Returns system IDs reachable with given fuel
  function getSystemsInRange(systemId, fuelAvailable) {
    var results = [];
    for (var i = 0; i < _systems.length; i++) {
      if (i === systemId) continue;
      if (fuelForJump(systemId, i) <= fuelAvailable) {
        results.push(i);
      }
    }
    return results;
  }

  // Returns connected systems sorted by profit potential
  // Each entry: { systemId, commodity, buyHere, sellThere, profit }
  function findTradeRoutes(systemId) {
    var sys = _systems[systemId];
    if (!sys) return [];

    var commodities = FA.lookupAll('commodities');
    var routes = [];

    // TODO: For each connected system, compute best commodity to buy here and sell there
    // Sort by profit descending
    // Return top 5 routes

    return routes;
  }

  // === EXPORT ===
  window.Galaxy = {
    init: init,
    getSystem: getSystem,
    getSystems: getSystems,
    getStation: getStation,
    getConnections: getConnections,
    computePrice: computePrice,
    getBuyPrice: getBuyPrice,
    getSellPrice: getSellPrice,
    updateMarkets: updateMarkets,
    jumpDistance: jumpDistance,
    fuelForJump: fuelForJump,
    getSystemsInRange: getSystemsInRange,
    findTradeRoutes: findTradeRoutes
  };
})();
