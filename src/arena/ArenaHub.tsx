import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { PlayerSession } from "../shared/types";

type ArenaHubProps = {
  error: string | null;
  isBusy: boolean;
  onEnterGame: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  session: PlayerSession;
};

export function ArenaHub({
  error,
  isBusy,
  onEnterGame,
  onLogout,
  onRefresh,
  session,
}: ArenaHubProps) {
  const progress = session.arenaProgress;
  const nextLevelXp = Math.max(progress.nextLevelXp, progress.currentLevelXp + progress.xpToNextLevel, 1);
  const fillPercent = Math.max(6, Math.min(100, (progress.totalXp / nextLevelXp) * 100));

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.realmLabel}>Arena PID</Text>
          <Text style={styles.playerText}>{session.email}</Text>
        </View>
        <View style={styles.headerActions}>
          <SmallButton label="Refresh" onPress={onRefresh} />
          <SmallButton label="Logout" onPress={onLogout} tone="dark" />
        </View>
      </View>

      <View style={styles.scene}>
        <View style={styles.colosseumWall}>
          {Array.from({ length: 7 }).map((_, index) => (
            <View key={index} style={styles.wallArch} />
          ))}
        </View>

        <View style={styles.pillarWrap}>
          <View style={styles.pillarCap} />
          <View style={styles.pillar}>
            <View style={[styles.pillarFill, { height: `${fillPercent}%` }]} />
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>LV {progress.level}</Text>
            </View>
          </View>
          <View style={styles.pillarBase} />
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.title}>Arena Progress</Text>
          <Text style={styles.progressText}>{progress.totalXp} total XP</Text>
          <Text style={styles.nextText}>
            {progress.xpToNextLevel > 0
              ? `${progress.xpToNextLevel} XP to next level`
              : "Max V1 level reached"}
          </Text>

          <View style={styles.healthRow}>
            <HealthPill label="Game" value={session.health.game} />
            <HealthPill label="Arena" value={session.health.arena} />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            onPress={onEnterGame}
            style={({ pressed }) => [styles.gateButton, pressed ? styles.pressed : null]}
          >
            {isBusy ? <ActivityIndicator color="#22160a" /> : <Text style={styles.gateText}>Enter Game Gate</Text>}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

type SmallButtonProps = {
  label: string;
  onPress: () => void;
  tone?: "light" | "dark";
};

function SmallButton({ label, onPress, tone = "light" }: SmallButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.smallButton, tone === "dark" ? styles.smallButtonDark : null]}
    >
      <Text style={[styles.smallButtonText, tone === "dark" ? styles.smallButtonTextDark : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

type HealthPillProps = {
  label: string;
  value: string;
};

function HealthPill({ label, value }: HealthPillProps) {
  return (
    <View style={styles.healthPill}>
      <Text style={styles.healthLabel}>{label}</Text>
      <Text style={styles.healthValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    minHeight: 720,
    padding: 24,
    gap: 18,
    backgroundColor: "#101827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  realmLabel: {
    color: "#f7c35f",
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
    backgroundColor: "#20314f",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    padding: 34,
  },
  colosseumWall: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 42,
    height: 300,
    borderTopLeftRadius: 190,
    borderTopRightRadius: 190,
    backgroundColor: "#c99555",
    borderWidth: 8,
    borderColor: "#efd18a",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  wallArch: {
    width: 58,
    height: 126,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#5c3f2d",
    marginTop: 72,
  },
  pillarWrap: {
    width: 170,
    alignItems: "center",
    zIndex: 2,
  },
  pillarCap: {
    width: 158,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#f0d08b",
  },
  pillar: {
    width: 104,
    height: 370,
    overflow: "hidden",
    backgroundColor: "#e6e0cf",
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderColor: "#b9a77e",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  pillarFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#f59e0b",
  },
  levelBadge: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderWidth: 4,
    borderColor: "#f8fafc",
    marginBottom: 140,
  },
  levelBadgeText: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  pillarBase: {
    width: 188,
    height: 34,
    borderRadius: 6,
    backgroundColor: "#b97835",
  },
  infoPanel: {
    width: 360,
    padding: 24,
    borderRadius: 8,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    gap: 12,
    zIndex: 2,
  },
  title: {
    color: "#f8fafc",
    fontSize: 34,
    fontWeight: "900",
  },
  progressText: {
    color: "#f7c35f",
    fontSize: 24,
    fontWeight: "900",
  },
  nextText: {
    color: "#cbd5e1",
    fontSize: 15,
    lineHeight: 21,
  },
  healthRow: {
    flexDirection: "row",
    gap: 8,
  },
  healthPill: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#1f2937",
  },
  healthLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  healthValue: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "800",
  },
  errorText: {
    color: "#fecaca",
    fontSize: 14,
    lineHeight: 20,
  },
  gateButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#f7c35f",
    marginTop: 8,
  },
  gateText: {
    color: "#22160a",
    fontSize: 16,
    fontWeight: "900",
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
  pressed: {
    opacity: 0.85,
    transform: [{ translateY: 1 }],
  },
});
