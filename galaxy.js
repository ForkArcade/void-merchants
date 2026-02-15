// Void Merchants — Galaxy
// Procedural galaxy, star systems, stations, economy simulation
(function() {
  'use strict';
  var FA = window.FA;
  var _systems = [];
  var _stations = {};
  var _rng = null;
  var _marketTime = 0;

  function init(seed) {
    var cfg = FA.lookup('config', 'game');
    _rng = FA.createRNG(seed);
    _systems = FA.generateGalaxy(seed, cfg.systemCount);
    _marketTime = 0;
    _stations = {};
    assignFactions();
    createStations();
  }

  function assignFactions() {
    var factions = FA.lookupAll('factions');
    var fids = Object.keys(factions);
    var n = _systems.length;
    var capitals = {};
    var used = {};

    for (var f = 0; f < fids.length; f++) {
      var bestId = -1, bestDist = 0;
      for (var i = 0; i < n; i++) {
        if (used[i]) continue;
        var minD = Infinity;
        for (var c in capitals) {
          var d = Math.hypot(_systems[i].x - _systems[capitals[c]].x, _systems[i].y - _systems[capitals[c]].y);
          if (d < minD) minD = d;
        }
        if (Object.keys(capitals).length === 0) minD = Math.hypot(_systems[i].x, _systems[i].y) + 100;
        if (minD > bestDist) { bestDist = minD; bestId = i; }
      }
      if (bestId >= 0) {
        capitals[fids[f]] = bestId;
        used[bestId] = true;
        _systems[bestId].faction = fids[f];
      }
    }

    for (var s = 0; s < n; s++) {
      if (_systems[s].faction) continue;
      var nearest = null, nearDist = Infinity;
      for (var fid in capitals) {
        var cap = _systems[capitals[fid]];
        var dist = Math.hypot(_systems[s].x - cap.x, _systems[s].y - cap.y);
        if (dist < nearDist) { nearDist = dist; nearest = fid; }
      }
      _systems[s].faction = _rng.next() < 0.15 ? null : nearest;
    }
  }

  function createStations() {
    var suffixes = ['Hub', 'Port', 'Dock', 'Station', 'Outpost', 'Base', 'Terminal'];
    for (var i = 0; i < _systems.length; i++) {
      var sys = _systems[i];
      var list = [];
      for (var s = 0; s < sys.stations; s++) {
        var angle = (s / sys.stations) * Math.PI * 2 + _rng.next() * 0.5;
        var r = 350 + s * 200 + _rng.int(0, 60);
        list.push({ name: sys.name + ' ' + _rng.pick(suffixes), x: Math.cos(angle) * r, y: Math.sin(angle) * r, orbitAngle: angle, orbitRadius: r });
      }
      _stations[i] = list;
    }
  }

  function getSystem(id) { return _systems[id] || null; }
  function getSystems() { return _systems; }
  function getStation(systemId, idx) { var l = _stations[systemId]; return l ? l[idx || 0] : null; }
  function getStations(systemId) { return _stations[systemId] || []; }
  function getConnections(systemId) { var s = _systems[systemId]; return s ? s.connections : []; }

  function computePrice(commodityId, system) {
    var c = FA.lookup('commodities', commodityId);
    if (!c) return 0;
    var mod = c.economyMod[system.economy] || 1.0;
    var stepped = Math.floor(_marketTime / 5000) * 5000;
    var fluct = Math.sin(stepped * 0.0004 + system.id * 7.3) * 0.5 + 0.5;
    return Math.round(c.basePrice * mod * (0.8 + fluct * 0.4) * (1 + system.danger * 0.05));
  }

  function getBuyPrice(cid, sys) { return computePrice(cid, sys); }
  function getSellPrice(cid, sys) { var cfg = FA.lookup('config', 'game'); return Math.round(computePrice(cid, sys) * (1 - cfg.tradeTax)); }
  function updateMarkets(dt) { _marketTime += dt; }

  function jumpDistance(a, b) { var sa = _systems[a], sb = _systems[b]; return (sa && sb) ? Math.hypot(sa.x - sb.x, sa.y - sb.y) : Infinity; }
  function fuelForJump(a, b) { var cfg = FA.lookup('config', 'game'); return Math.ceil(cfg.fuelPerJump * (jumpDistance(a, b) / 200)); }
  function isConnected(a, b) { var s = _systems[a]; return s && s.connections.indexOf(b) !== -1; }

  function getSystemsInRange(sid, fuel) {
    var r = [];
    for (var i = 0; i < _systems.length; i++) {
      if (i !== sid && isConnected(sid, i) && fuelForJump(sid, i) <= fuel) r.push(i);
    }
    return r;
  }

  function findTradeRoutes(sid) {
    var sys = _systems[sid]; if (!sys) return [];
    var coms = FA.lookupAll('commodities');
    var routes = [];
    var conns = sys.connections;
    for (var c = 0; c < conns.length; c++) {
      var t = _systems[conns[c]];
      for (var cid in coms) {
        var buy = getBuyPrice(cid, sys), sell = getSellPrice(cid, t), profit = sell - buy;
        if (profit > 0) routes.push({ systemId: conns[c], systemName: t.name, commodity: cid, commodityName: coms[cid].name, buyHere: buy, sellThere: sell, profit: profit });
      }
    }
    routes.sort(function(a, b) { return b.profit - a.profit; });
    return routes.slice(0, 8);
  }

  function generateMissions(sid) {
    var sys = _systems[sid]; if (!sys) return [];
    var ms = [], coms = FA.lookupAll('commodities'), cfg = FA.lookup('config', 'game');

    if (sys.connections.length > 0) {
      var did = FA.pick(sys.connections), dest = _systems[did], com = FA.pick(Object.keys(coms));
      ms.push({ type: 'delivery', title: 'Deliver ' + coms[com].name + ' to ' + dest.name, destination: did, destinationName: dest.name, commodity: com, quantity: FA.rand(3, 8), reward: FA.rand(300, 800), repFaction: sys.faction, repDelta: 5, timeout: cfg.missionTimeout });
    }
    if (sys.danger >= 2) {
      ms.push({ type: 'combat', title: 'Clear pirates near ' + sys.name, target: sid, killCount: FA.rand(2, 4), killed: 0, reward: FA.rand(500, 1200), repFaction: sys.faction || 'federation', repDelta: 10, timeout: cfg.missionTimeout });
    }
    var exploreTarget = FA.rand(0, _systems.length - 1);
    if (exploreTarget !== sid) {
      ms.push({ type: 'exploration', title: 'Survey ' + _systems[exploreTarget].name, destination: exploreTarget, destinationName: _systems[exploreTarget].name, reward: FA.rand(200, 600), repFaction: 'scientists', repDelta: 8, timeout: cfg.missionTimeout });
    }
    return ms;
  }

  window.Galaxy = { init: init, getSystem: getSystem, getSystems: getSystems, getStation: getStation, getStations: getStations, getConnections: getConnections, computePrice: computePrice, getBuyPrice: getBuyPrice, getSellPrice: getSellPrice, updateMarkets: updateMarkets, jumpDistance: jumpDistance, fuelForJump: fuelForJump, isConnected: isConnected, getSystemsInRange: getSystemsInRange, findTradeRoutes: findTradeRoutes, generateMissions: generateMissions };
})();
