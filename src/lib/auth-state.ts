export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
  needsConfirm?: boolean;
  role?: "customer" | "worker";
};
