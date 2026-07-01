import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, Text, View } from "react-native";

import type { ResolveBossEncounterResponse } from "../generated/game/beamable/clients/types";
import { getGameBeam, getRegisteredGameServiceClient } from "../shared/beam/beamContexts";
import { toUserFacingError } from "../shared/beam/beamErrors";
import { withTimeout } from "../shared/async/withTimeout";
import { useEntrance, useHitFlash, useIdleBob, useStrike } from "../shared/anim/animationHooks";
import { BossSprite } from "../shared/sprites/BossSprite";
import { LootCard } from "../shared/sprites/LootCard";
import { WeaponIcon } from "../shared/sprites/WeaponIcon";
import type { PlayerSession } from "../shared/types";

import type { MerchantBoss, MerchantCave } from "./content/gameContent";
import { styles } from "./CaveEncounterScreen.styles";

type EncounterPhase = "ready" | "resolving" | "resolved";

type CaveEncounterScreenProps = {
  boss: MerchantBoss | undefined;
  cave: MerchantCave;
  onComplete: (result: ResolveBossEncounterResponse) => void;
  onReturnToTown: () => void;
  session: PlayerSession;
};

export function CaveEncounterScreen({
  boss,
  cave,
  onComplete,
  onReturnToTown,
  session,
}: CaveEncounterScreenProps) {
  const [phase, setPhase] = useState<EncounterPhase>("ready");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResolveBossEncounterResponse | null>(null);
  const sessionId = useMemo(() => {
    return `cave-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  const stageEntrance = useEntrance([cave.id]);
  const bob = useIdleBob(9, 1500);
  const { flash, trigger: triggerFlash } = useHitFlash();
  const { progress: strikeProgress, trigger: triggerStrike } = useStrike();
  const defeatAnim = useRef(new Animated.Value(0)).current;

  const defeated = phase === "resolved" && Boolean(result?.defeated);

  async function resolveEncounter() {
    setPhase("resolving");
    setError(null);
    defeatAnim.setValue(0);
    triggerStrike();
    const flashTimer = setTimeout(() => triggerFlash(), 140);

    try {
      const beam = await withTimeout(
        getGameBeam(),
        15000,
        "Game Beam context did not initialize in time.",
      );
      const gameClient = getRegisteredGameServiceClient(beam);
      const response = await withTimeout(
        gameClient.resolveBossEncounter({
          request: {
            caveId: cave.id,
            sessionId,
          },
        }),
        15000,
        "Boss encounter request timed out.",
      );

      setResult(response);
      if (response.success) {
        if (response.defeated) {
          Animated.timing(defeatAnim, {
            toValue: 1,
            duration: 520,
            useNativeDriver: false,
          }).start();
        }
        onComplete(response);
      } else {
        setError(response.error || "Boss encounter failed.");
      }
    } catch (resolveError) {
      setError(toUserFacingError(resolveError));
    } finally {
      clearTimeout(flashTimer);
      setPhase("resolved");
    }
  }

  const stageStyle = {
    opacity: stageEntrance,
    transform: [
      { scale: stageEntrance.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
    ],
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.realmLabel}>Game PID Cave</Text>
          <Text style={styles.playerText}>{session.email}</Text>
        </View>
        <SmallButton label="Return to Town" onPress={onReturnToTown} tone="dark" />
      </View>

      <View style={styles.scene}>
        <Animated.View style={[styles.caveStage, stageStyle]}>
          <View style={styles.caveMouth}>
            <BossSprite
              spriteKey={boss?.spriteKey}
              bossId={boss?.id}
              tier={boss?.tier ?? cave.tier}
              bob={defeated ? undefined : bob}
              flash={flash}
              defeat={defeatAnim}
            />

            <Animated.View
              pointerEvents="none"
              style={[
                styles.strikeWeapon,
                {
                  opacity: strikeProgress,
                  transform: [
                    { translateX: strikeProgress.interpolate({ inputRange: [0, 1], outputRange: [-60, 90] }) },
                    { rotate: strikeProgress.interpolate({ inputRange: [0, 1], outputRange: ["-25deg", "40deg"] }) },
                  ],
                },
              ]}
            >
              <WeaponIcon weaponId={session.merchantState.equippedWeaponId} size={70} />
            </Animated.View>
          </View>
          <View style={styles.ground} />
        </Animated.View>

        <View style={styles.panel}>
          <Text style={styles.kicker}>{cave.displayName}</Text>
          <Text style={styles.title}>{boss?.displayName ?? "Unknown Boss"}</Text>
          <Text style={styles.subtitle}>
            Deterministic Phase 3 resolver: enter the cave, defeat the boss, reveal loot, award game XP, and send Arena XP.
          </Text>

          <View style={styles.statGrid}>
            <StatCard label="Required Level" value={`${cave.requiredGameLevel}`} />
            <StatCard label="Game Level" value={`${session.merchantState.gameLevel}`} />
            <StatCard label="Game XP" value={`${session.merchantState.gameXp}`} />
            <StatCard label="Arena Level" value={`${session.arenaProgress.level}`} />
          </View>

          {result ? (
            <View style={styles.resultPanel}>
              <Text style={styles.resultTitle}>{result.defeated ? "Boss Defeated" : "Encounter Complete"}</Text>
              <Text style={styles.resultLine}>Game XP +{result.gameXpAwarded}</Text>
              <Text style={styles.resultLine}>Arena XP +{result.arenaXpAwarded}</Text>
              {result.loot.length > 0 ? (
                <View style={styles.lootList}>
                  {result.loot.map((loot, index) => (
                    <LootCard
                      key={loot.itemContentId}
                      name={labelFromContentId(loot.itemContentId)}
                      rarity=""
                      quantity={loot.quantity}
                      revealIndex={index}
                      revealKey={result.eventId}
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.resultLine}>No loot revealed yet</Text>
              )}
              {result.arenaProgress.duplicateEvent ? (
                <Text style={styles.duplicateText}>Duplicate session detected: no extra XP awarded.</Text>
              ) : null}
            </View>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actions}>
            <PrimaryButton
              disabled={phase === "resolving"}
              label={phase === "ready" ? "Strike Boss" : "Retry Same Session"}
              onPress={resolveEncounter}
            />
            {phase === "resolving" ? <ActivityIndicator color="#f7c35f" /> : null}
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

function PrimaryButton({ disabled = false, label, onPress }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, disabled ? styles.disabled : null]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SmallButton({ label, onPress, tone = "light" }: ButtonProps) {
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function labelFromContentId(id: string): string {
  const lastSegment = id.split(".").at(-1) ?? id;
  return lastSegment
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
