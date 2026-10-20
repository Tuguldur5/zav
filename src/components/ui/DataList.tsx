import type { ReactNode } from "react";
import { cx } from "./styles";

export type DataColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export function DataList<T>({
  rows,
  columns,
  renderMobile,
  keyOf,
  caption,
  empty,
}: {
  rows: T[];
  columns: DataColumn<T>[];
  renderMobile: (row: T) => ReactNode;
  keyOf: (row: T) => string;
  caption?: string;
  empty?: ReactNode;
}) {
  if (rows.length === 0) return <>{empty ?? null}</>;

  return (
    <div>
      <div className="hidden overflow-x-auto rounded-lg border border-container bg-surface md:block">
        <table className="w-full border-collapse text-left text-[0.9em]">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="bg-container">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className="px-3 py-2 font-semibold text-ink">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={keyOf(row)} className="border-t border-container align-middle">
                {columns.map((column) => (
                  <td key={column.key} className={cx("px-3 py-2", column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-2 md:hidden">
        {rows.map((row) => (
          <li key={keyOf(row)} className="rounded-lg border border-container bg-surface p-3">
            {renderMobile(row)}
          </li>
        ))}
      </ul>
    </div>
  );
}
