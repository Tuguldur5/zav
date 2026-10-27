import { Smartphone } from "lucide-react";
import { Card } from "./ui";

/** "Нүүр дэлгэцэнд нэмэх" in plain words, in the same card on every worker page. */
export function InstallHint({ compact = false }: { compact?: boolean }) {
  return (
    <Card className="p-5">
      <p className="flex items-center gap-2 font-medium">
        <Smartphone aria-hidden className="size-5 text-primary" strokeWidth={1.75} />
        Нүүр дэлгэцэнд нэмэх
      </p>
      <p className="mt-2 text-[0.9em] text-muted">
        Ингэвэл утсаасаа нэг товчоор нээж, мэдэгдэл авах боломжтой.
      </p>
      <ul className="mt-3 flex flex-col gap-1.5 text-[0.88em] text-muted">
        <li>
          <span className="font-medium text-ink">iPhone:</span> Safari → Share → “Add to Home
          Screen”.
        </li>
        <li>
          <span className="font-medium text-ink">Android:</span> Chrome цэс → “Install app”.
        </li>
      </ul>
      {compact ? null : (
        <p className="mt-3 text-[0.82em] text-muted">
          Мэдэгдэл зөвхөн нүүр дэлгэцэнд нэмсний дараа ажиллана.
        </p>
      )}
    </Card>
  );
}
