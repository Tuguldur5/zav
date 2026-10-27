import { RegisterScreen } from "@/components/auth/RegisterScreen";

export const dynamic = "force-dynamic";

/** The role comes from the host: this route always creates a worker. */
export default async function WorkerRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <RegisterScreen audience="worker" next={params.next} />;
}
