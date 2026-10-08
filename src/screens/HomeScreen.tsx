import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  MapPin,
  Megaphone,
  Search,
} from "lucide-react-native";
import EmergencyCard from "../components/EmergencyCard";
import LocationPickerModal from "../components/LocationPickerModal";
import PublicAlertCard from "../components/PublicAlertCard";
import ReportConcernGrid from "../components/ReportConcernGrid";
import { useAppLocation } from "../Context/LocationContext";
import type { ReportCategoryId } from "../data/reportCategories";
import { APP_NAME } from "../lib/brand";
import { countCasesNeedingFollowUp } from "../lib/myCases";
import { listPublicAlerts, type PublicAlert } from "../lib/publicAlerts";
import { colors, radii, space } from "../theme/tokens";

const MARK = require("../../assets/images/icon.png");

type Props = {
  onOpenNotifications?: () => void;
  onOpenReport?: (categoryId?: ReportCategoryId | null) => void;
  onOpenExplore?: () => void;
  onOpenContribute?: () => void;
  onOpenRecovery?: () => void;
  onOpenGlobalSearch?: (query?: string) => void;
  onOpenPostAlert?: () => void;
  onOpenEssentialNumbers?: () => void;
  onOpenMyCases?: () => void;
};

export default function HomeScreen({
  onOpenNotifications,
  onOpenReport,
  onOpenExplore,
  onOpenGlobalSearch,
  onOpenPostAlert,
  onOpenEssentialNumbers,
  onOpenMyCases,
}: Props) {
  const insets = useSafeAreaInsets();
  const { location, setLocation, locationLabel, gps, refreshGps } =
    useAppLocation();
  const [locationOpen, setLocationOpen] = useState(false);
  const [alerts, setAlerts] = useState<PublicAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState(0);

  const near =
    gps != null ? { latitude: gps.latitude, longitude: gps.longitude } : null;
  const nearKey = near
    ? `${near.latitude.toFixed(3)},${near.longitude.toFixed(3)}`
    : "none";

  const refreshAlerts = useCallback(async () => {
    setAlertsLoading(true);
    const result = await listPublicAlerts(near);
    setAlertsLoading(false);
    if (!result.ok) {
      setAlertsError(result.error);
      return;
    }
    setAlertsError(null);
    setAlerts(result.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearKey]);

  // Kept separate so a new GPS fix only refetches alerts, never asks for GPS again.
  useFocusEffect(
    useCallback(() => {
      void countCasesNeedingFollowUp().then(setFollowUps);
      void refreshGps();
    }, [refreshGps])
  );

  useFocusEffect(
    useCallback(() => {
      void refreshAlerts();
    }, [refreshAlerts])
  );

  const onAlertChanged = (id: string, next: PublicAlert | null) => {
    setAlerts((prev) =>
      next ? prev.map((a) => (a.id === id ? next : a)) : prev.filter((a) => a.id !== id)
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 28,
          paddingTop: Math.max(insets.top, 8),
        }}
      >
        <View style={styles.topBar}>
          <Pressable
            style={styles.locationPill}
            onPress={() => setLocationOpen(true)}
          >
            <MapPin size={15} color={colors.primaryBlue} strokeWidth={2.4} />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationLabel}
            </Text>
            <ChevronDown
              size={14}
              color={colors.primaryBlue}
              strokeWidth={2.4}
            />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={onOpenNotifications}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Bell size={20} color={colors.navy} strokeWidth={2.2} />
          </Pressable>
        </View>

        <View style={styles.heroRow}>
          <Image source={MARK} style={styles.mark} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>{APP_NAME}</Text>
            <Text style={styles.tagline}>Know. Act. A better Delhi.</Text>
          </View>
        </View>

        <Pressable
          style={styles.searchWrap}
          onPress={() => {
            if (onOpenGlobalSearch) onOpenGlobalSearch();
            else onOpenExplore?.();
          }}
        >
          <Search size={18} color={colors.muted} strokeWidth={2} />
          <Text style={styles.searchPlaceholder}>Search issues or offices</Text>
        </Pressable>

        <View style={styles.section}>
          <EmergencyCard />
        </View>

        {followUps > 0 ? (
          <Pressable
            style={[styles.section, styles.followCard]}
            onPress={() => onOpenMyCases?.()}
            accessibilityRole="button"
          >
            <View style={styles.knowIcon}>
              <ClipboardCheck size={22} color={colors.primaryBlue} strokeWidth={2.2} />
            </View>
            <View style={styles.knowCopy}>
              <Text style={styles.knowTitle}>
                {followUps === 1
                  ? "1 case: is it fixed?"
                  : `${followUps} cases: are they fixed?`}
              </Text>
              <Text style={styles.knowSub}>
                Tell us, and we'll show the next office if it isn't.
              </Text>
            </View>
            <ChevronRight size={20} color={colors.linkBlue} strokeWidth={2.2} />
          </Pressable>
        ) : null}

        <View style={styles.section}>
          <ReportConcernGrid
            onSeeAll={() => onOpenReport?.(null)}
            onSelect={(categoryId) => onOpenReport?.(categoryId)}
            onOpenEssentialNumbers={() => onOpenEssentialNumbers?.()}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertHeading}>Public alerts</Text>
            <Pressable onPress={() => onOpenPostAlert?.()} hitSlop={8}>
              <Text style={styles.alertPost}>Post →</Text>
            </Pressable>
          </View>
          <Text style={styles.alertSub}>
            Posted by people nearby. Tap "I've seen it too" if you see the same
            thing.
          </Text>

          <Pressable
            style={styles.postCard}
            onPress={() => onOpenPostAlert?.()}
          >
            <View style={styles.postIcon}>
              <Megaphone size={20} color={colors.primaryBlue} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.postTitle}>Seen something unsafe?</Text>
              <Text style={styles.postSub}>
                Dark lane, live wire, open drain. Anonymous.
              </Text>
            </View>
            <ChevronRight size={18} color={colors.linkBlue} />
          </Pressable>

          {alertsLoading && alerts.length === 0 ? (
            <ActivityIndicator color={colors.primaryBlue} style={{ marginVertical: 12 }} />
          ) : alertsError && alerts.length === 0 ? (
            <View style={styles.alertError}>
              <Text style={styles.alertErrorText}>{alertsError}</Text>
              <Pressable onPress={() => void refreshAlerts()} hitSlop={8}>
                <Text style={styles.alertPost}>Try again</Text>
              </Pressable>
            </View>
          ) : alerts.length === 0 ? (
            <Text style={styles.emptyAlerts}>
              No alerts near you right now. Be the first to post one.
            </Text>
          ) : (
            alerts.slice(0, 8).map((alert) => (
              <PublicAlertCard
                key={alert.id}
                alert={alert}
                onChanged={(next) => onAlertChanged(alert.id, next)}
                onReport={(categoryId) => onOpenReport?.(categoryId)}
              />
            ))
          )}
          {alerts.length > 8 ? (
            <Pressable onPress={() => onOpenExplore?.()} hitSlop={8}>
              <Text style={[styles.alertPost, { textAlign: "center" }]}>
                See all {alerts.length} alerts →
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={[styles.section, styles.knowCard]}
          onPress={() => onOpenExplore?.()}
        >
          <View style={styles.knowIcon}>
            <BookOpen size={22} color={colors.navy} strokeWidth={2.2} />
          </View>
          <View style={styles.knowCopy}>
            <Text style={styles.knowTitle}>Know Your City</Text>
            <Text style={styles.knowSub}>
              Simple information on rules, rights and who to contact.
            </Text>
          </View>
          <ChevronRight size={20} color={colors.linkBlue} strokeWidth={2.2} />
        </Pressable>
      </ScrollView>

      <LocationPickerModal
        visible={locationOpen}
        current={location}
        onClose={() => setLocationOpen(false)}
        onSelect={setLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  topBar: {
    paddingHorizontal: space.screen,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.locationPill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    maxWidth: "68%",
  },
  locationText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy,
    flexShrink: 1,
  },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  heroRow: {
    marginTop: 16,
    marginHorizontal: space.screen,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  brand: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.navy,
    letterSpacing: -0.4,
  },
  tagline: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "600",
    color: colors.mutedDark,
  },
  searchWrap: {
    marginTop: 14,
    marginHorizontal: space.screen,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    boxShadow: "0px 3px 10px rgba(15, 40, 80, 0.06)",
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: colors.muted,
    fontWeight: "500",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.navy,
    padding: 0,
    pointerEvents: "none",
  },
  section: {
    marginTop: 20,
    marginHorizontal: space.screen,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  alertHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.navy,
  },
  alertPost: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.linkBlue,
  },
  alertSub: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedDark,
    marginBottom: 12,
  },
  postCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 12,
  },
  postIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  postTitle: { fontSize: 15, fontWeight: "800", color: colors.navy },
  postSub: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: colors.mutedDark,
  },
  emptyAlerts: {
    fontSize: 13,
    color: colors.muted,
    paddingVertical: 8,
  },
  followCard: {
    backgroundColor: colors.statusYellowBg,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  alertError: {
    backgroundColor: colors.logoutBg,
    borderRadius: radii.lg,
    padding: 12,
    gap: 8,
  },
  alertErrorText: { fontSize: 13, lineHeight: 18, color: colors.navy, fontWeight: "600" },
  knowCard: {
    marginTop: 22,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  knowIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  knowCopy: { flex: 1 },
  knowTitle: { fontSize: 16, fontWeight: "800", color: colors.navy },
  knowSub: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: colors.mutedDark,
    fontWeight: "500",
  },
});
