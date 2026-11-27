import imageCompression from "browser-image-compression";

const MAX_RAW_BYTES = 15 * 1024 * 1024; // 15 MB
export type MediaKind = "PHOTO" | "PANORAMA" | "TICKET" | "KYC" | "PROFILE";

export async function compressImage(file: File, kind: MediaKind): Promise<File> {
  if (file.size > MAX_RAW_BYTES) {
    throw new Error("File too large (maximum 15 MB allowed)");
  }

  let workingFile = file;

  // iPhone HEIC / HEIF -> JPEG (loaded only on demand)
  if (/heic|heif/i.test(workingFile.type) || /\.(heic|heif)$/i.test(workingFile.name)) {
    try {
      const heic2any = (await import("heic2any")).default;
      const convertedBlob = (await heic2any({
        blob: workingFile,
        toType: "image/jpeg",
        quality: 0.9,
      })) as Blob | Blob[];

      const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      workingFile = new File([finalBlob], workingFile.name.replace(/\.(heic|heif)$/i, ".jpg"), {
        type: "image/jpeg",
      });
    } catch (err) {
      console.warn("HEIC conversion failed on client, delegating to server:", err);
    }
  }

  const limits: Record<MediaKind, { maxSizeMB: number; maxWidthOrHeight: number }> = {
    PHOTO:    { maxSizeMB: 0.4,  maxWidthOrHeight: 2000 },
    PANORAMA: { maxSizeMB: 1.0,  maxWidthOrHeight: 4096 },
    TICKET:   { maxSizeMB: 0.3,  maxWidthOrHeight: 1280 },
    KYC:      { maxSizeMB: 0.5,  maxWidthOrHeight: 1800 }, // text must stay readable
    PROFILE:  { maxSizeMB: 0.05, maxWidthOrHeight: 512 },
  };

  const targetLimit = limits[kind] || limits.PHOTO;

  try {
    const compressed = await imageCompression(workingFile, {
      maxSizeMB: targetLimit.maxSizeMB,
      maxWidthOrHeight: targetLimit.maxWidthOrHeight,
      fileType: "image/webp",
      initialQuality: kind === "KYC" ? 0.85 : 0.8,
      useWebWorker: typeof window !== "undefined" && typeof Worker !== "undefined",
      preserveExif: false,
    });

    return new File(
      [compressed],
      workingFile.name.replace(/\.[^/.]+$/, ".webp"),
      { type: "image/webp" }
    );
  } catch (err) {
    // Goal 1: Never block the user. The server compressor provides guaranteed secondary shrinkage.
    console.warn("Client-side compression skipped/failed, proceeding with original:", err);
    return workingFile;
  }
}
