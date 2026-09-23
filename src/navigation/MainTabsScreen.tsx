import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import BottomNavigation, { type TabKey } from "../components/BottomNavigation";
import HomeScreen from "../screens/HomeScreen";
import ExploreScreen from "../screens/ExploreScreen";
import ProfileScreen from "../screens/ProfileScreen";
import MyCasesScreen from "../screens/MyCasesScreen";
import type { RootStackParamList } from "./types";
import type { ReportCategoryId } from "../data/reportCategories";
import { colors } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "Main">;

export default function MainTabsScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>(route.params?.screen ?? "home");

  useEffect(() => {
    if (route.params?.screen) {
      setTab(route.params.screen);
    }
  }, [route.params?.screen]);

  const openReport = (categoryId?: ReportCategoryId | null) => {
    navigation.navigate({
      name: "ReportStep1",
      params: { category: categoryId ?? null },
      merge: false,
    });
  };

  const openRecovery = () => {
    navigation.navigate("IssueRecovery");
  };

  const onTabChange = (next: TabKey) => {
    if (next === "report") {
      openReport(null);
      return;
    }
    setTab(next);
  };

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        {tab === "home" ? (
          <HomeScreen
            onOpenProfile={() => setTab("profile")}
            onOpenReport={openReport}
            onOpenExplore={() => setTab("explore")}
            onOpenContribute={() =>
              navigation.navigate("ContributeTip", {})
            }
            onOpenRecovery={openRecovery}
            onOpenGlobalSearch={openRecovery}
            onOpenPostAlert={() => navigation.navigate("PostPublicAlert")}
          />
        ) : null}
        {tab === "explore" ? <ExploreScreen /> : null}
        {tab === "cases" ? (
          <MyCasesScreen onOpenReport={() => openReport(null)} />
        ) : null}
        {tab === "profile" ? <ProfileScreen /> : null}
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
