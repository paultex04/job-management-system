// One-off: verify dark mode toggles BOTH selectors (.dark class + data-mode)
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const cookies = new Map();
const jar = (res) => {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
};
const cookieHeader = () => [...cookies].map(([k, v]) => `${k}=${v}`).join("; ");
const req = async (url, init = {}) => {
  const res = await fetch(BASE + url, {
    ...init,
    redirect: "manual",
    headers: { ...(init.headers ?? {}), cookie: cookieHeader() },
  });
  jar(res);
  return res;
};
const decode = (s) =>
  s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

function formFields(html, overrides = {}, marker = null) {
  const forms = html.match(/<form[\s\S]*?<\/form>/g) ?? [];
  const form = marker ? forms.find((f) => f.includes(marker)) : forms[0];
  if (!form) throw new Error(`no form matching ${marker}`);
  const fd = new FormData();
  for (const [, name, value = ""] of form.matchAll(
    /<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?/g
  ))
    fd.set(decode(name), decode(value));
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

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

const dash = await (await req("/dashboard")).text();
const modeFd = formFields(dash, {}, 'name="mode"');
modeFd.set("mode", "dark");
await req("/dashboard", { method: "POST", body: modeFd });

const darkHtml = await (await req("/dashboard")).text();
const htmlTag = (darkHtml.match(/<html[^>]*>/) ?? [""])[0];
const okDark =
  htmlTag.includes('data-mode="dark"') && /\bclass="[^"]*\bdark\b/.test(htmlTag);
console.log(`${okDark ? "PASS" : "FAIL"}  dark: data-mode + .dark class on <html>`);
console.log(`      ${htmlTag.slice(0, 160)}`);

// back to light
const dash2 = await (await req("/dashboard")).text();
const lightFd = formFields(dash2, {}, 'name="mode"');
lightFd.set("mode", "light");
await req("/dashboard", { method: "POST", body: lightFd });
const lightHtml = await (await req("/dashboard")).text();
const lightTag = (lightHtml.match(/<html[^>]*>/) ?? [""])[0];
const okLight = lightTag.includes('data-mode="light"') && !/\bclass="[^"]*\bdark\b/.test(lightTag);
console.log(`${okLight ? "PASS" : "FAIL"}  light restored, .dark removed`);

const user = await prisma.user.findUnique({ where: { email: "admin@erp.local" } });
console.log(`${user.colorMode === "light" ? "PASS" : "FAIL"}  colorMode persisted: ${user.colorMode}`);

process.exit(okDark && okLight && user.colorMode === "light" ? 0 : 1);
