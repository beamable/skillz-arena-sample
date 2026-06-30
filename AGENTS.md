# Skillz Arena Sample Instructions

## Operating Mode

- Act as a senior Beamable engineer, senior Unity engineer, lead web UI/UX designer, and senior React + TypeScript engineer.
- Be professional, systemic, logical, realistic, and direct.
- Treat this project as a production-shaped sample, not a throwaway demo. Keep the code readable enough that another engineer can extend it without archaeology.
- For complex coding decisions, read the relevant docs and verify current behavior before implementing. If the evidence is missing, say so plainly.

## Project Goal

We are building a Beamable Web SDK sample that demonstrates:

- An Arena meta-progression layer.
- One additional quick game that can award Arena XP.
- A React Native + TypeScript client experience.
- Beamable-backed auth, player state, progression, content, inventory, rewards, microservices, and microstorage where appropriate.

The player-facing goal is simple: a user signs in, plays or simulates activity in a quick game, earns XP, and sees Arena progression update through Beamable-backed systems.

## Beamable Source Of Truth

- Use the official Beamable Web SDK docs first: https://help.beamable.com/WebSDK-Latest/
- Use the Web SDK getting started/install docs when setting up packages, auth, initialization, and basic client flows.
- Use Beamable documentation and local Beamable source investigation for microservices, microstorage, content, inventory, stats, currency, and deployment details.
- Global Beamable skills are available and should be used whenever they give a cleaner path to correct implementation or validation.
- You may use:
  - `$moe-aiMoe-navigator` for repo navigation and private `.aiMoe` knowledge lookup.
  - `$moe-beamable-local-repo-investigation` for local Beamable source investigation, especially Web SDK, microservices, and microstorage behavior.

If `.aiMoe/AGENTS.md` exists, read it after this file. If `.aiMoe/repo-map.md` exists, read it before broad repo research. `.aiMoe` is private local memory and must not be committed, pushed, copied into public docs, or used to modify official project instructions.

## Architecture Direction

Use the Arena architecture from the ingestion prompt as background for ownership boundaries:

- Arena owns canonical XP and progression state.
- Arena owns level rules, XP ledger, reward eligibility, claim history, fraud/audit/idempotency records, and Arena-specific content if needed.
- Each game owns its own gameplay validation, local content, local inventory, local currencies, local rewards, and local game economy.
- Games should call Arena APIs for progression updates instead of reading or writing Arena storage directly.
- Beamable stats may mirror Arena XP/level for UI, segmentation, or convenience, but mirrored stats are not the canonical source of truth.
- Microstorage is scoped to its Beamable realm/project. Do not treat storage in one PID as directly shared with another PID.

For this sample, keep the architecture intentionally small but still split by ownership:

- Arena microservice and Arena microstorage live in the Arena PID.
- The sample quick game lives in a separate game PID.
- Both PIDs live under one CID.
- Do not build cross-CID complexity unless the sample requirements change.
- Prefer explicit service APIs over shared database assumptions.
- When sending data between the two PIDs, use simple JSON contracts instead of sharing a package or compiled common DTO assembly. We are optimizing for sample clarity over internal library reuse.
- Treat cross-PID data contracts as public API boundaries: version them carefully, validate inputs, and avoid leaking storage schema assumptions.

## Microservices And Storage

- Beamable microservices and microstorage code are written in C#.
- Use the Beamable CLI generation flow when the project needs generated client code, service scaffolding, or project metadata updates.
- You may use the Beamable CLI as needed, but ask Moe before running CLI commands.
- Keep generated code and handwritten code boundaries clean. Do not hand-edit generated files unless the Beamable workflow explicitly expects it.
- Arena storage belongs to the Arena PID. The game PID should call Arena service APIs instead of reading Arena microstorage directly.

## Identity Decision

Ignore Skillz federation from the ingestion prompt for this sample.

We are not depending on SkillzId, Skillz tokens, or federated sign-in. Use email auth for simplicity. If future work adds Skillz federation, treat that as a separate identity layer and do not mix it into the email-auth sample path.

Do not imply Beamable player IDs are globally meaningful across PIDs. For this sample, email auth is the practical onboarding path, and Beamable player identity is scoped to the configured Beamable realm.

## XP Event Model

Arena XP should be recorded through event-style writes, not raw client-driven "set XP" calls.

A useful XP event shape should include:

- Event ID for idempotency.
- Beamable player identity for the current sample.
- Source game or feature.
- Event type, such as `match_completed`, `mission_completed`, or `daily_bonus`.
- XP amount.
- Occurred-at timestamp.
- Optional match/session/reference IDs.
- Optional metadata for debugging, fraud review, and analytics.

The service layer should reject or ignore duplicate event IDs. The client should never be the final authority for XP totals, reward eligibility, or claim completion.

## Reward Model

Keep reward ownership explicit:

- Arena-specific rewards belong to Arena progression.
- Game-specific rewards belong to the game.
- Reward grants should be server-authoritative.
- Avoid client-only flows like `get XP -> if level is high enough -> grant reward`.

Preferred shape:

1. Game validates local activity.
2. Game requests Arena XP/progression update.
3. Arena records the XP event and returns updated progression.
4. Game asks Arena to validate reward eligibility when needed.
5. Game grants local rewards only after server-side approval.
6. Arena records claim history if the claim is global.

## Frontend Direction

- Use React Native + TypeScript.
- Keep UI state typed, predictable, and separated from Beamable service calls.
- Design for a real player loop: sign in, choose activity, complete quick game action, receive XP, inspect Arena progression, inspect claimable rewards.
- UI should feel like a playable sample, not a marketing page.
- Favor dense, clear game UI over decorative screens. The sample should teach the integration through interaction.
- Keep accessibility, responsive layout, loading states, error states, and empty states in scope.

## Code Quality Rules

- Prefer small typed modules with clear ownership.
- Keep Beamable access behind service/client wrappers instead of scattering SDK calls through UI components.
- Document non-obvious architecture decisions, idempotency behavior, and trust boundaries.
- Do not over-comment obvious code.
- Prioritize performance, efficiency, and readability.
- Avoid broad abstractions until duplication or complexity proves they are needed.
- Keep test coverage proportional to risk. Progression math, XP idempotency, auth boundaries, reward eligibility, and service API contracts deserve focused tests.
- Do not hardcode secrets, realm secrets, private tokens, or production credentials.
- Use environment/configuration boundaries for Beamable realm settings.

## Validation Expectations

Before claiming work is complete:

- Run the relevant type checks, tests, linting, and app build commands available in the repo.
- For UI work, verify the actual screen behavior, not only compilation.
- For Beamable behavior, validate against official docs or local Beamable source when the behavior is non-trivial.
- State what was tested and what was not tested.

## Useful Beamable Topics

When the work touches these areas, check the current Beamable docs and/or local source:

- Web SDK setup and initialization.
- Email/password auth.
- Player stats.
- Inventory.
- Virtual currency.
- Content.
- Microservices.
- Microservice deployment.
- Microservice storage / microstorage.
- Microservice routing.
- Signed requests if cross-PID routing becomes relevant later.
- Analytics.
