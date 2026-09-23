import React, { createContext, useContext, useMemo, useState } from "react";

export type Lang = "en" | "hi";

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
    myReports: "My Reports",
    myReportsSub: "View and track all your reported issues",
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
  hi: {
    explore: "एक्सप्लोर",
    exploreSub: "आस-पास की समस्याएँ देखें और जानकारी रखें।",
    searchPlaceholder: "समस्या, क्षेत्र या शब्द खोजें...",
    nearby: "आस-पास की समस्याएँ",
    viewAll: "सभी देखें →",
    ctaTitle: "कोई समस्या दिख रही है?",
    ctaSub: "अपने समुदाय को बेहतर बनाएँ। अभी रिपोर्ट करें!",
    profile: "प्रोफ़ाइल",
    profileSub: "अपना खाता और प्राथमिकताएँ प्रबंधित करें।",
    myReports: "मेरी रिपोर्ट्स",
    myReportsSub: "अपनी सभी रिपोर्ट्स देखें और ट्रैक करें",
    notifications: "सूचनाएँ",
    notificationsSub: "अपनी रिपोर्ट्स के अपडेट पाएँ",
    language: "भाषा",
    help: "सहायता",
    helpSub: "प्रश्न, संपर्क",
    about: "परिचय",
    logout: "लॉग आउट",
    all: "सभी",
    sanitation: "स्वच्छता",
    infrastructure: "बुनियादी ढाँचा",
    safety: "सुरक्षा",
    environment: "पर्यावरण",
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
  const [lang, setLang] = useState<Lang>("en");
  const value = useMemo(
    () => ({ lang, setLang, t: STRINGS[lang] }),
    [lang]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
