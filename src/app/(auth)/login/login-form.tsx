"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <form action={action}>
      <FieldGroup>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Sign In</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back. Please enter your details.
          </p>
        </div>

        {state?.error && (
          <Alert
            variant="destructive"
            className="border-destructive/40 bg-destructive/10"
          >
            {state.error}
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            spellCheck={false}
            placeholder="admin@erp.local…"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
        </Field>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Spinner data-icon="inline-start" />}
          {pending ? "Signing in…" : "Sign In"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          No account yet?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>

        <div
          translate="no"
          className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground"
        >
          Demo login — admin@erp.local / admin1234
        </div>
      </FieldGroup>
    </form>
  );
}
