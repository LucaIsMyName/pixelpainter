import { useCallback, useMemo, useState, type KeyboardEvent, type RefObject } from "react";
import type { PixelData } from "@/types";
import { rgbToHex, formatRgb } from "@/lib/color";
import { PIXEL_CELL_SIZE } from "@/lib/image-processing/dimensions";
import { PixelCell } from "@/components/pixel-grid/pixel-cell";

type PixelGridProps = {
  pixels: PixelData[][];
  selected: { x: number; y: number } | null;
  showGrid: boolean;
  suppressClickRef: RefObject<boolean>;
  onSelect: (x: number, y: number) => void;
  onClear: () => void;
};

type HoverState = {
  x: number;
  y: number;
  hex: string;
  rgb: string;
  left: number;
  top: number;
};

export function PixelGrid({
  pixels,
  selected,
  showGrid,
  suppressClickRef,
  onSelect,
  onClear,
}: PixelGridProps) {
  const height = pixels.length;
  const width = pixels[0]?.length ?? 0;
  const [hovered, setHovered] = useState<HoverState | null>(null);

  const onHover = useCallback(
    (x: number, y: number, clientX: number, clientY: number) => {
      const row = pixels[y];
      const pixel = row?.[x];
      if (!pixel) {
        return;
      }
      const hex = rgbToHex(pixel.targetColor);
      setHovered({
        x,
        y,
        hex,
        rgb: formatRgb(pixel.targetColor),
        left: clientX + 14,
        top: clientY + 14,
      });
    },
    [pixels],
  );

  const onLeave = useCallback(() => {
    setHovered(null);
  }, []);

  const selectedKey = selected ? `${selected.x}-${selected.y}` : "";

  const cells = useMemo(() => {
    const list: Array<{ x: number; y: number; hex: string }> = [];
    for (let y = 0; y < height; y += 1) {
      const row = pixels[y];
      if (!row) {
        continue;
      }
      for (let x = 0; x < width; x += 1) {
        const pixel = row[x];
        if (!pixel) {
          continue;
        }
        list.push({ x, y, hex: rgbToHex(pixel.targetColor) });
      }
    }
    return list;
  }, [height, pixels, width]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (!selected) {
      if (
        event.key === "ArrowRight" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        onSelect(0, 0);
        event.preventDefault();
      }
      return;
    }
    let x = selected.x;
    let y = selected.y;
    if (event.key === "ArrowRight") {
      x = Math.min(width - 1, x + 1);
    } else if (event.key === "ArrowLeft") {
      x = Math.max(0, x - 1);
    } else if (event.key === "ArrowDown") {
      y = Math.min(height - 1, y + 1);
    } else if (event.key === "ArrowUp") {
      y = Math.max(0, y - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClear();
      return;
    } else {
      return;
    }
    event.preventDefault();
    onSelect(x, y);
  }

  return (
    <>
      <div
        role="grid"
        aria-label={`Pixel grid ${width} by ${height}`}
        aria-rowcount={height}
        aria-colcount={width}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="grid outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{
          width: width * PIXEL_CELL_SIZE,
          height: height * PIXEL_CELL_SIZE,
          gridTemplateColumns: `repeat(${width}, ${PIXEL_CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${height}, ${PIXEL_CELL_SIZE}px)`,
        }}
      >
        {cells.map((cell) => (
          <PixelCell
            key={`pixel-${cell.x}-${cell.y}`}
            x={cell.x}
            y={cell.y}
            hex={cell.hex}
            selected={selectedKey === `${cell.x}-${cell.y}`}
            showGrid={showGrid}
            suppressClickRef={suppressClickRef}
            onSelect={onSelect}
            onHover={onHover}
            onLeave={onLeave}
          />
        ))}
      </div>
      {hovered ? (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-40 rounded-md bg-neutral-950 px-2.5 py-2 text-[11px] leading-4 text-white shadow-lg"
          style={{ left: hovered.left, top: hovered.top }}
        >
          <div className="font-medium">Pixel</div>
          <div>X: {hovered.x}</div>
          <div>Y: {hovered.y}</div>
          <div className="mt-1">RGB: {hovered.rgb}</div>
          <div>HEX: {hovered.hex}</div>
        </div>
      ) : null}
    </>
  );
}
