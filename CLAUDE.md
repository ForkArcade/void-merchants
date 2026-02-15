# Space Trader — ForkArcade

Open world space exploration — trading, combat, factions, missions.

## File structure

| File | Description |
|------|-------------|
| `data.js` | Data registration: commodities, ship types, weapons, factions, config, sounds, narrative |
| `galaxy.js` | Procedural galaxy: systems, stations, markets, economy simulation. Export: `window.Galaxy` |
| `player.js` | Player: ship state, cargo, fuel, credits, reputation, missions. Export: `window.Player` |
| `combat.js` | Combat: real-time weapons, projectiles, shields, damage, AI. Export: `window.Combat` |
| `render.js` | Rendering layers: galaxy map, system view, station menus, combat, HUD, narrative. Export: `window.Render` |
| `main.js` | Entry point: keybindings, view state machine, game loop, `ForkArcade.onReady/submitScore` |

Template files (do not edit):
- `fa-engine.js`, `fa-renderer.js`, `fa-input.js`, `fa-audio.js` — engine

Files copied by the platform (do not edit):
- `forkarcade-sdk.js` — SDK (scoring, auth)
- `fa-narrative.js` — narrative module (graph, variables, transition)
- `sprites.js` — generated from `_sprites.json`

## Engine API (window.FA)

- **Event bus**: `FA.on(event, fn)`, `FA.emit(event, data)`, `FA.off(event, fn)`
- **State**: `FA.resetState(obj)`, `FA.getState()`, `FA.setState(key, val)`
- **Registry**: `FA.register(registry, id, def)`, `FA.lookup(registry, id)`, `FA.lookupAll(registry)`
- **Game loop**: `FA.setUpdate(fn)`, `FA.setRender(fn)`, `FA.start()`, `FA.stop()` — **dt is in milliseconds** (~16.67ms per tick)
- **Canvas**: `FA.initCanvas(id, w, h)`, `FA.getCtx()`, `FA.getCanvas()`
- **Layers**: `FA.addLayer(name, drawFn, order)`, `FA.renderLayers()` — **every gameplay layer MUST start with `if (state.screen !== 'playing') return;`**
- **Draw**: `FA.draw.clear/rect/strokeRect/text/bar/gradientBar/circle/strokeCircle/hex/sprite/withAlpha/withClip`
- **Input**: `FA.bindKey(action, keys)`, `FA.isAction(action)`, `FA.isHeld(action)`, `FA.consumeClick()`, `FA.getMouse()`, `FA.clearInput()`
- **Audio**: `FA.defineSound(name, fn)`, `FA.playSound(name)` — built-in: hit, pickup, death, step, spell, levelup
- **Effects**: `FA.addFloat(x, y, text, color, dur)`, `FA.addEffect(obj)`, `FA.updateEffects(dt)`, `FA.updateFloats(dt)`, `FA.drawFloats()`
- **Camera**: `FA.camera.x`, `FA.camera.y`, `FA.camera.follow(tx,ty,mw,mh,vw,vh)`, `FA.camera.reset()`
- **Narrative**: `FA.narrative.init(cfg)`, `.transition(nodeId, event)`, `.setVar(name, val, reason)`, `.getVar(name)`, `.getNode()`, `.getEvents()`
- **Utils**: `FA.rand(min,max)`, `FA.clamp(val,min,max)`, `FA.pick(arr)`, `FA.shuffle(arr)`, `FA.uid()`
- **Seeded RNG**: `FA.createRNG(seed)` — returns `{ next(), int(min,max), pick(arr), shuffle(arr) }`
- **Galaxy gen**: `FA.generateGalaxy(seed, count)` — returns `[{ id, name, x, y, economy, techLevel, population, danger, faction, stations, connections }]`

## Galaxy API (window.Galaxy)

| Method | Description |
|--------|-------------|
| `init(seed)` | Generate galaxy from seed, assign factions, create station markets |
| `getSystem(id)` | System data by ID |
| `getSystems()` | All systems array |
| `getStation(systemId, idx)` | Station data at a system |
| `getConnections(systemId)` | Connected system IDs |
| `computePrice(commodityId, system)` | Current price (economy + fluctuation + danger) |
| `getBuyPrice(commodityId, system)` | Price to buy (= computePrice) |
| `getSellPrice(commodityId, system)` | Price to sell (= computePrice × (1 - tax)) |
| `updateMarkets(dt)` | Advance market fluctuation timer |
| `jumpDistance(fromId, toId)` | Distance between systems |
| `fuelForJump(fromId, toId)` | Fuel cost for jump |
| `getSystemsInRange(systemId, fuel)` | Reachable system IDs with given fuel |
| `findTradeRoutes(systemId)` | Best profit routes from current system |

## Player API (window.Player)

