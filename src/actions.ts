"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/session";
import { optimizeImage } from "@/lib/image";
import {
  isCurrencyCode,
  isThemeId,
  ORDER_STATUSES,
  type StockMovementType,
} from "@/lib/utils";
import type { Prisma } from "@prisma/client";

const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Invalid email").or(z.literal("")).optional(),
  phone: z.string().trim().max(50).optional(),
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});

const productSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required").max(50),
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(2000).optional(),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  cost: z.coerce.number().min(0, "Cost must be 0 or more"),
  stock: z.coerce
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
  reorderLevel: z.coerce.number().int("Reorder level must be a whole number"),
  active: z.coerce.boolean(),
});

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Invalid email"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

const TEAM_ROLES = ["admin", "manager", "staff"] as const;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 20_000_000; // 20 MB

const businessSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(200),
  email: z.string().trim().email("Invalid email").or(z.literal("")).optional(),
  phone: z.string().trim().max(50).optional(),
  address: z.string().trim().max(300).optional(),
  website: z.string().trim().max(200).optional(),
  currency: z
    .string()
    .trim()
    .refine(isCurrencyCode, "Pick a currency from the list"),
});

/**
 * Optional image upload: returns a data URL, `null` when explicitly removed,
 * or `undefined` when nothing was submitted.
 */
async function readImageUpload(
  formData: FormData,
  field: string,
  removeField: string,
  backTo: string
): Promise<string | null | undefined> {
  if (formData.get(removeField) === "on") return null;

  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return undefined;

  if (!IMAGE_TYPES.includes(file.type)) {
    fail(backTo, "Image must be a PNG, JPEG, WebP or GIF file.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    fail(backTo, "Image must be 20 MB or smaller.");
  }

  // resize/compress for the web so pages stay fast (these are inlined as
  // data URLs on every page render)
  try {
    return await optimizeImage(Buffer.from(await file.arrayBuffer()));
  } catch {
    fail(backTo, "That image could not be read. Try a PNG, JPEG, WebP or GIF file.");
  }
}

const orderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  notes: z.string().trim().max(2000).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1),
      })
    )
    .min(1, "Add at least one line item"),
});

export type ActionState = { error?: string; success?: string } | null;

function clean(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}

/** Validate, or redirect back to `backTo` with an error banner. */
function parseOrRedirect<T>(
  schema: z.ZodType<T>,
  input: unknown,
  backTo: string
): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid input";
    redirect(`${backTo}?error=${encodeURIComponent(message)}`);
  }
  return result.data;
}

function fail(backTo: string, message: string): never {
  redirect(`${backTo}?error=${encodeURIComponent(message)}`);
}

function saved(path: string): never {
  redirect(`${path}?saved=1`);
}

/* ------------------------------- Auth ------------------------------- */

export async function login(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = clean(formData.get("email"));
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Email and password are required." };

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error; // successful sign-in redirects and lands here
  }
}

export async function registerUser(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: clean(formData.get("name")),
    email: clean(formData.get("email")),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };

  const count = await prisma.user.count();
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      role: count === 0 ? "admin" : "staff",
    },
  });

  redirect("/login?registered=1");
}

/* ----------------------------- Customers ----------------------------- */

function toCustomerInput(fd: FormData, backTo: string) {
  return parseOrRedirect(
    customerSchema,
    {
      name: clean(fd.get("name")),
      email: clean(fd.get("email")),
      phone: clean(fd.get("phone")),
      address: clean(fd.get("address")),
      city: clean(fd.get("city")),
      country: clean(fd.get("country")),
      notes: clean(fd.get("notes")),
    },
    backTo
  );
}

export async function createCustomer(formData: FormData) {
  await requireUser();
  const backTo = "/customers/new";
  const data = toCustomerInput(formData, backTo);
  try {
    await prisma.customer.create({
      data: { ...data, email: data.email || null },
    });
  } catch {
    fail(backTo, "Could not save the customer.");
  }
  revalidatePath("/customers");
  saved("/customers");
}

