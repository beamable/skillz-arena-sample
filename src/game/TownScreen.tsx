import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { getGameBeam } from "../shared/beam/beamContexts";
import { getRegisteredGameServiceClient } from "../shared/beam/beamContexts";
import { toUserFacingError } from "../shared/beam/beamErrors";
import type { PlayerSession } from "../shared/types";
import type {
  GetGameArenaProgressResponse,
  GetMerchantPlayerStateResponse,
  MerchantLootStackResponse,
} from "../generated/game/beamable/clients/types";

import {
  loadMerchantGameContent,
  type MerchantBoss,
  type MerchantCave,
  type MerchantGameContent,
  type MerchantShopListing,
} from "./content/gameContent";
import { styles } from "./TownScreen.styles";

type TownScreenProps = {
  error: string | null;
  isBusy: boolean;
  merchantState: GetMerchantPlayerStateResponse;
  onArenaProgressChange: (arenaProgress: GetGameArenaProgressResponse) => void;
  onEnterCave: (cave: MerchantCave, boss: MerchantBoss | undefined) => void;
  onLogout: () => void;
  onMerchantStateChange: (merchantState: GetMerchantPlayerStateResponse) => void;
  onMerchantStateRefresh: () => Promise<GetMerchantPlayerStateResponse>;
  onRefreshArena: () => void;
  onReturnToArena: () => void;
  session: PlayerSession;
};

