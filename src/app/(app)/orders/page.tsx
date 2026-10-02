import Link from "next/link";
import { PlusIcon, ShoppingCartIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/business";
import { first } from "@/lib/search";
import { parseTableState } from "@/components/data-table/state";
import PageHeader from "@/components/page-header";
import PageTransition from "@/components/page-transition";
import Flash from "@/components/flash";
import OrdersTable from "./orders-table";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default async function OrdersPage({
  searchParams,
}: PageProps<"/orders">) {
  const sp = await searchParams;
  const error = first(sp.error);
  const saved = first(sp.saved);
  const msg = first(sp.msg);

  // All orders go to the table; `?status=shipped` deep links still work because
  // the status facet is initialised from the URL.
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  const currency = await getCurrency();

  const rows = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
    customerName: order.customer.name,
    items: order._count.items,
  }));

  return (
    <PageTransition>
      <div className="flex flex-col lg:h-[calc(100svh-6rem)] lg:min-h-0 lg:overflow-hidden">
        <div className="shrink-0">
          <PageHeader
            title="Orders"
            description={`${orders.length} order${orders.length === 1 ? "" : "s"}`}
          >
            <Button asChild>
              <Link href="/orders/new" transitionTypes={["nav-forward"]}>
                <PlusIcon data-icon="inline-start" />
                New Order
              </Link>
            </Button>
          </PageHeader>

          <Flash error={error} saved={saved} msg={msg} />
        </div>

        {orders.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShoppingCartIcon />
              </EmptyMedia>
              <EmptyTitle>No orders found</EmptyTitle>
              <EmptyDescription>Create your first order to get started.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/orders/new" transitionTypes={["nav-forward"]}>
                  <PlusIcon data-icon="inline-start" />
                  New Order
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <OrdersTable
            data={rows}
            initial={parseTableState(sp)}
            currency={currency}
          />
        )}
      </div>
    </PageTransition>
  );
}