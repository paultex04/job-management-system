"use client";

import Link from "next/link";
import * as React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { cn, formatDate } from "@/lib/utils";
import Avatar from "@/components/avatar";
import DataTable, {
  type DataTableColumnDef,
  type DataTableFacet,
} from "@/components/data-table/data-table";
import DataTableColumnHeader from "@/components/data-table/data-table-column-header";
import type { DataTableFeatures } from "@/components/data-table/features";
import type { TableInitialState } from "@/components/data-table/state";
import DeleteButton from "@/components/delete-button";
import { bulkRemoveUsers, deleteUser } from "@/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Semantic tokens only — .dark in globals.css swaps the values, so no
// dark: variants anywhere.
const ROLE_STYLES: Record<string, string> = {
  admin: "bg-primary/10 text-primary",
  manager: "bg-info/10 text-info",
  staff: "bg-muted text-muted-foreground",
};

export type TeamRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  createdAt: Date;
};

const columnHelper = createColumnHelper<DataTableFeatures, TeamRow>();

const facets: DataTableFacet[] = [
  {
    id: "role",
    title: "Role",
    options: [
      { label: "Admin", value: "admin" },
      { label: "Manager", value: "manager" },
      { label: "Staff", value: "staff" },
    ],
  },
];

export default function TeamTable({
  data,
  initial,
  isAdmin,
  currentUserId,
}: {
  data: TeamRow[];
  initial: TableInitialState;
  isAdmin: boolean;
  currentUserId: string;
}) {
  const columns = React.useMemo(() => {
    const result: Array<DataTableColumnDef<TeamRow>> = [
      columnHelper.accessor("name", {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        sortFn: "alphanumeric",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar src={row.original.avatar} name={row.original.name} />
            <span className="block max-w-44 truncate font-medium text-foreground">
              {row.original.name}
              {row.original.id === currentUserId && (
                <span className="ml-2 text-xs text-muted-foreground">(you)</span>
              )}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor("email", {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        sortFn: "alphanumeric",
        cell: ({ getValue }) => (
          <span className="block max-w-56 truncate text-muted-foreground">
            {getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("role", {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Role" />
        ),
        sortFn: "alphanumeric",
        filterFn: "inList",
        cell: ({ getValue }) => (
          <Badge
            variant="outline"
            className={cn(
              "capitalize",
              ROLE_STYLES[getValue()] ?? ROLE_STYLES.staff
            )}
          >
            {getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("createdAt", {
        id: "joined",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Joined" />
        ),
        sortFn: "datetime",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{formatDate(getValue())}</span>
        ),
      }),
    ];

    if (isAdmin) {
      result.push(
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
                  href={`/team/${row.original.id}`}
                  transitionTypes={["nav-forward"]}
                >
                  Edit
                </Link>
              </Button>
              {row.original.id !== currentUserId && (
                <DeleteButton
                  action={deleteUser.bind(null, row.original.id)}
                  confirmText={`Remove ${row.original.name} from the team?`}
                  label="Remove"
                />
              )}
            </div>
          ),
        })
      );
    }

    return result;
  }, [currentUserId, isAdmin]);

  return (
    <DataTable
      columns={columns}
      data={data}
      getRowId={(row) => row.id}
      initial={initial}
      selectable={isAdmin}
      getRowLabel={(row) => row.name}
      search={{ label: "Search teammates", placeholder: "Search name or email…" }}
      facets={facets}
      bulkActions={
        isAdmin
          ? (ids) => (
              <DeleteButton
                action={() =>
                  bulkRemoveUsers(
                    ids,
                    `${window.location.pathname}${window.location.search}`
                  )
                }
                label={`Remove ${ids.length}`}
                confirmText={`Remove ${ids.length} teammate${ids.length === 1 ? "" : "s"} from the workspace? Your own account is always kept.`}
              />
            )
          : undefined
      }
    />
  );
}