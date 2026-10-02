import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboardIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingCartIcon,
  UsersIcon,
  UsersRoundIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/**
 * Navigation is grouped by area, so a new capability has an obvious home (an
 * invoice belongs under Sales, a purchase order under Purchasing, reporting
 * under Insights) instead of growing one flat list. Add a row to the group it
 * belongs to; only add a group when a whole new area arrives.
 */
export type NavGroup = { title: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon }],
  },
  {
    title: "Sales",
    items: [
      { href: "/orders", label: "Orders", icon: ShoppingCartIcon },
      { href: "/customers", label: "Customers", icon: UsersIcon },
    ],
  },
  {
    title: "Catalog",
    items: [{ href: "/products", label: "Products", icon: PackageIcon }],
  },
  {
    title: "Workspace",
    items: [{ href: "/team", label: "Team", icon: UsersRoundIcon }],
  },
];

/**
 * Pinned outside the groups, at the bottom of the sidebar, so it stays put as
 * areas are added. Admin-only — the layout decides who sees it.
 */
export const PINNED_NAV_ITEMS: NavItem[] = [
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];