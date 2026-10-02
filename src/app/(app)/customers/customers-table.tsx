"use client";

import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import DataTable, {
  type DataTableFacet,
} from "@/components/data-table/data-table";
import DataTableColumnHeader from "@/components/data-table/data-table-column-header";
import type { DataTableFeatures } from "@/components/data-table/features";
import type { TableInitialState } from "@/components/data-table/state";
import DeleteButton from "@/components/delete-button";
import { bulkDeleteCustomers, deleteCustomer } from "@/actions";

export type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  orders: number;
  createdAt: Date;
};

const columnHelper = createColumnHelper<DataTableFeatures, CustomerRow>();

const columns = [
  columnHelper.accessor("name", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    sortFn: "alphanumeric",
    cell: ({ row, getValue }) => (
      <Link
        href={`/customers/${row.original.id}`}
        transitionTypes={["nav-forward"]}
        className="block max-w-44 truncate font-medium text-primary hover:underline"
        title={getValue()}
      >
        {getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor(
    (row) => [row.email, row.phone].filter(Boolean).join(" "),
    {
      id: "contact",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
      sortFn: "alphanumeric",
      cell: ({ row }) => (
        <>
          <div
            className="max-w-52 truncate text-foreground"
            title={row.original.email ?? ""}
          >
            {row.original.email ?? "—"}
          </div>
          <div className="max-w-52 truncate text-xs text-muted-foreground">
            {row.original.phone ?? ""}
          </div>
        </>
      ),
    }
  ),
  columnHelper.accessor(
    (row) => [row.city, row.country].filter(Boolean).join(", "),
    {
      id: "location",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Location" />
      ),
      sortFn: "alphanumeric",
      filterFn: "inCountries",
      cell: ({ getValue }) => (
        <span className="block max-w-40 truncate">{getValue() || "—"}</span>
      ),
    }
  ),
  columnHelper.accessor("orders", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Orders" />
    ),
    sortFn: "basic",
    filterFn: "orderCount",
    cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
  }),
  columnHelper.accessor("createdAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    sortFn: "datetime",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{formatDate(getValue())}</span>
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
            href={`/customers/${row.original.id}`}
            transitionTypes={["nav-forward"]}
          >
            Edit
          </Link>
        </Button>
        <DeleteButton
          action={deleteCustomer.bind(null, row.original.id)}
          confirmText={`Delete ${row.original.name}?`}
        />
      </div>
    ),
  }),
];

export default function CustomersTable({
  data,
  initial,
}: {
  data: CustomerRow[];
  initial: TableInitialState;
}) {
  const countries = Array.from(
    new Set(data.map((row) => row.country).filter((value): value is string => Boolean(value)))
  )
    .sort()
    .map((country) => ({ label: country, value: country }));

  const facets: DataTableFacet[] = [
    {
      id: "location",
      title: "Country",
      options: countries,
    },
    {
      id: "orders",
      title: "Orders",
      options: [
        { label: "With orders", value: "with" },
        { label: "Without orders", value: "without" },
      ],
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      initial={initial}
      selectable
      getRowLabel={(row) => row.name}
      search={{
        label: "Search customers",
        placeholder: "Search name, email, city…",
      }}
      facets={facets}
      bulkActions={(ids) => (
        <DeleteButton
          action={() =>
            bulkDeleteCustomers(
              ids,
              `${window.location.pathname}${window.location.search}`
            )
          }
          label={`Delete ${ids.length}`}
          confirmText={`Delete ${ids.length} selected customer${ids.length === 1 ? "" : "s"}? Any orders they own are deleted too.`}
        />
      )}
    />
  );
}