"use client";

import * as React from "react";
import {
  flexRender,
  useTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dataTableFeatures, type DataTableFeatures } from "./features";
import DataTableFacetedFilter, {
  type DataTableFacetOption,
} from "./data-table-faceted-filter";
import { tableSearch, type TableInitialState, type TableUrlState } from "./state";

const PAGE_SIZES = [10, 20, 30, 50];

function applyUpdater<T>(updater: Updater<T>, previous: T): T {
  return typeof updater === "function"
    ? (updater as (old: T) => T)(previous)
    : updater;
}

export type DataTableFacet = {
  /** Must match a column id so the filter and the column stay in sync. */
  id: string;
  title: string;
  options: DataTableFacetOption[];
};

/**
 * One column per kind of value (string, number, Date…) shares a single array.
 * The value type is invariant in TanStack's types, so a column set is only
 * expressible with an unconstrained value — the same escape hatch its own
 * `columnHelper.columns()` returns.
 */
export type DataTableColumnDef<TData extends RowData> = ColumnDef<
  DataTableFeatures,
  TData,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>;

type Props<TData extends RowData> = {
  columns: Array<DataTableColumnDef<TData>>;
  data: TData[];
  getRowId: (row: TData) => string;
  /** Parsed from the URL on the server so deep links render the right rows. */
  initial: TableInitialState;
  search: { label: string; placeholder?: string };
  facets?: DataTableFacet[];
  /** Adds the row-selection checkbox column. */
  selectable?: boolean;
  getRowLabel?: (row: TData) => string;
  bulkActions?: (selectedIds: string[], clearSelection: () => void) => React.ReactNode;
};

/**
 * The shadcn data table: TanStack Table behind a sticky-header table that only
 * ever takes up the space left between the top bar and the bottom of the window,
 * with search, sorting, faceted filters, pagination and row selection. State
 * lives here and is mirrored into the URL so any view is linkable.
 */
