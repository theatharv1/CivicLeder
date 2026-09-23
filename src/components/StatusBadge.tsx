import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { IssueStatus } from "../data/issues";
import { colors, radii } from "../theme/tokens";

const MAP: Record<
  IssueStatus,
  { bg: string; fg: string }
> = {
  "In Progress": { bg: colors.statusGreenBg, fg: colors.statusGreenFg },
  Resolved: { bg: colors.statusGreenBg, fg: colors.statusGreenFg },
  "Action in Progress": {
    bg: colors.statusYellowBg,
    fg: colors.statusYellowFg,
  },
  "Under Review": { bg: colors.statusBlueBg, fg: colors.statusBlueFg },
  Closed: { bg: colors.statusMutedBg, fg: colors.statusMutedFg },
};

export default function StatusBadge({ status }: { status: IssueStatus }) {
  const tone = MAP[status];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
  },
});
