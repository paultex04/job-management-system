"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AppError({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="mx-auto mt-16 max-w-lg text-center">
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-6">
          <h1 className="text-lg font-semibold text-foreground">
            Something Went Wrong
          </h1>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <p className="text-sm text-muted-foreground">
            Reload the page or go back to the dashboard and try again.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/dashboard" transitionTypes={["nav-back"]}>
              Back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
