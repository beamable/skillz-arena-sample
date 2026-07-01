import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, Text, View } from "react-native";

import type { PlayerSession } from "../shared/types";

import { GateStructure } from "../shared/sprites/GateStructure";

import { arenaBandFraction, buildArenaLevelMarkers } from "./arenaLevels";
import { styles } from "./ArenaHub.styles";

/** Matches the pillar inner height in ArenaHub.styles.ts (`pillar.height`). */
const PILLAR_INNER_HEIGHT = 370;
/** Minimum visible fill so an empty pillar still shows a nub. */
const PILLAR_NUB_FRACTION = 0.06;

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
  const fillFraction = arenaBandFraction(progress);
  const targetPx = Math.max(PILLAR_INNER_HEIGHT * PILLAR_NUB_FRACTION, fillFraction * PILLAR_INNER_HEIGHT);
  const markers = buildArenaLevelMarkers(progress.totalXp);
  const isEmpty = progress.totalXp <= 0;

  const fillAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: targetPx,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [fillAnim, targetPx]);

  function handleGatePress() {
    if (isEntering || isBusy) {
      return;
    }

    setIsEntering(true);
    // Fade the gate overlay in, then HOLD it fully open before switching to town so the
    // transition is actually visible. Town only mounts once this sequence finishes.
    Animated.sequence([
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.delay(700),
    ]).start(({ finished }) => {
      if (finished) {
        onEnterGame();
      }
    });
  }

  const offlineServices = [
    session.health.game !== "healthy" ? "Game" : null,
    session.health.arena !== "healthy" ? "Arena" : null,
  ].filter((label): label is string => label !== null);
  const healthWarning =
    offlineServices.length > 0
      ? `${offlineServices.join(" & ")} service ${offlineServices.length > 1 ? "are" : "is"} unavailable — Arena progress may be stale.`
      : null;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.realmLabel}>Arena PID</Text>
          <Text style={styles.playerText}>{session.email}</Text>
        </View>
        <View style={styles.headerActions}>
          <SmallButton disabled={isBusy} label="Refresh" onPress={onRefresh} />
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
            <Animated.View style={[styles.pillarFill, { height: fillAnim }]} />
            {markers.map((marker) => (
              <View key={marker.level} style={[styles.levelMarker, { bottom: marker.position * PILLAR_INNER_HEIGHT }]}>
                <View style={[styles.markerTick, marker.reached ? styles.markerTickReached : null]} />
                <View style={[styles.markerChip, marker.reached ? styles.markerChipReached : null]}>
                  <Text style={[styles.markerChipText, marker.reached ? styles.markerChipTextReached : null]}>
                    LV {marker.level}
                  </Text>
                </View>
              </View>
            ))}
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>LV {progress.level}</Text>
            </View>
          </View>
          <View style={styles.pillarBase} />
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.title}>Arena Progress</Text>

          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{progress.totalXp} total XP</Text>
            {isBusy ? <ActivityIndicator color="#f7c35f" /> : null}
          </View>

          {isEmpty ? (
            <Text style={styles.emptyText}>No Arena XP yet — enter the gate and defeat a boss to earn it.</Text>
          ) : (
            <Text style={styles.nextText}>
              {progress.xpToNextLevel > 0
                ? `${progress.xpToNextLevel} XP to next level`
                : "Max V1 level reached"}
            </Text>
          )}

          <View style={styles.healthRow}>
            <HealthPill label="Game" value={session.health.game} />
            <HealthPill label="Arena" value={session.health.arena} />
          </View>

          {healthWarning ? <Text style={styles.warningText}>{healthWarning}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={isBusy || isEntering}
            onPress={handleGatePress}
            style={({ pressed }) => [styles.gateButton, pressed ? styles.pressed : null]}
          >
            {isEntering ? <ActivityIndicator color="#22160a" /> : <Text style={styles.gateText}>Enter Game Gate</Text>}
          </Pressable>
        </View>

        {isEntering ? (
          <Animated.View pointerEvents="none" style={[styles.gateOverlay, { opacity: overlayAnim }]}>
            <GateStructure openProgress={overlayAnim} size={240} />
            <Text style={styles.gateOverlayText}>Opening the gate…</Text>
            <Text style={styles.gateOverlaySub}>Entering the merchant PID</Text>
          </Animated.View>
        ) : null}
      </View>
    </ScrollView>
  );
}

type SmallButtonProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  tone?: "light" | "dark";
};

function SmallButton({ disabled = false, label, onPress, tone = "light" }: SmallButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.smallButton, tone === "dark" ? styles.smallButtonDark : null, disabled ? styles.pressed : null]}
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
