import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getGameBeam } from "../shared/beam/beamContexts";
import { toUserFacingError } from "../shared/beam/beamErrors";
import type { PlayerSession } from "../shared/types";

import {
  loadMerchantGameContent,
  type MerchantBoss,
  type MerchantGameContent,
  type MerchantShopListing,
} from "./content/gameContent";

type TownScreenProps = {
  error: string | null;
  isBusy: boolean;
  onLogout: () => void;
  onRefreshArena: () => void;
  onReturnToArena: () => void;
  session: PlayerSession;
};

export function TownScreen({
  error,
  isBusy,
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
            <StatCard label="Gold" value={`0 ${content?.goldCurrencyId ?? "currency.gold"}`} />
            <StatCard label="Game XP" value="0" />
            <StatCard label="Game Level" value="1" />
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
                    caveName={cave.displayName}
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
            <DisabledAction label="Cave" />
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
  caveName,
  requiredLevel,
  tier,
}: {
  boss: MerchantBoss | undefined;
  caveName: string;
  requiredLevel: number;
  tier: number;
}) {
  return (
    <View style={styles.contentRow}>
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
    </View>
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

const styles = StyleSheet.create({
  page: {
    minHeight: 720,
    padding: 24,
    gap: 18,
    backgroundColor: "#172033",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  realmLabel: {
    color: "#8fd3c7",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  playerText: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  scene: {
    minHeight: 620,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#4f6f57",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    padding: 34,
  },
  market: {
    width: 440,
    height: 430,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  awning: {
    width: 360,
    height: 72,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 4,
    borderColor: "#f8fafc",
  },
  awningStripe: {
    flex: 1,
    backgroundColor: "#b91c1c",
  },
  awningStripeAlt: {
    backgroundColor: "#f7c35f",
  },
  counter: {
    width: 390,
    height: 170,
    backgroundColor: "#7c4a2d",
    borderWidth: 8,
    borderColor: "#3b281f",
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: {
    color: "#fff7ed",
    fontSize: 26,
    fontWeight: "900",
  },
  crates: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 14,
    marginTop: 18,
  },
  crate: {
    width: 78,
    height: 62,
    backgroundColor: "#925f35",
    borderWidth: 5,
    borderColor: "#5f3a22",
  },
  crateTall: {
    width: 86,
    height: 92,
    backgroundColor: "#a96d3a",
    borderWidth: 5,
    borderColor: "#5f3a22",
  },
  dashboard: {
    width: 500,
    padding: 24,
    borderRadius: 8,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    gap: 14,
  },
  title: {
    color: "#f8fafc",
    fontSize: 34,
    fontWeight: "900",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 15,
    lineHeight: 22,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "47%",
    minHeight: 86,
    padding: 12,
    borderRadius: 6,
    backgroundColor: "#1f2937",
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  statValue: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 8,
  },
  arenaStrip: {
    padding: 14,
    borderRadius: 6,
    backgroundColor: "#0f766e",
  },
  arenaStripLabel: {
    color: "#ccfbf1",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  arenaStripValue: {
    color: "#f0fdfa",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 4,
  },
  contentPanel: {
    gap: 8,
    padding: 12,
    borderRadius: 6,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
  },
  sectionHint: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  contentRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#1f2937",
  },
  contentRowMain: {
    flex: 1,
    minWidth: 0,
  },
  contentRowTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900",
  },
  contentRowSubtitle: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  badgeGroup: {
    flexDirection: "row",
    gap: 6,
  },
  badge: {
    minWidth: 46,
    overflow: "hidden",
    borderRadius: 5,
    backgroundColor: "#374151",
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 5,
    textAlign: "center",
  },
  priceText: {
    color: "#f7c35f",
    fontSize: 13,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    minHeight: 52,
    minWidth: 150,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#f7c35f",
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#22160a",
    fontSize: 15,
    fontWeight: "900",
  },
  disabledAction: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#374151",
    paddingHorizontal: 14,
  },
  disabledActionText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "800",
  },
  smallButton: {
    borderRadius: 6,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  smallButtonDark: {
    backgroundColor: "#374151",
  },
  smallButtonText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "900",
  },
  smallButtonTextDark: {
    color: "#f8fafc",
  },
  disabled: {
    opacity: 0.55,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 14,
    lineHeight: 20,
  },
  loadingText: {
    color: "#bfdbfe",
    fontSize: 14,
    fontWeight: "800",
  },
});
