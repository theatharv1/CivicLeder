import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Home,
  Search,
  MessageSquareText,
  UserRound,
} from "lucide-react-native";
import { colors } from "../theme/tokens";

export type TabKey = "home" | "report" | "explore" | "profile";

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

const TABS: {
  key: TabKey;
  label: string;
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
}[] = [
  { key: "home", label: "Home", Icon: Home },
  { key: "report", label: "Report", Icon: MessageSquareText },
  { key: "explore", label: "Explore", Icon: Search },
  { key: "profile", label: "Profile", Icon: UserRound },
];

export default function BottomNavigation({ active, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {TABS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        const color = isActive ? colors.primaryBlue : colors.tabInactive;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            {isActive ? <View style={styles.activeLine} /> : <View style={styles.activeLineSpacer} />}
            <Icon size={22} color={color} strokeWidth={isActive ? 2.4 : 1.9} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 4,
  },
  activeLine: {
    width: 22,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.primaryBlue,
    marginBottom: 4,
  },
  activeLineSpacer: {
    width: 22,
    height: 2.5,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
});
