import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  MapPin,
  Pencil,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react-native";
import LocationPickerModal from "../../components/LocationPickerModal";
import StepProgress from "../../components/StepProgress";
import CitizenTipList from "../../components/CitizenTipList";
import { useAppLocation } from "../../Context/LocationContext";
import { useReportDraft } from "../../Context/ReportDraftContext";
import { reportPhase } from "../../lib/reportPhase";
import {
  BUILDING_CITIZEN_TIPS,
  BUILDING_GROUPS,
  buildingGroupForIssueSlug,
  isBuildingEmergencyIssue,
} from "../../data/buildingKnowledge";
import {
  CONSTRUCTION_CITIZEN_TIPS,
  CONSTRUCTION_GROUPS,
  constructionGroupForIssueSlug,
  isConstructionEmergencyIssue,
} from "../../data/constructionKnowledge";
import { isElectricityEmergencyIssue } from "../../data/electricityKnowledge";
import {
  WATER_DRAINAGE_GROUPS,
  isWaterEmergencyIssue,
  waterGroupForIssueSlug,
} from "../../data/waterDrainageKnowledge";
import {
  WASTE_GARBAGE_GROUPS,
  isWasteEmergencyIssue,
  wasteGroupForIssueSlug,
} from "../../data/wasteGarbageKnowledge";
import {
  ROADS_PUBLIC_SPACES_GROUPS,
  isRoadsEmergencyIssue,
  roadsGroupForIssueSlug,
} from "../../data/roadsPublicSpacesKnowledge";
import {
  ENVIRONMENT_GROUPS,
  isEnvironmentEmergencyIssue,
  environmentGroupForIssueSlug,
} from "../../data/environmentKnowledge";
import {
  ANIMALS_CITIZEN_TIPS,
  ANIMALS_GROUPS,
  animalsGroupForIssueSlug,
  isAnimalsEmergencyIssue,
} from "../../data/animalsKnowledge";
import {
  FALLBACK_WOMEN_SAFETY_ISSUE_TYPES,
  WOMEN_SAFETY_GROUPS,
  isWomenSafetyEmergencyIssue,
  womenGroupForIssueSlug,
} from "../../data/womenSafetyFallback";
import {
  FALLBACK_POLICE_HELP_ISSUE_TYPES,
  POLICE_HELP_GROUPS,
  isPoliceHelpEmergencyIssue,
  policeGroupForIssueSlug,
} from "../../data/policeHelpFallback";
import type { IssueTypeRow } from "../../data/emergencyFallback";
import {
  FALLBACK_BUILDING_ISSUE_TYPES,
  FALLBACK_CONSTRUCTION_ISSUE_TYPES,
} from "../../data/emergencyFallback";
import { FALLBACK_ELECTRICITY_ISSUE_TYPES } from "../../data/electricityFallback";
import { FALLBACK_WATER_DRAINAGE_ISSUE_TYPES } from "../../data/waterDrainageFallback";
import { FALLBACK_WASTE_GARBAGE_ISSUE_TYPES } from "../../data/wasteGarbageFallback";
import { FALLBACK_ROADS_PUBLIC_SPACES_ISSUE_TYPES } from "../../data/roadsPublicSpacesFallback";
import { FALLBACK_ENVIRONMENT_ISSUE_TYPES } from "../../data/environmentFallback";
import { FALLBACK_ANIMALS_ISSUE_TYPES } from "../../data/animalsFallback";
import {
  REPORT_CATEGORIES,
  type ReportCategoryId,
} from "../../data/reportCategories";
import { fetchIssueTypesForCategory } from "../../lib/reportEmergency";
import type { RootStackParamList } from "../../navigation/types";
import { colors, radii, space } from "../../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "ReportStep2">;

const FIRE_INCLUDES = [
  "Blocked or locked emergency exits",
  "Missing or non-functional fire extinguishers",
  "Fire safety violations in buildings",
  "Illegal storage of flammable material",
  "No fire safety measures at construction sites",
  "Any other fire risk or hazard",
] as const;

const CATEGORY_INCLUDES: Partial<Record<ReportCategoryId, readonly string[]>> =
  {
    fire_safety: FIRE_INCLUDES,
  };

