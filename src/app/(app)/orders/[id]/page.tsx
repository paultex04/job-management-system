import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, ORDER_STATUSES } from "@/lib/utils";
import { getCurrency } from "@/lib/business";
import PageHeader from "@/components/page-header";
import PageTransition from "@/components/page-transition";
import Flash from "@/components/flash";
import StatusBadge from "@/components/status-badge";
import OrderStatusControl from "@/components/order-status-control";
import { updateOrderStatus } from "@/actions";
import { first } from "@/lib/search";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function OrderDetailPage({
  params,
  searchParams,
}: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const error = first(sp.error);
  const saved = first(sp.saved);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: { select: { sku: true, name: true } } } },
      createdBy: { select: { name: true } },
    },
  });
  if (!order) notFound();

  const currency = await getCurrency();

  return (
    <PageTransition>
      <div className="max-w-3xl">
        <PageHeader
          title={`Order ${order.orderNumber}`}
          description={order.customer.name}
        >
          <Button asChild variant="outline">
            <Link href="/orders" transitionTypes={["nav-back"]}>
              Back to Orders
            </Link>
          </Button>
          <OrderStatusControl
            value={order.status}
            options={ORDER_STATUSES}
            action={updateOrderStatus.bind(null, order.id)}
          />
        </PageHeader>

        <Flash error={error} saved={saved} />

        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <Card size="sm">
            <CardContent>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </div>
              <div className="mt-1">
                <StatusBadge status={order.status} />
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Placed
              </div>
              <div className="mt-1 text-sm text-foreground">
                {formatDate(order.createdAt)}
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Created By
              </div>
              <div className="mt-1 text-sm text-foreground">
                {order.createdBy?.name ?? "Unknown"}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">Product</TableHead>
                <TableHead className="px-4 text-right">Unit Price</TableHead>
                <TableHead className="px-4 text-right">Qty</TableHead>
                <TableHead className="px-4 text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4">
                    <div className="font-medium text-foreground">
                      {item.product.name}
                    </div>
                    <div
                      className="font-mono text-xs text-muted-foreground"
                      translate="no"
                    >
                      {item.product.sku}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-right tabular-nums">
                    {formatCurrency(item.unitPrice, currency)}
                  </TableCell>
                  <TableCell className="px-4 text-right tabular-nums">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="px-4 text-right tabular-nums">
                    {formatCurrency(item.unitPrice * item.quantity, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="bg-transparent">
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="px-4 text-right text-sm font-medium text-muted-foreground"
                >
                  Order Total
                </TableCell>
                <TableCell className="px-4 text-right text-base font-semibold text-foreground tabular-nums">
                  {formatCurrency(order.total, currency)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Card>

        {order.notes && (
          <Card className="mt-4">
            <CardContent>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notes
              </div>
              <p className="mt-1 break-words whitespace-pre-wrap text-sm text-foreground">
                {order.notes}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Customer:{" "}
          <Link
            href={`/customers/${order.customer.id}`}
            transitionTypes={["nav-forward"]}
            className="text-primary hover:underline"
          >
            {order.customer.name}
          </Link>
          {order.customer.email && <> · {order.customer.email}</>}
        </div>
      </div>
    </PageTransition>
  );
}
