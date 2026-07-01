import { Animated, StyleSheet, View } from "react-native";

type GateStructureProps = {
  /** 0 = closed, 1 = fully open. Drives the doors sliding apart + portal glow. */
  openProgress?: Animated.Value;
  size?: number;
};

/**
 * Procedural colosseum gate: stone frame, glowing portal, and two doors that slide apart as
 * `openProgress` goes 0 -> 1. Used by the Arena hub for the "gate open" transition.
 */
export function GateStructure({ openProgress, size = 240 }: GateStructureProps) {
  const scale = size / 240;
  const width = 190 * scale;
  const frame = 22 * scale;
  const doorWidth = (width - frame * 2) / 2;

  const leftShift = openProgress
    ? openProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -doorWidth] })
    : 0;
  const rightShift = openProgress
    ? openProgress.interpolate({ inputRange: [0, 1], outputRange: [0, doorWidth] })
    : 0;
  const glow = openProgress
    ? openProgress.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] })
    : 0.35;

  return (
    <View style={[styles.wrap, { width, height: size }]}>
      {/* Glowing portal behind the doors. */}
      <Animated.View
        style={[
          styles.portal,
          { left: frame, right: frame, top: frame, bottom: frame, opacity: glow },
        ]}
      />

      {/* Doors. */}
      <Animated.View
        style={[
          styles.door,
          { left: frame, width: doorWidth, top: frame, bottom: frame, transform: [{ translateX: leftShift }] },
        ]}
      >
        <View style={styles.doorSeam} />
      </Animated.View>
      <Animated.View
        style={[
          styles.door,
          { right: frame, width: doorWidth, top: frame, bottom: frame, transform: [{ translateX: rightShift }] },
        ]}
      >
        <View style={styles.doorSeam} />
      </Animated.View>

      {/* Stone frame on top of the doors. */}
      <View style={[styles.pillar, { left: 0, width: frame }]} />
      <View style={[styles.pillar, { right: 0, width: frame }]} />
      <View style={[styles.arch, { height: frame }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 96,
    borderTopRightRadius: 96,
    overflow: "hidden",
  },
  portal: {
    position: "absolute",
    backgroundColor: "#f7c35f",
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
  },
  door: {
    position: "absolute",
    backgroundColor: "#3b281f",
    borderWidth: 3,
    borderColor: "#5c3f2d",
    alignItems: "center",
  },
  doorSeam: {
    width: 4,
    flex: 1,
    backgroundColor: "#2a1c14",
  },
  pillar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "#c99555",
    borderWidth: 4,
    borderColor: "#efd18a",
  },
  arch: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: "#c99555",
    borderBottomWidth: 4,
    borderColor: "#efd18a",
    borderTopLeftRadius: 96,
    borderTopRightRadius: 96,
  },
});
