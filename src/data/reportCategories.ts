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
  Trash2,
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

export const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: "building",
    title: "Building",
    description: "Possible building or property issue",
    iconColor: colors.building,
    Icon: Building2,
  },
  {
    id: "fire_safety",
    title: "Fire Safety",
    description: "Fire risk, blocked exit or safety concern",
    iconColor: colors.fire,
    Icon: Flame,
  },
  {
    id: "construction",
    title: "Construction",
    description: "Construction, demolition or site concern",
    iconColor: colors.construction,
    Icon: Construction,
  },
  {
    id: "electricity",
    title: "Electricity",
    description: "Exposed wires, unsafe connection or electrical issue",
    iconColor: colors.electricity,
    Icon: Zap,
  },
  {
    id: "water_drainage",
    title: "Water & Drainage",
    description: "Water supply, sewerage, drainage or waterlogging concern",
    iconColor: colors.water,
    Icon: Droplets,
  },
  {
    id: "waste_garbage",
    title: "Waste & Garbage",
    description: "Garbage, dumping or waste-management issue",
    iconColor: colors.waste,
    Icon: Trash2,
  },
  {
    id: "roads_public",
    title: "Roads & Public Spaces",
    description: "Road, footpath, streetlight or public-space issue",
    iconColor: colors.roads,
    Icon: Route,
  },
  {
    id: "environment",
    title: "Environment",
    description: "Pollution or environmental concern",
    iconColor: colors.environment,
    Icon: Leaf,
  },
  {
    id: "animals",
    title: "Animals",
    description: "Stray cattle, dogs or dead animal on public land",
    iconColor: colors.animals,
    Icon: PawPrint,
  },
  {
    id: "something_else",
    title: "I Don’t See My Issue",
    description: "Search, find an authority, or open a general grievance channel",
    iconColor: colors.more,
    Icon: CircleEllipsis,
    fullWidth: true,
  },
];
