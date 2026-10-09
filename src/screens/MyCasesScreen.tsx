import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  FileCheck2,
  Pencil,
  Phone,
} from "lucide-react-native";
import { APP_CASE_ID_LABEL } from "../lib/brand";
import { copyText } from "../lib/clipboard";
import { dialNumber } from "../lib/dial";
import {
  answerFollowUp,
  caseTrackingUrl,
  daysSinceFiled,
  escalationText,
  FOLLOW_UP_DAYS,
  listLocalCases,
  needsFollowUp,
  nextStepFor,
  updateLocalCaseDetails,
  type LocalCaseRecord,
} from "../lib/myCases";
import { colors, radii, space } from "../theme/tokens";

type Props = {
  onOpenReport?: () => void;
  showBack?: boolean;
  onBack?: () => void;
};

function formatStatus(s: string): string {
  return s.replace(/_/g, " ");
}

function categoryLabel(item: LocalCaseRecord): string {
  const cat = item.categorySlug?.replace(/_/g, " ")?.trim();
  return cat && cat.length > 0 ? cat : "Other";
}

function CaseCard({
  item,
  onUpdated,
}: {
  item: LocalCaseRecord;
  onUpdated: (row: LocalCaseRecord) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [refDraft, setRefDraft] = useState(item.officialReference ?? "");
  const trackUrl = caseTrackingUrl(item);
  const [siteDraft, setSiteDraft] = useState(trackUrl ?? "");
  const [saving, setSaving] = useState(false);
  const filed = !!item.officialReference?.trim();
  const fixed = item.followUp?.status === "fixed";
  const askNow = needsFollowUp(item);
  const notFixed = item.followUp?.status === "not_fixed";

  const answer = async (isFixed: boolean) => {
    const updated = await answerFollowUp(item.caseId, isFixed);
    if (updated) onUpdated(updated);
  };

  const openStep = () => {
    const step = nextStepFor(item);
    if (step.url) {
      void Linking.openURL(step.url).catch(() =>
        Alert.alert("Unable to open", step.url!)
      );
    } else if (step.phone) {
      void dialNumber(step.phone, item.authorityName ?? "Authority");
    }
  };

  const openTrack = () => {
    if (!trackUrl) return;
    Alert.alert(
      "Official tracking",
      "Enter your government complaint number on their status page.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open",
          onPress: () => {
            void Linking.openURL(trackUrl).catch(() =>
              Alert.alert("Unable to open", trackUrl)
            );
          },
        },
      ]
    );
  };

  const saveRef = async () => {
    setSaving(true);
    try {
      const updated = await updateLocalCaseDetails(item.caseId, {
        officialReference: refDraft,
        trackingUrl: siteDraft,
      });
      if (updated) {
        onUpdated(updated);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        {fixed ? (
          <Text style={styles.badgeFiled}>✓ Fixed</Text>
        ) : notFixed ? (
          <Text style={styles.badgeNotFixed}>Not fixed</Text>
        ) : (
          <Text style={filed ? styles.badgeFiled : styles.badgeDraft}>
            {filed ? "Complaint filed" : "Not filed yet"}
          </Text>
        )}
        <Text style={styles.categoryPill}>{categoryLabel(item)}</Text>
      </View>

      <Text style={styles.caseId}>
        {APP_CASE_ID_LABEL}: {item.caseId}
      </Text>
      <Text style={styles.caseIdHint}>
        App notebook ID only — not the government complaint number.
      </Text>

      <Text style={styles.row}>
        Office:{" "}
        {item.authorityName ??
          item.authoritySlug?.replace(/_/g, " ") ??
          "Not recorded"}
      </Text>


      {fixed ? (
        <Text style={styles.fixedNote}>
          You confirmed it fixed on {item.followUp!.answeredAt.slice(0, 10)}.
        </Text>
      ) : askNow ? (
        <View style={styles.askBox}>
          <Text style={styles.askTitle}>
            Filed {daysSinceFiled(item)} days ago. Is it fixed?
          </Text>
          <Text style={styles.askHint}>
            We ask every {FOLLOW_UP_DAYS} days until you mark it fixed.
          </Text>
          <View style={styles.askRow}>
            <Pressable
              style={[styles.askBtn, { backgroundColor: colors.statusGreenFg }]}
              onPress={() => void answer(true)}
              accessibilityRole="button"
            >
              <Text style={styles.askBtnText}>Yes, fixed</Text>
            </Pressable>
            <Pressable
              style={[styles.askBtn, { backgroundColor: colors.navy }]}
              onPress={() => void answer(false)}
              accessibilityRole="button"
            >
              <Text style={styles.askBtnText}>Not yet</Text>
            </Pressable>
          </View>
        </View>
      ) : notFixed ? (
        (() => {
          const step = nextStepFor(item);
          const isEscalate =
            step.kind === "escalate_pgms" || step.kind === "escalate_cpgrams";
          return (
            <View style={styles.stepBox}>
              <Text style={styles.stepLabel}>
                {isEscalate ? "Escalation" : "Follow up"}
              </Text>
              <Text style={styles.stepStatus}>{step.statusLine}</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>

              <View style={styles.whereBox}>
                <Text style={styles.whereLabel}>Go here now</Text>
                <Text style={styles.whereName}>{step.whereName}</Text>
                {step.url ? (
                  <Text style={styles.whereUrl} numberOfLines={2}>
                    {step.url}
                  </Text>
                ) : null}
              </View>

              {isEscalate ? (
                <Pressable
                  style={styles.copyBtn}
                  onPress={() =>
                    void copyText("Complaint text", escalationText(item))
                  }
                  accessibilityRole="button"
                >
                  <Copy size={14} color={colors.primaryBlue} />
                  <Text style={styles.copyText}>Copy complaint text</Text>
                </Pressable>
              ) : null}

              <Pressable
                style={styles.stepBtn}
                onPress={openStep}
                accessibilityRole="button"
              >
                <Text style={styles.stepBtnText}>{step.actionLabel}</Text>
              </Pressable>

              <Text style={styles.stepNextAsk}>
                We will ask again in {FOLLOW_UP_DAYS} days if it is still open.
              </Text>

              <Pressable
                onPress={() => void answer(true)}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text style={styles.fixedLink}>It's fixed now</Text>
              </Pressable>
            </View>
          );
        })()
      ) : null}

      {editing ? (
        <View style={styles.editBox}>
          <Text style={styles.editLabel}>Tracking / complaint ID</Text>
          <TextInput
            style={styles.editInput}
            value={refDraft}
            onChangeText={setRefDraft}
            placeholder="Government reference number"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
          />
          <Text style={[styles.editLabel, { marginTop: 10 }]}>
            Tracking / status website
          </Text>
          <TextInput
            style={styles.editInput}
            value={siteDraft}
            onChangeText={setSiteDraft}
            placeholder="https://… (status page, not file-new)"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.editActions}>
            <Pressable
              style={styles.editCancel}
              onPress={() => {
                setRefDraft(item.officialReference ?? "");
                setSiteDraft(trackUrl ?? "");
                setEditing(false);
              }}
            >
              <Text style={styles.editCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.editSave}
              onPress={() => void saveRef()}
              disabled={saving}
            >
              <Text style={styles.editSaveText}>
                {saving ? "Saving…" : "Save"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.refRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.refLabel}>Tracking ID</Text>
            <Text style={styles.refValue}>
              {item.officialReference?.trim() || "Not saved yet"}
            </Text>
            {trackUrl ? (
              <Text style={styles.filedAt} numberOfLines={1}>
                Track site: {trackUrl}
              </Text>
            ) : null}
            {item.filedAt ? (
              <Text style={styles.filedAt}>Saved on {item.filedAt}</Text>
            ) : null}
          </View>
          <Pressable
            style={styles.editBtn}
            onPress={() => {
              setRefDraft(item.officialReference ?? "");
              setSiteDraft(trackUrl ?? "");
              setEditing(true);
            }}
          >
            <Pencil size={14} color={colors.primaryBlue} strokeWidth={2.2} />
            <Text style={styles.editBtnText}>
              {filed ? "Edit" : "Add"}
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Your note</Text>
        <Text style={styles.statusValue}>{formatStatus(item.userStatus)}</Text>
      </View>

      {trackUrl ? (
        <Pressable style={styles.actionBtn} onPress={openTrack}>
          <ExternalLink size={16} color={colors.primaryBlue} />
          <Text style={styles.actionText}>Track on official website</Text>
        </Pressable>
      ) : item.phone ? (
        <Pressable
          style={styles.actionBtn}
          onPress={() =>
            void dialNumber(item.phone!, item.authorityName ?? "Authority")
          }
        >
          <Phone size={16} color={colors.primaryBlue} />
          <Text style={styles.actionText}>Call {item.phone}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function MyCasesScreen({
  onOpenReport,
  showBack,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cases, setCases] = useState<LocalCaseRecord[]>([]);

  const load = useCallback(async () => {
    const rows = await listLocalCases();
    setCases(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        setLoading(true);
        await load();
        if (alive) setLoading(false);
      })();
      return () => {
        alive = false;
      };
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      {showBack ? (
        <Pressable
          onPress={onBack}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={colors.navy} />
        </Pressable>
      ) : null}
      <View style={styles.header}>
        <FileCheck2 size={22} color={colors.primaryBlue} strokeWidth={2.2} />
        <Text style={styles.title}>My Cases</Text>
      </View>
      <Text style={styles.sub}>
        Save the government complaint number for each case. Edit anytime.
      </Text>

      {loading ? (
        <ActivityIndicator
          color={colors.primaryBlue}
          style={{ marginTop: 28 }}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 28 }}
        >
          {cases.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No cases yet</Text>
              <Text style={styles.emptyBody}>
                After you follow the guide, save the government reference here
                for later.
              </Text>
              {onOpenReport ? (
                <Pressable style={styles.primary} onPress={onOpenReport}>
                  <Text style={styles.primaryText}>Start a report</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            cases.map((c) => (
              <CaseCard
                key={c.caseId}
                item={c}
                onUpdated={(row) =>
                  setCases((prev) =>
                    prev.map((x) => (x.caseId === row.caseId ? row : x))
                  )
                }
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: space.screen,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.navy,
  },
  sub: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  badgeFiled: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.statusGreenFg,
    backgroundColor: colors.statusGreenBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  badgeNotFixed: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B71C1C",
    backgroundColor: colors.logoutBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  fixedNote: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: colors.statusGreenFg,
  },
  askBox: {
    marginTop: 12,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.md,
    padding: 12,
  },
  askTitle: { fontSize: 15, fontWeight: "800", color: colors.navy },
  askHint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  askRow: { marginTop: 10, flexDirection: "row", gap: 8 },
  askBtn: {
    flex: 1,
    borderRadius: radii.pill,
    paddingVertical: 11,
    alignItems: "center",
  },
  askBtnText: { color: colors.white, fontSize: 14, fontWeight: "800" },
  stepBox: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: colors.primaryBlue,
    borderRadius: radii.md,
    padding: 12,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.mutedDark,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  stepStatus: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "800",
    color: "#B71C1C",
  },
  stepTitle: { marginTop: 6, fontSize: 15, fontWeight: "800", color: colors.navy },
  stepBody: { marginTop: 4, fontSize: 12, lineHeight: 17, color: colors.mutedDark },
  whereBox: {
    marginTop: 10,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.md,
    padding: 10,
  },
  whereLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.mutedDark,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  whereName: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "800",
    color: colors.navy,
  },
  whereUrl: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    color: colors.primaryBlue,
    fontWeight: "600",
  },
  stepNextAsk: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 15,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  copyBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copyText: { fontSize: 13, fontWeight: "800", color: colors.primaryBlue },
  stepBtn: {
    marginTop: 10,
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.pill,
    paddingVertical: 11,
    alignItems: "center",
  },
  stepBtnText: { color: colors.white, fontSize: 14, fontWeight: "800" },
  fixedLink: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: colors.linkBlue,
  },
  badgeDraft: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.statusMutedFg,
    backgroundColor: colors.statusMutedBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  categoryPill: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryBlue,
    backgroundColor: colors.lightBlue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    overflow: "hidden",
    textTransform: "capitalize",
  },
  caseId: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primaryBlue,
    letterSpacing: 0.3,
  },
  caseIdHint: {
    marginTop: 4,
    marginBottom: 4,
    fontSize: 11,
    lineHeight: 15,
    color: colors.muted,
    fontWeight: "500",
  },
  row: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  refRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.md,
    padding: 12,
  },
  refLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  refValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "800",
    color: colors.navy,
  },
  filedAt: {
    marginTop: 2,
    fontSize: 11,
    color: colors.mutedDark,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryBlue,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primaryBlue,
  },
  editBox: {
    marginTop: 12,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.md,
    padding: 12,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.navy,
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: "600",
    color: colors.navy,
  },
  editActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  editCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.mutedDark,
  },
  editSave: {
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  editSaveText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.white,
  },
  statusBox: {
    marginTop: 12,
    backgroundColor: colors.statusMutedBg,
    borderRadius: radii.md,
    padding: 12,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statusValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "800",
    color: colors.navy,
    textTransform: "capitalize",
  },
  actionBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.primaryBlue,
    borderRadius: radii.lg,
    paddingVertical: 12,
  },
  actionText: {
    color: colors.primaryBlue,
    fontSize: 14,
    fontWeight: "800",
  },
  empty: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 18,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.navy,
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  primary: {
    marginTop: 16,
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
});
