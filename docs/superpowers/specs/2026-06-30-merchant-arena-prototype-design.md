# Merchant Arena Prototype Design

## Summary

V1 is a compact 2D Beamable Web SDK sample that demonstrates a cross-PID Arena progression layer through a merchant fantasy loop.

The player starts in a colosseum-style Arena hub, sees Arena XP represented as a rising pillar, and enters a gate into the sample game PID. In the game, the player is a merchant-adventurer who enters caves, resolves boss fights, receives tiered loot, returns to town, sells materials, buys stronger weapons, earns game XP, and sends qualified Arena XP events back to the Arena PID.

The prototype should feel fun and polished, but the gameplay must stay narrow. Boss fights are server-resolved encounters with 2D presentation, sprites, and simple animations. V1 should not become a real-time combat game.

## Design Feedback

- The concept is strong because it maps naturally to Beamable ownership boundaries: Arena owns meta progression; the game owns bosses, loot, economy, weapons, and game XP.
- The merchant loop gives the player a clear reason to interact with inventory, content, stats, microservices, and cross-PID Arena calls without adding unrelated systems.
- The colosseum hub is a good visual metaphor for Arena XP and a clean place to show the PID switch, but the switch should be invisible to the player. The UI transition is "enter gate"; the implementation detail is "use game Beam context."
- The main scope risk is combat. V1 should use an encounter resolver with lightweight animation: boss appears, weapon strikes, hit flashes, loot drops. No movement physics, enemy AI, hitboxes, skill trees, crafting, or live economy.
- The sample should teach Beamable through interaction, not through explanatory screens. UI labels can be concise, but the player should understand the integration by playing the loop.

## Product Shape

### Player Loop

1. Player signs in with email through the Web SDK.
2. Player lands in the Arena colosseum.
3. Arena screen shows Arena level/XP as a pillar and a gate to the merchant game.
4. Player enters the gate, switching to the game PID context.
5. Town screen shows gold, game level, equipped weapon, inventory summary, and cave options.
6. Player selects an unlocked cave.
7. Boss encounter resolves through `GameService`.
8. Server returns loot, game XP, gold-relevant data, and Arena progress update if applicable.
9. Player returns to town, sells loot, buys stronger weapons, and unlocks higher caves.
10. Player can return to Arena to see updated Arena XP.

### V1 Content Scope

- Caves: 3 tiers.
- Bosses: 1 boss per cave tier.
- Loot: 4 tiers, with different sell prices and drop rates.
- Weapons: 3 weapon item content entries, each enabling or improving odds against stronger bosses.
- Stats: game XP, game level, best unlocked cave if needed.
- Currency content: gold.
- Arena XP triggers: boss kills and selling high-tier loot.

### Out Of Scope For V1

- Real-time combat controls.
- Crafting.
- Shops with rotating catalogs.
- Missions, seasons, achievements, leaderboards, or PvP.
- Skillz federation.
- Shared packages between Arena and game PID.
- Direct cross-PID storage access.

## Architecture

### Folder Boundaries

Keep Arena and game logic separate to simulate Skillz-style PID separation:

- `services/`: Arena PID backend.
- `game-services/`: sample game PID backend.
- future `src/arena/`: Arena client scene, Arena Beam context, Arena service client.
- future `src/game/`: merchant game scene, game Beam context, GameService client, game content/inventory/stat wrappers.
- future `src/shared/`: UI primitives, auth shell, routing, sprites, animation helpers, and pure utilities that are not PID-owned.

The client may share generic UI and rendering primitives, but not Arena/game domain contracts unless they are explicitly JSON-facing API shapes.

### Beamable Context Model

Use two explicit Beam contexts:

- Arena context initialized with Arena PID.
- Game context initialized with sample game PID.

The Web SDK documentation shows initialization with `Beam.init({ cid, pid })`, so V1 should create separate context factories rather than mutating a global Beam instance. Keep them behind a small context manager:

