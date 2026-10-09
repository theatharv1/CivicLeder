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
  const { profile, loggedIn, updateProfile } = useProfile();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");

  if (!loggedIn || !profile) {
    return (
      <View
        style={[
          styles.root,
          {
            paddingTop: insets.top + 8,
            paddingHorizontal: space.screen,
          },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.title}>No profile</Text>
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

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="username"
          placeholderTextColor={colors.muted}
        />
        <Text style={styles.hint}>
          For this phone only. Public alerts never show it.
        </Text>

        <Text style={styles.label}>Mobile</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="10-digit mobile"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, styles.area]}
          value={address}
          onChangeText={setAddress}
          placeholder="Area / locality"
          placeholderTextColor={colors.muted}
          multiline
        />

        <Pressable
          style={styles.save}
          onPress={() => {
            void (async () => {
              const result = await updateProfile({
                username,
                phone,
                address,
              });
              if (!result.ok) {
                Alert.alert("Could not save", result.error);
                return;
              }
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
  label: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "700",
    color: colors.mutedDark,
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    color: colors.mutedDark,
    fontWeight: "500",
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
  area: {
    minHeight: 72,
    textAlignVertical: "top",
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
