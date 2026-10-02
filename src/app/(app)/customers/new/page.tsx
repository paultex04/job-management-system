import PageHeader from "@/components/page-header";
import PageTransition from "@/components/page-transition";
import Flash from "@/components/flash";
import CustomerForm from "@/components/customer-form";
import { createCustomer } from "@/actions";
import { first } from "@/lib/search";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewCustomerPage({
  searchParams,
}: PageProps<"/customers/new">) {
  const { error } = await searchParams;
  const errorMessage = first(error);

  return (
    <PageTransition>
      <div className="max-w-2xl">
        <PageHeader
          title="New Customer"
          description="Add a customer to your database."
        />
        <Flash error={errorMessage} />
        <Card>
          <CardContent>
            <CustomerForm action={createCustomer} />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
