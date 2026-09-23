import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import IssueCard from "../components/IssueCard";
import { ISSUES } from "../data/issues";
import type { RootStackParamList } from "../navigation/types";
import { colors, space } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "AllIssues">;

export default function AllIssuesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
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
        <Text style={styles.title}>All Issues</Text>
        <Text style={styles.sub}>Reported civic issues near you.</Text>
        <View style={{ marginTop: 16 }}>
          {ISSUES.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onPress={() =>
                navigation.navigate("CaseDetails", { issueId: issue.id })
              }
            />
          ))}
        </View>
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
  },
  sub: {
    marginTop: 4,
    fontSize: 13,
    color: colors.mutedDark,
  },
});
