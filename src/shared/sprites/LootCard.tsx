import type { ReactNode } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useEntrance } from "../anim/animationHooks";
import { rarityColors } from "./spriteTokens";

type LootCardProps = {
  name: string;
  rarity: string;
  quantity?: number;
  subtitle?: string;
  /** Index used to stagger the reveal entrance. */
  revealIndex?: number;
  /** Change this to replay the reveal animation (e.g. a fresh encounter/session id). */
  revealKey?: string | number;
  /** Optional trailing action, e.g. a Sell button in Town. */
  action?: ReactNode;
};

/** Rarity-colored loot card with a staggered reveal, reused in Town inventory and the cave loot drop. */
export function LootCard({ name, rarity, quantity, subtitle, revealIndex = 0, revealKey, action }: LootCardProps) {
  const colors = rarityColors(rarity);
  const entrance = useEntrance([revealKey, revealIndex], revealIndex * 90);
  const translateY = entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <Animated.View
      style={[styles.card, { borderColor: colors.edge, opacity: entrance, transform: [{ translateY }] }]}
    >
      <View style={[styles.glyphWrap, { backgroundColor: colors.base, borderColor: colors.glow }]}>
        <View style={[styles.glyphCore, { backgroundColor: colors.glow }]} />
      </View>

      <View style={styles.body}>
        <Text style={styles.name}>
          {name}
          {quantity && quantity > 1 ? <Text style={styles.qty}> x{quantity}</Text> : null}
        </Text>
        <Text style={[styles.rarity, { color: colors.glow }]}>
          {rarity}
          {subtitle ? <Text style={styles.subtitle}> · {subtitle}</Text> : null}
        </Text>
      </View>

      {action ? <View style={styles.action}>{action}</View> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#111a2b",
  },
  glyphWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
  },
  glyphCore: {
    width: 16,
    height: 16,
    borderRadius: 4,
    opacity: 0.85,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },
  qty: {
    color: "#f7c35f",
    fontSize: 15,
    fontWeight: "900",
  },
  rarity: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  subtitle: {
    color: "#94a3b8",
    fontWeight: "700",
    textTransform: "none",
  },
  action: {
    marginLeft: 4,
  },
});