export async function updateCustomer(id: string, formData: FormData) {
  await requireUser();
  const backTo = `/customers/${id}`;
  const data = toCustomerInput(formData, backTo);
  try {
    await prisma.customer.update({
      where: { id },
      data: { ...data, email: data.email || null },
    });
  } catch {
    fail(backTo, "Could not save the customer.");
  }
  revalidatePath("/customers");
  saved(`/customers/${id}`);
}

export async function deleteCustomer(id: string) {
  await requireUser();
  try {
    await prisma.customer.delete({ where: { id } });
  } catch {
    fail("/customers", "Cannot delete a customer that has orders.");
  }
  revalidatePath("/customers");
}

/* ------------------------------ Products ------------------------------ */

/** Thrown when a movement would take stock below zero. */
class StockError extends Error {}

type StockDb = Pick<Prisma.TransactionClient, "product" | "stockMovement">;

/**
 * The single place stock changes. It moves the product's `stock` and appends a
 * stock-card row holding the resulting balance, so the ledger always explains
 * the number on hand. Call it inside a transaction when other writes must
 * share the same outcome (see createOrder).
 *
 * `quantity` is signed: positive receives stock, negative issues it.
 */
async function recordMovement(
  db: StockDb,
  entry: {
    productId: string;
    type: StockMovementType;
    quantity: number;
    reference?: string | null;
    note?: string | null;
    userId?: string | null;
  }
): Promise<number> {
  const product = await db.product.findUnique({
    where: { id: entry.productId },
    select: { stock: true, name: true },
  });
  if (!product) throw new StockError("That product no longer exists.");

  const balance = product.stock + entry.quantity;
  if (balance < 0) {
    throw new StockError(
      `Insufficient stock for ${product.name} (only ${product.stock} left).`
    );
  }

  await db.product.update({
    where: { id: entry.productId },
    data: { stock: balance },
  });
  await db.stockMovement.create({
    data: {
      productId: entry.productId,
      type: entry.type,
      quantity: entry.quantity,
      balance,
      reference: entry.reference || null,
      note: entry.note || null,
      userId: entry.userId ?? null,
    },
  });

  return balance;
}

const stockMovementSchema = z.object({
  direction: z.enum(["receive", "issue"]),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Enter a quantity of at least 1")
    .max(100000, "That quantity is too large"),
  reference: z.string().trim().max(80).optional(),
  note: z.string().trim().max(300).optional(),
});

/** Receive or issue stock from a product's stock card. */
export async function recordStockMovement(id: string, formData: FormData) {
  const user = await requireUser();
  const backTo = `/products/${id}`;

  const parsed = stockMovementSchema.safeParse({
    direction: clean(formData.get("direction")),
    quantity: clean(formData.get("quantity")),
    reference: clean(formData.get("reference")),
    note: clean(formData.get("note")),
  });
  if (!parsed.success) {
    fail(backTo, parsed.error.issues[0]?.message ?? "Invalid movement.");
  }

  const { direction, quantity, reference, note } = parsed.data;
  const receiving = direction === "receive";

  let balance = 0;
  try {
    balance = await prisma.$transaction((tx) =>
      recordMovement(tx, {
        productId: id,
        type: receiving ? "receipt" : "issue",
        quantity: receiving ? quantity : -quantity,
        reference,
        note,
        userId: user.id,
      })
    );
  } catch (error) {
    if (error instanceof StockError) fail(backTo, error.message);
    fail(backTo, "Could not record that stock movement.");
  }

  revalidatePath(backTo);
  revalidatePath("/products");
  revalidatePath("/dashboard");
  savedWith(
    backTo,
    `${receiving ? "Received" : "Issued"} ${quantity} unit${
      quantity === 1 ? "" : "s"
    } · ${balance} on hand.`
  );
}

function toProductInput(fd: FormData, backTo: string) {
  return parseOrRedirect(
    productSchema,
    {
      ...Object.fromEntries(fd.entries()),
      active: fd.get("active") === "on",
    },
    backTo
  );
}

