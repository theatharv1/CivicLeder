import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User, UserPlus } from "lucide-react-native";
import { APP_NAME } from "../lib/brand";
import { colors, radii, space } from "../theme/tokens";

type Props = {
  onGuest: () => void;
  onCreate: () => void;
  onSignIn: () => void;
};

export default function WelcomeChoiceScreen({
  onGuest,
  onCreate,
  onSignIn,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 },
      ]}
    >
      <Text style={styles.brand}>{APP_NAME}</Text>
      <Text style={styles.title}>How will you continue?</Text>

      <Pressable style={styles.card} onPress={onGuest}>
        <View style={styles.iconWrap}>
          <User size={28} color={colors.primaryBlue} strokeWidth={2.2} />
        </View>
        <Text style={styles.cardTitle}>Continue as guest</Text>
        <Text style={styles.cardSub}>Explore · Guide · View alerts</Text>
      </Pressable>

      <Pressable style={[styles.card, styles.cardPrimary]} onPress={onCreate}>
        <View style={[styles.iconWrap, styles.iconWrapOn]}>
          <UserPlus size={28} color={colors.white} strokeWidth={2.2} />
        </View>
        <Text style={[styles.cardTitle, styles.cardTitleOn]}>
          Create profile
        </Text>
        <Text style={[styles.cardSub, styles.cardSubOn]}>
          My Cases · Post alerts
        </Text>
      </Pressable>

      <Pressable onPress={onSignIn} style={styles.link}>
        <Text style={styles.linkText}>Already have a profile? Sign in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: space.screen,
  },
  brand: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.navy,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.navy,
    marginBottom: 28,
  },
  card: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 20,
    marginBottom: 14,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  cardPrimary: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconWrapOn: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.navy,
  },
  cardTitleOn: {
    color: colors.white,
  },
  cardSub: {
    marginTop: 6,
    fontSize: 13,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  cardSubOn: {
    color: "rgba(255,255,255,0.9)",
  },
  link: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.linkBlue,
  },
});
