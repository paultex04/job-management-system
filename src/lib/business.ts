import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CURRENCY, isCurrencyCode } from "@/lib/utils";

/**
 * The workspace's business row (always id "singleton"), fetched once per
 * request so the layout and every page can ask for it without extra queries.
 */
export const getBusiness = cache(() =>
  prisma.business.findUnique({ where: { id: "singleton" } })
);

/** The currency every figure in the workspace is shown in. */
export async function getCurrency(): Promise<string> {
  const code = (await getBusiness())?.currency;
  return code && isCurrencyCode(code) ? code : DEFAULT_CURRENCY;
}
