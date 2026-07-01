import { StyleSheet, View } from "react-native";

import { resolveWeaponKind } from "./spriteTokens";

type WeaponIconProps = {
  weaponId?: string;
  tier?: number;
  size?: number;
};

/**
 * Small procedural weapon glyph (blade / cutlass / halberd), chosen from the weapon content id
 * with a tier fallback. Purely presentational — callers wrap it in an Animated.View for the cave
 * strike swipe.
 */
export function WeaponIcon({ weaponId, tier = 1, size = 44 }: WeaponIconProps) {
  const kind = resolveWeaponKind(weaponId, tier);
  const scale = size / 44;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {kind === "halberd" ? (
        <>
          <View style={[styles.pole, { height: size * 0.9, width: 5 * scale }]} />
          <View style={[styles.axeHead, { width: 22 * scale, height: 20 * scale, top: 4 * scale }]} />
          <View style={[styles.poleCap, { width: 10 * scale, height: 10 * scale }]} />
        </>
      ) : (
        <>
          <View
            style={[
              styles.blade,
              {
                width: 9 * scale,
                height: size * 0.62,
                backgroundColor: kind === "cutlass" ? "#e0e7ff" : "#cbd5e1",
                transform: kind === "cutlass" ? [{ rotate: "12deg" }] : [],
                borderBottomLeftRadius: kind === "cutlass" ? 8 : 2,
              },
            ]}
          />
          <View style={[styles.guard, { width: 26 * scale, height: 6 * scale }]} />
          <View style={[styles.grip, { width: 6 * scale, height: 12 * scale }]} />
          <View style={[styles.pommel, { width: 9 * scale, height: 9 * scale }]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  blade: {
    position: "absolute",
    top: 2,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: "#94a3b8",
  },
  guard: {
    position: "absolute",
    bottom: "34%",
    borderRadius: 3,
    backgroundColor: "#f7c35f",
  },
  grip: {
    position: "absolute",
    bottom: "18%",
    borderRadius: 2,
    backgroundColor: "#4b2e17",
  },
  pommel: {
    position: "absolute",
    bottom: "10%",
    borderRadius: 999,
    backgroundColor: "#f7c35f",
  },
  pole: {
    position: "absolute",
    borderRadius: 2,
    backgroundColor: "#7c4a2d",
  },
  axeHead: {
    position: "absolute",
    right: "18%",
    borderRadius: 4,
    backgroundColor: "#d1d5db",
    borderWidth: 1,
    borderColor: "#94a3b8",
  },
  poleCap: {
    position: "absolute",
    bottom: 2,
    borderRadius: 999,
    backgroundColor: "#f7c35f",
  },
});
