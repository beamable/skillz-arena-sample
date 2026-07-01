import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { getGameBeam } from "../shared/beam/beamContexts";
import { toUserFacingError } from "../shared/beam/beamErrors";
import type { PlayerSession } from "../shared/types";
import type { GetMerchantPlayerStateResponse } from "../generated/game/beamable/clients/types";

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
  onEnterCave: (cave: MerchantCave, boss: MerchantBoss | undefined) => void;
  onLogout: () => void;
  onRefreshArena: () => void;
  onReturnToArena: () => void;
  session: PlayerSession;
};

export function TownScreen({
  error,
  isBusy,
  merchantState,
  onEnterCave,
  onLogout,
  onRefreshArena,
  onReturnToArena,
  session,
}: TownScreenProps) {
  const [content, setContent] = useState<MerchantGameContent | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [isContentLoading, setIsContentLoading] = useState(true);

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

  const visibleError = error ?? contentError;

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
            Phase 2 loads the merchant economy and encounter menu from Beamable game-realm content.
          </Text>

          <View style={styles.statGrid}>
            <StatCard label="Gold" value="0 Gold" />
            <StatCard label="Game XP" value={`${merchantState.gameXp}`} />
            <StatCard label="Game Level" value={`${merchantState.gameLevel}`} />
            <StatCard
              label="Weapon"
              value={
                content
                  ? `${content.startingWeapon.displayName} P${content.startingWeapon.power}`
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
                  <Text style={styles.sectionTitle}>{content.shop.title}</Text>
                  <Text style={styles.sectionHint}>Phase 4 store actions</Text>
                </View>
                {content.shop.listings.map((listing) => (
                  <ShopListingRow key={listing.id} listing={listing} />
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.actions}>
            <PrimaryButton label="Return to Arena" onPress={onReturnToArena} />
            <DisabledAction label="Shop" />
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

function DisabledAction({ label }: { label: string }) {
  return (
    <View style={styles.disabledAction}>
      <Text style={styles.disabledActionText}>{label} pending</Text>
    </View>
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

function ShopListingRow({ listing }: { listing: MerchantShopListing }) {
  return (
    <View style={styles.contentRow}>
      <View style={styles.contentRowMain}>
        <Text style={styles.contentRowTitle}>{listing.weapon.displayName}</Text>
        <Text style={styles.contentRowSubtitle}>
          Power {listing.weapon.power} - Tier {listing.weapon.tier}
        </Text>
      </View>
      <Text style={styles.priceText}>
        {listing.priceAmount} {listing.priceSymbol}
      </Text>
    </View>
  );
}
