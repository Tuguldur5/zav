import { RegisterScreen } from "@/components/auth/RegisterScreen";

export const dynamic = "force-dynamic";

/** The role comes from the host: this route always creates a customer. */
export default async function CustomerRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <RegisterScreen audience="customer" next={params.next} />;
}
