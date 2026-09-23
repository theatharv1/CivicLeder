import React, { useEffect, useState } from "react";
import {
  Linking,
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
  FileText,
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
  BUILDING_KNOWLEDGE_CARDS,
  UBBL_2016_SOURCE,
  buildingGroupForIssueSlug,
  isBuildingEmergencyIssue,
} from "../../data/buildingKnowledge";
import {
  CONSTRUCTION_CITIZEN_TIPS,
  CONSTRUCTION_GROUPS,
  CONSTRUCTION_KNOWLEDGE_CARDS,
  constructionGroupForIssueSlug,
  isConstructionEmergencyIssue,
} from "../../data/constructionKnowledge";
import {
  ELECTRICITY_KNOWLEDGE_CARDS,
  ELECTRICITY_RIGHTS_SOURCE,
  isElectricityEmergencyIssue,
} from "../../data/electricityKnowledge";
import {
  WATER_DRAINAGE_GROUPS,
  WATER_DRAINAGE_KNOWLEDGE_CARDS,
  WATER_DRAINAGE_RIGHTS_SOURCE,
  isWaterEmergencyIssue,
  waterGroupForIssueSlug,
} from "../../data/waterDrainageKnowledge";
import {
  WASTE_GARBAGE_GROUPS,
  WASTE_GARBAGE_KNOWLEDGE_CARDS,
  WASTE_GARBAGE_RIGHTS_SOURCE,
  isWasteEmergencyIssue,
  wasteGroupForIssueSlug,
} from "../../data/wasteGarbageKnowledge";
import {
  ROADS_PUBLIC_SPACES_GROUPS,
  ROADS_PUBLIC_SPACES_KNOWLEDGE_CARDS,
  ROADS_PUBLIC_SPACES_RIGHTS_SOURCE,
  isRoadsEmergencyIssue,
  roadsGroupForIssueSlug,
} from "../../data/roadsPublicSpacesKnowledge";
import {
  ENVIRONMENT_GROUPS,
  ENVIRONMENT_KNOWLEDGE_CARDS,
  ENVIRONMENT_RIGHTS_SOURCE,
  isEnvironmentEmergencyIssue,
  environmentGroupForIssueSlug,
} from "../../data/environmentKnowledge";
import {
  ANIMALS_CITIZEN_TIPS,
  ANIMALS_GROUPS,
  animalsGroupForIssueSlug,
  isAnimalsEmergencyIssue,
} from "../../data/animalsKnowledge";
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

const CATEGORY_RULES: Partial<
  Record<
    ReportCategoryId,
    { title: string; body: string; knowMoreUrl: string; knowMoreLabel: string }
  >
