import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  AlertTriangle,
  Cross,
  Phone,
  Shield,
} from "lucide-react-native";
import { dialNumber } from "../lib/dial";
import { colors, radii, space } from "../theme/tokens";

const NUMBERS = [
  {
    n: "112",
    label: "All Emergencies",
    Icon: Phone,
    iconColor: colors.emergency,
  },
  {
    n: "101",
    label: "Fire & Rescue",
    Icon: Shield,
    iconColor: colors.primaryBlue,
  },
  {
    n: "102",
    label: "Ambulance",
    Icon: Cross,
    iconColor: colors.emergency,
  },
] as const;

export default function EmergencyCard() {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <AlertTriangle size={28} color={colors.white} strokeWidth={2.4} />
        <View style={styles.topText}>
          <Text style={styles.title}>Emergency?</Text>
          <Text style={styles.sub}>Immediate help? Call now</Text>
        </View>
      </View>
      <View style={styles.row}>
        {NUMBERS.map((item, index) => (
          <React.Fragment key={item.n}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <Pressable
              style={({ pressed }) => [styles.cell, pressed && { opacity: 0.7 }]}
              onPress={() => {
                void dialNumber(item.n, item.label);
              }}
            >
              <item.Icon size={18} color={item.iconColor} strokeWidth={2.2} />
              <Text style={styles.number}>{item.n}</Text>
              <Text style={styles.cellLabel}>{item.label}</Text>
            </Pressable>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0C7C7",
    backgroundColor: colors.white,
  },
  top: {
    backgroundColor: colors.emergency,
    paddingHorizontal: space.lg,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  topText: {
    flex: 1,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
  },
  sub: {
    marginTop: 2,
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    backgroundColor: colors.white,
    paddingVertical: 12,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  number: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.navy,
  },
  cellLabel: {
    fontSize: 10,
    color: colors.muted,
    textAlign: "center",
    fontWeight: "500",
  },
});