export function TownScreen({
  error,
  isBusy,
  merchantState,
  onArenaProgressChange,
  onEnterCave,
  onLogout,
  onMerchantStateChange,
  onMerchantStateRefresh,
  onRefreshArena,
  onReturnToArena,
  session,
}: TownScreenProps) {
  const [content, setContent] = useState<MerchantGameContent | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadContent() {
      try {
        setIsContentLoading(true);
        setContentError(null);
        const beam = await getGameBeam();
        const loadedContent = await loadMerchantGameContent(beam);

        if (isActive) {
          setContent(loadedContent);
        }
      } catch (loadError) {
        if (isActive) {
          setContentError(toUserFacingError(loadError));
        }
      } finally {
        if (isActive) {
          setIsContentLoading(false);
        }
      }
    }

    loadContent();

    return () => {
      isActive = false;
    };
  }, []);

  const visibleError = error ?? actionError ?? contentError;
  const goldAmount = Number(merchantState.gold ?? 0);

  async function runMerchantAction(actionId: string, action: () => Promise<void>) {
    setActionKey(actionId);
    setActionError(null);

    try {
      await action();
    } catch (actionFailure) {
      setActionError(toUserFacingError(actionFailure));
    } finally {
      setActionKey(null);
    }
  }

  async function sellLoot(stack: MerchantLootStackResponse) {
    await runMerchantAction(`sell:${stack.itemContentId}`, async () => {
      const beam = await getGameBeam();
      const gameClient = getRegisteredGameServiceClient(beam);
      const result = await gameClient.sellLoot({
        request: {
          itemContentId: stack.itemContentId,
          quantity: stack.quantity,
        },
      });
      if (!result.success) {
        throw new Error(result.error || "Loot sale failed.");
      }

      onArenaProgressChange(result.arenaProgress);
      const merchantState = await onMerchantStateRefresh();
      onMerchantStateChange(merchantState);
    });
  }

  async function buyWeapon(listing: MerchantShopListing) {
    await runMerchantAction(`buy:${listing.id}`, async () => {
      const beam = await getGameBeam();
      const gameClient = getRegisteredGameServiceClient(beam);
      const result = await gameClient.buyWeapon({
        request: {
          listingId: listing.id,
        },
      });
      if (!result.success) {
        throw new Error(result.error || "Weapon purchase failed.");
      }

      const merchantState = await onMerchantStateRefresh();
      onMerchantStateChange(merchantState);
    });
  }

  async function equipWeapon(weaponId: string) {
    await runMerchantAction(`equip:${weaponId}`, async () => {
      const beam = await getGameBeam();
      const gameClient = getRegisteredGameServiceClient(beam);
      const result = await gameClient.equipWeapon({
        request: {
          weaponContentId: weaponId,
        },
      });
      if (!result.success) {
        throw new Error(result.error || "Weapon equip failed.");
      }

      const merchantState = await onMerchantStateRefresh();
      onMerchantStateChange(merchantState);
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.realmLabel}>Game PID</Text>
          <Text style={styles.playerText}>Merchant town for {session.email}</Text>
        </View>
        <View style={styles.headerActions}>
          <SmallButton disabled={isBusy} label="Refresh Arena XP" onPress={onRefreshArena} />
          <SmallButton label="Logout" onPress={onLogout} tone="dark" />
        </View>
      </View>

      <View style={styles.scene}>
        <View style={styles.market}>
          <View style={styles.awning}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={index}
                style={[styles.awningStripe, index % 2 === 0 ? styles.awningStripeAlt : null]}
              />
            ))}
          </View>
          <View style={styles.counter}>
            <Text style={styles.counterText}>Exotic Materials</Text>
          </View>
          <View style={styles.crates}>
            <View style={styles.crate} />
            <View style={styles.crateTall} />
            <View style={styles.crate} />
          </View>
        </View>

        <View style={styles.dashboard}>
          <Text style={styles.title}>Merchant Town</Text>
          <Text style={styles.subtitle}>
            Sell boss loot for Gold, buy better weapons, and climb into stronger caves.
          </Text>

          <View style={styles.statGrid}>
            <StatCard label="Gold" value={`${goldAmount} Gold`} />
            <StatCard label="Game XP" value={`${merchantState.gameXp}`} />
            <StatCard label="Game Level" value={`${merchantState.gameLevel}`} />
            <StatCard
              label="Weapon"
              value={
                content
                  ? `${getWeaponName(content, merchantState.equippedWeaponId)} P${getWeaponPower(content, merchantState.equippedWeaponId)}`
                  : "Loading..."
              }
            />
          </View>

          <View style={styles.arenaStrip}>
            <Text style={styles.arenaStripLabel}>Arena progress via GameService bridge</Text>
            <Text style={styles.arenaStripValue}>
              Level {session.arenaProgress.level} - {session.arenaProgress.totalXp} XP
            </Text>
          </View>

          {isContentLoading ? <Text style={styles.loadingText}>Loading game content...</Text> : null}
          {visibleError ? <Text style={styles.errorText}>{visibleError}</Text> : null}

          {content ? (
            <>
              <View style={styles.contentPanel}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Caves</Text>
                  <Text style={styles.sectionHint}>Phase 3 resolver targets</Text>
                </View>
                {content.caves.map((cave) => (
                  <CaveRow
                    key={cave.id}
                    boss={content.bosses.find((candidate) => candidate.id === cave.bossId)}
                    canEnter={merchantState.gameLevel >= cave.requiredGameLevel}
                    caveName={cave.displayName}
                    onEnter={() => onEnterCave(cave, content.bosses.find((candidate) => candidate.id === cave.bossId))}
                    requiredLevel={cave.requiredGameLevel}
                    tier={cave.tier}
                  />
                ))}
              </View>

              <View style={styles.contentPanel}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Inventory</Text>
                  <Text style={styles.sectionHint}>Beamable items</Text>
                </View>
                {merchantState.loot.length > 0 ? (
                  merchantState.loot.map((stack) => (
                    <LootRow
                      key={stack.itemContentId}
                      disabled={Boolean(actionKey)}
                      isBusy={actionKey === `sell:${stack.itemContentId}`}
                      loot={content.loot.find((item) => item.id === stack.itemContentId)}
                      onSell={() => sellLoot(stack)}
                      stack={stack}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyText}>No loot yet. Echo Cave is open for business.</Text>
                )}
              </View>

              <View style={styles.contentPanel}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{content.shop.title}</Text>
                  <Text style={styles.sectionHint}>Gold shop</Text>
                </View>
                {content.shop.listings.map((listing) => (
                  <ShopListingRow
                    key={listing.id}
                    disabled={Boolean(actionKey)}
                    equippedWeaponId={merchantState.equippedWeaponId}
                    gold={goldAmount}
                    isBusy={actionKey === `buy:${listing.id}` || actionKey === `equip:${listing.weapon.id}`}
                    listing={listing}
                    onBuy={() => buyWeapon(listing)}
                    onEquip={() => equipWeapon(listing.weapon.id)}
                    owned={isWeaponOwned(merchantState, listing.weapon.id)}
                  />
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.actions}>
            <PrimaryButton label="Return to Arena" onPress={onReturnToArena} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

type ButtonProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  tone?: "light" | "dark";
};

function SmallButton({ disabled = false, label, onPress, tone = "light" }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.smallButton, tone === "dark" ? styles.smallButtonDark : null, disabled ? styles.disabled : null]}
    >
      <Text style={[styles.smallButtonText, tone === "dark" ? styles.smallButtonTextDark : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function PrimaryButton({ label, onPress }: Pick<ButtonProps, "label" | "onPress">) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.primaryButton}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function CaveRow({
  boss,
  canEnter,
  caveName,
  onEnter,
  requiredLevel,
  tier,
}: {
  boss: MerchantBoss | undefined;
  canEnter: boolean;
  caveName: string;
  onEnter: () => void;
  requiredLevel: number;
  tier: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!canEnter}
      onPress={onEnter}
      style={[styles.contentRow, canEnter ? styles.contentRowEnabled : styles.contentRowDisabled]}
    >
      <View style={styles.contentRowMain}>
        <Text style={styles.contentRowTitle}>{caveName}</Text>
        <Text style={styles.contentRowSubtitle}>
          Boss: {boss?.displayName ?? "Unknown"} - Arena XP {boss?.arenaXpOnDefeat ?? 0}
        </Text>
      </View>
      <View style={styles.badgeGroup}>
        <Text style={styles.badge}>T{tier}</Text>
        <Text style={styles.badge}>Lv {requiredLevel}</Text>
      </View>
    </Pressable>
  );
}

function LootRow({
  disabled,
  isBusy,
  loot,
  onSell,
  stack,
}: {
  disabled: boolean;
  isBusy: boolean;
  loot: MerchantGameContent["loot"][number] | undefined;
  onSell: () => void;
  stack: MerchantLootStackResponse;
}) {
  const sellPrice = (loot?.sellPrice ?? 0) * stack.quantity;
  const arenaXp = (loot?.arenaXpOnSell ?? 0) * stack.quantity;

  return (
    <View style={styles.contentRow}>
      <View style={styles.contentRowMain}>
        <Text style={styles.contentRowTitle}>{loot?.displayName ?? labelFromContentId(stack.itemContentId)} x{stack.quantity}</Text>
        <Text style={styles.contentRowSubtitle}>
          {loot?.rarity ?? "loot"} - {sellPrice} Gold{arenaXp > 0 ? ` - Arena XP +${arenaXp}` : ""}
        </Text>
      </View>
      <InlineButton disabled={disabled} label={isBusy ? "Selling..." : "Sell Stack"} onPress={onSell} />
    </View>
  );
}

function ShopListingRow({
  disabled,
  equippedWeaponId,
  gold,
  isBusy,
  listing,
  onBuy,
  onEquip,
  owned,
}: {
  disabled: boolean;
  equippedWeaponId: string;
  gold: number;
  isBusy: boolean;
  listing: MerchantShopListing;
  onBuy: () => void;
  onEquip: () => void;
  owned: boolean;
}) {
  const isEquipped = equippedWeaponId === listing.weapon.id;
  const canAfford = gold >= listing.priceAmount;
  const actionLabel = isBusy ? "Working..." : isEquipped ? "Equipped" : owned ? "Equip" : "Buy";
  const actionDisabled = disabled || isBusy || isEquipped || (!owned && !canAfford);

  return (
    <View style={styles.contentRow}>
      <View style={styles.contentRowMain}>
        <Text style={styles.contentRowTitle}>{listing.weapon.displayName}</Text>
        <Text style={styles.contentRowSubtitle}>
          Power {listing.weapon.power} - Tier {listing.weapon.tier}
        </Text>
      </View>
      <Text style={styles.priceText}>
        {listing.priceAmount} {formatCurrencyLabel(listing.priceSymbol)}
      </Text>
      <InlineButton
        disabled={actionDisabled}
        label={actionLabel}
        onPress={owned ? onEquip : onBuy}
      />
    </View>
  );
}

function InlineButton({ disabled, label, onPress }: { disabled: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.inlineButton, disabled ? styles.disabled : null]}
    >
      <Text style={styles.inlineButtonText}>{label}</Text>
    </Pressable>
  );
}

function getWeaponName(content: MerchantGameContent, weaponId: string): string {
  return content.weapons.find((weapon) => weapon.id === weaponId)?.displayName ?? labelFromContentId(weaponId);
}

function getWeaponPower(content: MerchantGameContent, weaponId: string): number {
  return content.weapons.find((weapon) => weapon.id === weaponId)?.power ?? 1;
}

function isWeaponOwned(merchantState: GetMerchantPlayerStateResponse, weaponId: string): boolean {
  return weaponId === merchantState.startingWeaponId || merchantState.ownedWeapons.some((weapon) => weapon.itemContentId === weaponId);
}

function formatCurrencyLabel(currencyId: string): string {
  return currencyId === "currency.gold" ? "Gold" : currencyId;
}

function labelFromContentId(id: string): string {
  const lastSegment = id.split(".").at(-1) ?? id;
  return lastSegment
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
