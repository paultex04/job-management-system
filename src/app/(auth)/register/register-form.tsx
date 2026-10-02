"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerUser } from "@/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function RegisterForm() {
  const [state, action, pending] = useActionState(registerUser, null);

  return (
    <form action={action}>
      <FieldGroup>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Create Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register a new user for this workspace.
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
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder="Jane Doe…"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            spellCheck={false}
            placeholder="jane@company.com…"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters…"
          />
        </Field>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Spinner data-icon="inline-start" />}
          {pending ? "Creating…" : "Create Account"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
