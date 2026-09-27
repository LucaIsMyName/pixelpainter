import type { Crop, SourceImage } from "@/types";
import type { CSSProperties } from "react";

/** Maps the active crop onto the pixel grid box (same region as sampleGrid). */
export function referenceOverlayStyle(
  source: SourceImage,
  crop: Crop,
  gridWidth: number,
  gridHeight: number,
): CSSProperties {
  const cropW = Math.max(1, crop.width);
  const cropH = Math.max(1, crop.height);
  const scaleX = gridWidth / cropW;
  const scaleY = gridHeight / cropH;

  return {
    width: gridWidth,
    height: gridHeight,
    backgroundImage: `url(${source.objectUrl})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${source.width * scaleX}px ${source.height * scaleY}px`,
    backgroundPosition: `${-crop.x * scaleX}px ${-crop.y * scaleY}px`,
  };
}
