import Link from "next/link";
import { PlusIcon, UsersIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { first } from "@/lib/search";
import { parseTableState } from "@/components/data-table/state";
import PageHeader from "@/components/page-header";
import PageTransition from "@/components/page-transition";
import Flash from "@/components/flash";
import CustomersTable from "./customers-table";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default async function CustomersPage({
  searchParams,
}: PageProps<"/customers">) {
  const sp = await searchParams;
  const error = first(sp.error);
  const saved = first(sp.saved);
  const msg = first(sp.msg);

  // Every customer is handed to the table; search, facets, sorting and
  // pagination all run in the browser from `?q=` and friends.
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { orders: true } } },
  });

  const rows = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    city: customer.city,
    country: customer.country,
    orders: customer._count.orders,
    createdAt: customer.createdAt,
  }));

  return (
    <PageTransition>
      <div className="flex flex-col lg:h-[calc(100svh-6rem)] lg:min-h-0 lg:overflow-hidden">
        <div className="shrink-0">
          <PageHeader
            title="Customers"
            description={`${customers.length} customer${customers.length === 1 ? "" : "s"}`}
          >
            <Button asChild>
              <Link href="/customers/new" transitionTypes={["nav-forward"]}>
                <PlusIcon data-icon="inline-start" />
                New Customer
              </Link>
            </Button>
          </PageHeader>

          <Flash error={error} saved={saved} msg={msg} />
        </div>

        {customers.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersIcon />
              </EmptyMedia>
              <EmptyTitle>No customers found</EmptyTitle>
              <EmptyDescription>
                Add your first customer to get started.
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
        ) : (
          <CustomersTable data={rows} initial={parseTableState(sp)} />
        )}
      </div>
    </PageTransition>
  );
}