export async function createProduct(formData: FormData) {
  const user = await requireUser();
  const backTo = "/products/new";
  const data = toProductInput(formData, backTo);

  const exists = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (exists) fail(backTo, "A product with this SKU already exists.");

  try {
    await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: { ...data, description: data.description || null },
      });
      // A new product starts with an opening balance so its stock card can
      // account for every unit from day one.
      if (created.stock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: created.id,
            type: "opening",
            quantity: created.stock,
            balance: created.stock,
            note: "Opening balance",
            userId: user.id,
          },
        });
      }
    });
  } catch {
    fail(backTo, "Could not save the product.");
  }
  revalidatePath("/products");
  saved("/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const user = await requireUser();
  const backTo = `/products/${id}`;
  const data = toProductInput(formData, backTo);

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) fail(backTo, "That product no longer exists.");

  if (existing.sku !== data.sku) {
    const conflict = await prisma.product.findUnique({
      where: { sku: data.sku },
    });
    if (conflict) fail(backTo, "A product with this SKU already exists.");
  }

  const adjustment = data.stock - existing.stock;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: { ...data, description: data.description || null },
      });
      // Typing a new figure in "stock on hand" is a movement, so the card
      // records it instead of the number changing behind the ledger's back.
      if (adjustment !== 0) {
        await recordMovement(tx, {
          productId: id,
          type: "adjustment",
          quantity: adjustment,
          note: "Stock corrected on the product form",
          userId: user.id,
        });
      }
    });
  } catch (error) {
    fail(
      backTo,
      error instanceof StockError
        ? error.message
        : "Could not save the product."
    );
  }
  revalidatePath("/products");
  revalidatePath(backTo);
  saved(backTo);
}

export async function deleteProduct(id: string) {
  await requireUser();
  try {
    await prisma.product.delete({ where: { id } });
  } catch {
    fail("/products", "Cannot delete a product that appears on orders.");
  }
  revalidatePath("/products");
}

/* -------------------------------- Orders -------------------------------- */

export async function createOrder(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  let rawItems: unknown = [];
  try {
    rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Malformed line items." };
  }

  const parsed = orderSchema.safeParse({
    customerId: clean(formData.get("customerId")),
    notes: clean(formData.get("notes")),
    items: rawItems,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid order" };

  const { customerId, notes, items } = parsed.data;

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return { error: "Selected customer no longer exists." };

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product) return { error: "One of the selected products no longer exists." };
    if (!product.active) return { error: `${product.name} is no longer active.` };
    if (product.stock < item.quantity) {
      return {
        error: `Insufficient stock for ${product.name} (only ${product.stock} left).`,
      };
    }
  }

  const total = items.reduce(
    (sum, item) => sum + item.quantity * (productById.get(item.productId)?.price ?? 0),
    0
  );

  const count = await prisma.order.count();
  const orderNumber = `SO-${String(count + 1).padStart(4, "0")}`;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          orderNumber,
          status: "confirmed",
          total,
          notes: notes || null,
          customerId,
          createdById: user.id,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: productById.get(item.productId)!.price,
            })),
          },
        },
      });

      for (const item of items) {
        // Issuing stock for an order is a stock movement, so it shows up on
        // each product's stock card against the order number.
        await recordMovement(tx, {
          productId: item.productId,
          type: "order",
          quantity: -item.quantity,
          reference: orderNumber,
          userId: user.id,
        });
      }
    });
  } catch (error) {
    if (error instanceof StockError) return { error: error.message };
    return { error: "Could not create the order. Stock may have changed, try again." };
  }

  revalidatePath("/orders");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  for (const item of items) revalidatePath(`/products/${item.productId}`);
  redirect("/orders?saved=1");
}

/**
 * Cancelling an order puts its units back on the shelf; moving it out of
 * `cancelled` takes them out again.
 *
 * Cancelling hands back what the order actually took, read from its own stock
 * card rows, so an order whose units were never recorded leaving (older data)
 * cannot inflate the shelf and re-saving never double-counts. Un-cancelling
 * issues the line items again, which is what a live order means.
 */
