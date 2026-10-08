import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ChevronDown,
  ChevronLeft,
  Info,
  MapPin,
  Pencil,
} from "lucide-react-native";
import LocationPickerModal from "../../components/LocationPickerModal";
import StepProgress from "../../components/StepProgress";
import { captureGps, isInIndia } from "../../lib/captureGps";
import { resolveIssueLabel } from "../../lib/issueLabel";
import { reportPhase } from "../../lib/reportPhase";
import { useAppLocation } from "../../Context/LocationContext";
import {
  hasIncidentLocation,
  useReportDraft,
} from "../../Context/ReportDraftContext";
import {
  PROPERTY_CONTEXT_OPTIONS,
  authoritySlugForPropertyContext,
  type PropertyContext,
} from "../../data/buildingKnowledge";
import {
  CONSTRUCTION_CONTEXT_OPTIONS,
  authoritySlugForConstructionContext,
  type ConstructionSiteContext,
} from "../../data/constructionKnowledge";
import {
  ELECTRICITY_PROVIDER_OPTIONS,
  authoritySlugForElectricityProvider,
  type ElectricityProviderHint,
} from "../../data/electricityKnowledge";
import {
  WATER_JURISDICTION_OPTIONS,
  authoritySlugForWaterJurisdiction,
  type WaterJurisdictionHint,
} from "../../data/waterDrainageKnowledge";
import {
  WASTE_JURISDICTION_OPTIONS,
  authoritySlugForWasteJurisdiction,
  type WasteJurisdictionHint,
} from "../../data/wasteGarbageKnowledge";
import {
  ROADS_ASSET_OPTIONS,
  ROADS_JURISDICTION_OPTIONS,
  authoritySlugForRoadsJurisdiction,
  type RoadsAssetHint,
  type RoadsJurisdictionHint,
} from "../../data/roadsPublicSpacesKnowledge";
import {
  ENVIRONMENT_JURISDICTION_OPTIONS,
  authoritySlugForEnvironmentJurisdiction,
  type EnvironmentJurisdictionHint,
} from "../../data/environmentKnowledge";
import { REPORT_CATEGORIES } from "../../data/reportCategories";
import type { RoutedAuthority } from "../../data/routingFallback";
import {
  applyPropertyContextHint,
  fetchLikelyAuthorities,
  jurisdictionNeedsConfirmation,
  pickAlternativeAuthorities,
  pickPrimaryAuthority,
} from "../../lib/reportRouting";
import type { RootStackParamList } from "../../navigation/types";
import { colors, radii, space } from "../../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "ReportStep6">;

