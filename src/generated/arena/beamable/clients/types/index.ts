/**
 * ⚠️ THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
 * All manual edits will be lost when this file is regenerated.
 */

export type HealthCheckResponse = { 
  status: string; 
  version: string; 
  timestamp: string; 
};

export type RecordArenaXpResponse = { 
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

export type RecordArenaXpRequest = { 
  eventId: string; 
  playerKey: string; 
  sourceCid: string; 
  sourcePid: string; 
  sourceGame: string; 
  eventType: string; 
  xpAmount: number; 
  occurredAt: string; 
  matchId: string; 
  sessionId: string; 
  metadataJson: string; 
};

export type RecordXpEventRequestArgs = { 
  request: RecordArenaXpRequest; 
};

export type GetArenaProgressResponse = { 
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

export type GetArenaProgressRequest = { 
  playerKey: string; 
};

export type GetProgressRequestArgs = { 
  request: GetArenaProgressRequest; 
};
