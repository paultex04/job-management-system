import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrency } from "@/lib/business";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PageHeader from "@/components/page-header";
import PageTransition from "@/components/page-transition";
import Flash from "@/components/flash";
import ProductForm from "@/components/product-form";
import DeleteButton from "@/components/delete-button";
import { deleteProduct, updateProduct } from "@/actions";
import { first } from "@/lib/search";
import StockMovementForm from "./stock-movement-form";
import StockLedger from "./stock-ledger";

/** Newest movements shown on the page; the ledger itself is append-only. */
const LEDGER_LIMIT = 100;

export default async function ProductDetailPage({
  params,
  searchParams,
}: PageProps<"/products/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const error = first(sp.error);
  const saved = first(sp.saved);
  const msg = first(sp.msg);

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      movements: {
        orderBy: { createdAt: "desc" },
        take: LEDGER_LIMIT + 1,
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!product) notFound();

  const truncated = product.movements.length > LEDGER_LIMIT;
  const movements = truncated
    ? product.movements.slice(0, LEDGER_LIMIT)
    : product.movements;
  const lowStock = product.stock <= product.reorderLevel;
  const currency = await getCurrency();

  return (
    <PageTransition>
      <div className="flex max-w-3xl flex-col gap-6">
        <PageHeader
          title={product.name}
          description={
            <>
              SKU <span translate="no">{product.sku}</span>
            </>
          }
        >
          <DeleteButton
            action={deleteProduct.bind(null, product.id)}
            confirmText={`Delete ${product.name}?`}
          />
        </PageHeader>

        <Flash error={error} saved={saved} msg={msg} />

        <Card>
          <CardContent>
            <ProductForm
              action={updateProduct.bind(null, product.id)}
              product={product}
              currency={currency}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>Receive &amp; issue stock</h2>
            </CardTitle>
            <CardDescription>
              Every movement is kept on the stock card below —{" "}
              <span className="font-medium text-foreground tabular-nums">
                {product.stock}
              </span>{" "}
              on hand
              {lowStock && " (at or below the reorder level)"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StockMovementForm productId={product.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>Movement history</h2>
            </CardTitle>
            <CardDescription>
              Stock card for this item, newest first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StockLedger
              stock={product.stock}
              movements={movements}
              truncated={truncated}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}