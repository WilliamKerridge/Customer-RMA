'use client'

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ColumnDef<TData> {
  key: string;
  header: string;
  className?: string;
  render?: (value: unknown, row: TData) => React.ReactNode;
}

interface DataTableProps<TData extends Record<string, unknown>> {
  columns: ColumnDef<TData>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<TData extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data to display.",
  className,
}: DataTableProps<TData>) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border border-grey-200", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-grey-50 border-b border-grey-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-semibold text-grey-600 uppercase tracking-wider whitespace-nowrap",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-grey-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-grey-400 text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "transition-colors duration-100",
                  onRowClick
                    ? "cursor-pointer hover:bg-grey-50 hover:shadow-sm"
                    : "hover:bg-grey-50/50"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-4 py-3 text-cosworth-text", col.className)}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
