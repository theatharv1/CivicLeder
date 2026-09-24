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
  Bell,
  ChevronRight,
  CircleHelp,
  FileText,
  Info,
  Languages,
  LogOut,
  Settings,
  User,
} from "lucide-react-native";
import { useI18n } from "../Context/I18nContext";
import { useProfile } from "../Context/ProfileContext";
import { APP_NAME } from "../lib/brand";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { t, lang } = useI18n();
  const { profile, loggedIn, logOut, isGuest } = useProfile();

  const onLogout = () => {
    Alert.alert(`Switch to guest?`, `You will stay signed out of ${APP_NAME} until you sign in again. Your account stays on this phone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Use as guest",
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
      title: t.myReports,
      sub: t.myReportsSub,
      Icon: FileText,
      onPress: () => navigation.navigate("Main", { screen: "cases" }),
    },
    {
      key: "notifications",
      title: t.notifications,
      sub: t.notificationsSub,
      Icon: Bell,
      onPress: () => navigation.navigate("Notifications"),
    },
    {
      key: "language",
      title: t.language,
      sub: lang === "hi" ? "हिन्दी" : "English",
      Icon: Languages,
      onPress: () => navigation.navigate("Language"),
    },
    {
      key: "help",
      title: t.help,
      sub: t.helpSub,
      Icon: CircleHelp,
      onPress: () => navigation.navigate("HelpSupport"),
    },
    {
      key: "about",
      title: t.about,
      sub: "Version 1.0.0",
      Icon: Info,
      onPress: () => navigation.navigate("About"),
    },
  ] as const;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: 32,
          paddingHorizontal: space.screen,
        }}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t.profile}</Text>
            <Text style={styles.sub}>
              {isGuest
                ? "Continue as a guest, or create a profile when you want."
                : t.profileSub}
            </Text>
          </View>
          <Pressable
            style={styles.settingsBtn}
            onPress={() => navigation.navigate("Settings")}
          >
            <Settings size={20} color={colors.navy} strokeWidth={2.2} />
          </Pressable>
        </View>

        {loggedIn && profile ? (
          <Pressable
            style={({ pressed }) => [styles.userCard, pressed && { opacity: 0.92 }]}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>
                {profile.displayName.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{profile.displayName}</Text>
              <Text style={styles.email}>@{profile.username}</Text>
              <Text style={styles.loc}>Public posts stay anonymous</Text>
            </View>
            <ChevronRight size={20} color={colors.muted} />
          </Pressable>
        ) : (
          <View style={styles.userCard}>
            <View style={styles.avatarFallback}>
              <User size={22} color={colors.primaryBlue} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>Guest</Text>
              <Text style={styles.email}>
                No account yet. You can use the app fully as a guest.
              </Text>
              <Text style={styles.loc}>Public posts are always anonymous</Text>
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
            <Text style={styles.guestHint}>
              Username and password stay on this phone. Posting publicly never
              shows your name.
            </Text>
          </View>
        ) : null}

        <View style={styles.menu}>
          {rows.map((row, index) => (
            <Pressable
              key={row.key}
              style={({ pressed }) => [
                styles.menuRow,
                index < rows.length - 1 && styles.menuDivider,
                pressed && { opacity: 0.85 },
              ]}
              onPress={row.onPress}
            >
              <View style={styles.menuIcon}>
                <row.Icon size={18} color={colors.primaryBlue} strokeWidth={2.2} />
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
            onPress={onLogout}
          >
            <LogOut size={18} color={colors.logoutFg} strokeWidth={2.2} />
            <Text style={styles.logoutText}>Use as guest</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.navy,
  },
  sub: {
    marginTop: 4,
    fontSize: 13,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  userCard: {
    marginTop: 20,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.navy,
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
  },
  email: {
    marginTop: 2,
    fontSize: 13,
    color: colors.mutedDark,
  },
  loc: {
    marginTop: 2,
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
  guestActions: {
    marginTop: 14,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: colors.primaryBlue,
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
    backgroundColor: colors.white,
  },
  secondaryBtnText: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: "800",
  },
  guestHint: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    textAlign: "center",
  },
  menu: {
    marginTop: 18,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.navy,
  },
  menuSub: {
    marginTop: 2,
    fontSize: 12,
    color: colors.muted,
  },
  logout: {
    marginTop: 22,
    backgroundColor: colors.logoutBg,
    borderRadius: radii.lg,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    color: colors.logoutFg,
    fontSize: 16,
    fontWeight: "800",
  },
});
