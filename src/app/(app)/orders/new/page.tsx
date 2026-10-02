import Link from "next/link";
import { PackageIcon, PlusIcon, UsersIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/business";
import PageHeader from "@/components/page-header";
import PageTransition from "@/components/page-transition";
import OrderForm from "@/components/order-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default async function NewOrderPage() {
  const [customers, products, currency] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, sku: true, name: true, price: true, stock: true },
    }),
    getCurrency(),
  ]);

  return (
    <PageTransition>
      <div className="max-w-3xl">
        <PageHeader
          title="New Order"
          description="Orders are created as “confirmed” and stock is deducted automatically."
        />

        {customers.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>No customers yet</EmptyTitle>
              <EmptyDescription>
                You need at least one customer before creating an order.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/customers/new" transitionTypes={["nav-forward"]}>
                  <PlusIcon data-icon="inline-start" />
                  New Customer
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : products.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageIcon />
              </EmptyMedia>
              <EmptyTitle>No products yet</EmptyTitle>
              <EmptyDescription>
                You need at least one active product before creating an order.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/products/new" transitionTypes={["nav-forward"]}>
                  <PlusIcon data-icon="inline-start" />
                  New Product
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Card>
            <CardContent>
              <OrderForm
                customers={customers}
                products={products}
                currency={currency}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
