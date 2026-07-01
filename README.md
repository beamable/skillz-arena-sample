# Skillz Arena Sample

React Native + TypeScript sample using the Beamable Web SDK, Beamable microservices, and Beamable content.

Arena is the game-agnostic meta layer in this sample. It does not own moment-to-moment gameplay, loot tables, weapons, shops, or local game economy. It owns the cross-game progression surface: XP events, Arena level state, idempotency, and the storage needed to make that progression portable across games.

The sample shows a small Arena progression loop:

1. A player signs up or logs in with email/password.
2. The player enters a merchant-style quick game.
3. Game activity awards local game progress and can send XP events to Arena.
4. Arena returns the player's updated Arena level and XP.

The project uses two Beamable PIDs under one CID to keep the ownership boundary visible:

- Arena PID: owns the game-agnostic meta layer: Arena XP, Arena level state, XP event idempotency, and Arena storage.
- Game PID: owns this specific merchant game: game state, game content, loot, weapons, currency, and the bridge to Arena.

## Local Setup

### Prerequisites

- Node.js
- npm
- .NET 8+ SDK
- Beamable CLI
- Arena and Game microservices deployed to the Beamable realms you are using

The web app depends on `@beamable/sdk@1.2.1`.

### Install Or Restore The Beamable CLI

Beamable CLI is a .NET tool. This repo pins its CLI version in `.config/dotnet-tools.json`, so the preferred setup is to restore the local tool from the repo root:

```powershell
dotnet --version
dotnet tool restore
dotnet tool run beam -- version
```

If `dotnet tool restore` cannot find the tool, install the Beamable CLI globally first, then restore again:

```powershell
dotnet tool install --global Beamable.Tools
beam version
dotnet tool restore
```

Use `dotnet tool run beam -- <command>` inside this repo when you want the pinned local CLI version. A global `beam` command is convenient, but the local tool manifest is the version we expect for this sample.

### Install App Dependencies

From the repo root:

```powershell
npm install
```

### Configure Local Environment

Create `.env.local` in the repo root. This file is ignored by git.
Note: you can use your own CID and PIDs.
```env
EXPO_PUBLIC_BEAMABLE_CID=1689160644344843
EXPO_PUBLIC_BEAMABLE_ARENA_PID=DE_85621805437202432
EXPO_PUBLIC_BEAMABLE_GAME_PID=DE_85621827599904768
```

Use your own CID/PIDs if you publish the services and content to your own Beamable realms.

Do not put project secrets in `.env.local`. The browser client only needs public CID/PID values.

### Run Checks

```powershell
npm run typecheck
dotnet test game-services\game-services.sln
dotnet test services\services.sln
```

### Start The Web App

```powershell
npm run web -- --port 63178
```

Open:

```text
http://localhost:63178
```

The app should let you sign up or log in, view the Arena hub, enter the merchant game, complete game actions, and see Arena progress returned through Beamable-backed services.

## Microservices

Microservices are written in C# and have generated TypeScript clients under `src/generated`.

### Arena Service

Location:

```text
services/Arena
services/ArenaStorage
```

The Arena service owns canonical Arena progression across games. It is intentionally game-agnostic: games report validated XP events, and Arena records those events, ignores duplicate event IDs, calculates Arena level state, and stores player progress in Arena microstorage.

Key calls:

- `HealthCheck`
- `RecordXpEvent`
- `GetProgress`

### Game Service

Location:

```text
game-services/GameService
```

The Game service owns the merchant game loop. It reads game content, tracks merchant player state, resolves encounters, handles loot sales, weapon purchases, weapon equips, and quick-game completion.

Key calls:

- `HealthCheck`
- `GetPlayerProfile`
- `GetArenaProgress`
- `GetMerchantPlayerState`
- `ResolveBossEncounter`
- `SellLoot`
- `BuyWeapon`
- `EquipWeapon`
- `CompleteQuickGame`

The Game service calls Arena through `ArenaBridge` using signed cross-PID microservice requests. That keeps the merchant game as one possible XP source instead of making Arena depend on merchant-game internals. The browser client calls generated Game and Arena clients; it should not hand-build microservice routes.

### Generated Web Clients

Generated client output lives in PID-specific folders:

```text
src/generated/game/beamable
src/generated/arena/beamable
```

When a C# microservice callable, DTO, or service contract changes, regenerate the relevant web client:

```powershell
dotnet tool run beam -- project generate web-client --output-dir <output-dir> --lang ts -q
```

Generated files should be treated as generated code.

## Beamable Content

This sample tracks Beamable local content under `.beamable/local` so the required sample content can travel with the repo.

Tracked sample content includes:

- Merchant caves
- Merchant bosses
- Merchant drop tables
- Loot items
- Weapons
- Weapon shop/store listings
- Merchant progression
- `currency.gold`
- Arena-side currencies, leaderboards, tournaments, and game types

The shipped content folders are:

```text
.beamable/local/content/DE_85621827599904768/global
.beamable/local/content/DE_85621805437202432/global
```

The first folder is the sample Game PID. The second folder is the sample Arena PID.

### Publish Content

From the repo root:

```powershell
dotnet tool restore
dotnet tool run beam -- init
dotnet tool run beam -- config -q --raw
dotnet tool run beam -- content ps
dotnet tool run beam -- content publish
```

If you use your own Beamable realms, copy the committed content into your own PID folder before publishing:

```powershell
New-Item -ItemType Directory -Force ".beamable/local/content/<YOUR_GAME_PID>/global" | Out-Null
Copy-Item ".beamable/local/content/DE_85621827599904768/global/*" ".beamable/local/content/<YOUR_GAME_PID>/global/" -Recurse -Force
```

Repeat the same pattern for the Arena PID if you use a separate Arena realm.

Keep these files ignored:

- `.beamable/temp/**`
- `beamable.local.json`

Those files can contain local machine state, auth state, logs, or secrets.
