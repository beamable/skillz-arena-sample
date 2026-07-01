import type { GetGameArenaProgressResponse } from "../generated/game/beamable/clients/types";

export const defaultArenaProgress: GetGameArenaProgressResponse = {
  success: true,
  error: "",
  playerKey: "",
  totalXp: 0,
  level: 1,
  currentLevelXp: 0,
  nextLevelXp: 100,
  xpToNextLevel: 100,
  duplicateEvent: false,
  didLevelUp: false,
  xpGranted: 0,
  lastEventId: "",
  updatedAt: "",
};