> = {
  fire_safety: {
    title: "National Building Code (NBC)",
    body: "Specifies fire safety requirements for buildings, emergency exits, and fire-fighting systems.",
    knowMoreUrl: "https://dfs.delhi.gov.in/",
    knowMoreLabel: "Know more about fire safety rules in Delhi →",
  },
  building: {
    title: "Delhi building rulebook (UBBL)",
    body: "Official DDA page - open only if you want the full text.",
    knowMoreUrl: UBBL_2016_SOURCE.url,
    knowMoreLabel: "Open official DDA page →",
  },
  construction: {
    title: "Construction & pollution channels",
    body: "Official portals for dust / site complaints - optional reading.",
    knowMoreUrl: "https://greendelhi.nic.in/",
    knowMoreLabel: "Open Green Delhi →",
  },
  electricity: {
    title: ELECTRICITY_RIGHTS_SOURCE.title,
    body: "Consumer rights on connection timelines, metering, billing and grievance redressal. Delhi metropolitan timelines need DERC/DISCOM confirmation - not unconditional promises. This app does not file for you.",
    knowMoreUrl: ELECTRICITY_RIGHTS_SOURCE.url,
    knowMoreLabel: "Open Ministry of Power Acts & Notifications →",
  },
  water_drainage: {
    title: WATER_DRAINAGE_RIGHTS_SOURCE.title,
    body: "Water supply, sewerage, drainage and waterlogging use different official channels. Not every water issue goes to DJB. Timelines: see the current official service standard. This app does not file for you.",
    knowMoreUrl: WATER_DRAINAGE_RIGHTS_SOURCE.url,
    knowMoreLabel: "Open Delhi Jal Board official website →",
  },
  waste_garbage: {
    title: WASTE_GARBAGE_RIGHTS_SOURCE.title,
    body: "Garbage collection, dumping, burning and specialized waste use different official channels. Not every waste issue goes to MCD or DPCC. This app does not file for you.",
    knowMoreUrl: WASTE_GARBAGE_RIGHTS_SOURCE.url,
    knowMoreLabel: "Open MCD Online feedback (complaints) →",
  },
  roads_public: {
    title: ROADS_PUBLIC_SPACES_RIGHTS_SOURCE.title,
    body: "A pothole is not always MCD or PWD. Traffic Police is not for every road repair. Streetlights often follow Electricity / DISCOM channels. This app does not file for you.",
    knowMoreUrl: ROADS_PUBLIC_SPACES_RIGHTS_SOURCE.url,
    knowMoreLabel: "Open MCD Online feedback (complaints) →",
  },
  animals: {
    title: "Animals on public land",
    body: "Most stray cattle, dog and dead-animal reports go to MCD 311 / 155305 (NDMC areas differ). Attack in progress - 112 first. This app does not file for you.",
    knowMoreUrl: "https://mcdonline.nic.in/",
    knowMoreLabel: "Open MCD Online →",
  },
  environment: {
    title: ENVIRONMENT_RIGHTS_SOURCE.title,
    body: "Not every environment issue goes to DPCC. Noise uses NGMS / 155271. Trees and wildlife use Forest channels. Air / general pollution often uses Green Delhi. This app does not file for you.",
    knowMoreUrl: ENVIRONMENT_RIGHTS_SOURCE.ngms,
    knowMoreLabel: "Open NGMS noise portal →",
  },
};

