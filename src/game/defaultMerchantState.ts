import type { GetMerchantPlayerStateResponse } from "../generated/game/beamable/clients/types";
import { defaultArenaProgress } from "../arena/defaultArenaProgress";

export const defaultMerchantState: GetMerchantPlayerStateResponse = {
  success: false,
  error: "",
  gameXp: 0,
  gameLevel: 1,
  equippedWeaponId: "items.weapon.starter_blade",
  startingWeaponId: "items.weapon.starter_blade",
  gold: "0",
  loot: [],
  ownedWeapons: [],
  arenaProgress: {
    ...defaultArenaProgress,
    duplicateEvent: false,
    didLevelUp: false,
    xpGranted: 0,
  },
};
