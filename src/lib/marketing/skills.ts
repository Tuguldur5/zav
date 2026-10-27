import {
  AppWindow,
  Baby,
  Hammer,
  HeartPulse,
  Home,
  Layers,
  MoreHorizontal,
  PaintRoller,
  Snowflake,
  Sparkles,
  Trees,
  Truck,
  Utensils,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Skill } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

/**
 * Static presentation for a catalog skill: a filename-safe slug (used for the
 * optional photo), one line of Mongolian and an icon. The DATABASE stays the
 * source of truth for which skills exist, their order and their flags; this
 * dictionary only decides how a known name looks. Unknown names get a
 * neutral fallback, so a skill added in /super/catalog still renders.
 */
export type SkillLook = {
  slug: string;
  description: string;
  icon: LucideIcon;
};

const FALLBACK: SkillLook = {
  slug: "service",
  description: "Энэ төрлийн ажилд тохирох ажилтныг админ олно.",
  icon: Wrench,
};

const BY_NAME: Record<string, SkillLook> = {
  Цэвэрлэгээ: {
    slug: "cleaning",
    description: "Орон сууц, оффисыг бүрэн цэвэрлэнэ.",
    icon: Sparkles,
  },
  "Цонх угаалга": {
    slug: "window-washing",
    description: "Цонх, шилэн хаалгыг угааж цэвэрлэнэ.",
    icon: AppWindow,
  },
  "Хивс ба зөөлөн эдлэл угаалга": {
    slug: "carpet-cleaning",
    description: "Хивс, буйдан, машины суудлыг угаана.",
    icon: Layers,
  },
  "Нүүлгэлт, ачаа зөөлт": {
    slug: "moving",
    description: "Ачааг буулгаж, шинэ хаяг руу зөөнө.",
    icon: Truck,
  },
  "Тавилга угсралт": {
    slug: "furniture-assembly",
    description: "Шкаф, ор, тавилгыг угсарч суулгана.",
    icon: Hammer,
  },
  "Жижиг засвар": {
    slug: "small-repairs",
    description: "Ус, цахилгаан, хаалга зэргийн жижиг засвар.",
    icon: Wrench,
  },
  "Будалт, засал": {
    slug: "painting",
    description: "Хана будаж, өнгөлгөө хийнэ.",
    icon: PaintRoller,
  },
  "Хашаа, цэцэрлэг": {
    slug: "yard-garden",
    description: "Хашаа засаж, цэцэрлэгийг арчилна.",
    icon: Trees,
  },
  "Цас цэвэрлэх, нүүрс, түлээ ажил": {
    slug: "snow-and-fuel",
    description: "Цас, нүүрс, түлээ зөөх хүнд ажил.",
    icon: Snowflake,
  },
  "Арга хэмжээний туслах (зөөгч)": {
    slug: "event-help",
    description: "Хурим, арга хэмжээнд зөөгчөөр ажиллана.",
    icon: Utensils,
  },
  Бусад: {
    slug: "other",
    description: "Жагсаалтад байхгүй ажлаа бичээрэй.",
    icon: MoreHorizontal,
  },

  // Names kept for existing jobs (older catalog).
  "Засвар үйлчилгээ": {
    slug: "repair",
    description: "Гэрийн жижиг засвар, үйлчилгээ.",
    icon: Wrench,
  },
  "Барилга засал чимэглэл": {
    slug: "renovation",
    description: "Өрөө будаж, засаж чимнэ.",
    icon: PaintRoller,
  },
  "Ачаа тээвэр нүүлгэлт": {
    slug: "moving",
    description: "Ачаа зөөж, нүүлгэлт хийнэ.",
    icon: Truck,
  },
  "Гэр ахуйн туслах": {
    slug: "home-help",
    description: "Гэрийн ажилд туслана.",
    icon: Home,
  },
  "Хашаа цэцэрлэг": {
    slug: "yard-garden",
    description: "Хашаа, цэцэрлэгийн ажил.",
    icon: Trees,
  },
  "Зөөгч үйлчилгээ": {
    slug: "event-help",
    description: "Арга хэмжээнд зөөгчөөр ажиллана.",
    icon: Utensils,
  },
  "Хүүхэд харах": {
    slug: "childcare",
    description: "Хүүхэд харах ажил.",
    icon: Baby,
  },
  "Өвчтөн өтөгчид асрах": {
    slug: "care",
    description: "Өвчтөн, өтөгчид асрах ажил.",
    icon: HeartPulse,
  },
};

/**
 * Names that must never reach a public catalog, even before the `sensitive`
 * column exists in a fresh database (db/09_skills.sql adds it).
 */
const SENSITIVE_NAMES = new Set(["Хүүхэд харах", "Өвчтөн өтөгчид асрах"]);

export function lookOf(skill: Pick<Skill, "name">): SkillLook {
  return BY_NAME[skill.name] ?? FALLBACK;
}

/** Active and not sensitive — the only skills marketing and the wizard show. */
export function isPublicSkill(skill: Skill): boolean {
  if (skill.active === false) return false;
  if (skill.sensitive === true) return false;
  return !SENSITIVE_NAMES.has(skill.name);
}

export function publicSkills(skills: Skill[]): Skill[] {
  return skills.filter(isPublicSkill);
}

export function isSensitiveName(name: string): boolean {
  return SENSITIVE_NAMES.has(name);
}

export async function loadPublicSkills(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const current = await supabase
    .from("skills")
    .select("id, name, icon, sort_order, active, sensitive")
    .eq("active", true)
    .eq("sensitive", false)
    .order("sort_order");

  if (!current.error) {
    return {
      skills: publicSkills((current.data as Skill[] | null) ?? []),
      error: null,
    };
  }

  if (current.error.code !== "42703") {
    return { skills: [] as Skill[], error: current.error };
  }

  console.warn(
    "skills.sensitive is not available; apply db/09_skills.sql to enable the public skill filter.",
  );
  const legacy = await supabase
    .from("skills")
    .select("id, name, icon, sort_order, active")
    .eq("active", true)
    .order("sort_order");
  if (legacy.error) return { skills: [] as Skill[], error: legacy.error };

  return {
    skills: publicSkills((legacy.data as Skill[] | null) ?? []),
    error: null,
  };
}
