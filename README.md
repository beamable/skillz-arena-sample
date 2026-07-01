# Skillz Arena Sample

React Native + TypeScript Beamable Web SDK sample for a two-PID Arena/game prototype.

## Phase 1 Personal Test Procedure

### 1. Confirm prerequisites

- Node.js is installed.
- .NET SDK is installed.
- The Beamable Web SDK package is installed at `@beamable/sdk@1.2.1`.
- The sample game `GameService` is released to the sample game PID.
- The Arena `Arena` service and `ArenaStorage` are released to the Arena PID.
- Both realms have the realtime notification config:
  - namespace: `notification`
  - key: `publisher`
  - value: `beamable`

### 2. Install dependencies

```powershell
npm install
```

### 3. Create local public client env

Create `.env.local` in the repo root. This file is ignored by git.

```env
EXPO_PUBLIC_BEAMABLE_CID=1689160644344843
EXPO_PUBLIC_BEAMABLE_ARENA_PID=DE_85621805437202432
EXPO_PUBLIC_BEAMABLE_GAME_PID=DE_85621827599904768
```

Do not put project secrets in `.env.local`. The browser client only needs CID/PID values.

### 4. Run validation checks

```powershell
npm run typecheck
dotnet test game-services\game-services.sln
dotnet test services\services.sln
```

Expected result:

- TypeScript passes.
- GameService tests pass.
- Arena tests pass.

### 5. Start the web app

```powershell
npm run web -- --port 63178
```

Open:

```text
http://localhost:63178
```

### 6. Test a new account

1. Select `Signup`.
2. Enter a test email and password.
3. Click `Create Merchant`.
4. Confirm the Arena hub loads.

Expected Arena hub state:

- Header shows `Arena PID`.
- Player email is visible.
- `Game` health is `healthy`.
- `Arena` health is `healthy`.
- Arena Progress shows level 1 / 0 XP for a new account.
- `Enter Game Gate` button is visible.

### 7. Test route switching

1. Click `Enter Game Gate`.
2. Confirm the Merchant Town screen loads.
3. Click `Return to Arena`.
4. Confirm the Arena hub loads again.

Expected Merchant Town state:

- Header shows `Game PID`.
- Gold is `0`.
- Game XP is `0`.
- Game Level is `1`.
- Weapon is `Starter Blade`.
- Arena progress is shown through the `GameService` bridge.
- Cave and Shop controls are disabled placeholders for later phases.

### 8. Test returning login

1. Click `Logout`.
2. Select `Login`.
3. Enter the same email and password.
4. Click `Enter Arena`.

Expected result:

- The Arena hub loads again.
- Gate transition still works.
- No browser console microservice 500s should appear for `GetArenaProgress`.

## Current Microservice Client Shape

The Phase 1 web client uses Beamable CLI generated web clients.

Generated client output lives in PID-specific folders:

- `src/generated/game/beamable/clients`
- `src/generated/arena/beamable/clients`

The generated clients extend `BeamMicroServiceClient` from `@beamable/sdk`.

The game client is registered in `src/shared/beam/beamContexts.ts`:

```ts
beam.use(GameServiceClient);
```

The Arena client is registered separately against the Arena PID:

```ts
beam.use(ArenaClient);
```

The Web SDK then calls microservice endpoints through generated methods:

```ts
await beam.gameServiceClient.getArenaProgress();
```

For C# methods with named DTO parameters, generated client args match the parameter name. For example, `CompleteQuickGame(CompleteQuickGameRequest request)` is called with:

```ts
await beam.gameServiceClient.completeQuickGame({ request });
```

The game backend calls Arena through `game-services/GameService/ArenaBridge.cs` using `ISignedRequester` and explicit cross-PID JSON routes:

```text
/basic/{arenaCid}.{arenaPid}.micro_Arena/GetProgress
```

That signed bridge also wraps Arena DTOs as:

```json
{
  "request": {}
}
```

