import type { Beam, ContentBase } from "@beamable/sdk";

const GOLD_CURRENCY_ID = "currency.gold";
const PROGRESSION_ID = "merchant_progression.default";
const STORE_ID = "stores.merchant_weapon_shop";

const CAVE_IDS = [
  "merchant_caves.echo_cave",
  "merchant_caves.crystal_grotto",
  "merchant_caves.dragon_vault",
] as const;

const BOSS_IDS = [
  "merchant_bosses.mossback_ogre",
  "merchant_bosses.glass_wyrm",
  "merchant_bosses.ancient_drake",
] as const;

const DROP_TABLE_IDS = [
  "merchant_drop_tables.mossback_ogre",
  "merchant_drop_tables.glass_wyrm",
  "merchant_drop_tables.ancient_drake",
] as const;

const WEAPON_IDS = [
  "items.weapon.starter_blade",
  "items.weapon.moonsteel_cutlass",
  "items.weapon.dragonbone_halberd",
] as const;

const LOOT_IDS = [
  "items.loot.glowcap_ore",
  "items.loot.siren_glass",
  "items.loot.phoenix_ember",
  "items.loot.starforged_core",
] as const;

export type MerchantWeapon = {
  id: string;
  displayName: string;
  power: number;
  tier: number;
};

export type MerchantLoot = {
  id: string;
  displayName: string;
  rarity: string;
  sellPrice: number;
};

export type MerchantCave = {
  id: string;
  displayName: string;
  tier: number;
  requiredGameLevel: number;
  bossId: string;
  backgroundKey: string;
};

export type MerchantBoss = {
  id: string;
  displayName: string;
  tier: number;
  baseGameXp: number;
  arenaXpOnDefeat: number;
  dropTableId: string;
  spriteKey: string;
};

export type MerchantDropEntry = {
  itemContentId: string;
  weight: number;
  minQuantity: number;
  maxQuantity: number;
};

export type MerchantDropTable = {
  id: string;
  entries: MerchantDropEntry[];
};

export type MerchantProgression = {
  id: string;
  startingWeaponId: string;
  gameXpThresholds: number[];
};

export type MerchantShopListing = {
  id: string;
  weapon: MerchantWeapon;
  priceAmount: number;
  priceSymbol: string;
};

export type MerchantShop = {
  id: string;
  title: string;
  listingIds: string[];
  listings: MerchantShopListing[];
};

export type MerchantGameContent = {
  goldCurrencyId: string;
  weapons: MerchantWeapon[];
  loot: MerchantLoot[];
  caves: MerchantCave[];
  bosses: MerchantBoss[];
  dropTables: MerchantDropTable[];
  progression: MerchantProgression;
  startingWeapon: MerchantWeapon;
  shop: MerchantShop;
};

type ContentProperties = Record<string, { data?: unknown; links?: string[] } | undefined>;

export async function loadMerchantGameContent(beam: Beam): Promise<MerchantGameContent> {
  const contents = await beam.content.getByIds({
    ids: [
      GOLD_CURRENCY_ID,
      PROGRESSION_ID,
      STORE_ID,
      ...CAVE_IDS,
      ...BOSS_IDS,
      ...DROP_TABLE_IDS,
      ...WEAPON_IDS,
      ...LOOT_IDS,
    ],
    manifestId: "global",
  });

  const byId = new Map(contents.map((content) => [content.id, content]));

  const progression = normalizeProgression(requireContent(byId, PROGRESSION_ID));
  const weapons = WEAPON_IDS.map((id) => normalizeWeapon(requireContent(byId, id)));
  const startingWeapon = weapons.find((weapon) => weapon.id === progression.startingWeaponId);
  if (!startingWeapon) {
    throw new Error(`Starting weapon '${progression.startingWeaponId}' is missing from the game content set.`);
  }

  const storeContent = requireContent(byId, STORE_ID);
  const listingIds = getLinks(storeContent, "listings");
  const listingContents = listingIds.length
    ? await beam.content.getByIds({ ids: listingIds, manifestId: "global" })
    : [];
  const listingWeaponIds = listingContents
    .map((listing) => getOfferItemId(listing))
    .filter((id): id is string => Boolean(id));

  const extraWeaponContents = listingWeaponIds.filter((id) => !byId.has(id)).length
    ? await beam.content.getByIds({
        ids: listingWeaponIds.filter((id) => !byId.has(id)),
        manifestId: "global",
      })
    : [];

  for (const content of [...listingContents, ...extraWeaponContents]) {
    byId.set(content.id, content);
  }

  const allWeapons = mergeById([
    ...weapons,
    ...extraWeaponContents.map((content) => normalizeWeapon(content)),
  ]);
  const weaponsById = new Map(allWeapons.map((weapon) => [weapon.id, weapon]));

  return {
    goldCurrencyId: GOLD_CURRENCY_ID,
    weapons: allWeapons,
    loot: LOOT_IDS.map((id) => normalizeLoot(requireContent(byId, id))),
    caves: CAVE_IDS.map((id) => normalizeCave(requireContent(byId, id))),
    bosses: BOSS_IDS.map((id) => normalizeBoss(requireContent(byId, id))),
    dropTables: DROP_TABLE_IDS.map((id) => normalizeDropTable(requireContent(byId, id))),
    progression,
    startingWeapon,
    shop: normalizeShop(storeContent, listingContents, weaponsById),
  };
}