export default function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  initial,
  search,
  facets = [],
  selectable = false,
  getRowLabel,
  bulkActions,
}: Props<TData>) {
  const [q, setQ] = React.useState(initial.q);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    () => Object.entries(initial.filters).map(([id, value]) => ({ id, value }))
  );
  const [sorting, setSorting] = React.useState<SortingState>(() =>
    initial.sort ? [{ id: initial.sort, desc: initial.dir === "desc" }] : []
  );
  const [pagination, setPagination] = React.useState<PaginationState>(() => ({
    // A stale deep link (?page=9) shouldn't open on an empty page.
    pageIndex: Math.min(
      initial.page - 1,
      Math.max(Math.ceil(data.length / initial.size) - 1, 0)
    ),
    pageSize: initial.size,
  }));
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const sizeLabelId = React.useId();

  const firstPage = React.useCallback(
    () => setPagination((prev) => ({ ...prev, pageIndex: 0 })),
    []
  );

  const tableColumns = React.useMemo<Array<DataTableColumnDef<TData>>>(
    () =>
      selectable
        ? [
            {
              id: "select",
              enableSorting: false,
              enableGlobalFilter: false,
              header: ({ table: instance }) => (
                <Checkbox
                  aria-label="Select all rows on this page"
                  checked={
                    instance.getIsAllPageRowsSelected()
                      ? true
                      : instance.getIsSomePageRowsSelected()
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(checked) =>
                    instance.toggleAllPageRowsSelected(checked === true)
                  }
                />
              ),
              cell: ({ row }) => (
                <Checkbox
                  aria-label={`Select ${getRowLabel?.(row.original) ?? "row"}`}
                  checked={row.getIsSelected()}
                  onCheckedChange={(checked) => row.toggleSelected(checked === true)}
                />
              ),
            } satisfies ColumnDef<DataTableFeatures, TData>,
            ...columns,
          ]
        : columns,
    [columns, getRowLabel, selectable]
  );

  const table = useTable<DataTableFeatures, TData>({
    features: dataTableFeatures,
    data,
    columns: tableColumns,
    getRowId,
    globalFilterFn: "includesString",
    state: { globalFilter: q, columnFilters, sorting, pagination, rowSelection },
    onGlobalFilterChange: (updater) => {
      setQ((prev) => applyUpdater(updater, prev));
      firstPage();
    },
    onColumnFiltersChange: (updater) => {
      setColumnFilters((prev) => applyUpdater(updater, prev));
      firstPage();
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) =>
      setPagination((prev) => applyUpdater(updater, prev)),
    onRowSelectionChange: (updater) =>
      setRowSelection((prev) => applyUpdater(updater, prev)),
  });

  // Keep the address bar in step without re-running the server component.
  const urlState = React.useMemo<TableUrlState>(
    () => ({
      q,
      sort: sorting[0]
        ? { id: sorting[0].id, dir: sorting[0].desc ? "desc" : "asc" }
        : null,
      page: pagination.pageIndex + 1,
      size: pagination.pageSize,
      filters: Object.fromEntries(
        columnFilters.map((filter) => [
          filter.id,
          Array.isArray(filter.value) ? (filter.value as string[]) : [],
        ])
      ),
    }),
    [columnFilters, pagination, q, sorting]
  );

  React.useEffect(() => {
    const search = tableSearch(urlState, window.location.search);
    if (search !== window.location.search) {
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${search}`
      );
    }
  }, [urlState]);

  // Deleting the last rows of the final page must not strand the visitor on an
  // empty one; the table resets the page itself whenever the data changes.
  const pageCount = table.getPageCount();

  const rows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  // Rows deleted elsewhere drop out of the data; don't offer them for bulk work.
  const selectedIds = table
    .getSelectedRowIds()
    .filter((id) => Boolean(table.getRow(id)));

  const facetValue = (id: string) => {
    const filter = columnFilters.find((entry) => entry.id === id);
    return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
  };

  const setFacetValue = (id: string, value: string[]) => {
    setColumnFilters((prev) => {
      const rest = prev.filter((entry) => entry.id !== id);
      return value.length ? [...rest, { id, value }] : rest;
    });
  };

  const hasNarrowing = q.length > 0 || columnFilters.length > 0;
  const clearNarrowing = () => {
    setQ("");
    setColumnFilters([]);
    firstPage();
  };

  const firstRow =
    filteredCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const lastRow =
    filteredCount === 0 ? 0 : Math.min(firstRow + rows.length - 1, filteredCount);

  return (
    <div className="flex min-h-0 flex-col gap-3 lg:flex-1">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <InputGroup className="w-full max-w-64">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={search.placeholder ?? "Search…"}
            aria-label={search.label}
            autoComplete="off"
            spellCheck={false}
          />
          {q && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-xs"
                aria-label="Clear search"
                onClick={() => setQ("")}
              >
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        {facets.map((facet) => (
          <DataTableFacetedFilter
            key={facet.id}
            title={facet.title}
            options={facet.options}
            value={facetValue(facet.id)}
            onChange={(value) => setFacetValue(facet.id, value)}
          />
        ))}

        {hasNarrowing && (
          <Button type="button" variant="ghost" size="sm" onClick={clearNarrowing}>
            Reset
          </Button>
        )}

        {selectedIds.length > 0 && bulkActions && (
          <div className="ml-auto flex items-center gap-2">
            <span role="status" className="text-sm text-muted-foreground">
              {selectedIds.length} selected
            </span>
            {bulkActions(selectedIds, () => setRowSelection({}))}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Clear selection"
              onClick={() => setRowSelection({})}
            >
              <XIcon />
            </Button>
          </div>
        )}
      </div>

      <Card className="flex min-h-0 flex-col overflow-hidden lg:flex-1 [&_[data-slot=table-container]]:min-h-0 [&_[data-slot=table-container]]:min-w-0 [&_[data-slot=table-container]]:max-h-[70svh] [&_[data-slot=table-container]]:overflow-auto lg:[&_[data-slot=table-container]]:max-h-none lg:[&_[data-slot=table-container]]:flex-1">
        <Table className="[&_td]:px-4 [&_th]:px-4">
          <TableHeader className="sticky top-0 z-10 bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={
                      header.column.columnDef.meta?.align === "right"
                        ? "text-right"
                        : undefined
                    }
                    aria-sort={
                      header.column.getCanSort()
                        ? header.column.getIsSorted() === "asc"
                          ? "ascending"
                          : header.column.getIsSorted() === "desc"
                            ? "descending"
                            : "none"
                        : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.columnDef.meta?.align === "right"
                          ? "text-right"
                          : undefined
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllLeafColumns().length}
                  className="h-32 text-center text-muted-foreground"
                >
                  No rows match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div
          data-slot="card-footer"
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-4 py-2"
        >
          <p className="text-sm text-muted-foreground">
            {selectedIds.length > 0
              ? `${selectedIds.length} of ${filteredCount} row${filteredCount === 1 ? "" : "s"} selected`
              : `${firstRow}–${lastRow} of ${filteredCount} row${filteredCount === 1 ? "" : "s"}`}
          </p>

          <div className="flex items-center gap-3">
            <span id={sizeLabelId} className="text-sm text-muted-foreground">
              Rows per page
            </span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) =>
                setPagination({ pageIndex: 0, pageSize: Number(value) })
              }
            >
              <SelectTrigger
                size="sm"
                className="w-16"
                aria-labelledby={sizeLabelId}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <p className="text-sm text-muted-foreground">
              Page {pagination.pageIndex + 1} of {Math.max(pageCount, 1)}
            </p>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="First page"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.firstPage()}
              >
                <ChevronsLeftIcon />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Previous page"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Next page"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                <ChevronRightIcon />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Last page"
                disabled={!table.getCanNextPage()}
                onClick={() => table.lastPage()}
              >
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}