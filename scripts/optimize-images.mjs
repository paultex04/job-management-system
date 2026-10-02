// One-off: re-optimize image data URLs already stored in the database
// (Business.logo, User.avatar) so they stop bloating every page render.
// Idempotent — run it as many times as you like: it only replaces a stored
// image when the optimized version is actually smaller.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const sharp = require("sharp");
const prisma = new PrismaClient();

const MAX_DIMENSION = 512;

async function optimize(dataUrl) {
  const comma = dataUrl.indexOf(",");
  const buf = Buffer.from(dataUrl.slice(comma + 1), "base64");
  const meta = await sharp(buf).metadata();
  const animated = (meta.pages ?? 1) > 1;

  let pipeline = sharp(buf, animated ? { animated: true } : {});
  if (!animated) pipeline = pipeline.rotate();

  const { data } = await pipeline
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  return `data:image/webp;base64,${data.toString("base64")}`;
}

function kb(n) {
  return `${Math.round(n / 1024)} KB`;
}

async function shrunk(label, current, save) {
  if (!current) return;
  try {
    const optimized = await optimize(current);
    if (optimized.length >= current.length) {
      console.log(`  - ${label}: already optimal (${kb(current.length)})`);
      return;
    }
    await save(optimized);
    console.log(`  - ${label}: ${kb(current.length)} -> ${kb(optimized.length)}`);
  } catch (e) {
    console.log(`  - ${label}: SKIPPED (${e.message})`);
  }
}

const business = await prisma.business.findUnique({ where: { id: "singleton" } });
console.log("Business logo:");
await shrunk("logo", business?.logo, (v) =>
  prisma.business.update({ where: { id: "singleton" }, data: { logo: v } })
);

const users = await prisma.user.findMany({
  where: { avatar: { not: null } },
  select: { id: true, name: true, avatar: true },
});
console.log(`Avatars (${users.length}):`);
for (const u of users) {
  await shrunk(u.name, u.avatar, (v) =>
    prisma.user.update({ where: { id: u.id }, data: { avatar: v } })
  );
}

console.log("done");
await prisma.$disconnect();
