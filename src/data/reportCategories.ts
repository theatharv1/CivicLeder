import type { ComponentType } from "react";
import {
  Building2,
  CircleEllipsis,
  Construction,
  Droplets,
  Flame,
  Leaf,
  PawPrint,
  Route,
  Shield,
  Trash2,
  Venus,
  Zap,
} from "lucide-react-native";
import { colors } from "../theme/tokens";

export type ReportCategoryId =
  | "building"
  | "fire_safety"
  | "construction"
  | "electricity"
  | "water_drainage"
  | "waste_garbage"
  | "roads_public"
  | "environment"
  | "animals"
  | "women_safety"
  | "police_help"
  | "something_else";

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export type ReportCategory = {
  id: ReportCategoryId;
  title: string;
  description: string;
  iconColor: string;
  Icon: ComponentType<IconProps>;
  fullWidth?: boolean;
};

/**
 * Civic + student-critical safety categories.
 * Mental health and general helplines live in Essential Numbers (not here).
 */
export const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: "women_safety",
    title: "Women safety",
    description: "Distress, police help, or support helplines",
    iconColor: colors.emergency,
    Icon: Venus,
  },
  {
    id: "police_help",
    title: "Police and lost items",
    description: "Lost report, theft e-FIR, or cyber helpline",
    iconColor: colors.navy,
    Icon: Shield,
  },
  {
    id: "building",
    title: "Building",
    description: "Unsafe structure or property concern",
    iconColor: colors.building,
    Icon: Building2,
  },
  {
    id: "fire_safety",
    title: "Fire safety",
    description: "Fire risk, blocked exit, or smoke concern",
    iconColor: colors.fire,
    Icon: Flame,
  },
  {
    id: "construction",
    title: "Construction",
    description: "Site, demolition, or dust concern",
    iconColor: colors.construction,
    Icon: Construction,
  },
  {
    id: "electricity",
    title: "Electricity",
    description: "No supply, live wire, bill, or streetlight",
    iconColor: colors.electricity,
    Icon: Zap,
  },
  {
    id: "water_drainage",
    title: "Water and drainage",
    description: "Supply, sewer, drain, or waterlogging",
    iconColor: colors.water,
    Icon: Droplets,
  },
  {
    id: "waste_garbage",
    title: "Waste and garbage",
    description: "Collection, dumping, or burning concern",
    iconColor: colors.waste,
    Icon: Trash2,
  },
  {
    id: "roads_public",
    title: "Roads and public spaces",
    description: "Road, footpath, streetlight, or park issue",
    iconColor: colors.roads,
    Icon: Route,
  },
  {
    id: "environment",
    title: "Environment",
    description: "Air, noise, or pollution concern",
    iconColor: colors.environment,
    Icon: Leaf,
  },
  {
    id: "animals",
    title: "Animals",
    description: "Stray cattle, dogs, or dead animal on public land",
    iconColor: colors.animals,
    Icon: PawPrint,
  },
  {
    id: "something_else",
    title: "I do not see my issue",
    description: "Search or open a general grievance channel",
    iconColor: colors.more,
    Icon: CircleEllipsis,
    fullWidth: true,
  },
];
