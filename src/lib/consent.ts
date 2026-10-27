/**
 * Version of the published terms/privacy pair. Bump it when the text changes:
 * every customer and worker is then asked to accept the new version again.
 * Keep the same value in `settings.terms_version` (db/05_consent.sql).
 */
export const TERMS_VERSION = "2026-10";

/** Date shown as "Сүүлд шинэчлэгдсэн" on the legal pages. */
export const TERMS_UPDATED_AT = "2026-10-20";

export const CONSENT_KINDS = [
  "terms",
  "privacy",
  "customer_declaration",
  "worker_declaration",
  "phone_check",
] as const;

export type ConsentKind = (typeof CONSENT_KINDS)[number];

/** Kinds a customer accepts at signup and on every order. */
export const CUSTOMER_SIGNUP_KINDS: ConsentKind[] = [
  "terms",
  "privacy",
  "customer_declaration",
];

/** Kinds a worker accepts at signup. */
export const WORKER_SIGNUP_KINDS: ConsentKind[] = [
  "terms",
  "privacy",
  "worker_declaration",
  "phone_check",
];
