import React, { useCallback, useMemo, useState } from "react";
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
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MapPin,
  Megaphone,
  Search,
  ThumbsUp,
  X,
} from "lucide-react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Linking } from "react-native";
import LocationPickerModal from "../components/LocationPickerModal";
import { useAppLocation } from "../Context/LocationContext";
import {
  LEARN_CARDS,
  type LearnCard,
  type LearnCategory,
} from "../data/exploreLearn";
import type { ReportCategoryId } from "../data/reportCategories";
import {
  listPublicAlerts,
  verifyPublicAlert,
  type PublicAlert,
} from "../lib/publicAlerts";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Mode = "alerts" | "guides";

function learnToReportSlug(cat: LearnCategory): ReportCategoryId | null {
  if (cat === "all") return null;
  if (cat === "building") return "building";
  if (cat === "water") return "water_drainage";
  if (cat === "fire") return "fire_safety";
  if (cat === "street") return "roads_public";
  if (cat === "animals") return "animals";
  return null;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function GuideRow({ card }: { card: LearnCard }) {
  const navigation = useNavigation<Nav>();
  const [open, setOpen] = useState(false);
  const actSlug = card.actCategory ?? learnToReportSlug(card.category);
  return (
    <View style={styles.guideCard}>
      <Pressable style={styles.guideHead} onPress={() => setOpen((v) => !v)}>
        <BookOpen size={18} color={colors.primaryBlue} strokeWidth={2.2} />
        <Text style={styles.guideTitle}>{card.title}</Text>
        <ChevronDown
          size={18}
          color={colors.linkBlue}
          style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
        />
      </Pressable>
      {open ? (
        <View style={styles.guideBody}>
          <Text style={styles.body}>{card.plain}</Text>
          <Text style={styles.bodyLabel}>What you can do</Text>
          <Text style={styles.body}>{card.prevent}</Text>
          {card.whereUrl ? (
            <Pressable
              style={styles.linkRow}
              onPress={() => void Linking.openURL(card.whereUrl!)}
            >
              <ExternalLink size={14} color={colors.linkBlue} />
              <Text style={styles.linkText}>
                {card.whereLabel ?? "Official page"}
              </Text>
            </Pressable>
          ) : null}
          {actSlug ? (
            <Pressable
              style={styles.actBtn}
              onPress={() =>
                navigation.navigate({
                  name: "ReportStep1",
                  params: { category: actSlug },
                  merge: false,
                })
              }
            >
              <Text style={styles.actBtnText}>Open report guide</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { location, setLocation } = useAppLocation();
  const [mode, setMode] = useState<Mode>("alerts");
  const [query, setQuery] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [alerts, setAlerts] = useState<PublicAlert[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setAlerts(await listPublicAlerts());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const filteredAlerts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return alerts;
    return alerts.filter(
      (a) =>
        a.placeName.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }, [alerts, query]);

  const filteredGuides = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LEARN_CARDS;
    return LEARN_CARDS.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.teaser.toLowerCase().includes(q) ||
        c.plain.toLowerCase().includes(q)
    );
  }, [query]);

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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: 28,
          paddingHorizontal: space.screen,
        }}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Explore</Text>
            <Text style={styles.sub}>
              {mode === "alerts"
                ? "What people nearby posted. Real posts only."
                : "Open a guide only if you want to read more."}
            </Text>
          </View>
          <Pressable
            style={styles.locationPill}
            onPress={() => setLocationOpen(true)}
          >
            <MapPin size={14} color={colors.primaryBlue} strokeWidth={2.4} />
            <Text style={styles.locationText}>{location}</Text>
            <ChevronDown
              size={14}
              color={colors.primaryBlue}
              strokeWidth={2.4}
            />
          </Pressable>
        </View>

        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeChip, mode === "alerts" && styles.modeChipOn]}
            onPress={() => setMode("alerts")}
          >
            <Text
              style={[
                styles.modeChipText,
                mode === "alerts" && styles.modeChipTextOn,
              ]}
            >
              Public alerts
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeChip, mode === "guides" && styles.modeChipOn]}
            onPress={() => setMode("guides")}
          >
            <Text
              style={[
                styles.modeChipText,
                mode === "guides" && styles.modeChipTextOn,
              ]}
            >
              Guides
            </Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Search size={18} color={colors.muted} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={
              mode === "alerts"
                ? "Search a place or problem…"
                : "Search a guide…"
            }
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <X size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        {mode === "alerts" ? (
          <>
            <Pressable
              style={styles.postCard}
              onPress={() => navigation.navigate("PostPublicAlert")}
            >
              <View style={styles.postIcon}>
                <Megaphone
                  size={20}
                  color={colors.primaryBlue}
                  strokeWidth={2.2}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.postTitle}>Post an alert</Text>
                <Text style={styles.postSub}>
                  Photo and place. Anonymous. Takes under a minute.
                </Text>
              </View>
              <ChevronRight size={18} color={colors.linkBlue} />
            </Pressable>

            {filteredAlerts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No posts yet</Text>
                <Text style={styles.emptyBody}>
                  When someone posts a public alert, it will show up here. No
                  sample posts.
                </Text>
              </View>
            ) : (
              filteredAlerts.map((alert) => (
                <View key={alert.id} style={styles.alertCard}>
                  {alert.photoUri ? (
                    <Image
                      source={{ uri: alert.photoUri }}
                      style={styles.alertPhoto}
                    />
                  ) : null}
                  <View style={styles.alertBody}>
                    <Text style={styles.alertPlace}>{alert.placeName}</Text>
                    <Text style={styles.alertDesc}>{alert.description}</Text>
                    <Text style={styles.alertMeta}>
                      {timeAgo(alert.createdAt)}
                      {alert.areaLabel ? ` · ${alert.areaLabel}` : ""}
                      {alert.nearbyCount
                        ? ` · ${alert.nearbyCount + 1} near this spot`
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
                              alert.myVerified
                                ? colors.white
                                : colors.primaryBlue
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
                        <Text style={styles.mineNote}>Your post</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            <Text style={styles.guidesHint}>
              Tap a title to read. Nothing opens until you ask.
            </Text>
            {filteredGuides.length === 0 ? (
              <Text style={styles.emptyBody}>No matching guides.</Text>
            ) : (
              filteredGuides.map((card) => (
                <GuideRow key={card.id} card={card} />
              ))
            )}
          </>
        )}
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
  root: { flex: 1, backgroundColor: colors.canvas },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.navy },
  sub: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedDark,
    maxWidth: 220,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.locationPill,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  locationText: { fontSize: 13, fontWeight: "700", color: colors.navy },
  modeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  modeChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  modeChipOn: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  modeChipText: { fontSize: 13, fontWeight: "700", color: colors.navy },
  modeChipTextOn: { color: colors.white },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.navy, padding: 0 },
  postCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 14,
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
  emptyBox: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 18,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
    marginBottom: 6,
  },
  emptyBody: { fontSize: 13, lineHeight: 19, color: colors.mutedDark },
  alertCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden",
    marginBottom: 12,
  },
  alertPhoto: { width: "100%", height: 150, backgroundColor: colors.canvas },
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
  guidesHint: {
    fontSize: 13,
    color: colors.mutedDark,
    marginBottom: 12,
    lineHeight: 18,
  },
  guideCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: 10,
    overflow: "hidden",
  },
  guideHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  guideTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.navy,
  },
  guideBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 8,
  },
  body: { fontSize: 14, lineHeight: 20, color: colors.mutedDark },
  bodyLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: colors.navy,
  },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  linkText: { fontSize: 13, fontWeight: "600", color: colors.linkBlue },
  actBtn: {
    marginTop: 8,
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.lg,
    paddingVertical: 12,
    alignItems: "center",
  },
  actBtnText: { color: colors.white, fontWeight: "800", fontSize: 14 },
});
