import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, space } from "../theme/tokens";

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function SimpleTabScreen({
  title,
  subtitle,
  actionLabel,
  onAction,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable style={styles.btn} onPress={onAction}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: space.screen,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.navy,
  },
  sub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedDark,
  },
  btn: {
    marginTop: 24,
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
