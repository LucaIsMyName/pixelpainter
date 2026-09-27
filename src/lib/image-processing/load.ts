import type { SourceImage } from "@/types";

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp)$/i;

export function isSupportedImageFile(file: File): boolean {
  if (IMAGE_TYPES.has(file.type)) {
    return true;
  }
  return IMAGE_EXTENSIONS.test(file.name);
}

export function releaseSource(source: SourceImage | null): void {
  if (!source) {
    return;
  }
  URL.revokeObjectURL(source.objectUrl);
  source.bitmap.close();
}

export async function loadImageFile(file: File): Promise<SourceImage> {
  if (!isSupportedImageFile(file)) {
    throw new Error("Unsupported image type. Please use PNG, JPG, or WebP.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const bitmap = await createImageBitmap(image);
    return {
      bitmap,
      objectUrl,
      width: bitmap.width,
      height: bitmap.height,
      fileName: file.name,
    };
  } catch {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Could not read this image. It may be corrupted.");
  }
}
