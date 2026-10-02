# OpenERP

A lightweight ERP web application built with **Next.js 16 (App Router)**, **Prisma**, **SQLite** and **Auth.js** authentication.

## Features

- **Authentication** — email + password sign-in (Auth.js v5 / NextAuth), bcrypt hashing, JWT sessions, protected routes, registration page
- **UI** — **registry-faithful shadcn/ui** (radix-nova style): Field/FieldGroup forms, Card composition, Sidebar + Tooltip, Sheet, Empty/Skeleton/Spinner, InputGroup search, ToggleGroup filters, semantic status/role tokens (`success`/`warning`/`info`) instead of hardcoded colors; the 5 accent themes drive shadcn's `--primary`/`--ring` tokens, and dark mode is the standard `.dark` class alongside the persisted `data-mode`
- **Motion** — page transitions via the **View Transitions API** (directional `nav-forward`/`nav-back` animations, sidebar/topbar frozen as named transition chrome), an animated sidebar collapse whose duration lives in one place (`--sidebar-duration`, 500 ms), and a blanket `prefers-reduced-motion` opt-out for every animation including view transitions
- **Interface guidelines** — audited against Vercel's Web Interface Guidelines: skip link, visible focus states, `prefers-reduced-motion`, labelled form controls, `aria-live` toasts, `autocomplete`/`spellcheck` handling, `tabular-nums` figures, URL-backed filters, unsaved-changes warnings and confirmation dialogs for destructive actions
- **Feedback** — save/error messages show as **sonner toasts** (server actions keep their `?saved=1`/`?error=` redirects; the params are cleared after the toast fires), and delete/remove actions ask for confirmation in an **alert dialog**
- **Roles** — `admin`, `manager`, `staff`; only admins can invite teammates, edit their details or change roles
- **Profile** — change your name/email, upload a profile picture (PNG/JPEG/WebP/GIF, ≤20 MB — automatically resized to ≤512px WebP so pages stay fast), change your password
- **Appearance** — 5 accent color themes (Blue, Emerald, Violet, Rose, Amber) and a dark/light mode toggle, both saved per user account; the sidebar tint follows the theme
- **Grouped, collapsible sidebar** — the nav is split into labelled areas (Overview, Sales, Catalog, Workspace) so each new capability has an obvious home; Settings is pinned at the bottom above the account controls (admin-only). The desktop rail collapses to icons with shadcn tooltips; the preference is saved per user account and the animation speed is a single CSS knob (`--sidebar-duration`)
- **Business settings** (admin-only) — company name and logo shown top-left, contact details; logo uploads are auto-optimized
- **Configurable currency** (admin-only) — pick the workspace currency (16 ISO codes) in business settings and every price, total and dashboard figure is formatted in it, symbols and decimal rules included (¥ has no decimals). Amounts are stored raw, so switching the display currency never rewrites data
- **Dashboard** — revenue, order/customer/product stats, recent orders, inventory watch list
- **Data tables** — the products, customers, orders and team lists all use the shadcn data table (TanStack Table v9): instant search, sortable columns, multi-select faceted filters, pagination, and row selection with bulk actions (delete products/customers, set order status, remove teammates). Tables never run past the window — they take the height left between the top bar and the bottom of the screen, scroll internally under a sticky header, and keep the pagination bar pinned. Every view is linkable: table state lives in the URL (`?q=`, `?sort=`, `?dir=`, `?page=`, `?status=`…) and deep links render server-side
- **Customers** — CRUD with search
- **Products** — CRUD with SKU uniqueness, pricing/margin, stock levels, reorder alerts
- **Inventory movements** — receive stock in or issue it out per product, with an optional reference (`PO-1042`) and note. Every change to stock is a row on that product's **stock card**: the opening balance, each receipt and issue, the automatic issue an order creates (and its return when that order is cancelled), and any correction made on the product form — each row carrying the balance it left behind, so the figure shown as "stock on hand" can always be traced back. Issuing more than is on hand is refused. The product page summarises the totals (received, issued, on hand) and lists the card, newest first
- **Orders** — multi-line order entry with live totals, stock validation, automatic stock deduction (transactional), status workflow (`draft → confirmed → shipped → completed / cancelled`). **Cancelling returns the order's units to stock**, and moving an order back out of `cancelled` takes them out again, so the stock card and the status always agree
- **Team** — member list for everyone; admin-only editing of details, roles and passwords