| Method | Description |
|--------|-------------|
| `init()` | Create player with shuttle, 1000 credits, full fuel |
| `getShip()` | Full player state object |
| `getCurrentSystem()` | Current system ID |
| `getVisitedSystems()` | `{ systemId: true }` map |
| `getCredits()` | Current credits |
| `addCredits(amount, reason)` | Add credits, track earnings |
| `buyCommodity(id, qty, price)` | Buy — checks credits + cargo space |
| `sellCommodity(id, qty, price)` | Sell — returns credits |
| `getCargo()` | `[{ id, name, quantity }]` |
| `getCargoUsed()` | Total cargo units |
| `refuel(amount, pricePerUnit)` | Refuel at station |
| `jumpTo(systemId)` | Consume fuel, update position, track visited |
| `getReputation(factionId)` | Rep value -100 to 100 |
| `changeReputation(factionId, delta, reason)` | Adjust faction rep |
| `acceptMission(mission)` | Add to active missions (max 3) |
| `completeMission(missionId)` | Complete + reward + rep change |
| `failMission(missionId)` | Fail + rep penalty |
| `getActiveMissions()` | Active missions list |
| `buyShip(shipTypeId)` | Buy ship at station (trade-in at 50%) |
| `buyWeapon(weaponTypeId, slot)` | Equip weapon in slot |
| `takeDamage(amount)` | Shield first, then hull. Returns true if dead. |
| `repairHull(amount, price)` | Repair at station |
| `rechargeShield(dt)` | Auto-recharge over time (call each tick) |
| `computeScore()` | Final score calculation |

## Combat API (window.Combat)

| Method | Description |
|--------|-------------|
| `start(enemies, context)` | Enter combat. enemies: `[{ shipType, faction, ai, weapons, hull, shield, x, y, angle }]` |
| `update(dt)` | Combat tick — input, projectiles, AI, collisions |
| `isActive()` | Is combat in progress |
| `end(victory)` | Exit combat — loot or game over |
| `flee()` | Attempt escape (fuel cost, speed check). Returns true if successful. |
| `spawnProjectile(shooter, weaponTypeId, isPlayer)` | Create projectile |
| `getEnemies()` | Current enemies |
| `getProjectiles()` | Current projectiles |

## Views (state machine)

| `state.view` | Description |
|--------------|-------------|
| `start` | Title screen |
| `galaxy_map` | Top-down galaxy, select system, jump |
| `system_view` | Real-time flight in a system, dock at stations |
| `station` | Menu-based (5 tabs: Trade/Shipyard/Fuel/Missions/Repair) |
| `combat` | Real-time combat arena |
| `victory` | Story complete, score breakdown |
| `defeat` | Dead or stranded, score breakdown |

`state.screen` for 3-screen rule: `start`, `playing` (all gameplay views), `victory`, `defeat`

## Events

| Event | Description |
|-------|-------------|
| `input:action` | Key bound to action |
| `input:click` | Canvas clicked |
| `entity:damaged` | Ship hit (auto: `FA.playSound('hit')`) |
| `entity:killed` | Ship destroyed (auto: `FA.playSound('death')`) |
| `item:pickup` | Cargo/fuel collected (auto: `FA.playSound('pickup')`) |
| `game:over` | Game ended — `{ victory, score }` |
| `trade:buy` | Commodity purchased |
| `trade:sell` | Commodity sold |
| `credits:changed` | Credits added/spent |
| `reputation:changed` | Faction rep changed |
| `mission:accepted` | Mission taken |
| `mission:completed` | Mission finished |
| `mission:failed` | Mission expired/failed |
| `jump:complete` | Hyperspace jump finished |
| `combat:start` | Combat entered |
| `combat:end` | Combat resolved — `{ victory, fled }` |
| `narrative:transition` | Narrative graph transition |

## Scoring

```
score = creditsEarned * 1
      + systemsVisited * 50
      + missionsCompleted * 200
      + kills * 100
      + floor(gameTimeMinutes) * 10
      + (artifactDelivered ? 5000 : 0)
```

`ForkArcade.submitScore(score)` in the `game:over` handler.

## Registries (data.js)

| Registry | Keys | Used for |
|----------|------|----------|
| `config/game` | — | Canvas size, seed, starting values, combat params |
| `config/colors` | — | All game colors |
| `config/scoring` | — | Score multipliers |
| `config/narrative` | — | Narrative graph + variables |
| `commodities` | food, minerals, machinery, electronics, weapons, luxuries, narcotics, medicine | Trading |
| `shipTypes` | shuttle, trader, fighter, corvette, freighter | Ship definitions |
| `weaponTypes` | laser, cannon, missile, beam | Weapon definitions |
| `factions` | federation, merchants, pirates, scientists, rebels | Faction definitions |
| `narrativeText` | arrival, first_trade, ... (21 nodes) | Story text per narrative node |

## Sprite fallback

`FA.draw.sprite(category, name, x, y, size, fallbackChar, fallbackColor, frame)` — renders sprite frame, or fallback text when no sprite exists.

## Coordinate system

- Galaxy map: absolute coordinates with offset + scale to fit canvas. No camera transform.
- System view: camera follows player. Screen coords = world - camera.
- Combat: camera follows player. Bounded arena.
- Station: fixed screen coordinates (menu overlay, no camera).
- Angle 0 = up. Clockwise positive. `Math.sin(angle)` = X component, `-Math.cos(angle)` = Y component.
