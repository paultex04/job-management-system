"use client";

import { signOut } from "next-auth/react";
import { LogOutIcon } from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export default function SignOutButton() {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip="Sign out">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOutIcon aria-hidden />
          <span>Sign out</span>
        </button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
