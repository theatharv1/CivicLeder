import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import { useProfile } from "../Context/ProfileContext";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "EditProfile">;

export default function EditProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, loggedIn, setDisplayName } = useProfile();
  const [displayName, setName] = useState(profile?.displayName ?? "");

  if (!loggedIn || !profile) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 8, paddingHorizontal: space.screen }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.title}>No profile yet</Text>
        <Text style={styles.hint}>
          You are browsing as a guest. Create a username and password if you want
          a profile on this phone.
        </Text>
        <Pressable
          style={styles.save}
          onPress={() => navigation.replace("Auth", { mode: "create" })}
        >
          <Text style={styles.saveText}>Create profile</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: space.screen,
          paddingBottom: 40,
        }}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.title}>Edit profile</Text>
        <Text style={styles.hint}>
          This stays on your phone. Public posts never show your username.
        </Text>

        <Text style={styles.label}>Username</Text>
        <Text style={styles.readonly}>@{profile.username}</Text>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setName}
          placeholder="Only visible to you"
          placeholderTextColor={colors.muted}
        />

        <Pressable
          style={styles.save}
          onPress={() => {
            void (async () => {
              await setDisplayName(displayName);
              Alert.alert("Saved", "Profile updated on this phone.");
              navigation.goBack();
            })();
          }}
        >
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
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
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedDark,
    marginBottom: 8,
  },
  label: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "700",
    color: colors.mutedDark,
  },
  readonly: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "700",
    color: colors.navy,
  },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.navy,
  },
  save: {
    marginTop: 28,
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 15,
  },
});
