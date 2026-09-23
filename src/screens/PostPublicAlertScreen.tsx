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
import * as Location from "expo-location";
import { ArrowLeft, Camera, Image as ImageIcon, MapPin } from "lucide-react-native";
import { useAppLocation } from "../Context/LocationContext";
import { pickFromGallery, takePhoto } from "../lib/reportEvidence";
import {
  postPublicAlert,
  validatePublicAlertInput,
} from "../lib/publicAlerts";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "PostPublicAlert">;

export default function PostPublicAlertScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { location } = useAppLocation();
  const [placeName, setPlaceName] = useState("");
  const [description, setDescription] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locLabel, setLocLabel] = useState<string>("Getting location…");
  const [locReady, setLocReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!alive) return;
        if (status !== "granted") {
          setLocLabel(`Area: ${location} (GPS off - still OK to post)`);
          setLocReady(true);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!alive) return;
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocLabel(
          `${location} · ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        );
        setLocReady(true);
      } catch {
        if (!alive) return;
        setLocLabel(`Area: ${location}`);
        setLocReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [location]);

  const onPick = async (from: "camera" | "library") => {
    const item =
      from === "camera"
        ? await takePhoto([], false)
        : await pickFromGallery([], false);
    if (item?.localUri) setPhotoUri(item.localUri);
  };

  const onSubmit = async () => {
    const err = validatePublicAlertInput({
      placeName,
      description,
      photoUri,
      latitude,
      longitude,
      areaLabel: location,
    });
    if (err) {
      Alert.alert("Almost ready", err);
      return;
    }
    setSaving(true);
    const result = await postPublicAlert({
      placeName,
      description,
      photoUri,
      latitude,
      longitude,
      areaLabel: location,
    });
    setSaving(false);
    if (!result.ok) {
      Alert.alert("Could not post", result.error);
      return;
    }
    Alert.alert(
      "Posted anonymously",
      "Others nearby can verify this. Your name is not shown.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

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
        <Text style={styles.lead}>
          Seen a crack, pothole or danger? Post a photo and place. No name - 
          anonymous. Neighbours can tap “I see this too”.
        </Text>

        <Text style={styles.label}>Photo</Text>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <View style={styles.photoEmpty}>
            <Text style={styles.photoEmptyText}>One clear photo</Text>
          </View>
        )}
        <View style={styles.photoRow}>
          <Pressable style={styles.photoBtn} onPress={() => void onPick("camera")}>
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

        <Text style={styles.label}>Place / building name</Text>
        <TextInput
          style={styles.input}
          value={placeName}
          onChangeText={setPlaceName}
          placeholder="e.g. PG near Metro Gate 2, Ring Road"
          placeholderTextColor={colors.muted}
          maxLength={80}
        />

        <Text style={styles.label}>What did you see?</Text>
        <TextInput
          style={[styles.input, styles.area]}
          value={description}
          onChangeText={setDescription}
          placeholder="Short and clear - crack on wall, open manhole, etc."
          placeholderTextColor={colors.muted}
          multiline
          maxLength={400}
        />

        <View style={styles.locBox}>
          <MapPin size={16} color={colors.primaryBlue} />
          <Text style={styles.locText}>
            {locReady ? locLabel : "Getting location…"}
          </Text>
        </View>
        <Text style={styles.note}>
          Location is saved with the alert. You stay anonymous.
        </Text>

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
  lead: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedDark,
    marginBottom: 16,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "800",
    color: colors.navy,
  },
  photo: {
    width: "100%",
    height: 180,
    borderRadius: radii.lg,
    backgroundColor: colors.canvas,
  },
  photoEmpty: {
    width: "100%",
    height: 140,
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
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.lg,
    padding: 12,
  },
  locText: { flex: 1, fontSize: 13, color: colors.navy, fontWeight: "600" },
  note: {
    marginTop: 8,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
  },
  submit: {
    marginTop: 20,
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitText: { color: colors.white, fontSize: 16, fontWeight: "800" },
});
