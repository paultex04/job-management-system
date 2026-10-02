import { redirect } from "next/navigation";
import { PackageIcon } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span
            translate="no"
            className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground"
          >
            <PackageIcon aria-hidden />
            OpenERP
          </span>
          <p className="mt-1 text-sm text-muted-foreground">
            Inventory, orders and customers in one place
          </p>
        </div>
        <Card>
          <CardContent className="py-2 sm:py-4">{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
