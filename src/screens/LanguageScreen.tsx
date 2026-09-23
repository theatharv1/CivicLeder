import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, Check } from "lucide-react-native";
import { useI18n, type Lang } from "../Context/I18nContext";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "Language">;

const OPTIONS: { id: Lang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi (हिन्दी)" },
];

export default function LanguageScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { lang, setLang } = useI18n();

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: space.screen,
        }}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.title}>Language</Text>
        {OPTIONS.map((opt) => {
          const selected = lang === opt.id;
          return (
            <Pressable
              key={opt.id}
              style={[styles.row, selected && styles.rowSelected]}
              onPress={() => setLang(opt.id)}
            >
              <Text style={[styles.rowText, selected && styles.rowTextSelected]}>
                {opt.label}
              </Text>
              {selected ? (
                <Check size={18} color={colors.primaryBlue} strokeWidth={2.4} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
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
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: 10,
  },
  rowSelected: {
    backgroundColor: colors.lightBlue,
    borderColor: colors.primaryBlue,
  },
  rowText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.navy,
  },
  rowTextSelected: {
    color: colors.primaryBlue,
  },
});
