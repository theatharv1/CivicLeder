import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  Compass,
  Crosshair,
  Info,
  MapPin,
  Pencil,
} from "lucide-react-native";
import LocationPickerModal from "../../components/LocationPickerModal";
import StepProgress from "../../components/StepProgress";
import { useAppLocation } from "../../Context/LocationContext";
import {
  formatIncidentLocationSummary,
  hasIncidentLocation,
  useReportDraft,
  type LocationSource,
} from "../../Context/ReportDraftContext";
import { reportPhase } from "../../lib/reportPhase";
import { api, apiConfigured } from "../../lib/apiClient";
import type { RootStackParamList } from "../../navigation/types";
import { colors, radii, space } from "../../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "ReportStep5">;

type ManualMode = boolean;

export default function ReportStep5Screen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { location, setLocation } = useAppLocation();
  const { locationDraft, setLocationDraft, draftKey, categoryId } = useReportDraft();
  const [locationOpen, setLocationOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [manualMode, setManualMode] = useState<ManualMode>(
    locationDraft.locationSource === "manually_entered"
  );
  const isRoadsPublic = categoryId === "roads_public";
  const isEnvironment = categoryId === "environment";

  const applyAsIncident = (
    patch: {
      latitude: number | null;
      longitude: number | null;
      addressText: string | null;
      accuracyMeters?: number | null;
    },
    source: LocationSource
  ) => {
    const now = new Date().toISOString();
    setLocationDraft({
      latitude: patch.latitude,
      longitude: patch.longitude,
      addressText: patch.addressText,
      accuracyMeters: patch.accuracyMeters ?? null,
      locationSource: source,
      locationCapturedAt: now,
      jurisdictionStatus: "unknown",
    });
  };

  const offerUseAsIncident = (gps: {
    latitude: number;
    longitude: number;
    accuracyMeters: number | null;
    addressText: string | null;
  }) => {
    Alert.alert(
      "Use as incident location?",
      "Your current location was saved separately. The place where the incident happened may be different. Use current location as the incident location?",
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Use as incident",
          onPress: () => {
            applyAsIncident(
              {
                latitude: gps.latitude,
                longitude: gps.longitude,
                addressText: gps.addressText,
                accuracyMeters: gps.accuracyMeters,
              },
              "current_gps"
            );
            setManualMode(true);
          },
        },
      ]
    );
  };

  const captureCurrentGps = async (): Promise<{
    latitude: number;
    longitude: number;
    accuracyMeters: number | null;
    addressText: string | null;
  } | null> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Location permission",
        "Allow location access to use your current position. You can still enter an address manually or skip."
      );
      return null;
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude, accuracy } = pos.coords;
    let addressText: string | null = null;
    try {
      const places = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const p = places[0];
      if (p) {
        addressText = [p.name, p.street, p.district, p.city, p.region]
          .filter(Boolean)
          .join(", ");
      }
    } catch {
      addressText = `Near ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }
    return {
      latitude,
      longitude,
      accuracyMeters: accuracy ?? null,
      addressText:
        addressText ||
        `Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    };
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const gps = await captureCurrentGps();
      if (!gps) return;
      const capturedAt = new Date().toISOString();
      setLocationDraft({
        currentLocation: {
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracyMeters: gps.accuracyMeters,
          addressText: gps.addressText,
          capturedAt,
        },
      });
      offerUseAsIncident(gps);
    } catch {
      Alert.alert(
        "Location unavailable",
        "Could not read GPS. Enter an address manually or skip for now."
      );
    } finally {
      setLocating(false);
    }
  };

  const chooseOnMap = async () => {
    setLocating(true);
    try {
      const gps = await captureCurrentGps();
      if (!gps) return;
      const capturedAt = new Date().toISOString();
      setLocationDraft({
        currentLocation: {
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracyMeters: gps.accuracyMeters,
          addressText: gps.addressText,
          capturedAt,
        },
      });
      applyAsIncident(
        {
          latitude: gps.latitude,
          longitude: gps.longitude,
          addressText: gps.addressText,
          accuracyMeters: gps.accuracyMeters,
        },
        "map_selected"
      );
      setManualMode(true);
      Alert.alert(
        "Pin placed",
        "Pin set from your current GPS. Edit the address fields if the incident was elsewhere."
      );
    } catch {
      Alert.alert(
        "Location unavailable",
        "Could not place a pin. Enter an address manually or skip."
      );
    } finally {
      setLocating(false);
    }
  };

  const persistLocation = async () => {
    if (!apiConfigured) return;

    const rows: Record<string, unknown>[] = [];

    if (locationDraft.currentLocation) {
      rows.push({
        draftKey,
        latitude: locationDraft.currentLocation.latitude,
        longitude: locationDraft.currentLocation.longitude,
        addressText: locationDraft.currentLocation.addressText,
        accuracyMeters: locationDraft.currentLocation.accuracyMeters,
        jurisdictionStatus: "unknown",
        addLocationOnPhoto: locationDraft.addLocationOnPhoto,
        source: "user",
      });
    }

    if (hasIncidentLocation(locationDraft)) {
      rows.push({
        draftKey,
        latitude: locationDraft.latitude,
        longitude: locationDraft.longitude,
        addressText: locationDraft.addressText,
        landmark: locationDraft.landmark || null,
        accuracyMeters: locationDraft.accuracyMeters,
        jurisdictionStatus: locationDraft.jurisdictionStatus,
        addLocationOnPhoto: locationDraft.addLocationOnPhoto,
        source: "user",
      });
    }

    for (const row of rows) {
      await api.createReportLocation(row);
    }
  };

  const goNext = () => {
    void persistLocation();
    navigation.navigate("ReportStep6");
  };
  const phase = reportPhase(5);

  const incidentLabel =
    formatIncidentLocationSummary(locationDraft) ??
    "No incident location yet (optional)";

  const currentLabel = locationDraft.currentLocation
    ? locationDraft.currentLocation.addressText ??
      `${locationDraft.currentLocation.latitude.toFixed(5)}, ${locationDraft.currentLocation.longitude.toFixed(5)}`
    : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={colors.linkBlue} strokeWidth={2.4} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Report a Concern</Text>
          <Text style={styles.headerStep}>{phase.headerLine}</Text>
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
          paddingBottom: 24 + Math.max(insets.bottom, 8) + 100,
        }}
      >
        <View style={styles.progressWrap}>
          <StepProgress
            current={phase.phase}
            total={phase.total}
            label={phase.label}
          />
        </View>

        <Text style={styles.heading}>Where did this happen?</Text>
        <Text style={styles.sub}>
          Optional. Your current GPS and the incident place can be different - 
          you can type an address or skip.
          {isEnvironment
            ? " If it is unsafe to approach the site, stay back and note landmarks from a safe distance."
            : isRoadsPublic
              ? " Do not stand in traffic or approach open manholes. Location is optional."
              : ""}
        </Text>

        <View style={styles.mapArea}>
          <View style={styles.mapGrid}>
            {["Connaught Place", "India Gate", "Lodhi Garden"].map((label) => (
              <Text key={label} style={styles.mapLabel}>
                {label}
              </Text>
            ))}
          </View>
          {locationDraft.latitude != null ||
          locationDraft.currentLocation ? (
            <>
              {locationDraft.currentLocation ? (
                <View style={styles.gpsDot} />
              ) : null}
              {locationDraft.latitude != null ? (
                <View style={styles.pin} />
              ) : null}
            </>
          ) : (
            <Text style={styles.mapHint}>
              Optional - use current location, choose on map, or enter an
              address.
            </Text>
          )}
        </View>

        <View style={styles.optionCol}>
          <Pressable
            style={styles.optionBtn}
            onPress={() => void useCurrentLocation()}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator size="small" color={colors.primaryBlue} />
            ) : (
              <Crosshair size={18} color={colors.primaryBlue} strokeWidth={2.4} />
            )}
            <Text style={styles.optionBtnText}>Use My Current Location</Text>
          </Pressable>
          <Pressable
            style={styles.optionBtn}
            onPress={() => void chooseOnMap()}
            disabled={locating}
          >
            <MapPin size={18} color={colors.primaryBlue} strokeWidth={2.2} />
            <Text style={styles.optionBtnText}>
              {locationDraft.latitude != null
                ? "Edit Map Pin"
                : "Choose on Map"}
            </Text>
          </Pressable>
          <Pressable
            style={styles.optionBtn}
            onPress={() => {
              setManualMode(true);
              if (locationDraft.locationSource === "unknown") {
                setLocationDraft({
                  locationSource: "manually_entered",
                  locationCapturedAt: new Date().toISOString(),
                });
              }
            }}
          >
            <Pencil size={18} color={colors.primaryBlue} strokeWidth={2.2} />
            <Text style={styles.optionBtnText}>Enter Address Manually</Text>
          </Pressable>
        </View>

        {currentLabel ? (
          <View style={styles.selectedCard}>
            <View style={styles.selectedIcon}>
              <Crosshair size={18} color={colors.primaryBlue} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedTitle}>Current location (device)</Text>
              <Text style={styles.selectedAddress} numberOfLines={2}>
                {currentLabel}
              </Text>
              <Text style={styles.jurisdictionNote}>
                Not automatically used as the incident location.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.selectedCard}>
          <View style={styles.selectedIcon}>
            <MapPin size={18} color={colors.primaryBlue} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedTitle}>Incident location</Text>
            <Text style={styles.selectedAddress} numberOfLines={3}>
              {incidentLabel}
            </Text>
            <Text style={styles.jurisdictionNote}>
              Source: {locationDraft.locationSource} · Jurisdiction:{" "}
              {locationDraft.jurisdictionStatus} (not claimed from GPS alone)
            </Text>
          </View>
          <Pressable onPress={() => setManualMode(true)}>
            <Text style={styles.changeLink}>Edit ›</Text>
          </Pressable>
        </View>

        {manualMode ? (
          <>
            <Text style={styles.sectionTitle}>Incident address (optional)</Text>
            <Text style={styles.sectionSub}>
              Fill what you know. Leave blank if unsure.
            </Text>
            {(
              [
                ["addressText", "Address", locationDraft.addressText ?? ""],
                ["building", "Building / flat", locationDraft.building],
                ["street", "Street", locationDraft.street],
                ["landmark", "Landmark", locationDraft.landmark],
                ["locality", "Locality / area", locationDraft.locality],
                ["city", "City", locationDraft.city],
                ["state", "State", locationDraft.state],
                ["postal", "PIN code", locationDraft.postal],
                ["country", "Country", locationDraft.country],
              ] as const
            ).map(([key, placeholder, value]) => (
              <View key={key} style={styles.inputRow}>
                <Building2 size={18} color={colors.muted} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor={colors.muted}
                  value={value}
                  onChangeText={(t) => {
                    setLocationDraft({
                      [key]: t,
                      locationSource:
                        locationDraft.locationSource === "unknown"
                          ? "manually_entered"
                          : locationDraft.locationSource,
                      locationCapturedAt:
                        locationDraft.locationCapturedAt ??
                        new Date().toISOString(),
                    });
                  }}
                />
              </View>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Add more details (optional)</Text>
            <Text style={styles.sectionSub}>
              Landmark helps authorities understand the exact place.
            </Text>
            <View style={styles.inputRow}>
              <Building2 size={18} color={colors.muted} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="Landmark, building name, street or area"
                placeholderTextColor={colors.muted}
                value={locationDraft.landmark}
                onChangeText={(t) =>
                  setLocationDraft({
                    landmark: t,
                    locationSource:
                      locationDraft.locationSource === "unknown"
                        ? "manually_entered"
                        : locationDraft.locationSource,
                    locationCapturedAt:
                      locationDraft.locationCapturedAt ??
                      new Date().toISOString(),
                  })
                }
                multiline
              />
            </View>
          </>
        )}

        <View style={styles.toggleRow}>
          <Compass size={18} color={colors.primaryBlue} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Add location on photo</Text>
            <Text style={styles.toggleSub}>
              We’ll try to save location with new photos when available.
            </Text>
          </View>
          <Switch
            value={locationDraft.addLocationOnPhoto}
            onValueChange={(v) => setLocationDraft({ addLocationOnPhoto: v })}
            trackColor={{ false: "#D0D7E2", true: "#9BB8F5" }}
            thumbColor={
              locationDraft.addLocationOnPhoto
                ? colors.primaryBlue
                : "#F4F4F4"
            }
          />
        </View>

        <View style={styles.infoBanner}>
          <Info size={16} color={colors.primaryBlue} strokeWidth={2.2} />
          <Text style={styles.infoText}>
            Location is optional. You can continue without it. Current GPS is
            never assumed to be the incident place without your confirmation.
          </Text>
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}
      >
        <Pressable style={styles.continue} onPress={goNext}>
          <Text style={styles.continueText}>Next: who can help →</Text>
        </Pressable>
        <Pressable onPress={goNext} style={styles.skipLink}>
          <Text style={styles.skipLinkText}>Skip place - who can help</Text>
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
  mapArea: {
    height: 160,
    borderRadius: radii.lg,
    backgroundColor: "#E8F0E4",
    borderWidth: 1,
    borderColor: "#D0DCC8",
    overflow: "hidden",
    marginBottom: 12,
  },
  mapGrid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    justifyContent: "space-between",
  },
  mapLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7A68",
    opacity: 0.7,
  },
  mapHint: {
    position: "absolute",
    left: 16,
    right: 16,
    top: "42%",
    textAlign: "center",
    fontSize: 12,
    color: colors.mutedDark,
    fontWeight: "600",
  },
  gpsDot: {
    position: "absolute",
    left: "48%",
    top: "48%",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primaryBlue,
    borderWidth: 3,
    borderColor: "rgba(26,109,255,0.25)",
  },
  pin: {
    position: "absolute",
    left: "52%",
    top: "38%",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.emergency,
    borderWidth: 2,
    borderColor: colors.white,
  },
  optionCol: { gap: 8, marginBottom: 14 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F5F7FA",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  optionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy,
  },
  selectedCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: "#C5D8F5",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 12,
    marginBottom: 12,
  },
  selectedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.navy,
  },
  selectedAddress: {
    marginTop: 2,
    fontSize: 13,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  jurisdictionNote: {
    marginTop: 4,
    fontSize: 11,
    color: colors.muted,
    fontWeight: "500",
  },
  changeLink: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.linkBlue,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
  },
  sectionSub: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 13,
    color: colors.mutedDark,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: colors.navy,
    minHeight: 22,
    padding: 0,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    marginBottom: 12,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.navy,
  },
  toggleSub: {
    marginTop: 2,
    fontSize: 12,
    color: colors.mutedDark,
  },
  infoBanner: {
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
  skipLink: { paddingVertical: 12, alignItems: "center" },
  skipLinkText: {
    color: colors.linkBlue,
    fontSize: 14,
    fontWeight: "700",
  },
});
