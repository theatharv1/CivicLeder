import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import { Pressable } from "react-native";
import type { RootStackParamList } from "../navigation/types";
import { colors, space } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "Language">;

/** Language picker paused — English only for now. */
export default function LanguageScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Older links may open this screen; bounce back quickly.
    const t = setTimeout(() => navigation.goBack(), 1200);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 8, paddingHorizontal: space.screen },
      ]}
    >
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <ArrowLeft size={22} color={colors.navy} />
      </Pressable>
      <Text style={styles.title}>Language</Text>
      <Text style={styles.body}>English only for now.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.navy,
  },
  body: {
    marginTop: 10,
    fontSize: 15,
    color: colors.mutedDark,
    fontWeight: "500",
  },
});