## Stack

| Layer    | Tech                                   |
| -------- | -------------------------------------- |
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| Language  | TypeScript                             |
| Database  | SQLite via Prisma ORM                  |
| Auth      | Auth.js (next-auth v5) + bcryptjs      |
| Styling   | Tailwind CSS v4 + shadcn/ui (Radix UI, CVA) |
| Validation| Zod                                    |

## Getting started

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db (already applied if cloned with db)
npm run seed             # or: npx prisma db seed
npm run dev
```

Open http://localhost:3000.

### Demo accounts

| Email             | Password   | Role  |
| ----------------- | ---------- | ----- |
| admin@erp.local   | admin1234  | admin |
| staff@erp.local   | staff1234  | staff |

## Environment (`.env`)

```bash
DATABASE_URL="file:./dev.db"       # SQLite file (relative to prisma/)
AUTH_SECRET="<long random string>" # generate: npx auth secret
```

## Scripts

| Command               | Description                          |
| --------------------- | ------------------------------------ |
| `npm run dev`         | Start dev server                     |
| `npm run build`       | Production build                     |
| `npm run start`       | Serve the production build           |
| `npm run lint`        | ESLint                               |
| `npm run test:smoke`  | End-to-end smoke test (dev server must be running) |
| `npx prisma migrate dev` | Create/apply migrations           |
| `npx prisma db seed`  | Seed demo users, customers, products |
| `npx prisma studio`   | Browse the database                  |

## Project structure

```
prisma/
  schema.prisma        # data model (User, Customer, Product, Order, OrderItem)
  seed.ts              # demo data
src/
  actions.ts           # all server actions (auth, CRUD, profile, team) — each one re-checks permissions
  auth.ts              # Auth.js config (credentials provider, JWT sessions)
  components/
    ui/                # shadcn/ui primitives (sidebar, field, card, table, select, toggle-group, empty, …)
    data-table/        # the shadcn data table: features registry, window-bounded table, sortable header, faceted filter, URL state
    sidebar-shell.tsx  # controlled sidebar provider + per-user persistence
    page-transition.tsx# View Transitions wrapper (nav-forward/nav-back/default maps)
    …                  # app building blocks (forms, nav, avatars, badges…)
  lib/                 # prisma client, session helpers, formatting, themes
  app/
    (auth)/            # login + register (redirect when signed in)
    (app)/             # authenticated shell: sidebar layout + all ERP pages
      profile/         # personal details, picture, theme picker, password
      team/            # member list + admin-only /team/[id] editor
    api/auth/          # Auth.js route handler
scripts/
  smoke-test.mjs       # end-to-end checks against a running dev server
  check-dark-mode.mjs  # verifies .dark + data-mode toggling
  optimize-images.mjs  # one-off: re-optimize images already stored in the DB
```

## Notes

- SQLite is used for zero-setup development. The Prisma schema can be switched to
  PostgreSQL by changing `datasource.db.provider` to `postgresql` and pointing
  `DATABASE_URL` at your instance (then `prisma migrate dev`).
- Every server action re-checks authentication/authorization — never rely on the
  UI alone. Bulk table actions follow the same rule and only ever redirect back
  to the page they were fired from.
- Stock only ever changes through `recordMovement()` in `actions.ts` — it moves
  the number and appends the stock-card row in one step (inside the caller's
  transaction where there is one). Never write `product.stock` directly; the
  ledger is what makes the figure trustworthy.
- List pages fetch their rows once and let the data table do the filtering,
  sorting and pagination in the browser, so every control responds instantly;
  the URL keeps that state so views stay linkable and reloads restore them.
- Money is stored as a plain number and the workspace currency lives on the
  business row, read through the request-cached `getCurrency()` in
  `lib/business.ts`. Server components format with it directly; the client
  tables and forms take it as a prop. Changing it is a display change only —
  nothing is converted or rewritten.
