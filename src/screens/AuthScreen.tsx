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
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  const isCreate = mode === "create";

  const onSubmit = async () => {
    setBusy(true);
    const result = isCreate
      ? await createProfile(username, password, displayName)
      : await logInWithPassword(username, password);
    setBusy(false);
    if (!result.ok) {
      Alert.alert("Could not continue", result.error);
      return;
    }
    Alert.alert(
      isCreate ? "Profile created" : "Signed in",
      "Public posts stay anonymous. Your username is never shown on alerts or tips.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
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
        <Text style={styles.lead}>
          {isCreate
            ? "Optional. Use a username and password saved on this phone. You can keep using the app as a guest."
            : "Sign in with the username and password you created on this phone."}
        </Text>
        <Text style={styles.anonNote}>
          Public alerts and tips are always anonymous. Signing in does not put
          your name on posts.
        </Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="e.g. delhiwalker"
          placeholderTextColor={colors.muted}
        />

        {isCreate ? (
          <>
            <Text style={styles.label}>Display name (optional)</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Only shown to you in Profile"
              placeholderTextColor={colors.muted}
            />
          </>
        ) : null}

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
            {isCreate
              ? "Already have a profile? Sign in"
              : "Need a profile? Create one"}
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
  },
  lead: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedDark,
  },
  anonNote: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: colors.primaryBlue,
    fontWeight: "600",
  },
  label: {
    marginTop: 16,
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
    color: colors.primaryBlue,
    fontWeight: "700",
    fontSize: 14,
  },
});
