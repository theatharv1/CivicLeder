import React, { createContext, useContext, useMemo, useState } from "react";
import type { PropertyContext } from "../data/buildingKnowledge";
import type { ElectricityProviderHint } from "../data/electricityKnowledge";
import type { WaterJurisdictionHint } from "../data/waterDrainageKnowledge";
import type { WasteJurisdictionHint } from "../data/wasteGarbageKnowledge";
import type {
  RoadsAssetHint,
  RoadsJurisdictionHint,
} from "../data/roadsPublicSpacesKnowledge";
import type { EnvironmentJurisdictionHint } from "../data/environmentKnowledge";
import type { ReportCategoryId } from "../data/reportCategories";
import type { EvidenceItem } from "../lib/reportEvidence";
import type { EmergencyResult } from "../lib/reportEmergency";

export type EmergencyChoice = "yes" | "no" | "not_sure" | null;

export type JurisdictionStatus = "unknown" | "probable" | "verified";

export type { PropertyContext };
export type { ElectricityProviderHint };
export type { WaterJurisdictionHint };
export type { WasteJurisdictionHint };
export type { RoadsJurisdictionHint };
export type { RoadsAssetHint };
export type { EnvironmentJurisdictionHint };

/** How the incident location was captured (never invent). */
export type LocationSource =
  | "current_gps"
  | "map_selected"
  | "manually_entered"
  | "photo_metadata"
  | "unknown";

/** Device GPS at capture time — NOT the same as incident location. */
export type CurrentLocationDraft = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  addressText: string | null;
  capturedAt: string;
};

/**
 * Incident location fields (optional).
 * `latitude`/`longitude`/`addressText`/`landmark` are the incident values
 * used by filing pack screens — separate from `currentLocation`.
 */
export type ReportLocationDraft = {
  latitude: number | null;
  longitude: number | null;
  addressText: string | null;
  landmark: string;
  building: string;
  street: string;
  locality: string;
  city: string;
  state: string;
  postal: string;
  country: string;
  accuracyMeters: number | null;
  jurisdictionStatus: JurisdictionStatus;
  addLocationOnPhoto: boolean;
  currentLocation: CurrentLocationDraft | null;
  locationSource: LocationSource;
  locationCapturedAt: string | null;
};

export type SelectedAuthorityDraft = {
  slug: string;
  name: string;
  confidence: "likely" | "possible" | "needs_confirmation";
  needsConfirmation: boolean;
};

type ReportDraft = {
  draftKey: string;
  categoryId: ReportCategoryId | null;
  setCategoryId: (id: ReportCategoryId | null) => void;
  issueTypeSlug: string | null;
  setIssueTypeSlug: (slug: string | null) => void;
  emergencyChoice: EmergencyChoice;
  setEmergencyChoice: (choice: EmergencyChoice) => void;
  emergencyResult: EmergencyResult | null;
  setEmergencyResult: (result: EmergencyResult | null) => void;
  evidence: EvidenceItem[];
  setEvidence: (items: EvidenceItem[]) => void;
  addEvidence: (item: EvidenceItem) => void;
  removeEvidence: (id: string) => void;
  locationDraft: ReportLocationDraft;
  setLocationDraft: (patch: Partial<ReportLocationDraft>) => void;
  selectedAuthority: SelectedAuthorityDraft | null;
  setSelectedAuthority: (a: SelectedAuthorityDraft | null) => void;
  /** Optional citizen hint for Building jurisdiction — not GPS proof. */
  propertyContext: PropertyContext;
  setPropertyContext: (ctx: PropertyContext) => void;
  /** Optional citizen DISCOM hint for Electricity — never GPS proof. */
  electricityProviderHint: ElectricityProviderHint;
  setElectricityProviderHint: (hint: ElectricityProviderHint) => void;
  /** Optional citizen water/drainage jurisdiction hint — never GPS proof. */
  waterJurisdictionHint: WaterJurisdictionHint;
  setWaterJurisdictionHint: (hint: WaterJurisdictionHint) => void;
  /** Optional citizen waste jurisdiction hint — never GPS proof. */
  wasteJurisdictionHint: WasteJurisdictionHint;
  setWasteJurisdictionHint: (hint: WasteJurisdictionHint) => void;
  /** Optional citizen roads jurisdiction hint — never GPS proof. */
  roadsJurisdictionHint: RoadsJurisdictionHint;
  setRoadsJurisdictionHint: (hint: RoadsJurisdictionHint) => void;
  /** Optional citizen roads asset hint — never GPS proof. */
  roadsAssetHint: RoadsAssetHint;
  setRoadsAssetHint: (hint: RoadsAssetHint) => void;
  /** Optional citizen environment jurisdiction hint — never GPS proof. */
  environmentJurisdictionHint: EnvironmentJurisdictionHint;
  setEnvironmentJurisdictionHint: (hint: EnvironmentJurisdictionHint) => void;
  caseId: string | null;
  setCaseId: (id: string | null) => void;
  reportDbId: string | null;
  setReportDbId: (id: string | null) => void;
  officialReference: string | null;
  setOfficialReference: (ref: string | null) => void;
  hasOfficialReference: boolean | null;
  setHasOfficialReference: (v: boolean | null) => void;
  userConfirmedFiled: boolean | null;
  setUserConfirmedFiled: (v: boolean | null) => void;
  officialFiledOn: string | null;
  setOfficialFiledOn: (d: string | null) => void;
  preparedDescription: string;
  setPreparedDescription: (t: string) => void;
  reset: () => void;
};