async function applyOrderStock(
  tx: StockDb,
  order: {
    orderNumber: string;
    status: string;
    items: { productId: string; quantity: number }[];
  },
  next: string,
  userId: string
): Promise<void> {
  const wasCancelled = order.status === "cancelled";
  const becomesCancelled = next === "cancelled";
  if (wasCancelled === becomesCancelled) return;

  if (becomesCancelled) {
    // Hand back what this order actually took, read from its own stock card
    // rows — an order whose units were never recorded leaving cannot inflate
    // the shelf, and re-saving can never double-count.
    const recorded = await tx.stockMovement.groupBy({
      by: ["productId"],
      where: {
        reference: order.orderNumber,
        type: { in: ["order", "return"] },
      },
      _sum: { quantity: true },
    });
    // negative = units this order still has out of stock
    const outstanding = new Map(
      recorded.map((row) => [row.productId, row._sum.quantity ?? 0])
    );

    for (const item of order.items) {
      const taken = outstanding.get(item.productId) ?? 0;
      if (taken < 0) {
        await recordMovement(tx, {
          productId: item.productId,
          type: "return",
          quantity: -taken,
          reference: order.orderNumber,
          userId,
        });
      }
    }
    return;
  }

  // un-cancelling: the order is live again, so its items go back out
  for (const item of order.items) {
    await recordMovement(tx, {
      productId: item.productId,
      type: "order",
      quantity: -item.quantity,
      reference: order.orderNumber,
      userId,
    });
  }
}

/**
 * Status change shared by the order page and the orders table's bulk action, so
 * both keep the stock card honest. Returns the orders it touched.
 */
async function setOrderStatus(orderIds: string[], next: string, userId: string) {
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    include: { items: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const order of orders) {
      await applyOrderStock(tx, order, next, userId);
      await tx.order.update({ where: { id: order.id }, data: { status: next } });
    }
  });

  return orders;
}

/** Revalidate the given paths plus every product page whose stock moved. */
function revalidateStockViews(
  orders: { items: { productId: string }[] }[],
  paths: string[]
) {
  revalidatePath("/products");
  for (const path of paths) revalidatePath(path);
  for (const order of orders) {
    for (const item of order.items) {
      revalidatePath(`/products/${item.productId}`);
    }
  }
}

export async function updateOrderStatus(orderId: string, formData: FormData) {
  const user = await requireUser();
  const status = clean(formData.get("status"));
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    fail(`/orders/${orderId}`, "Invalid status.");
  }

  let orders;
  try {
    orders = await setOrderStatus([orderId], status, user.id);
  } catch (error) {
    fail(
      `/orders/${orderId}`,
      error instanceof StockError
        ? // the order left the shelf while it was cancelled, so there may be no
          // units left to put it back on
          `${error.message} Leave the order cancelled.`
        : "Could not update the order."
    );
  }
  if (!orders.length) fail(`/orders/${orderId}`, "That order no longer exists.");

  revalidateStockViews(orders, [
    "/orders",
    `/orders/${orderId}`,
    "/dashboard",
  ]);
}

/* -------------------------------- Profile -------------------------------- */

export async function updateProfile(formData: FormData) {
  const current = await requireUser();
  const backTo = "/profile";

  const data = parseOrRedirect(
    profileSchema,
    { name: clean(formData.get("name")), email: clean(formData.get("email")) },
    backTo
  );

  const email = data.email.toLowerCase();
  const clash = await prisma.user.findUnique({ where: { email } });
  if (clash && clash.id !== current.id) {
    fail(backTo, "That email address is already in use.");
  }

  // profile picture: optional upload, or explicit removal
  const avatar = await readImageUpload(formData, "avatar", "removeAvatar", backTo);

  try {
    await prisma.user.update({
      where: { id: current.id },
      data: {
        name: data.name,
        email,
        ...(avatar !== undefined ? { avatar } : {}),
      },
    });
  } catch {
    fail(backTo, "Could not save your profile.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  saved(backTo);
}

export async function changePassword(formData: FormData) {
  const current = await requireUser();
  const backTo = "/profile";

  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) fail(backTo, parsed.error.issues[0].message);

  const user = await prisma.user.findUnique({ where: { id: current.id } });
  if (!user) fail(backTo, "Account not found.");

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) fail(backTo, "Current password is incorrect.");

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
  });

  revalidatePath("/profile");
  saved(backTo);
}

export async function updateTheme(formData: FormData) {
  const user = await requireUser();
  const theme = clean(formData.get("theme"));
  if (!isThemeId(theme)) fail("/profile", "Unknown theme.");

  await prisma.user.update({ where: { id: user.id }, data: { theme } });
  revalidatePath("/", "layout");
  revalidatePath("/profile");
  saved("/profile");
}

