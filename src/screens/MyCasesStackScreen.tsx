import React, { useEffect } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useProfile } from "../Context/ProfileContext";
import { requireAccount } from "../lib/requireAccount";
import type { RootStackParamList } from "../navigation/types";
import MyCasesScreen from "./MyCasesScreen";

type Props = NativeStackScreenProps<RootStackParamList, "MyCases">;

/** Stack entry for My Cases — requires a local profile. */
export default function MyCasesStackScreen({ navigation }: Props) {
  const { loggedIn, ready } = useProfile();

  useEffect(() => {
    if (!ready) return;
    if (
      !requireAccount(
        navigation,
        "Create a profile to save tracking IDs in My Cases.",
        loggedIn
      )
    ) {
      navigation.goBack();
    }
  }, [ready, loggedIn, navigation]);

  if (!loggedIn) return null;

  return (
    <MyCasesScreen
      showBack
      onBack={() => navigation.goBack()}
      onOpenReport={() =>
        navigation.navigate("ReportStep1", { category: null })
      }
    />
  );
}
