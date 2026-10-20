"use client";

import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ReauthAction } from "@/components/app/ReauthAction";
import { transferWorkersAction } from "@/lib/actions/super";
import { inputClass } from "@/components/ui/styles";

type AdminOption = { id: string; full_name: string; load: number };

export function TransferWorkers({ admins }: { admins: AdminOption[] }) {
  const [fromAdmin, setFromAdmin] = useState("");
  const [toAdmin, setToAdmin] = useState("");

  return (
    <Card className="flex flex-col gap-3">
      <p className="flex items-center gap-2 font-semibold">
        <ArrowRightLeft aria-hidden className="size-5 text-primary" />
        Ажилтнууд шилжүүлэх
      </p>
      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Хаанаас
        <select
          value={fromAdmin}
          onChange={(event) => setFromAdmin(event.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Админ сонгоно уу
          </option>
          {admins.map((admin) => (
            <option key={admin.id} value={admin.id}>
              {admin.full_name} ({admin.load} ажилтан)
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Хаашаа
        <select
          value={toAdmin}
          onChange={(event) => setToAdmin(event.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Админ сонгоно уу
          </option>
          {admins.map((admin) => (
            <option key={admin.id} value={admin.id}>
              {admin.full_name} ({admin.load} ажилтан)
            </option>
          ))}
        </select>
      </label>
      <ReauthAction
        label="Ажилтнууд шилжүүлэх"
        variant="outline"
        action={() => transferWorkersAction(fromAdmin || null, toAdmin)}
      />
      <p className="text-[0.8em] text-muted">
        Энэ үйлдэл бүртгэлд өөрчлөлт оруулдаг тул дахин нууц үг асууна.
      </p>
    </Card>
  );
}
