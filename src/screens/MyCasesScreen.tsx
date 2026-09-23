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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  ExternalLink,
  FileCheck2,
  Phone,
} from "lucide-react-native";
import { APP_CASE_ID_LABEL } from "../lib/brand";
import { dialNumber } from "../lib/dial";
import { listLocalCases, type LocalCaseRecord } from "../lib/myCases";
import { colors, radii, space } from "../theme/tokens";

type Props = {
  onOpenReport?: () => void;
};

function formatStatus(s: string): string {
  return s.replace(/_/g, " ");
}

function CaseCard({ item }: { item: LocalCaseRecord }) {
  const openTrack = () => {
    if (!item.trackingUrl) return;
    Alert.alert(
      "Official tracking",
      "Enter your official reference on their site. We do not add it to the URL for you.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open",
          onPress: () => {
            void Linking.openURL(item.trackingUrl!).catch(() =>
              Alert.alert("Unable to open", item.trackingUrl!)
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.caseId}>
        {APP_CASE_ID_LABEL}: {item.caseId}
      </Text>
      <Text style={styles.caseIdHint}>
        Your personal notebook number only - not a government complaint ID.
      </Text>
      <Text style={styles.meta}>
        {item.categorySlug?.replace(/_/g, " ") ?? "Concern"}
        {item.issueTypeSlug
          ? ` · ${item.issueTypeSlug.replace(/_/g, " ")}`
          : ""}
      </Text>
      <Text style={styles.row}>
        Suggested office:{" "}
        {item.authorityName ??
          item.authoritySlug?.replace(/_/g, " ") ??
          "Not recorded"}
      </Text>
      <Text style={styles.row}>
        Reference you saved:{" "}
        {item.officialReference?.trim() || "None yet (optional)"}
      </Text>
      {item.filedAt ? (
        <Text style={styles.row}>Filed (you recorded): {item.filedAt}</Text>
      ) : null}
      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Status recorded by you</Text>
        <Text style={styles.statusValue}>{formatStatus(item.userStatus)}</Text>
        <Text style={styles.statusHint}>
          Status you recorded - not a live government feed.
        </Text>
      </View>

      {item.trackingUrl ? (
        <Pressable style={styles.actionBtn} onPress={openTrack}>
          <ExternalLink size={16} color={colors.primaryBlue} />
          <Text style={styles.actionText}>Track on Official Website</Text>
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
      ) : (
        <Text style={styles.hint}>
          No verified tracking URL or phone on file for this case.
        </Text>
      )}
    </View>
  );
}

export default function MyCasesScreen({ onOpenReport }: Props) {
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
      <View style={styles.header}>
        <FileCheck2 size={22} color={colors.primaryBlue} strokeWidth={2.2} />
        <Text style={styles.title}>My Cases</Text>
      </View>
      <Text style={styles.sub}>
        Personal notes from the guide. Each {APP_CASE_ID_LABEL} is only for you
 - not a government complaint. Add their reference yourself if they gave
        you one.
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
              <Text style={styles.emptyTitle}>No saved notes yet</Text>
              <Text style={styles.emptyBody}>
                Follow the guide, contact the office yourself if you want, then
                save your notes here. Add their reference number only if they
                gave you one.
              </Text>
              {onOpenReport ? (
                <Pressable style={styles.primary} onPress={onOpenReport}>
                  <Text style={styles.primaryText}>Start a report</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            cases.map((c) => <CaseCard key={c.caseId} item={c} />)
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
  caseId: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primaryBlue,
    letterSpacing: 0.4,
  },
  caseIdHint: {
    marginTop: 4,
    marginBottom: 4,
    fontSize: 11,
    lineHeight: 15,
    color: colors.muted,
    fontWeight: "500",
  },
  meta: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy,
    textTransform: "capitalize",
  },
  row: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  statusBox: {
    marginTop: 12,
    backgroundColor: colors.lightBlue,
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
  statusHint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: colors.mutedDark,
    fontWeight: "500",
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
  hint: {
    marginTop: 10,
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
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