/* --------------------------- Appearance / settings ------------------------ */

export async function setColorMode(formData: FormData) {
  const user = await requireUser();
  const mode = clean(formData.get("mode"));
  if (mode !== "light" && mode !== "dark") return;

  // where to send the user back to (same-page redirect re-renders <html>)
  const path = clean(formData.get("path"));
  const backTo = path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";

  await prisma.user.update({ where: { id: user.id }, data: { colorMode: mode } });
  revalidatePath("/", "layout");
  redirect(backTo);
}

export async function toggleSidebar(formData: FormData) {
  const user = await requireUser();
  const collapsed = clean(formData.get("collapsed")) === "true";

  const path = clean(formData.get("path"));
  const backTo = path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";

  await prisma.user.update({
    where: { id: user.id },
    data: { sidebarCollapsed: collapsed },
  });
  revalidatePath("/", "layout");
  redirect(backTo);
}

export async function updateBusiness(formData: FormData) {
  await requireAdmin();
  const backTo = "/settings";

  const data = parseOrRedirect(
    businessSchema,
    {
      name: clean(formData.get("name")),
      email: clean(formData.get("email")),
      phone: clean(formData.get("phone")),
      address: clean(formData.get("address")),
      website: clean(formData.get("website")),
      currency: clean(formData.get("currency")),
    },
    backTo
  );

  const logo = await readImageUpload(formData, "logo", "removeLogo", backTo);

  try {
    await prisma.business.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        website: data.website || null,
        currency: data.currency,
        ...(logo !== undefined ? { logo } : {}),
      },
      update: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        website: data.website || null,
        currency: data.currency,
        ...(logo !== undefined ? { logo } : {}),
      },
    });
  } catch {
    fail(backTo, "Could not save the business details.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  saved(backTo);
}

/* ------------------------------ Team (admin) ------------------------------ */

export async function createTeamMember(formData: FormData) {
  await requireAdmin();
  const backTo = "/team";
  const parsed = registerSchema.safeParse({
    name: clean(formData.get("name")),
    email: clean(formData.get("email")),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) fail(backTo, parsed.error.issues[0].message);

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) fail(backTo, "An account with this email already exists.");

  const role = clean(formData.get("role"));
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      role: role === "manager" ? "manager" : "staff",
    },
  });
  revalidatePath("/team");
  saved(backTo);
}

export async function updateTeamMember(id: string, formData: FormData) {
  const admin = await requireAdmin();
  const backTo = `/team/${id}`;

  const parsed = profileSchema.safeParse({
    name: clean(formData.get("name")),
    email: clean(formData.get("email")),
  });
  if (!parsed.success) fail(backTo, parsed.error.issues[0].message);

  const role = clean(formData.get("role"));
  if (!TEAM_ROLES.includes(role as (typeof TEAM_ROLES)[number])) {
    fail(backTo, "Invalid role.");
  }

  // an admin cannot change their own role (or lock themselves out)
  if (id === admin.id && role !== admin.role) {
    fail(backTo, "You cannot change your own role.");
  }

  const email = parsed.data.email.toLowerCase();
  const clash = await prisma.user.findUnique({ where: { email } });
  if (clash && clash.id !== id) fail(backTo, "That email address is already in use.");

  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword && newPassword.length < 8) {
    fail(backTo, "New password must be at least 8 characters.");
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: parsed.data.name,
        email,
        role,
        ...(newPassword
          ? { passwordHash: await bcrypt.hash(newPassword, 10) }
          : {}),
      },
    });
  } catch {
    fail(backTo, "Could not save this team member.");
  }

  revalidatePath("/team");
  revalidatePath("/team/" + id);
  saved("/team");
}

export async function deleteUser(id: string) {
  const admin = await requireAdmin();
  if (admin.id === id) fail("/team", "You cannot delete your own account.");
  try {
    await prisma.user.delete({ where: { id } });
  } catch {
    fail("/team", "Could not delete this user.");
  }
  revalidatePath("/team");
}

