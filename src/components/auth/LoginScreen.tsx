import { redirect } from "next/navigation";
import { AuthLayout } from "./AuthLayout";
import { UserLoginForm } from "./UserLoginForm";
import { getViewer, isStaffRole, roleHome, safeNextPath } from "@/lib/auth";
import { siteUrl, workerUrl } from "@/lib/hosts";
import { issueFormToken } from "@/lib/auth/form-token";
import { mn } from "@/lib/i18n/mn";

/**
 * One implementation, rendered on the customer host and on the worker host.
 * `next` is honoured only when it is a same-host path the role may open.
 */
export async function LoginScreen({
  audience,
  next,
  timeout,
  authError,
  reset,
}: {
  audience: "customer" | "worker";
  next?: string;
  timeout?: boolean;
  authError?: boolean;
  reset?: boolean;
}) {
  const { user, profile } = await getViewer();
  if (user && profile && profile.status !== "suspended") {
    const onRightHost = isStaffRole(profile.role) ? false : profile.role === audience;
    if (onRightHost) redirect(safeNextPath(next, profile.role) ?? roleHome(profile.role));
  }

  const otherSite =
    audience === "customer"
      ? { href: workerUrl("/"), label: "Ажил хайж байна уу? Ажилтны хэсэг" }
      : { href: siteUrl("/"), label: "Ажил захиалах уу? Захиалагчийн хэсэг" };

  return (
    <AuthLayout
      title={mn.auth.loginTitle}
      lead={mn.auth.loginSubtitle}
    >
      <UserLoginForm
        next={next}
        formToken={issueFormToken()}
        timeout={timeout}
        authError={authError}
        reset={reset}
        otherSite={otherSite}
      />
    </AuthLayout>
  );
}
