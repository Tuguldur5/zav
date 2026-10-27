import {
  Baby,
  Hammer,
  HeartPulse,
  Home,
  MoreHorizontal,
  PaintRoller,
  Sparkles,
  Trees,
  Truck,
  Utensils,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Sparkles,
  Wrench,
  Hammer,
  PaintRoller,
  Truck,
  Baby,
  HeartPulse,
  Home,
  Trees,
  Utensils,
  MoreHorizontal,
};

/** `skills.icon` holds a lucide name; unknown names fall back to a neutral dot. */
export function skillIcon(name: string): LucideIcon {
  return MAP[name] ?? MoreHorizontal;
}