const defaultLocation = (): ReportLocationDraft => ({
  latitude: null,
  longitude: null,
  addressText: null,
  landmark: "",
  building: "",
  street: "",
  locality: "",
  city: "",
  state: "",
  postal: "",
  country: "",
  accuracyMeters: null,
  jurisdictionStatus: "unknown",
  addLocationOnPhoto: true,
  currentLocation: null,
  locationSource: "unknown",
  locationCapturedAt: null,
});

function newDraftKey(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const ReportDraftContext = createContext<ReportDraft | null>(null);

export function ReportDraftProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [draftKey, setDraftKey] = useState(newDraftKey);
  const [categoryId, setCategoryIdState] = useState<ReportCategoryId | null>(
    null
  );
  const [issueTypeSlug, setIssueTypeSlug] = useState<string | null>(null);
  const [emergencyChoice, setEmergencyChoice] =
    useState<EmergencyChoice>(null);
  const [emergencyResult, setEmergencyResult] =
    useState<EmergencyResult | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [locationDraft, setLocationDraftState] =
    useState<ReportLocationDraft>(defaultLocation);
  const [selectedAuthority, setSelectedAuthority] =
    useState<SelectedAuthorityDraft | null>(null);
  const [propertyContext, setPropertyContext] =
    useState<PropertyContext>(null);
  const [electricityProviderHint, setElectricityProviderHint] =
    useState<ElectricityProviderHint>(null);
  const [waterJurisdictionHint, setWaterJurisdictionHint] =
    useState<WaterJurisdictionHint>(null);
  const [wasteJurisdictionHint, setWasteJurisdictionHint] =
    useState<WasteJurisdictionHint>(null);
  const [roadsJurisdictionHint, setRoadsJurisdictionHint] =
    useState<RoadsJurisdictionHint>(null);
  const [roadsAssetHint, setRoadsAssetHint] = useState<RoadsAssetHint>(null);
  const [environmentJurisdictionHint, setEnvironmentJurisdictionHint] =
    useState<EnvironmentJurisdictionHint>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [reportDbId, setReportDbId] = useState<string | null>(null);
  const [officialReference, setOfficialReference] = useState<string | null>(
    null
  );
  const [hasOfficialReference, setHasOfficialReference] = useState<
    boolean | null
  >(null);
  const [userConfirmedFiled, setUserConfirmedFiled] = useState<boolean | null>(
    null
  );
  const [officialFiledOn, setOfficialFiledOn] = useState<string | null>(null);
  const [preparedDescription, setPreparedDescription] = useState("");

  /** Changing category must drop the previous issue/office/hints or labels mix. */
  const setCategoryId = (id: ReportCategoryId | null) => {
    setCategoryIdState((prev) => {
      if (prev === id) return prev;
      setIssueTypeSlug(null);
      setEmergencyChoice(null);
      setEmergencyResult(null);
      setSelectedAuthority(null);
      setPropertyContext(null);
      setElectricityProviderHint(null);
      setWaterJurisdictionHint(null);
      setWasteJurisdictionHint(null);
      setRoadsJurisdictionHint(null);
      setRoadsAssetHint(null);
      setEnvironmentJurisdictionHint(null);
      setPreparedDescription("");
      return id;
    });
  };

  const value = useMemo(
    () => ({
      draftKey,
      categoryId,
      setCategoryId,
      issueTypeSlug,
      setIssueTypeSlug,
      emergencyChoice,
      setEmergencyChoice,
      emergencyResult,
      setEmergencyResult,
      evidence,
      setEvidence,
      addEvidence: (item: EvidenceItem) =>
        setEvidence((prev) => [...prev, item]),
      removeEvidence: (id: string) =>
        setEvidence((prev) => prev.filter((e) => e.id !== id)),
      locationDraft,
      setLocationDraft: (patch: Partial<ReportLocationDraft>) =>
        setLocationDraftState((prev) => ({ ...prev, ...patch })),
      selectedAuthority,
      setSelectedAuthority,
      propertyContext,
      setPropertyContext,
      electricityProviderHint,
      setElectricityProviderHint,
      waterJurisdictionHint,
      setWaterJurisdictionHint,
      wasteJurisdictionHint,
      setWasteJurisdictionHint,
      roadsJurisdictionHint,
      setRoadsJurisdictionHint,
      roadsAssetHint,
      setRoadsAssetHint,
      environmentJurisdictionHint,
      setEnvironmentJurisdictionHint,
      caseId,
      setCaseId,
      reportDbId,
      setReportDbId,
      officialReference,
      setOfficialReference,
      hasOfficialReference,
      setHasOfficialReference,
      userConfirmedFiled,
      setUserConfirmedFiled,
      officialFiledOn,
      setOfficialFiledOn,
      preparedDescription,
      setPreparedDescription,
      reset: () => {
        setDraftKey(newDraftKey());
        setCategoryId(null);
        setIssueTypeSlug(null);
        setEmergencyChoice(null);
        setEmergencyResult(null);
        setEvidence([]);
        setLocationDraftState(defaultLocation());
        setSelectedAuthority(null);
        setPropertyContext(null);
        setElectricityProviderHint(null);
        setWaterJurisdictionHint(null);
        setWasteJurisdictionHint(null);
        setRoadsJurisdictionHint(null);
        setRoadsAssetHint(null);
        setEnvironmentJurisdictionHint(null);
        setCaseId(null);
        setReportDbId(null);
        setOfficialReference(null);
        setHasOfficialReference(null);
        setUserConfirmedFiled(null);
        setOfficialFiledOn(null);
        setPreparedDescription("");
      },
    }),
    [
      draftKey,
      categoryId,
      issueTypeSlug,
      emergencyChoice,
      emergencyResult,
      evidence,
      locationDraft,
      selectedAuthority,
      propertyContext,
      electricityProviderHint,
      waterJurisdictionHint,
      wasteJurisdictionHint,
      roadsJurisdictionHint,
      roadsAssetHint,
      environmentJurisdictionHint,
      caseId,
      reportDbId,
      officialReference,
      hasOfficialReference,
      userConfirmedFiled,
      officialFiledOn,
      preparedDescription,
    ]
  );

  return (
    <ReportDraftContext.Provider value={value}>
      {children}
    </ReportDraftContext.Provider>
  );
}

