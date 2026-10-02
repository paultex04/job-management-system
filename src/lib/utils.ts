export { cn } from "cn";

export const DEFAULT_CURRENCY = "USD";

/**
 * Currencies an admin can pick in Settings. The code is what `Intl` formats
 * with; the name is only there to make the list readable.
 */
export const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "DKK", name: "Danish Krone" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "INR", name: "Indian Rupee" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "ZAR", name: "South African Rand" },
  { code: "BRL", name: "Brazilian Real" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

const CURRENCY_CODES: string[] = CURRENCIES.map((entry) => entry.code);

export function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCY_CODES.includes(value);
}

/** Guards the formatter: an unknown code must never take a page down. */
function safeCurrency(code: string | null | undefined): string {
  return code && isCurrencyCode(code) ? code : DEFAULT_CURRENCY;
}

/** Built once per code — a table formats a whole column of figures. */
const formatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(code: string): Intl.NumberFormat {
  const safe = safeCurrency(code);
  let formatter = formatters.get(safe);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safe,
    });
    formatters.set(safe, formatter);
  }
  return formatter;
}

/** e.g. "$", "€", "¥" — for labels that can't call the formatter. */
export function currencySymbol(code?: string | null): string {
  const safe = safeCurrency(code);
  return (
    currencyFormatter(safe)
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? safe
  );
}

export function formatCurrency(
  value: number,
  code: string = DEFAULT_CURRENCY
): string {
  return currencyFormatter(code).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export const ORDER_STATUSES = [
  "draft",
  "confirmed",
  "shipped",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  confirmed: "bg-info/10 text-info",
  shipped: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

/**
 * Stock card entry types. `opening` is the balance tracking started from,
 * `order` is the automatic issue when an order is placed (and again if an
 * order is un-cancelled), `return` puts those units back when it is cancelled,
 * and `adjustment` covers a correction made straight on the product form — so
 * nothing changes stock without a row explaining it.
 */
export const STOCK_MOVEMENT_TYPES = [
  "opening",
  "receipt",
  "return",
  "issue",
  "order",
  "adjustment",
] as const;

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const MOVEMENT_STYLES: Record<
  StockMovementType,
  { label: string; className: string }
> = {
  opening: { label: "Opening balance", className: "bg-muted text-muted-foreground" },
  receipt: { label: "Received", className: "bg-success/10 text-success" },
  return: { label: "Returned to stock", className: "bg-success/10 text-success" },
  issue: { label: "Issued", className: "bg-warning/10 text-warning" },
  order: { label: "Order", className: "bg-info/10 text-info" },
  adjustment: { label: "Adjustment", className: "bg-primary/10 text-primary" },
};

/** Accent themes - ids must match the [data-theme=.] blocks in globals.css. */
export const THEMES = [
  { id: "blue", name: "Blue", accent: "#2563eb" },
  { id: "emerald", name: "Emerald", accent: "#059669" },
  { id: "violet", name: "Violet", accent: "#7c3aed" },
  { id: "rose", name: "Rose", accent: "#e11d48" },
  { id: "amber", name: "Amber", accent: "#d97706" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const THEME_IDS: string[] = THEMES.map((t) => t.id);
export const DEFAULT_THEME: ThemeId = "blue";

export function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as string[]).includes(value);
}