- `getArenaBeam()`
- `getGameBeam()`
- `clearBeamContextsOnLogout()`

Email auth should remain simple. The login UI can authenticate against the game PID first, then initialize/refresh the Arena context as needed. If token/account sharing across PIDs behaves differently than expected, the implementation must verify the Web SDK behavior and adjust before building deeper UI.

### Backend Responsibilities

Arena service:

- Owns canonical Arena XP and Arena progression.
- Receives explicit JSON XP events from `GameService`.
- Does not know game inventory, loot tables, weapons, gold, or cave unlocks.

GameService:

- Owns boss encounter resolution.
- Rolls loot from content-driven drop tables.
- Grants or records loot and gold changes through Beamable inventory/stats.
- Updates game XP and game level as game-scoped player stats.
- Sends Arena XP events to Arena when boss kills or high-tier item sales qualify.

### Beamable Systems

Use Beamable Content for:

- Cave definitions.
- Boss definitions.
- Loot definitions.
- Weapon item definitions.
- Drop tables.
- Game XP and unlock tuning.
- Store content for the town weapon shop.

Use Beamable Inventory for:

- Loot items.
- Owned weapon items.
- Gold balance through Beamable currency/inventory, backed by a `currency.gold` content item.

Use Beamable Stats for:

- `game_xp`
- `game_level`
- `equipped_weapon`
- `best_cave_unlocked` if useful

Use Beamable Content for game progression rules:

- Game XP thresholds.
- Cave unlock requirements.
- Weapon unlock requirements if they are level-gated.

Use Beamable Store/Commerce content for:

- Town weapon shop catalog.
- Weapon prices in gold.
- Purchase availability rules if supported cleanly by the content/store model.

Use microservices for:

- Server-authoritative boss resolution.
- Server-authoritative selling.
- Server-authoritative weapon purchases.
- Arena XP bridge calls.

## Visual Direction

### Arena Colosseum

The Arena hub should be the first visual signal of the meta layer:

- 2D colosseum background.
- Central XP pillar that fills/rises as Arena XP increases.
- Level marker plaques on the pillar.
- Gate button leading into the merchant game.
- Minimal HUD: account/email state, Arena level, total XP, next level.

### Merchant Town

Town is the operational screen:

- Player stall or shop counter.
- Gold, game level, XP bar, equipped weapon.
- Inventory panel with recent loot.
- Buttons for cave, sell, shop, return to Arena.
- Visual tone: readable, colorful, fantasy market, not a dense spreadsheet.

### Cave Encounter

Boss fight should be simple but satisfying:

- Cave backdrop.
- Boss sprite with idle and hit animation.
- Player weapon swipe or projectile animation.
- Result sequence: defeat, loot cards drop, XP/gold summary.
- Failure is optional for V1. If included, keep it non-punitive and based on weapon/cave mismatch.

## Data And Economy Model

### Loot Tiers

Use four loot tiers:

- Common: frequent, low price, no Arena XP on sale.
- Uncommon: moderate price, small chance from tier 1+ bosses.
- Rare: low drop rate, meaningful sale price, grants Arena XP on sale.
- Exotic: very low drop rate, high sale price, grants more Arena XP on sale.

### Boss Encounter Result

The client sends:

- cave id
- equipped weapon id
- client session id

The server decides:

- boss defeated
- loot drops
- game XP awarded
- Arena XP event for boss kill
- updated game stats
- updated Arena progress if Arena event was sent

### Selling Result

The client sends:

- item instance ids or item content ids depending on inventory implementation

The server decides:

- sell value
- inventory removal
- gold update
- game XP award if any
- Arena XP event if high-tier loot was sold

## Phased Implementation Plan

### Phase 1: Client Skeleton And Context Split

