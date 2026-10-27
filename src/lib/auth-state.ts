export type AuthState = {
  error?: string;
  /** Neutral success text (e.g. "reset link sent"), identical for every address. */
  notice?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
  needsConfirm?: boolean;
  role?: "customer" | "worker";
  /** Signed in on the wrong host: the session was closed on this host. */
  hostMismatch?: "customer" | "worker";
};
