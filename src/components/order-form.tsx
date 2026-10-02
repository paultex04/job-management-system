"use client";

import { useEffect, useState, useActionState } from "react";
import { createOrder } from "@/actions";
import { formatCurrency } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

type CustomerOption = { id: string; name: string };
type ProductOption = {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
};

type Line = { productId: string; quantity: number };

export default function OrderForm({
  customers,
  products,
  currency,
}: {
  customers: CustomerOption[];
  products: ProductOption[];
  currency: string;
}) {
  const [state, action, pending] = useActionState(createOrder, null);
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  const productById = new Map(products.map((p) => [p.id, p]));

  // warn before navigating away with unsaved lines/notes
  useEffect(() => {
    const dirty = lines.length > 0 || customerId !== "" || notes !== "";
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [lines, customerId, notes]);

  const total = lines.reduce((sum, line) => {
    const p = productById.get(line.productId);
    return sum + (p ? p.price * line.quantity : 0);
  }, 0);

  function addLine() {
    const firstAvailable = products.find((p) => !lines.some((l) => l.productId === p.id));
    if (!firstAvailable) return;
    setLines((prev) => [...prev, { productId: firstAvailable.id, quantity: 1 }]);
  }

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form action={action}>
      <FieldGroup>
        {state?.error && (
          <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
            {state.error}
          </Alert>
        )}

        <input type="hidden" name="items" value={JSON.stringify(lines)} />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="customerId">Customer *</FieldLabel>
            <Select
              name="customerId"
              required
              value={customerId}
              onValueChange={setCustomerId}
            >
              <SelectTrigger id="customerId" className="w-full">
                <SelectValue placeholder="Select a customer…" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="notes">Notes</FieldLabel>
            <Input
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="PO reference, delivery instructions…"
            />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Line Items *</Label>
            <Button type="button" variant="outline" onClick={addLine}>
              + Add Line
            </Button>
          </div>

          {lines.length === 0 && (
            <Empty className="py-6">
              <EmptyHeader>
                <EmptyTitle>No line items yet</EmptyTitle>
                <EmptyDescription>
                  Click “Add Line” to begin.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          <div className="flex flex-col gap-3">
            {lines.map((line, index) => {
              const product = productById.get(line.productId);
              const lineTotal = product ? product.price * line.quantity : 0;
              const overStock = product ? line.quantity > product.stock : false;

              return (
                <div
                  key={index}
                  className="rounded-md border border-border bg-muted p-3"
                >
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-52 flex-1">
                      <Label className="mb-1.5">Product</Label>
                      <Select
                        value={line.productId}
                        onValueChange={(v) => updateLine(index, { productId: v })}
                      >
                        <SelectTrigger className="w-full" aria-label="Product">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.sku} — {p.name} ({formatCurrency(p.price, currency)}, {p.stock} in stock)
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-24">
                      <Label className="mb-1.5">Qty</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        aria-label="Quantity"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(index, {
                            quantity: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                      />
                    </div>

                    <div className="w-28 text-right text-sm tabular-nums text-foreground">
                      <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                        Line Total
                      </div>
                      {formatCurrency(lineTotal, currency)}
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeLine(index)}
                    >
                      Remove Line
                    </Button>
                  </div>

                  {overStock && (
                    <p className="mt-2 text-xs text-destructive">
                      Only {product?.stock} units of {product?.name} are in stock.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Separator />
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Order Total:{" "}
              <span className="text-lg font-semibold text-foreground tabular-nums">
                {formatCurrency(total, currency)}
              </span>
            </div>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner data-icon="inline-start" />}
              {pending ? "Creating…" : "Create Order"}
            </Button>
          </div>
        </div>
      </FieldGroup>
    </form>
  );
}
