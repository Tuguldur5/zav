import { notFound } from "next/navigation";
import { ShellPreview, type ShellVariant } from "./ShellPreview";

export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false } };

const variants: ShellVariant[] = ["public", "customer", "worker", "admin", "super"];

/** Dev-only shell preview at /__kit/shell/<variant>, 404 in production. */
export default async function ShellPreviewPage({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { variant } = await params;
  if (!variants.includes(variant as ShellVariant)) notFound();
  return <ShellPreview kind={variant as ShellVariant} />;
}
