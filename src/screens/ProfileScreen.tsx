import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CircleHelp,
  FileText,
  Info,
  LogOut,
  Pencil,
  Phone,
  UserRound,
} from "lucide-react-native";
import { useProfile } from "../Context/ProfileContext";
import { requireAccount } from "../lib/requireAccount";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen({
  onBackHome,
}: {
  onBackHome?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { profile, loggedIn, logOut, isGuest } = useProfile();

  const onSignOut = () => {
    Alert.alert("Sign out?", "You can sign in again anytime on this phone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void logOut();
        },
      },
    ]);
  };

  const rows = [
    {
      key: "reports",
      title: "My Cases",
      sub: "Tracking IDs",
      Icon: FileText,
      tint: colors.primaryBlue,
      onPress: () => {
        if (
          !requireAccount(navigation, "Profile needed for My Cases.", loggedIn)
        )
          return;
        navigation.navigate("MyCases");
      },
    },
    {
      key: "numbers",
      title: "Essential numbers",
      sub: "Helplines",
      Icon: Phone,
      tint: colors.statusGreenFg,
      onPress: () => navigation.navigate("EssentialNumbers"),
    },
    {
      key: "notifications",
      title: "Notifications",
      sub: "Case reminders",
      Icon: Bell,
      tint: "#7C3AED",
      onPress: () => {
        if (
          !requireAccount(
            navigation,
            "Profile needed for notifications.",
            loggedIn
          )
        )
          return;
        navigation.navigate("Notifications");
      },
    },
    {
      key: "help",
      title: "Help",
      sub: "FAQs",
      Icon: CircleHelp,
      tint: colors.water,
      onPress: () => navigation.navigate("HelpSupport"),
    },
    {
      key: "about",
      title: "About",
      sub: "v1.1.1",
      Icon: Info,
      tint: colors.navy,
      onPress: () => navigation.navigate("About"),
    },
  ] as const;

  const initial =
    loggedIn && profile ? profile.username.slice(0, 1).toUpperCase() : "?";

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: 36,
          paddingHorizontal: space.screen,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          {onBackHome ? (
            <Pressable
              style={styles.back}
              onPress={onBackHome}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ArrowLeft size={22} color={colors.navy} strokeWidth={2.2} />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Text style={styles.title}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {loggedIn && profile ? (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && { opacity: 0.94 },
            ]}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.username}>@{profile.username}</Text>
              <Text style={styles.hint}>Edit profile</Text>
            </View>
            <View style={styles.editChip}>
              <Pencil size={14} color={colors.primaryBlue} strokeWidth={2.3} />
            </View>
          </Pressable>
        ) : (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <UserRound size={24} color={colors.primaryBlue} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.username}>Guest</Text>
              <Text style={styles.hint}>Create a profile to save cases</Text>
            </View>
          </View>
        )}

        {isGuest ? (
          <View style={styles.guestActions}>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => navigation.navigate("Auth", { mode: "create" })}
            >
              <Text style={styles.primaryBtnText}>Create profile</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate("Auth", { mode: "signin" })}
            >
              <Text style={styles.secondaryBtnText}>Sign in</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.menu}>
          {rows.map((row, index) => (
            <Pressable
              key={row.key}
              style={({ pressed }) => [
                styles.menuRow,
                index < rows.length - 1 && styles.menuDivider,
                pressed && { opacity: 0.88 },
              ]}
              onPress={row.onPress}
            >
              <View
                style={[styles.menuIcon, { backgroundColor: `${row.tint}16` }]}
              >
                <row.Icon size={18} color={row.tint} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuTitle}>{row.title}</Text>
                <Text style={styles.menuSub}>{row.sub}</Text>
              </View>
              <ChevronRight size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>

        {loggedIn ? (
          <Pressable
            style={({ pressed }) => [styles.logout, pressed && { opacity: 0.9 }]}
            onPress={onSignOut}
          >
            <LogOut size={18} color={colors.logoutFg} strokeWidth={2.2} />
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.navy,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.navy,
  },
  username: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.navy,
  },
  hint: {
    marginTop: 3,
    fontSize: 12,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  editChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  guestActions: {
    gap: 10,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryBtn: {
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: "800",
  },
  menu: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.navy,
  },
  menuSub: {
    marginTop: 2,
    fontSize: 12,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  logout: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.logoutBg,
    borderRadius: radii.lg,
    paddingVertical: 14,
  },
  logoutText: {
    color: colors.logoutFg,
    fontSize: 15,
    fontWeight: "800",
  },
});