/** First stepped screen after category (Home shortcut skips category picker). */
export default function ReportStep2Screen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { location, setLocation, locationLabel } = useAppLocation();
  const { categoryId, setCategoryId, setIssueTypeSlug, issueTypeSlug } =
    useReportDraft();
  const [locationOpen, setLocationOpen] = useState(false);
  const [typedIssues, setTypedIssues] = useState<IssueTypeRow[]>([]);
  const [showOfficialRules, setShowOfficialRules] = useState(false);

  useEffect(() => {
    if (route.params?.category) {
      setCategoryId(route.params.category);
    }
  }, [route.params?.category, setCategoryId]);

  const category =
    REPORT_CATEGORIES.find((c) => c.id === categoryId) ??
    REPORT_CATEGORIES.find((c) => c.id === "something_else")!;

  const isFire = category.id === "fire_safety";
  const isBuilding = category.id === "building";
  const isConstruction = category.id === "construction";
  const isElectricity = category.id === "electricity";
  const isWaterDrainage = category.id === "water_drainage";
  const isWasteGarbage = category.id === "waste_garbage";
  const isRoadsPublic = category.id === "roads_public";
  const isEnvironment = category.id === "environment";
  const isAnimals = category.id === "animals";
  const isWomenSafety = category.id === "women_safety";
  const isPoliceHelp = category.id === "police_help";
  const usesTypedIssues =
    isBuilding ||
    isConstruction ||
    isElectricity ||
    isWaterDrainage ||
    isWasteGarbage ||
    isRoadsPublic ||
    isEnvironment ||
    isAnimals ||
    isWomenSafety ||
    isPoliceHelp;
  const usesGroupedIssues =
    isBuilding ||
    isConstruction ||
    isWaterDrainage ||
    isWasteGarbage ||
    isRoadsPublic ||
    isEnvironment ||
    isAnimals ||
    isWomenSafety ||
    isPoliceHelp;
  const fallbackTypes = isWomenSafety
    ? FALLBACK_WOMEN_SAFETY_ISSUE_TYPES
    : isPoliceHelp
      ? FALLBACK_POLICE_HELP_ISSUE_TYPES
      : isAnimals
        ? FALLBACK_ANIMALS_ISSUE_TYPES
        : isEnvironment
          ? FALLBACK_ENVIRONMENT_ISSUE_TYPES
          : isRoadsPublic
            ? FALLBACK_ROADS_PUBLIC_SPACES_ISSUE_TYPES
            : isWasteGarbage
              ? FALLBACK_WASTE_GARBAGE_ISSUE_TYPES
              : isWaterDrainage
                ? FALLBACK_WATER_DRAINAGE_ISSUE_TYPES
                : isElectricity
                  ? FALLBACK_ELECTRICITY_ISSUE_TYPES
                  : isConstruction
                    ? FALLBACK_CONSTRUCTION_ISSUE_TYPES
                    : FALLBACK_BUILDING_ISSUE_TYPES;
  const citizenTips = isBuilding
    ? BUILDING_CITIZEN_TIPS
    : isConstruction
      ? CONSTRUCTION_CITIZEN_TIPS
      : isAnimals
        ? ANIMALS_CITIZEN_TIPS
        : null;

  useEffect(() => {
    let alive = true;
    if (!usesTypedIssues) {
      setTypedIssues([]);
      return;
    }
    if (isAnimals) {
      setTypedIssues(FALLBACK_ANIMALS_ISSUE_TYPES);
      return () => {
        alive = false;
      };
    }
    if (isWomenSafety) {
      setTypedIssues(FALLBACK_WOMEN_SAFETY_ISSUE_TYPES);
      return () => {
        alive = false;
      };
    }
    if (isPoliceHelp) {
      setTypedIssues(FALLBACK_POLICE_HELP_ISSUE_TYPES);
      return () => {
        alive = false;
      };
    }
    if (isEnvironment) {
      setTypedIssues(FALLBACK_ENVIRONMENT_ISSUE_TYPES);
      return () => {
        alive = false;
      };
    }
    if (isRoadsPublic) {
      setTypedIssues(FALLBACK_ROADS_PUBLIC_SPACES_ISSUE_TYPES);
      return () => {
        alive = false;
      };
    }
    if (isWasteGarbage) {
      setTypedIssues(FALLBACK_WASTE_GARBAGE_ISSUE_TYPES);
      return () => {
        alive = false;
      };
    }
    if (isWaterDrainage) {
      // Groups only - do not dump all 50+ DB issue types into Step 2.
      setTypedIssues(FALLBACK_WATER_DRAINAGE_ISSUE_TYPES);
      return () => {
        alive = false;
      };
    }
    const slug = isElectricity
      ? "electricity"
      : isConstruction
        ? "construction"
        : "building";
    (async () => {
      const rows = await fetchIssueTypesForCategory(slug);
      if (!alive) return;
      setTypedIssues(rows);
    })();
    return () => {
      alive = false;
    };
  }, [
    usesTypedIssues,
    isConstruction,
    isElectricity,
    isWaterDrainage,
    isWasteGarbage,
    isRoadsPublic,
    isEnvironment,
    isAnimals,
    isWomenSafety,
    isPoliceHelp,
  ]);

  const includes: readonly string[] = usesTypedIssues
    ? isWomenSafety
      ? WOMEN_SAFETY_GROUPS.map((g) => g.label)
      : isPoliceHelp
        ? POLICE_HELP_GROUPS.map((g) => g.label)
        : isAnimals
          ? ANIMALS_GROUPS.map((g) => g.label)
          : isEnvironment
            ? ENVIRONMENT_GROUPS.map((g) => g.label)
            : isRoadsPublic
              ? ROADS_PUBLIC_SPACES_GROUPS.map((g) => g.label)
              : isWasteGarbage
                ? WASTE_GARBAGE_GROUPS.map((g) => g.label)
                : isWaterDrainage
                  ? WATER_DRAINAGE_GROUPS.map((g) => g.label)
                  : isConstruction
                    ? CONSTRUCTION_GROUPS.map((g) => g.label)
                    : isBuilding
                      ? BUILDING_GROUPS.map((g) => g.label)
                      : (typedIssues.length ? typedIssues : fallbackTypes).map(
                          (t) => t.name
                        )
    : (categoryId && CATEGORY_INCLUDES[categoryId]) || FIRE_INCLUDES;
  const Icon = category.Icon;
  const selectedTyped = usesTypedIssues
    ? usesGroupedIssues
      ? (() => {
          const g = isWomenSafety
            ? womenGroupForIssueSlug(issueTypeSlug)
            : isPoliceHelp
              ? policeGroupForIssueSlug(issueTypeSlug)
              : isBuilding
                ? buildingGroupForIssueSlug(issueTypeSlug)
                : isConstruction
                  ? constructionGroupForIssueSlug(issueTypeSlug)
                  : isAnimals
                    ? animalsGroupForIssueSlug(issueTypeSlug)
                    : isEnvironment
                      ? environmentGroupForIssueSlug(issueTypeSlug)
                      : isRoadsPublic
                        ? roadsGroupForIssueSlug(issueTypeSlug)
                        : isWasteGarbage
                          ? wasteGroupForIssueSlug(issueTypeSlug)
                          : waterGroupForIssueSlug(issueTypeSlug);
          return g
            ? {
                slug: g.representativeSlug,
                name: g.label,
                short_description: g.description,
                sort_order: 0,
              }
            : null;
        })()
      : (typedIssues.length ? typedIssues : fallbackTypes).find(
          (t) => t.slug === issueTypeSlug
        )
    : null;
  const showDangerNote =
    (isBuilding &&
      (isBuildingEmergencyIssue(issueTypeSlug) ||
        Boolean(
          selectedTyped?.slug && isBuildingEmergencyIssue(selectedTyped.slug)
        ))) ||
    (isConstruction &&
      (isConstructionEmergencyIssue(issueTypeSlug) ||
        Boolean(
          selectedTyped?.slug &&
            isConstructionEmergencyIssue(selectedTyped.slug)
        ))) ||
    (isElectricity &&
      (isElectricityEmergencyIssue(issueTypeSlug) ||
        Boolean(
          selectedTyped?.slug &&
            isElectricityEmergencyIssue(selectedTyped.slug)
        ))) ||
    (isWaterDrainage &&
      (isWaterEmergencyIssue(issueTypeSlug) ||
        Boolean(
          selectedTyped?.slug && isWaterEmergencyIssue(selectedTyped.slug)
        ))) ||
    (isWasteGarbage &&
      (isWasteEmergencyIssue(issueTypeSlug) ||
        Boolean(
          selectedTyped?.slug && isWasteEmergencyIssue(selectedTyped.slug)
        ))) ||
    (isRoadsPublic &&
      (isRoadsEmergencyIssue(issueTypeSlug) ||
        Boolean(
          selectedTyped?.slug && isRoadsEmergencyIssue(selectedTyped.slug)
        ))) ||
    (isEnvironment &&
      (isEnvironmentEmergencyIssue(issueTypeSlug) ||
        Boolean(
          selectedTyped?.slug && isEnvironmentEmergencyIssue(selectedTyped.slug)
        ))) ||
    (isAnimals &&
      (isAnimalsEmergencyIssue(issueTypeSlug) ||
        Boolean(
          selectedTyped?.slug && isAnimalsEmergencyIssue(selectedTyped.slug)
        ))) ||
    (isWomenSafety &&
      (isWomenSafetyEmergencyIssue(issueTypeSlug) ||
        Boolean(
          selectedTyped?.slug &&
            isWomenSafetyEmergencyIssue(selectedTyped.slug)
        ))) ||
    (isPoliceHelp &&
      (isPoliceHelpEmergencyIssue(issueTypeSlug) ||
        Boolean(
          selectedTyped?.slug && isPoliceHelpEmergencyIssue(selectedTyped.slug)
        )));

  const onContinue = () => {
    if (usesTypedIssues && !issueTypeSlug) {
      const first = typedIssues[0]?.slug ?? fallbackTypes[0]?.slug;
      if (first) setIssueTypeSlug(first);
    }
    navigation.navigate("ReportStep3");
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={colors.linkBlue} strokeWidth={2.4} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Report a Concern</Text>
          <Text style={styles.headerStep}>{reportPhase(2).headerLine}</Text>
        </View>
        <Pressable
          style={styles.locationPill}
          onPress={() => setLocationOpen(true)}
        >
          <MapPin size={13} color={colors.primaryBlue} strokeWidth={2.4} />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationLabel}
          </Text>
          <ChevronDown size={13} color={colors.primaryBlue} strokeWidth={2.4} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.screen,
          paddingBottom: 28 + Math.max(insets.bottom, 8) + 110,
        }}
      >
        <View style={styles.progressWrap}>
          <StepProgress
            current={reportPhase(2).phase}
            total={reportPhase(2).total}
            label={reportPhase(2).label}
          />
        </View>

        <Text style={styles.heading}>What did you notice?</Text>
        <Text style={styles.sub}>Tap the closest match.</Text>

        <View
          style={[
            styles.categoryCard,
            isFire ? styles.categoryCardFire : styles.categoryCardDefault,
          ]}
        >
          <View style={styles.categoryIconWrap}>
            <Icon size={28} color={category.iconColor} strokeWidth={2.2} />
          </View>
          <View style={styles.categoryCopy}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <Text style={styles.categoryDesc}>{category.description}</Text>
          </View>
          <Pressable
            style={styles.changeBtn}
            onPress={() =>
              navigation.navigate({
                name: "ReportStep1",
                params: { category: categoryId },
                merge: false,
              })
            }
          >
            <Pencil size={13} color={colors.linkBlue} strokeWidth={2.2} />
            <Text style={styles.changeText}>Change</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What does this include?</Text>

          <View style={styles.includeRow}>
            <View style={styles.includeList}>
              {includes.map((item) => (
                <Pressable
                  key={item}
                  style={styles.includeItem}
                  onPress={() => {
                    if (!usesTypedIssues) return;
                    if (isBuilding) {
                      const group = BUILDING_GROUPS.find(
                        (g) => g.label === item
                      );
                      if (group) setIssueTypeSlug(group.representativeSlug);
                      return;
                    }
                    if (isConstruction) {
                      const group = CONSTRUCTION_GROUPS.find(
                        (g) => g.label === item
                      );
                      if (group) setIssueTypeSlug(group.representativeSlug);
                      return;
                    }
                    if (isAnimals) {
                      const group = ANIMALS_GROUPS.find(
                        (g) => g.label === item
                      );
                      if (group) setIssueTypeSlug(group.representativeSlug);
                      return;
                    }
                    if (isWomenSafety) {
                      const group = WOMEN_SAFETY_GROUPS.find(
                        (g) => g.label === item
                      );
                      if (group) setIssueTypeSlug(group.representativeSlug);
                      return;
                    }
                    if (isPoliceHelp) {
                      const group = POLICE_HELP_GROUPS.find(
                        (g) => g.label === item
                      );
                      if (group) setIssueTypeSlug(group.representativeSlug);
                      return;
                    }
                    if (isEnvironment) {
                      const group = ENVIRONMENT_GROUPS.find(
                        (g) => g.label === item
                      );
                      if (group) setIssueTypeSlug(group.representativeSlug);
                      return;
                    }
                    if (isRoadsPublic) {
                      const group = ROADS_PUBLIC_SPACES_GROUPS.find(
                        (g) => g.label === item
                      );
                      if (group) setIssueTypeSlug(group.representativeSlug);
                      return;
                    }
                    if (isWasteGarbage) {
                      const group = WASTE_GARBAGE_GROUPS.find(
                        (g) => g.label === item
                      );
                      if (group) setIssueTypeSlug(group.representativeSlug);
                      return;
                    }
                    if (isWaterDrainage) {
                      const group = WATER_DRAINAGE_GROUPS.find(
                        (g) => g.label === item
                      );
                      if (group) setIssueTypeSlug(group.representativeSlug);
                      return;
                    }
                    const pool = typedIssues.length
                      ? typedIssues
                      : fallbackTypes;
                    const match = pool.find((t) => t.name === item);
                    if (match) setIssueTypeSlug(match.slug);
                  }}
                >
                  <View
                    style={[
                      styles.checkCircle,
                      usesTypedIssues &&
                        issueTypeSlug &&
                        (usesGroupedIssues
                          ? (isWomenSafety
                              ? womenGroupForIssueSlug(issueTypeSlug)?.label
                              : isPoliceHelp
                                ? policeGroupForIssueSlug(issueTypeSlug)?.label
                                : isBuilding
                                  ? buildingGroupForIssueSlug(issueTypeSlug)
                                      ?.label
                                  : isConstruction
                                    ? constructionGroupForIssueSlug(
                                        issueTypeSlug
                                      )?.label
                                    : isAnimals
                                      ? animalsGroupForIssueSlug(issueTypeSlug)
                                          ?.label
                                      : isEnvironment
                                        ? environmentGroupForIssueSlug(
                                            issueTypeSlug
                                          )?.label
                                        : isRoadsPublic
                                          ? roadsGroupForIssueSlug(
                                              issueTypeSlug
                                            )?.label
                                          : isWasteGarbage
                                            ? wasteGroupForIssueSlug(
                                                issueTypeSlug
                                              )?.label
                                            : waterGroupForIssueSlug(
                                                issueTypeSlug
                                              )?.label) === item
                          : (typedIssues.length
                              ? typedIssues
                              : fallbackTypes
                            ).find((t) => t.name === item)?.slug ===
                            issueTypeSlug) &&
                        styles.checkCircleSelected,
                    ]}
                  >
                    <Check size={11} color={colors.white} strokeWidth={3} />
                  </View>
                  <Text style={styles.includeText}>{item}</Text>
                </Pressable>
              ))}
            </View>

            {isFire ? (
              <View style={styles.visualCol}>
                <View style={styles.fireExitSign}>
                  <Text style={styles.fireExitTop}>FIRE EXIT</Text>
                  <View style={styles.fireExitRow}>
                    <View style={styles.runner}>
                      <View style={styles.runnerHead} />
                      <View style={styles.runnerBody} />
                    </View>
                    <Text style={styles.fireExitArrow}>→</Text>
                  </View>
                </View>
                <View style={styles.exitTip}>
                  <Info size={14} color={colors.linkBlue} strokeWidth={2.2} />
                  <Text style={styles.exitTipText}>
                    Clear exits save lives. Report hazards.
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {showDangerNote ? (
          <View style={styles.safetyNote}>
            <AlertTriangle size={18} color={colors.emergency} strokeWidth={2.2} />
            <Text style={styles.safetyNoteText}>
              {isAnimals ||
              isRoadsPublic ||
              isWasteGarbage ||
              isWaterDrainage ||
              isElectricity ||
              isConstruction ||
              isBuilding
                ? "If anyone is in danger right now - call 112 or 101 first. Do not take risky photos."
                : "If anyone is in immediate danger, call 112 or 101 first."}
            </Text>
          </View>
        ) : null}

        {citizenTips ? (
          <View style={styles.card}>
            <Pressable
              style={styles.ruleHead}
              onPress={() => setShowOfficialRules((v) => !v)}
            >
              <Text style={styles.cardTitle}>Tips (optional)</Text>
              <ChevronDown
                size={18}
                color={colors.linkBlue}
                style={{
                  transform: [
                    { rotate: showOfficialRules ? "180deg" : "0deg" },
                  ],
                }}
              />
            </Pressable>
            {showOfficialRules ? (
              <CitizenTipList tips={citizenTips} previewCount={3} />
            ) : null}
          </View>
        ) : null}

        <Pressable style={styles.notEmergency} onPress={onContinue}>
          <View style={styles.shieldWrap}>
            <ShieldCheck size={22} color="#1B7A3E" strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.notEmergencyTitle}>Continue safely</Text>
            <Text style={styles.notEmergencyBody}>
              Life at risk? Call 112 / 101. Otherwise continue below.
            </Text>
          </View>
          <ChevronRight size={18} color="#1B7A3E" />
        </Pressable>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <Pressable onPress={onContinue} style={styles.continue}>
          <Text style={styles.continueText}>Continue →</Text>
        </Pressable>
      </View>

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
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingHorizontal: space.screen,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 72,
    marginTop: 6,
    marginLeft: -4,
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.linkBlue,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingTop: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
    textAlign: "center",
  },
  headerStep: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.locationPill,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.pill,
    maxWidth: 108,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.navy,
    maxWidth: 58,
  },
  progressWrap: { marginTop: 8, marginBottom: 18 },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.navy,
    letterSpacing: -0.3,
  },
  sub: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  categoryCard: {
    borderRadius: radii.lg,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  categoryCardFire: {
    backgroundColor: "#FDECEC",
  },
  categoryCardDefault: {
    backgroundColor: colors.lightBlue,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryCopy: { flex: 1 },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
  },
  categoryDesc: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: colors.mutedDark,
  },
  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.linkBlue,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
  },
  ruleHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardSub: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
    color: colors.mutedDark,
  },
  includeRow: {
    flexDirection: "row",
    gap: 10,
  },
  includeList: {
    flex: 1,
    gap: 10,
  },
  includeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkCircleSelected: {
    backgroundColor: "#1B7A3E",
  },
  includeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.navySoft,
    fontWeight: "500",
  },
  safetyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FDECEC",
    borderRadius: radii.lg,
    padding: 12,
    marginBottom: 14,
  },
  safetyNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.navy,
    fontWeight: "600",
  },
  visualCol: {
    width: 112,
    gap: 8,
  },
  fireExitSign: {
    height: 88,
    borderRadius: 12,
    backgroundColor: "#1B8A3E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  fireExitTop: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  fireExitRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  runner: {
    width: 18,
    height: 22,
    alignItems: "center",
  },
  runnerHead: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  runnerBody: {
    marginTop: 2,
    width: 10,
    height: 12,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  fireExitArrow: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
  },
  exitTip: {
    backgroundColor: colors.lightBlue,
    borderRadius: 10,
    padding: 8,
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  exitTipText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 13,
    color: colors.linkBlue,
    fontWeight: "600",
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  ruleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.navy,
  },
  ruleBody: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: colors.mutedDark,
  },
  knowMore: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "700",
    color: colors.linkBlue,
  },
  notEmergency: {
    backgroundColor: "#E6F6EC",
    borderRadius: radii.lg,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shieldWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  notEmergencyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1B7A3E",
  },
  notEmergencyBody: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: "#2F6B45",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.screen,
    paddingTop: 10,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  continue: {
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  continueText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  contribLink: {
    marginTop: 10,
    alignItems: "center",
    paddingVertical: 6,
  },
  contribLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.linkBlue,
  },
  refRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  refText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
});
