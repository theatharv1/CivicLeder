import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ChevronDown, ChevronLeft, MapPin } from "lucide-react-native";
import LocationPickerModal from "../../components/LocationPickerModal";
import ReportCategoryCard from "../../components/ReportCategoryCard";
import { useAppLocation } from "../../Context/LocationContext";
import { useReportDraft } from "../../Context/ReportDraftContext";
import {
  REPORT_CATEGORIES,
  type ReportCategoryId,
} from "../../data/reportCategories";
import type { RootStackParamList } from "../../navigation/types";
import { colors, radii, space } from "../../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "ReportStep1">;

/** Category picker. Outside the numbered report phases. */
export default function ReportStep1Screen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { location, setLocation, locationLabel } = useAppLocation();
  const { categoryId, setCategoryId } = useReportDraft();
  const [locationOpen, setLocationOpen] = useState(false);

  // Only apply an incoming category from navigation. Never wipe a tap to null.
  useEffect(() => {
    const fromRoute = route.params?.category;
    if (fromRoute) {
      setCategoryId(fromRoute);
    }
  }, [route.params?.category, setCategoryId]);

  const grid = REPORT_CATEGORIES.filter((c) => !c.fullWidth);
  const somethingElse = REPORT_CATEGORIES.find((c) => c.fullWidth)!;

  const goWithCategory = (id: ReportCategoryId) => {
    setCategoryId(id);
    if (id === "something_else") {
      navigation.navigate("IssueRecovery");
      return;
    }
    navigation.navigate("ReportStep2", { category: id });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          style={styles.back}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <ChevronLeft size={22} color={colors.linkBlue} strokeWidth={2.4} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Report a Concern</Text>
          <Text style={styles.headerStep}>Choose a category</Text>
        </View>

        <Pressable
          style={styles.locationPill}
          onPress={() => setLocationOpen(true)}
        >
          <MapPin size={13} color={colors.primaryBlue} strokeWidth={2.4} />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationLabel}
          </Text>
          <ChevronDown size={13} color={colors.primaryBlue} strokeWidth={2.4} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.screen,
          paddingBottom: 24 + Math.max(insets.bottom, 8) + 24,
        }}
      >
        <Text style={styles.heading}>What happened?</Text>
        <Text style={styles.sub}>Tap a category to continue.</Text>

        <View style={styles.grid}>
          {grid.map((category) => (
            <ReportCategoryCard
              key={category.id}
              category={category}
              selected={categoryId === category.id}
              onPress={() => goWithCategory(category.id)}
            />
          ))}
        </View>

        <View style={{ marginTop: 12 }}>
          <ReportCategoryCard
            category={somethingElse}
            selected={categoryId === somethingElse.id}
            onPress={() => goWithCategory(somethingElse.id)}
          />
        </View>
      </ScrollView>

      <LocationPickerModal
        visible={locationOpen}
        current={location}
        onClose={() => setLocationOpen(false)}
        onSelect={setLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: space.screen,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 72,
    marginTop: 6,
    marginLeft: -4,
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.linkBlue,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingTop: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
    textAlign: "center",
  },
  headerStep: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.locationPill,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.pill,
    maxWidth: 108,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.navy,
    maxWidth: 58,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.navy,
    letterSpacing: -0.3,
  },
  sub: {
    marginTop: 8,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
});
