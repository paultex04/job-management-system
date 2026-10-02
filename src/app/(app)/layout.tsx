import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBusiness } from "@/lib/business";
import { requireUser } from "@/lib/session";
import NavLinks, { NavPinnedLinks } from "@/components/nav-links";
import Avatar from "@/components/avatar";
import Brand from "@/components/brand";
import ColorModeToggle from "@/components/color-mode-toggle";
import SidebarShell from "@/components/sidebar-shell";
import SidebarToggle from "@/components/sidebar-toggle";
import SignOutButton from "@/components/sign-out-button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireUser();
  const isAdmin = sessionUser.role === "admin";

  const [user, business] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        colorMode: true,
        sidebarCollapsed: true,
      },
    }),
    getBusiness(),
  ]);

  // fall back to the session claims if the row was deleted mid-session
  const display = user ?? {
    id: sessionUser.id,
    name: sessionUser.name ?? "",
    email: sessionUser.email ?? "",
    role: sessionUser.role ?? "staff",
    avatar: null as string | null,
    colorMode: "light",
    sidebarCollapsed: false,
  };

  const mode = display.colorMode === "dark" ? "dark" : "light";
  const collapsed = display.sidebarCollapsed;
  const brandName = business?.name ?? "OpenERP";

  return (
    <SidebarShell defaultOpen={!collapsed}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* Sidebar — icon rail on desktop, slide-over drawer on mobile */}
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild tooltip={brandName}>
                <Link href="/dashboard">
                  <Brand name={brandName} logo={business?.logo} />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* areas, each a labelled group — add rows in @/lib/nav */}
        <SidebarContent>
          <NavLinks />
        </SidebarContent>

        <SidebarFooter>
          {/* pinned below the areas, above the account controls (admin-only) */}
          {isAdmin && <NavPinnedLinks />}
          <SidebarSeparator />
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                tooltip={`${display.name} · profile`}
              >
                <Link href="/profile">
                  <Avatar src={display.avatar} name={display.name} size="size-8" />
                  <span className="grid min-w-0 flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-medium">
                      {display.name}
                    </span>
                    <span className="truncate text-xs capitalize text-sidebar-foreground/70">
                      {display.role} · profile
                    </span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <ColorModeToggle mode={mode} />
            <SignOutButton />
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* min-w-0: without it the flex item keeps its min-content width and a
          wide data table would stretch the whole shell sideways. */}
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-3 border-b bg-background px-3 [view-transition-name:app-topbar]">
          <SidebarToggle />
          {/* identity while the drawer holds the brand on mobile */}
          <Link href="/dashboard" className="min-w-0 md:hidden">
            <Brand name={brandName} logo={business?.logo} />
          </Link>
        </header>

        <div id="main" tabIndex={-1} className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarShell>
  );
}
