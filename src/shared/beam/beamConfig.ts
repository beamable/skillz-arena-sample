export type BeamRealmConfig = {
  cid: string;
  arenaPid: string;
  gamePid: string;
};

export function getBeamRealmConfig(): BeamRealmConfig {
  const cid = process.env.EXPO_PUBLIC_BEAMABLE_CID?.trim();
  const arenaPid = process.env.EXPO_PUBLIC_BEAMABLE_ARENA_PID?.trim();
  const gamePid = process.env.EXPO_PUBLIC_BEAMABLE_GAME_PID?.trim();

  const missing = [
    ["EXPO_PUBLIC_BEAMABLE_CID", cid],
    ["EXPO_PUBLIC_BEAMABLE_ARENA_PID", arenaPid],
    ["EXPO_PUBLIC_BEAMABLE_GAME_PID", gamePid],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing public Beamable config: ${missing.join(", ")}`);
  }

  return {
    cid: cid!,
    arenaPid: arenaPid!,
    gamePid: gamePid!,
  };
}
