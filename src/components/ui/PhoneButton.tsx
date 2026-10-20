import { Phone } from "lucide-react";
import { buttonClass, cx } from "./styles";

export function PhoneButton({
  phone,
  label = "Залгах",
  name,
  className,
  full = false,
}: {
  phone: string | null | undefined;
  label?: string;
  name?: string;
  className?: string;
  full?: boolean;
}) {
  if (!phone) {
    return (
      <span className={cx(buttonClass("outline", full), "opacity-60", className)}>
        <Phone aria-hidden className="size-5" />
        Утас байхгүй
      </span>
    );
  }

  const digits = phone.replace(/[^\d+]/g, "");

  return (
    <a
      href={`tel:${digits}`}
      className={cx(buttonClass("tonal", full), className)}
      aria-label={name ? `${name} руу залгах` : `${phone} руу залгах`}
    >
      <Phone aria-hidden className="size-5" />
      {label}
      <span className="text-[0.9em] font-normal opacity-80">{phone}</span>
    </a>
  );
}
