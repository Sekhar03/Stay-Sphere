import sharp from "sharp";
import crypto from "crypto";
import { MediaKind } from "./compress";

export interface ImageVariantOutput {
  buffer: Buffer;
  width: number;
  height: number;
  bytes: number;
  contentType: string;
}

export interface ProcessedImageResult {
  variants: Record<string, ImageVariantOutput>;
  blurData: string;
  sha256: string;
  width: number;
  height: number;
  bytes: number;
}

const DEFAULT_VARIANTS = [
  { name: "thumb",  width: 320,  quality: 70 },
  { name: "medium", width: 800,  quality: 75 },
  { name: "large",  width: 1600, quality: 78 },
] as const;

const KYC_VARIANTS = [
  { name: "thumb",  width: 320,  quality: 75 },
  { name: "medium", width: 800,  quality: 80 },
  { name: "large",  width: 1800, quality: 85 }, // Text must remain crisp & legible
] as const;

const PROFILE_VARIANTS = [
  { name: "thumb",  width: 128, quality: 75 },
  { name: "medium", width: 256, quality: 78 },
  { name: "large",  width: 512, quality: 80 },
] as const;

export async function processServerImage(
  input: Buffer,
  kind: MediaKind = "PHOTO"
): Promise<ProcessedImageResult> {
  // 1. Inspect real bytes and dimensions
  const meta = await sharp(input).metadata();
  if (!meta.width || !meta.height) {
    throw new Error("INVALID_IMAGE: Unable to decode image metadata from file stream");
  }

  // 2. Decompression-bomb guard (reject images exceeding 100 megapixels)
  if (meta.width * meta.height > 100_000_000) {
    throw new Error("IMAGE_TOO_LARGE: Image exceeds 100 megapixel safe decompression threshold");
  }

  // 3. Normalize rotation based on EXIF tag, then strip all EXIF (removes private GPS metadata)
  const base = sharp(input, { failOn: "error" }).rotate();

  const variants: Record<string, ImageVariantOutput> = {};

  if (kind === "PANORAMA") {
    // 360 Panorama pipeline: low-res preview loads first, large 4096 px 2:1 ratio equirectangular
    const previewRes = await base
      .clone()
      .resize({ width: 1024, height: 512, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 70, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    variants.preview = {
      buffer: previewRes.data,
      width: previewRes.info.width,
      height: previewRes.info.height,
      bytes: previewRes.info.size,
      contentType: "image/webp",
    };

    const largeRes = await base
      .clone()
      .resize({ width: 4096, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    variants.large = {
      buffer: largeRes.data,
      width: largeRes.info.width,
      height: largeRes.info.height,
      bytes: largeRes.info.size,
      contentType: "image/webp",
    };

    variants.medium = variants.preview;
    variants.thumb = variants.preview;
  } else {
    const variantConfig =
      kind === "KYC"
        ? KYC_VARIANTS
        : kind === "PROFILE"
        ? PROFILE_VARIANTS
        : DEFAULT_VARIANTS;

    for (const v of variantConfig) {
      const { data, info } = await base
        .clone()
        .resize({ width: v.width, withoutEnlargement: true })
        .webp({ quality: v.quality, effort: 4 })
        .toBuffer({ resolveWithObject: true });

      variants[v.name] = {
        buffer: data,
        width: info.width,
        height: info.height,
        bytes: info.size,
        contentType: "image/webp",
      };
    }
  }

  // 4. Generate ~500-byte inline blur placeholder for instant layout display
  const blurBuffer = await base
    .clone()
    .resize(20, undefined, { withoutEnlargement: true })
    .webp({ quality: 40 })
    .toBuffer();
  const blurData = `data:image/webp;base64,${blurBuffer.toString("base64")}`;

  // 5. SHA-256 of primary large variant for deduplication and immutable caching
  const primaryBuffer = variants.large?.buffer || variants[Object.keys(variants)[0]].buffer;
  const sha256 = crypto.createHash("sha256").update(primaryBuffer).digest("hex");

  const primaryVariant = variants.large || variants[Object.keys(variants)[0]];

  return {
    variants,
    blurData,
    sha256,
    width: primaryVariant.width,
    height: primaryVariant.height,
    bytes: primaryVariant.bytes,
  };
}