/** Report Step 2 - Understand the Issue (Fire Safety design as source of truth). */
export default function ReportStep2Screen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { location, setLocation } = useAppLocation();
  const { categoryId, setIssueTypeSlug, issueTypeSlug } = useReportDraft();
  const [locationOpen, setLocationOpen] = useState(false);
  const [typedIssues, setTypedIssues] = useState<IssueTypeRow[]>([]);
  const [showOfficialRules, setShowOfficialRules] = useState(false);

  const category =
    REPORT_CATEGORIES.find((c) => c.id === categoryId) ??
    REPORT_CATEGORIES.find((c) => c.id === "fire_safety")!;

  const isFire = category.id === "fire_safety";
  const isBuilding = category.id === "building";
  const isConstruction = category.id === "construction";
  const isElectricity = category.id === "electricity";
  const isWaterDrainage = category.id === "water_drainage";
  const isWasteGarbage = category.id === "waste_garbage";
  const isRoadsPublic = category.id === "roads_public";
  const isEnvironment = category.id === "environment";
  const isAnimals = category.id === "animals";
  const usesTypedIssues =
    isBuilding ||
    isConstruction ||
    isElectricity ||
    isWaterDrainage ||
    isWasteGarbage ||
    isRoadsPublic ||
    isEnvironment ||
    isAnimals;
  const usesGroupedIssues =
    isBuilding ||
    isConstruction ||
    isWaterDrainage ||
    isWasteGarbage ||
    isRoadsPublic ||
    isEnvironment ||
    isAnimals;
  const fallbackTypes = isAnimals
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
  const knowledgeCards = isAnimals
    ? ANIMALS_CITIZEN_TIPS.map((t) => ({
        id: t.id,
        title: t.title,
        body: t.plain,
        sourceLabel: t.whereLabel,
        sourceUrl: t.whereUrl,
      }))
    : isEnvironment
    ? ENVIRONMENT_KNOWLEDGE_CARDS
    : isRoadsPublic
      ? ROADS_PUBLIC_SPACES_KNOWLEDGE_CARDS
      : isWasteGarbage
        ? WASTE_GARBAGE_KNOWLEDGE_CARDS
        : isWaterDrainage
          ? WATER_DRAINAGE_KNOWLEDGE_CARDS
          : isElectricity
            ? ELECTRICITY_KNOWLEDGE_CARDS
            : isConstruction
              ? CONSTRUCTION_KNOWLEDGE_CARDS
              : BUILDING_KNOWLEDGE_CARDS;
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
  ]);

  const includes: readonly string[] = usesTypedIssues
    ? isAnimals
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
  const rules =
    (categoryId && CATEGORY_RULES[categoryId]) || CATEGORY_RULES.fire_safety!;
  const Icon = category.Icon;
  const selectedTyped = usesTypedIssues
    ? usesGroupedIssues
      ? (() => {
          const g = isBuilding
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
            {location}
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
        <Text style={styles.sub}>
          Pick the closest match. Short tips below explain what it means - open
          a tip only if you want more.
        </Text>

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
            onPress={() => navigation.goBack()}
          >
            <Pencil size={13} color={colors.linkBlue} strokeWidth={2.2} />
            <Text style={styles.changeText}>Change</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What does this include?</Text>
          <Text style={styles.cardSub}>Tap one that matches what you saw.</Text>

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
                          ? (isBuilding
                              ? buildingGroupForIssueSlug(issueTypeSlug)
                                  ?.label
                              : isConstruction
                                ? constructionGroupForIssueSlug(issueTypeSlug)
                                    ?.label
                                : isAnimals
                                  ? animalsGroupForIssueSlug(issueTypeSlug)
                                      ?.label
                                  : isEnvironment
                                  ? environmentGroupForIssueSlug(issueTypeSlug)
                                      ?.label
                                  : isRoadsPublic
                                    ? roadsGroupForIssueSlug(issueTypeSlug)
                                        ?.label
                                    : isWasteGarbage
                                      ? wasteGroupForIssueSlug(issueTypeSlug)
                                          ?.label
                                      : waterGroupForIssueSlug(issueTypeSlug)
                                          ?.label) === item
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
            <Text style={styles.cardTitle}>Know before you report</Text>
            <Text style={styles.cardSub}>
              Tap a line to read. Websites open only if you ask.
            </Text>
            <CitizenTipList tips={citizenTips} previewCount={4} />
          </View>
        ) : usesTypedIssues ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick facts</Text>
            <Text style={styles.cardSub}>Tap only if you want detail.</Text>
            {knowledgeCards.slice(0, 3).map((card) => (
              <Pressable
                key={card.id}
                style={styles.ruleRow}
                onPress={() => void Linking.openURL(card.sourceUrl)}
              >
                <View style={styles.ruleIcon}>
                  <FileText
                    size={18}
                    color={colors.primaryBlue}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ruleTitle}>{card.title}</Text>
                </View>
                <ChevronRight size={18} color={colors.linkBlue} />
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <Pressable
            style={styles.ruleHead}
            onPress={() => setShowOfficialRules((v) => !v)}
          >
            <Text style={styles.cardTitle}>Official page (optional)</Text>
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
            <>
              <Text style={styles.cardSub}>
                For people who want the original rulebook - not required to
                continue.
              </Text>
              <Pressable
                style={styles.ruleRow}
                onPress={() => void Linking.openURL(rules.knowMoreUrl)}
              >
                <View style={styles.ruleIcon}>
                  <FileText
                    size={18}
                    color={colors.primaryBlue}
                    strokeWidth={2.2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ruleTitle}>{rules.title}</Text>
                  <Text style={styles.ruleBody}>{rules.body}</Text>
                </View>
                <ChevronRight size={18} color={colors.linkBlue} />
              </Pressable>
            </>
          ) : null}
        </View>

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
        <Pressable
          onPress={() =>
            navigation.navigate("ContributeTip", {
              categorySlug: categoryId ?? "building",
            })
          }
          style={styles.contribLink}
        >
          <Text style={styles.contribLinkText}>
            Know a better tip for this issue? Contribute →
          </Text>
        </Pressable>
        <View style={styles.refRow}>
          <Info size={13} color={colors.linkBlue} strokeWidth={2.2} />
          <Text style={styles.refText}>This information is for your reference.</Text>
        </View>
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