This is required because Arena service methods use named parameters such as `GetProgress(GetArenaProgressRequest request)`.

## Generated Web Client Command

The verified Beam CLI 7.2.0 command shape is:

```powershell
dotnet tool run beam -- project generate web-client --output-dir <the-output-directory> --lang ts -q
```

The CLI also accepts:

```powershell
dotnet tool run beam -- project generate web-client -o <the-output-directory> -l typescript -q
```

Valid `--lang` values are:

- `typescript`
- `ts`
- `javascript`
- `js`

Generated clients should be written to dedicated PID-specific generated folders such as:

```text
src/generated/game/beamable
src/generated/arena/beamable
```

Generated files should then be treated as generated code and not manually edited.

Whenever a C# microservice callable, DTO, or service contract changes, regenerate the relevant web client before compiling the React Native app.

## Beamable Local Content (`.beamable/local`)

### Why this folder is tracked here (and what to do in production)

Beamable caches your local content workspace under `.beamable/local/content/<PID>/<manifest>/…`. By default — and as the recommended practice for real projects — this folder is **gitignored**, because content is realm-specific working state that is normally owned and edited through the Beamable Portal / your own content pipeline, with your realm as the source of truth.

For this sample we intentionally **un-ignore `.beamable/local`** so the exact content set the prototype depends on ships with the repo: caves, bosses, drop tables, loot, weapons, the weapon store/listings, progression, and `currency.gold` on the game realm, plus the Arena-side currencies, leaderboards, tournaments, and game types. That lets you clone and publish it straight to your own realm instead of recreating every content object by hand.

What stays ignored even here (never commit these):

- `.beamable/temp/**` — CLI auth token (`auth.beam.json`) and logs.
- `beamable.local.json` — local machine state that can hold secrets.

Production recommendation: keep `.beamable/local` gitignored in production projects and manage content through the Portal / your content workflow. Treat committing content into source control as a sample-only convenience, not a pattern to copy into a shipping game.

### Publishing this content to your realm

Local content is cached per realm under `.beamable/local/content/<PID>/global`. This repo ships two PID folders from the sample's realms:

- Game PID `DE_85621827599904768` — merchant game content (`merchant_*`, `items.loot.*`, `items.weapon.*`, `stores.*`, `listings.*`, `currency.gold`).
- Arena PID `DE_85621805437202432` — Arena-side content (currencies, leaderboards, tournaments, game types).

From the repo root (PowerShell):

```powershell
# 1. Restore the Beam CLI (it is a local dotnet tool)
dotnet tool restore

# 2. Log in and point the CLI at YOUR org + realm
dotnet tool run beam -- init

# 3. Confirm the CLI is targeting the realm/PID you expect
dotnet tool run beam -- config -q --raw

# 4. (optional) Preview the local content the CLI sees before publishing
dotnet tool run beam -- content ps

# 5. Publish the local 'global' manifest to that realm
dotnet tool run beam -- content publish
```

Because the local cache is keyed by PID, `content publish` publishes the content stored under the **currently targeted** realm's PID folder:

- If you work in the sample's realms (same CID/PIDs), the committed folders already match — step 5 publishes directly.
- If you use your **own** realm (a different PID), copy the shipped content into your realm's folder first, then publish. For the game realm:

  ```powershell
  # replace <YOUR_GAME_PID> with your realm's game PID
  New-Item -ItemType Directory -Force ".beamable/local/content/<YOUR_GAME_PID>/global" | Out-Null
  Copy-Item ".beamable/local/content/DE_85621827599904768/global/*" ".beamable/local/content/<YOUR_GAME_PID>/global/" -Recurse -Force
  ```

  Repeat with the Arena PID folder if you run a separate Arena realm, then run steps 3–5 with the CLI targeting that realm.

Finally, point the web client at the realm you published to by setting the matching CID/PIDs in `.env.local` (see "Create local public client env" above).
