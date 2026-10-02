import type { StockMovement } from "@prisma/client";
import { ArrowRightLeftIcon } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import StockMovementBadge from "@/components/stock-movement-badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Movement = StockMovement & { user: { name: string } | null };

/** Newest first; capped by the page so a busy product stays quick to load. */
const LEDGER_LIMIT = 100;

function Figure({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          valueClassName
        )}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * A product's stock card: the running balance of every unit in and out. The
 * balance column is the number the product page and the list both show as
 * "stock on hand", so the figure can always be traced back to a movement.
 */
export default function StockLedger({
  stock,
  movements,
  truncated,
}: {
  stock: number;
  movements: Movement[];
  truncated: boolean;
}) {
  // The opening balance isn't a delivery, so it stays out of "received" — it is
  // simply the starting point the rest of the card sits on.
  const received = movements
    .filter((movement) => movement.quantity > 0 && movement.type !== "opening")
    .reduce((sum, movement) => sum + movement.quantity, 0);
  const issued = movements
    .filter((movement) => movement.quantity < 0)
    .reduce((sum, movement) => sum - movement.quantity, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Figure label="Movements" value={movements.length} />
        <Figure
          label="Received"
          value={received > 0 ? `+${received}` : 0}
          valueClassName={received > 0 ? "text-success" : undefined}
        />
        <Figure
          label="Issued"
          value={issued > 0 ? `−${issued}` : 0}
          valueClassName={issued > 0 ? "text-warning" : undefined}
        />
        <Figure label="On hand" value={stock} />
      </div>

      {movements.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ArrowRightLeftIcon />
            </EmptyMedia>
            <EmptyTitle>No stock movements yet</EmptyTitle>
            <EmptyDescription>
              Receiving or issuing stock above will show up here as a stock
              card, one row per movement.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[8.75rem]">Date</TableHead>
                <TableHead className="w-[8.5rem]">Movement</TableHead>
                {/* the numbers come before the flexible text column so they
                    stay on screen in a narrow window */}
                <TableHead className="w-[5rem] text-right">Change</TableHead>
                <TableHead className="w-[5rem] text-right">Balance</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => {
                // reference, note and who did it — one line, truncated to fit
                const detail = [
                  movement.reference,
                  movement.note,
                  movement.user?.name,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                <TableRow key={movement.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(movement.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StockMovementBadge type={movement.type} />
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium tabular-nums",
                      movement.quantity > 0
                        ? "text-success"
                        : "text-destructive"
                    )}
                  >
                    {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {movement.balance}
                  </TableCell>
                  <TableCell>
                    <span
                      className="block max-w-[18rem] truncate"
                      title={detail || undefined}
                      translate="no"
                    >
                      {detail || "—"}
                    </span>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {truncated && (
            <p className="text-sm text-muted-foreground">
              Showing the {LEDGER_LIMIT} most recent movements.
            </p>
          )}
        </>
      )}
    </div>
  );
}