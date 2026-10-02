"use client";

import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataTable, {
  type DataTableFacet,
} from "@/components/data-table/data-table";
import DataTableColumnHeader from "@/components/data-table/data-table-column-header";
import type { DataTableFeatures } from "@/components/data-table/features";
import type { TableInitialState } from "@/components/data-table/state";
import DeleteButton from "@/components/delete-button";
import { bulkDeleteProducts, deleteProduct } from "@/actions";

export type ProductRow = {
  id: string;
  sku: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  reorderLevel: number;
  active: boolean;
};

const columnHelper = createColumnHelper<DataTableFeatures, ProductRow>();

function buildColumns(currency: string) {
  return [
  columnHelper.accessor("sku", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
    sortFn: "alphanumeric",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground" translate="no">
        {getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("name", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    sortFn: "alphanumeric",
    cell: ({ row, getValue }) => (
      <Link
        href={`/products/${row.original.id}`}
        transitionTypes={["nav-forward"]}
        className="block max-w-56 truncate font-medium text-primary hover:underline"
        title={getValue()}
      >
        {getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("price", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Price" className="ml-auto" />
    ),
    sortFn: "basic",
    meta: { align: "right" },
    cell: ({ getValue }) => <span className="tabular-nums">{formatCurrency(getValue(), currency)}</span>,
  }),
  columnHelper.accessor("cost", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cost" className="ml-auto" />
    ),
    sortFn: "basic",
    meta: { align: "right" },
    cell: ({ getValue }) => (
      <span className="tabular-nums text-muted-foreground">
        {formatCurrency(getValue(), currency)}
      </span>
    ),
  }),
  columnHelper.accessor(
    (row) => (row.price > 0 ? ((row.price - row.cost) / row.price) * 100 : 0),
    {
      id: "margin",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Margin" className="ml-auto" />
      ),
      sortFn: "basic",
      meta: { align: "right" },
      cell: ({ getValue }) => (
        <span className="tabular-nums">{getValue().toFixed(0)}%</span>
      ),
    }
  ),
  columnHelper.accessor("stock", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" />,
    sortFn: "basic",
    filterFn: "stockLevel",
    cell: ({ row, getValue }) => (
      <Badge
        variant={getValue() <= row.original.reorderLevel ? "destructive" : "secondary"}
        className="tabular-nums"
      >
        {getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor((row) => (row.active ? "active" : "inactive"), {
    id: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    sortFn: "alphanumeric",
    filterFn: "inList",
    cell: ({ getValue }) => (
      <Badge
        variant="outline"
        className={
          getValue() === "active"
            ? "bg-success/10 text-success"
            : "bg-muted text-muted-foreground"
        }
      >
        {getValue() === "active" ? "Active" : "Inactive"}
      </Badge>
    ),
  }),
  columnHelper.display({
    id: "actions",
    enableSorting: false,
    enableGlobalFilter: false,
    meta: { align: "right" },
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <Button asChild variant="outline">
          <Link
            href={`/products/${row.original.id}`}
            transitionTypes={["nav-forward"]}
          >
            Edit
          </Link>
        </Button>
        <DeleteButton
          action={deleteProduct.bind(null, row.original.id)}
          confirmText={`Delete ${row.original.name}?`}
        />
      </div>
    ),
  }),
  ];
}

const facets: DataTableFacet[] = [
  {
    id: "status",
    title: "Status",
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
  },
  {
    id: "stock",
    title: "Stock",
    options: [
      { label: "In stock", value: "ok" },
      { label: "Low stock", value: "low" },
    ],
  },
];

export default function ProductsTable({
  data,
  initial,
  currency,
}: {
  data: ProductRow[];
  initial: TableInitialState;
  currency: string;
}) {
  return (
    <DataTable
      columns={buildColumns(currency)}
      data={data}
      getRowId={(row) => row.id}
      initial={initial}
      selectable
      getRowLabel={(row) => row.name}
      search={{ label: "Search products", placeholder: "Search name or SKU…" }}
      facets={facets}
      bulkActions={(ids) => (
        <DeleteButton
          action={() =>
            bulkDeleteProducts(
              ids,
              `${window.location.pathname}${window.location.search}`
            )
          }
          label={`Delete ${ids.length}`}
          confirmText={`Delete ${ids.length} selected product${ids.length === 1 ? "" : "s"}? Products that already appear on orders are skipped.`}
        />
      )}
    />
  );
}