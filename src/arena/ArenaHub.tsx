import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import type { PlayerSession } from "../shared/types";

import { styles } from "./ArenaHub.styles";

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
