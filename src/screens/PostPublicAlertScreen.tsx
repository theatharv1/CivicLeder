import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
} from "lucide-react-native";
import { useAppLocation } from "../Context/LocationContext";
import { useProfile } from "../Context/ProfileContext";
import { captureGpsDetailed } from "../lib/captureGps";
import { pickFromGallery, takePhoto } from "../lib/reportEvidence";
import {
  ALERT_TYPES,
  findNearbyDuplicates,
  photoRequiredFor,
  postPublicAlert,
  validatePublicAlertInput,
  voteOnAlert,
  type PublicAlert,
  type PublicAlertType,
} from "../lib/publicAlerts";
import { requireAccount } from "../lib/requireAccount";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "PostPublicAlert">;

export default function PostPublicAlertScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { loggedIn, ready } = useProfile();
  const { location, refreshGps } = useAppLocation();
  const preset = route.params?.presetDescription?.trim() ?? "";
  const [type, setType] = useState<PublicAlertType | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [description, setDescription] = useState(preset);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locLabel, setLocLabel] = useState("Getting current location…");
  const [locReady, setLocReady] = useState(false);
  const [locOk, setLocOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState<PublicAlert | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (
      !requireAccount(
        navigation,
        "Create a profile to post a public alert.",
        loggedIn
      )
    ) {
      navigation.goBack();
    }
  }, [ready, loggedIn, navigation]);

  useEffect(() => {
    if (preset) setDescription(preset);
  }, [preset]);

  const loadGps = async () => {
    setLocReady(false);
    setLocLabel("Getting current location…");
    const result = await captureGpsDetailed({ accuracy: "high" });
    if (!result.ok) {
      setLatitude(null);
      setLongitude(null);
      setLocOk(false);
      setLocLabel(
        result.reason === "permission_denied"
          ? "Allow location access to post with your current place"
          : result.reason === "outside_india"
            ? "GPS must be in India (simulator US location is blocked)"
            : "Could not read GPS. Turn on location and retry"
      );
      setLocReady(true);
      return;
    }
    const gps = result.gps;
    setLatitude(gps.latitude);
    setLongitude(gps.longitude);
    setLocOk(true);
    const place =
      gps.addressText ||
      `${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}`;
    // Only a real address becomes the alert title; coordinates stay in GPS fields.
    setPlaceName(gps.addressText ?? "");
    setLocLabel(
      gps.accuracyMeters != null
        ? `${place} (±${Math.round(gps.accuracyMeters)} m)`
        : place
    );
    setLocReady(true);
    void refreshGps();
  };

  useEffect(() => {
    void loadGps();
  }, []);

  // Same kind of alert already posted right here? Offer to confirm it instead.
  useEffect(() => {
    if (!type || latitude == null || longitude == null) {
      setDuplicate(null);
      return;
    }
    let alive = true;
    void findNearbyDuplicates({ type, latitude, longitude }).then((rows) => {
      if (alive) setDuplicate(rows.find((r) => !r.isMine) ?? null);
    });
    return () => {
      alive = false;
    };
  }, [type, latitude, longitude]);

  const onPick = async (from: "camera" | "library") => {
    const item =
      from === "camera"
        ? await takePhoto([], false)
        : await pickFromGallery([], false);
    if (item?.localUri) setPhotoUri(item.localUri);
  };

  const onConfirmDuplicate = async () => {
    if (!duplicate) return;
    setConfirming(true);
    const r = await voteOnAlert(duplicate.id, "seen");
    setConfirming(false);
    if (!r.ok) {
      Alert.alert("Could not confirm", r.error);
      return;
    }
    Alert.alert(
      "Thanks for confirming",
      r.data.confirmed
        ? "This alert is now confirmed for everyone nearby."
        : "Your confirmation was added.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  const onSubmit = async () => {
    const input = {
      type,
      placeName,
      description,
      photoUri,
      latitude,
      longitude,
      areaLabel: location,
    };
    const err = validatePublicAlertInput(input);
    if (err) {
      Alert.alert("Required", err);
      return;
    }
    setSaving(true);
    const result = await postPublicAlert(input);
    setSaving(false);
    if (!result.ok) {
      Alert.alert("Could not post", result.error);
      return;
    }
    Alert.alert(
      "Posted",
      "Everyone nearby can see it now. Your name is not shown.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  const selected = ALERT_TYPES.find((t) => t.id === type) ?? null;
  const photoNeeded = photoRequiredFor(type);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.headerTitle}>Post a public alert</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.screen,
          paddingBottom: 40 + insets.bottom,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {route.params?.fromReport ? (
          <View style={styles.fromReport}>
            <Text style={styles.fromReportText}>
              After your report note, you can also warn people nearby with a
              photo and your live GPS place.
            </Text>
          </View>
        ) : null}

        <Text style={styles.label}>What is it?</Text>
        <View style={styles.typeWrap}>
          {ALERT_TYPES.map((t) => {
            const on = t.id === type;
            return (
              <Pressable
                key={t.id}
                style={[styles.typeChip, on && styles.typeChipOn]}
                onPress={() => setType(t.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.typeText, on && styles.typeTextOn]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {selected ? <Text style={styles.typeHint}>{selected.hint}</Text> : null}

        <Text style={styles.label}>
          Photo{" "}
          <Text style={styles.labelSoft}>
            {type == null ? "" : photoNeeded ? "(required)" : "(optional)"}
          </Text>
        </Text>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <View style={styles.photoEmpty}>
            <Text style={styles.photoEmptyText}>
              {photoNeeded ? "Add a photo" : "Only if it is safe to take one"}
            </Text>
          </View>
        )}
        <View style={styles.photoRow}>
          <Pressable
            style={styles.photoBtn}
            onPress={() => void onPick("camera")}
          >
            <Camera size={16} color={colors.primaryBlue} />
            <Text style={styles.photoBtnText}>Camera</Text>
          </Pressable>
          <Pressable
            style={styles.photoBtn}
            onPress={() => void onPick("library")}
          >
            <ImageIcon size={16} color={colors.primaryBlue} />
            <Text style={styles.photoBtnText}>Gallery</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Place name</Text>
        <TextInput
          style={styles.input}
          value={placeName}
          onChangeText={setPlaceName}
          placeholder="e.g. Metro gate 3, near the park"
          placeholderTextColor={colors.muted}
          maxLength={80}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.area]}
          value={description}
          onChangeText={setDescription}
          placeholder="What you saw, and exactly where"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={400}
        />

        <Text style={styles.label}>Current location (live GPS)</Text>
        <View style={[styles.locBox, !locOk && locReady && styles.locBoxBad]}>
          <MapPin size={16} color={colors.primaryBlue} />
          <Text style={styles.locText}>
            {locReady ? locLabel : "Getting current location…"}
          </Text>
        </View>
        <Pressable style={styles.retry} onPress={() => void loadGps()}>
          <Text style={styles.retryText}>
            {locOk ? "Refresh location" : "Retry location"}
          </Text>
        </Pressable>

        {duplicate ? (
          <View style={styles.dupBox}>
            <Text style={styles.dupLabel}>Already posted near you</Text>
            <Text style={styles.dupTitle}>
              {duplicate.placeName} ·{" "}
              {duplicate.seenTotal === 1
                ? "seen by 1"
                : `${duplicate.seenTotal} saw it`}
            </Text>
            <Text style={styles.dupDesc} numberOfLines={2}>
              {duplicate.description}
            </Text>
            <Pressable
              style={styles.dupBtn}
              onPress={() => void onConfirmDuplicate()}
              disabled={confirming || duplicate.myVote === "seen"}
            >
              <Text style={styles.dupBtnText}>
                {duplicate.myVote === "seen"
                  ? "You already confirmed this"
                  : confirming
                    ? "Confirming…"
                    : "That's the same, confirm it instead"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.rule}>
          <ShieldCheck size={16} color={colors.statusGreenFg} />
          <Text style={styles.ruleText}>
            Posted as a Neighbour mark. Your username stays private. Describe
            the place only: no faces, names, phones, or hate.
          </Text>
        </View>

        <Pressable
          style={[styles.submit, saving && { opacity: 0.7 }]}
          disabled={saving}
          onPress={() => void onSubmit()}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitText}>Post anonymously</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.screen,
    marginBottom: 8,
  },
  back: { width: 40, paddingVertical: 6 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
    color: colors.navy,
  },
  fromReport: {
    backgroundColor: colors.lightBlue,
    borderRadius: radii.lg,
    padding: 12,
    marginBottom: 8,
  },
  fromReportText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.navy,
    fontWeight: "600",
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "800",
    color: colors.navy,
  },
  labelSoft: { fontWeight: "600", color: colors.mutedDark },
  typeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  typeChipOn: { backgroundColor: colors.primaryBlue, borderColor: colors.primaryBlue },
  typeText: { fontSize: 13, fontWeight: "700", color: colors.navy },
  typeTextOn: { color: colors.white },
  typeHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: colors.mutedDark,
  },
  photo: {
    width: "100%",
    height: 180,
    borderRadius: radii.lg,
    backgroundColor: colors.canvas,
  },
  photoEmpty: {
    width: "100%",
    height: 120,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
  },
  photoEmptyText: { color: colors.muted, fontWeight: "600" },
  photoRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.lg,
    backgroundColor: colors.lightBlue,
  },
  photoBtnText: { fontWeight: "700", color: colors.navy },
  input: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.navy,
    backgroundColor: colors.canvas,
  },
  area: { minHeight: 96, textAlignVertical: "top" },
  locBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.lg,
    padding: 12,
  },
  locBoxBad: {
    backgroundColor: colors.logoutBg,
  },
  locText: { flex: 1, fontSize: 13, color: colors.navy, fontWeight: "600" },
  retry: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  retryText: {
    color: colors.linkBlue,
    fontWeight: "700",
    fontSize: 14,
  },
  dupBox: {
    marginTop: 16,
    backgroundColor: colors.statusYellowBg,
    borderRadius: radii.lg,
    padding: 14,
  },
  dupLabel: { fontSize: 12, fontWeight: "800", color: "#8A5A00" },
  dupTitle: { marginTop: 4, fontSize: 14, fontWeight: "800", color: colors.navy },
  dupDesc: { marginTop: 2, fontSize: 12, lineHeight: 17, color: colors.mutedDark },
  dupBtn: {
    marginTop: 10,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingVertical: 11,
    alignItems: "center",
  },
  dupBtnText: { fontSize: 14, fontWeight: "800", color: colors.primaryBlue },
  rule: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ruleText: { flex: 1, fontSize: 12, lineHeight: 17, color: colors.mutedDark },
  submit: {
    marginTop: 16,
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitText: { color: colors.white, fontSize: 16, fontWeight: "800" },
});
