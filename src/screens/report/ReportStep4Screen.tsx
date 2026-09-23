import React, { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Crosshair,
  Image as ImageIcon,
  Info,
  MapPin,
  Video,
  X,
} from "lucide-react-native";
import LocationPickerModal from "../../components/LocationPickerModal";
import StepProgress from "../../components/StepProgress";
import { useAppLocation } from "../../Context/LocationContext";
import { useReportDraft } from "../../Context/ReportDraftContext";
import { reportPhase } from "../../lib/reportPhase";
import {
  pickFromGallery,
  recordVideo,
  takePhoto,
  uploadEvidenceToStorage,
} from "../../lib/reportEvidence";
import type { RootStackParamList } from "../../navigation/types";
import { colors, radii, space } from "../../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "ReportStep4">;

export default function ReportStep4Screen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { location, setLocation } = useAppLocation();
  const {
    evidence,
    addEvidence,
    removeEvidence,
    locationDraft,
    setLocationDraft,
    draftKey,
    categoryId,
  } = useReportDraft();
  const [locationOpen, setLocationOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const locationOnPhoto = locationDraft.addLocationOnPhoto;
  const isBuilding = categoryId === "building";
  const isConstruction = categoryId === "construction";
  const isElectricity = categoryId === "electricity";
  const isWaterDrainage = categoryId === "water_drainage";
  const isWasteGarbage = categoryId === "waste_garbage";
  const isRoadsPublic = categoryId === "roads_public";
  const isEnvironment = categoryId === "environment";
  const showSiteSafetyNote =
    isBuilding ||
    isConstruction ||
    isElectricity ||
    isWaterDrainage ||
    isWasteGarbage ||
    isRoadsPublic ||
    isEnvironment;

  const addAndMaybeUpload = async (
    getter: () => Promise<
      Awaited<ReturnType<typeof pickFromGallery>>
    >
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      const item = await getter();
      if (!item) return;
      const path = await uploadEvidenceToStorage(item, draftKey);
      addEvidence(path ? { ...item, storagePath: path } : item);
    } finally {
      setBusy(false);
    }
  };

  const onGallery = () =>
    void addAndMaybeUpload(() => pickFromGallery(evidence, locationOnPhoto));
  const onTakePhoto = () =>
    void addAndMaybeUpload(() => takePhoto(evidence, locationOnPhoto));
  const onRecord = () =>
    void addAndMaybeUpload(() => recordVideo(evidence, locationOnPhoto));

  const onToggleLocationOnPhoto = () => {
    const next = !locationDraft.addLocationOnPhoto;
    setLocationDraft({ addLocationOnPhoto: next });
    Alert.alert(
      "Location on photo",
      next
        ? "We'll try to save location with your photos when available."
        : "Location will not be attached to new photos."
    );
  };

  const goNext = () => navigation.navigate("ReportStep5");
  /** Skip photos only - still go to place (do not jump to contact). */
  const skipPhotos = () => navigation.navigate("ReportStep5");
  const phase = reportPhase(4);

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

        <Text style={styles.heading}>Photos (optional)</Text>
        <Text style={styles.sub}>
          You can skip this. Photos help you explain the problem later on the
          official website - we do not send them to the government.
        </Text>

        <View style={styles.infoBanner}>
          <Camera size={18} color={colors.primaryBlue} strokeWidth={2.2} />
          <Text style={styles.infoBannerText}>
            You can add up to 5 photos or 1 video (max 30 seconds). Make sure
            the issue is clearly visible.
          </Text>
        </View>

        {showSiteSafetyNote ? (
          <View style={[styles.infoBanner, { backgroundColor: "#FDECEC" }]}>
            <Info size={18} color={colors.emergency} strokeWidth={2.2} />
            <Text style={styles.infoBannerText}>
              {isRoadsPublic
                ? "Do not stand in traffic or approach open manholes to take photographs. Evidence is optional - you can continue without photos."
                : isWasteGarbage
                ? "Do not approach fire, hazardous or biomedical waste to take photographs. Evidence is optional - you can continue without photos."
                : isWaterDrainage
                ? "Do not enter floodwater or approach open manholes to take photographs. Evidence is optional - you can continue without photos."
                : isElectricity
                  ? "Do not approach live wires or sparking equipment to take photographs. Evidence is optional - you can continue without photos."
                  : isConstruction
                    ? "Do not enter a construction site to take photographs. Evidence is optional - you can continue without photos."
                    : "Do not enter an unsafe building to take photographs. Evidence is optional - you can continue without photos."}
            </Text>
          </View>
        ) : null}

        <Pressable style={styles.uploadBox} onPress={onGallery}>
          <View style={styles.uploadIconWrap}>
            <Camera size={28} color={colors.primaryBlue} strokeWidth={2} />
            <View style={styles.plusBadge}>
              <Text style={styles.plusText}>+</Text>
            </View>
          </View>
          <Text style={styles.uploadTitle}>Tap to add photos or videos</Text>
        </Pressable>

        {evidence.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.previewRow}
            contentContainerStyle={{ gap: 10 }}
          >
            {evidence.map((item) => (
              <View key={item.id} style={styles.previewCard}>
                {item.mediaType === "photo" ? (
                  <Image
                    source={{ uri: item.localUri }}
                    style={styles.previewImage}
                  />
                ) : (
                  <View style={[styles.previewImage, styles.videoPreview]}>
                    <Video size={22} color={colors.primaryBlue} />
                    <Text style={styles.videoLabel}>Video</Text>
                  </View>
                )}
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => removeEvidence(item.id)}
                >
                  <X size={12} color={colors.white} strokeWidth={3} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.actionGrid}>
          <Pressable style={styles.actionCell} onPress={onGallery}>
            <ImageIcon size={22} color={colors.primaryBlue} strokeWidth={2} />
            <Text style={styles.actionLabel}>Choose from Gallery</Text>
          </Pressable>
          <Pressable style={styles.actionCell} onPress={onTakePhoto}>
            <Camera size={22} color={colors.primaryBlue} strokeWidth={2} />
            <Text style={styles.actionLabel}>Take Photo</Text>
          </Pressable>
          <Pressable style={styles.actionCell} onPress={onRecord}>
            <Video size={22} color={colors.primaryBlue} strokeWidth={2} />
            <Text style={styles.actionLabel}>Record Video</Text>
          </Pressable>
          <Pressable style={styles.actionCell} onPress={onToggleLocationOnPhoto}>
            <Crosshair size={22} color={colors.primaryBlue} strokeWidth={2} />
            <Text style={styles.actionLabel}>Add Location on Photo</Text>
            <Text style={styles.actionHint}>
              {locationOnPhoto ? "On" : "Off"}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.tipsTitle}>Tips for good photos</Text>
        <View style={styles.tipsBox}>
          {[
            "Show the full scene, not just a close-up.",
            "Try to include nearby landmarks or building names.",
            "Make sure the image is clear and well-lit.",
            "Avoid blurred or dark photos.",
          ].map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <CheckCircle2
                size={16}
                color={colors.statusGreenFg}
                strokeWidth={2.2}
              />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={styles.skipNote}>
          <Info size={16} color="#C47B0A" strokeWidth={2.2} />
          <Text style={styles.skipNoteText}>
            Don’t worry if you can’t add a photo now. You can still continue
            and add photos later.
          </Text>
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}
      >
        <Pressable style={styles.continue} onPress={goNext}>
          <Text style={styles.continueText}>Next: place (optional) →</Text>
        </Pressable>
        <Pressable onPress={skipPhotos} style={styles.skipLink}>
          <Text style={styles.skipLinkText}>Skip photos - next: place</Text>
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
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.lg,
    padding: 12,
    marginBottom: 14,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.navy,
    fontWeight: "600",
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#A8C4F0",
    borderRadius: radii.lg,
    backgroundColor: "#F3F8FF",
    paddingVertical: 36,
    alignItems: "center",
    gap: 10,
  },
  uploadIconWrap: { position: "relative" },
  plusBadge: {
    position: "absolute",
    right: -6,
    bottom: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  plusText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  uploadTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primaryBlue,
  },
  previewRow: { marginTop: 12 },
  previewCard: { width: 84, height: 84, borderRadius: 12, overflow: "hidden" },
  previewImage: { width: 84, height: 84, backgroundColor: colors.lightBlue },
  videoPreview: { alignItems: "center", justifyContent: "center", gap: 4 },
  videoLabel: { fontSize: 11, fontWeight: "700", color: colors.navy },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionCell: {
    width: "47.5%",
    backgroundColor: "#F5F7FA",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 8,
    minHeight: 96,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.navy,
    textAlign: "center",
  },
  actionHint: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.muted,
  },
  tipsTitle: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
    marginBottom: 10,
  },
  tipsBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 14,
    gap: 10,
    backgroundColor: colors.white,
  },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  skipNote: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFF8E6",
    borderRadius: radii.lg,
    padding: 12,
  },
  skipNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedDark,
    fontWeight: "600",
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
