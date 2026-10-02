"use client";

import { usePathname } from "next/navigation";
import { PanelLeftIcon } from "lucide-react";
import { toggleSidebar } from "@/actions";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Collapse/expand trigger wrapped in the `toggleSidebar` form: the button
 * toggles instantly through the sidebar context (which persists via the same
 * server action), while the form itself stays a real POST target for raw/
 * no-JS submissions.
 */
export default function SidebarToggle() {
  const { open, toggleSidebar: toggle } = useSidebar();
  const pathname = usePathname();
  // The action's `collapsed` input = collapsed state AFTER the toggle. Since
  // open/collapsed are complements, toggling makes it equal the current `open`
  // (expanded → carry true = collapse; collapsed → carry false = expand).
  const targetCollapsed = open;
  const label = open ? "Collapse sidebar" : "Expand sidebar";

  return (
    <form action={toggleSidebar}>
      <input type="hidden" name="collapsed" value={String(targetCollapsed)} />
      <input type="hidden" name="path" value={pathname} />
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        title={label}
        aria-label={label}
        onClick={(event) => {
          // Client path: flip (and persist) immediately — without JS the
          // plain form POST below still collapses the rail.
          event.preventDefault();
          toggle();
        }}
      >
        <PanelLeftIcon aria-hidden />
      </Button>
    </form>
  );
}
