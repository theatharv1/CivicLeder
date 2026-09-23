import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

const ITEMS = [
  {
    title: "Garbage Overflow update",
    body: "Your report is marked In Progress by the local office.",
    time: "2h ago",
  },
  {
    title: "Street light complaint",
    body: "Action in progress near Vishwavidyalaya Metro Gate.",
    time: "1d ago",
  },
];

export default function NotificationsScreen({ navigation }: Props) {
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
        <Text style={styles.title}>Notifications</Text>
        {ITEMS.map((item) => (
          <View key={item.title} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
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
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.lightBlue,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
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
  time: {
    marginTop: 8,
    fontSize: 11,
    color: colors.muted,
    fontWeight: "600",
  },
});
