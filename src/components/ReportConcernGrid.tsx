import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Building2,
  CircleEllipsis,
  Construction,
  Droplets,
  Flame,
  Route,
  Trash2,
  Zap,
} from "lucide-react-native";
import type { ReportCategoryId } from "../data/reportCategories";
import { colors, radii, space } from "../theme/tokens";

/** Home shortcuts → Report category IDs (`null` = open Step 1 with none selected). */
const HOME_REPORT_CATEGORIES: {
  key: string;
  categoryId: ReportCategoryId | null;
  label: string;
  Icon: typeof Building2;
  color: string;
}[] = [
  {
    key: "building",
    categoryId: "building",
    label: "Building",
    Icon: Building2,
    color: colors.building,
  },
  {
    key: "fire_safety",
    categoryId: "fire_safety",
    label: "Fire Safety",
    Icon: Flame,
    color: colors.fire,
  },
  {
    key: "construction",
    categoryId: "construction",
    label: "Construction",
    Icon: Construction,
    color: colors.construction,
  },
  {
    key: "electricity",
    categoryId: "electricity",
    label: "Electricity",
    Icon: Zap,
    color: colors.electricity,
  },
  {
    key: "water_drainage",
    categoryId: "water_drainage",
    label: "Water &\nDrainage",
    Icon: Droplets,
    color: colors.water,
  },
  {
    key: "waste_garbage",
    categoryId: "waste_garbage",
    label: "Waste &\nGarbage",
    Icon: Trash2,
    color: colors.waste,
  },
  {
    key: "roads_public",
    categoryId: "roads_public",
    label: "Roads &\nPublic Spaces",
    Icon: Route,
    color: colors.roads,
  },
  {
    key: "more",
    categoryId: null,
    label: "More",
    Icon: CircleEllipsis,
    color: colors.more,
  },
];

type Props = {
  onSeeAll?: () => void;
  onSelect?: (categoryId: ReportCategoryId | null) => void;
};

export default function ReportConcernGrid({ onSeeAll, onSelect }: Props) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.heading}>Report a Concern</Text>
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={styles.seeAll}>See All →</Text>
        </Pressable>
      </View>
      <View style={styles.grid}>
        {HOME_REPORT_CATEGORIES.map((item) => (
          <Pressable
            key={item.key}
            style={styles.tile}
            onPress={() => onSelect?.(item.categoryId)}
          >
            <item.Icon size={26} color={item.color} strokeWidth={2.1} />
            <Text style={styles.tileLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.navy,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.linkBlue,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  tile: {
    width: "23.5%",
    aspectRatio: 0.95,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: space.sm,
    gap: 8,
    boxShadow: "0px 2px 6px rgba(15, 40, 80, 0.04)",
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.navy,
    textAlign: "center",
    lineHeight: 14,
  },
});
