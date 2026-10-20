import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-5 py-10">
      <p className="text-[0.9em] font-semibold text-muted">404</p>
      <h1 className="text-[1.35em] font-semibold">Хуудас олдсонгүй</h1>
      <p className="text-muted">Таны хайсан хуудас байхгүй эсвэл шилжсэн байна.</p>
      <Link
        href="/"
        className="press flex min-h-[var(--control-h)] w-fit items-center rounded-md bg-primary px-5 font-medium text-on-primary"
      >
        Нүүр хуудас руу
      </Link>
    </main>
  );
}
