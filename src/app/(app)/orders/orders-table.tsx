"use client";

import Link from "next/link";
import * as React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { ORDER_STATUSES, formatCurrency, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/status-badge";
import DataTable, {
  type DataTableFacet,
} from "@/components/data-table/data-table";
import DataTableColumnHeader from "@/components/data-table/data-table-column-header";
import type { DataTableFeatures } from "@/components/data-table/features";
import type { TableInitialState } from "@/components/data-table/state";
import { bulkSetOrderStatus } from "@/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: Date;
  customerName: string;
  items: number;
};

const columnHelper = createColumnHelper<DataTableFeatures, OrderRow>();

function buildColumns(currency: string) {
  return [
  columnHelper.accessor("orderNumber", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order" />
    ),
    sortFn: "alphanumeric",
    cell: ({ row, getValue }) => (
      <Link
        href={`/orders/${row.original.id}`}
        transitionTypes={["nav-forward"]}
        className="font-medium text-primary hover:underline"
      >
        {getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor((row) => row.customerName, {
    id: "customer",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    sortFn: "alphanumeric",
    cell: ({ getValue }) => (
      <span className="block max-w-44 truncate">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("items", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Items" />,
    sortFn: "basic",
    cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
  }),
  columnHelper.accessor("status", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    sortFn: "alphanumeric",
    filterFn: "inList",
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  }),
  columnHelper.accessor("total", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" className="ml-auto" />
    ),
    sortFn: "basic",
    meta: { align: "right" },
    cell: ({ getValue }) => <span className="tabular-nums">{formatCurrency(getValue(), currency)}</span>,
  }),
  columnHelper.accessor("createdAt", {
    id: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    sortFn: "datetime",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{formatDate(getValue())}</span>
    ),
  }),
  ];
}

const facets: DataTableFacet[] = [
  {
    id: "status",
    title: "Status",
    options: ORDER_STATUSES.map((status) => ({
      label: status[0].toUpperCase() + status.slice(1),
      value: status,
    })),
  },
];

/** Applies one status to every selected order; cancelling asks first. */
function BulkOrderStatus({ ids }: { ids: string[] }) {
  const [status, setStatus] = React.useState<string>("shipped");
  const [confirming, setConfirming] = React.useState(false);
  const isCancelling = status === "cancelled";

  const run = async (formData: FormData) => {
    setConfirming(false);
    await bulkSetOrderStatus(
      ids,
      `${window.location.pathname}${window.location.search}`,
      formData
    );
  };

  return (
    <>
      <form
        action={run}
        onSubmit={(event) => {
          if (isCancelling) {
            event.preventDefault();
            setConfirming(true);
          }
        }}
        className="flex items-center gap-2"
      >
        <Select name="status" value={status} onValueChange={setStatus}>
          <SelectTrigger
            size="sm"
            className="w-32"
            aria-label="Status for the selected orders"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {ORDER_STATUSES.map((option) => (
                <SelectItem key={option} value={option} className="capitalize">
                  {option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline" size="sm">
          Apply
        </Button>
      </form>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Cancel {ids.length} order{ids.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The selected orders will be marked cancelled and their stock put
              back on the shelf. You can move them to another status afterwards,
              which takes the stock out again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep them</AlertDialogCancel>
            <form action={run}>
              <Button type="submit" variant="destructive">
                Cancel orders
              </Button>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function OrdersTable({
  data,
  initial,
  currency,
}: {
  data: OrderRow[];
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
      getRowLabel={(row) => row.orderNumber}
      search={{
        label: "Search orders",
        placeholder: "Search order or customer…",
      }}
      facets={facets}
      bulkActions={(ids) => <BulkOrderStatus ids={ids} />}
    />
  );
}