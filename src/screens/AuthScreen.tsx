import React, { useState } from "react";
import {
  ActivityIndicator,
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

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

export default function AuthScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const mode = route.params?.mode ?? "create";
  const { createProfile, logInWithPassword } = useProfile();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [login, setLogin] = useState("");
  const [busy, setBusy] = useState(false);

  const isCreate = mode === "create";

  const onSubmit = async () => {
    setBusy(true);
    const result = isCreate
      ? await createProfile({
          username,
          password,
          phone,
          address,
        })
      : await logInWithPassword(login, password);
    setBusy(false);
    if (!result.ok) {
      Alert.alert("Could not continue", result.error);
      return;
    }
    navigation.goBack();
  };

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

        <Text style={styles.title}>
          {isCreate ? "Create profile" : "Sign in"}
        </Text>

        {isCreate ? (
          <>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Choose a username"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Mobile number</Text>
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

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="At least 6 characters"
              placeholderTextColor={colors.muted}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Mobile or username</Text>
            <TextInput
              style={styles.input}
              value={login}
              onChangeText={setLogin}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="default"
              placeholder="Mobile or username"
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Password"
              placeholderTextColor={colors.muted}
            />
          </>
        )}

        <Pressable
          style={[styles.save, busy && { opacity: 0.7 }]}
          disabled={busy}
          onPress={() => void onSubmit()}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveText}>
              {isCreate ? "Create profile" : "Sign in"}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.switch}
          onPress={() =>
            navigation.setParams({ mode: isCreate ? "signin" : "create" })
          }
        >
          <Text style={styles.switchText}>
            {isCreate ? "Sign in instead" : "Create a profile"}
          </Text>
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
    marginTop: 14,
    fontSize: 13,
    fontWeight: "700",
    color: colors.mutedDark,
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
    minHeight: 48,
    justifyContent: "center",
  },
  saveText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 15,
  },
  switch: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 8,
  },
  switchText: {
    color: colors.linkBlue,
    fontWeight: "700",
    fontSize: 14,
  },
});
