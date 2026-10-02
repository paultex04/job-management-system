import sharp from "sharp";

/**
 * Longest edge (px) we keep for uploaded images. The biggest usage in the app
 * is 64px on screen (profile avatar / logo preview), so 512 covers retina
 * several times over while staying a few KB — these are inlined as data URLs
 * in the HTML of every page, so size matters.
 */
const MAX_DIMENSION = 512;

/**
 * Resize and re-encode an uploaded image as an optimized WebP data URL.
 *
 * - never upscales (small logos stay their original size)
 * - preserves animation for multi-frame GIF/WebP inputs
 * - applies EXIF orientation for static images (metadata itself is dropped
 *   by the re-encode, which also strips location/EXIF data)
 * - keeps transparency (WebP supports alpha)
 *
 * Throws if the buffer is not a decodable image.
 */
export async function optimizeImage(buffer: Buffer): Promise<string> {
  const meta = await sharp(buffer).metadata();
  const animated = (meta.pages ?? 1) > 1;

  let pipeline = sharp(buffer, animated ? { animated: true } : {});
  // EXIF auto-rotation is only applied to static images
  if (!animated) pipeline = pipeline.rotate();

  const { data } = await pipeline
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  return `data:image/webp;base64,${data.toString("base64")}`;
}
