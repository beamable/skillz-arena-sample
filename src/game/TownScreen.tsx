import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { PlayerSession } from "../shared/types";

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
            Phase 1 proves the game PID shell. Bosses, loot, gold, weapons, and shop content land in later phases.
          </Text>

          <View style={styles.statGrid}>
            <StatCard label="Gold" value="0" />
            <StatCard label="Game XP" value="0" />
            <StatCard label="Game Level" value="1" />
            <StatCard label="Weapon" value="Starter Blade" />
          </View>

          <View style={styles.arenaStrip}>
            <Text style={styles.arenaStripLabel}>Arena progress via GameService bridge</Text>
            <Text style={styles.arenaStripValue}>
              Level {session.arenaProgress.level} · {session.arenaProgress.totalXp} XP
            </Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
      <Text style={styles.disabledActionText}>{label} in Phase 2+</Text>
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
    width: 430,
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
});
