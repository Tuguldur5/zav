/**
 * Reference data (districts and skills) read through the public PostgREST
 * endpoints with the anon key and kept in Next's data cache for five minutes.
 *
 * These two tables are the site's public catalog: identical rows for every
 * visitor, no personal data, already readable anonymously by RLS. Reading them
 * per staff render costs two Supabase round trips (~200 ms each from a hosted
 * project), which is the largest avoidable part of a staff page's TTFB.
 *
 * `revalidate` rather than a permanent cache: a new district/skill appears
 * within five minutes without a deploy, and any read failure degrades to an
 * empty list exactly like the previous `.from(...)` calls did.
 */
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

export type ReferenceRow = { id: string; name: string };

const REVALIDATE_SECONDS = 300;

async function readTable(table: "districts" | "skills"): Promise<ReferenceRow[]> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id,name`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: REVALIDATE_SECONDS, tags: ["reference-data"] },
    });
    if (!response.ok) return [];
    const rows = (await response.json()) as ReferenceRow[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export async function getDistricts(): Promise<ReferenceRow[]> {
  return readTable("districts");
}

export async function getSkills(): Promise<ReferenceRow[]> {
  return readTable("skills");
}

/** Districts + skills in one cached pair, for pages that need both. */
export async function getReferenceData(): Promise<{
  districts: ReferenceRow[];
  skills: ReferenceRow[];
  districtMap: Map<string, string>;
  skillMap: Map<string, string>;
}> {
  const [districts, skills] = await Promise.all([getDistricts(), getSkills()]);
  return {
    districts,
    skills,
    districtMap: new Map(districts.map((row) => [row.id, row.name])),
    skillMap: new Map(skills.map((row) => [row.id, row.name])),
  };
}
