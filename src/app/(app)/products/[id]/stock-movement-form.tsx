import { recordStockMovement } from "@/actions";
import SubmitButton from "@/components/submit-button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Receive stock in or issue it out. The direction drives the sign server-side
 * (`receipt` / `issue`), so the ledger records the move rather than the form
 * trusting a number it typed itself.
 */
export default function StockMovementForm({ productId }: { productId: string }) {
  return (
    <form action={recordStockMovement.bind(null, productId)}>
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="direction">Movement</FieldLabel>
            <Select name="direction" defaultValue="receive">
              <SelectTrigger id="direction" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="receive">Receive — add to stock</SelectItem>
                  <SelectItem value="issue">Issue — take out of stock</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="quantity">Quantity *</FieldLabel>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="1"
              min="1"
              required
              placeholder="0"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="reference">Reference</FieldLabel>
            <Input
              id="reference"
              name="reference"
              maxLength={80}
              autoComplete="off"
              placeholder="PO-1042, or a reason…"
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="note">Note</FieldLabel>
          <Input
            id="note"
            name="note"
            maxLength={300}
            autoComplete="off"
            placeholder="Optional detail — supplier, damage, internal use…"
          />
        </Field>

        <div className="flex items-center gap-3">
          <SubmitButton>Record movement</SubmitButton>
        </div>
      </FieldGroup>
    </form>
  );
}