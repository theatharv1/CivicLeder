import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronLeft,
  Copy,
  ExternalLink,
  Globe,
  MapPin,
  Phone,
} from "lucide-react-native";
import LocationPickerModal from "../../components/LocationPickerModal";
import StepProgress from "../../components/StepProgress";
import { reportPhase } from "../../lib/reportPhase";
import { useAppLocation } from "../../Context/LocationContext";
import {
  formatIncidentLocationSummary,
  useReportDraft,
} from "../../Context/ReportDraftContext";
import { DFS_COMPLAINT_URL } from "../../data/dfsEmergencyFieldsFallback";
import {
  isBuildingApprovalIssue,
} from "../../data/buildingKnowledge";
import {
  isConstructionApprovalIssue,
  isConstructionFireIssue,
  isConstructionLabourIssue,
} from "../../data/constructionKnowledge";
import {
  ELECTRICITY_BILLING_ISSUE_SLUGS,
  ELECTRICITY_HIDDEN_KNOWLEDGE,
  ELECTRICITY_NEW_CONNECTION_ISSUE_SLUGS,
  ELECTRICITY_NO_SUPPLY_ISSUE_SLUGS,
  ELECTRICITY_THEFT_ISSUE_SLUGS,
  electricityChannelPurpose,
  isElectricityEmergencyIssue,
} from "../../data/electricityKnowledge";
import {
  WATER_BILLING_ISSUE_SLUGS,
  WATER_HIDDEN_KNOWLEDGE,
  WATER_SUPPLY_ISSUE_SLUGS,
  WATER_WATERLOGGING_ISSUE_SLUGS,
  IFC_WATERLOGGING_HELPLINE,
  isWaterEmergencyIssue,
  waterChannelPurpose,
  waterGroupForIssueSlug,
} from "../../data/waterDrainageKnowledge";
import {
  WASTE_HIDDEN_KNOWLEDGE,
  DPCC_BURNING_WHATSAPP,
  isWasteBurningIssue,
  isWasteEmergencyIssue,
  wasteChannelPurpose,
  wasteGroupForIssueSlug,
} from "../../data/wasteGarbageKnowledge";
import {
  ROADS_HIDDEN_KNOWLEDGE,
  isRoadsEmergencyIssue,
  roadsChannelPurpose,
  roadsGroupForIssueSlug,
} from "../../data/roadsPublicSpacesKnowledge";
import {
  ENVIRONMENT_HIDDEN_KNOWLEDGE,
  ENVIRONMENT_RIGHTS_SOURCE,
  FOREST_GREEN_HELPLINE,
  NOISE_HELPLINE,
  environmentChannelPurpose,
  environmentGroupForIssueSlug,
  isEnvironmentEmergencyIssue,
} from "../../data/environmentKnowledge";
import {
  animalsGroupForIssueSlug,
  isAnimalsEmergencyIssue,
} from "../../data/animalsKnowledge";
import { REPORT_CATEGORIES } from "../../data/reportCategories";
import type { RoutedAuthority } from "../../data/routingFallback";
import {
  fetchAuthorityServices,
  pickPreferredService,
  type AuthorityService,
} from "../../lib/authorityServices";
import { copyText } from "../../lib/clipboard";
import { dialNumber } from "../../lib/dial";
import { APP_CASE_ID_LABEL, APP_NAME } from "../../lib/brand";
import {
  generateCivicLederCaseId,
  persistCaseUpdate,
  persistOfficialComplaint,
  persistReport,
  saveUserFiledCase,
} from "../../lib/reportCase";
import {
  channelActionUrl,
  channelActionUrlForPurpose,
  channelEmail,
  channelPhone,
  channelPhoneForPurpose,
  channelTrackingUrl,
  channelWebsite,
  channelWhatsapp,
  fetchLikelyAuthorities,
  filterChannelsByPurpose,
  whatsappUrl,
} from "../../lib/reportRouting";
import type { RootStackParamList } from "../../navigation/types";
import { colors, radii, space } from "../../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "ReportStep7">;

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildingPrimaryFilingLabel(slug: string | null | undefined): string {
  switch (slug) {
    case "mcd":
      return "Open MCD311 Complaint";
    case "ndmc":
      return "Open NDMC Complaint";
    case "dda":
      return "Open DDA Grievance";
    case "delhi_cantonment":
      return "Open Cantonment Website";
    default:
      return "Open Official Filing";
  }
}

function buildingApprovalLabel(slug: string | null | undefined): string {
  switch (slug) {
    case "mcd":
      return "Open MCD Building Plan Approval";
    case "ndmc":
      return "Open NDMC Building Plan Approval";
    case "dda":
      return "Open DDA Online Building Permit";
    default:
      return "Open Building Plan Approval";
  }
}

