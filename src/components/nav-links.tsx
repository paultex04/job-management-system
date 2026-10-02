"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS, PINNED_NAV_ITEMS, type NavItem } from "@/lib/nav";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

/** One nav row: active state, rail tooltip, and closes the mobile drawer. */
function NavItemLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const active =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      {/* collapsed rail: registry tooltip; expanded: normal label */}
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <Link
          href={item.href}
          aria-label={item.label}
          aria-current={active ? "page" : undefined}
          onClick={() => isMobile && setOpenMobile(false)}
        >
          <Icon aria-hidden />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/**
 * The nav lives client-side so lucide icon *references* never cross the
 * server→client boundary — the layout only decides who sees the pinned items.
 * Every area is a labelled group, so adding a page means adding a row here.
 */
export default function NavLinks() {
  return (
    <nav aria-label="Main" className="flex flex-col">
      {NAV_GROUPS.map((group) => (
        <SidebarGroup key={group.title}>
          <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <NavItemLink key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </nav>
  );
}

/**
 * The pinned group at the very bottom of the sidebar, above the account
 * controls. Rendered by the layout (admin-only), not part of the areas above.
 */
export function NavPinnedLinks() {
  return (
    <SidebarMenu>
      {PINNED_NAV_ITEMS.map((item) => (
        <NavItemLink key={item.href} item={item} />
      ))}
    </SidebarMenu>
  );
}