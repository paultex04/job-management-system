import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_THEME, isThemeId } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "OpenERP",
    template: "%s | OpenERP",
  },
  description: "A lightweight ERP built with Next.js, Prisma and SQLite",
};

async function currentAppearance(): Promise<{ theme: string; mode: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { theme: DEFAULT_THEME, mode: "light" };
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { theme: true, colorMode: true },
    });
    return {
      theme: user && isThemeId(user.theme) ? user.theme : DEFAULT_THEME,
      mode: user?.colorMode === "dark" ? "dark" : "light",
    };
  } catch {
    return { theme: DEFAULT_THEME, mode: "light" };
  }
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { theme, mode } = await currentAppearance();

  return (
    <html
      lang="en"
      data-theme={theme}
      data-mode={mode}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${
        mode === "dark" ? " dark" : ""
      }`}
    >
      <head>
        {/* matches the page background for the active color mode */}
        <meta name="theme-color" content={mode === "dark" ? "#0a0a0a" : "#ffffff"} />
      </head>
      <body className="min-h-full">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
