import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { I18nProvider } from "./src/Context/I18nContext";
import { LocationProvider } from "./src/Context/LocationContext";
import { ProfileProvider } from "./src/Context/ProfileContext";
import { ReportDraftProvider } from "./src/Context/ReportDraftContext";
import MainTabsScreen from "./src/navigation/MainTabsScreen";
import type { RootStackParamList } from "./src/navigation/types";
import AboutScreen from "./src/screens/AboutScreen";
import AllIssuesScreen from "./src/screens/AllIssuesScreen";
import AuthScreen from "./src/screens/AuthScreen";
import CaseDetailsScreen from "./src/screens/CaseDetailsScreen";
import EditProfileScreen from "./src/screens/EditProfileScreen";
import HelpSupportScreen from "./src/screens/HelpSupportScreen";
import LanguageScreen from "./src/screens/LanguageScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
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

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <LocationProvider>
          <ProfileProvider>
            <ReportDraftProvider>
              <NavigationContainer>
                <StatusBar style="dark" />
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="Main" component={MainTabsScreen} />
                  <Stack.Screen
                    name="ReportStep1"
                    component={ReportStep1Screen}
                  />
                  <Stack.Screen
                    name="ReportStep2"
                    component={ReportStep2Screen}
                  />
                  <Stack.Screen
                    name="ReportStep3"
                    component={ReportStep3Screen}
                  />
                  <Stack.Screen
                    name="ReportStep4"
                    component={ReportStep4Screen}
                  />
                  <Stack.Screen
                    name="ReportStep5"
                    component={ReportStep5Screen}
                  />
                  <Stack.Screen
                    name="ReportStep6"
                    component={ReportStep6Screen}
                  />
                  <Stack.Screen
                    name="ReportStep7"
                    component={ReportStep7Screen}
                  />
                  <Stack.Screen
                    name="IssueRecovery"
                    component={IssueRecoveryScreen}
                  />
                  <Stack.Screen
                    name="CaseDetails"
                    component={CaseDetailsScreen}
                  />
                  <Stack.Screen name="AllIssues" component={AllIssuesScreen} />
                  <Stack.Screen name="Settings" component={SettingsScreen} />
                  <Stack.Screen
                    name="EditProfile"
                    component={EditProfileScreen}
                  />
                  <Stack.Screen name="Auth" component={AuthScreen} />
                  <Stack.Screen
                    name="Notifications"
                    component={NotificationsScreen}
                  />
                  <Stack.Screen name="Language" component={LanguageScreen} />
                  <Stack.Screen
                    name="HelpSupport"
                    component={HelpSupportScreen}
                  />
                  <Stack.Screen name="About" component={AboutScreen} />
                  <Stack.Screen
                    name="ContributeTip"
                    component={ContributeTipScreen}
                  />
                  <Stack.Screen
                    name="PostPublicAlert"
                    component={PostPublicAlertScreen}
                  />
                </Stack.Navigator>
              </NavigationContainer>
            </ReportDraftProvider>
          </ProfileProvider>
        </LocationProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
