import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  tableFeatures,
  type FilterFn,
  type RowData,
  type TableFeatures,
} from "@tanstack/react-table";

/**
 * Facet filter: keeps rows whose cell value is one of the selected values.
 * Registered up front so column defs can name it (`filterFn: "inList"`).
 */
const filterFn_inList: FilterFn<TableFeatures, RowData> = (
  row,
  columnId,
  filterValue
) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
  const cell = row.getValue(columnId);
  return filterValue.some((value) => String(value) === String(cell));
};

/** Facet filter for the customers table, matched on the customer's country. */
const filterFn_inCountries: FilterFn<TableFeatures, RowData> = (
  row,
  _columnId,
  filterValue
) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
  const { country } = row.original as { country?: string | null };
  return filterValue.includes(country ?? "");
};

/** Bucket filter for the customers table: does this customer have orders? */
const filterFn_orderCount: FilterFn<TableFeatures, RowData> = (
  row,
  columnId,
  filterValue
) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
  const count = Number(row.getValue(columnId));
  return filterValue.some((value) =>
    value === "with" ? count > 0 : count === 0
  );
};

/** Bucket filter for the products table: stock at or below the reorder level. */
const filterFn_stockLevel: FilterFn<TableFeatures, RowData> = (
  row,
  _columnId,
  filterValue
) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
  const { stock, reorderLevel } = row.original as {
    stock: number;
    reorderLevel: number;
  };
  return filterValue.some((value) =>
    value === "low" ? stock <= reorderLevel : stock > reorderLevel
  );
};

/**
 * Shared feature registry. Every list table builds on this exact object so
 * column defs, filters and sorting are typed identically across pages.
 */
export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    inList: filterFn_inList,
    inCountries: filterFn_inCountries,
    orderCount: filterFn_orderCount,
    stockLevel: filterFn_stockLevel,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
  },
  columnMeta: {} as { align?: "left" | "right" },
});

export type DataTableFeatures = typeof dataTableFeatures;