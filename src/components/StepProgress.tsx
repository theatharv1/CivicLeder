import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/tokens";

type Props = {
  /** Simplified phase 1–4 (preferred). */
  current: number;
  total?: number;
  /** Optional short label under the bar */
  label?: string;
};

/** Progress for Report a Concern (4 stages by default). */
export default function StepProgress({
  current,
  total = 6,
  label,
}: Props) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <View>
      <View style={styles.row} accessibilityRole="progressbar">
        {steps.map((step, index) => {
          const active = step === current;
          const completed = step < current;
          const lineActive = step <= current;
          return (
            <React.Fragment key={step}>
              <View
                style={[
                  styles.circle,
                  active && styles.circleActive,
                  completed && styles.circleCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.number,
                    (active || completed) && styles.numberActive,
                  ]}
                >
                  {step}
                </Text>
              </View>
              {index < steps.length - 1 ? (
                <View
                  style={[styles.line, lineActive && styles.lineActive]}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#C5CDD8",
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  circleCompleted: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  number: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9AA3B2",
  },
  numberActive: {
    color: colors.white,
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    backgroundColor: "#E1E6EE",
    borderRadius: 1,
  },
  lineActive: {
    backgroundColor: colors.primaryBlue,
  },
  label: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
});
