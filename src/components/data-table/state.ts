import { first, type SearchValue } from "@/lib/search";

/** Rows shown per page unless the URL says otherwise. */
export const DEFAULT_PAGE_SIZE = 10;

/** Params the table owns; anything else in the URL is left untouched. */
const OWNED_KEYS = ["q", "sort", "dir", "page", "size"] as const;

/** Params that belong to flash messages, never to table state. */
const RESERVED_KEYS = new Set<string>([
  ...OWNED_KEYS,
  "saved",
  "error",
  "msg",
  "registered",
  "registeredEmail",
]);

export type TableInitialState = {
  q: string;
  /** Column id, or null for the order the rows arrived in. */
  sort: string | null;
  dir: "asc" | "desc";
  /** 1-based. */
  page: number;
  size: number;
  /** Facet column id → selected values. */
  filters: Record<string, string[]>;
};

export type TableUrlState = Omit<TableInitialState, "sort" | "dir"> & {
  sort: { id: string; dir: "asc" | "desc" } | null;
};

/**
 * Reads table state out of `searchParams` so a deep link (`?q=oil&status=shipped`)
 * server-renders the same rows a visitor would get by clicking. Any param that
 * is neither table state nor flash state becomes a facet filter, which keeps
 * per-page filters like `?role=admin` working without extra plumbing.
 */
export function parseTableState(
  searchParams: Record<string, SearchValue>
): TableInitialState {
  const filters: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (RESERVED_KEYS.has(key)) continue;
    const values = (first(value) ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (values.length) filters[key] = values;
  }

  const page = Number(first(searchParams.page));
  const size = Number(first(searchParams.size));
  const dir = first(searchParams.dir) === "desc" ? "desc" : "asc";

  return {
    q: first(searchParams.q) ?? "",
    sort: first(searchParams.sort) ?? null,
    dir,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    size: Number.isInteger(size) && size > 0 ? size : DEFAULT_PAGE_SIZE,
    filters,
  };
}

/**
 * Serializes table state back into a query string, merged over the current one
 * so flash params and anything else survive. Only non-default values are
 * written, which keeps shared URLs short.
 */
export function tableSearch(state: TableUrlState, currentSearch: string): string {
  const params = new URLSearchParams(currentSearch);
  for (const key of OWNED_KEYS) params.delete(key);
  for (const key of Object.keys(state.filters)) params.delete(key);

  if (state.q) params.set("q", state.q);
  if (state.sort) {
    params.set("sort", state.sort.id);
    params.set("dir", state.sort.dir);
  }
  if (state.page > 1) params.set("page", String(state.page));
  if (state.size !== DEFAULT_PAGE_SIZE) params.set("size", String(state.size));
  for (const [key, values] of Object.entries(state.filters)) {
    if (values.length) params.set(key, values.join(","));
  }

  const search = params.toString();
  return search ? `?${search}` : "";
}