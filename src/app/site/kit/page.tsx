import { notFound } from "next/navigation";
import { KitDemo } from "./KitDemo";

export const dynamic = "force-dynamic";

export default function KitPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <KitDemo />;
}
