import React, { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronDown, ExternalLink } from "lucide-react-native";
import type { CitizenTip } from "../data/buildingKnowledge";
import { colors, radii } from "../theme/tokens";

type Props = {
  tips: CitizenTip[];
  /** Max tips shown before “Show more tips” */
  previewCount?: number;
};

/**
 * Minimal citizen tips: title only until tapped.
 * Official website opens only from “Where is this written?”.
 */
export default function CitizenTipList({ tips, previewCount = 4 }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? tips : tips.slice(0, previewCount);

  return (
    <View>
      {visible.map((tip) => {
        const open = openId === tip.id;
        return (
          <View key={tip.id} style={styles.row}>
            <Pressable
              style={styles.head}
              onPress={() => setOpenId(open ? null : tip.id)}
            >
              <Text style={styles.title}>{tip.title}</Text>
              <ChevronDown
                size={18}
                color={colors.linkBlue}
                strokeWidth={2.2}
                style={{
                  transform: [{ rotate: open ? "180deg" : "0deg" }],
                }}
              />
            </Pressable>
            {open ? (
              <View style={styles.body}>
                <Text style={styles.plain}>{tip.plain}</Text>
                <Text style={styles.whenLabel}>When to act</Text>
                <Text style={styles.plain}>{tip.whenToAct}</Text>
                <Pressable
                  style={styles.sourceBtn}
                  onPress={() => void Linking.openURL(tip.whereUrl)}
                >
                  <ExternalLink size={14} color={colors.linkBlue} />
                  <Text style={styles.sourceText}>{tip.whereLabel}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
      {tips.length > previewCount ? (
        <Pressable
          style={styles.moreBtn}
          onPress={() => setShowAll((v) => !v)}
        >
          <Text style={styles.moreText}>
            {showAll ? "Show fewer tips" : "Show more tips"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.navy,
    lineHeight: 21,
  },
  body: {
    paddingBottom: 14,
    paddingRight: 4,
  },
  plain: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedDark,
    marginBottom: 10,
  },
  whenLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.navy,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  sourceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    paddingVertical: 6,
  },
  sourceText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.linkBlue,
    lineHeight: 18,
  },
  moreBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  moreText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.linkBlue,
  },
});
