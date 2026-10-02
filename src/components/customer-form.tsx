import Link from "next/link";
import type { Customer } from "@prisma/client";
import SubmitButton from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Action = (formData: FormData) => Promise<void>;

export default function CustomerForm({
  action,
  customer,
  submitLabel = "Save Customer",
}: {
  action: Action;
  customer?: Customer;
  submitLabel?: string;
}) {
  return (
    <form action={action}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Name *</FieldLabel>
          <Input
            id="name"
            name="name"
            required
            autoComplete="off"
            defaultValue={customer?.name}
            placeholder="Acme Corporation…"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="off"
              spellCheck={false}
              defaultValue={customer?.email ?? ""}
              placeholder="name@company.com…"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="off"
              defaultValue={customer?.phone ?? ""}
              placeholder="+1 555 0100…"
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="address">Address</FieldLabel>
          <Input
            id="address"
            name="address"
            autoComplete="off"
            defaultValue={customer?.address ?? ""}
            placeholder="1200 Market St, San Francisco…"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="city">City</FieldLabel>
            <Input
              id="city"
              name="city"
              autoComplete="off"
              defaultValue={customer?.city ?? ""}
              placeholder="San Francisco…"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="country">Country</FieldLabel>
            <Input
              id="country"
              name="country"
              autoComplete="off"
              defaultValue={customer?.country ?? ""}
              placeholder="United States…"
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="notes">Notes</FieldLabel>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            autoComplete="off"
            defaultValue={customer?.notes ?? ""}
            placeholder="Anything the team should know…"
          />
        </Field>

        <div className="flex items-center gap-3">
          <SubmitButton>{submitLabel}</SubmitButton>
          <Button asChild variant="outline">
            <Link href="/customers">Cancel</Link>
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
