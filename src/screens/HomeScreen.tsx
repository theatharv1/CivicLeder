import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  MapPin,
  Megaphone,
  Search,
  ThumbsUp,
} from "lucide-react-native";
import EmergencyCard from "../components/EmergencyCard";
import LocationPickerModal from "../components/LocationPickerModal";
import ReportConcernGrid from "../components/ReportConcernGrid";
import { useAppLocation } from "../Context/LocationContext";
import type { ReportCategoryId } from "../data/reportCategories";
import { APP_NAME } from "../lib/brand";
import {
  listPublicAlerts,
  verifyPublicAlert,
  type PublicAlert,
} from "../lib/publicAlerts";
import { colors, radii, space } from "../theme/tokens";

const AVATAR = require("../../assets/images/avatar.png");

type Props = {
  onOpenProfile?: () => void;
  onOpenReport?: (categoryId?: ReportCategoryId | null) => void;
  onOpenExplore?: () => void;
  onOpenContribute?: () => void;
  onOpenRecovery?: () => void;
  onOpenGlobalSearch?: (query?: string) => void;
  onOpenPostAlert?: () => void;
};

function timeAgo(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HomeScreen({
  onOpenProfile,
  onOpenReport,
  onOpenExplore,
  onOpenGlobalSearch,
  onOpenPostAlert,
}: Props) {
  const insets = useSafeAreaInsets();
  const { location, setLocation } = useAppLocation();
  const [locationOpen, setLocationOpen] = useState(false);
  const [alerts, setAlerts] = useState<PublicAlert[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refreshAlerts = useCallback(async () => {
    const rows = await listPublicAlerts();
    setAlerts(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshAlerts();
    }, [refreshAlerts])
  );

  const onVerify = async (id: string) => {
    setBusyId(id);
    const result = await verifyPublicAlert(id);
    setBusyId(null);
    if (!result.ok) {
      Alert.alert("Could not verify", result.error);
      return;
    }
    setAlerts((prev) =>
      prev.map((a) => (a.id === result.alert.id ? { ...a, ...result.alert } : a))
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
            <Text style={styles.locationText}>{location}</Text>
            <ChevronDown
              size={14}
              color={colors.primaryBlue}
              strokeWidth={2.4}
            />
          </Pressable>
          <Pressable onPress={onOpenProfile}>
            <Image source={AVATAR} style={styles.avatar} />
          </Pressable>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.tagline}>
            Your City. Your Information.{"\n"}A Cleaner, Safer, Better Delhi.
          </Text>
        </View>

        <Pressable
          style={styles.searchWrap}
          onPress={() => {
            if (onOpenGlobalSearch) onOpenGlobalSearch();
            else onOpenExplore?.();
          }}
        >
          <Search size={18} color={colors.muted} strokeWidth={2} />
          <TextInput
            placeholder="Search place, issue, rule or authority..."
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            editable={false}
          />
        </Pressable>

        <View style={styles.section}>
          <EmergencyCard />
        </View>

        <View style={styles.section}>
          <ReportConcernGrid
            onSeeAll={() => onOpenReport?.(null)}
            onSelect={(categoryId) => onOpenReport?.(categoryId)}
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
            Anonymous tips from people nearby. Tap verify if you see the same
            problem.
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
                Photo + place. No name shown. Takes under a minute.
              </Text>
            </View>
            <ChevronRight size={18} color={colors.linkBlue} />
          </Pressable>

          {alerts.length === 0 ? (
            <Text style={styles.emptyAlerts}>
              No public alerts yet. Be the first nearby.
            </Text>
          ) : (
            alerts.slice(0, 8).map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                {alert.photoUri ? (
                  <Image
                    source={{ uri: alert.photoUri }}
                    style={styles.alertPhoto}
                  />
                ) : null}
                <View style={styles.alertBody}>
                  <Text style={styles.alertPlace}>{alert.placeName}</Text>
                  <Text style={styles.alertDesc} numberOfLines={3}>
                    {alert.description}
                  </Text>
                  <Text style={styles.alertMeta}>
                    {timeAgo(alert.createdAt)}
                    {alert.areaLabel ? ` · ${alert.areaLabel}` : ""}
                    {alert.nearbyCount
                      ? ` · ${alert.nearbyCount + 1} posts near here`
                      : ""}
                    {" · Anonymous"}
                  </Text>
                  <View style={styles.alertActions}>
                    <Text style={styles.verifyCount}>
                      {alert.verifyCount} verified
                    </Text>
                    {!alert.isMine ? (
                      <Pressable
                        style={[
                          styles.verifyBtn,
                          alert.myVerified && styles.verifyBtnOn,
                        ]}
                        disabled={busyId === alert.id || alert.myVerified}
                        onPress={() => void onVerify(alert.id)}
                      >
                        <ThumbsUp
                          size={14}
                          color={
                            alert.myVerified ? colors.white : colors.primaryBlue
                          }
                        />
                        <Text
                          style={[
                            styles.verifyBtnText,
                            alert.myVerified && styles.verifyBtnTextOn,
                          ]}
                        >
                          {alert.myVerified ? "Verified" : "I see this too"}
                        </Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.mineNote}>Your anonymous post</Text>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
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
  },
  locationText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBlue,
  },
  heroCopy: {
    marginTop: 14,
    paddingHorizontal: space.screen,
  },
  brand: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.navy,
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.navySoft,
  },
  searchWrap: {
    marginTop: 16,
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
    boxShadow: "0px 3px 10px rgba(15, 40, 80, 0.07)",
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
  alertCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden",
    marginBottom: 10,
  },
  alertPhoto: {
    width: "100%",
    height: 140,
    backgroundColor: colors.canvas,
  },
  alertBody: { padding: 12 },
  alertPlace: { fontSize: 15, fontWeight: "800", color: colors.navy },
  alertDesc: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedDark,
  },
  alertMeta: {
    marginTop: 8,
    fontSize: 11,
    color: colors.muted,
    fontWeight: "600",
  },
  alertActions: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  verifyCount: { fontSize: 12, fontWeight: "700", color: colors.navy },
  verifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.lightBlue,
  },
  verifyBtnOn: { backgroundColor: colors.primaryBlue },
  verifyBtnText: { fontSize: 12, fontWeight: "700", color: colors.primaryBlue },
  verifyBtnTextOn: { color: colors.white },
  mineNote: { fontSize: 12, fontWeight: "600", color: colors.muted },
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
