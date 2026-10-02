"use client";

import { useEffect } from "react";
import { toast } from "sonner";

// Flash messages travel as query params (?saved=1 / ?error=...) — server
// actions keep redirecting exactly as before — but they are *presented* as
// sonner toasts. Renders nothing itself; the <Toaster /> lives in the root
// layout. The params are stripped from the URL after firing so a refresh
// doesn't replay them.
export default function Flash({
  error,
  saved,
  message = "Saved successfully.",
  param,
  msg,
}: {
  error?: string;
  saved?: string;
  message?: string;
  /** Name of the query param that triggered a success (e.g. "registered"). */
  param?: string;
  /** Success copy carried in the URL, used by the bulk table actions. */
  msg?: string;
}) {
  useEffect(() => {
    if (error) {
      toast.error(error, { id: "flash-error" });
    } else if (saved || msg) {
      toast.success(msg ?? message, { id: "flash-success" });
    } else {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("saved");
    url.searchParams.delete("error");
    url.searchParams.delete("msg");
    if (param) url.searchParams.delete(param);
    window.history.replaceState(window.history.state, "", url);
  }, [error, saved, message, param, msg]);

  return null;
}
