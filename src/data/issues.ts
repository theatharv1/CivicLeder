export type IssueCategory =
  | "sanitation"
  | "infrastructure"
  | "safety"
  | "environment";

export type IssueStatus =
  | "In Progress"
  | "Action in Progress"
  | "Resolved"
  | "Closed"
  | "Under Review";

export type Issue = {
  id: string;
  title: string;
  location: string;
  dateLabel: string;
  status: IssueStatus;
  category: IssueCategory;
  description: string;
};

export const ISSUES: Issue[] = [
  {
    id: "1",
    title: "Garbage Overflow",
    location: "North Campus, DU",
    dateLabel: "10 Sep 2024, 04:18 PM",
    status: "In Progress",
    category: "sanitation",
    description:
      "Overflowing municipal bins near the campus gate. Needs urgent clearance.",
  },
  {
    id: "2",
    title: "Street Light Not Working",
    location: "Vishwavidyalaya Metro Gate",
    dateLabel: "5 Sep 2024, 08:30 PM",
    status: "Action in Progress",
    category: "infrastructure",
    description: "Multiple street lights out near the metro exit walkway.",
  },
  {
    id: "3",
    title: "Water Leakage",
    location: "Arts Faculty, DU",
    dateLabel: "28 Aug 2024, 11:12 AM",
    status: "Resolved",
    category: "infrastructure",
    description: "Continuous water leakage from a broken pipeline.",
  },
  {
    id: "4",
    title: "Stray Animals",
    location: "Ridge Road, Delhi",
    dateLabel: "20 Aug 2024, 06:45 PM",
    status: "Closed",
    category: "safety",
    description: "Aggressive stray dogs reported near the evening walk path.",
  },
  {
    id: "5",
    title: "Tree Fallen",
    location: "South Campus, DU",
    dateLabel: "16 Aug 2024, 09:20 AM",
    status: "In Progress",
    category: "environment",
    description: "Fallen tree blocking a campus side road after storms.",
  },
];

export const LOCATIONS = [
  "Delhi",
  "New Delhi",
  "North Delhi",
  "South Delhi",
  "East Delhi",
  "West Delhi",
] as const;

export type AppLocation = (typeof LOCATIONS)[number];
