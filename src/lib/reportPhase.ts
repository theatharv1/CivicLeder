/**
 * Citizen-facing progress: 6 clear stages (no jumping).
 * Internal screens still map 1–7; Step 1–2 share “Problem”.
 */
export type ReportPhaseInfo = {
  phase: number;
  total: number;
  label: string;
  headerLine: string;
};

/** Map legacy screen number (1–7) → simplified phase. */
export function reportPhase(step: number): ReportPhaseInfo {
  if (step <= 2) {
    return {
      phase: 1,
      total: 6,
      label: "Problem",
      headerLine: "1 of 6 · What happened",
    };
  }
  if (step === 3) {
    return {
      phase: 2,
      total: 6,
      label: "Safety",
      headerLine: "2 of 6 · Safety check",
    };
  }
  if (step === 4) {
    return {
      phase: 3,
      total: 6,
      label: "Photos",
      headerLine: "3 of 6 · Photos (optional)",
    };
  }
  if (step === 5) {
    return {
      phase: 4,
      total: 6,
      label: "Place",
      headerLine: "4 of 6 · Place (optional)",
    };
  }
  if (step === 6) {
    return {
      phase: 5,
      total: 6,
      label: "Who can help",
      headerLine: "5 of 6 · Most likely office",
    };
  }
  return {
    phase: 6,
    total: 6,
    label: "How to contact",
    headerLine: "6 of 6 · How to reach them",
  };
}
