import React, { createContext, useContext, useMemo } from "react";

/** App ships English-only for now. */
export type Lang = "en";

const STRINGS = {
  en: {
    explore: "Explore",
    exploreSub: "Discover issues near you and stay informed.",
    searchPlaceholder: "Search issues, areas or keywords...",
    nearby: "Nearby Issues",
    viewAll: "View All →",
    ctaTitle: "See an issue that needs attention?",
    ctaSub: "Help make your community better. Report it now!",
    profile: "Profile",
    profileSub: "Manage your account and preferences.",
    myReports: "My Cases",
    myReportsSub: "Your saved civic issues and official references",
    notifications: "Notifications",
    notificationsSub: "Get updates on your reports",
    language: "Language",
    help: "Help & Support",
    helpSub: "FAQs, contact us",
    about: "About",
    logout: "Log Out",
    all: "All",
    sanitation: "Sanitation",
    infrastructure: "Infrastructure",
    safety: "Safety",
    environment: "Environment",
  },
} as const;

type Dict = { [K in keyof (typeof STRINGS)["en"]]: string };

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dict;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(
    () => ({
      lang: "en" as const,
      setLang: (_lang: Lang) => {
        /* English only for now */
      },
      t: STRINGS.en as Dict,
    }),
    []
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
