import Link from "next/link";
import { PackageIcon, PlusIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/business";
import { first } from "@/lib/search";
import { parseTableState } from "@/components/data-table/state";
import PageHeader from "@/components/page-header";
import PageTransition from "@/components/page-transition";
import Flash from "@/components/flash";
import ProductsTable from "./products-table";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default async function ProductsPage({
  searchParams,
}: PageProps<"/products">) {
  const sp = await searchParams;
  const error = first(sp.error);
  const saved = first(sp.saved);
  const msg = first(sp.msg);

  // The table filters, sorts and paginates on the client, so it gets the whole
  // catalog; `?q=` and friends arrive as its initial state.
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  const currency = await getCurrency();

  return (
    <PageTransition>
      <div className="flex flex-col lg:h-[calc(100svh-6rem)] lg:min-h-0 lg:overflow-hidden">
        <div className="shrink-0">
          <PageHeader
            title="Products"
            description={`${products.length} product${products.length === 1 ? "" : "s"} in the catalog`}
          >
            <Button asChild>
              <Link href="/products/new" transitionTypes={["nav-forward"]}>
                <PlusIcon data-icon="inline-start" />
                New Product
              </Link>
            </Button>
          </PageHeader>

          <Flash error={error} saved={saved} msg={msg} />
        </div>

        {products.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageIcon />
              </EmptyMedia>
              <EmptyTitle>No products found</EmptyTitle>
              <EmptyDescription>
                Add your first product to the catalog.
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
          <ProductsTable
            data={products}
            initial={parseTableState(sp)}
            currency={currency}
          />
        )}
      </div>
    </PageTransition>
  );
}