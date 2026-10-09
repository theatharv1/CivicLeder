import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "../theme/tokens";

type Props = {
  onBack: () => void;
  title?: string;
  right?: React.ReactNode;
};

/** Shared back control for pushed screens. */
export default function ScreenBackHeader({ onBack, title, right }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onBack}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
      >
        <ArrowLeft size={22} color={colors.navy} strokeWidth={2.2} />
      </Pressable>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {right ?? <View style={{ width: 40 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: colors.navy,
    textAlign: "center",
  },
});
