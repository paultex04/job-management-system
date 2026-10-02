"use client";

import { usePathname } from "next/navigation";
import { MoonIcon, SunIcon } from "lucide-react";
import { setColorMode } from "@/actions";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export default function ColorModeToggle({ mode }: { mode: "light" | "dark" }) {
  const pathname = usePathname();
  const next = mode === "dark" ? "light" : "dark";
  const label = mode === "dark" ? "Light mode" : "Dark mode";

  return (
    <SidebarMenuItem>
      <form action={setColorMode}>
        <input type="hidden" name="mode" value={next} />
        <input type="hidden" name="path" value={pathname} />
        <SidebarMenuButton
          asChild
          tooltip={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <button
            type="submit"
            onClick={() => {
              // Flip <html> immediately so the switch never waits on a roundtrip.
              document.documentElement.classList.toggle("dark", next === "dark");
              document.documentElement.setAttribute("data-mode", next);
            }}
          >
            {mode === "dark" ? (
              <SunIcon aria-hidden />
            ) : (
              <MoonIcon aria-hidden />
            )}
            <span>{label}</span>
          </button>
        </SidebarMenuButton>
      </form>
    </SidebarMenuItem>
  );
}