export function useReportDraft() {
  const ctx = useContext(ReportDraftContext);
  if (!ctx) {
    throw new Error("useReportDraft must be used within ReportDraftProvider");
  }
  return ctx;
}

function isPlausibleIndiaPlace(text: string): boolean {
  const t = text.toLowerCase();
  if (
    t.includes("san francisco") ||
    t.includes("california") ||
    t.includes("united states") ||
    t.includes(", ca,") ||
    t.includes(", ca ") ||
    t.endsWith(", ca")
  ) {
    return false;
  }
  return true;
}

/** Human-readable incident location line (optional fields). */
export function formatIncidentLocationSummary(
  loc: ReportLocationDraft
): string | null {
  const parts = [
    loc.addressText,
    loc.building,
    loc.street,
    loc.landmark,
    loc.locality,
    loc.city,
    loc.state,
    loc.postal,
    loc.country,
  ].filter((p) => Boolean(p && String(p).trim() && isPlausibleIndiaPlace(String(p))));
  if (parts.length) return parts.join(", ");
  // Don't show raw coords from outside India (simulator defaults).
  if (
    loc.latitude != null &&
    loc.longitude != null &&
    loc.latitude >= 6.5 &&
    loc.latitude <= 37.5 &&
    loc.longitude >= 68 &&
    loc.longitude <= 97.5
  ) {
    return `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
  }
  return null;
}

export function hasIncidentLocation(loc: ReportLocationDraft): boolean {
  return Boolean(formatIncidentLocationSummary(loc));
}
