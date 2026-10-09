import React, { useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  FileText,
  Phone,
  Shield,
  Bookmark,
} from "lucide-react-native";
import { APP_NAME } from "../lib/brand";
import { colors, radii, space } from "../theme/tokens";

const { width } = Dimensions.get("window");

type Props = {
  onDone: () => void;
};

const SLIDES = [
  {
    key: "guide",
    Icon: FileText,
    title: "Your city guide",
    body: "Spot a problem. We help you find the right office.",
    tint: colors.lightBlue,
    iconColor: colors.primaryBlue,
  },
  {
    key: "contact",
    Icon: Phone,
    title: "You contact them",
    body: "Call or open their official page. We never file for you.",
    tint: "#FDECEC",
    iconColor: colors.emergency,
  },
  {
    key: "cases",
    Icon: Bookmark,
    title: "My Cases",
    body: "Save tracking IDs and websites so you don’t forget.",
    tint: colors.statusGreenBg,
    iconColor: colors.statusGreenFg,
  },
  {
    key: "safety",
    Icon: Shield,
    title: "Public alerts",
    body: "See and confirm problems near you. Profile needed to post.",
    tint: colors.statusYellowBg,
    iconColor: colors.statusYellowFg,
  },
] as const;

export default function OnboardingScreen({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const next = () => {
    if (index >= SLIDES.length - 1) {
      onDone();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    setIndex(index + 1);
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={styles.brand}>{APP_NAME}</Text>
        <Pressable onPress={onDone} hitSlop={12}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { backgroundColor: slide.tint }]}>
              <slide.Icon size={48} color={slide.iconColor} strokeWidth={2} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View
            key={s.key}
            style={[styles.dot, i === index && styles.dotOn]}
          />
        ))}
      </View>

      <Pressable style={styles.cta} onPress={next}>
        <Text style={styles.ctaText}>
          {index >= SLIDES.length - 1 ? "Start exploring" : "Next"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.screen,
    marginBottom: 8,
  },
  brand: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.navy,
  },
  skip: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.linkBlue,
  },
  slide: {
    paddingHorizontal: space.screen + 8,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.navy,
    textAlign: "center",
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.mutedDark,
    textAlign: "center",
    fontWeight: "500",
    maxWidth: 300,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotOn: {
    backgroundColor: colors.primaryBlue,
    width: 22,
  },
  cta: {
    marginHorizontal: space.screen,
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
});
