import { SkeletonList } from "@/components/ui/Skeleton";

export default function LoadingJob() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-4">
      <SkeletonList count={4} />
    </main>
  );
}
