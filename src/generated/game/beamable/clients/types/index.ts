/**
 * ⚠️ THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
 * All manual edits will be lost when this file is regenerated.
 */

export type HealthCheckResponse = { 
  status: string; 
  version: string; 
  timestamp: string; 
};

export type PlayerProfileResponse = { 
  success: boolean; 
  error: string; 
  playerId: bigint | string; 
  arenaPlayerKey: string; 
};

export type GetGameArenaProgressResponse = { 
  success: boolean; 
  error: string; 
  playerKey: string; 
  totalXp: number; 
  level: number; 
  currentLevelXp: number; 
  nextLevelXp: number; 
  xpToNextLevel: number; 
  duplicateEvent: boolean; 
  didLevelUp: boolean; 
  xpGranted: number; 
  lastEventId: string; 
  updatedAt: string; 
};

export type CompleteQuickGameArenaProgressResponse = { 
  success: boolean; 
  error: string; 
  playerKey: string; 
  totalXp: number; 
  level: number; 
  currentLevelXp: number; 
  nextLevelXp: number; 
  xpToNextLevel: number; 
  duplicateEvent: boolean; 
  didLevelUp: boolean; 
  xpGranted: number; 
  lastEventId: string; 
  updatedAt: string; 
};

export type CompleteQuickGameResponse = { 
  success: boolean; 
  error: string; 
  eventId: string; 
  xpAwarded: number; 
  progress: CompleteQuickGameArenaProgressResponse; 
};

export type CompleteQuickGameRequest = { 
  quickGameId: string; 
  sessionId: string; 
  score: number; 
  durationSeconds: number; 
};

export type CompleteQuickGameRequestArgs = { 
  request: CompleteQuickGameRequest; 
};
