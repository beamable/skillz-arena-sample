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
