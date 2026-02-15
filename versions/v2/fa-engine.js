// ForkArcade Engine v1 — Core
// ENGINE FILE — do not modify in game repos
(function(window) {
  'use strict';

  var FA = window.FA || {};
  window.FA = FA;

  FA.ENGINE_VERSION = 1;

  // ===== EVENT BUS =====

  var _listeners = {};

  FA.on = function(event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
  };

  FA.off = function(event, fn) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(function(f) { return f !== fn; });
  };

  FA.emit = function(event, data) {
    var list = _listeners[event];
    if (!list) return;
    for (var i = 0; i < list.length; i++) {
      list[i](data);
    }
  };

  // ===== STATE MANAGER =====

  var _state = {};

  FA.getState = function() { return _state; };

  FA.setState = function(key, value) {
    var prev = _state[key];
    _state[key] = value;
    FA.emit('state:changed', { key: key, value: value, prev: prev });
  };

  FA.resetState = function(initial) {
    _state = initial || {};
    FA.emit('state:reset', _state);
  };

  // ===== GAME LOOP =====

  var _updateFn = null;
  var _renderFn = null;
  var _running = false;
  var _lastTime = 0;
  var _accumulator = 0;
  var FIXED_DT = 1000 / 60;

  FA.setUpdate = function(fn) { _updateFn = fn; };
  FA.setRender = function(fn) { _renderFn = fn; };

  FA.start = function() {
    _running = true;
    _lastTime = performance.now();
    _accumulator = 0;
    _tick();
  };

  FA.stop = function() { _running = false; };

  function _tick() {
    if (!_running) return;
    var now = performance.now();
    var elapsed = Math.min(now - _lastTime, 100);
    _lastTime = now;
    _accumulator += elapsed;

    while (_accumulator >= FIXED_DT) {
      if (_updateFn) _updateFn(FIXED_DT);
      _accumulator -= FIXED_DT;
    }

    if (_renderFn) _renderFn();
    requestAnimationFrame(_tick);
  }

  // ===== REGISTRY =====

  var _registries = {};

  FA.register = function(registryName, id, def) {
    if (!_registries[registryName]) _registries[registryName] = {};
    _registries[registryName][id] = def;
  };

  FA.lookup = function(registryName, id) {
    return _registries[registryName] && _registries[registryName][id];
  };

  FA.lookupAll = function(registryName) {
    return _registries[registryName] || {};
  };

  // ===== UTILS =====

  FA.rand = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  FA.clamp = function(val, min, max) {
    return Math.max(min, Math.min(max, val));
  };

  FA.pick = function(arr) {
    return arr[FA.rand(0, arr.length - 1)];
  };

  FA.shuffle = function(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = FA.rand(0, i);
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  };

  FA.uid = function() {
    return Math.random().toString(36).substr(2, 9);
  };

  // ===== SEEDED RNG (Mulberry32) =====

  FA.createRNG = function(seed) {
    var s = seed | 0;
    return {
      seed: s,
      next: function() {
        s |= 0;
        s = s + 0x6D2B79F5 | 0;
        var t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      },
      int: function(min, max) {
        return min + Math.floor(this.next() * (max - min + 1));
      },
      pick: function(arr) {
        return arr[this.int(0, arr.length - 1)];
      },
      shuffle: function(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
          var j = this.int(0, i);
          var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
        }
        return a;
      }
    };
  };

  // ===== GALAXY GENERATOR =====

  var _namePrefixes = ['Al','Tau','Sol','Veg','Sig','Zet','Eps','Del','Gam','Omi',
                       'The','Lam','Kap','Phi','Psi','Rig','Can','Pro','Arc','Ant',
                       'Bet','Ald','Cer','Den','Eri','Fom','Hyd','Ind','Lyn','Nor'];
  var _nameSuffixes = ['aris','onis','rae','ebi','ica','ium','ax','ux','ion','eus',
                       'ana','ora','uri','ith','enn','ark','oss','eld','urn','ova',
                       'ith','ane','ope','ida','ula','erg','ond','ast','ell','ium'];

  function _generateNames(rng, count) {
    var names = [];
    var used = {};
    for (var i = 0; i < count; i++) {
      var name;
      do {
        name = rng.pick(_namePrefixes) + rng.pick(_nameSuffixes);
      } while (used[name]);
      used[name] = true;
      names.push(name);
    }
    return names;
  }

  FA.generateGalaxy = function(seed, systemCount) {
    var rng = FA.createRNG(seed);
    var systems = [];
    var economyTypes = ['agricultural', 'industrial', 'mining', 'tech', 'military', 'trade-hub'];
    var names = _generateNames(rng, systemCount);

    for (var i = 0; i < systemCount; i++) {
      var angle = rng.next() * Math.PI * 2;
      var dist = 60 + rng.next() * 440;
      systems.push({
        id: i,
        name: names[i],
        x: Math.round(Math.cos(angle) * dist),
        y: Math.round(Math.sin(angle) * dist),
        economy: rng.pick(economyTypes),
        techLevel: rng.int(1, 10),
        population: rng.int(1, 8),
        danger: rng.int(0, 5),
        faction: null,
        stations: rng.int(1, 3),
        connections: []
      });
    }

    // Build connection graph: each system connects to 2-4 nearest
    for (var s = 0; s < systems.length; s++) {
      var sx = systems[s].x, sy = systems[s].y;
      var sorted = systems.slice().sort(function(a, b) {
        var da = Math.hypot(a.x - sx, a.y - sy);
        var db = Math.hypot(b.x - sx, b.y - sy);
        return da - db;
      });
      var count = rng.int(2, 4);
      for (var c = 1; c <= count && c < sorted.length; c++) {
        var target = sorted[c].id;
        if (systems[s].connections.indexOf(target) === -1) {
          systems[s].connections.push(target);
        }
        if (sorted[c].connections.indexOf(s) === -1) {
          sorted[c].connections.push(s);
        }
      }
    }

    return systems;
  };

})(window);
