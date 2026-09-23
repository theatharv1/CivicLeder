/**
 * Explore learn cards - plain prevention only.
 * Do not name news incidents in the UI (those inform our design offline).
 */

import type { ReportCategoryId } from "./reportCategories";

export type LearnCategory =
  | "street"
  | "building"
  | "water"
  | "fire"
  | "animals"
  | "rights"
  | "all";

export type LearnCard = {
  id: string;
  category: Exclude<LearnCategory, "all">;
  title: string;
  teaser: string;
  plain: string;
  prevent: string;
  /** Report category to open when user taps Act */
  actCategory?: ReportCategoryId;
  whereLabel?: string;
  whereUrl?: string;
};

export const LEARN_FILTERS: { key: LearnCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "street", label: "Street danger" },
  { key: "water", label: "Water / drain" },
  { key: "building", label: "Buildings" },
  { key: "fire", label: "Fire" },
  { key: "animals", label: "Animals" },
  { key: "rights", label: "Your rights" },
];

export const LEARN_CARDS: LearnCard[] = [
  {
    id: "open_drain",
    category: "street",
    title: "Open drain or uncovered hole",
    teaser: "Report the same day - do not wait for rain.",
    plain:
      "An open storm drain, missing slab, or uncovered manhole is a daily risk for children and anyone walking at night. Rain makes it worse because water hides the hole.",
    prevent:
      "If someone may fall in now - call 112. If it is open but no one is trapped - report to MCD 311 / 155305 (or NDMC 1533 in NDMC areas) with the exact spot. Ask for a cover or barricade.",
    actCategory: "water_drainage",
    whereLabel: "MCD Online / 155305",
    whereUrl: "https://mcdonline.nic.in/",
  },
  {
    id: "wire_in_water",
    category: "street",
    title: "Wire + water on the road",
    teaser: "Stay away. Call emergency first.",
    plain:
      "Live wires in waterlogged streets cause electrocution every monsoon. Do not step into that water, even if it looks shallow.",
    prevent:
      "Call 112 or 101. Keep others back. After you are safe, the electricity company for your area can be contacted - we help you find that path in Report.",
    actCategory: "electricity",
    whereLabel: "Emergency 112",
    whereUrl: "https://112.gov.in/",
  },
  {
    id: "dark_street",
    category: "street",
    title: "Streetlight not working",
    teaser: "Dark roads raise accident risk.",
    plain:
      "A dead streetlight is not only inconvenience - it hides open drains, holes and traffic. Who fixes it depends on who owns the pole (often DISCOM or municipal).",
    prevent:
      "Use Report → Roads or Electricity. Prefer MCD 311 for many colony lights; DISCOM if it is clearly an electricity pole outage.",
    actCategory: "roads_public",
    whereLabel: "MCD 311 / 155305",
    whereUrl: "https://mcdonline.nic.in/",
  },
  {
    id: "pothole_night",
    category: "street",
    title: "Deep pothole on a busy road",
    teaser: "Flag it before someone crashes.",
    plain:
      "Deep potholes cause bike and scooter accidents, especially at night. Road owner may be MCD, PWD or NDMC - not always the same office.",
    prevent:
      "If traffic is in immediate danger - 112. Otherwise Report → Roads and pick the most likely office. Photos from a safe place help when you file on their site.",
    actCategory: "roads_public",
    whereLabel: "PWD / MCD complaint channels",
    whereUrl: "https://www.pwddelhi.gov.in/sewa",
  },
  {
    id: "building_early",
    category: "building",
    title: "Cracks, tilt, or digging under a lived-in building",
    teaser: "Ask for inspection early.",
    plain:
      "Deep new cracks, a tilting wall, heavy vibration, or basement digging while people still live upstairs are danger signs. Extra floors on an old house without a clear approved plan are a common risk pattern.",
    prevent:
      "Danger now - 112 / 101. Otherwise report the address on MCD 311 / 155305 the same day. Do not wait for a collapse.",
    actCategory: "building",
    whereLabel: "MCD Online / 155305",
    whereUrl: "https://mcdonline.nic.in/",
  },
  {
    id: "pg_fire_check",
    category: "building",
    title: "Before renting a PG / hostel",
    teaser: "Ask: exits clear? Fire NOC?",
    plain:
      "Student PGs and hostels should have clear emergency exits and, where required, fire clearance. Locked exits and cooking near stairs are red flags.",
    prevent:
      "Walk the exit path before you pay. If exits are blocked - raise it with the landlord and use Fire / Building report paths. Fire now - call 101.",
    actCategory: "fire_safety",
    whereLabel: "Delhi Fire Service",
    whereUrl: "https://dfs.delhi.gov.in/",
  },
  {
    id: "floors_simple",
    category: "building",
    title: "How many floors are usually allowed?",
    teaser: "Often about four + parking stilt - plan decides.",
    plain:
      "For many house plots, height is about 15 m without parking stilt or about 17.5 m with stilt. That often looks like about four living floors plus a ground parking stilt - your sanctioned plan is what counts.",
    prevent:
      "If a neighbour’s building suddenly grows far taller than the street, ask municipal inspection early via Report → Building.",
    actCategory: "building",
    whereLabel: "DDA building information",
    whereUrl: "https://dda.gov.in/building-laws",
  },
  {
    id: "flood_habits",
    category: "water",
    title: "When water rises on the road",
    teaser: "Never walk or drive into floodwater.",
    plain:
      "Moving water can knock people down. Open drains hide under it. Children playing in rain near open drains is especially dangerous.",
    prevent:
      "Move to higher ground. Keep children indoors. If someone is trapped - 112 / 101 / 102. Then use Report → Water for open drains and waterlogging.",
    actCategory: "water_drainage",
    whereLabel: "Emergency 112",
    whereUrl: "https://112.gov.in/",
  },
  {
    id: "fire_exits",
    category: "fire",
    title: "Blocked fire exit",
    teaser: "Clear the path before you need it.",
    plain:
      "Storage on stairs or a locked emergency door turns a small fire into a trap in shops, PGs and offices.",
    prevent:
      "Report blocked exits early via Fire Safety. In fire: call 101, get out, do not go back for things.",
    actCategory: "fire_safety",
    whereLabel: "Delhi Fire Service",
    whereUrl: "https://dfs.delhi.gov.in/",
  },
  {
    id: "stray_cattle",
    category: "animals",
    title: "Stray cattle on the road",
    teaser: "Common cause of night crashes.",
    plain:
      "Cattle on dark roads cause serious bike and car accidents. Municipal bodies take these complaints on official apps.",
    prevent:
      "If animals are causing immediate danger to traffic - 112. Otherwise Report → Animals and open MCD 311 / 155305 for your area.",
    actCategory: "animals",
    whereLabel: "MCD 311 / 155305",
    whereUrl: "https://mcdonline.nic.in/",
  },
  {
    id: "stray_dogs",
    category: "animals",
    title: "Aggressive stray dogs / sterilisation request",
    teaser: "Use the municipal app - do not confront.",
    plain:
      "MCD 311 accepts stray-dog related requests in many areas, including sterilisation workflows. Do not try to catch or harm animals yourself.",
    prevent:
      "If someone is being attacked - 112. Otherwise Report → Animals → open MCD 311.",
    actCategory: "animals",
    whereLabel: "MCD 311",
    whereUrl: "https://mcdonline.nic.in/",
  },
  {
    id: "right_311",
    category: "rights",
    title: "You can ask for an inspection",
    teaser: "You do not need to be a lawyer.",
    plain:
      "Any resident can ask the municipal body to check an open drain, unsafe building, or stray-animal problem. You are asking for a check - not declaring guilt.",
    prevent:
      "Use Report in this app to prepare, then call or open the official channel yourself. Save their reference in My Cases if they give you one.",
    actCategory: undefined,
    whereLabel: "MCD Online",
    whereUrl: "https://mcdonline.nic.in/",
  },
  {
    id: "right_112",
    category: "rights",
    title: "112 is for danger - use it early",
    teaser: "One number for police, fire, ambulance.",
    plain:
      "If someone may fall into a drain, a building is collapsing, there is fire, or wires are live in water - call 112 (or 101 / 102). Do not start with a website form first.",
    prevent: "Save 112. Teach family: danger first, photos later if safe.",
    whereLabel: "112.gov.in",
    whereUrl: "https://112.gov.in/",
  },
];
