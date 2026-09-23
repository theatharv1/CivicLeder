import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Check, MapPin, X } from "lucide-react-native";
import { LOCATIONS, type AppLocation } from "../data/issues";
import { colors, radii, space } from "../theme/tokens";

type Props = {
  visible: boolean;
  current: AppLocation;
  onClose: () => void;
  onSelect: (value: AppLocation) => void;
};

export default function LocationPickerModal({
  visible,
  current,
  onClose,
  onSelect,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Select location</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={22} color={colors.mutedDark} />
            </Pressable>
          </View>
          {LOCATIONS.map((item) => {
            const selected = item === current;
            return (
              <Pressable
                key={item}
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <MapPin
                  size={18}
                  color={selected ? colors.primaryBlue : colors.muted}
                />
                <Text style={[styles.rowText, selected && styles.rowTextSelected]}>
                  {item}
                </Text>
                {selected ? (
                  <Check size={18} color={colors.primaryBlue} strokeWidth={2.4} />
                ) : null}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 24, 48, 0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: space.screen,
    paddingBottom: 36,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.navy,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  rowSelected: {
    backgroundColor: colors.lightBlue,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: radii.md,
    borderBottomWidth: 0,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    color: colors.navy,
    fontWeight: "600",
  },
  rowTextSelected: {
    color: colors.primaryBlue,
  },
});
