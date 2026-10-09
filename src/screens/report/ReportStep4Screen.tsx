import React, { useEffect } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ReportStep4">;

/** Legacy photos step — removed from guide; redirects to office. */
export default function ReportStep4Screen({ navigation }: Props) {
  useEffect(() => {
    navigation.replace("ReportStep6");
  }, [navigation]);
  return null;
}
