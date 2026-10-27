import { LoginScreen } from "@/components/auth/LoginScreen";

export const dynamic = "force-dynamic";

export default async function WorkerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; timeout?: string; error?: string; reset?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginScreen
      audience="worker"
      next={params.next}
      timeout={params.timeout === "1"}
      authError={params.error === "auth" || params.error === "host"}
      reset={params.reset === "1"}
    />
  );
}
