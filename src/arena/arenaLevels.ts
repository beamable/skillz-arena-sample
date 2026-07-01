import type { GetGameArenaProgressResponse } from "../generated/game/beamable/clients/types";

/**
 * DISPLAY-ONLY Arena level ladder.
 *
 * The Arena microservice (services/Arena/ArenaProgressionRules.cs -> TotalXpThresholds)
 * remains the canonical source of truth for level and XP. These thresholds are duplicated
 * here purely to position the level-marker plaques on the XP pillar. The current level and
 * XP numbers shown to the player still come from the Arena progress response, never from
 * this constant. If the server tuning changes, update this ladder to match (a future
 * improvement is to source thresholds from content so there is a single source).
 */
export const ARENA_TOTAL_XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000] as const;

export type ArenaLevelMarker = {
  /** 1-based level reached once totalXp >= threshold. */
  level: number;
  /** Total XP required to reach this level. */
  threshold: number;
  /** Vertical position along the pillar, 0 (bottom) .. 1 (top). */
  position: number;
  /** Whether the player has reached this level. */
  reached: boolean;
};

/**
 * Build the level markers to render along the pillar, skipping level 1 (the base at 0 XP).
 * Positions are normalized against the top threshold so the highest level sits at the cap.
 */
export function buildArenaLevelMarkers(totalXp: number): ArenaLevelMarker[] {
  const maxThreshold = ARENA_TOTAL_XP_THRESHOLDS[ARENA_TOTAL_XP_THRESHOLDS.length - 1] || 1;

  return ARENA_TOTAL_XP_THRESHOLDS.map((threshold, index) => ({
    level: index + 1,
    threshold,
    position: threshold / maxThreshold,
    reached: totalXp >= threshold,
  })).filter((marker) => marker.level > 1);
}

/**
 * Fraction (0..1) of progress within the CURRENT level band, derived from canonical
 * response fields. At max level this returns 1. Used to fill the pillar.
 */
export function arenaBandFraction(progress: GetGameArenaProgressResponse): number {
  const bandSize = Math.max(1, progress.nextLevelXp - progress.currentLevelXp);
  const bandGained = Math.min(bandSize, Math.max(0, progress.totalXp - progress.currentLevelXp));
  const isMaxLevel = progress.xpToNextLevel <= 0 && progress.nextLevelXp <= progress.currentLevelXp;
  return isMaxLevel ? 1 : bandGained / bandSize;
}
