import {
  Ban,
  Briefcase,
  CalendarCheck,
  Check,
  CheckCheck,
  CircleDashed,
  Clock,
  PhoneCall,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  UserX,
  X,
  type LucideIcon,
} from "lucide-react";

export type StatusTone = "primary" | "success" | "warm" | "error" | "neutral";

export type StatusMeta = {
  label: string;
  tone: StatusTone;
  icon: LucideIcon;
};

export const jobStatus: Record<string, StatusMeta> = {
  new: { label: "Шинэ зар", tone: "primary", icon: CircleDashed },
  claimed: { label: "Хүлээж авсан", tone: "primary", icon: Briefcase },
  matched: { label: "Санал болгосон", tone: "warm", icon: Clock },
  confirmed: { label: "Баталгаажсан", tone: "success", icon: CalendarCheck },
  done: { label: "Дууссан", tone: "success", icon: CheckCheck },
  cancelled: { label: "Цуцлагдсан", tone: "error", icon: X },
};

export const assignmentStatus: Record<string, StatusMeta> = {
  offered: { label: "Хариу хүлээж байна", tone: "warm", icon: Clock },
  accepted: { label: "Зөвшөөрсөн", tone: "primary", icon: ThumbsUp },
  declined: { label: "Татгалзсан", tone: "error", icon: ThumbsDown },
  confirmed: { label: "Баталгаажсан", tone: "success", icon: Check },
  completed: { label: "Дууссан", tone: "success", icon: CheckCheck },
  cancelled: { label: "Цуцлагдсан", tone: "error", icon: Ban },
};

export const availabilityStatus: Record<string, StatusMeta> = {
  open: { label: "Чөлөөтэй", tone: "primary", icon: CircleDashed },
  confirmed: { label: "Админ баталгаажуулсан", tone: "success", icon: UserCheck },
  booked: { label: "Ажилтай", tone: "warm", icon: Briefcase },
};

export const profileStatus: Record<string, StatusMeta> = {
  active: { label: "Идэвхтэй", tone: "success", icon: UserCheck },
  pending: { label: "Хүлээгдэж буй", tone: "warm", icon: Clock },
  suspended: { label: "Түр хаагдсан", tone: "error", icon: UserX },
};

export const slotLabels: Record<string, string> = {
  full: "Өдөржин",
  am: "Өглөө",
  pm: "Үдээс хойш",
};

export const answeredViaLabels: Record<string, string> = {
  app: "Аппаас",
  admin_phone: "Админ утсаар",
};

export function statusMeta(status: string, table: Record<string, StatusMeta>): StatusMeta {
  return table[status] ?? { label: status, tone: "neutral", icon: CircleDashed };
}

export const phoneIcon = PhoneCall;
