import { cookies } from "next/headers";

/**
 * Marks the browser that just followed a recovery link. `/reset-password` and
 * the reset action both require it, so a signed-in session alone (a worker
 * leaving a kiosk browser open, say) can never be used to set a new password
 * without knowing the old one. Fifteen minutes is one password change.
 */
export const RECOVERY_COOKIE = "zav_recovery";
const RECOVERY_AGE_S = 15 * 60;

export function recoveryCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: RECOVERY_AGE_S,
  };
}

/** Server components and actions: is this browser mid-recovery? */
export async function hasRecoveryCookie(): Promise<boolean> {
  const store = await cookies();
  return store.get(RECOVERY_COOKIE)?.value === "1";
}

export async function clearRecoveryCookie(): Promise<void> {
  const store = await cookies();
  store.delete(RECOVERY_COOKIE);
}
