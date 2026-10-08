import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  ChevronRight,
  ClipboardList,
  FilePlus2,
  Sparkles,
  ArrowLeft,
} from "lucide-react-native";
import {
  countCasesNeedingFollowUp,
  FOLLOW_UP_DAYS,
} from "../lib/myCases";
import { colors, radii, space } from "../theme/tokens";

type Props = {
  onStartNewReport: () => void;
  onOpenMyCases: () => void;
  onBackHome?: () => void;
};

/**
 * Report tab — file or track. Essential numbers live on Home.
 */
export default function ReportHubScreen({
  onStartNewReport,
  onOpenMyCases,
  onBackHome,
}: Props) {
  const insets = useSafeAreaInsets();
  const [followUps, setFollowUps] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void countCasesNeedingFollowUp().then((n) => {
        if (alive) setFollowUps(n);
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, 12) + 8 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {onBackHome ? (
        <Pressable
          style={styles.back}
          onPress={onBackHome}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={colors.navy} strokeWidth={2.2} />
        </Pressable>
      ) : null}

      <View style={styles.hero}>
        <Text style={styles.kicker}>Report</Text>
        <Text style={styles.title}>What do you need?</Text>
        <Text style={styles.sub}>
          Start a new complaint, or check one you already filed.
        </Text>

        <View style={styles.pathRow}>
          <View style={styles.pathStep}>
            <View style={styles.pathDot}>
              <Text style={styles.pathNum}>1</Text>
            </View>
            <Text style={styles.pathText}>Report</Text>
          </View>
          <View style={styles.pathLine} />
          <View style={styles.pathStep}>
            <View style={styles.pathDot}>
              <Text style={styles.pathNum}>2</Text>
            </View>
            <Text style={styles.pathText}>Track</Text>
          </View>
          <View style={styles.pathLine} />
          <View style={styles.pathStep}>
            <View style={styles.pathDot}>
              <Text style={styles.pathNum}>3</Text>
            </View>
            <Text style={styles.pathText}>Follow up</Text>
          </View>
        </View>
      </View>

      <Pressable
        style={styles.primaryCard}
        onPress={onStartNewReport}
        accessibilityRole="button"
      >
        <View style={styles.primaryIcon}>
          <FilePlus2 size={24} color={colors.white} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.primaryTitle}>New report</Text>
          <Text style={styles.primarySub}>
            Pick a category. We show the right office and how to file.
          </Text>
        </View>
        <ChevronRight size={20} color={colors.white} strokeWidth={2.2} />
      </Pressable>

      <Pressable
        style={[styles.rowCard, followUps > 0 && styles.rowCardAlert]}
        onPress={onOpenMyCases}
        accessibilityRole="button"
      >
        <View
          style={[
            styles.rowIcon,
            {
              backgroundColor:
                followUps > 0 ? colors.logoutBg : colors.lightBlue,
            },
          ]}
        >
          <ClipboardList
            size={20}
            color={followUps > 0 ? colors.logoutFg : colors.primaryBlue}
            strokeWidth={2.2}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowTitleRow}>
            <Text style={styles.rowTitle}>My Cases</Text>
            {followUps > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{followUps}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.rowSub}>
            {followUps > 0
              ? `${followUps} waiting. Still not fixed? Open next step.`
              : `Save tracking IDs. We ask again every ${FOLLOW_UP_DAYS} days.`}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.linkBlue} />
      </Pressable>

      <View style={styles.tipCard}>
        <Sparkles size={18} color={colors.primaryBlue} strokeWidth={2.2} />
        <Text style={styles.tipText}>
          Tip: on Home, tap a category for a fast start, or Essential Numbers
          for helplines. Use More for every issue type.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: {
    paddingHorizontal: space.screen,
    paddingBottom: 32,
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
  hero: {
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryBlue,
    letterSpacing: 0.2,
  },
  title: {
    marginTop: 4,
    fontSize: 30,
    fontWeight: "800",
    color: colors.navy,
  },
  sub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  pathRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  pathStep: {
    alignItems: "center",
    gap: 4,
  },
  pathDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  pathNum: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.white,
  },
  pathText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.navy,
  },
  pathLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    marginBottom: 16,
    backgroundColor: colors.lightBlue,
    borderRadius: 1,
  },
  primaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    padding: 18,
    marginBottom: 12,
  },
  primaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.white,
  },
  primarySub: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.84)",
    fontWeight: "500",
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.white,
  },
  rowCardAlert: {
    borderColor: "#F5B5B5",
    backgroundColor: "#FFF8F8",
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.navy,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.logoutFg,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
  },
  rowSub: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  tipCard: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.md,
    padding: 14,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.navySoft,
    fontWeight: "500",
  },
});
