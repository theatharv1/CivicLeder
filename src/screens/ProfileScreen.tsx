import React from "react";
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
} from "lucide-react-native";
import { useI18n } from "../Context/I18nContext";
import { useProfile } from "../Context/ProfileContext";
import { APP_NAME } from "../lib/brand";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

const AVATAR = require("../../assets/images/avatar.png");

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { t, lang } = useI18n();
  const { profile, logOut, loggedIn, logIn } = useProfile();

  const onLogout = () => {
    Alert.alert(`Log out of ${APP_NAME}?`, undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          logOut();
          Alert.alert("Logged out", "You can continue browsing as a guest.");
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
            <Text style={styles.sub}>{t.profileSub}</Text>
          </View>
          <Pressable
            style={styles.settingsBtn}
            onPress={() => navigation.navigate("Settings")}
          >
            <Settings size={20} color={colors.navy} strokeWidth={2.2} />
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.userCard, pressed && { opacity: 0.92 }]}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Image source={AVATAR} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            <Text style={styles.loc}>{profile.location}</Text>
          </View>
          <ChevronRight size={20} color={colors.muted} />
        </Pressable>

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
            <Text style={styles.logoutText}>{t.logout}</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.login} onPress={logIn}>
            <Text style={styles.loginText}>Log In</Text>
          </Pressable>
        )}
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
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.lightBlue,
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
  login: {
    marginTop: 22,
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  loginText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
});
