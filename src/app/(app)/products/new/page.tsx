import PageHeader from "@/components/page-header";
import PageTransition from "@/components/page-transition";
import Flash from "@/components/flash";
import ProductForm from "@/components/product-form";
import { Card, CardContent } from "@/components/ui/card";
import { createProduct } from "@/actions";
import { getCurrency } from "@/lib/business";
import { first } from "@/lib/search";

export default async function NewProductPage({
  searchParams,
}: PageProps<"/products/new">) {
  const { error } = await searchParams;
  const currency = await getCurrency();

  return (
    <PageTransition>
      <div className="max-w-2xl">
        <PageHeader
          title="New Product"
          description="Add an item to your inventory catalog."
        />
        <Flash error={first(error)} />
        <Card>
          <CardContent>
            <ProductForm action={createProduct} currency={currency} />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
