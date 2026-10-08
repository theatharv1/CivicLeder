import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  MapPin,
  Phone,
} from "lucide-react-native";
import LocationPickerModal from "../../components/LocationPickerModal";
import StepProgress from "../../components/StepProgress";
import { useAppLocation } from "../../Context/LocationContext";
import { useReportDraft } from "../../Context/ReportDraftContext";
import { reportPhase } from "../../lib/reportPhase";
import { EMERGENCY_EXAMPLES } from "../../data/emergencyFallback";
import type { AssessmentQuestion, EmergencyContact } from "../../data/emergencyFallback";
import { IFC_WATERLOGGING_HELPLINE } from "../../data/waterDrainageKnowledge";
import { DPCC_BURNING_WHATSAPP } from "../../data/wasteGarbageKnowledge";
import {
  FOREST_GREEN_HELPLINE,
  isEnvironmentEmergencyIssue,
  NOISE_HELPLINE,
} from "../../data/environmentKnowledge";
import { dialNumber } from "../../lib/dial";
import { whatsappUrl } from "../../lib/reportRouting";
import {
  evaluateAssessment,
  fetchAssessmentQuestions,
  fetchEmergencyContacts,
  type AssessmentAnswer,
  type EmergencyResult,
} from "../../lib/reportEmergency";
import type { RootStackParamList } from "../../navigation/types";
import { colors, radii, space } from "../../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "ReportStep3">;

type Choice = "yes" | "no" | "not_sure";

const CHOICES: { id: Choice; title: string }[] = [
  { id: "yes", title: "Yes, it's an emergency" },
  { id: "no", title: "No, it's not an emergency" },
  { id: "not_sure", title: "Not sure" },
];

