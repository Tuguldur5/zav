import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "./styles";

export type TableColumn = {
  key: string;
  /** Shown in the desktop header and as the label of each card field on phones. */
  header: string;
  align?: "left" | "right";
  /** Desktop-only column (secondary detail). */
  secondary?: boolean;
  /** When set the header becomes a link that sorts by this column. */
  sortHref?: string;
  /** Marks the column that leads the mobile card. */
  primary?: boolean;
};

export type TableRow = {
  id: string;
  cells: ReactNode[];
  /** Optional row link (desktop row + mobile card title). */
  href?: string;
};

/**
 * From 1024px this renders a real table with a sticky header. Below that the
 * same data renders as stacked cards, so nothing is squeezed or clipped.
 * Columns and cells are plain nodes, so server components can pass them.
 */
export function DataTable({
  columns,
  rows,
  empty,
  selectedIds,
  selectName,
  caption,
}: {
  columns: TableColumn[];
  rows: TableRow[];
  empty?: ReactNode;
  /** Renders a checkbox per row, submitted with the form that contains it. */
  selectedIds?: string[];
  selectName?: string;
  caption?: string;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <>
      <div
        data-staff-table=""
        className="hidden max-h-[72vh] overflow-auto rounded-lg border border-divider bg-surface lg:block"
      >
        <table className="w-full border-collapse text-left">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="sticky top-0 z-10 bg-tint-1">
            <tr>
              {selectName ? <th scope="col" className="w-12 px-3 py-2" /> : null}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cx(
                    "border-b border-divider px-3 py-2 text-[0.8em] font-semibold text-muted whitespace-nowrap",
                    column.align === "right" && "text-right",
                  )}
                >
                  {column.sortHref ? (
                    <Link href={column.sortHref} className="press rounded hover:text-primary">
                      {column.header}
                    </Link>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} data-row="" className="hover:bg-tint-1">
                {selectName ? (
                  <td className="border-b border-divider px-3 py-2 align-middle">
                    <input
                      type="checkbox"
                      name={selectName}
                      value={row.id}
                      defaultChecked={selectedIds?.includes(row.id)}
                      aria-label="Сонгох"
                      className="size-5 accent-[var(--primary)]"
                    />
                  </td>
                ) : null}
                {row.cells.map((cell, index) => (
                  <td
                    key={columns[index]?.key ?? index}
                    className={cx(
                      "border-b border-divider px-3 py-2 align-middle text-[0.9em]",
                      columns[index]?.align === "right" && "text-right",
                    )}
                  >
                    {index === 0 && row.href ? (
                      <Link
                        href={row.href}
                        className="press font-medium text-primary hover:underline"
                      >
                        {cell}
                      </Link>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 lg:hidden" data-staff-cards="">
        {rows.map((row) => (
          <li
            key={row.id}
            data-row=""
            className="rounded-lg border border-divider bg-surface p-4"
          >
            {selectName ? (
              <label className="mb-2 flex items-center gap-2 text-[0.85em] font-medium">
                <input
                  type="checkbox"
                  name={selectName}
                  value={row.id}
                  defaultChecked={selectedIds?.includes(row.id)}
                  className="size-5 accent-[var(--primary)]"
                />
                Сонгох
              </label>
            ) : null}
            <dl className="flex flex-col gap-2">
              {row.cells.map((cell, index) => {
                const column = columns[index];
                if (!column) return null;
                return (
                  <div key={column.key} className="flex flex-col gap-0.5">
                    <dt className="text-[0.75em] font-medium uppercase tracking-wide text-muted">
                      {column.header}
                    </dt>
                    <dd className="text-[0.95em]">
                      {index === 0 && row.href ? (
                        <Link
                          href={row.href}
                          className="press font-medium text-primary hover:underline"
                        >
                          {cell}
                        </Link>
                      ) : (
                        cell
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
