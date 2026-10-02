import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/page-header";
import PageTransition from "@/components/page-transition";
import Flash from "@/components/flash";
import CustomerForm from "@/components/customer-form";
import DeleteButton from "@/components/delete-button";
import { deleteCustomer, updateCustomer } from "@/actions";
import { first } from "@/lib/search";
import { Card, CardContent } from "@/components/ui/card";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: PageProps<"/customers/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const error = first(sp.error);
  const saved = first(sp.saved);

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  return (
    <PageTransition>
      <div className="max-w-2xl">
        <PageHeader title={customer.name} description="Edit customer details.">
          <DeleteButton
            action={deleteCustomer.bind(null, customer.id)}
            confirmText={`Delete ${customer.name}?`}
          />
        </PageHeader>

        <Flash error={error} saved={saved} />

        <Card>
          <CardContent>
            <CustomerForm
              action={updateCustomer.bind(null, customer.id)}
              customer={customer}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