/* --------------------------- Bulk table actions --------------------------- */

/** Row ids arrive from the data table's selection column. */
function tableIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
    .slice(0, 200);
}

/**
 * Bulk actions return the visitor to the exact table view they came from, so the
 * caller echoes its current URL. Only same-page paths with a plain query string
 * are honoured — never let a request redirect somewhere else.
 */
function tableBackTo(value: unknown, page: string): string {
  if (typeof value !== "string") return page;
  const [path, query] = value.split("?");
  if (path !== page || !query) return page;
  return /^[A-Za-z0-9%.,=_&*-]*$/.test(query) ? `${page}?${query}` : page;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function savedWith(backTo: string, message: string): never {
  const separator = backTo.includes("?") ? "&" : "?";
  redirect(
    `${backTo}${separator}saved=1&msg=${encodeURIComponent(message)}`
  );
}

export async function bulkDeleteProducts(ids: unknown, backTo: unknown) {
  await requireUser();
  const back = tableBackTo(backTo, "/products");
  const selected = tableIds(ids);
  if (!selected.length) return;

  let deleted = 0;
  let skipped = 0;
  for (const id of selected) {
    try {
      await prisma.product.delete({ where: { id } });
      deleted++;
    } catch {
      // Referenced by an order item (Restrict) — leave it in place.
      skipped++;
    }
  }

  revalidatePath("/products");
  revalidatePath("/dashboard");

  if (!deleted) {
    fail(back, "Nothing was deleted — products on orders can't be removed.");
  }
  savedWith(
    back,
    skipped
      ? `Deleted ${plural(deleted, "product")}, skipped ${skipped} on orders.`
      : `Deleted ${plural(deleted, "product")}.`
  );
}

export async function bulkDeleteCustomers(ids: unknown, backTo: unknown) {
  await requireUser();
  const back = tableBackTo(backTo, "/customers");
  const selected = tableIds(ids);
  if (!selected.length) return;

  let deleted = 0;
  let skipped = 0;
  for (const id of selected) {
    try {
      await prisma.customer.delete({ where: { id } });
      deleted++;
    } catch {
      skipped++;
    }
  }

  revalidatePath("/customers");
  revalidatePath("/orders");
  revalidatePath("/dashboard");

  if (!deleted) fail(back, "No customers could be deleted.");
  savedWith(
    back,
    skipped
      ? `Deleted ${plural(deleted, "customer")}, skipped ${skipped}.`
      : `Deleted ${plural(deleted, "customer")}.`
  );
}

export async function bulkSetOrderStatus(
  ids: unknown,
  backTo: unknown,
  formData: FormData
) {
  const user = await requireUser();
  const back = tableBackTo(backTo, "/orders");
  const status = clean(formData.get("status"));
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    fail(back, "Invalid status.");
  }

  const selected = tableIds(ids);
  if (!selected.length) return;

  // Same path as the order page, so cancelling here returns the stock too.
  let orders;
  try {
    orders = await setOrderStatus(selected, status, user.id);
  } catch (error) {
    // one transaction: either every order moves or none of them do
    fail(
      back,
      error instanceof StockError
        ? `Nothing was changed — ${error.message.charAt(0).toLowerCase()}${error.message.slice(1)}`
        : "Could not update the orders."
    );
  }

  revalidateStockViews(orders, ["/orders", "/dashboard"]);

  const returning = status === "cancelled" ? " and their stock returned" : "";
  savedWith(
    back,
    `${plural(orders.length, "order")} marked ${status}${returning}.`
  );
}

export async function bulkRemoveUsers(ids: unknown, backTo: unknown) {
  const admin = await requireAdmin();
  const back = tableBackTo(backTo, "/team");
  const selected = tableIds(ids).filter((id) => id !== admin.id);
  if (!selected.length) fail(back, "You cannot remove your own account.");

  const result = await prisma.user.deleteMany({ where: { id: { in: selected } } });
  revalidatePath("/team");

  const skipped = tableIds(ids).length - selected.length;
  savedWith(
    back,
    skipped
      ? `Removed ${plural(result.count, "teammate")}; your own account was kept.`
      : `Removed ${plural(result.count, "teammate")}.`
  );
}
