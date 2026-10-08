import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import BottomNavigation, { type TabKey } from "../components/BottomNavigation";
import { useProfile } from "../Context/ProfileContext";
import { requireAccount } from "../lib/requireAccount";
import HomeScreen from "../screens/HomeScreen";
import ExploreScreen from "../screens/ExploreScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ReportHubScreen from "../screens/ReportHubScreen";
import type { RootStackParamList } from "./types";
import type { ReportCategoryId } from "../data/reportCategories";
import { colors } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "Main">;

export default function MainTabsScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { loggedIn } = useProfile();
  const [tab, setTab] = useState<TabKey>(route.params?.screen ?? "home");

  useEffect(() => {
    if (route.params?.screen) {
      setTab(route.params.screen);
    }
  }, [route.params?.screen]);

  /** Jump into a category (Home shortcut / hub extra) or open full picker. */
  const openReport = (categoryId?: ReportCategoryId | null) => {
    if (categoryId) {
      navigation.navigate({
        name: "ReportStep2",
        params: { category: categoryId },
        merge: false,
      });
      return;
    }
    navigation.navigate({
      name: "ReportStep1",
      params: { category: null },
      merge: false,
    });
  };

  const openRecovery = () => {
    navigation.navigate("IssueRecovery");
  };

  const openMyCases = () => {
    if (
      !requireAccount(
        navigation,
        "Create a profile to keep tracking IDs in My Cases.",
        loggedIn
      )
    ) {
      return;
    }
    navigation.navigate("MyCases");
  };

  const onTabChange = (next: TabKey) => {
    setTab(next);
  };

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        {tab === "home" ? (
          <HomeScreen
            onOpenNotifications={() => {
              if (
                !requireAccount(
                  navigation,
                  "Create a profile to see saved case notifications.",
                  loggedIn
                )
              ) {
                return;
              }
              navigation.navigate("Notifications");
            }}
            onOpenReport={openReport}
            onOpenExplore={() => setTab("explore")}
            onOpenContribute={() =>
              navigation.navigate("ContributeTip", {})
            }
            onOpenRecovery={openRecovery}
            onOpenGlobalSearch={openRecovery}
            onOpenPostAlert={() => {
              if (
                !requireAccount(
                  navigation,
                  "Create a profile to post a public alert. Posts stay anonymous.",
                  loggedIn
                )
              ) {
                return;
              }
              navigation.navigate("PostPublicAlert");
            }}
            onOpenEssentialNumbers={() =>
              navigation.navigate("EssentialNumbers")
            }
            onOpenMyCases={openMyCases}
          />
        ) : null}
        {tab === "report" ? (
          <ReportHubScreen
            onStartNewReport={() => openReport(null)}
            onOpenMyCases={openMyCases}
            onBackHome={() => setTab("home")}
          />
        ) : null}
        {tab === "explore" ? (
          <ExploreScreen onBackHome={() => setTab("home")} />
        ) : null}
        {tab === "profile" ? (
          <ProfileScreen onBackHome={() => setTab("home")} />
        ) : null}
      </View>
      <View style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
        <BottomNavigation active={tab} onChange={onTabChange} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  body: { flex: 1 },
});
