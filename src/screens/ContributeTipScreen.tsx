import React, { useMemo, useState } from "react";
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
import { REPORT_CATEGORIES } from "../data/reportCategories";
import {
  submitCommunityTip,
  validateTipInput,
} from "../lib/communityTips";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, space } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "ContributeTip">;

const CATEGORY_OPTIONS = REPORT_CATEGORIES.filter(
  (c) => c.id !== "something_else"
);

export default function ContributeTipScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const prefilled = route.params?.categorySlug ?? "building";
  const [categorySlug, setCategorySlug] = useState(
    CATEGORY_OPTIONS.some((c) => c.id === prefilled) ? prefilled : "building"
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [whenToAct, setWhenToAct] = useState("");
  const [channelLabel, setChannelLabel] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [saving, setSaving] = useState(false);

  const previewError = useMemo(
    () =>
      validateTipInput({
        categorySlug,
        title: title || "placeholderxx",
        body: body || "placeholder body text long enough",
        channelUrl,
      }),
    [categorySlug, title, body, channelUrl]
  );

  const onSubmit = async () => {
    const err = validateTipInput({
      categorySlug,
      title,
      body,
      whenToAct,
      channelLabel,
      channelUrl,
    });
    if (err) {
      Alert.alert("Check your tip", err);
      return;
    }
    setSaving(true);
    const result = await submitCommunityTip({
      categorySlug,
      title,
      body,
      whenToAct,
      channelLabel,
      channelUrl,
    });
    setSaving(false);
    if (!result.ok) {
      Alert.alert("Could not save", result.error);
      return;
    }
    Alert.alert(
      "Thanks - neighbours will check this",
      "Not official government information. Call / Open Official still use verified contacts only.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.headerTitle}>Share a tip</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.screen,
          paddingBottom: 40 + insets.bottom,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.lead}>
          One short tip neighbours can check. Not a government warning. Official
          Call buttons stay on verified contacts.
        </Text>

        <Text style={styles.label}>About</Text>
        <View style={styles.chips}>
          {CATEGORY_OPTIONS.map((c) => {
            const on = categorySlug === c.id;
            return (
              <Pressable
                key={c.id}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => setCategorySlug(c.id)}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {c.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Short title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Open drain near school gate"
          placeholderTextColor={colors.muted}
          maxLength={120}
        />

        <Text style={styles.label}>What should people know?</Text>
        <TextInput
          style={[styles.input, styles.area]}
          value={body}
          onChangeText={setBody}
          placeholder="Plain words. Do not claim to issue a government order."
          placeholderTextColor={colors.muted}
          multiline
          maxLength={800}
        />

        <Pressable
          onPress={() => setShowOptional((v) => !v)}
          style={styles.optionalToggle}
        >
          <Text style={styles.optionalToggleText}>
            {showOptional ? "Hide optional details" : "Add optional details"}
          </Text>
        </Pressable>

        {showOptional ? (
          <>
            <Text style={styles.label}>When to act</Text>
            <TextInput
              style={[styles.input, styles.areaShort]}
              value={whenToAct}
              onChangeText={setWhenToAct}
              placeholder="e.g. Call 112 if danger; else report same day"
              placeholderTextColor={colors.muted}
              multiline
              maxLength={300}
            />

            <Text style={styles.label}>Channel name</Text>
            <TextInput
              style={styles.input}
              value={channelLabel}
              onChangeText={setChannelLabel}
              placeholder="e.g. MCD Online"
              placeholderTextColor={colors.muted}
              maxLength={80}
            />

            <Text style={styles.label}>Channel URL (.gov.in only)</Text>
            <TextInput
              style={styles.input}
              value={channelUrl}
              onChangeText={setChannelUrl}
              placeholder="https://….gov.in/…"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              maxLength={300}
            />
          </>
        ) : null}

        <Text style={styles.note}>
          Others must agree before this tip is widely shown.
        </Text>

        <Pressable
          style={[styles.submit, saving && { opacity: 0.7 }]}
          disabled={saving}
          onPress={() => void onSubmit()}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitText}>Submit for neighbour check</Text>
          )}
        </Pressable>
        {title.length >= 8 && body.length >= 20 && previewError ? (
          <Text style={styles.warn}>{previewError}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.screen,
    marginBottom: 8,
  },
  back: { width: 40, paddingVertical: 6 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
    color: colors.navy,
  },
  lead: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedDark,
    marginBottom: 16,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "800",
    color: colors.navy,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipOn: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  chipText: { fontSize: 13, fontWeight: "700", color: colors.navy },
  chipTextOn: { color: colors.white },
  input: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.navy,
    backgroundColor: colors.canvas,
  },
  area: { minHeight: 110, textAlignVertical: "top" },
  areaShort: { minHeight: 72, textAlignVertical: "top" },
  optionalToggle: { marginTop: 16, paddingVertical: 8 },
  optionalToggleText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.linkBlue,
  },
  note: {
    marginTop: 16,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
  },
  submit: {
    marginTop: 18,
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitText: { color: colors.white, fontSize: 16, fontWeight: "800" },
  warn: {
    marginTop: 10,
    fontSize: 13,
    color: colors.emergency,
    textAlign: "center",
  },
});
