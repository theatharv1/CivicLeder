/** Verified DFS emergency call fields (official guidance). Used if DB tables missing. */
export type FallbackServiceField = {
  field_key: string;
  label: string;
  description: string | null;
  field_type: string;
  requiredness: "required" | "recommended" | "may_be_requested";
  sort_order: number;
};

export type FallbackAuthorityService = {
  slug: string;
  service_name: string;
  description: string;
  service_type: string;
  official_url: string | null;
  filing_url: string | null;
  tracking_url: string | null;
  phone: string | null;
  integration_type: string;
  authority_slug: string;
  fields: FallbackServiceField[];
};

/** Official DFS non-emergency complaint / grievances page (verified). */
export const DFS_COMPLAINT_URL =
  "https://dfs.delhi.gov.in/dfs/complaint-and-grievances";

const DFS_RECOMMENDED_FIELDS: FallbackServiceField[] = [
  {
    field_key: "caller_name",
    label: "Caller’s name",
    description: "Your name when contacting DFS",
    field_type: "text",
    requiredness: "recommended",
    sort_order: 1,
  },
  {
    field_key: "telephone_number",
    label: "Telephone number",
    description: "Callback number",
    field_type: "phone",
    requiredness: "recommended",
    sort_order: 2,
  },
  {
    field_key: "full_address",
    label: "Address in full",
    description: "Complete address of the concern",
    field_type: "address",
    requiredness: "recommended",
    sort_order: 3,
  },
  {
    field_key: "nearest_landmark",
    label: "Nearest landmark",
    description: "Nearest landmark / main road",
    field_type: "landmark",
    requiredness: "recommended",
    sort_order: 4,
  },
  {
    field_key: "nature_of_emergency",
    label: "Nature of concern",
    description: "Briefly describe the fire safety concern",
    field_type: "long_text",
    requiredness: "recommended",
    sort_order: 5,
  },
];

/** Mirror of seeded dfs_emergency_101 — https://dfs.delhi.gov.in/dfs/history */
export const DFS_EMERGENCY_SERVICE_FALLBACK: FallbackAuthorityService = {
  slug: "dfs_emergency_101",
  service_name: "Fire / rescue emergency (Call 101)",
  description:
    "For active fire, smoke, gas leak, or rescue emergency. Call Delhi Fire Service Control Room 101. This app does not place the call or file for you.",
  service_type: "emergency",
  official_url: "https://dfs.delhi.gov.in/",
  filing_url: null,
  tracking_url: null,
  phone: "101",
  integration_type: "phone",
  authority_slug: "delhi_fire_service",
  fields: DFS_RECOMMENDED_FIELDS,
};

/** Mirror of seeded dfs_complaint_grievances_info with verified filing_url. */
export const DFS_COMPLAINT_SERVICE_FALLBACK: FallbackAuthorityService = {
  slug: "dfs_complaint_grievances_info",
  service_name: "Complaint and Grievances",
  description:
    "Official DFS Complaint and Grievances page. We open this page only — you file yourself.",
  service_type: "grievance",
  official_url: DFS_COMPLAINT_URL,
  filing_url: DFS_COMPLAINT_URL,
  tracking_url: null,
  phone: null,
  integration_type: "deep_link",
  authority_slug: "delhi_fire_service",
  fields: DFS_RECOMMENDED_FIELDS,
};