- Scaffold React Native + TypeScript app structure.
- Add route/state model for `ArenaHub`, `Town`, `CaveEncounter`, and `Shop`.
- Implement Beam context manager with separate Arena and Game contexts.
- Add email login/signup UI using the Web SDK.
- Add typed service clients for Arena and GameService.
- Acceptance: user can log in, view the first Arena hub screen, enter the game gate, and return to Arena without losing auth state.

### Phase 2: Game Content Model

- Define content schemas for caves, bosses, loot, weapons, and drop tables.
- Create small content set: 3 caves, 3 bosses, 4 loot tiers, 3 weapons.
- Add content loading wrappers in the game client.
- Add tests or validation for drop table tuning ranges.
- Acceptance: town and cave screens render from Beamable content, not hardcoded UI constants.

### Phase 3: GameService Encounter Resolver

- Add `StartBossEncounter` or `ResolveBossEncounter` endpoint.
- Validate player identity, cave unlock, equipped weapon, and idempotency/session id.
- Roll loot server-side using content definitions.
- Award game XP as game-scoped stats.
- Send Arena XP event for boss defeat.
- Return a compact result DTO for UI animation.
- Acceptance: pressing fight resolves one boss encounter and updates game XP plus Arena XP.

### Phase 4: Inventory, Selling, And Shop

- Add loot grant/removal through Beamable inventory.
- Add gold as Beamable currency content and update the runtime balance through inventory/currency APIs.
- Define weapons as Beamable item content and model shop offers with Beamable store content.
- Add `SellLoot` endpoint.
- Add `BuyWeapon` and `EquipWeapon` endpoints.
- Award Arena XP for selling rare/exotic loot.
- Acceptance: player can sell loot, buy/equip better weapons, and unlock higher caves.

### Phase 5: Arena Hub Polish

- Build colosseum screen with XP pillar, level markers, and gate transition.
- Show Arena progress from Arena PID context.
- Refresh Arena progress after returning from the game.
- Add loading, error, empty, and logged-out states.
- Acceptance: Arena progress is visible and updates after boss/sale loops.

### Phase 6: 2D Presentation Polish

- Add sprite set for merchant, town stall, cave backgrounds, bosses, weapons, loot cards, colosseum, pillar, and gate.
- Add lightweight animations: gate open, cave enter, boss idle, weapon strike, hit flash, loot reveal, XP pillar rise.
- Add sound hooks only if low effort; do not block V1 on audio.
- Acceptance: the prototype feels like a small game, not a form-driven admin demo.

### Phase 7: End-To-End Validation

- Test new player signup.
- Test returning player login.
- Test Arena context and Game context switching.
- Test boss kill, loot grant, game XP stat update, Arena XP update.
- Test selling high-tier loot grants Arena XP.
- Test duplicate session/event id behavior.
- Test content missing/misconfigured states.
- Acceptance: one full player loop works from login through Arena XP update without manual backend intervention.

## Risks And Decisions

- Cross-PID Web SDK auth needs verification during implementation. Separate `Beam.init({ cid, pid })` contexts are the intended shape, but the token/account behavior must be tested early.
- Inventory item instances can become complex. If item instance management slows V1 down, start with item content ids plus counts, then upgrade to full item instances.
- Gold is Beamable currency content and should not be modeled as a stat.
- Weapons are Beamable item content, and the town shop should use Beamable store/commerce content where practical.
- Game XP current value should be a game-scoped stat; game XP thresholds and unlock rules should be content.
- Game XP should stay game-scoped and non-canonical for Arena. Arena XP remains canonical only in Arena.
- The client should never directly set Arena XP, game XP, gold, cave unlocks, or loot outcomes.

## Recommended V1 Definition Of Done

- Email-auth player can enter Arena hub.
- Arena hub shows Arena XP pillar.
- Player enters merchant game through gate.
- Player resolves a boss encounter with a short 2D animation.
- Server awards loot and game XP.
- Player sells rare or exotic loot.
- GameService sends Arena XP events for boss kill and high-tier sale.
- Player returns to Arena and sees updated Arena progress.
