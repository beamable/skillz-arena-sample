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

export type MerchantLootStackResponse = { 
  itemContentId: string; 
  inventoryContentId: string; 
  quantity: number; 
  instanceIds: (bigint | string)[]; 
};

export type MerchantOwnedWeaponResponse = { 
  itemContentId: string; 
  inventoryContentId: string; 
  quantity: number; 
  instanceIds: (bigint | string)[]; 
};

export type GetMerchantPlayerStateArenaProgressResponse = { 
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

export type GetMerchantPlayerStateResponse = { 
  success: boolean; 
  error: string; 
  gameXp: number; 
  gameLevel: number; 
  equippedWeaponId: string; 
  startingWeaponId: string; 
  gold: bigint | string; 
  loot: MerchantLootStackResponse[]; 
  ownedWeapons: MerchantOwnedWeaponResponse[]; 
  arenaProgress: GetMerchantPlayerStateArenaProgressResponse; 
};

export type MerchantPlayerStateResponse = { 
  gameXp: number; 
  gameLevel: number; 
  equippedWeaponId: string; 
  startingWeaponId: string; 
  gold: bigint | string; 
};

export type MerchantLootRollResponse = { 
  itemContentId: string; 
  quantity: number; 
};

export type ResolveBossEncounterArenaProgressResponse = { 
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

export type ResolveBossEncounterResponse = { 
  success: boolean; 
  error: string; 
  eventId: string; 
  caveId: string; 
  caveName: string; 
  bossId: string; 
  bossName: string; 
  defeated: boolean; 
  gameXpAwarded: number; 
  arenaXpAwarded: number; 
  playerState: MerchantPlayerStateResponse; 
  loot: MerchantLootRollResponse[]; 
  arenaProgress: ResolveBossEncounterArenaProgressResponse; 
};

export type ResolveBossEncounterRequest = { 
  caveId: string; 
  sessionId: string; 
};

export type ResolveBossEncounterRequestArgs = { 
  request: ResolveBossEncounterRequest; 
};

export type SellLootArenaProgressResponse = { 
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

export type SellLootResponse = { 
  success: boolean; 
  error: string; 
  eventId: string; 
  itemContentId: string; 
  quantitySold: number; 
  goldGranted: number; 
  arenaXpAwarded: number; 
  arenaProgress: SellLootArenaProgressResponse; 
};

export type SellLootRequest = { 
  itemContentId: string; 
  quantity: number; 
};

export type SellLootRequestArgs = { 
  request: SellLootRequest; 
};

export type BuyWeaponResponse = { 
  success: boolean; 
  error: string; 
  listingId: string; 
  weaponContentId: string; 
  goldSpent: number; 
};

export type BuyWeaponRequest = { 
  listingId: string; 
};

export type BuyWeaponRequestArgs = { 
  request: BuyWeaponRequest; 
};

export type EquipWeaponResponse = { 
  success: boolean; 
  error: string; 
  equippedWeaponId: string; 
};

export type EquipWeaponRequest = { 
  weaponContentId: string; 
};

export type EquipWeaponRequestArgs = { 
  request: EquipWeaponRequest; 
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
