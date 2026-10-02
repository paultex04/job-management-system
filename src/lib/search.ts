/** `searchParams` values arrive as `string | string[] | undefined`. */
export type SearchValue = string | string[] | undefined;

export function first(value: SearchValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
