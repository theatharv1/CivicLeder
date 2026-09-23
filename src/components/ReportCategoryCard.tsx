import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import type { ReportCategory } from "../data/reportCategories";
import { colors, radii } from "../theme/tokens";

type Props = {
  category: ReportCategory;
  selected: boolean;
  onPress: () => void;
};

export default function ReportCategoryCard({
  category,
  selected,
  onPress,
}: Props) {
  const { Icon } = category;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        category.fullWidth && styles.fullWidth,
        selected && styles.cardSelected,
        pressed && { opacity: 0.94 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {selected ? (
        <View style={styles.check}>
          <Check size={12} color={colors.white} strokeWidth={3} />
        </View>
      ) : null}
      <Icon size={28} color={category.iconColor} strokeWidth={2.15} />
      <Text style={styles.title}>{category.title}</Text>
      <Text style={styles.description}>{category.description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48.2%",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 16,
    minHeight: 132,
    boxShadow: "0px 2px 8px rgba(15, 40, 80, 0.05)",
  },
  fullWidth: {
    width: "100%",
    minHeight: 96,
    marginTop: 0,
  },
  cardSelected: {
    backgroundColor: colors.lightBlue,
    borderColor: colors.primaryBlue,
  },
  check: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "800",
    color: colors.navy,
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: colors.mutedDark,
    fontWeight: "500",
  },
});