export default function ReportStep3Screen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { location, setLocation } = useAppLocation();
  const {
    categoryId,
    emergencyChoice,
    setEmergencyChoice,
    setEmergencyResult,
  } = useReportDraft();

  const [locationOpen, setLocationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, AssessmentAnswer>>({});
  const [assessed, setAssessed] = useState<EmergencyResult | null>(null);

  const isBuilding = categoryId === "building";
  const isConstruction = categoryId === "construction";
  const isElectricity = categoryId === "electricity";
  const isWaterDrainage = categoryId === "water_drainage";
  const isWasteGarbage = categoryId === "waste_garbage";
  const isRoadsPublic = categoryId === "roads_public";
  const isEnvironment = categoryId === "environment";
  const isAnimals = categoryId === "animals";
  const usesJurisdictionHints =
    isBuilding ||
    isConstruction ||
    isElectricity ||
    isWaterDrainage ||
    isWasteGarbage ||
    isRoadsPublic ||
    isEnvironment ||
    isAnimals;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const slug = categoryId ?? "fire_safety";
      const [c, q] = await Promise.all([
        fetchEmergencyContacts("delhi"),
        fetchAssessmentQuestions(slug),
      ]);
      if (!alive) return;
      setContacts(c);
      setQuestions(q);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [categoryId]);

  const showEmergencyActions =
    emergencyChoice === "yes" || assessed === "emergency";

  const canContinue = useMemo(() => {
    if (!emergencyChoice) return false;
    if (emergencyChoice === "yes") return false;
    if (emergencyChoice === "no") return true;
    if (emergencyChoice === "not_sure") {
      if (assessed === "emergency") return false;
      if (assessed === "not_emergency") return true;
      if (assessed === "uncertain") return true;
      return false;
    }
    return false;
  }, [emergencyChoice, assessed]);

  const onSelectChoice = (id: Choice) => {
    setEmergencyChoice(id);
    setAnswers({});
    setAssessed(null);
    if (id === "yes") {
      setEmergencyResult("emergency");
    } else if (id === "no") {
      setEmergencyResult("not_emergency");
    } else {
      setEmergencyResult(null);
    }
  };

  const onAnswer = (key: string, value: AssessmentAnswer) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    const allAnswered =
      questions.length > 0 && questions.every((q) => next[q.question_key]);
    if (allAnswered) {
      const result = evaluateAssessment(next);
      setAssessed(result);
      setEmergencyResult(result);
    } else {
      setAssessed(null);
      setEmergencyResult(null);
    }
  };

  /** Photos + place steps removed — go to office suggestion. */
  const onContinue = () => {
    if (!canContinue) return;
    navigation.navigate("ReportStep6");
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={colors.linkBlue} strokeWidth={2.4} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Report a Concern</Text>
          <Text style={styles.headerStep}>{reportPhase(3).headerLine}</Text>
        </View>
        <Pressable
          style={styles.locationPill}
          onPress={() => setLocationOpen(true)}
        >
          <MapPin size={13} color={colors.primaryBlue} strokeWidth={2.4} />
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
          <ChevronDown size={13} color={colors.primaryBlue} strokeWidth={2.4} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.screen,
          paddingBottom: 24 + Math.max(insets.bottom, 8) + 80,
        }}
      >
        <View style={styles.progressWrap}>
          <StepProgress
            current={reportPhase(3).phase}
            total={reportPhase(3).total}
            label={reportPhase(3).label}
          />
        </View>

        <Text style={styles.heading}>Is anyone in danger right now?</Text>
        <Text style={styles.sub}>
          Life at risk? Call 112 / 101 first. Otherwise continue.
        </Text>

        <View style={styles.warnCard}>
          <AlertTriangle size={22} color={colors.white} strokeWidth={2.4} />
          <Text style={styles.warnText}>
            Immediate threat? Call emergency now — tap a number below.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            color={colors.primaryBlue}
            style={{ marginVertical: 20 }}
          />
        ) : (
          <View style={styles.contactRow}>
            {contacts.map((c, index) => (
              <React.Fragment key={c.number}>
                {index > 0 ? <View style={styles.contactDivider} /> : null}
                <Pressable
                  style={styles.contactCell}
                  onPress={() => void dialNumber(c.number, c.label)}
                >
                  <Phone size={16} color={colors.emergency} strokeWidth={2.2} />
                  <Text style={styles.contactNumber}>{c.number}</Text>
                  <Text style={styles.contactLabel}>{c.label}</Text>
                </Pressable>
              </React.Fragment>
            ))}
          </View>
        )}

        <View style={styles.choices}>
          {CHOICES.map((item) => {
            const selected = emergencyChoice === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => onSelectChoice(item.id)}
                style={[styles.choice, selected && styles.choiceSelected]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    selected && styles.choiceTextSelected,
                  ]}
                >
                  {item.title}
                </Text>
                {selected ? (
                  <View style={styles.check}>
                    <Check size={12} color={colors.white} strokeWidth={3} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {emergencyChoice === "not_sure" ? (
          <View style={styles.assessBox}>
            <Text style={styles.assessTitle}>Quick safety check</Text>
            <Text style={styles.assessSub}>
              {usesJurisdictionHints
                ? isWasteGarbage
                  ? "Answer these for waste & burning safety. This app does not decide for emergency services. Call 112 / 101 if anyone may be in danger. Do not approach fire, hazardous or biomedical waste."
                  : isWaterDrainage
                  ? "Answer these for water & drainage safety. This app does not decide for emergency services. Call 112 / 101 / 102 if anyone may be in danger. Do not enter floodwater or approach open manholes."
                  : isElectricity
                    ? "Answer these for electrical safety. This app does not decide for emergency services. Call 112 / 101 if anyone may be in danger. Do not approach wires."
                    : isConstruction
                      ? "Answer these for construction safety. This app does not decide for emergency services. Call 112 / 101 if anyone may be in danger. Do not enter the site."
                      : "Answer these for building safety. This app does not decide for emergency services. Call 112 / 101 if anyone may be in danger."
                : "Answer these questions from Fire Safety guidance. This app does not decide for emergency services."}
            </Text>
            {questions.map((q) => (
              <View key={q.question_key} style={styles.questionBlock}>
                <Text style={styles.questionText}>{q.question_text}</Text>
                <View style={styles.answerRow}>
                  {(["yes", "no", "not_sure"] as AssessmentAnswer[]).map(
                    (a) => {
                      const selected = answers[q.question_key] === a;
                      const label =
                        a === "yes" ? "Yes" : a === "no" ? "No" : "Not sure";
                      return (
                        <Pressable
                          key={a}
                          onPress={() => onAnswer(q.question_key, a)}
                          style={[
                            styles.answerChip,
                            selected && styles.answerChipSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.answerChipText,
                              selected && styles.answerChipTextSelected,
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    }
                  )}
                </View>
              </View>
            ))}
            {assessed === "uncertain" ? (
              <Text style={styles.uncertainNote}>
                We still can’t tell for sure. If anyone may be in danger, call
                112 now. Otherwise you can continue reporting.
              </Text>
            ) : null}
          </View>
        ) : null}

        {showEmergencyActions ? (
          <View style={styles.emergencyAction}>
            <Text style={styles.emergencyActionTitle}>
              Contact emergency services now
            </Text>
            <Text style={styles.emergencyActionSub}>
              {usesJurisdictionHints
                ? isAnimals
                  ? "Animal attack or people bitten now: call 112. Keep others back. After you are safe, use MCD 311 / 155305 for follow-up. This app does not respond to emergencies."
                  : isWasteGarbage
                  ? "Active waste fire or people in danger: call 112 and 101. Do not approach. This app does not respond to emergencies."
                  : isWaterDrainage
                  ? "Flooding, people trapped, or water near electricity: call 112, 101 and 102. Do not enter floodwater. This app does not respond to emergencies."
                  : isElectricity
                    ? "Live wire or electrical fire: call 112 and 101. Stay away. This app does not respond to emergencies."
                    : isConstruction
                      ? "Fire, collapse, or people trapped: call 112 and 101. Do not enter the site. This app does not respond to emergencies."
                      : "Immediate danger: call 112 and 101 now. This app does not respond to emergencies."
                : "For immediate danger, call emergency services directly. This app does not file for you."}
            </Text>
            {contacts.map((c) => (
              <Pressable
                key={`action-${c.number}`}
                style={[
                  styles.callBtn,
                  c.number === "112" && styles.callBtnPrimary,
                ]}
                onPress={() => void dialNumber(c.number, c.label)}
              >
                <Text
                  style={[
                    styles.callBtnText,
                    c.number === "112" && styles.callBtnTextPrimary,
                  ]}
                >
                  {c.number === "112"
                    ? "Call 112 - All Emergencies"
                    : c.number === "101"
                      ? usesJurisdictionHints
                        ? "Call 101 - Fire & Rescue"
                        : "Call Fire Service - 101"
                      : `Call ${c.label} - ${c.number}`}
                </Text>
              </Pressable>
            ))}
            {isWaterDrainage ? (
              <Pressable
                style={styles.callBtn}
                onPress={() =>
                  void dialNumber(
                    IFC_WATERLOGGING_HELPLINE.number,
                    IFC_WATERLOGGING_HELPLINE.label
                  )
                }
              >
                <Text style={styles.callBtnText}>
                  Call {IFC_WATERLOGGING_HELPLINE.number} - I&FC waterlogging
                  helpline
                </Text>
              </Pressable>
            ) : null}
            {isWasteGarbage ? (
              <Pressable
                style={styles.callBtn}
                onPress={() =>
                  void Linking.openURL(
                    whatsappUrl(DPCC_BURNING_WHATSAPP.number)
                  )
                }
              >
                <Text style={styles.callBtnText}>
                  WhatsApp {DPCC_BURNING_WHATSAPP.number} - DPCC burning
                  (after 112/101)
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              style={styles.returnLink}
              onPress={() => {
                setEmergencyChoice("no");
                setEmergencyResult("not_emergency");
                setAssessed(null);
              }}
            >
              <Text style={styles.returnLinkText}>
                Situation is under control - continue reporting
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>When is it an emergency?</Text>
          {EMERGENCY_EXAMPLES.map((example) => (
            <Text key={example} style={styles.infoItem}>
              • {example}
            </Text>
          ))}
        </View>
      </ScrollView>

      {!showEmergencyActions ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <Pressable
            disabled={!canContinue}
            onPress={onContinue}
            style={[
              styles.continue,
              !canContinue && styles.continueDisabled,
            ]}
          >
            <Text
              style={[
                styles.continueText,
                !canContinue && styles.continueTextDisabled,
              ]}
            >
              Next: office →
            </Text>
          </Pressable>
        </View>
      ) : null}

      <LocationPickerModal
        visible={locationOpen}
        current={location}
        onClose={() => setLocationOpen(false)}
        onSelect={setLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingHorizontal: space.screen,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 72,
    marginTop: 6,
    marginLeft: -4,
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.linkBlue,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingTop: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
    textAlign: "center",
  },
  headerStep: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.locationPill,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.pill,
    maxWidth: 108,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.navy,
    maxWidth: 58,
  },
  progressWrap: { marginTop: 8, marginBottom: 22 },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.navy,
    letterSpacing: -0.3,
  },
  sub: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  warnCard: {
    backgroundColor: colors.emergency,
    borderRadius: radii.lg,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  warnText: {
    flex: 1,
    color: colors.white,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  contactRow: {
    marginTop: 14,
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#F0C7C7",
    paddingVertical: 12,
  },
  contactCell: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
  },
  contactDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  contactNumber: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.navy,
  },
  contactLabel: {
    fontSize: 10,
    color: colors.muted,
    textAlign: "center",
    fontWeight: "500",
  },
  choices: { marginTop: 18, gap: 10 },
  choice: {
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderRadius: radii.lg,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  choiceSelected: {
    backgroundColor: colors.lightBlue,
    borderColor: colors.primaryBlue,
  },
  choiceText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.navy,
    paddingRight: 28,
  },
  choiceTextSelected: {
    color: colors.navy,
  },
  check: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  assessBox: {
    marginTop: 16,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.lg,
    padding: 14,
  },
  assessTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.navy,
  },
  assessSub: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 12,
    lineHeight: 17,
    color: colors.mutedDark,
  },
  questionBlock: { marginBottom: 14 },
  questionText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy,
    marginBottom: 8,
  },
  answerRow: { flexDirection: "row", gap: 8 },
  answerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  answerChipSelected: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  answerChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.navy,
  },
  answerChipTextSelected: { color: colors.white },
  uncertainNote: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: colors.mutedDark,
    fontWeight: "600",
  },
  emergencyAction: {
    marginTop: 18,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#F0C7C7",
    backgroundColor: "#FFF5F5",
    padding: 14,
  },
  emergencyActionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.emergencyDark,
  },
  emergencyActionSub: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 12,
    lineHeight: 17,
    color: colors.mutedDark,
  },
  callBtn: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.emergency,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: colors.white,
  },
  callBtnPrimary: {
    backgroundColor: colors.emergency,
    borderColor: colors.emergency,
  },
  callBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.emergencyDark,
  },
  callBtnTextPrimary: { color: colors.white },
  returnLink: { marginTop: 6, paddingVertical: 8 },
  returnLinkText: {
    textAlign: "center",
    color: colors.linkBlue,
    fontWeight: "700",
    fontSize: 13,
  },
  infoCard: {
    marginTop: 18,
    backgroundColor: colors.lightBlue,
    borderRadius: radii.lg,
    padding: 14,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.navy,
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.screen,
    paddingTop: 10,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  continue: {
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  continueDisabled: { backgroundColor: "#D7E0EF" },
  continueText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  continueTextDisabled: { color: "#9AA8BD" },
});