function normalizeWeapon(content: ContentBase): MerchantWeapon {
  return {
    id: content.id,
    displayName: getString(content, "displayName", labelFromContentId(content.id)),
    power: getNumber(content, "power", 1),
    tier: getNumber(content, "tier", 1),
  };
}

function normalizeLoot(content: ContentBase): MerchantLoot {
  return {
    id: content.id,
    displayName: getString(content, "displayName", labelFromContentId(content.id)),
    rarity: getString(content, "rarity", "common"),
    sellPrice: getNumber(content, "sellPrice", 0),
  };
}

function normalizeCave(content: ContentBase): MerchantCave {
  return {
    id: content.id,
    displayName: getString(content, "displayName", labelFromContentId(content.id)),
    tier: getNumber(content, "tier", 1),
    requiredGameLevel: getNumber(content, "requiredGameLevel", 1),
    bossId: getString(content, "bossId", ""),
    backgroundKey: getString(content, "backgroundKey", ""),
  };
}

function normalizeBoss(content: ContentBase): MerchantBoss {
  return {
    id: content.id,
    displayName: getString(content, "displayName", labelFromContentId(content.id)),
    tier: getNumber(content, "tier", 1),
    baseGameXp: getNumber(content, "baseGameXp", 0),
    arenaXpOnDefeat: getNumber(content, "arenaXpOnDefeat", 0),
    dropTableId: getString(content, "dropTableId", ""),
    spriteKey: getString(content, "spriteKey", ""),
  };
}

function normalizeDropTable(content: ContentBase): MerchantDropTable {
  const entries = getArray<MerchantDropEntry>(content, "entries", []);

  return {
    id: content.id,
    entries: entries.map((entry) => ({
      itemContentId: entry.itemContentId,
      weight: Number(entry.weight),
      minQuantity: Number(entry.minQuantity),
      maxQuantity: Number(entry.maxQuantity),
    })),
  };
}

function normalizeProgression(content: ContentBase): MerchantProgression {
  return {
    id: content.id,
    startingWeaponId: getString(content, "startingWeaponId", WEAPON_IDS[0]),
    gameXpThresholds: getArray<number>(content, "gameXpThresholds", [0]),
  };
}

function normalizeShop(
  content: ContentBase,
  listingContents: ContentBase[],
  weaponsById: Map<string, MerchantWeapon>,
): MerchantShop {
  return {
    id: content.id,
    title: getString(content, "title", "Merchant Weapon Shop"),
    listingIds: listingContents.map((listing) => listing.id),
    listings: listingContents.flatMap((listing) => {
      const weaponId = getOfferItemId(listing);
      const weapon = weaponId ? weaponsById.get(weaponId) : undefined;
      if (!weapon) {
        return [];
      }

      return [
        {
          id: listing.id,
          weapon,
          priceAmount: getListingPriceAmount(listing),
          priceSymbol: getListingPriceSymbol(listing),
        },
      ];
    }),
  };
}

function getOfferItemId(content: ContentBase): string | undefined {
  const offer = getData<{
    obtainItems?: { contentId?: string }[];
  }>(content, "offer", {});

  return offer.obtainItems?.[0]?.contentId;
}

function getListingPriceAmount(content: ContentBase): number {
  const price = getData<{ currencySymbol?: string; amount?: number }>(content, "price", {});
  return typeof price.amount === "number" ? price.amount : 0;
}

function getListingPriceSymbol(content: ContentBase): string {
  const price = getData<{ currencySymbol?: string; amount?: number }>(content, "price", {});
  return price.currencySymbol ?? GOLD_CURRENCY_ID;
}

function getData<T>(content: ContentBase, field: string, fallback: T): T {
  const properties = content.properties as ContentProperties;
  const data = properties[field]?.data;
  return data === undefined ? fallback : (data as T);
}

function getString(content: ContentBase, field: string, fallback: string): string {
  const value = getData<unknown>(content, field, fallback);
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function getNumber(content: ContentBase, field: string, fallback: number): number {
  const value = getData<unknown>(content, field, fallback);
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getArray<T>(content: ContentBase, field: string, fallback: T[]): T[] {
  const value = getData<unknown>(content, field, fallback);
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function getLinks(content: ContentBase, field: string): string[] {
  const properties = content.properties as ContentProperties;
  return properties[field]?.links ?? [];
}

function requireContent(byId: Map<string, ContentBase>, id: string): ContentBase {
  const content = byId.get(id);
  if (!content) {
    throw new Error(`Beamable content '${id}' is missing from the game realm.`);
  }

  return content;
}

function labelFromContentId(id: string): string {
  const lastSegment = id.split(".").at(-1) ?? id;
  return lastSegment
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function mergeById<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}
