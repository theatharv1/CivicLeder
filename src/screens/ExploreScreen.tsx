import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  X,
  ArrowLeft,
} from "lucide-react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Linking } from "react-native";
import LocationPickerModal from "../components/LocationPickerModal";
import PublicAlertCard from "../components/PublicAlertCard";
import { useAppLocation } from "../Context/LocationContext";
import {
  LEARN_CARDS,
  type LearnCard,
  type LearnCategory,
} from "../data/exploreLearn";
import type { ReportCategoryId } from "../data/reportCategories";
import {
  alertTypeInfo,
  listPublicAlerts,
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

export default function ExploreScreen({
  onBackHome,
}: {
  onBackHome?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { location, setLocation, locationLabel, gps } = useAppLocation();
  const [mode, setMode] = useState<Mode>("alerts");
  const [query, setQuery] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [alerts, setAlerts] = useState<PublicAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const nearKey = gps ? `${gps.latitude.toFixed(3)},${gps.longitude.toFixed(3)}` : "none";

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await listPublicAlerts(
      gps ? { latitude: gps.latitude, longitude: gps.longitude } : null
    );
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setAlerts(result.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearKey]);

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
        a.description.toLowerCase().includes(q) ||
        alertTypeInfo(a.type).label.toLowerCase().includes(q)
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

  const onAlertChanged = (id: string, next: PublicAlert | null) => {
    setAlerts((prev) =>
      next ? prev.map((a) => (a.id === id ? next : a)) : prev.filter((a) => a.id !== id)
    );
  };

  const openReport = (category: ReportCategoryId) => {
    navigation.navigate({
      name: "ReportStep2",
      params: { category },
      merge: false,
    });
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
            {onBackHome ? (
              <Pressable
                onPress={onBackHome}
                style={styles.back}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <ArrowLeft size={22} color={colors.navy} strokeWidth={2.2} />
              </Pressable>
            ) : null}
            <Text style={styles.title}>Explore</Text>
            <Text style={styles.sub}>
              {mode === "alerts"
                ? "Nearby posts. Always anonymous."
                : "Guides when you want to read more."}
            </Text>
          </View>
          <Pressable
            style={styles.locationPill}
            onPress={() => setLocationOpen(true)}
          >
            <MapPin size={14} color={colors.primaryBlue} strokeWidth={2.4} />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationLabel}
            </Text>
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
                  Place and what you saw. Anonymous. Takes under a minute.
                </Text>
              </View>
              <ChevronRight size={18} color={colors.linkBlue} />
            </Pressable>

            {loading && alerts.length === 0 ? (
              <ActivityIndicator color={colors.primaryBlue} style={{ marginVertical: 16 }} />
            ) : error && alerts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Couldn't load alerts</Text>
                <Text style={styles.emptyBody}>{error}</Text>
                <Pressable onPress={() => void refresh()} hitSlop={8}>
                  <Text style={styles.linkText}>Try again</Text>
                </Pressable>
              </View>
            ) : filteredAlerts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No alerts near you</Text>
                <Text style={styles.emptyBody}>
                  When someone nearby posts a public alert, it shows up here
                  for everyone. No sample posts.
                </Text>
              </View>
            ) : (
              filteredAlerts.map((alert) => (
                <PublicAlertCard
                  key={alert.id}
                  alert={alert}
                  onChanged={(next) => onAlertChanged(alert.id, next)}
                  onReport={openReport}
                />
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
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
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
