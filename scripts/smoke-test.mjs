// Smoke test against a running dev server: `npm run dev` then `npm run test:smoke`
// Covers: auth, registration, CRUD actions, orders + stock, profile (details /
// avatar / theme / password), admin-only team management and the toast/dialog
// feedback (server renders no banners; the Toaster + AlertDialog do the talking).
// Cleans up after itself.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ADMIN = { email: "admin@erp.local", password: "admin1234" };
const cookies = new Map();

let failures = 0;
function check(label, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? ` — ${extra}` : ""}`);
  if (!ok) failures++;
}

function jar(res) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(";");
    const idx = pair.indexOf("=");
    cookies.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
  }
}
const cookieHeader = () =>
  [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

async function req(url, init = {}) {
  const res = await fetch(BASE + url, {
    ...init,
    redirect: "manual",
    headers: { ...(init.headers ?? {}), cookie: cookieHeader() },
  });
  jar(res);
  return res;
}

const decode = (s) =>
  s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

/** Collect React's hidden progressive-enhancement fields + form fields. */
function formFields(html, overrides = {}, marker = null) {
  const forms = html.match(/<form[\s\S]*?<\/form>/g) ?? [];
  const form = marker ? forms.find((f) => f.includes(marker)) : forms[0];
  if (!form) throw new Error(`no <form>${marker ? ` matching "${marker}"` : ""} found`);
  const fd = new FormData();
  const hidden = [
    ...form.matchAll(/<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?/g),
  ];
  for (const [, name, value = ""] of hidden) fd.set(decode(name), decode(value));
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

async function login(email, password) {
  cookies.clear();
  const csrf = await (await req("/api/auth/csrf")).json();
  return req("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      email,
      password,
      callbackUrl: BASE,
    }),
  });
}

async function isSignedIn() {
  const res = await req("/dashboard");
  return res.status === 200;
}

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

// sonner's Toaster renders this <section> server-side in the root layout
const TOASTER_SECTION = /<section[^>]*aria-label="Notifications/;

async function main() {
  // ---------------------------------------------------------- auth
  const anon = await fetch(BASE + "/dashboard", { redirect: "manual" });
  check("anonymous /dashboard redirects to login", anon.status === 307);

  // registration (must happen while signed out)
  const tempEmail = `smoke-${Date.now()}@test.example`;
  const tempPassword = "smoketest123";
  const regPage = await req("/register");
  const regFd = formFields(await regPage.text(), {
    name: "Smoke Tester",
    email: tempEmail,
    password: tempPassword,
  });
  const regPost = await req("/register", { method: "POST", body: regFd });
  const tempUser = await prisma.user.findUnique({ where: { email: tempEmail } });
  check(
    "register creates account",
    regPost.status === 303 && tempUser !== null,
    `location: ${regPost.headers.get("location")}`
  );

  const loginRes = await login(ADMIN.email, ADMIN.password);
  check("admin login", loginRes.status === 302 && (await isSignedIn()));

  for (const path of ["/dashboard", "/orders", "/customers", "/products", "/team", "/settings", "/profile"]) {
    const res = await req(path);
    const html = await res.text();
    check(`GET ${path}`, res.status === 200 && html.includes("<h1"));
  }

  // --------------------------------------------------------------- sidebar nav
  const navHtml = await (await req("/dashboard")).text();
  const [beforeFooter, afterFooter = ""] = navHtml.split('data-slot="sidebar-footer"');
  check(
    "sidebar groups the areas and pins settings in the footer",
    /data-slot="sidebar-group-label"[^>]*>Sales</.test(navHtml) &&
      afterFooter.includes('aria-label="Settings"') &&
      !beforeFooter.includes('aria-label="Settings"'),
  );

  // -------------------------------------------------------- data tables
  // Client components still ship their props in the RSC flight payload, so
  // table assertions look at the rendered markup only.
  const visible = (html) => html.replace(/<script[\s\S]*?<\/script>/g, "");

  const productsHtml = await (await req("/products")).text();
  check(
    "products list renders the data table",
    productsHtml.includes('aria-label="Select all rows on this page"') &&
      productsHtml.includes("Rows per page"),
  );
  check(
    "products list paginates the first page",
    /1–10 of \d+ rows?/.test(visible(productsHtml)),
  );

  const searchedCustomers = visible(await (await req("/customers?q=Initech")).text());
  check(
    "customer deep link ?q= filters server-side",
    searchedCustomers.includes("Initech Solutions") &&
      !searchedCustomers.includes("Acme Corporation"),
  );

  const completedOrders = visible(await (await req("/orders?status=completed")).text());
  check(
    "order status deep link filters server-side",
    completedOrders.includes(">completed<") &&
      !completedOrders.includes(">cancelled<"),
  );

  // ---------------------------------------------------------- customers
  const custPage = await req("/customers/new");
  const custFd = formFields(
    await custPage.text(),
    {
      name: "Smoke Test Ltd",
      email: "smoke@test.example",
      phone: "555-0100",
      address: "1 Test Way",
      city: "Testville",
      country: "USA",
      notes: "created by smoke test",
    },
    'name="city"'
  );
  const custPost = await req("/customers/new", { method: "POST", body: custFd });
  const customer = await prisma.customer.findFirst({
    where: { email: "smoke@test.example" },
  });
  check(
    "create customer action",
    custPost.status === 303 && customer !== null,
    `location: ${custPost.headers.get("location")}`
  );

  // ---------------------------------------------------------- orders
  const product = await prisma.product.findFirst();
  const stockBefore = product.stock;
  const orderPage = await req("/orders/new");
  const orderFd = formFields(
    await orderPage.text(),
    {
      customerId: customer?.id ?? "",
      notes: "smoke test order",
      items: JSON.stringify([{ productId: product.id, quantity: 3 }]),
    },
    'name="customerId"'
  );
  const orderPost = await req("/orders/new", { method: "POST", body: orderFd });
  const order = await prisma.order.findFirst({
    where: { notes: "smoke test order" },
    include: { items: true },
  });
  const stockAfter = (
    await prisma.product.findUnique({ where: { id: product.id } })
  ).stock;

  check(
    "create order action",
    orderPost.status === 303 && order !== null,
    `location: ${orderPost.headers.get("location")}`
  );
  check("order total computed", order?.total === product.price * 3, `total: ${order?.total}`);
  check(
    "stock deducted transactionally",
    stockAfter === stockBefore - 3,
    `${stockBefore} -> ${stockAfter}`
  );

  // ------------------------------------------------------ stock movements
  const detailHtml = await (await req(`/products/${product.id}`)).text();
  check(
    "product page offers receive/issue plus a stock card",
    detailHtml.includes('name="direction"') &&
      detailHtml.includes('name="quantity"') &&
      detailHtml.includes("Movement history"),
  );
  check(
    "stock card opens with an opening balance",
    detailHtml.includes("Opening balance"),
  );

  const movementPage = async () => (await req(`/products/${product.id}`)).text();
  const postMovement = (html, values) =>
    req(`/products/${product.id}`, {
      method: "POST",
      body: formFields(html, values, 'name="quantity"'),
    });
  const currentStock = async () =>
    (await prisma.product.findUnique({ where: { id: product.id } })).stock;

  const receivePost = await postMovement(detailHtml, {
    direction: "receive",
    quantity: "5",
    reference: "SMOKE-TEST",
    note: "smoke receipt",
  });
  const afterReceive = await currentStock();
  check(
    "receiving stock raises stock on hand",
    receivePost.status === 303 && afterReceive === stockAfter + 5,
    `${stockAfter} -> ${afterReceive}`
  );

  const issuePost = await postMovement(await movementPage(), {
    direction: "issue",
    quantity: "5",
    reference: "SMOKE-TEST",
    note: "smoke issue",
  });
  const afterIssue = await currentStock();
  check(
    "issuing stock lowers stock on hand",
    issuePost.status === 303 && afterIssue === stockAfter,
    `${afterReceive} -> ${afterIssue}`
  );

  const overPost = await postMovement(await movementPage(), {
    direction: "issue",
    quantity: String(afterIssue + 500),
  });
  const afterOverIssue = await currentStock();
  check(
    "cannot issue more than is on hand",
    afterOverIssue === afterIssue &&
      (overPost.headers.get("location") ?? "").includes("Insufficient"),
    `stock stayed at ${afterOverIssue}`
  );

  const card = await prisma.stockMovement.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  check(
    "order stock issue is recorded on the card",
    card.some((m) => m.type === "order" && m.reference === order.orderNumber),
    `looking for ${order.orderNumber}`
  );
  check(
    "running balances chain back to stock on hand",
    card.length > 1 &&
      card[0].balance === afterIssue &&
      card.some((m) => m.type === "opening") &&
      // newest first: undoing a movement must land on the next older balance
      card.every(
        (m, i) =>
          i === card.length - 1 || m.balance - m.quantity === card[i + 1].balance
      ),
    `${card.length} rows, latest balance: ${card[0]?.balance}, stock: ${afterIssue}`
  );

  // ------------------------------------------- cancelling returns stock
  const setOrderStatus = async (status) =>
    req(`/orders/${order.id}`, {
      method: "POST",
      body: formFields(
        await (await req(`/orders/${order.id}`)).text(),
        { status },
        'name="status"',
      ),
    });

  const cancelPost = await setOrderStatus("cancelled");
  const afterCancel = await currentStock();
  check(
    "cancelling an order returns its stock",
    cancelPost.ok && afterCancel === stockBefore,
    `${stockAfter} -> ${afterCancel}`,
  );

  const returned = await prisma.stockMovement.findFirst({
    where: { reference: order.orderNumber, type: "return" },
  });
  check(
    "the return is recorded on the stock card",
    returned !== null && returned.balance === stockBefore,
    `card balance ${returned?.balance}, stock ${stockBefore}`,
  );

  const revivePost = await setOrderStatus("confirmed");
  const afterRevive = await currentStock();
  check(
    "un-cancelling takes the stock back out",
    revivePost.ok && afterRevive === stockAfter,
    `${afterCancel} -> ${afterRevive}`,
  );

  await setOrderStatus("confirmed");
  const afterRepeat = await currentStock();
  check(
    "re-saving the same status never moves stock twice",
    afterRepeat === stockAfter,
    `still ${afterRepeat}`,
  );

  // the two test movements cancel out, so leave the demo data as we found it
  await prisma.stockMovement.deleteMany({
    where: { productId: product.id, reference: "SMOKE-TEST" },
  });

  // ----------------------------------------------------- configurable currency
  const business = await prisma.business.findUnique({
    where: { id: "singleton" },
  });
  const originalCurrency = business?.currency ?? "USD";
  // Probe with whatever the workspace isn't using, so the switch is visible
  // whatever currency the admin has chosen.
  const probe = originalCurrency === "GBP" ? "EUR" : "GBP";
  const inCode = (code, amount) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(
      amount,
    );
  const settingsHtml = await (await req("/settings")).text();
  const setCurrency = (code) =>
    req("/settings", {
      method: "POST",
      body: formFields(
        settingsHtml,
        { name: business?.name ?? "OpenERP", currency: code },
        'name="name"',
      ),
    });

  check(
    "settings offers a currency picker showing the saved choice",
    settingsHtml.includes('name="currency"') &&
      settingsHtml.includes('id="currency"') &&
      settingsHtml.includes(inCode(originalCurrency, 1234.5)),
    `previews the current currency as ${inCode(originalCurrency, 1234.5)}`,
  );

  await setCurrency(probe);
  const probeResponses = await Promise.all([
    req("/products"),
    req("/dashboard"),
    req(`/orders/${order.id}`),
  ]);
  const probeHtml = await Promise.all(
    probeResponses.map((response) => response.text())
  );
  const probeSymbol = inCode(probe, 0).replace(/[\d.,\s]/g, "");
  check(
    "chosen currency formats every figure",
    probeHtml.every((html) => html.includes(probeSymbol)) &&
      probeHtml[0].includes(inCode(probe, 999)),
    `products, dashboard and the order page all show ${probe} figures`,
  );

  const badPost = await setCurrency("XYZ");
  check(
    "an unknown currency is rejected",
    (badPost.headers.get("location") ?? "").includes("error="),
    `location: ${badPost.headers.get("location")}`,
  );

  await setCurrency(originalCurrency);
  const restoredHtml = await (await req("/products")).text();
  check(
    "currency choice is restorable",
    restoredHtml.includes(inCode(originalCurrency, 999)) &&
      !restoredHtml.includes(inCode(probe, 999)),
    `back to ${originalCurrency} figures`,
  );

  // ---------------------------------------------------------- team: admin only
  const adminRow = await prisma.user.findUnique({ where: { email: ADMIN.email } });
  const staffRow = await prisma.user.findUnique({ where: { email: "staff@erp.local" } });

  const teamHtml = await (await req("/team")).text();
  check("admin sees invite form on /team", teamHtml.includes('name="temporary') || teamHtml.includes('Temporary password'));
  check("admin sees edit buttons on /team", teamHtml.includes(`/team/${staffRow.id}`));

  // admin cannot change their own role
  const selfPage = await req(`/team/${adminRow.id}`);
  const selfFd = formFields(
    await selfPage.text(),
    { name: adminRow.name, email: adminRow.email, role: "staff", newPassword: "" },
    'name="role"'
  );
  const selfPost = await req(`/team/${adminRow.id}`, { method: "POST", body: selfFd });
  const adminAfterSelf = await prisma.user.findUnique({ where: { id: adminRow.id } });
  check(
    "admin cannot change own role",
    decodeURIComponent(selfPost.headers.get("location") ?? "").includes(
      "cannot change your own role"
    ) && adminAfterSelf.role === "admin",
    `location: ${selfPost.headers.get("location")}`
  );

  // admin CAN edit another member's role
  const memberPage = await req(`/team/${staffRow.id}`);
  const memberFd = formFields(
    await memberPage.text(),
    { name: "Staff User", email: "staff@erp.local", role: "manager", newPassword: "" },
    'name="role"'
  );
  const memberPost = await req(`/team/${staffRow.id}`, { method: "POST", body: memberFd });
  const staffAfter = await prisma.user.findUnique({ where: { id: staffRow.id } });
  check(
    "admin edits team member role",
    memberPost.status === 303 && staffAfter.role === "manager",
    `role: ${staffAfter.role}`
  );

  // ---------------------------------------------------------- profile: avatar / details
  const profileFd = formFields(
    await (await req("/profile")).text(),
    { name: "Admin User", email: ADMIN.email, avatar: new File([TINY_PNG], "me.png", { type: "image/png" }) },
    'name="avatar"'
  );
  const profilePost = await req("/profile", { method: "POST", body: profileFd });
  let adminProfile = await prisma.user.findUnique({ where: { id: adminRow.id } });
  check(
    "profile picture upload",
    profilePost.status === 303 && (adminProfile.avatar ?? "").startsWith("data:image/webp;base64,"),
    `location: ${profilePost.headers.get("location")}`
  );

  const profileHtml = await (await req("/profile")).text();
  check("avatar rendered in page", profileHtml.includes("data:image/webp;base64,"));

  // ---------------------------------------------------------- profile: theme
  const themeFd = formFields(
    await (await req("/profile")).text(),
    { theme: "emerald" },
    'name="theme"'
  );
  const themePost = await req("/profile", { method: "POST", body: themeFd });
  adminProfile = await prisma.user.findUnique({ where: { id: adminRow.id } });
  check("theme saved to account", themePost.status === 303 && adminProfile.theme === "emerald", `theme: ${adminProfile.theme}`);

  const themedHtml = await (await req("/dashboard")).text();
  check("theme applied to <html>", themedHtml.includes('data-theme="emerald"'));

  // restore blue theme + remove avatar
  const backFd = formFields(
    await (await req("/profile")).text(),
    { theme: "blue" },
    'name="theme"'
  );
  await req("/profile", { method: "POST", body: backFd });
  const removeFd = formFields(
    await (await req("/profile")).text(),
    { name: "Admin User", email: ADMIN.email, removeAvatar: "on" },
    'name="avatar"'
  );
  await req("/profile", { method: "POST", body: removeFd });
  adminProfile = await prisma.user.findUnique({ where: { id: adminRow.id } });
  check(
    "theme restored + avatar removed",
    adminProfile.theme === "blue" && adminProfile.avatar === null
  );

  // ---------------------------------------------------------- sidebar collapse
  const dashHtml = await (await req("/dashboard")).text();
  const collapseForm = (dashHtml.match(/<form[\s\S]*?<\/form>/g) ?? []).find((f) =>
    f.includes('name="collapsed"')
  );
  check("sidebar toggle form present", Boolean(collapseForm));

  const collapseFd = formFields(
    dashHtml,
    { collapsed: "true", path: "/dashboard" },
    'name="collapsed"'
  );
  const collapsePost = await req("/dashboard", { method: "POST", body: collapseFd });
  let adminNow = await prisma.user.findUnique({ where: { id: adminRow.id } });
  check(
    "sidebar collapses",
    collapsePost.status === 303 && adminNow.sidebarCollapsed === true,
    `location: ${collapsePost.headers.get("location")}`
  );

  const collapsedHtml = await (await req("/dashboard")).text();
  check(
    "collapsed rail shows tooltip labels",
    collapsedHtml.includes('data-collapsible="icon"') &&
      collapsedHtml.includes('aria-label="Dashboard"') &&
      collapsedHtml.includes('aria-label="Orders"'),
    "icon-only nav with accessible labels (shadcn Tooltip replaces native title)"
  );
  check(
    "collapsed rail offers expand",
    /name="collapsed"[^>]*value="false"/.test(collapsedHtml)
  );

  const expandFd = formFields(
    collapsedHtml,
    { collapsed: "false", path: "/dashboard" },
    'name="collapsed"'
  );
  const expandPost = await req("/dashboard", { method: "POST", body: expandFd });
  adminNow = await prisma.user.findUnique({ where: { id: adminRow.id } });
  check(
    "sidebar expands again",
    expandPost.status === 303 && adminNow.sidebarCollapsed === false,
    `location: ${expandPost.headers.get("location")}`
  );
  const expandedHtml = await (await req("/dashboard")).text();
  check(
    "expanded sidebar shows labels again",
    !expandedHtml.includes('title="Dashboard"') && expandedHtml.includes(">Dashboard</span>")
  );

  // ---------------------------------------------------------- non-admin restrictions
  check("temp user was registered", tempUser !== null);
  await login(tempEmail, tempPassword);
  check("temp user signs in", await isSignedIn());

  const staffTeamHtml = await (await req("/team")).text();
  check("non-admin sees team list", staffTeamHtml.includes("staff@erp.local"));
  check(
    "non-admin does NOT see invite form",
    !staffTeamHtml.includes("Temporary password")
  );
  check(
    "non-admin does NOT see the admin-only settings nav",
    !staffTeamHtml.includes('aria-label="Settings"') &&
      staffTeamHtml.includes('aria-label="Dashboard"'),
  );

  const staffEditRes = await req(`/team/${adminRow.id}`);
  // With (app)/loading.tsx the shell streams (200 committed) before the page's
  // redirect() fires, so Next falls back to its __next-page-redirect meta tag +
  // client RedirectBoundary instead of a platform 307. Both prove the block.
  let staffBlocked;
  if (staffEditRes.status === 307) {
    staffBlocked = (staffEditRes.headers.get("location") ?? "").includes("/dashboard");
  } else if (staffEditRes.status === 200) {
    const editHtml = await staffEditRes.text();
    staffBlocked =
      editHtml.includes('id="__next-page-redirect"') &&
      editHtml.includes("url=/dashboard") &&
      !editHtml.includes("Edit Team Member");
  } else {
    staffBlocked = false;
  }
  check(
    "non-admin blocked from edit page",
    staffBlocked,
    `status: ${staffEditRes.status}`
  );

  // ---------------------------------------------------------- password change
  const changeFd = formFields(
    await (await req("/profile")).text(),
    {
      currentPassword: tempPassword,
      newPassword: "smoketest456",
      confirmPassword: "smoketest456",
    },
    'name="currentPassword"'
  );
  const changePost = await req("/profile", { method: "POST", body: changeFd });
  check("password change action", changePost.status === 303, `location: ${changePost.headers.get("location")}`);

  await login(tempEmail, tempPassword);
  check("old password no longer works", !(await isSignedIn()));
  await login(tempEmail, "smoketest456");
  check("new password works", await isSignedIn());

  // ---------------------------------------------------------- feedback: toasts + dialog
  // Flash renders nothing server-side (messages become sonner toasts fired
  // client-side by the root-layout <Toaster/>), so no page ships a banner.
  cookies.clear(); // the login pages only render when signed out

  const anonLoginHtml = await (await req("/login")).text();
  check(
    "Toaster SSR section rendered on /login",
    TOASTER_SECTION.test(anonLoginHtml)
  );
  check("bare /login has no Alert banner", !anonLoginHtml.includes('data-slot="alert"'));

  const registeredHtml = await (await req("/login?registered=1")).text();
  check(
    "'Account created' shown as toast, not banner",
    TOASTER_SECTION.test(registeredHtml) &&
      !registeredHtml.includes('data-slot="alert"') &&
      !/>Account created\. You can sign in now\.</.test(registeredHtml)
  );

  await login(ADMIN.email, ADMIN.password);
  const savedHtml = await (await req("/customers?saved=1")).text();
  check(
    "GET /customers?saved=1 has toast, no saved banner",
    TOASTER_SECTION.test(savedHtml) &&
      !savedHtml.includes('data-slot="alert"') &&
      !/>Saved successfully\.</.test(savedHtml)
  );
  check(
    "delete button renders as AlertDialog trigger",
    savedHtml.includes('data-slot="alert-dialog-trigger"') &&
      savedHtml.includes('aria-haspopup="dialog"')
  );

  // ---------------------------------------------------------- cleanup
  await prisma.user.delete({ where: { id: tempUser.id } });
  await prisma.user.update({ where: { id: staffRow.id }, data: { role: "staff" } });
  if (order) {
    await prisma.order.delete({ where: { id: order.id } });
    // the order's stock card rows go with it, otherwise the restored stock
    // would no longer be the balance the ledger explains
    await prisma.stockMovement.deleteMany({
      where: { productId: product.id, reference: order.orderNumber },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: stockBefore },
    });
  }
  if (customer) await prisma.customer.delete({ where: { id: customer.id } });
  console.log("cleanup done");

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main()
  .catch((e) => {
    console.error("TEST FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
