import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, MapPin } from "lucide-react-native";
import StatusBadge from "../components/StatusBadge";
import { ISSUES } from "../data/issues";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "CaseDetails">;

export default function CaseDetailsScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const issue = ISSUES.find((i) => i.id === route.params.issueId);

  if (!issue) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.title}>Issue not found</Text>
      </View>
    );
  }

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
        <Text style={styles.kicker}>Case Details</Text>
        <Text style={styles.title}>{issue.title}</Text>
        <View style={{ marginTop: 12 }}>
          <StatusBadge status={issue.status} />
        </View>
        <View style={styles.meta}>
          <MapPin size={16} color={colors.primaryBlue} />
          <Text style={styles.metaText}>{issue.location}</Text>
        </View>
        <Text style={styles.date}>{issue.dateLabel}</Text>
        <Text style={styles.section}>Description</Text>
        <Text style={styles.body}>{issue.description}</Text>
        <Text style={styles.section}>Category</Text>
        <Text style={styles.body}>{issue.category}</Text>
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
  kicker: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  title: {
    marginTop: 4,
    fontSize: 26,
    fontWeight: "800",
    color: colors.navy,
  },
  meta: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: colors.navySoft,
    fontWeight: "600",
  },
  date: {
    marginTop: 6,
    fontSize: 13,
    color: colors.muted,
  },
  section: {
    marginTop: 24,
    fontSize: 14,
    fontWeight: "800",
    color: colors.navy,
  },
  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: colors.mutedDark,
  },
});
