import path from "node:path";
import { existsSync } from "node:fs";

/**
 * Optional skill photos. A file named `public/photos/skills/<slug>.jpg` is used
 * when it exists; otherwise the tile falls back to its icon. The check runs on
 * the SERVER only (fs), so the client never guesses which files are there.
 */
const DIR = path.join(process.cwd(), "public", "photos", "skills");

export function skillPhoto(slug: string): string | null {
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) return null;
  try {
    const file = path.join(DIR, `${slug}.jpg`);
    return existsSync(file) ? `/photos/skills/${slug}.jpg` : null;
  } catch {
    // A missing folder during a first build is normal: fall back to the icon.
    return null;
  }
}
