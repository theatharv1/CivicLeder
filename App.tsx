import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, View } from "react-native";
import {
  NavigationContainer,
  type NavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { I18nProvider } from "./src/Context/I18nContext";
import { LocationProvider } from "./src/Context/LocationContext";
import { ProfileProvider, useProfile } from "./src/Context/ProfileContext";
import { ReportDraftProvider } from "./src/Context/ReportDraftContext";
import {
  hasCompletedOnboarding,
  hasEntryChoice,
  markEntryChoice,
  markOnboardingDone,
} from "./src/lib/onboarding";
import { cleanupLegacySafeWalk } from "./src/lib/legacySafeWalkCleanup";
import MainTabsScreen from "./src/navigation/MainTabsScreen";
import type { RootStackParamList } from "./src/navigation/types";
import AboutScreen from "./src/screens/AboutScreen";
import AuthScreen from "./src/screens/AuthScreen";
import EditProfileScreen from "./src/screens/EditProfileScreen";
import HelpSupportScreen from "./src/screens/HelpSupportScreen";
import LanguageScreen from "./src/screens/LanguageScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import WelcomeChoiceScreen from "./src/screens/WelcomeChoiceScreen";
import ReportStep1Screen from "./src/screens/report/ReportStep1Screen";
import ReportStep2Screen from "./src/screens/report/ReportStep2Screen";
import ReportStep3Screen from "./src/screens/report/ReportStep3Screen";
import ReportStep4Screen from "./src/screens/report/ReportStep4Screen";
import ReportStep5Screen from "./src/screens/report/ReportStep5Screen";
import ReportStep6Screen from "./src/screens/report/ReportStep6Screen";
import ReportStep7Screen from "./src/screens/report/ReportStep7Screen";
import IssueRecoveryScreen from "./src/screens/IssueRecoveryScreen";
import ContributeTipScreen from "./src/screens/ContributeTipScreen";
import PostPublicAlertScreen from "./src/screens/PostPublicAlertScreen";
import MyCasesStackScreen from "./src/screens/MyCasesStackScreen";
import EssentialNumbersScreen from "./src/screens/EssentialNumbersScreen";
import { colors } from "./src/theme/tokens";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const LOGO = require("./assets/images/civicleader-logo.png");

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator({
  pendingAuth,
}: {
  pendingAuth: "create" | "signin" | null;
}) {
  const navRef =
    useRef<NavigationContainerRef<RootStackParamList>>(null);
  const opened = useRef(false);

  useEffect(() => {
    if (!pendingAuth || opened.current) return;
    const t = setTimeout(() => {
      navRef.current?.navigate("Auth", { mode: pendingAuth });
      opened.current = true;
    }, 80);
    return () => clearTimeout(t);
  }, [pendingAuth]);

  return (
    <NavigationContainer ref={navRef}>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabsScreen} />
        <Stack.Screen name="ReportStep1" component={ReportStep1Screen} />
        <Stack.Screen name="ReportStep2" component={ReportStep2Screen} />
        <Stack.Screen name="ReportStep3" component={ReportStep3Screen} />
        <Stack.Screen name="ReportStep4" component={ReportStep4Screen} />
        <Stack.Screen name="ReportStep5" component={ReportStep5Screen} />
        <Stack.Screen name="ReportStep6" component={ReportStep6Screen} />
        <Stack.Screen name="ReportStep7" component={ReportStep7Screen} />
        <Stack.Screen name="IssueRecovery" component={IssueRecoveryScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Language" component={LanguageScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="ContributeTip" component={ContributeTipScreen} />
        <Stack.Screen name="PostPublicAlert" component={PostPublicAlertScreen} />
        <Stack.Screen name="MyCases" component={MyCasesStackScreen} />
        <Stack.Screen
          name="EssentialNumbers"
          component={EssentialNumbersScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

type Gate = "loading" | "onboarding" | "welcome" | "app";

function AppGate() {
  const { ready: profileReady, loggedIn } = useProfile();
  const [gate, setGate] = useState<Gate>("loading");
  const [pendingAuth, setPendingAuth] = useState<"create" | "signin" | null>(
    null
  );

  useEffect(() => {
    if (!profileReady) return;
    let alive = true;
    void (async () => {
      try {
        const [ob, entry] = await Promise.all([
          hasCompletedOnboarding(),
          hasEntryChoice(),
        ]);
        if (!alive) return;
        if (!ob) {
          setGate("onboarding");
          return;
        }
        if (!entry && !loggedIn) {
          setGate("welcome");
          return;
        }
        setGate("app");
      } catch {
        if (alive) setGate("onboarding");
      }
    })();
    return () => {
      alive = false;
    };
  }, [profileReady, loggedIn]);

  // SafeWalk was removed: stop any background tracking left by an older build.
  useEffect(() => {
    const t = setTimeout(() => {
      void cleanupLegacySafeWalk();
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (gate === "loading") return;
    void SplashScreen.hideAsync().catch(() => undefined);
  }, [gate]);

  // Hard escape: never leave users on the native splash forever.
  useEffect(() => {
    const t = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => undefined);
      setGate((g) => (g === "loading" ? "onboarding" : g));
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  if (gate === "loading") {
    return (
      <View style={styles.boot}>
        <Image source={LOGO} style={styles.bootLogo} resizeMode="contain" />
        <ActivityIndicator
          color={colors.primaryBlue}
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  if (gate === "onboarding") {
    return (
      <>
        <StatusBar style="dark" />
        <OnboardingScreen
          onDone={() => {
            void markOnboardingDone();
            setGate("welcome");
          }}
        />
      </>
    );
  }

  if (gate === "welcome") {
    return (
      <>
        <StatusBar style="dark" />
        <WelcomeChoiceScreen
          onGuest={() => {
            void markEntryChoice("guest");
            setPendingAuth(null);
            setGate("app");
          }}
          onCreate={() => {
            void markEntryChoice("profile");
            setPendingAuth("create");
            setGate("app");
          }}
          onSignIn={() => {
            void markEntryChoice("profile");
            setPendingAuth("signin");
            setGate("app");
          }}
        />
      </>
    );
  }

  return <AppNavigator pendingAuth={pendingAuth} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <LocationProvider>
          <ProfileProvider>
            <ReportDraftProvider>
              <AppGate />
            </ReportDraftProvider>
          </ProfileProvider>
        </LocationProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

const styles = {
  boot: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.white,
    paddingHorizontal: 28,
  },
  bootLogo: {
    width: "78%" as const,
    maxWidth: 320,
    aspectRatio: 1,
  },
};
