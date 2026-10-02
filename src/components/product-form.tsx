import Link from "next/link";
import type { Product } from "@prisma/client";
import { currencySymbol } from "@/lib/utils";
import SubmitButton from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Action = (formData: FormData) => Promise<void>;

export default function ProductForm({
  action,
  product,
  currency,
  submitLabel = "Save Product",
}: {
  action: Action;
  product?: Product;
  /** ISO code the price labels name — the figures themselves are stored raw. */
  currency: string;
  submitLabel?: string;
}) {
  const symbol = currencySymbol(currency);
  return (
    <form action={action}>
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="sku">SKU *</FieldLabel>
            <Input
              id="sku"
              name="sku"
              required
              autoComplete="off"
              spellCheck={false}
              defaultValue={product?.sku}
              placeholder="LAPTOP-14…"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="name">Name *</FieldLabel>
            <Input
              id="name"
              name="name"
              required
              autoComplete="off"
              defaultValue={product?.name}
              placeholder={'14" Business Laptop…'}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={3}
            autoComplete="off"
            defaultValue={product?.description ?? ""}
            placeholder="What is it, who is it for…"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="price">
              Sale price ({symbol}) *
            </FieldLabel>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={product?.price ?? 0}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="cost">Cost ({symbol})</FieldLabel>
            <Input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={product?.cost ?? 0}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="stock">Stock on hand</FieldLabel>
            <Input
              id="stock"
              name="stock"
              type="number"
              step="1"
              required
              defaultValue={product?.stock ?? 0}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="reorderLevel">Reorder level</FieldLabel>
            <Input
              id="reorderLevel"
              name="reorderLevel"
              type="number"
              step="1"
              min="0"
              required
              defaultValue={product?.reorderLevel ?? 0}
            />
          </Field>
          <Label className="mt-6 text-foreground">
            <Checkbox
              name="active"
              defaultChecked={product ? product.active : true}
            />
            Active (sellable)
          </Label>
        </div>

        <div className="flex items-center gap-3">
          <SubmitButton>{submitLabel}</SubmitButton>
          <Button asChild variant="outline">
            <Link href="/products">Cancel</Link>
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
