import type { TabKey } from "../components/BottomNavigation";
import type { ReportCategoryId } from "../data/reportCategories";

export type RootStackParamList = {
  Main: { screen?: TabKey } | undefined;
  ReportStep1: { category?: ReportCategoryId | null } | undefined;
  ReportStep2: undefined;
  ReportStep3: undefined;
  ReportStep4: undefined;
  ReportStep5: undefined;
  ReportStep6: undefined;
  ReportStep7: undefined;
  IssueRecovery: undefined;
  CaseDetails: { issueId: string };
  AllIssues: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Auth: { mode?: "create" | "signin" } | undefined;
  Notifications: undefined;
  Language: undefined;
  HelpSupport: undefined;
  About: undefined;
  ContributeTip: { categorySlug?: string } | undefined;
  PostPublicAlert: undefined;
};