export default function ReportStep7Screen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { location, setLocation } = useAppLocation();
  const {
    categoryId,
    issueTypeSlug,
    emergencyResult,
    selectedAuthority,
    evidence,
    locationDraft,
    preparedDescription,
    setPreparedDescription,
    caseId,
    setCaseId,
    reportDbId,
    setReportDbId,
    hasOfficialReference,
    setHasOfficialReference,
    officialReference,
    setOfficialReference,
    userConfirmedFiled,
    setUserConfirmedFiled,
    officialFiledOn,
    setOfficialFiledOn,
    reset,
  } = useReportDraft();

  const [locationOpen, setLocationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authority, setAuthority] = useState<RoutedAuthority | null>(null);
  const [service, setService] = useState<AuthorityService | null>(null);
  const [allServices, setAllServices] = useState<AuthorityService[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [openedChannel, setOpenedChannel] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [showMoreContacts, setShowMoreContacts] = useState(false);

  const category = REPORT_CATEGORIES.find((c) => c.id === categoryId);
  const isFire = categoryId === "fire_safety";
  const isBuilding = categoryId === "building";
  const isConstruction = categoryId === "construction";
  const isElectricity = categoryId === "electricity";
  const isWaterDrainage = categoryId === "water_drainage";
  const isWasteGarbage = categoryId === "waste_garbage";
  const isRoadsPublic = categoryId === "roads_public";
  const isEnvironment = categoryId === "environment";
  const isAnimals = categoryId === "animals";
  const isApprovalIssue =
    (isBuilding && isBuildingApprovalIssue(issueTypeSlug)) ||
    (isConstruction && isConstructionApprovalIssue(issueTypeSlug));
  const isLabourIssue = isConstruction && isConstructionLabourIssue(issueTypeSlug);
  const isConstructionFire = isConstruction && isConstructionFireIssue(issueTypeSlug);
  const isElecEmergencyIssue = isElectricity && isElectricityEmergencyIssue(issueTypeSlug);
  const isElecTheft = isElectricity && ELECTRICITY_THEFT_ISSUE_SLUGS.has(issueTypeSlug ?? "");
  const isElecBilling =
    isElectricity && ELECTRICITY_BILLING_ISSUE_SLUGS.has(issueTypeSlug ?? "");
  const isElecNoSupply =
    isElectricity && ELECTRICITY_NO_SUPPLY_ISSUE_SLUGS.has(issueTypeSlug ?? "");
  const isElecNewConn =
    isElectricity &&
    ELECTRICITY_NEW_CONNECTION_ISSUE_SLUGS.has(issueTypeSlug ?? "");
  const isWaterEmergencyIssueType =
    isWaterDrainage && isWaterEmergencyIssue(issueTypeSlug);
  const isWaterBilling =
    isWaterDrainage && WATER_BILLING_ISSUE_SLUGS.has(issueTypeSlug ?? "");
  const isWaterSupply =
    isWaterDrainage && WATER_SUPPLY_ISSUE_SLUGS.has(issueTypeSlug ?? "");
  const isWaterlogging =
    isWaterDrainage &&
    (WATER_WATERLOGGING_ISSUE_SLUGS.has(issueTypeSlug ?? "") ||
      waterChannelPurpose(issueTypeSlug) === "flood_control");
  const isWasteEmergencyIssueType =
    isWasteGarbage && isWasteEmergencyIssue(issueTypeSlug);
  const isWasteBurning = isWasteGarbage && isWasteBurningIssue(issueTypeSlug);
  const isRoadsEmergencyIssueType =
    isRoadsPublic && isRoadsEmergencyIssue(issueTypeSlug);
  const isEnvironmentEmergencyIssueType =
    isEnvironment && isEnvironmentEmergencyIssue(issueTypeSlug);
  const isAnimalsEmergencyIssueType =
    isAnimals && isAnimalsEmergencyIssue(issueTypeSlug);
  const isNoiseIssue =
    isEnvironment && environmentChannelPurpose(issueTypeSlug) === "noise_pollution";
  const isTreeWildlifeIssue =
    isEnvironment &&
    (environmentChannelPurpose(issueTypeSlug) === "trees_forest" ||
      environmentChannelPurpose(issueTypeSlug) === "wildlife");
  const isEmergency = emergencyResult === "emergency";
  const treatAsEmergency =
    isEmergency ||
    isConstructionFire ||
    isElecEmergencyIssue ||
    isWaterEmergencyIssueType ||
    isWasteEmergencyIssueType ||
    isRoadsEmergencyIssueType ||
    isEnvironmentEmergencyIssueType ||
    isAnimalsEmergencyIssueType;
  const elecPurpose = electricityChannelPurpose(issueTypeSlug);
  const waterPurpose = waterChannelPurpose(issueTypeSlug);
  const wastePurpose = wasteChannelPurpose(issueTypeSlug);
  const roadsPurpose = roadsChannelPurpose(issueTypeSlug);
  const environmentPurpose = environmentChannelPurpose(issueTypeSlug);

  const issueLabel = useMemo(() => {
    if (isAnimals) {
      return (
        animalsGroupForIssueSlug(issueTypeSlug)?.label ??
        (issueTypeSlug ? issueTypeSlug.replace(/_/g, " ") : null) ??
        category?.description ??
        "Reported concern"
      );
    }
    if (isEnvironment) {
      return (
        environmentGroupForIssueSlug(issueTypeSlug)?.label ??
        (issueTypeSlug ? issueTypeSlug.replace(/_/g, " ") : null) ??
        category?.description ??
        "Reported concern"
      );
    }
    if (isRoadsPublic) {
      return (
        roadsGroupForIssueSlug(issueTypeSlug)?.label ??
        (issueTypeSlug ? issueTypeSlug.replace(/_/g, " ") : null) ??
        category?.description ??
        "Reported concern"
      );
    }
    if (isWasteGarbage) {
      return (
        wasteGroupForIssueSlug(issueTypeSlug)?.label ??
        (issueTypeSlug ? issueTypeSlug.replace(/_/g, " ") : null) ??
        category?.description ??
        "Reported concern"
      );
    }
    if (isWaterDrainage) {
      return (
        waterGroupForIssueSlug(issueTypeSlug)?.label ??
        (issueTypeSlug ? issueTypeSlug.replace(/_/g, " ") : null) ??
        category?.description ??
        "Reported concern"
      );
    }
    if (issueTypeSlug) return issueTypeSlug.replace(/_/g, " ");
    return category?.description ?? "Reported concern";
  }, [
    issueTypeSlug,
    category?.description,
    isWaterDrainage,
    isWasteGarbage,
    isRoadsPublic,
    isEnvironment,
    isAnimals,
  ]);

  const incidentSummary = formatIncidentLocationSummary(locationDraft);

  const builtDescription = useMemo(() => {
    const parts = [
      category?.title ? `Category: ${category.title}` : null,
      issueLabel ? `Issue: ${issueLabel}` : null,
      incidentSummary ? `Incident location: ${incidentSummary}` : null,
      locationDraft.latitude != null && locationDraft.longitude != null
        ? `Incident GPS: ${locationDraft.latitude.toFixed(5)}, ${locationDraft.longitude.toFixed(5)}`
        : null,
      locationDraft.currentLocation
        ? `Current (device) GPS at capture: ${locationDraft.currentLocation.latitude.toFixed(5)}, ${locationDraft.currentLocation.longitude.toFixed(5)}`
        : null,
    ].filter(Boolean);
    return parts.join("\n");
  }, [category?.title, issueLabel, incidentSummary, locationDraft]);

  useEffect(() => {
    if (!preparedDescription && builtDescription) {
      setPreparedDescription(builtDescription);
    }
  }, [builtDescription, preparedDescription, setPreparedDescription]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      let id = caseId;
      if (!id) {
        id = await generateCivicLederCaseId();
        if (alive) setCaseId(id);
      }
      const list = await fetchLikelyAuthorities(categoryId ?? "fire_safety");
      if (!alive) return;
      const match =
        list.find((a) => a.slug === selectedAuthority?.slug) ??
        list.find((a) => a.is_primary) ??
        list[0] ??
        null;
      setAuthority(match);

      const slug = selectedAuthority?.slug ?? match?.slug ?? null;
      const services = await fetchAuthorityServices(slug, {
        preferEmergency:
          isEmergency ||
          isConstructionFire ||
          isElecEmergencyIssue ||
          isWaterEmergencyIssueType ||
          isWasteEmergencyIssueType ||
          isRoadsEmergencyIssueType ||
          isEnvironmentEmergencyIssueType,
        preferWaterSupply: isWaterSupply,
        preferWaterlogging: isWaterlogging,
        preferBilling: isElecBilling || isWaterBilling,
        preferWaste: isWasteGarbage,
        preferRoads: isRoadsPublic,
        preferEnvironment: isEnvironment,
      });
      if (!alive) return;
      setAllServices(services);
      setService(
        pickPreferredService(
          services,
          isEmergency ||
            isConstructionFire ||
            isElecEmergencyIssue ||
            isWaterEmergencyIssueType ||
            isWasteEmergencyIssueType ||
            isRoadsEmergencyIssueType ||
            isEnvironmentEmergencyIssueType,
          {
            preferBuildingContact:
              (isBuilding || isConstruction) && !isApprovalIssue,
            preferApproval: isApprovalIssue,
            preferTheft: isElecTheft,
            preferNoSupply: isElecNoSupply || isElecNewConn,
            preferBilling: isElecBilling || isWaterBilling,
            preferWaterSupply: isWaterSupply,
            preferWaterlogging: isWaterlogging,
            preferWaste: isWasteGarbage,
            preferRoads: isRoadsPublic,
            preferEnvironment: isEnvironment,
          }
        )
      );
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [
    categoryId,
    selectedAuthority?.slug,
    caseId,
    setCaseId,
    isEmergency,
    isBuilding,
    isConstruction,
    isApprovalIssue,
    isConstructionFire,
    isElecEmergencyIssue,
    isElecTheft,
    isElecNoSupply,
    isElecNewConn,
    isElecBilling,
    isWaterEmergencyIssueType,
    isWaterSupply,
    isWaterlogging,
    isWaterBilling,
    isWasteEmergencyIssueType,
    isWasteGarbage,
    isRoadsEmergencyIssueType,
    isRoadsPublic,
    isEnvironmentEmergencyIssueType,
    isEnvironment,
  ]);

  const channels = authority?.channels ?? [];
  const authSlug = authority?.slug ?? selectedAuthority?.slug ?? null;
  const purposeChannels = useMemo(
    () =>
      isElectricity
        ? filterChannelsByPurpose(channels, elecPurpose)
        : isWaterDrainage
          ? filterChannelsByPurpose(channels, waterPurpose)
          : isWasteGarbage
            ? filterChannelsByPurpose(channels, wastePurpose)
            : isRoadsPublic
              ? filterChannelsByPurpose(channels, roadsPurpose)
              : isEnvironment
                ? filterChannelsByPurpose(channels, environmentPurpose)
              : channels,
    [
      isElectricity,
      isWaterDrainage,
      isWasteGarbage,
      isRoadsPublic,
      isEnvironment,
      channels,
      elecPurpose,
      waterPurpose,
      wastePurpose,
      roadsPurpose,
      environmentPurpose,
    ]
  );

  const phone = useMemo(() => {
    if (isFire && isEmergency) return "101";
    if (isRoadsPublic && treatAsEmergency) {
      return "112";
    }
    if (isEnvironment && treatAsEmergency) {
      return "112";
    }
    if (isWasteGarbage && treatAsEmergency) {
      return "112";
    }
    if (isWaterDrainage && treatAsEmergency) {
      return "112";
    }
    if (isElectricity && treatAsEmergency) {
      const discomEmergency =
        channelPhoneForPurpose(channels, "fire_shock") ??
        channelPhoneForPurpose(channels, "emergency");
      // Prefer 112/101 first in UI; DISCOM emergency shown as secondary
      return "112";
    }
    if ((isBuilding || isConstruction) && treatAsEmergency) {
      return isConstructionFire || authSlug === "delhi_fire_service"
        ? "101"
        : "112";
    }
    if (isLabourIssue || authSlug === "labour_delhi") return "155214";
    if (isEmergency && (service?.phone === "101" || service?.phone === "112")) {
      return service.phone;
    }
    if (isElectricity) {
      return (
        channelPhoneForPurpose(channels, elecPurpose) ??
        channelPhone(channels) ??
        service?.phone ??
        authority?.emergency_number ??
        null
      );
    }
    if (isWaterDrainage) {
      return (
        channelPhoneForPurpose(channels, waterPurpose) ??
        channelPhone(channels) ??
        service?.phone ??
        authority?.emergency_number ??
        null
      );
    }
    if (isWasteGarbage) {
      return (
        channelPhoneForPurpose(channels, wastePurpose) ??
        channelPhone(channels) ??
        service?.phone ??
        authority?.emergency_number ??
        null
      );
    }
    if (isRoadsPublic) {
      return (
        channelPhoneForPurpose(channels, roadsPurpose) ??
        channelPhone(channels) ??
        service?.phone ??
        authority?.emergency_number ??
        null
      );
    }
    if (isEnvironment) {
      return (
        channelPhoneForPurpose(channels, environmentPurpose) ??
        channelPhone(channels) ??
        service?.phone ??
        (isNoiseIssue ? NOISE_HELPLINE.number : null) ??
        (isTreeWildlifeIssue ? FOREST_GREEN_HELPLINE.number : null) ??
        authority?.emergency_number ??
        null
      );
    }
    const fromChannel = channelPhone(channels);
    if (fromChannel) return fromChannel;
    if (service?.phone) return service.phone;
    return authority?.emergency_number ?? null;
  }, [
    service,
    authority,
    channels,
    isEmergency,
    isFire,
    isBuilding,
    isConstruction,
    isElectricity,
    isWaterDrainage,
    isWasteGarbage,
    isRoadsPublic,
    treatAsEmergency,
    isConstructionFire,
    isLabourIssue,
    authSlug,
    elecPurpose,
    waterPurpose,
    wastePurpose,
    roadsPurpose,
  ]);

  const discomEmergencyPhone = useMemo(() => {
    if (!isElectricity || !treatAsEmergency) return null;
    return (
      channelPhoneForPurpose(channels, "fire_shock") ??
      channelPhoneForPurpose(channels, "emergency") ??
      null
    );
  }, [isElectricity, treatAsEmergency, channels]);

  const ifcHelplinePhone = useMemo(() => {
    if (!isWaterDrainage || !treatAsEmergency) return null;
    return (
      channelPhoneForPurpose(channels, "flood_control") ??
      channelPhoneForPurpose(channels, "waterlogging") ??
      channelPhoneForPurpose(channels, "emergency") ??
      IFC_WATERLOGGING_HELPLINE.number
    );
  }, [isWaterDrainage, treatAsEmergency, channels]);

  const dpccBurningWhatsapp = useMemo(() => {
    if (!isWasteGarbage || !treatAsEmergency) return null;
    return (
      channelWhatsapp(
        filterChannelsByPurpose(channels, "burning")
      ) ?? DPCC_BURNING_WHATSAPP.number
    );
  }, [isWasteGarbage, treatAsEmergency, channels]);

  const email = useMemo(() => channelEmail(channels), [channels]);
  const whatsapp = useMemo(() => channelWhatsapp(channels), [channels]);
  const appChannel = useMemo(
    () => purposeChannels.find((c) => c.purpose === "app" || c.channel_type === "app"),
    [purposeChannels]
  );

  const approvalService = useMemo(() => {
    if (!isApprovalIssue) return null;
    return (
      allServices.find((s) => s.service_type === "approval") ??
      allServices.find((s) => s.slug.endsWith("_building_plan_approval")) ??
      null
    );
  }, [isApprovalIssue, allServices]);

  const filingUrl = useMemo(() => {
    if (isFire && !isEmergency) {
      return (
        service?.filing_url ??
        allServices.find((s) => s.filing_url)?.filing_url ??
        DFS_COMPLAINT_URL
      );
    }
    if (treatAsEmergency && (isBuilding || isConstruction || isElectricity || isWaterDrainage || isWasteGarbage || isRoadsPublic || isEnvironment || isAnimals))
      return null;
    if (isApprovalIssue && approvalService?.filing_url) {
      return approvalService.filing_url;
    }
    if (isElectricity) {
      return (
        channelActionUrlForPurpose(channels, elecPurpose) ??
        service?.filing_url ??
        channelActionUrl(channels) ??
        null
      );
    }
    if (isWaterDrainage) {
      return (
        channelActionUrlForPurpose(channels, waterPurpose) ??
        service?.filing_url ??
        channelActionUrl(channels) ??
        null
      );
    }
    if (isWasteGarbage) {
      return (
        channelActionUrlForPurpose(channels, wastePurpose) ??
        service?.filing_url ??
        channelActionUrl(channels) ??
        null
      );
    }
    if (isRoadsPublic) {
      return (
        channelActionUrlForPurpose(channels, roadsPurpose) ??
        service?.filing_url ??
        channelActionUrl(channels) ??
        null
      );
    }
    if (isEnvironment) {
      return (
        channelActionUrlForPurpose(channels, environmentPurpose) ??
        service?.filing_url ??
        channelActionUrl(channels) ??
        null
      );
    }
    // Prefer verified channel.action_url; do not invent tracking/action URLs
    const fromChannel = channelActionUrl(channels);
    if (fromChannel && !isApprovalIssue) return fromChannel;
    if (isBuilding || isConstruction) {
      return (
        service?.filing_url ??
        allServices.find(
          (s) =>
            Boolean(s.filing_url) &&
            (s.service_type === "complaint" || s.service_type === "grievance")
        )?.filing_url ??
        null
      );
    }
    return service?.filing_url ?? null;
  }, [
    isFire,
    isEmergency,
    isBuilding,
    isConstruction,
    isElectricity,
    isWaterDrainage,
    isWasteGarbage,
    isRoadsPublic,
    isApprovalIssue,
    treatAsEmergency,
    service,
    allServices,
    channels,
    approvalService,
    elecPurpose,
    waterPurpose,
    wastePurpose,
    roadsPurpose,
  ]);

  const trackingUrl = useMemo(() => {
    if (isApprovalIssue || treatAsEmergency) return null;
    const fromChannel = channelTrackingUrl(channels);
    if (fromChannel) return fromChannel;
    if (isBuilding || isConstruction) return service?.tracking_url ?? null;
    return service?.tracking_url ?? null;
  }, [
    channels,
    isBuilding,
    isConstruction,
    isApprovalIssue,
    treatAsEmergency,
    service?.tracking_url,
  ]);

  const officialPage =
    channelWebsite(channels) ??
    service?.official_url ??
    authority?.official_website ??
    (isFire ? DFS_COMPLAINT_URL : null);

  const needFields = useMemo(() => {
    const fromService = (service?.fields ?? []).filter(
      (f) =>
        f.requiredness === "recommended" ||
        f.requiredness === "may_be_requested"
    );
    if (fromService.length) return fromService;
    if (isFire) {
      const fb = allServices.find((s) => s.fields.length > 0);
      return (fb?.fields ?? []).filter(
        (f) =>
          f.requiredness === "recommended" ||
          f.requiredness === "may_be_requested"
      );
    }
    return [];
  }, [service, allServices, isFire]);

  const redirectAlert = (onConfirm: () => void) => {
    Alert.alert(
      "Official channel",
      "You are being redirected to the official authority platform. This app does not file for you.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", onPress: onConfirm },
      ]
    );
  };

  /** Open official page - does NOT mark filed/submitted. */
  const openOfficialUrl = (url: string) => {
    redirectAlert(() => {
      void (async () => {
        try {
          await Linking.openURL(url);
          setOpenedChannel(true);
        } catch {
          Alert.alert("Unable to open", url);
        }
      })();
    });
  };

  const openOfficialFiling = () => {
    const url = filingUrl ?? (isFire ? DFS_COMPLAINT_URL : null);
    if (!url) {
      Alert.alert(
        "No verified filing link",
        "A verified official filing URL is not available. Use the phone number or official website if shown."
      );
      return;
    }
    openOfficialUrl(url);
  };

  const callFireRescue = () => {
    redirectAlert(() => {
      setOpenedChannel(true);
      void dialNumber("101", "Fire & Rescue");
    });
  };

  const callOfficial = () => {
    if (!phone) {
      Alert.alert(
        "No verified number",
        "A verified official phone number is not available yet."
      );
      return;
    }
    if (isFire && phone === "101") {
      callFireRescue();
      return;
    }
    redirectAlert(() => {
      setOpenedChannel(true);
      void dialNumber(phone, authority?.name ?? service?.service_name ?? "Authority");
    });
  };

  const openTracking = () => {
    if (!trackingUrl) return;
    Alert.alert(
      "Official tracking",
      "Open the official tracking page and enter your official reference yourself. We do not add it to the URL.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open",
          onPress: () => {
            void Linking.openURL(trackingUrl).catch(() =>
              Alert.alert("Unable to open", trackingUrl)
            );
          },
        },
      ]
    );
  };

  const ensureReportSaved = async (status: string) => {
    if (!caseId) return null;
    const id = await persistReport({
      caseId,
      categorySlug: categoryId,
      issueTypeSlug,
      emergencyResult,
      selectedAuthoritySlug: selectedAuthority?.slug ?? authority?.slug ?? null,
      userStatus: status,
    });
    if (id) setReportDbId(id);
    return id ?? reportDbId;
  };

  const saveFiling = async () => {
    if (userConfirmedFiled !== true) return;
    setSaving(true);
    try {
      const hasRef = Boolean(officialReference?.trim());
      setHasOfficialReference(hasRef);
      // Status is always user-recorded - never a government sync status
      const status = hasRef ? "reference_recorded" : "recorded";
      const dbId = await ensureReportSaved(status);
      const channelType = isEmergency
        ? "phone"
        : filingUrl
          ? "website"
          : phone
            ? "phone"
            : null;
      const channelValue = isEmergency
        ? phone ?? "101"
        : (filingUrl ?? phone ?? officialPage);
      await persistOfficialComplaint({
        reportId: dbId,
        authoritySlug: authority?.slug ?? selectedAuthority?.slug ?? null,
        serviceId: service?.id ?? null,
        channelType,
        channelValue,
        officialSubmissionUrl: filingUrl,
        officialTrackingUrl: trackingUrl,
        hasOfficialReference: hasRef,
        officialReference: hasRef ? officialReference!.trim() : null,
        userConfirmedFiled: true,
        officialFiledOn: officialFiledOn || todayISODate(),
      });
      await persistCaseUpdate({
        reportId: dbId,
        status,
        message: hasRef
          ? "User recorded official reference after using official channel."
          : "User confirmed using official channel (no reference yet).",
      });
      if (caseId) {
        await saveUserFiledCase({
          caseId,
          reportDbId: dbId,
          categorySlug: categoryId,
          issueTypeSlug,
          authoritySlug: authority?.slug ?? selectedAuthority?.slug ?? null,
          authorityName: authority?.name ?? selectedAuthority?.name ?? null,
          officialReference: hasRef ? officialReference!.trim() : null,
          filedAt: officialFiledOn || todayISODate(),
          userStatus: status,
          trackingUrl,
          phone,
        });
      }
      setDone(true);
      Alert.alert(
        `Saved in ${APP_NAME}`,
        `Notebook ID ${caseId} saved for you. This is NOT a government complaint number. Add their reference later if they gave you one.`
      );
    } finally {
      setSaving(false);
    }
  };

  /** Save preparation without claiming official filing. */
  const saveRecordedOnly = async () => {
    if (!caseId) return;
    setSaving(true);
    try {
      const dbId = await ensureReportSaved("recorded");
      await saveUserFiledCase({
        caseId,
        reportDbId: dbId,
        categorySlug: categoryId,
        issueTypeSlug,
        authoritySlug: authority?.slug ?? selectedAuthority?.slug ?? null,
        authorityName: authority?.name ?? selectedAuthority?.name ?? null,
        officialReference: null,
        filedAt: null,
        userStatus: "recorded",
        trackingUrl,
        phone,
      });
      setDone(true);
      Alert.alert(
        `Saved in ${APP_NAME}`,
        `Notes for ${caseId} saved for you. Not a government complaint. Contact the official office when ready.`
      );
    } finally {
      setSaving(false);
    }
  };

  const finish = () => {
    reset();
    navigation.navigate("Main", { screen: "cases" });
  };

  const infoEmpty = (label: string) => (
    <Text style={styles.emptyHint}>{label}</Text>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={colors.linkBlue} strokeWidth={2.4} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Report a Concern</Text>
          <Text style={styles.headerStep}>{reportPhase(7).headerLine}</Text>
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
          paddingBottom: 24 + Math.max(insets.bottom, 8) + 40,
        }}
      >
        <View style={styles.progressWrap}>
          <StepProgress
            current={reportPhase(7).phase}
            total={reportPhase(7).total}
            label={reportPhase(7).label}
          />
        </View>

        <View
          style={{
            backgroundColor: "#EEF4FF",
            borderRadius: 12,
            padding: 12,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: "#D0DFF5",
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy }}>
            How contact works
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 13,
              lineHeight: 19,
              color: colors.mutedDark,
            }}
          >
            {treatAsEmergency
              ? "Danger first: call the emergency number below. Ordinary complaint pages come after you are safe."
              : "We show the most likely office and one main way to reach them. Extra phones or links stay under “More options” if you need them."}{" "}
            You file on their system. Save a personal note in My Cases - that ID
            is only for you, not a government complaint number.
          </Text>
        </View>

        {isFire ? (
          <>
            <Text style={styles.heading}>
              {isEmergency
                ? "If danger - call Fire & Rescue"
                : "Contact Delhi Fire Service"}
            </Text>
            <Text style={styles.sub}>
              Use the main button for your need. Opening a website does not
              mean a complaint is filed.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.heading}>
              {treatAsEmergency
                ? "If danger - call emergency first"
                : "Contact the most likely office"}
            </Text>
            <Text style={styles.sub}>
              {treatAsEmergency
                ? "Emergency numbers first. Other helplines are secondary."
                : "Call or open their official page for this kind of issue. Then you can save what you did in My Cases."}
            </Text>
          </>
        )}

        {loading ? (
          <ActivityIndicator
            color={colors.primaryBlue}
            style={{ marginVertical: 20 }}
          />
        ) : (
          <>
            {isFire ? (
              <View style={styles.card}>
                <Text style={styles.label}>What can you do?</Text>
                <Text style={styles.desc}>
                  Prepare your details here, then use the official Delhi Fire
                  Service channel below. This app does not file for you.
                </Text>
              </View>
            ) : null}

            {/* Concern */}
            <View style={styles.card}>
              <Text style={styles.label}>
                {isFire ? "Your fire safety concern" : "Issue summary"}
              </Text>
              <Text style={styles.title}>{category?.title ?? "Concern"}</Text>
              <Text style={styles.desc}>{issueLabel}</Text>
              {isEmergency || treatAsEmergency ? (
                <Text style={styles.emergencyNote}>
                  {isRoadsPublic
                    ? "Roads emergency - call 112 / 101 now. Do not stand in traffic or approach open manholes. Traffic Police 1095 may help for dangerous signals after emergency response. Do not use ordinary pothole channels first."
                    : isWasteGarbage
                    ? "Waste emergency - call 112 / 101 now. Do not approach fire, hazardous or biomedical waste. DPCC burning WhatsApp / Green Delhi are secondary after safety. Do not use ordinary collection channels first."
                    : isWaterDrainage
                    ? "Water emergency - call 112 / 101 / 102 now. Do not enter floodwater or approach open manholes. Use I&FC waterlogging helpline after emergency response if relevant. Do not use ordinary billing/supply channels first."
                    : isElectricity
                      ? "Electrical emergency - call 112 / 101 now. Stay away from wires. Use DISCOM emergency only if verified for your provider. Do not use billing/no-supply channels first."
                      : isBuilding
                        ? "Emergency path - call 112 / 101 now. Do not use normal complaint channels first."
                        : isConstruction
                          ? "Emergency path - call 112 / 101 now. Do not enter the construction site. Do not use normal complaint channels first."
                          : "Emergency path - call Fire & Rescue 101 now."}
                </Text>
              ) : null}
            </View>

            {!isFire ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.label}>Most likely office</Text>
                  <Text style={styles.title}>
                    {authority?.name ??
                      selectedAuthority?.name ??
                      "Not yet determined"}
                  </Text>
                  <Text style={styles.desc}>
                    Suggestion for this issue - not a guarantee. You choose
                    whether to contact them.
                  </Text>
                </View>
                {isElectricity || isWaterDrainage || isWasteGarbage || isRoadsPublic || isEnvironment ? (
                  <View style={styles.channelCard}>
                    <Text style={styles.label}>Best official action</Text>
                    <Text style={styles.title}>
                      {isElectricity
                        ? isElecTheft
                          ? "Report power theft (official channel)"
                          : isElecBilling
                            ? "Billing / customer care"
                            : isElecNoSupply
                              ? "Report no supply"
                              : isElecNewConn
                                ? "New connection / service request"
                                : treatAsEmergency
                                  ? "Electrical emergency response"
                                  : service?.service_name ??
                                    "Official DISCOM channel"
                        : isEnvironment
                          ? treatAsEmergency
                            ? "Environment emergency response"
                            : isNoiseIssue
                              ? "NGMS noise complaint / 155271"
                              : isTreeWildlifeIssue
                                ? "Forest grievance / Green Helpline"
                                : environmentPurpose === "air_pollution"
                                  ? "Green Delhi / air pollution channel"
                                  : environmentPurpose === "water_pollution"
                                    ? "Water pollution (environment) channel"
                                    : environmentPurpose === "soil_pollution"
                                      ? "Soil / land pollution channel"
                                      : service?.service_name ??
                                        "Official environment channel"
                        : isRoadsPublic
                          ? treatAsEmergency
                            ? "Roads emergency response"
                            : roadsPurpose === "pothole"
                              ? "Pothole / road surface channel"
                              : roadsPurpose === "footpath"
                                ? "Footpath channel"
                                : roadsPurpose === "traffic_signal"
                                  ? "Traffic signal channel"
                                  : roadsPurpose === "traffic_obstruction"
                                    ? "Traffic obstruction channel"
                                    : roadsPurpose === "park"
                                      ? "Park / public space channel"
                                      : roadsPurpose === "bridge" ||
                                          roadsPurpose === "underpass"
                                        ? "Bridge / underpass channel"
                                        : roadsPurpose === "streetlight"
                                          ? "Streetlight (confirm DISCOM / asset owner)"
                                          : roadsPurpose === "waterlogging"
                                            ? "Road waterlogging (drainage / I&FC)"
                                            : roadsPurpose === "road_cut"
                                              ? "Road cut not restored"
                                              : service?.service_name ??
                                                "Official roads / public-space channel"
                          : isWasteGarbage
                          ? treatAsEmergency
                            ? "Waste / burning emergency response"
                            : isWasteBurning
                              ? "Report leaf / garbage burning"
                              : wastePurpose === "missed_collection"
                                ? "Missed collection channel"
                                : wastePurpose === "dumping"
                                  ? "Dumping / littering channel"
                                  : wastePurpose === "cd_waste"
                                    ? "Malba / C&D dumping channel"
                                    : wastePurpose === "plastic_waste"
                                      ? "Plastic waste channel"
                                      : wastePurpose === "hazardous_waste" ||
                                          wastePurpose === "biomedical_waste" ||
                                          wastePurpose === "e_waste"
                                        ? "Specialized waste (DPCC / authorized)"
                                        : service?.service_name ??
                                          "Official waste / garbage channel"
                          : treatAsEmergency
                            ? "Water / flood emergency response"
                            : isWaterBilling
                              ? "Billing / customer care"
                              : isWaterSupply
                                ? "Water supply complaint"
                                : isWaterlogging
                                  ? "Waterlogging / flood channel"
                                  : waterPurpose === "sewerage"
                                    ? "Sewerage official channel"
                                    : waterPurpose === "water_quality"
                                      ? "Water quality channel"
                                      : waterPurpose === "meter"
                                        ? "Meter / connection channel"
                                        : service?.service_name ??
                                          "Official water / drainage channel"}
                    </Text>
                    <Text style={styles.desc}>
                      {isWasteGarbage
                        ? treatAsEmergency
                          ? "Call 112 / 101 first. DPCC burning WhatsApp / Green Delhi are secondary when verified."
                          : service?.description ??
                            "Use the reason-specific channel for this issue. You open the official page yourself."
                        : isWaterDrainage
                          ? treatAsEmergency
                            ? "Call 112 / 101 / 102 first. I&FC waterlogging helpline is secondary when verified."
                            : service?.description ??
                              "Use the reason-specific channel for this issue. You open the official page yourself."
                          : treatAsEmergency
                            ? "Call 112 / 101 first. DISCOM emergency is secondary and only if verified."
                            : isElecTheft
                              ? "Use the dedicated theft portal - not billing or no-supply. Do not confront anyone. Opening a URL does not mean a complaint is filed."
                              : service?.description ??
                                "Use the reason-specific channel for this issue. You open the official page yourself."}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.channelCard}>
                    <Text style={styles.label}>Official service</Text>
                    <Text style={styles.title}>
                      {service?.service_name ?? "Verification required"}
                    </Text>
                    <Text style={styles.desc}>
                      {service?.description ??
                        "No verified service seeded for this authority yet."}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.channelCard}>
                <Text style={styles.label}>Official authority</Text>
                <Text style={styles.title}>
                  {authority?.name ?? "Delhi Fire Service"}
                </Text>
                <Text style={styles.desc}>
                  {service?.service_name ??
                    (isEmergency
                      ? "Fire / rescue emergency (Call 101)"
                      : "Complaint and Grievances")}
                </Text>
              </View>
            )}

            {/* Your information - optional empty states OK */}
            <View style={styles.card}>
              <Text style={styles.label}>Your information</Text>

              <Text style={styles.infoSub}>Location</Text>
              {incidentSummary ? (
                <>
                  <Text style={styles.desc}>{incidentSummary}</Text>
                  <Pressable
                    style={styles.copyRow}
                    onPress={() =>
                      navigation.navigate("ReportStep5")
                    }
                  >
                    <Text style={styles.copyText}>Edit location</Text>
                  </Pressable>
                  <Pressable
                    style={styles.copyRow}
                    onPress={() => void copyText("Location", incidentSummary)}
                  >
                    <Copy size={14} color={colors.primaryBlue} />
                    <Text style={styles.copyText}>Copy location</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  {infoEmpty("No location added (optional)")}
                  <Pressable
                    style={styles.copyRow}
                    onPress={() => navigation.navigate("ReportStep5")}
                  >
                    <Text style={styles.copyText}>Add / edit location</Text>
                  </Pressable>
                </>
              )}

              <Text style={[styles.infoSub, { marginTop: 14 }]}>Evidence</Text>
              {evidence.length > 0 ? (
                <>
                  <Text style={styles.desc}>
                    {evidence.length} item
                    {evidence.length === 1 ? "" : "s"} in your pack
                  </Text>
                  <Pressable
                    style={styles.copyRow}
                    onPress={() => navigation.navigate("ReportStep4")}
                  >
                    <Text style={styles.copyText}>View / edit evidence</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  {infoEmpty("No photos or videos (optional)")}
                  <Pressable
                    style={styles.copyRow}
                    onPress={() => navigation.navigate("ReportStep4")}
                  >
                    <Text style={styles.copyText}>Add evidence</Text>
                  </Pressable>
                </>
              )}

              <Text style={[styles.infoSub, { marginTop: 14 }]}>
                Description
              </Text>
              {editingDescription ? (
                <TextInput
                  style={styles.descInput}
                  multiline
                  value={preparedDescription || builtDescription}
                  onChangeText={setPreparedDescription}
                  onBlur={() => setEditingDescription(false)}
                />
              ) : (
                <Text style={styles.desc}>
                  {preparedDescription || builtDescription || "No description yet"}
                </Text>
              )}
              <Pressable
                style={styles.copyRow}
                onPress={() => setEditingDescription(true)}
              >
                <Text style={styles.copyText}>Edit description</Text>
              </Pressable>
              {(preparedDescription || builtDescription) ? (
                <Pressable
                  style={styles.copyRow}
                  onPress={() =>
                    void copyText(
                      "Prepared description",
                      preparedDescription || builtDescription
                    )
                  }
                >
                  <Copy size={14} color={colors.primaryBlue} />
                  <Text style={styles.copyText}>Copy description</Text>
                </Pressable>
              ) : null}
            </View>

            {/* What you may need */}
            {needFields.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.label}>What you may need</Text>
                <Text style={styles.desc}>
                  From official DFS guidance - recommended. Not an invented
                  required checklist.
                </Text>
                {needFields.map((f) => (
                  <Text key={f.field_key} style={styles.fieldLine}>
                    • {f.label}
                    {f.requiredness === "may_be_requested"
                      ? " (may be requested)"
                      : " (recommended)"}
                  </Text>
                ))}
              </View>
            ) : null}

            <View style={styles.warnCard}>
              <AlertTriangle
                size={18}
                color={colors.emergency}
                strokeWidth={2.2}
              />
              <Text style={styles.warnText}>
                Official sites may ask for login or OTP - we cannot skip those.
                Your {APP_CASE_ID_LABEL} is only a personal notebook number, not
                a government complaint ID.
              </Text>
            </View>

            {/* Official channel */}
            <View style={styles.channelCard}>
              <Text style={styles.label}>Official channel</Text>
              {isFire && isEmergency ? (
                <>
                  <Text style={styles.channelLine}>
                    Call Fire & Rescue - 101
                  </Text>
                  <Text style={styles.desc}>
                    Secondary: open DFS official page if needed.
                  </Text>
                </>
              ) : isFire ? (
                <>
                  <Text style={styles.channelLine} numberOfLines={2}>
                    {filingUrl ?? DFS_COMPLAINT_URL}
                  </Text>
                  <Text style={styles.desc}>
                    Open the official complaint page yourself. This app does not
                    file for you.
                  </Text>
                </>
              ) : (
                <>
                  {phone ? (
                    <Text style={styles.channelLine}>Phone: {phone}</Text>
                  ) : null}
                  {email ? (
                    <Text style={styles.channelLine}>Email: {email}</Text>
                  ) : null}
                  {whatsapp ? (
                    <Text style={styles.channelLine}>
                      WhatsApp: {whatsapp}
                    </Text>
                  ) : null}
                  {filingUrl ? (
                    <Text style={styles.channelLine} numberOfLines={2}>
                      Filing: {filingUrl}
                    </Text>
                  ) : null}
                  {!filingUrl && officialPage ? (
                    <Text style={styles.channelLine} numberOfLines={2}>
                      Website: {officialPage}
                    </Text>
                  ) : null}
                  {!phone && !email && !whatsapp && !filingUrl && !officialPage
                    ? infoEmpty("No verified official channel seeded yet.")
                    : null}
                </>
              )}
            </View>

            {caseId ? (
              <View style={styles.caseCard}>
                <Text style={styles.label}>Your {APP_CASE_ID_LABEL}</Text>
                <Text style={styles.caseId}>{caseId}</Text>
                <Text style={styles.desc}>
                  For your notebook only (like case 1, 2, 3 on your phone). Not
                  a government complaint number. If the office gives you their
                  own reference, you can type it in when you save.
                </Text>
              </View>
            ) : null}

            {/* Primary / secondary CTAs */}
            {isFire && isEmergency ? (
              <>
                <Pressable style={styles.primaryBtn} onPress={callFireRescue}>
                  <Phone size={18} color={colors.white} />
                  <Text style={styles.primaryBtnText}>
                    Call Fire & Rescue - 101
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() =>
                    openOfficialUrl(officialPage ?? DFS_COMPLAINT_URL)
                  }
                >
                  <Globe size={18} color={colors.primaryBlue} />
                  <Text style={styles.secondaryBtnText}>
                    Open DFS Official Page
                  </Text>
                  <ExternalLink size={16} color={colors.primaryBlue} />
                </Pressable>
              </>
            ) : isFire ? (
              <Pressable style={styles.primaryBtn} onPress={openOfficialFiling}>
                <Globe size={18} color={colors.white} />
                <Text style={styles.primaryBtnText}>
                  Open Official Complaint Page
                </Text>
                <ExternalLink size={16} color={colors.white} />
              </Pressable>
            ) : isElectricity && treatAsEmergency ? (
              <>
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() =>
                    redirectAlert(() => {
                      setOpenedChannel(true);
                      void dialNumber("112", "All Emergencies");
                    })
                  }
                >
                  <Phone size={18} color={colors.white} />
                  <Text style={styles.primaryBtnText}>Call 112</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() =>
                    redirectAlert(() => {
                      setOpenedChannel(true);
                      void dialNumber("101", "Fire & Rescue");
                    })
                  }
                >
                  <Phone size={18} color={colors.primaryBlue} />
                  <Text style={styles.secondaryBtnText}>
                    Call 101 - Fire & Rescue
                  </Text>
                </Pressable>
                {discomEmergencyPhone ? (
                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() =>
                      redirectAlert(() => {
                        setOpenedChannel(true);
                        void dialNumber(
                          discomEmergencyPhone,
                          "DISCOM emergency"
                        );
                      })
                    }
                  >
                    <Phone size={18} color={colors.primaryBlue} />
                    <Text style={styles.secondaryBtnText}>
                      Call DISCOM emergency - {discomEmergencyPhone}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : isWaterDrainage && treatAsEmergency ? (
              <>
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() =>
                    redirectAlert(() => {
                      setOpenedChannel(true);
                      void dialNumber("112", "All Emergencies");
                    })
                  }
                >
                  <Phone size={18} color={colors.white} />
                  <Text style={styles.primaryBtnText}>Call 112</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() =>
                    redirectAlert(() => {
                      setOpenedChannel(true);
                      void dialNumber("101", "Fire & Rescue");
                    })
                  }
                >
                  <Phone size={18} color={colors.primaryBlue} />
                  <Text style={styles.secondaryBtnText}>
                    Call 101 - Fire & Rescue
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() =>
                    redirectAlert(() => {
                      setOpenedChannel(true);
                      void dialNumber("102", "Ambulance");
                    })
                  }
                >
                  <Phone size={18} color={colors.primaryBlue} />
                  <Text style={styles.secondaryBtnText}>
                    Call 102 - Ambulance
                  </Text>
                </Pressable>
                {ifcHelplinePhone ? (
                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() =>
                      redirectAlert(() => {
                        setOpenedChannel(true);
                        void dialNumber(
                          ifcHelplinePhone,
                          IFC_WATERLOGGING_HELPLINE.label
                        );
                      })
                    }
                  >
                    <Phone size={18} color={colors.primaryBlue} />
                    <Text style={styles.secondaryBtnText}>
                      Call I&FC waterlogging - {ifcHelplinePhone}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : isWasteGarbage && treatAsEmergency ? (
              <>
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() =>
                    redirectAlert(() => {
                      setOpenedChannel(true);
                      void dialNumber("112", "All Emergencies");
                    })
                  }
                >
                  <Phone size={18} color={colors.white} />
                  <Text style={styles.primaryBtnText}>Call 112</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() =>
                    redirectAlert(() => {
                      setOpenedChannel(true);
                      void dialNumber("101", "Fire & Rescue");
                    })
                  }
                >
                  <Phone size={18} color={colors.primaryBlue} />
                  <Text style={styles.secondaryBtnText}>
                    Call 101 - Fire & Rescue
                  </Text>
                </Pressable>
                {dpccBurningWhatsapp ? (
                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() =>
                      redirectAlert(() => {
                        setOpenedChannel(true);
                        void Linking.openURL(whatsappUrl(dpccBurningWhatsapp));
                      })
                    }
                  >
                    <ExternalLink size={18} color={colors.primaryBlue} />
                    <Text style={styles.secondaryBtnText}>
                      WhatsApp DPCC burning - {dpccBurningWhatsapp}
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() =>
                    redirectAlert(() => {
                      setOpenedChannel(true);
                      void Linking.openURL("https://greendelhi.nic.in/");
                    })
                  }
                >
                  <Globe size={18} color={colors.primaryBlue} />
                  <Text style={styles.secondaryBtnText}>
                    Open Green Delhi (after 112/101)
                  </Text>
                </Pressable>
              </>
            ) : isRoadsPublic && treatAsEmergency ? (
              <>
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() =>
                    redirectAlert(() => {
                      setOpenedChannel(true);
                      void dialNumber("112", "All Emergencies");
                    })
                  }
                >
                  <Phone size={18} color={colors.white} />
                  <Text style={styles.primaryBtnText}>Call 112</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() =>
                    redirectAlert(() => {
                      setOpenedChannel(true);
                      void dialNumber("101", "Fire & Rescue");
                    })
                  }
                >
                  <Phone size={18} color={colors.primaryBlue} />
                  <Text style={styles.secondaryBtnText}>
                    Call 101 - Fire & Rescue
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() =>
                    redirectAlert(() => {
                      setOpenedChannel(true);
                      void dialNumber("1095", "Traffic helpline");
                    })
                  }
                >
                  <Phone size={18} color={colors.primaryBlue} />
                  <Text style={styles.secondaryBtnText}>
                    Call Traffic 1095 (signal / traffic after 112)
                  </Text>
                </Pressable>
              </>
            ) : isEnvironment && treatAsEmergency ? (
              <>
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() =>
                    redirectAlert(() => {
                      setOpenedChannel(true);
                      void dialNumber("112", "All Emergencies");
                    })
                  }
                >
                  <Phone size={18} color={colors.white} />
                  <Text style={styles.primaryBtnText}>Call 112</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() =>
                    redirectAlert(() => {
                      setOpenedChannel(true);
                      void dialNumber("101", "Fire & Rescue");
                    })
                  }
                >
                  <Phone size={18} color={colors.primaryBlue} />
                  <Text style={styles.secondaryBtnText}>
                    Call 101 - Fire & Rescue
                  </Text>
                </Pressable>
                {isTreeWildlifeIssue ? (
                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() =>
                      redirectAlert(() => {
                        setOpenedChannel(true);
                        void dialNumber(
                          FOREST_GREEN_HELPLINE.number,
                          FOREST_GREEN_HELPLINE.label
                        );
                      })
                    }
                  >
                    <Phone size={18} color={colors.primaryBlue} />
                    <Text style={styles.secondaryBtnText}>
                      Call Forest {FOREST_GREEN_HELPLINE.display} (after 112)
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : (isBuilding || isConstruction) && treatAsEmergency ? (
              <>
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() =>
                    redirectAlert(() => {
                      setOpenedChannel(true);
                      void dialNumber(
                        isConstructionFire || authSlug === "delhi_fire_service"
                          ? "101"
                          : "112",
                        isConstructionFire || authSlug === "delhi_fire_service"
                          ? "Fire & Rescue"
                          : "All Emergencies"
                      );
                    })
                  }
                >
                  <Phone size={18} color={colors.white} />
                  <Text style={styles.primaryBtnText}>
                    {isConstructionFire || authSlug === "delhi_fire_service"
                      ? "Call 101 - Fire & Rescue"
                      : "Call 112"}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() =>
                    redirectAlert(() => {
                      setOpenedChannel(true);
                      void dialNumber(
                        isConstructionFire || authSlug === "delhi_fire_service"
                          ? "112"
                          : "101",
                        isConstructionFire || authSlug === "delhi_fire_service"
                          ? "All Emergencies"
                          : "Fire & Rescue"
                      );
                    })
                  }
                >
                  <Phone size={18} color={colors.primaryBlue} />
                  <Text style={styles.secondaryBtnText}>
                    {isConstructionFire || authSlug === "delhi_fire_service"
                      ? "Call 112 - All Emergencies"
                      : "Call 101 - Fire & Rescue"}
                  </Text>
                </Pressable>
              </>
            ) : isBuilding && isApprovalIssue && filingUrl ? (
              <Pressable style={styles.primaryBtn} onPress={openOfficialFiling}>
                <Globe size={18} color={colors.white} />
                <Text style={styles.primaryBtnText}>
                  {buildingApprovalLabel(authSlug)}
                </Text>
                <ExternalLink size={16} color={colors.white} />
              </Pressable>
            ) : filingUrl ? (
              <Pressable style={styles.primaryBtn} onPress={openOfficialFiling}>
                <Globe size={18} color={colors.white} />
                <Text style={styles.primaryBtnText}>
                  {isBuilding
                    ? buildingPrimaryFilingLabel(authSlug)
                    : isConstruction
                      ? "Open Official Channel"
                      : isElectricity
                        ? isElecTheft
                          ? "Open Official Theft Report"
                          : "Open Official Action"
                        : isWaterDrainage || isWasteGarbage || isRoadsPublic || isEnvironment
                          ? "Open Official Complaint"
                          : "Open Official Filing"}
                </Text>
                <ExternalLink size={16} color={colors.white} />
              </Pressable>
            ) : phone &&
              (isBuilding ||
                isConstruction ||
                isElectricity ||
                isWaterDrainage ||
                isWasteGarbage ||
                isRoadsPublic ||
                isEnvironment) ? (
              <Pressable style={styles.primaryBtn} onPress={callOfficial}>
                <Phone size={18} color={colors.white} />
                <Text style={styles.primaryBtnText}>
                  {isLabourIssue || authSlug === "labour_delhi"
                    ? `Call Labour Helpline - ${phone}`
                    : isElectricity ||
                        isWaterDrainage ||
                        isWasteGarbage ||
                        isRoadsPublic ||
                        isEnvironment
                      ? `Call - ${phone}`
                      : `Call Official Number - ${phone}`}
                </Text>
              </Pressable>
            ) : officialPage ? (
              <Pressable
                style={styles.primaryBtn}
                onPress={() => openOfficialUrl(officialPage)}
              >
                <Globe size={18} color={colors.white} />
                <Text style={styles.primaryBtnText}>
                  {authSlug === "delhi_cantonment"
                    ? "Open Cantonment Website"
                    : "Open Official Website"}
                </Text>
                <ExternalLink size={16} color={colors.white} />
              </Pressable>
            ) : null}

            {!isFire &&
            !treatAsEmergency &&
            phone &&
            !(isBuilding && !filingUrl) &&
            !(isConstruction && !filingUrl && !phone) ? (
              <Pressable style={styles.secondaryBtn} onPress={callOfficial}>
                <Phone size={18} color={colors.primaryBlue} />
                <Text style={styles.secondaryBtnText}>
                  Call Official Number - {phone}
                </Text>
              </Pressable>
            ) : null}

            {!isFire &&
            (isBuilding || isConstruction || isElectricity) &&
            !treatAsEmergency &&
            officialPage ? (
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => openOfficialUrl(officialPage)}
              >
                <Globe size={18} color={colors.primaryBlue} />
                <Text style={styles.secondaryBtnText}>Open Official Website</Text>
                <ExternalLink size={16} color={colors.primaryBlue} />
              </Pressable>
            ) : null}

            {isElectricity && !treatAsEmergency && appChannel?.action_url ? (
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => openOfficialUrl(appChannel.action_url!)}
              >
                <Globe size={18} color={colors.primaryBlue} />
                <Text style={styles.secondaryBtnText}>
                  Open Official App - {appChannel.label ?? "App store"}
                </Text>
                <ExternalLink size={16} color={colors.primaryBlue} />
              </Pressable>
            ) : null}

            {isElectricity ? (
              <View style={styles.card}>
                <Text style={styles.label}>YOU MAY NOT KNOW THIS</Text>
                {ELECTRICITY_HIDDEN_KNOWLEDGE.map((card) => (
                  <View key={card.id} style={{ marginTop: 10 }}>
                    <Text style={styles.title}>{card.title}</Text>
                    <Text style={styles.desc}>{card.body}</Text>
                    <Text style={[styles.desc, { marginTop: 4 }]}>
                      {card.actionHint}
                    </Text>
                  </View>
                ))}
                <Pressable
                  style={[styles.secondaryBtn, { marginTop: 12 }]}
                  onPress={() => setShowEscalation((v) => !v)}
                >
                  <Text style={styles.secondaryBtnText}>
                    {showEscalation
                      ? "Hide escalation steps"
                      : "See escalation steps (if unresolved)"}
                  </Text>
                </Pressable>
                {showEscalation ? (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.desc}>
                      1. DISCOM complaint / customer care (first for ordinary
                      outages){"\n"}
                      2. Internal grievance redressal{"\n"}
                      3. CGRF - only when eligible and unresolved{"\n"}
                      4. Electricity Ombudsman - after CGRF where applicable
                      {"\n\n"}
                      Confirm current CGRF / Ombudsman contacts on DERC
                      (derc.gov.in). We do not invent addresses. CGRF is
                      never the first step for ordinary no-supply.
                    </Text>
                    <Pressable
                      style={[styles.secondaryBtn, { marginTop: 8 }]}
                      onPress={() =>
                        openOfficialUrl("https://www.derc.gov.in/")
                      }
                    >
                      <Globe size={18} color={colors.primaryBlue} />
                      <Text style={styles.secondaryBtnText}>
                        Open DERC (escalation info)
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {isWaterDrainage ? (
              <View style={styles.card}>
                <Text style={styles.label}>YOU MAY NOT KNOW THIS</Text>
                {WATER_HIDDEN_KNOWLEDGE.map((card) => (
                  <View key={card.id} style={{ marginTop: 10 }}>
                    <Text style={styles.title}>{card.title}</Text>
                    <Text style={styles.desc}>{card.body}</Text>
                    <Text style={[styles.desc, { marginTop: 4 }]}>
                      {card.actionHint}
                    </Text>
                  </View>
                ))}
                <Pressable
                  style={[styles.secondaryBtn, { marginTop: 12 }]}
                  onPress={() => setShowEscalation((v) => !v)}
                >
                  <Text style={styles.secondaryBtnText}>
                    {showEscalation
                      ? "Hide escalation steps"
                      : "See escalation steps (if unresolved)"}
                  </Text>
                </Pressable>
                {showEscalation ? (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.desc}>
                      1. First-line official channel (DJB 1916 / MCD 155305 /
                      NDMC area contacts / I&FC helpline as applicable){"\n"}
                      2. Keep your official SMS or portal reference{"\n"}
                      3. Area / ZRO contacts from DJB ContactUs.pdf when needed
                      {"\n"}
                      4. Published municipal / utility grievance path if still
                      unresolved{"\n\n"}
                      Escalation is not first for ordinary outages. MD-###### is
                      not an official government reference.
                    </Text>
                    <Pressable
                      style={[styles.secondaryBtn, { marginTop: 8 }]}
                      onPress={() =>
                        openOfficialUrl(
                          "https://djb.gov.in/StaticContent/ContactUs.pdf"
                        )
                      }
                    >
                      <Globe size={18} color={colors.primaryBlue} />
                      <Text style={styles.secondaryBtnText}>
                        Open DJB ContactUs.pdf
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {isWasteGarbage ? (
              <View style={styles.card}>
                <Text style={styles.label}>YOU MAY NOT KNOW THIS</Text>
                {WASTE_HIDDEN_KNOWLEDGE.map((card) => (
                  <View key={card.id} style={{ marginTop: 10 }}>
                    <Text style={styles.title}>{card.title}</Text>
                    <Text style={styles.desc}>{card.body}</Text>
                    <Text style={[styles.desc, { marginTop: 4 }]}>
                      {card.actionHint}
                    </Text>
                  </View>
                ))}
                <Pressable
                  style={[styles.secondaryBtn, { marginTop: 12 }]}
                  onPress={() => setShowEscalation((v) => !v)}
                >
                  <Text style={styles.secondaryBtnText}>
                    {showEscalation
                      ? "Hide escalation steps"
                      : "See escalation steps (if unresolved)"}
                  </Text>
                </Pressable>
                {showEscalation ? (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.desc}>
                      1. First-line official channel (MCD 155305 / MCD311 /
                      NDMC 1533 / Green Delhi / DPCC burning WhatsApp as
                      applicable){"\n"}
                      2. Keep your official portal or call-centre reference
                      {"\n"}
                      3. Published municipal / DPCC grievance path if still
                      unresolved{"\n\n"}
                      Burning fire emergency is never first via WhatsApp - 
                      call 112 / 101. MD-###### is not an official government
                      reference.
                    </Text>
                    <Pressable
                      style={[styles.secondaryBtn, { marginTop: 8 }]}
                      onPress={() =>
                        openOfficialUrl("https://greendelhi.nic.in/")
                      }
                    >
                      <Globe size={18} color={colors.primaryBlue} />
                      <Text style={styles.secondaryBtnText}>
                        Open Green Delhi
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {isRoadsPublic ? (
              <View style={styles.card}>
                <Text style={styles.label}>YOU MAY NOT KNOW THIS</Text>
                {ROADS_HIDDEN_KNOWLEDGE.map((card) => (
                  <View key={card.id} style={{ marginTop: 10 }}>
                    <Text style={styles.title}>{card.title}</Text>
                    <Text style={styles.desc}>{card.body}</Text>
                    <Text style={[styles.desc, { marginTop: 4 }]}>
                      {card.actionHint}
                    </Text>
                  </View>
                ))}
                <Pressable
                  style={[styles.secondaryBtn, { marginTop: 12 }]}
                  onPress={() => setShowEscalation((v) => !v)}
                >
                  <Text style={styles.secondaryBtnText}>
                    {showEscalation
                      ? "Hide escalation steps"
                      : "See escalation steps (if unresolved)"}
                  </Text>
                </Pressable>
                {showEscalation ? (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.desc}>
                      1. First-line official channel (MCD 155305 / MCD311,
                      PWD Sewa 1908, NDMC 1533, DDA grievance, or Traffic
                      1095 as applicable){"\n"}
                      2. Keep your official portal or call-centre reference
                      {"\n"}
                      3. Published grievance path if still unresolved{"\n\n"}
                      Collapse / open manhole / live wire: call 112 / 101
                      first. MD-###### is not an official government
                      reference.
                    </Text>
                    <Pressable
                      style={[styles.secondaryBtn, { marginTop: 8 }]}
                      onPress={() =>
                        openOfficialUrl("https://www.pwddelhi.gov.in/sewa")
                      }
                    >
                      <Globe size={18} color={colors.primaryBlue} />
                      <Text style={styles.secondaryBtnText}>
                        Open PWD Sewa
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {isEnvironment ? (
              <View style={styles.card}>
                <Text style={styles.label}>YOU MAY NOT KNOW THIS</Text>
                {ENVIRONMENT_HIDDEN_KNOWLEDGE.map((card) => (
                  <View key={card.id} style={{ marginTop: 10 }}>
                    <Text style={styles.title}>{card.title}</Text>
                    <Text style={styles.desc}>{card.body}</Text>
                    <Text style={[styles.desc, { marginTop: 4 }]}>
                      {card.actionHint}
                    </Text>
                  </View>
                ))}
                <Pressable
                  style={[styles.secondaryBtn, { marginTop: 12 }]}
                  onPress={() => setShowEscalation((v) => !v)}
                >
                  <Text style={styles.secondaryBtnText}>
                    {showEscalation
                      ? "Hide escalation steps"
                      : "See escalation steps (if unresolved)"}
                  </Text>
                </Pressable>
                {showEscalation ? (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.desc}>
                      1. Specialized channel first (NGMS / Green Delhi /
                      Forest){"\n"}
                      2. Keep the official reference{"\n"}
                      3. CM Jan Sunwai only as a general fallback{"\n\n"}
                      Chemical / fire / falling tree / wildlife danger: call
                      112 / 101 first. MD-###### is not an official
                      government reference.
                    </Text>
                    <Pressable
                      style={[styles.secondaryBtn, { marginTop: 8 }]}
                      onPress={() =>
                        openOfficialUrl(ENVIRONMENT_RIGHTS_SOURCE.cmJanSunwai)
                      }
                    >
                      <Globe size={18} color={colors.primaryBlue} />
                      <Text style={styles.secondaryBtnText}>
                        Open CM Jan Sunwai (fallback)
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {!isFire && !treatAsEmergency && (email || whatsapp || trackingUrl) ? (
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => setShowMoreContacts((v) => !v)}
              >
                <Text style={styles.secondaryBtnText}>
                  {showMoreContacts
                    ? "Hide extra contact options"
                    : "More options (email, WhatsApp, tracking)"}
                </Text>
              </Pressable>
            ) : null}

            {showMoreContacts && !isFire && !treatAsEmergency && email ? (
              <Pressable
                style={styles.secondaryBtn}
                onPress={() =>
                  redirectAlert(() => {
                    void Linking.openURL(`mailto:${email}`).then(() =>
                      setOpenedChannel(true)
                    );
                  })
                }
              >
                <ExternalLink size={18} color={colors.primaryBlue} />
                <Text style={styles.secondaryBtnText}>Email - {email}</Text>
              </Pressable>
            ) : null}

            {showMoreContacts && !isFire && !treatAsEmergency && whatsapp ? (
              <Pressable
                style={styles.secondaryBtn}
                onPress={() =>
                  redirectAlert(() => {
                    void Linking.openURL(whatsappUrl(whatsapp)).then(() =>
                      setOpenedChannel(true)
                    );
                  })
                }
              >
                <ExternalLink size={18} color={colors.primaryBlue} />
                <Text style={styles.secondaryBtnText}>
                  WhatsApp - {whatsapp}
                </Text>
              </Pressable>
            ) : null}

            {showMoreContacts &&
            !isFire &&
            !treatAsEmergency &&
            !isApprovalIssue &&
            trackingUrl ? (
              <Pressable style={styles.secondaryBtn} onPress={openTracking}>
                <ExternalLink size={18} color={colors.primaryBlue} />
                <Text style={styles.secondaryBtnText}>
                  {authSlug === "mcd"
                    ? "Open MCD311 Tracking"
                    : "Open Official Tracking"}
                </Text>
              </Pressable>
            ) : null}

            {/* After return - does NOT auto-mark filed on URL open */}
            {(openedChannel || userConfirmedFiled != null || caseId) && (
              <View style={styles.refBox}>
                <Text style={styles.refTitle}>
                  Save this in your notebook?
                </Text>
                <Text style={styles.desc}>
                  {APP_NAME} only stores your guide notes. It does not create a
                  government complaint. If you already filed and got their
                  number, you can add it below for yourself.
                </Text>
                <View style={styles.refRow}>
                  <Pressable
                    style={[
                      styles.refChip,
                      userConfirmedFiled === true && styles.refChipOn,
                    ]}
                    onPress={() => {
                      setUserConfirmedFiled(true);
                      if (!officialFiledOn) setOfficialFiledOn(todayISODate());
                    }}
                  >
                    <Text
                      style={[
                        styles.refChipText,
                        userConfirmedFiled === true && styles.refChipTextOn,
                      ]}
                    >
                      I contacted them
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.refChip,
                      userConfirmedFiled === false && styles.refChipOn,
                    ]}
                    onPress={() => {
                      setUserConfirmedFiled(false);
                      setOfficialReference(null);
                      setHasOfficialReference(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.refChipText,
                        userConfirmedFiled === false && styles.refChipTextOn,
                      ]}
                    >
                      Just save notes
                    </Text>
                  </Pressable>
                </View>

                {userConfirmedFiled === true ? (
                  <>
                    <Text style={styles.desc}>
                      Optional: paste the reference the office gave you. Leave
                      blank if they did not give one.
                    </Text>
                    <TextInput
                      style={styles.refInput}
                      placeholder="Their reference (optional - yours to keep)"
                      placeholderTextColor={colors.muted}
                      value={officialReference ?? ""}
                      onChangeText={setOfficialReference}
                      autoCapitalize="characters"
                    />
                    <TextInput
                      style={styles.refInput}
                      placeholder="Date you contacted (YYYY-MM-DD, optional)"
                      placeholderTextColor={colors.muted}
                      value={officialFiledOn ?? ""}
                      onChangeText={setOfficialFiledOn}
                    />
                    <Pressable
                      style={styles.continue}
                      disabled={saving}
                      onPress={() => void saveFiling()}
                    >
                      {saving ? (
                        <ActivityIndicator color={colors.white} />
                      ) : (
                        <Text style={styles.continueText}>
                          Save to My Cases
                        </Text>
                      )}
                    </Pressable>
                  </>
                ) : userConfirmedFiled === false ? (
                  <Pressable
                    style={styles.secondaryBtn}
                    disabled={saving}
                    onPress={() => void saveRecordedOnly()}
                  >
                    <Text style={styles.secondaryBtnText}>
                      Save notes in My Cases
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}

            {!openedChannel && userConfirmedFiled == null ? (
              <Pressable
                style={styles.filedBtn}
                onPress={() => setOpenedChannel(true)}
              >
                <Text style={styles.filedBtnText}>
                  I’ve already used the official channel
                </Text>
              </Pressable>
            ) : null}

            {done ? (
              <View style={styles.card}>
                <Text style={styles.label}>Track on official channel</Text>
                {trackingUrl ? (
                  <>
                    <Text style={styles.desc}>
                      Open official tracking and enter your reference manually.
                    </Text>
                    <Pressable
                      style={styles.secondaryBtn}
                      onPress={openTracking}
                    >
                      <ExternalLink size={16} color={colors.primaryBlue} />
                      <Text style={styles.secondaryBtnText}>
                        Open Official Tracking
                      </Text>
                    </Pressable>
                  </>
                ) : phone ? (
                  <Text style={styles.desc}>
                    No verified web tracking URL. Call {phone} with your
                    official reference to check status.
                  </Text>
                ) : (
                  <Text style={styles.desc}>
                    Tracking URL not verified - use the authority’s official
                    channel. Status in My Cases is recorded by you only.
                  </Text>
                )}
                <Pressable style={styles.doneLink} onPress={finish}>
                  <Text style={styles.doneLinkText}>Go to My Cases</Text>
                </Pressable>
              </View>
            ) : null}

            {!isFire && !done ? (
              <View style={styles.card}>
                <Text style={styles.label}>What you have ready</Text>
                {[
                  {
                    key: "issue",
                    label: "Issue identified",
                    ready: Boolean(categoryId && issueTypeSlug),
                  },
                  {
                    key: "photos",
                    label: "Photos / videos",
                    ready: evidence.length > 0,
                  },
                  {
                    key: "location",
                    label: "Location",
                    ready: Boolean(incidentSummary),
                  },
                  {
                    key: "description",
                    label: "Prepared description",
                    ready: Boolean(
                      preparedDescription.trim() || builtDescription
                    ),
                  },
                ].map((c) => (
                  <View key={c.key} style={styles.checkRow}>
                    <View
                      style={[
                        styles.checkDot,
                        c.ready ? styles.checkDotOn : styles.checkDotOff,
                      ]}
                    >
                      {c.ready ? (
                        <Check size={12} color={colors.white} strokeWidth={3} />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.checkText,
                        !c.ready && styles.checkTextMuted,
                      ]}
                    >
                      {c.label}
                      {c.ready ? "" : " - not added yet"}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

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
  backText: { fontSize: 15, fontWeight: "600", color: colors.linkBlue },
  headerCenter: { flex: 1, alignItems: "center", paddingTop: 2 },
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
    marginBottom: 14,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  title: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
  },
  desc: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedDark,
    fontWeight: "500",
  },
  infoSub: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "800",
    color: colors.navy,
  },
  emptyHint: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted,
    fontWeight: "500",
  },
  descInput: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 10,
    fontSize: 13,
    color: colors.navy,
    minHeight: 80,
    textAlignVertical: "top",
  },
  emergencyNote: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: colors.emergency,
  },
  channelCard: {
    borderWidth: 1,
    borderColor: "#C5D8F5",
    backgroundColor: "#F3F8FF",
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
  },
  channelLine: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  checkDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDotOn: { backgroundColor: colors.primaryBlue },
  checkDotOff: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  checkText: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.navy },
  checkTextMuted: { color: colors.muted, fontWeight: "500" },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  copyText: { fontSize: 13, fontWeight: "700", color: colors.primaryBlue },
  fieldLine: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: colors.navy,
    fontWeight: "600",
  },
  warnCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFF5F5",
    borderRadius: radii.lg,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0C7C7",
  },
  warnText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.mutedDark,
    fontWeight: "600",
  },
  caseCard: {
    backgroundColor: colors.lightBlue,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 16,
  },
  caseId: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "800",
    color: colors.primaryBlue,
    letterSpacing: 0.5,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.lg,
    paddingVertical: 16,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.primaryBlue,
    borderRadius: radii.lg,
    paddingVertical: 14,
    marginBottom: 10,
    backgroundColor: colors.white,
  },
  secondaryBtnText: {
    color: colors.primaryBlue,
    fontSize: 14,
    fontWeight: "800",
  },
  filedBtn: {
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colors.navy,
    marginBottom: 12,
  },
  filedBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  refBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 12,
  },
  refTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.navy,
    marginBottom: 10,
  },
  refRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  refChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  refChipOn: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  refChipText: { fontSize: 13, fontWeight: "700", color: colors.navy },
  refChipTextOn: { color: colors.white },
  refInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.navy,
    marginBottom: 12,
  },
  continue: {
    backgroundColor: colors.primaryBlue,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  doneLink: { paddingVertical: 14, alignItems: "center" },
  doneLinkText: {
    color: colors.linkBlue,
    fontSize: 15,
    fontWeight: "800",
  },
});
