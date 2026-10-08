import React, { useState } from "react";
import {
  ActivityIndicator,
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
  ArrowLeft,
  Bookmark,
  FileText,
  Phone,
  Shield,
} from "lucide-react-native";
import { useProfile } from "../Context/ProfileContext";
import { APP_NAME } from "../lib/brand";
import { deleteAllLocalUserData } from "../lib/userData";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

const LOGO = require("../../assets/images/icon.png");

type Props = NativeStackScreenProps<RootStackParamList, "About">;

const POINTS = [
  {
    Icon: FileText,
    title: "Guide",
    body: "Find the right office for a civic problem.",
  },
  {
    Icon: Phone,
    title: "You file",
    body: "Call or open their site yourself. We don’t file.",
  },
  {
    Icon: Bookmark,
    title: "My Cases",
    body: "Save tracking IDs and websites (profile needed).",
  },
  {
    Icon: Shield,
    title: "Public alerts",
    body: "See and confirm problems near you. Profile needed to post.",
  },
] as const;

export default function AboutScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { resetToGuest } = useProfile();
  const [deleting, setDeleting] = useState(false);

  const onDeleteData = () => {
    Alert.alert(
      "Delete my data on this phone?",
      "Removes local alerts, tips, cases, and profile on this device. Not government data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeleting(true);
              try {
                await deleteAllLocalUserData();
                resetToGuest();
                Alert.alert("Done", "This phone is clear. You’re a guest again.");
              } catch {
                Alert.alert("Could not delete", "Try again or reinstall.");
              } finally {
                setDeleting(false);
              }
            })();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: space.screen,
          paddingBottom: 40,
        }}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={22} color={colors.navy} />
        </Pressable>

        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.tagline}>
          Delhi citizen guide. Not a complaint portal.
        </Text>

        {POINTS.map((p) => (
          <View key={p.title} style={styles.row}>
            <View style={styles.iconWrap}>
              <p.Icon size={20} color={colors.primaryBlue} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{p.title}</Text>
              <Text style={styles.rowBody}>{p.body}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.guestNote}>
          Guests: explore, guide, view alerts. Profile (mobile + address): My
          Cases and posting alerts. Posts are always anonymous.
        </Text>

        <Pressable
          style={[styles.deleteBtn, deleting && { opacity: 0.7 }]}
          disabled={deleting}
          onPress={onDeleteData}
        >
          {deleting ? (
            <ActivityIndicator color={colors.logoutFg} />
          ) : (
            <Text style={styles.deleteText}>Delete my data</Text>
          )}
        </Pressable>

        <Text style={styles.meta}>Version 1.1.1</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logo: {
    width: 96,
    height: 96,
    alignSelf: "center",
    marginBottom: 10,
    borderRadius: 22,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.navy,
    textAlign: "center",
  },
  tagline: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedDark,
    textAlign: "center",
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.lg,
    padding: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.navy,
  },
  rowBody: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  guestNote: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  deleteBtn: {
    marginTop: 20,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.logoutFg,
    backgroundColor: colors.logoutBg,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  deleteText: {
    color: colors.logoutFg,
    fontSize: 15,
    fontWeight: "800",
  },
  meta: {
    marginTop: 16,
    fontSize: 13,
    color: colors.muted,
    fontWeight: "600",
    textAlign: "center",
  },
});
