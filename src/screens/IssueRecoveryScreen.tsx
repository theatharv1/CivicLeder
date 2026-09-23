/**
 * Global "I don't see my issue" recovery - separate from category Other.
 * Minimal screen; reuses theme tokens. Does not redesign Home.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ChevronLeft,
  Phone,
  Search,
  ExternalLink,
} from "lucide-react-native";
import { useReportDraft } from "../Context/ReportDraftContext";
import { REPORT_CATEGORIES, type ReportCategoryId } from "../data/reportCategories";
import { ENVIRONMENT_RIGHTS_SOURCE } from "../data/environmentKnowledge";
import { FALLBACK_OFFICIAL_SERVICES_CATALOG } from "../data/environmentFallback";
import {
  searchGlobal,
  suggestFromFreeText,
  type GlobalSearchHit,
} from "../lib/globalSearch";
import { dialNumber } from "../lib/dial";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "IssueRecovery">;

type Branch =
  | "home"
  | "civic"
  | "not_sure"
  | "official_service"
  | "rights"
  | "follow_up"
  | "emergency"
  | "none"
  | "search";

const BRANCHES: { id: Branch; title: string; subtitle: string }[] = [
  {
    id: "civic",
    title: "Report a civic concern",
    subtitle: "Pick a broad category to continue the report flow",
  },
  {
    id: "official_service",
    title: "Find an official service",
    subtitle: "Portals and apps we have verified",
  },
  {
    id: "rights",
    title: "Rights & guidance",
    subtitle: "What you can do - not a legal conclusion",
  },
  {
    id: "emergency",
    title: "Emergency",
    subtitle: "112 / 101 guidance for immediate danger",
  },
  {
    id: "follow_up",
    title: "Follow up on a case",
    subtitle: "Open My Cases for your recorded drafts",
  },
  {
    id: "not_sure",
    title: "Not sure",
    subtitle: "Describe it - we may suggest a category",
  },
  {
    id: "none",
    title: "None of these",
    subtitle: "General grievance fallback (CM Jan Sunwai)",
  },
];

export default function IssueRecoveryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { setCategoryId, setIssueTypeSlug, reset } = useReportDraft();
  const [branch, setBranch] = useState<Branch>("home");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<GlobalSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [freeText, setFreeText] = useState("");
  const [suggestions, setSuggestions] = useState<GlobalSearchHit[]>([]);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    const rows = await searchGlobal(q, 24);
    setHits(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (branch === "search" || query.trim()) {
      void runSearch(query);
    }
  }, [query, branch, runSearch]);

  const openUrl = (url: string) => {
    void Linking.openURL(url).catch(() => undefined);
  };

  const startCivic = (categoryId: ReportCategoryId, issueSlug?: string) => {
    reset();
    setCategoryId(categoryId);
    if (issueSlug) setIssueTypeSlug(issueSlug);
    navigation.navigate("ReportStep2");
  };

  const onHit = (hit: GlobalSearchHit) => {
    if (hit.kind === "emergency" && hit.phone) {
      void dialNumber(hit.phone, hit.title);
      return;
    }
    if (
      (hit.kind === "category" || hit.kind === "issue") &&
      hit.categoryId &&
      hit.categoryId !== "something_else"
    ) {
      startCivic(hit.categoryId, hit.issueSlug);
      return;
    }
    if (hit.kind === "app") {
      const store = hit.playStoreUrl ?? hit.appStoreUrl ?? hit.url;
      if (store) openUrl(store);
      return;
    }
    if (hit.url) {
      openUrl(hit.url);
      return;
    }
    if (hit.phone) {
      void dialNumber(hit.phone, hit.title);
    }
  };

  const civicCategories = REPORT_CATEGORIES.filter(
    (c) => c.id !== "something_else"
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          style={styles.back}
          onPress={() => {
            if (branch !== "home") {
              setBranch("home");
              return;
            }
            navigation.goBack();
          }}
          hitSlop={8}
        >
          <ChevronLeft size={22} color={colors.linkBlue} strokeWidth={2.4} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>I Don’t See My Issue</Text>
          <Text style={styles.headerStep}>Recovery</Text>
        </View>
        <View style={{ width: 72 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: space.screen,
          paddingBottom: 24 + Math.max(insets.bottom, 8),
        }}
      >
        <Text style={styles.heading}>Can’t find the right category?</Text>
        <Text style={styles.sub}>
          Search across issues, services and rights - or pick a path below.
          This is separate from “Other” inside a category.
        </Text>

        <View style={styles.searchWrap}>
          <Search size={18} color={colors.muted} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setBranch("search");
            }}
            placeholder="Search issue, service, right, authority..."
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>

        {branch === "search" || query.trim() ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search results</Text>
            {loading ? (
              <ActivityIndicator color={colors.primaryBlue} />
            ) : hits.length === 0 ? (
              <Text style={styles.empty}>No matches - try another word or a path below.</Text>
            ) : (
              hits.map((hit) => (
                <Pressable
                  key={hit.id}
                  style={styles.hitCard}
                  onPress={() => onHit(hit)}
                >
                  <Text style={styles.hitKind}>
                    {hit.confidenceLabel === "may be"
                      ? "May be"
                      : hit.confidenceLabel === "official"
                        ? "Official"
                        : "Related"}{" "}
                    · {hit.kind}
                  </Text>
                  <Text style={styles.hitTitle}>{hit.title}</Text>
                  <Text style={styles.hitSub}>{hit.subtitle}</Text>
                </Pressable>
              ))
            )}
          </View>
        ) : null}

        {branch === "home" && !query.trim() ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What do you need?</Text>
            {BRANCHES.map((b) => (
              <Pressable
                key={b.id}
                style={styles.branchCard}
                onPress={() => {
                  if (b.id === "follow_up") {
                    navigation.navigate("Main", { screen: "cases" });
                    return;
                  }
                  setBranch(b.id);
                }}
              >
                <Text style={styles.branchTitle}>{b.title}</Text>
                <Text style={styles.branchSub}>{b.subtitle}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {branch === "civic" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Broad category</Text>
            <Text style={styles.hint}>
              Recovery picker - not a redesign of Home. Choose one to continue
              reporting.
            </Text>
            {civicCategories.map((c) => (
              <Pressable
                key={c.id}
                style={styles.branchCard}
                onPress={() => startCivic(c.id)}
              >
                <Text style={styles.branchTitle}>{c.title}</Text>
                <Text style={styles.branchSub}>{c.description}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {branch === "not_sure" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Describe what you observed</Text>
            <TextInput
              value={freeText}
              onChangeText={setFreeText}
              placeholder="e.g. loud DJ near my house, tree being cut..."
              placeholderTextColor={colors.muted}
              style={styles.freeText}
              multiline
            />
            <Pressable
              style={styles.primaryBtn}
              onPress={() => setSuggestions(suggestFromFreeText(freeText))}
            >
              <Text style={styles.primaryBtnText}>Suggest possible matches</Text>
            </Pressable>
            {suggestions.map((hit) => (
              <Pressable
                key={hit.id}
                style={styles.hitCard}
                onPress={() => onHit(hit)}
              >
                <Text style={styles.hitKind}>May be · {hit.kind}</Text>
                <Text style={styles.hitTitle}>{hit.title}</Text>
                <Text style={styles.hitSub}>{hit.subtitle}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {branch === "official_service" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Official services</Text>
            {FALLBACK_OFFICIAL_SERVICES_CATALOG.map((s) => (
              <Pressable
                key={s.slug}
                style={styles.hitCard}
                onPress={() => openUrl(s.official_url)}
              >
                <Text style={styles.hitKind}>Official · service</Text>
                <Text style={styles.hitTitle}>{s.name}</Text>
                <Text style={styles.hitSub}>
                  {s.organization}
                  {s.tracking_url ? " · tracking available" : ""}
                </Text>
                <View style={styles.rowActions}>
                  <ExternalLink size={14} color={colors.linkBlue} />
                  <Text style={styles.linkText}>Open official page</Text>
                </View>
                {s.phone ? (
                  <Pressable
                    style={styles.rowActions}
                    onPress={() => void dialNumber(s.phone!, s.name)}
                  >
                    <Phone size={14} color={colors.linkBlue} />
                    <Text style={styles.linkText}>Call {s.phone}</Text>
                  </Pressable>
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}

        {branch === "rights" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rights & guidance</Text>
            {(
              [
                {
                  id: "r1",
                  kind: "right" as const,
                  title: "Report noise pollution",
                  subtitle: "NGMS / 155271",
                  confidenceLabel: "official" as const,
                  url: ENVIRONMENT_RIGHTS_SOURCE.ngms,
                  phone: "155271",
                },
                {
                  id: "r2",
                  kind: "right" as const,
                  title: "Report tree / wildlife concern",
                  subtitle: "Forest grievance / 1800-11-8600",
                  confidenceLabel: "official" as const,
                  url: ENVIRONMENT_RIGHTS_SOURCE.forestGrievance,
                  phone: "1800118600",
                },
                {
                  id: "r3",
                  kind: "right" as const,
                  title: "Report pollution (Green Delhi)",
                  subtitle: "App or portal - tracking after login",
                  confidenceLabel: "official" as const,
                  url: ENVIRONMENT_RIGHTS_SOURCE.greenDelhi,
                  playStoreUrl: ENVIRONMENT_RIGHTS_SOURCE.greenDelhiPlay,
                },
                {
                  id: "r4",
                  kind: "knowledge" as const,
                  title: "Keep official references",
                  subtitle: "MD-###### is only your CivicLeder ID",
                  confidenceLabel: "related" as const,
                },
              ] as GlobalSearchHit[]
            ).map((hit) => (
              <Pressable
                key={hit.id}
                style={styles.hitCard}
                onPress={() => onHit(hit)}
              >
                <Text style={styles.hitKind}>Official · right</Text>
                <Text style={styles.hitTitle}>{hit.title}</Text>
                <Text style={styles.hitSub}>{hit.subtitle}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {branch === "emergency" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency</Text>
            <Text style={styles.hint}>
              If people are in immediate danger, call emergency services first.
              Complaint portals are secondary.
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => void dialNumber("112", "All Emergencies")}
            >
              <Phone size={18} color={colors.white} />
              <Text style={styles.primaryBtnText}>Call 112</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => void dialNumber("101", "Fire & Rescue")}
            >
              <Phone size={18} color={colors.primaryBlue} />
              <Text style={styles.secondaryBtnText}>Call 101 - Fire & Rescue</Text>
            </Pressable>
          </View>
        ) : null}

        {branch === "none" ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General grievance fallback</Text>
            <Text style={styles.hint}>
              CM Jan Sunwai is a general portal. Prefer specialized channels
              (NGMS, Forest, Green Delhi, DISCOM, municipal) when they fit.
              Opening this page does not file a complaint for you.
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => openUrl(ENVIRONMENT_RIGHTS_SOURCE.cmJanSunwai)}
            >
              <ExternalLink size={18} color={colors.white} />
              <Text style={styles.primaryBtnText}>Open CM Jan Sunwai</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingHorizontal: space.screen,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 72,
    marginTop: 6,
    marginLeft: -4,
  },
  backText: { fontSize: 15, fontWeight: "600", color: colors.linkBlue },
  headerCenter: { flex: 1, alignItems: "center", paddingTop: 2 },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
    textAlign: "center",
  },
  headerStep: { fontSize: 12, color: colors.muted, marginTop: 2 },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.navy,
    marginTop: 8,
  },
  sub: {
    fontSize: 14,
    color: colors.mutedDark,
    marginTop: 6,
    lineHeight: 20,
  },
  searchWrap: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.lightBlue,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.navy, padding: 0 },
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.navy,
    marginBottom: 8,
  },
  hint: { fontSize: 13, color: colors.mutedDark, marginBottom: 10, lineHeight: 18 },
  empty: { fontSize: 14, color: colors.muted, marginTop: 8 },
  branchCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 10,
  },
  branchTitle: { fontSize: 15, fontWeight: "700", color: colors.navy },
  branchSub: { fontSize: 13, color: colors.mutedDark, marginTop: 4 },
  hitCard: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.canvas,
  },
  hitKind: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.linkBlue,
    textTransform: "uppercase",
  },
  hitTitle: { fontSize: 15, fontWeight: "700", color: colors.navy, marginTop: 4 },
  hitSub: { fontSize: 13, color: colors.mutedDark, marginTop: 2 },
  freeText: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    minHeight: 96,
    padding: 12,
    fontSize: 15,
    color: colors.navy,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  primaryBtnText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  secondaryBtnText: { color: colors.primaryBlue, fontWeight: "700", fontSize: 15 },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  linkText: { fontSize: 13, color: colors.linkBlue, fontWeight: "600" },
});
