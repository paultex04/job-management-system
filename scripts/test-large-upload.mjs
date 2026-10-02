// Upload verification: a large (~10 MB) generated JPEG should be accepted,
// optimized down to a small WebP (<=512px), and stored.
// Rejection path: SIZE_BYTES=20500000 EXPECT_REJECT=1 (over the app's 20 MB cap
// but under Next's raw body limit) must return a friendly error.
// Restores the previous logo state afterwards.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const sharp = require("sharp");
const prisma = new PrismaClient();

const BASE = "http://localhost:3000";
const cookies = new Map();
function jar(res) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [p] = c.split(";");
    const i = p.indexOf("=");
    cookies.set(p.slice(0, i).trim(), p.slice(i + 1).trim());
  }
}
const ck = () => [...cookies].map(([k, v]) => `${k}=${v}`).join("; ");
async function req(url, init = {}) {
  const r = await fetch(BASE + url, {
    ...init,
    redirect: "manual",
    headers: { ...(init.headers ?? {}), cookie: ck() },
  });
  jar(r);
  return r;
}

const before = await prisma.business.findUnique({ where: { id: "singleton" } });

const csrf = await (await req("/api/auth/csrf")).json();
await req("/api/auth/callback/credentials", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email: "admin@erp.local",
    password: "admin1234",
    callbackUrl: BASE,
  }),
});

const html = await (await req("/settings")).text();
const forms = html.match(/<form[\s\S]*?<\/form>/g) ?? [];
const form = forms.find((f) => f.includes('name="logo"'));
if (!form) throw new Error("settings form not found");

const fd = new FormData();
for (const [, name, value = ""] of form.matchAll(
  /<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?/g
)) {
  fd.set(name, value.replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
}

let buffer, mime, filename;
if (process.env.SIZE_BYTES) {
  // junk body with a jpeg header: rejected on size before decoding
  const header = Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==",
    "base64"
  );
  buffer = Buffer.concat([header, Buffer.alloc(Number(process.env.SIZE_BYTES))]);
  mime = "image/jpeg";
  filename = "big.jpg";
} else {
  // real 3000x2000 noisy JPEG (noise => ~10 MB compressed)
  const raw = require("node:crypto").randomBytes(3000 * 2000 * 3);
  buffer = await sharp(raw, { raw: { width: 3000, height: 2000, channels: 3 } })
    .jpeg({ quality: 90 })
    .toBuffer();
  mime = "image/jpeg";
  filename = "big.jpg";
  console.log("input image:", Math.round(buffer.length / 1024 / 1024), "MB");
}

fd.set("logo", new File([buffer], filename, { type: mime }));
fd.set("name", before?.name ?? "OpenERP");

const res = await req("/settings", { method: "POST", body: fd });
const after = await prisma.business.findUnique({ where: { id: "singleton" } });
const location = res.headers.get("location") ?? "";
console.log("status:", res.status, "| location:", location);

if (process.env.EXPECT_REJECT) {
  const rejected =
    location.includes("error=") &&
    decodeURIComponent(location).includes("20 MB or smaller");
  console.log(rejected ? "REJECTED as expected" : "NOT REJECTED — UNEXPECTED");
  if (!rejected) process.exitCode = 1;
} else {
  const stored = after?.logo ?? "";
  const okFormat = stored.startsWith("data:image/webp;base64,");
  console.log("stored:", stored.length, "chars |", okFormat ? "webp OK" : "WRONG FORMAT");

  let dims = null;
  if (okFormat) {
    const decoded = Buffer.from(stored.slice(stored.indexOf(",") + 1), "base64");
    const meta = await sharp(decoded).metadata();
    dims = `${meta.width}x${meta.height}`;
  }
  const okSize = stored.length > 0 && stored.length < 1024 * 1024; // < 1 MB stored
  const okDims = dims !== null && Number(dims.split("x")[0]) <= 512 && Number(dims.split("x")[1]) <= 512;
  console.log("dimensions:", dims, "| stored < 1MB:", okSize, "| <=512px:", okDims);
  if (!okFormat || !okSize || !okDims) process.exitCode = 1;
}

// restore previous state so the test is non-destructive
await prisma.business.update({
  where: { id: "singleton" },
  data: { logo: before?.logo ?? null, name: before?.name ?? "OpenERP" },
});
console.log("restored previous state");
await prisma.$disconnect();
