import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight, MapPin } from "lucide-react-native";
import type { Issue } from "../data/issues";
import StatusBadge from "./StatusBadge";
import { colors, radii, space } from "../theme/tokens";

type Props = {
  issue: Issue;
  onPress: () => void;
};

export default function IssueCard({ issue, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.thumb}>
        <MapPin size={22} color={colors.primaryBlue} strokeWidth={2.2} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {issue.title}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {issue.location}
        </Text>
        <Text style={styles.date}>{issue.dateLabel}</Text>
        <View style={styles.badgeRow}>
          <StatusBadge status={issue.status} />
        </View>
      </View>
      <ChevronRight size={20} color={colors.muted} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 12,
    gap: 12,
    marginBottom: 12,
    boxShadow: "0px 2px 8px rgba(15, 40, 80, 0.04)",
  },
  pressed: {
    opacity: 0.92,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.navy,
  },
  location: {
    marginTop: 2,
    fontSize: 12,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  date: {
    marginTop: 2,
    fontSize: 11,
    color: colors.muted,
  },
  badgeRow: {
    marginTop: 8,
  },
});
