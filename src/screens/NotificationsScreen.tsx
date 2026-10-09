import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import { listLocalCases, type LocalCaseRecord } from "../lib/myCases";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

function categoryLabel(row: LocalCaseRecord): string {
  const cat = row.categorySlug?.replace(/_/g, " ")?.trim();
  return cat && cat.length > 0 ? cat : "Other";
}

export default function NotificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [cases, setCases] = useState<LocalCaseRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      void listLocalCases().then(setCases);
    }, [])
  );

  const withRef = cases.filter((c) => c.officialReference?.trim());
  const withoutRef = cases.filter((c) => !c.officialReference?.trim());

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: space.screen,
          paddingBottom: 40,
        }}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.lead}>
          Your saved complaint references. Add or edit them in My Cases.
        </Text>

        {cases.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No cases yet</Text>
            <Text style={styles.cardBody}>
              When you save a government complaint reference, it shows here.
            </Text>
          </View>
        ) : (
          <>
            {withRef.map((item) => (
              <Pressable
                key={item.caseId}
                style={styles.card}
                onPress={() => navigation.navigate("MyCases")}
              >
                <Text style={styles.badge}>Filed</Text>
                <Text style={styles.cardTitle}>
                  Ref: {item.officialReference}
                </Text>
                <Text style={styles.cardBody}>
                  Category: {categoryLabel(item)}
                  {item.authorityName ? ` · ${item.authorityName}` : ""}
                </Text>
              </Pressable>
            ))}
            {withoutRef.map((item) => (
              <Pressable
                key={item.caseId}
                style={styles.card}
                onPress={() => navigation.navigate("MyCases")}
              >
                <Text style={styles.badgeMuted}>No reference yet</Text>
                <Text style={styles.cardTitle}>{item.caseId}</Text>
                <Text style={styles.cardBody}>
                  Category: {categoryLabel(item)}. Add the government complaint
                  number in My Cases.
                </Text>
              </Pressable>
            ))}
          </>
        )}
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
    marginBottom: 6,
  },
  lead: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedDark,
    marginBottom: 16,
    fontWeight: "500",
  },
  card: {
    backgroundColor: colors.lightBlue,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
  },
  badge: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: "800",
    color: colors.statusGreenFg,
    backgroundColor: colors.statusGreenBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    overflow: "hidden",
    marginBottom: 6,
  },
  badgeMuted: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: "800",
    color: colors.mutedDark,
    backgroundColor: colors.statusMutedBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    overflow: "hidden",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.navy,
  },
  cardBody: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedDark,
  },
});
