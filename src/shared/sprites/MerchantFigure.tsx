import { StyleSheet, View } from "react-native";

type MerchantFigureProps = {
  size?: number;
};

/** Procedural shopkeeper standing behind the Town stall. Layered Views, no assets. */
export function MerchantFigure({ size = 150 }: MerchantFigureProps) {
  const scale = size / 150;

  return (
    <View style={[styles.wrap, { width: 110 * scale, height: size }]}>
      {/* Hat */}
      <View style={[styles.hatBrim, { width: 68 * scale, height: 10 * scale }]} />
      <View style={[styles.hatTop, { width: 42 * scale, height: 26 * scale }]} />

      {/* Head */}
      <View style={[styles.head, { width: 46 * scale, height: 46 * scale }]}>
        <View style={[styles.eye, { left: 12 * scale, top: 20 * scale }]} />
        <View style={[styles.eye, { right: 12 * scale, top: 20 * scale }]} />
      </View>

      {/* Body + arms */}
      <View style={styles.torsoRow}>
        <View style={[styles.arm, { width: 12 * scale, height: 54 * scale }]} />
        <View style={[styles.tunic, { width: 70 * scale, height: 74 * scale }]}>
          <View style={[styles.apron, { width: 34 * scale, height: 58 * scale }]} />
        </View>
        <View style={[styles.arm, { width: 12 * scale, height: 54 * scale }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  hatBrim: {
    borderRadius: 6,
    backgroundColor: "#4c1d95",
    zIndex: 3,
  },
  hatTop: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: "#5b21b6",
    marginBottom: -4,
    zIndex: 2,
  },
  head: {
    borderRadius: 999,
    backgroundColor: "#e8b98f",
    borderWidth: 2,
    borderColor: "#c98f63",
    marginTop: -2,
  },
  eye: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#1f2937",
  },
  torsoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginTop: -6,
  },
  arm: {
    borderRadius: 6,
    backgroundColor: "#b45309",
    marginTop: 8,
  },
  tunic: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: "#c2410c",
    alignItems: "center",
    marginHorizontal: -4,
  },
  apron: {
    marginTop: 10,
    borderRadius: 6,
    backgroundColor: "#f2d493",
  },
});
