import React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import type { RootStackParamList } from "../navigation/types";
import { colors, space } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [alerts, setAlerts] = React.useState(true);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: space.screen,
        }}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Report status alerts</Text>
            <Text style={styles.rowSub}>Local preference only for now</Text>
          </View>
          <Switch
            value={alerts}
            onValueChange={setAlerts}
            trackColor={{ true: colors.primaryBlue, false: colors.border }}
          />
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
    marginBottom: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.navy,
  },
  rowSub: {
    marginTop: 2,
    fontSize: 12,
    color: colors.muted,
  },
});
