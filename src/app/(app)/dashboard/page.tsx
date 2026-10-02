import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/business";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
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
import PageHeader from "@/components/page-header";
import PageTransition from "@/components/page-transition";
import StatusBadge from "@/components/status-badge";

export default async function DashboardPage() {
  const [
    customerCount,
    productCount,
    orderCount,
    revenue,
    lowStock,
    recentOrders,
    currency,
  ] =
    await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.order.count({ where: { status: { not: "cancelled" } } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ["confirmed", "shipped", "completed"] } },
      }),
      prisma.product.findMany({
        where: { active: true },
        orderBy: { stock: "asc" },
        take: 5,
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { customer: { select: { name: true } } },
      }),
      getCurrency(),
    ]);

  const totalRevenue = revenue._sum.total ?? 0;
  const averageOrder = orderCount > 0 ? totalRevenue / orderCount : 0;

  const stats = [
    { label: "Customers", value: String(customerCount), href: "/customers" },
    { label: "Active orders", value: String(orderCount), href: "/orders" },
    { label: "Products", value: String(productCount), href: "/products" },
    { label: "Revenue", value: formatCurrency(totalRevenue, currency), href: "/orders" },
    { label: "Avg. order value", value: formatCurrency(averageOrder, currency), href: "/orders" },
    { label: "Low stock items", value: String(
        lowStock.filter((p) => p.stock <= p.reorderLevel).length
      ), href: "/products" },
  ];

  return (
    <PageTransition>
      <div>
        <PageHeader
          title="Dashboard"
          description="A quick overview of your business."
        >
          <Button asChild>
            <Link href="/orders/new" transitionTypes={["nav-forward"]}>
              <PlusIcon data-icon="inline-start" />
              New Order
            </Link>
          </Button>
        </PageHeader>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card size="sm" className="transition-colors hover:bg-muted">
                <CardContent>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </div>
                  <div className="mt-1 text-xl font-semibold text-foreground tabular-nums">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle asChild>
                <h2>Recent Orders</h2>
              </CardTitle>
              <CardAction>
                <Link
                  href="/orders"
                  className="text-sm text-primary hover:underline"
                >
                  View All
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No orders yet</EmptyTitle>
                    <EmptyDescription>
                      Create your first order to see it here.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Link
                              href={`/orders/${order.id}`}
                              transitionTypes={["nav-forward"]}
                              className="block max-w-40 truncate font-medium text-primary hover:underline"
                              title={order.orderNumber}
                            >
                              {order.orderNumber}
                            </Link>
                          </TableCell>
                          <TableCell
                            className="max-w-40 truncate"
                            title={order.customer.name}
                          >
                            {order.customer.name}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(order.total, currency)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle asChild>
                <h2>Inventory Watch</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {lowStock.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No products yet</EmptyTitle>
                    <EmptyDescription>
                      Add products to keep an eye on stock levels.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul className="divide-y divide-border">
                  {lowStock.map((product) => {
                    const low = product.stock <= product.reorderLevel;
                    return (
                      <li
                        key={product.id}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                      >
                        <div className="min-w-0">
                          <div
                            className="truncate font-medium text-foreground"
                            title={product.name}
                          >
                            {product.name}
                          </div>
                          <div
                            className="truncate font-mono text-xs text-muted-foreground"
                            translate="no"
                          >
                            {product.sku}
                          </div>
                        </div>
                        <Badge
                          variant={low ? "destructive" : "secondary"}
                          className="shrink-0 tabular-nums"
                        >
                          {product.stock} left
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