export default function ReportStep6Screen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { location, setLocation, locationLabel } = useAppLocation();
  const {
    categoryId,
    issueTypeSlug,
    selectedAuthority,
    setSelectedAuthority,
    locationDraft,
    setLocationDraft,
    propertyContext,
    setPropertyContext,
    electricityProviderHint,
    setElectricityProviderHint,
    waterJurisdictionHint,
    setWaterJurisdictionHint,
    wasteJurisdictionHint,
    setWasteJurisdictionHint,
    roadsJurisdictionHint,
    setRoadsJurisdictionHint,
    roadsAssetHint,
    setRoadsAssetHint,
    environmentJurisdictionHint,
    setEnvironmentJurisdictionHint,
  } = useReportDraft();
  const [locationOpen, setLocationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exploreOthers, setExploreOthers] = useState(false);
  const [authorities, setAuthorities] = useState<RoutedAuthority[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    selectedAuthority?.slug ?? null
  );

  const category = REPORT_CATEGORIES.find((c) => c.id === categoryId);
  const isBuilding = categoryId === "building";
  const isConstruction = categoryId === "construction";
  const isElectricity = categoryId === "electricity";
  const isWaterDrainage = categoryId === "water_drainage";
  const isWasteGarbage = categoryId === "waste_garbage";
  const isRoadsPublic = categoryId === "roads_public";
  const isEnvironment = categoryId === "environment";
  const usesContextChips =
    isBuilding ||
    isConstruction ||
    isElectricity ||
    isWaterDrainage ||
    isWasteGarbage ||
    isRoadsPublic ||
    isEnvironment;

  // Silent GPS for notes — reject simulator / non-India locations.
  useEffect(() => {
    void (async () => {
      const gps = await captureGps();
      if (!gps) {
        const lat = locationDraft.latitude;
        const lng = locationDraft.longitude;
        const foreign =
          (lat != null && lng != null && !isInIndia(lat, lng)) ||
          /san francisco|california|united states/i.test(
            locationDraft.addressText ?? ""
          );
        if (foreign) {
          setLocationDraft({
            latitude: null,
            longitude: null,
            addressText: null,
            currentLocation: null,
          });
        }
        return;
      }
      if (
        hasIncidentLocation(locationDraft) &&
        locationDraft.latitude != null &&
        locationDraft.longitude != null &&
        isInIndia(locationDraft.latitude, locationDraft.longitude)
      ) {
        return;
      }
      const now = new Date().toISOString();
      setLocationDraft({
        latitude: gps.latitude,
        longitude: gps.longitude,
        addressText: gps.addressText,
        accuracyMeters: gps.accuracyMeters,
        locationSource: "current_gps",
        locationCapturedAt: now,
        currentLocation: {
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracyMeters: gps.accuracyMeters,
          addressText: gps.addressText,
          capturedAt: now,
        },
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on enter
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const slug = categoryId ?? "fire_safety";
      const list = await fetchLikelyAuthorities(slug);
      if (!alive) return;
      // Electricity: keep needs_service_area candidates (DISCOM confirmation)
      if (isElectricity) {
        const discoms = list.filter((a) =>
          ["brpl", "bypl", "tpddl", "ndmc"].includes(a.slug)
        );
        setAuthorities(discoms.length ? discoms : list);
      } else if (isWaterDrainage) {
        const waterAuths = list.filter((a) =>
          [
            "delhi_jal_board",
            "mcd",
            "ndmc",
            "irrigation_flood_control",
            "pwd_delhi",
            "dda",
            "delhi_cantonment",
          ].includes(a.slug)
        );
        setAuthorities(waterAuths.length ? waterAuths : list);
      } else if (isWasteGarbage) {
        const wasteAuths = list.filter((a) =>
          ["mcd", "ndmc", "delhi_cantonment", "dpcc"].includes(a.slug)
        );
        setAuthorities(wasteAuths.length ? wasteAuths : list);
      } else if (isRoadsPublic) {
        const roadsAuths = list.filter((a) =>
          [
            "mcd",
            "pwd_delhi",
            "ndmc",
            "dda",
            "delhi_traffic_police",
            "delhi_cantonment",
            "irrigation_flood_control",
          ].includes(a.slug)
        );
        setAuthorities(roadsAuths.length ? roadsAuths : list);
      } else if (isEnvironment) {
        const envAuths = list.filter((a) =>
          [
            "ngms_noise",
            "dpcc",
            "delhi_forest",
            "environment_dept_delhi",
            "delhi_traffic_police",
            "mcd",
            "ndmc",
            "dda",
          ].includes(a.slug)
        );
        setAuthorities(envAuths.length ? envAuths : list);
      } else {
        const usable = list.filter(
          (a) => a.routing_mode !== "needs_service_area"
        );
        setAuthorities(usable.length ? usable : list);
        const primary = pickPrimaryAuthority(usable.length ? usable : list);
        if (!selectedSlug && primary) {
          setSelectedSlug(primary.slug);
        }
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [categoryId, isElectricity, isWaterDrainage, isWasteGarbage, isRoadsPublic, isEnvironment]);

  const hintSlug = usesContextChips
    ? isElectricity
      ? authoritySlugForElectricityProvider(electricityProviderHint)
      : isWaterDrainage
        ? authoritySlugForWaterJurisdiction(waterJurisdictionHint)
        : isWasteGarbage
          ? authoritySlugForWasteJurisdiction(wasteJurisdictionHint)
          : isRoadsPublic
            ? authoritySlugForRoadsJurisdiction(roadsJurisdictionHint)
            : isEnvironment
              ? authoritySlugForEnvironmentJurisdiction(
                  environmentJurisdictionHint
                )
            : isConstruction
              ? authoritySlugForConstructionContext(
                  propertyContext as ConstructionSiteContext
                )
              : authoritySlugForPropertyContext(propertyContext)
    : null;

  const contextHint = useMemo(
    () =>
      usesContextChips
        ? applyPropertyContextHint(authorities, hintSlug)
        : null,
    [usesContextChips, authorities, hintSlug]
  );

  const primary = useMemo(() => {
    if (isElectricity || isWaterDrainage || isWasteGarbage || isRoadsPublic || isEnvironment)
      return contextHint?.likely ?? null;
    if (usesContextChips && contextHint?.likely) return contextHint.likely;
    return pickPrimaryAuthority(authorities);
  }, [
    isElectricity,
    isWaterDrainage,
    isWasteGarbage,
    isRoadsPublic,
    isEnvironment,
    usesContextChips,
    contextHint,
    authorities,
  ]);

  /** At most 2 alternatives - never dump a long list of offices. */
  const others = useMemo(() => {
    if (usesContextChips && contextHint) {
      return contextHint.alternatives.slice(0, 2);
    }
    return pickAlternativeAuthorities(authorities, primary, 2);
  }, [usesContextChips, contextHint, authorities, primary]);

  const needsJurisdiction = useMemo(() => {
    if (usesContextChips) return true;
    return jurisdictionNeedsConfirmation(authorities, primary);
  }, [usesContextChips, authorities, primary]);

  /**
   * Extra offices only when user expands “see other offices”.
   * Never dump a full DISCOM / municipal list by default.
   */
  const selectableOthers = useMemo(() => {
    if (!exploreOthers) return [];
    if (primary) return others.slice(0, 2);
    if (usesContextChips) {
      return (contextHint?.alternatives ?? authorities).slice(0, 3);
    }
    return authorities.slice(0, 3);
  }, [
    primary,
    exploreOthers,
    others,
    usesContextChips,
    contextHint,
    authorities,
  ]);

  const issueLabel = resolveIssueLabel(categoryId, issueTypeSlug);
  const CategoryIcon = category?.Icon;

  useEffect(() => {
    if (!usesContextChips || !hintSlug) return;
    setSelectedSlug(hintSlug);
  }, [usesContextChips, hintSlug]);

  const onPropertyChip = (id: NonNullable<PropertyContext>) => {
    setPropertyContext(id);
    const auth = isConstruction
      ? authoritySlugForConstructionContext(id as ConstructionSiteContext)
      : authoritySlugForPropertyContext(id);
    if (auth) setSelectedSlug(auth);
  };

  const onElectricityChip = (id: NonNullable<ElectricityProviderHint>) => {
    setElectricityProviderHint(id);
    const auth = authoritySlugForElectricityProvider(id);
    if (auth) setSelectedSlug(auth);
    else setSelectedSlug(null);
  };

  const onWaterChip = (id: NonNullable<WaterJurisdictionHint>) => {
    setWaterJurisdictionHint(id);
    const auth = authoritySlugForWaterJurisdiction(id);
    if (auth) setSelectedSlug(auth);
    else setSelectedSlug(null);
  };

  const onWasteChip = (id: NonNullable<WasteJurisdictionHint>) => {
    setWasteJurisdictionHint(id);
    const auth = authoritySlugForWasteJurisdiction(id);
    if (auth) setSelectedSlug(auth);
    else setSelectedSlug(null);
  };

  const onRoadsChip = (id: NonNullable<RoadsJurisdictionHint>) => {
    setRoadsJurisdictionHint(id);
    const auth = authoritySlugForRoadsJurisdiction(id);
    if (auth) setSelectedSlug(auth);
    else setSelectedSlug(null);
  };

  const onRoadsAssetChip = (id: NonNullable<RoadsAssetHint>) => {
    setRoadsAssetHint(id);
  };


  const onEnvironmentChip = (id: NonNullable<EnvironmentJurisdictionHint>) => {
    setEnvironmentJurisdictionHint(id);
    const auth = authoritySlugForEnvironmentJurisdiction(id);
    if (auth) setSelectedSlug(auth);
    else setSelectedSlug(null);
  };


  const contextOptions = isElectricity
    ? ELECTRICITY_PROVIDER_OPTIONS
    : isWaterDrainage
      ? WATER_JURISDICTION_OPTIONS
      : isWasteGarbage
        ? WASTE_JURISDICTION_OPTIONS
        : isRoadsPublic
          ? ROADS_JURISDICTION_OPTIONS
          : isEnvironment
            ? ENVIRONMENT_JURISDICTION_OPTIONS
          : isConstruction
            ? CONSTRUCTION_CONTEXT_OPTIONS
            : PROPERTY_CONTEXT_OPTIONS;

  const onContinue = () => {
    const chosen =
      authorities.find((a) => a.slug === selectedSlug) ?? primary ?? null;
    if (chosen) {
      setSelectedAuthority({
        slug: chosen.slug,
        name: chosen.name,
        confidence: chosen.confidence,
        needsConfirmation:
          chosen.confidence !== "likely" ||
          chosen.routing_mode === "needs_confirmation" ||
          chosen.routing_mode === "needs_service_area" ||
          chosen.routing_mode === "conditional" ||
          usesContextChips,
      });
    } else {
      setSelectedAuthority(null);
    }
    navigation.navigate("ReportStep7");
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
          <Text style={styles.headerStep}>{reportPhase(6).headerLine}</Text>
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
          paddingBottom: 24 + Math.max(insets.bottom, 8) + 100,
        }}
      >
        <View style={styles.progressWrap}>
          <StepProgress
            current={reportPhase(6).phase}
            total={reportPhase(6).total}
            label={reportPhase(6).label}
          />
        </View>

        <Text style={styles.heading}>Most likely office</Text>
        <Text style={styles.sub}>
          Suggestion only. You contact them yourself.
        </Text>

        <View style={styles.issueCard}>
          <View style={styles.flameWrap}>
            {CategoryIcon ? (
              <CategoryIcon
                size={20}
                color={category?.iconColor ?? colors.navy}
                strokeWidth={2.2}
              />
            ) : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.issueLabel}>Your Issue</Text>
            <Text style={styles.issueTitle}>
              {category?.title ?? "Concern"}
            </Text>
            <Text style={styles.issueDesc} numberOfLines={2}>
              {issueLabel}
            </Text>
          </View>
          <Pressable
            style={styles.changeBtn}
            onPress={() => navigation.navigate("ReportStep1")}
          >
            <Pencil size={12} color={colors.linkBlue} strokeWidth={2.2} />
            <Text style={styles.changeBtnText}>Change</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator
            color={colors.primaryBlue}
            style={{ marginVertical: 24 }}
          />
        ) : (
          <>
            {needsJurisdiction ? (
              <View style={styles.infoBanner}>
                <Info size={16} color={colors.primaryBlue} />
                <Text style={styles.infoText}>
                  {isElectricity
                    ? "Check your bill for BRPL / BYPL / TPDDL / NDMC. GPS alone is not enough."
                    : isEnvironment
                      ? "Noise → NGMS. Trees/wildlife → Forest. Pollution → Green Delhi / DPCC. Not every case goes to DPCC."
                      : isRoadsPublic
                        ? "Road owner can be MCD, PWD, NDMC, DDA or Traffic Police - a pothole is not always MCD."
                        : isWasteGarbage
                          ? "Municipal waste → MCD / NDMC. Burning / special waste may need DPCC."
                          : isWaterDrainage
                            ? "Supply / sewer → often DJB. Drains / flooding may be MCD or I&FC."
                            : isBuilding || isConstruction
                              ? "Area matters (MCD / NDMC / DDA / Cantonment). GPS alone is not enough."
                              : "Confirm the office from your area or bill when you can."}
                </Text>
              </View>
            ) : null}

            {usesContextChips ? (
              <View style={styles.propertyBlock}>
                <Text style={styles.sectionTitle}>
                  {isElectricity
                    ? "Your electricity company (optional)"
                    : isConstruction
                      ? "Where is the site? (optional)"
                      : isBuilding
                        ? "Where is the property? (optional)"
                        : "Fine-tune if you already know (optional)"}
                </Text>
                <Text style={styles.propertyHint}>
                  {isElectricity
                    ? "Use the name on your bill. Skip if unsure - we still show the most likely option."
                    : "Skip if unsure. We already suggest the most likely office below."}
                </Text>
                <View style={styles.chipRow}>
                  {contextOptions.map((opt) => {
                    const on = isElectricity
                      ? electricityProviderHint === opt.id
                      : isWaterDrainage
                        ? waterJurisdictionHint === opt.id
                        : isWasteGarbage
                          ? wasteJurisdictionHint === opt.id
                          : isRoadsPublic
                            ? roadsJurisdictionHint === opt.id
                            : isEnvironment
                              ? environmentJurisdictionHint === opt.id
                            : propertyContext === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        style={[styles.chip, on && styles.chipOn]}
                        onPress={() => {
                          if (isElectricity) {
                            onElectricityChip(
                              opt.id as NonNullable<ElectricityProviderHint>
                            );
                          } else if (isWaterDrainage) {
                            onWaterChip(
                              opt.id as NonNullable<WaterJurisdictionHint>
                            );
                          } else if (isWasteGarbage) {
                            onWasteChip(
                              opt.id as NonNullable<WasteJurisdictionHint>
                            );
                          } else if (isRoadsPublic) {
                            onRoadsChip(
                              opt.id as NonNullable<RoadsJurisdictionHint>
                            );
                          } else if (isEnvironment) {
                            onEnvironmentChip(
                              opt.id as NonNullable<EnvironmentJurisdictionHint>
                            );
                          } else {
                            onPropertyChip(
                              opt.id as NonNullable<PropertyContext>
                            );
                          }
                        }}
                      >
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {isRoadsPublic ? (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
                      What kind of asset?
                    </Text>
                    <Text style={styles.propertyHint}>
                      Optional - road, footpath, park, bridge or other. Helps
                      describe the issue; does not prove ownership.
                    </Text>
                    <View style={styles.chipRow}>
                      {ROADS_ASSET_OPTIONS.map((opt) => {
                        const on = roadsAssetHint === opt.id;
                        return (
                          <Pressable
                            key={opt.id}
                            style={[styles.chip, on && styles.chipOn]}
                            onPress={() => onRoadsAssetChip(opt.id)}
                          >
                            <Text
                              style={[styles.chipText, on && styles.chipTextOn]}
                            >
                              {opt.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                ) : null}
              </View>
            ) : null}

            {primary ? (
              <>
                <Text style={styles.sectionTitle}>Start here</Text>
                <Pressable
                  style={[
                    styles.authCard,
                    styles.authCardPrimary,
                    selectedSlug === primary.slug && styles.authCardSelected,
                  ]}
                  onPress={() => setSelectedSlug(primary.slug)}
                >
                  <View style={styles.authRow}>
                    <View style={styles.logo}>
                      <Text style={styles.logoText}>
                        {primary.name
                          .split(" ")
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join("")}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.authName}>{primary.name}</Text>
                      <Text style={styles.authDesc}>
                        {primary.short_description ?? primary.notes}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radio,
                        selectedSlug === primary.slug && styles.radioOn,
                      ]}
                    >
                      {selectedSlug === primary.slug ? (
                        <View style={styles.radioDot} />
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.authInfoStrip}>
                    <Info size={14} color={colors.primaryBlue} />
                    <Text style={styles.authInfoText}>
                      Most likely for this issue.
                    </Text>
                  </View>
                </Pressable>
              </>
            ) : !needsJurisdiction ? (
              <View style={styles.infoBanner}>
                <Info size={16} color={colors.primaryBlue} />
                <Text style={styles.infoText}>
                  Pick an office below, or continue for contacts.
                </Text>
              </View>
            ) : (
              <View style={styles.infoBanner}>
                <Info size={16} color={colors.primaryBlue} />
                <Text style={styles.infoText}>
                  {isElectricity
                    ? "Choose your company from the bill above, or open the list of possible companies."
                    : "Confirm the office from your area or bill when you can. Open other offices only if needed."}
                </Text>
              </View>
            )}

            {(primary && others.length > 0) ||
            (!primary &&
              (contextHint?.alternatives?.length || authorities.length) > 0) ? (
              <Pressable
                style={styles.exploreBtn}
                onPress={() => setExploreOthers((v) => !v)}
              >
                <Text style={styles.exploreBtnText}>
                  {exploreOthers
                    ? "Hide other offices"
                    : primary
                      ? "Not this one? See other possible offices"
                      : isElectricity
                        ? "See possible electricity companies"
                        : "See possible offices"}
                </Text>
                <ChevronDown
                  size={16}
                  color={colors.linkBlue}
                  strokeWidth={2.4}
                  style={{
                    transform: [{ rotate: exploreOthers ? "180deg" : "0deg" }],
                  }}
                />
              </Pressable>
            ) : null}

            {selectableOthers.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
                  {primary ? "Other possible offices" : "Possible offices"}
                </Text>
                {selectableOthers.map((a) => (
                  <Pressable
                    key={a.slug}
                    style={[
                      styles.authCard,
                      selectedSlug === a.slug && styles.authCardSelected,
                    ]}
                    onPress={() => setSelectedSlug(a.slug)}
                  >
                    <View style={styles.authRow}>
                      <View style={[styles.logo, styles.logoAlt]}>
                        <Text style={styles.logoText}>
                          {a.name
                            .split(" ")
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join("")}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.authName}>{a.name}</Text>
                        <Text style={styles.authDesc}>
                          {a.short_description ?? a.notes}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radio,
                          selectedSlug === a.slug && styles.radioOn,
                        ]}
                      >
                        {selectedSlug === a.slug ? (
                          <View style={styles.radioDot} />
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                ))}
              </>
            ) : null}
          </>
        )}

        <View style={styles.infoBanner}>
          <Info size={16} color={colors.primaryBlue} />
          <Text style={styles.infoText}>
            Next we show contacts by need - emergency number if danger, or
            complaint / helpline if you want to report. You save a personal
            note in My Cases; that is not a government complaint number.
          </Text>
        </View>

        <Pressable
          style={styles.contribBanner}
          onPress={() =>
            navigation.navigate("ContributeTip", {
              categorySlug: categoryId ?? "building",
            })
          }
        >
          <Text style={styles.contribBannerText}>
            Know a better tip for this issue? Contribute for neighbours to
            check →
          </Text>
        </Pressable>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}
      >
        <Pressable style={styles.continue} onPress={onContinue}>
          <Text style={styles.continueText}>Contact →</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.skipLink}
        >
          <Text style={styles.skipLinkText}>Go Back</Text>
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
  backText: { fontSize: 15, fontWeight: "600", color: colors.linkBlue },
  headerCenter: { flex: 1, alignItems: "center", paddingTop: 2 },
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
  progressWrap: { marginTop: 8, marginBottom: 22 },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.navy,
    letterSpacing: -0.3,
  },
  sub: {
    marginTop: 8,
    marginBottom: 14,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  issueCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 12,
    marginBottom: 18,
    backgroundColor: colors.white,
  },
  flameWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FDECEC",
    alignItems: "center",
    justifyContent: "center",
  },
  issueLabel: { fontSize: 11, color: colors.muted, fontWeight: "600" },
  issueTitle: { fontSize: 15, fontWeight: "800", color: colors.navy },
  issueDesc: {
    marginTop: 2,
    fontSize: 12,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#B7CEF5",
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.linkBlue,
  },
  propertyBlock: { marginBottom: 14 },
  propertyHint: {
    marginTop: -4,
    marginBottom: 10,
    fontSize: 12,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  chipOn: {
    borderColor: colors.primaryBlue,
    backgroundColor: colors.lightBlue,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.navy,
  },
  chipTextOn: { color: colors.primaryBlue },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
    marginBottom: 10,
  },
  authCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    marginBottom: 10,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  authCardPrimary: { backgroundColor: "#F3F8FF", borderColor: "#C5D8F5" },
  authCardSelected: { borderColor: colors.primaryBlue },
  authRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  logoAlt: { backgroundColor: colors.navySoft },
  logoText: { color: colors.white, fontWeight: "800", fontSize: 13 },
  authName: { fontSize: 14, fontWeight: "800", color: colors.navy },
  authDesc: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  likelyLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryBlue,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#C5CDD8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioOn: { borderColor: colors.primaryBlue },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primaryBlue,
  },
  authInfoStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.lightBlue,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  authInfoText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    color: colors.navy,
    fontWeight: "600",
  },
  infoBanner: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.lg,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.navy,
    fontWeight: "500",
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
  continueText: { color: colors.white, fontSize: 16, fontWeight: "800" },
  exploreBtn: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  exploreBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.linkBlue,
  },
  contribBanner: {
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radii.lg,
    backgroundColor: "#F3F8F4",
    borderWidth: 1,
    borderColor: "#D7E8DC",
  },
  contribBannerText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.linkBlue,
    lineHeight: 18,
  },
  skipLink: { paddingVertical: 12, alignItems: "center" },
  skipLinkText: {
    color: colors.linkBlue,
    fontSize: 14,
    fontWeight: "700",
  },
});
