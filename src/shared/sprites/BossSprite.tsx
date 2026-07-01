import { Animated, StyleSheet, View } from "react-native";

import { BOSS_PALETTE, resolveBossKind } from "./spriteTokens";

type BossSpriteProps = {
  spriteKey?: string | undefined;
  bossId?: string | undefined;
  tier?: number | undefined;
  /** translateY value for an idle bob (from useIdleBob). */
  bob?: Animated.Value | undefined;
  /** 0..1 hit-flash value (from useHitFlash). */
  flash?: Animated.Value | undefined;
  /** 0..1 defeat progress; fades + tips the boss over. */
  defeat?: Animated.Value | undefined;
  size?: number | undefined;
};

/**
 * Procedural boss creature built from layered Views. The look (ogre / wyrm / drake) is derived
 * from the content spriteKey/bossId, falling back to tier, so it renders distinctly per cave even
 * when spriteKey is empty in content.
 */
export function BossSprite({ spriteKey, bossId, tier = 1, bob, flash, defeat, size = 190 }: BossSpriteProps) {
  const kind = resolveBossKind(spriteKey, bossId, tier);
  const palette = BOSS_PALETTE[kind];
  const scale = size / 190;

  const bodyWidth = 150 * scale;
  const bodyHeight = 170 * scale;

  const defeatTransforms = defeat
    ? [
        { rotate: defeat.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "16deg"] }) },
        { translateY: defeat.interpolate({ inputRange: [0, 1], outputRange: [0, 14 * scale] }) },
      ]
    : [];
  const defeatOpacity = defeat ? defeat.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }) : 1;

  return (
    <Animated.View
      style={[
        styles.wrap,
        { width: bodyWidth + 60 * scale, height: bodyHeight + 40 * scale, opacity: defeatOpacity },
        { transform: [{ translateY: bob ?? 0 }, ...defeatTransforms] },
      ]}
    >
      {/* Wings behind the body for the drake. */}
      {kind === "drake" ? (
        <>
          <View style={[styles.wing, styles.wingLeft, { backgroundColor: palette.edge, width: 70 * scale, height: 96 * scale }]} />
          <View style={[styles.wing, styles.wingRight, { backgroundColor: palette.edge, width: 70 * scale, height: 96 * scale }]} />
        </>
      ) : null}

      {/* Dorsal crest for the wyrm. */}
      {kind === "wyrm" ? (
        <View style={[styles.crestRow, { top: -6 * scale }]}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View
              key={index}
              style={[styles.crest, { backgroundColor: palette.accent, width: 16 * scale, height: 16 * scale }]}
            />
          ))}
        </View>
      ) : null}

      {/* Horns for ogre + drake. */}
      {kind !== "wyrm" ? (
        <>
          <View style={[styles.horn, styles.hornLeft, { backgroundColor: palette.accent, width: 20 * scale, height: 20 * scale, left: bodyWidth * 0.18 }]} />
          <View style={[styles.horn, styles.hornRight, { backgroundColor: palette.accent, width: 20 * scale, height: 20 * scale, right: bodyWidth * 0.18 }]} />
        </>
      ) : null}

      {/* Body. */}
      <View
        style={[
          styles.body,
          {
            width: bodyWidth,
            height: bodyHeight,
            backgroundColor: palette.body,
            borderColor: palette.edge,
            borderTopLeftRadius: kind === "wyrm" ? 70 * scale : 78 * scale,
            borderTopRightRadius: kind === "wyrm" ? 70 * scale : 78 * scale,
          },
        ]}
      >
        {/* Belly panel. */}
        <View style={[styles.belly, { backgroundColor: palette.belly, width: bodyWidth * 0.4, height: bodyHeight * 0.42 }]} />

        {/* Eyes. */}
        <View style={[styles.eyeRow, { top: bodyHeight * 0.22 }]}>
          <View style={[styles.eye, { backgroundColor: palette.eye, width: 20 * scale, height: 20 * scale }]}>
            <View style={styles.pupil} />
          </View>
          <View style={[styles.eye, { backgroundColor: palette.eye, width: 20 * scale, height: 20 * scale }]}>
            <View style={styles.pupil} />
          </View>
        </View>

        {/* Hit flash overlay. */}
        {flash ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.flash,
              { opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] }) },
            ]}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  body: {
    borderWidth: 6,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    alignItems: "center",
  },
  belly: {
    position: "absolute",
    bottom: 8,
    borderRadius: 18,
    opacity: 0.65,
  },
  eyeRow: {
    position: "absolute",
    flexDirection: "row",
    gap: 16,
  },
  eye: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  pupil: {
    width: "45%",
    height: "45%",
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  flash: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderRadius: 78,
  },
  horn: {
    position: "absolute",
    top: 2,
    borderRadius: 4,
    transform: [{ rotate: "45deg" }],
    zIndex: 1,
  },
  hornLeft: {},
  hornRight: {},
  crestRow: {
    position: "absolute",
    flexDirection: "row",
    gap: 8,
    zIndex: 1,
  },
  crest: {
    borderRadius: 3,
    transform: [{ rotate: "45deg" }],
  },
  wing: {
    position: "absolute",
    top: 20,
    borderRadius: 12,
    opacity: 0.9,
  },
  wingLeft: {
    left: 0,
    transform: [{ rotate: "-24deg" }],
  },
  wingRight: {
    right: 0,
    transform: [{ rotate: "24deg" }],
  },
});
