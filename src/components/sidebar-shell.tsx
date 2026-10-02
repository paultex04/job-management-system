"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { toggleSidebar } from "@/actions";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Owns the sidebar's open/collapsed state for the whole shell.
 *
 * - State is *controlled* so a server action redirect (or any RSC refresh)
 *   stays the source of truth: `defaultOpen` changes are synced back in.
 * - Every desktop state change (trigger, rail, Ctrl/Cmd+B) persists through
 *   the same `toggleSidebar` server action; the mobile drawer uses its own
 *   state inside the registry and never persists.
 */
export default function SidebarShell({
  defaultOpen,
  children,
}: {
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(defaultOpen);
  const [, startTransition] = React.useTransition();

  // Server truth wins after redirects/refreshes (also heals failed writes).
  // Adjust-during-render pattern: guarded, so no effect and no cascade.
  const [syncedDefault, setSyncedDefault] = React.useState(defaultOpen);
  if (defaultOpen !== syncedDefault) {
    setSyncedDefault(defaultOpen);
    setOpen(defaultOpen);
  }

  const persist = React.useCallback(
    (next: boolean) => {
      const formData = new FormData();
      formData.set("collapsed", String(!next));
      formData.set("path", pathname + window.location.search);
      startTransition(() => void toggleSidebar(formData));
    },
    [pathname]
  );

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          persist(next);
        }}
      >
        {children}
      </SidebarProvider>
    </TooltipProvider>
  );
}
