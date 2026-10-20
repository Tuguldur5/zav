import { notFound } from "next/navigation";
import { StaffKitDemo } from "./StaffKitDemo";

export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false } };

/** Dev-only gallery at /__kit/staff; 404 in production. */
export default function StaffKitPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <StaffKitDemo />;
}
