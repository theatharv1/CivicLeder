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
import { ArrowLeft } from "lucide-react-native";
import { useProfile } from "../Context/ProfileContext";
import { APP_NAME } from "../lib/brand";
import { deleteAllLocalUserData } from "../lib/userData";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

const LOGO = require("../../assets/images/civicleader-logo.png");

type Props = NativeStackScreenProps<RootStackParamList, "About">;

export default function AboutScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { resetToGuest } = useProfile();
  const [deleting, setDeleting] = useState(false);

  const onDeleteData = () => {
    Alert.alert(
      "Delete my data on this phone?",
      "This removes your local alerts, tips, case notes, votes, device id, and any username profile saved here. It does not change anything at government offices. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeleting(true);
              try {
                await deleteAllLocalUserData();
                resetToGuest();
                Alert.alert(
                  "Data deleted",
                  "This phone is clear. You are back as a guest."
                );
              } catch {
                Alert.alert(
                  "Could not delete",
                  "Try again. If it keeps failing, reinstall the app."
                );
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
        <Text style={styles.title}>About {APP_NAME}</Text>

        <Text style={styles.body}>
          {APP_NAME} is a citizen guide for Delhi. Spot a civic problem - unsafe
          building, fire risk, water, roads, pollution - and the app helps you
          understand it and find the right official office. You open their page
          or call them yourself.
        </Text>

        <Text style={styles.section}>What it does</Text>
        <Text style={styles.body}>
          • Explains the problem in plain words{"\n"}
          • Checks if anyone may be in danger{"\n"}
          • Suggests the most likely office{"\n"}
          • Shows how to contact them - call or official page{"\n"}
          • Lets you keep personal notes, including their reference if they gave
          you one
        </Text>

        <Text style={styles.section}>What it does not do</Text>
        <Text style={styles.body}>
          • It is not a government department{"\n"}
          • It does not file complaints for you{"\n"}
          • It does not create government complaint numbers{"\n"}
          • It does not replace MCD311, Green Delhi, DJB 1916, or other official
          apps
        </Text>

        <Text style={styles.section}>In short</Text>
        <Text style={styles.body}>
          Official apps like MCD311 are the counter. {APP_NAME} is the guide
          that points you there and keeps your own notes - not an official
          receipt.
        </Text>

        <Text style={styles.section}>Community tips</Text>
        <Text style={styles.body}>
          Neighbours can share short tips and optional .gov.in links. Others
          can mark “Seen this too” or “Not accurate”. Tips are never treated as
          government law. Call and Open buttons always use verified contacts.
          You cannot validate your own tip. Tips are anonymous.
        </Text>

        <Text style={styles.section}>Public alerts</Text>
        <Text style={styles.body}>
          Anyone can post an anonymous photo of a danger they see (crack,
          pothole, open drain). Others can tap “I see this too”. No names are
          shown - even if you have a profile.
        </Text>

        <Text style={styles.section}>Your data on this phone</Text>
        <Text style={styles.body}>
          Alerts, tips, case notes, and an optional username profile stay on
          this device. You can delete all of that anytime.
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

        <Text style={styles.meta}>Version 1.0.0</Text>
        <Text style={styles.meta}>
          Contact numbers and websites are checked against official government
          sources. If something cannot be verified, we do not invent it.
        </Text>
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
    width: 160,
    height: 160,
    alignSelf: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.navy,
    textAlign: "center",
  },
  section: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
  },
  body: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: colors.mutedDark,
  },
  deleteBtn: {
    marginTop: 16,
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
    lineHeight: 19,
  },
});
