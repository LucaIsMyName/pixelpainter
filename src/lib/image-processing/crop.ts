import type { Crop } from "@/types";

const MIN_CROP_SIZE = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function largestCenteredCrop(
  imageWidth: number,
  imageHeight: number,
  aspect: number,
): Crop {
  const safeAspect = aspect > 0 ? aspect : 1;
  const imageAspect = imageWidth / imageHeight;
  let width: number;
  let height: number;
  if (imageAspect > safeAspect) {
    height = imageHeight;
    width = height * safeAspect;
  } else {
    width = imageWidth;
    height = width / safeAspect;
  }
  return {
    x: (imageWidth - width) / 2,
    y: (imageHeight - height) / 2,
    width,
    height,
  };
}

export function fitCropToAspect(
  imageWidth: number,
  imageHeight: number,
  aspect: number,
  previous: Crop | null,
): Crop {
  if (!previous) {
    return largestCenteredCrop(imageWidth, imageHeight, aspect);
  }
  const safeAspect = aspect > 0 ? aspect : 1;
  const centerX = previous.x + previous.width / 2;
  const centerY = previous.y + previous.height / 2;
  const maxWidth = imageWidth;
  const maxHeight = imageHeight;
  let width = previous.width;
  let height = width / safeAspect;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * safeAspect;
  }
  if (width > maxWidth) {
    width = maxWidth;
    height = width / safeAspect;
  }
  width = Math.max(MIN_CROP_SIZE, width);
  height = width / safeAspect;
  if (height < MIN_CROP_SIZE) {
    height = MIN_CROP_SIZE;
    width = height * safeAspect;
  }
  return clampCrop(
    {
      x: centerX - width / 2,
      y: centerY - height / 2,
      width,
      height,
    },
    imageWidth,
    imageHeight,
    safeAspect,
  );
}

export function clampCrop(
  crop: Crop,
  imageWidth: number,
  imageHeight: number,
  aspect: number,
): Crop {
  const safeAspect = aspect > 0 ? aspect : 1;
  const maxWidth = imageWidth;
  const maxHeight = imageHeight;
  let width = clamp(crop.width, MIN_CROP_SIZE, maxWidth);
  let height = width / safeAspect;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * safeAspect;
  }
  if (width > maxWidth) {
    width = maxWidth;
    height = width / safeAspect;
  }
  width = Math.max(MIN_CROP_SIZE, Math.min(width, maxWidth));
  height = width / safeAspect;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * safeAspect;
  }
  const x = clamp(crop.x, 0, Math.max(0, imageWidth - width));
  const y = clamp(crop.y, 0, Math.max(0, imageHeight - height));
  return { x, y, width, height };
}

export type CropHandle = "nw" | "ne" | "sw" | "se" | "move";

export function applyCropDrag(
  handle: CropHandle,
  pointer: { x: number; y: number },
  origin: { pointer: { x: number; y: number }; crop: Crop },
  imageWidth: number,
  imageHeight: number,
  aspect: number,
): Crop {
  if (handle === "move") {
    const dx = pointer.x - origin.pointer.x;
    const dy = pointer.y - origin.pointer.y;
    return clampCrop(
      {
        ...origin.crop,
        x: origin.crop.x + dx,
        y: origin.crop.y + dy,
      },
      imageWidth,
      imageHeight,
      aspect,
    );
  }

  const right = origin.crop.x + origin.crop.width;
  const bottom = origin.crop.y + origin.crop.height;
  let next: Crop = { ...origin.crop };

  if (handle === "se") {
    const width = pointer.x - origin.crop.x;
    next = { x: origin.crop.x, y: origin.crop.y, width, height: width / aspect };
  } else if (handle === "ne") {
    const width = pointer.x - origin.crop.x;
    const height = width / aspect;
    next = {
      x: origin.crop.x,
      y: bottom - height,
      width,
      height,
    };
  } else if (handle === "sw") {
    const width = right - pointer.x;
    const height = width / aspect;
    next = {
      x: right - width,
      y: origin.crop.y,
      width,
      height,
    };
  } else {
    const width = right - pointer.x;
    const height = width / aspect;
    next = {
      x: right - width,
      y: bottom - height,
      width,
      height,
    };
  }

  return clampCrop(next, imageWidth, imageHeight, aspect);
}

export function containedImageRect(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): { x: number; y: number; width: number; height: number } {
  if (containerWidth <= 0 || containerHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  const imageAspect = imageWidth / imageHeight;
  const containerAspect = containerWidth / containerHeight;
  if (containerAspect > imageAspect) {
    const height = containerHeight;
    const width = height * imageAspect;
    return { x: (containerWidth - width) / 2, y: 0, width, height };
  }
  const width = containerWidth;
  const height = width / imageAspect;
  return { x: 0, y: (containerHeight - height) / 2, width, height };
}

export function clientToImagePoint(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  display: { x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number,
): { x: number; y: number } {
  const localX = clientX - containerRect.left - display.x;
  const localY = clientY - containerRect.top - display.y;
  return {
    x: (localX / display.width) * imageWidth,
    y: (localY / display.height) * imageHeight,
  };
}
