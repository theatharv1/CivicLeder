/**
 * Essential Delhi helplines — verified from official directories only.
 * Do not invent numbers. Each row cites a public official source.
 */

export type EssentialNumber = {
  id: string;
  number: string;
  title: string;
  /** One short line — what this number is for. */
  when: string;
  /** Official page the user can open if they want proof. */
  sourceLabel: string;
  sourceUrl: string;
  group: "emergency" | "safety" | "support" | "civic";
};

export const ESSENTIAL_NUMBERS: EssentialNumber[] = [
  {
    id: "112",
    number: "112",
    title: "All emergencies",
    when: "Danger to life, crime in progress, fire, medical emergency.",
    sourceLabel: "ERSS 112",
    sourceUrl: "https://112.gov.in/",
    group: "emergency",
  },
  {
    id: "101",
    number: "101",
    title: "Fire and rescue",
    when: "Fire, smoke, people trapped. Also call 112 if unsure.",
    sourceLabel: "Delhi Fire Service",
    sourceUrl: "https://dfs.delhi.gov.in/",
    group: "emergency",
  },
  {
    id: "102",
    number: "102",
    title: "Ambulance",
    when: "Medical emergency needing ambulance.",
    sourceLabel: "ERSS 112 (ambulance linked)",
    sourceUrl: "https://112.gov.in/",
    group: "emergency",
  },
  {
    id: "1091",
    number: "1091",
    title: "Women in distress (Delhi Police)",
    when: "Women seeking police help or guidance in Delhi.",
    sourceLabel: "Delhi Police telephone directory",
    sourceUrl: "https://delhipolice.gov.in/telephonedirectory",
    group: "safety",
  },
  {
    id: "181",
    number: "181",
    title: "Women helpline (national)",
    when: "24x7 support and referral for women (WCD scheme).",
    sourceLabel: "Ministry of WCD — Women Helpline 181",
    sourceUrl: "https://wcd.gov.in/offerings/women--helpline--scheme",
    group: "safety",
  },
  {
    id: "1098",
    number: "1098",
    title: "Child helpline",
    when: "Child in need of care and protection.",
    sourceLabel: "Childline 1098 (national)",
    sourceUrl: "https://www.childlineindia.org/",
    group: "safety",
  },
  {
    id: "1094",
    number: "1094",
    title: "Missing persons (Delhi Police)",
    when: "Report a missing person in Delhi.",
    sourceLabel: "Delhi Police telephone directory",
    sourceUrl: "https://delhipolice.gov.in/telephonedirectory",
    group: "safety",
  },
  {
    id: "1930",
    number: "1930",
    title: "Cyber complaints",
    when: "Online fraud, cyber crime help (Delhi Police list).",
    sourceLabel: "Delhi Police telephone directory",
    sourceUrl: "https://delhipolice.gov.in/telephonedirectory",
    group: "safety",
  },
  {
    id: "1095",
    number: "1095",
    title: "Traffic helpline",
    when: "Traffic signal, obstruction, traffic police help.",
    sourceLabel: "Delhi Police telephone directory",
    sourceUrl: "https://delhipolice.gov.in/telephonedirectory",
    group: "civic",
  },
  {
    id: "1291",
    number: "1291",
    title: "Senior citizen helpline",
    when: "Elderly person needing Delhi Police assistance.",
    sourceLabel: "Delhi Police telephone directory",
    sourceUrl: "https://delhipolice.gov.in/telephonedirectory",
    group: "civic",
  },
  {
    id: "14416",
    number: "14416",
    title: "Tele-MANAS mental health",
    when: "Free 24x7 counselling. Also 1800-891-4416.",
    sourceLabel: "PIB / MoHFW Tele-MANAS",
    sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=1866498",
    group: "support",
  },
  {
    id: "155305",
    number: "155305",
    title: "MCD citizen call centre",
    when: "Municipal civic issues in MCD areas (confirm your zone).",
    sourceLabel: "MCD Online",
    sourceUrl: "https://mcdonline.nic.in/",
    group: "civic",
  },
];

export const ESSENTIAL_PORTALS: {
  id: string;
  title: string;
  when: string;
  url: string;
  sourceLabel: string;
}[] = [
  {
    id: "lost_report",
    title: "Delhi Police Lost Report",
    when: "Lost document or article in Delhi (not theft). Get a digitally signed report.",
    url: "https://lostfound.delhipolice.gov.in/LostApp/index.aspx",
    sourceLabel: "Delhi Police Lost Report",
  },
  {
    id: "property_theft",
    title: "Property theft e-FIR",
    when: "Property stolen in Delhi. File on the official e-FIR site yourself.",
    url: "https://propertytheft.delhipolice.gov.in/",
    sourceLabel: "Delhi Police Property Theft",
  },
  {
    id: "delhi_police",
    title: "Delhi Police website",
    when: "View FIRs and other citizen services listed by Delhi Police.",
    url: "https://delhipolice.gov.in/",
    sourceLabel: "delhipolice.gov.in",
  },
];
