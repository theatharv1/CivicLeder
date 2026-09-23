import React from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import { APP_NAME, APP_SUPPORT_EMAIL } from "../lib/brand";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "HelpSupport">;

const FAQS = [
  {
    q: `Is ${APP_NAME} a government department?`,
    a: `No. ${APP_NAME} is a citizen guide. It helps you understand an issue and open the official channel yourself.`,
  },
  {
    q: "Does this app file my complaint?",
    a: "No. This app does not file for you. You open the official page or call the office yourself.",
  },
  {
    q: "How do I track my complaint?",
    a: "After you file with the authority, save their reference in My Cases. Track it on their site - we do not sync official status.",
  },
  {
    q: `What is a ${APP_NAME} ID?`,
    a: "A personal notebook number for your notes only. It is not a government complaint ID.",
  },
];

export default function HelpSupportScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
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
        <Text style={styles.title}>Help & Support</Text>

        <Text style={styles.section}>FAQs</Text>
        {FAQS.map((item) => (
          <View key={item.q} style={styles.card}>
            <Text style={styles.q}>{item.q}</Text>
            <Text style={styles.a}>{item.a}</Text>
          </View>
        ))}

        <Text style={styles.section}>Contact Support</Text>
        <Pressable
          style={styles.btn}
          onPress={() => {
            void Linking.openURL(`mailto:${APP_SUPPORT_EMAIL}`).catch(() => {
              Alert.alert("Contact", `Email ${APP_SUPPORT_EMAIL}`);
            });
          }}
        >
          <Text style={styles.btnText}>Email {APP_SUPPORT_EMAIL}</Text>
        </Pressable>
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
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.navy,
  },
  section: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: "800",
    color: colors.navy,
  },
  card: {
    backgroundColor: colors.lightBlue,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 10,
  },
  q: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy,
  },
  a: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: colors.mutedDark,
  },
  btn: {
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: {
    color: colors.white,
    fontWeight: "700",
  },
});
