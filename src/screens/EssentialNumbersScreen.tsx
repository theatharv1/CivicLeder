import React, { useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  Phone,
} from "lucide-react-native";
import {
  ESSENTIAL_NUMBERS,
  ESSENTIAL_PORTALS,
  type EssentialNumber,
} from "../data/essentialNumbers";
import { dialNumber } from "../lib/dial";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "EssentialNumbers">;

const GROUP_TITLE: Record<EssentialNumber["group"], string> = {
  emergency: "Emergency",
  safety: "Safety",
  support: "Support and counselling",
  civic: "Civic helplines",
};

export default function EssentialNumbersScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [openSource, setOpenSource] = useState<string | null>(null);

  const groups: EssentialNumber["group"][] = [
    "emergency",
    "safety",
    "support",
    "civic",
  ];

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
        <Text style={styles.title}>Essential numbers</Text>
        <Text style={styles.lead}>
          Official helplines in one place. Tap to call. Sources open only if you
          ask.
        </Text>

        {groups.map((g) => {
          const rows = ESSENTIAL_NUMBERS.filter((n) => n.group === g);
          if (!rows.length) return null;
          return (
            <View key={g} style={styles.section}>
              <Text style={styles.sectionTitle}>{GROUP_TITLE[g]}</Text>
              {rows.map((row) => {
                const expanded = openSource === row.id;
                return (
                  <View key={row.id} style={styles.card}>
                    <Pressable
                      style={styles.row}
                      onPress={() => void dialNumber(row.number, row.title)}
                    >
                      <View style={styles.phoneIcon}>
                        <Phone
                          size={18}
                          color={colors.primaryBlue}
                          strokeWidth={2.2}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.num}>{row.number}</Text>
                        <Text style={styles.rowTitle}>{row.title}</Text>
                        <Text style={styles.when}>{row.when}</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      style={styles.sourceToggle}
                      onPress={() =>
                        setOpenSource(expanded ? null : row.id)
                      }
                    >
                      <Text style={styles.sourceToggleText}>Source</Text>
                      <ChevronDown
                        size={16}
                        color={colors.linkBlue}
                        style={{
                          transform: [{ rotate: expanded ? "180deg" : "0deg" }],
                        }}
                      />
                    </Pressable>
                    {expanded ? (
                      <Pressable
                        style={styles.sourceBody}
                        onPress={() =>
                          void Linking.openURL(row.sourceUrl).catch(() => null)
                        }
                      >
                        <ExternalLink size={14} color={colors.linkBlue} />
                        <Text style={styles.sourceLink}>{row.sourceLabel}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>Official portals</Text>
        {ESSENTIAL_PORTALS.map((p) => (
          <Pressable
            key={p.id}
            style={styles.portal}
            onPress={() => void Linking.openURL(p.url).catch(() => null)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{p.title}</Text>
              <Text style={styles.when}>{p.when}</Text>
              <Text style={styles.sourceLink}>{p.sourceLabel}</Text>
            </View>
            <ExternalLink size={18} color={colors.linkBlue} />
          </Pressable>
        ))}
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
  lead: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  section: { marginBottom: 8 },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "800",
    color: colors.navy,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    marginBottom: 10,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
  },
  phoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  num: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primaryBlue,
  },
  rowTitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy,
  },
  when: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: colors.mutedDark,
  },
  sourceToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  sourceToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.linkBlue,
  },
  sourceBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  sourceLink: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.linkBlue,
    flex: 1,
  },
  portal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.lightBlue,
  },
});
