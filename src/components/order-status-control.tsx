"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OrderStatusControl({
  value,
  options,
  action,
}: {
  value: string;
  options: readonly string[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [status, setStatus] = useState(value);
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);

  // The server owns the status: once it sends back what it saved, drop the
  // local pick so the control shows the truth rather than the pending choice.
  // Adjust-during-render pattern: guarded, so no effect and no cascade.
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setStatus(value);
  }

  const dirty = status !== value;
  const willCancel = status === "cancelled" && dirty;

  function pickStatus(next: string) {
    setStatus(next);
    // a fresh pick needs a fresh confirmation
    confirmedRef.current = false;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    // cancelling an order is destructive — confirm first
    if (willCancel && !confirmedRef.current) {
      e.preventDefault();
      setConfirming(true);
      return;
    }
    setPending(true);
  }

  function confirmCancel() {
    confirmedRef.current = true;
    setConfirming(false);
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form
        ref={formRef}
        action={action}
        onSubmit={onSubmit}
        className="flex items-center gap-2"
      >
        <Select name="status" value={status} onValueChange={pickStatus}>
          <SelectTrigger className="capitalize" aria-label="Order status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={!dirty || pending}>
          {pending && <Spinner data-icon="inline-start" />}
          {pending ? "Saving…" : "Update Status"}
        </Button>
      </form>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              The status will be set to cancelled and saved immediately, and
              everything on the order goes back into stock. Moving it off
              cancelled again takes the stock back out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Keep Status</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={confirmCancel}>
              Cancel Order
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
