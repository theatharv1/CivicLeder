import React, { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight, Flag, ThumbsUp, Trash2, X } from "lucide-react-native";
import type { ReportCategoryId } from "../data/reportCategories";
import { neighbourMark } from "../lib/neighbourMark";
import {
  alertTypeInfo,
  deletePublicAlert,
  distanceLabel,
  flagAlert,
  timeAgo,
  voteOnAlert,
  type PublicAlert,
} from "../lib/publicAlerts";
import { colors, radii } from "../theme/tokens";

type Props = {
  alert: PublicAlert;
  /** Called with the updated alert, or null when it should leave the list. */
  onChanged: (next: PublicAlert | null) => void;
  onReport?: (categoryId: ReportCategoryId) => void;
};

/** Raw coordinates or the server default read badly as a title. */
function displayPlace(name: string): string {
  const n = name.trim();
  if (!n || n === "Current location" || /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(n)) {
    return "Pinned location";
  }
  return n;
}

export default function PublicAlertCard({ alert, onChanged, onReport }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const info = alertTypeInfo(alert.type);
  const unsafe = alert.type === "unsafe_spot";

  const vote = async (v: "seen" | "gone") => {
    if (busy || alert.myVote === v) return;
    setBusy(true);
    const r = await voteOnAlert(alert.id, v);
    setBusy(false);
    if (!r.ok) {
      Alert.alert("Could not save", r.error);
      return;
    }
    // The vote reply has no distance (it doesn't know where you are); keep ours.
    onChanged({ ...r.data, distanceMeters: r.data.distanceMeters ?? alert.distanceMeters });
  };

  const onFlag = () => {
    Alert.alert(
      "Report this alert?",
      "Use this if it is false, abusive, or names a person. Alerts reported by 3 people are hidden.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: () => {
            void (async () => {
              const r = await flagAlert(alert.id);
              if (!r.ok) {
                Alert.alert("Could not report", r.error);
                return;
              }
              Alert.alert("Thanks", "We have noted your report.");
              if (r.data.hidden) onChanged(null);
            })();
          },
        },
      ]
    );
  };

  const onDelete = () => {
    Alert.alert("Delete this post?", "It will be removed for everyone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setBusy(true);
            const r = await deletePublicAlert(alert.id);
            setBusy(false);
            if (!r.ok) {
              Alert.alert("Could not delete", r.error);
              return;
            }
            onChanged(null);
          })();
        },
      },
    ]);
  };

  const seenLabel =
    alert.seenTotal === 1 ? "seen by 1" : `${alert.seenTotal} saw it`;
  const neighbour = neighbourMark(alert.id);
  const meta = [
    timeAgo(alert.createdAt),
    distanceLabel(alert.distanceMeters),
    alert.areaLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable style={styles.card} onPress={() => setExpanded((e) => !e)}>
      {alert.photoUrl ? (
        <Image
          source={{ uri: alert.photoUrl }}
          style={[styles.photo, expanded && styles.photoLarge]}
          resizeMode="cover"
        />
      ) : null}
      <View style={styles.body}>
        <View style={styles.posterRow}>
          <View style={[styles.avatar, { backgroundColor: neighbour.color }]}>
            <Text style={styles.avatarLetter}>{neighbour.letter}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.posterName}>{neighbour.label}</Text>
            <Text style={styles.meta}>{meta}</Text>
          </View>
          <Text style={[styles.chip, unsafe ? styles.chipUnsafe : styles.chipType]}>
            {info.label}
          </Text>
        </View>

        <Text
          style={[
            styles.chip,
            alert.confirmed ? styles.chipConfirmed : styles.chipNew,
            { alignSelf: "flex-start", marginTop: 8 },
          ]}
        >
          {alert.confirmed ? `✓ Confirmed · ${seenLabel}` : `New · ${seenLabel}`}
        </Text>

        <Text style={styles.place}>{displayPlace(alert.placeName)}</Text>
        <Text style={styles.desc} numberOfLines={expanded ? undefined : 3}>
          {alert.description}
        </Text>
        {expanded && alert.goneCount > 0 ? (
          <Text style={styles.meta}>
            {alert.goneCount} {alert.goneCount === 1 ? "person says" : "people say"} it's gone
          </Text>
        ) : null}

        {alert.isMine ? (
          <View style={styles.actions}>
            <Text style={styles.mine}>Your post</Text>
            <Pressable
              style={styles.deleteBtn}
              disabled={busy}
              onPress={onDelete}
              accessibilityRole="button"
              accessibilityLabel="Delete your post"
            >
              <Trash2 size={14} color={colors.emergency} />
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actions}>
            <Pressable
              style={[styles.voteBtn, alert.myVote === "seen" && styles.voteOn]}
              disabled={busy}
              onPress={() => void vote("seen")}
              accessibilityRole="button"
            >
              <ThumbsUp
                size={14}
                color={alert.myVote === "seen" ? colors.white : colors.primaryBlue}
              />
              <Text
                style={[styles.voteText, alert.myVote === "seen" && styles.voteTextOn]}
              >
                {alert.myVote === "seen" ? "You saw it too" : "I've seen it too"}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.goneBtn, alert.myVote === "gone" && styles.goneOn]}
              disabled={busy}
              onPress={() => void vote("gone")}
              accessibilityRole="button"
            >
              <X size={14} color={alert.myVote === "gone" ? colors.white : colors.mutedDark} />
              <Text style={[styles.goneText, alert.myVote === "gone" && styles.voteTextOn]}>
                Not there
              </Text>
            </Pressable>
          </View>
        )}

        {onReport ? (
          <Pressable
            style={styles.reportRow}
            onPress={() => onReport(info.reportCategory)}
            accessibilityRole="button"
          >
            <Text style={styles.reportText}>{info.reportLabel}</Text>
            <ChevronRight size={16} color={colors.linkBlue} />
          </Pressable>
        ) : null}

        {expanded && !alert.isMine ? (
          <Pressable style={styles.flagRow} onPress={onFlag} accessibilityRole="button">
            <Flag size={13} color={colors.mutedDark} />
            <Text style={styles.flagText}>Report as wrong or abusive</Text>
          </Pressable>
        ) : null}
        {!expanded ? <Text style={styles.readMore}>Tap for details</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden",
    marginBottom: 10,
  },
  photo: { width: "100%", height: 140, backgroundColor: colors.hairline },
  photoLarge: { height: 220 },
  body: { padding: 12 },
  posterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  posterName: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.navy,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  chip: {
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  chipType: { color: colors.primaryBlue, backgroundColor: colors.lightBlue },
  chipUnsafe: { color: "#5B2A86", backgroundColor: "#F1E8FA" },
  chipConfirmed: { color: colors.statusGreenFg, backgroundColor: colors.statusGreenBg },
  chipNew: { color: colors.statusMutedFg, backgroundColor: colors.statusMutedBg },
  place: { marginTop: 8, fontSize: 15, fontWeight: "800", color: colors.navy },
  desc: { marginTop: 4, fontSize: 13, lineHeight: 18, color: colors.mutedDark },
  meta: { marginTop: 2, fontSize: 11, color: colors.muted, fontWeight: "600" },
  actions: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.lightBlue,
  },
  voteOn: { backgroundColor: colors.primaryBlue },
  voteText: { fontSize: 12, fontWeight: "700", color: colors.primaryBlue },
  voteTextOn: { color: colors.white },
  goneBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.statusMutedBg,
  },
  goneOn: { backgroundColor: colors.mutedDark },
  goneText: { fontSize: 12, fontWeight: "700", color: colors.mutedDark },
  mine: { flex: 1, fontSize: 12, fontWeight: "700", color: colors.mutedDark },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.logoutBg,
  },
  deleteText: { fontSize: 12, fontWeight: "700", color: colors.emergency },
  reportRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reportText: { fontSize: 13, fontWeight: "800", color: colors.linkBlue },
  flagRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
  },
  flagText: { fontSize: 12, fontWeight: "700", color: colors.mutedDark },
  readMore: { marginTop: 8, fontSize: 11, fontWeight: "700", color: colors.linkBlue },
});
