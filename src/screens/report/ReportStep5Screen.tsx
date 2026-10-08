import React, { useEffect } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ReportStep5">;

/** Legacy place step — removed from guide; GPS is silent. Redirects to office. */
export default function ReportStep5Screen({ navigation }: Props) {
  useEffect(() => {
    navigation.replace("ReportStep6");
  }, [navigation]);
  return null;
}
