/**
 * Shared tokens for the procedural sprite kit. Kept intentionally small — this is not a full
 * theme system, just the colors the new sprite components need so hex values are not scattered.
 * Existing screen palettes (gold #f7c35f, navy, teal, stone/brown) remain in each *.styles.ts.
 */

export type RarityColor = { base: string; edge: string; glow: string };

const COMMON: RarityColor = { base: "#6b7280", edge: "#9ca3af", glow: "#cbd5e1" };
const UNCOMMON: RarityColor = { base: "#15803d", edge: "#22c55e", glow: "#86efac" };
const RARE: RarityColor = { base: "#1d4ed8", edge: "#3b82f6", glow: "#93c5fd" };
const EXOTIC: RarityColor = { base: "#7c3aed", edge: "#a855f7", glow: "#e9d5ff" };

const RARITY_COLORS: Record<string, RarityColor> = {
  common: COMMON,
  uncommon: UNCOMMON,
  rare: RARE,
  exotic: EXOTIC,
};

export function rarityColors(rarity: string | undefined): RarityColor {
  const key = (rarity ?? "").toLowerCase();
  return RARITY_COLORS[key] ?? COMMON;
}

export type BossKind = "ogre" | "wyrm" | "drake";

/** Pick a creature look from content spriteKey/bossId, falling back to tier. */
export function resolveBossKind(spriteKey: string | undefined, bossId: string | undefined, tier: number): BossKind {
  const key = `${spriteKey ?? ""} ${bossId ?? ""}`.toLowerCase();
  if (/wyrm|glass|grotto|crystal/.test(key)) return "wyrm";
  if (/drake|dragon|ancient|vault/.test(key)) return "drake";
  if (/ogre|mossback|echo/.test(key)) return "ogre";
  if (tier >= 3) return "drake";
  if (tier === 2) return "wyrm";
  return "ogre";
}

export const BOSS_PALETTE: Record<BossKind, { body: string; edge: string; belly: string; eye: string; accent: string }> = {
  ogre: { body: "#4d7c0f", edge: "#365314", belly: "#a3a635", eye: "#fde047", accent: "#78350f" },
  wyrm: { body: "#0e7490", edge: "#155e75", belly: "#a5f3fc", eye: "#ecfeff", accent: "#67e8f9" },
  drake: { body: "#b91c1c", edge: "#7f1d1d", belly: "#f59e0b", eye: "#fde047", accent: "#1f2937" },
};

export type WeaponKind = "blade" | "cutlass" | "halberd";

/** Pick a weapon glyph from weapon content id, falling back to tier. */
export function resolveWeaponKind(weaponId: string | undefined, tier: number): WeaponKind {
  const key = (weaponId ?? "").toLowerCase();
  if (/halberd|dragonbone|polearm|spear/.test(key)) return "halberd";
  if (/cutlass|moonsteel|saber|scimitar/.test(key)) return "cutlass";
  if (/blade|starter|sword|dagger/.test(key)) return "blade";
  if (tier >= 3) return "halberd";
  if (tier === 2) return "cutlass";
  return "blade";
}
