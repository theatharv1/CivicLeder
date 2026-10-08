/**
 * Citizen-facing progress: 4 stages.
 * Category picker (ReportStep1) is OUTSIDE the stepped flow.
 * Photos + Place steps removed — GPS is captured silently when needed.
 * Flow: Problem (2) → Safety (3) → Office (6) → Contact (7).
 */
export type ReportPhaseInfo = {
  phase: number;
  total: number;
  label: string;
  headerLine: string;
};

/** Map internal screen number → simplified phase. */
export function reportPhase(step: number): ReportPhaseInfo {
  if (step <= 2) {
    return {
      phase: 1,
      total: 4,
      label: "Problem",
      headerLine: "1 of 4 · What happened",
    };
  }
  if (step === 3) {
    return {
      phase: 2,
      total: 4,
      label: "Safety",
      headerLine: "2 of 4 · Safety",
    };
  }
  if (step === 6) {
    return {
      phase: 3,
      total: 4,
      label: "Office",
      headerLine: "3 of 4 · Office",
    };
  }
  // Contact (7); legacy photo/place screens map to office if opened
  if (step === 4 || step === 5) {
    return {
      phase: 3,
      total: 4,
      label: "Office",
      headerLine: "3 of 4 · Office",
    };
  }
  return {
    phase: 4,
    total: 4,
    label: "Contact",
    headerLine: "4 of 4 · Contact",
  };
}
