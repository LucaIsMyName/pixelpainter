import { useCallback, useMemo, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { PixelData } from "@/types";
import { rgbDistance, rgbToHex, formatRgb } from "@/lib/color";
import { PIXEL_CELL_SIZE } from "@/lib/image-processing/dimensions";
import { PixelCell } from "@/components/pixel-grid/pixel-cell";
import {
  PixelGridCanvas,
  shouldUseCanvasGrid,
} from "@/components/pixel-grid/pixel-grid-canvas";

const TOOLTIP_OFFSET = 12;
const TOOLTIP_WIDTH = 168;
const TOOLTIP_HEIGHT = 108;

function tooltipPosition(clientX: number, clientY: number): { left: number; top: number } {
  let left = clientX + TOOLTIP_OFFSET;
  let top = clientY + TOOLTIP_OFFSET;
  if (left + TOOLTIP_WIDTH > window.innerWidth - 8) {
    left = clientX - TOOLTIP_WIDTH - TOOLTIP_OFFSET;
  }
  if (top + TOOLTIP_HEIGHT > window.innerHeight - 8) {
    top = clientY - TOOLTIP_HEIGHT - TOOLTIP_OFFSET;
  }
  return {
    left: Math.max(8, left),
    top: Math.max(8, top),
  };
}

type PixelGridProps = {
  pixels: PixelData[][];
  selected: { x: number; y: number } | null;
  showGrid: boolean;
  showMismatchHighlight: boolean;
  showMixedColors: boolean;
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

function HoverTooltip({ hovered }: { hovered: HoverState }) {
  return createPortal(
    <div
      data-component="HoverTooltip"
      role="tooltip"
      className="pointer-events-none fixed z-50 rounded-md border border-border bg-popover px-2.5 py-2 text-[11px] leading-4 text-popover-foreground shadow-lg"
      style={{ left: hovered.left, top: hovered.top }}
    >
      <div className="font-medium">
        Pixel {hovered.x}, {hovered.y}
      </div>
      <div className="mt-1 font-mono">HEX: {hovered.hex}</div>
      <div className="font-mono">RGB: {hovered.rgb}</div>
    </div>,
    document.body,
  );
}

export function PixelGrid({
  pixels,
  selected,
  showGrid,
  showMismatchHighlight,
  showMixedColors,
  suppressClickRef,
  onSelect,
  onClear,
}: PixelGridProps) {
  const height = pixels.length;
  const width = pixels[0]?.length ?? 0;
  const [hovered, setHovered] = useState<HoverState | null>(null);
  const useCanvas = shouldUseCanvasGrid(width, height);

  const onHover = useCallback(
    (x: number, y: number, clientX: number, clientY: number) => {
      const row = pixels[y];
      const pixel = row?.[x];
      if (!pixel) {
        return;
      }
      const color = showMixedColors ? pixel.mix.reconstructed : pixel.targetColor;
      const hex = rgbToHex(color);
      const position = tooltipPosition(clientX, clientY);
      setHovered({
        x,
        y,
        hex,
        rgb: formatRgb(color),
        left: position.left,
        top: position.top,
      });
    },
    [pixels, showMixedColors],
  );

  const onLeave = useCallback(() => {
    setHovered(null);
  }, []);

  const selectedKey = selected ? `${selected.x}-${selected.y}` : "";

  const cells = useMemo(() => {
    const list: Array<{
      x: number;
      y: number;
      hex: string;
      mismatch: boolean;
    }> = [];
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
        list.push({
          x,
          y,
          hex: rgbToHex(
            showMixedColors ? pixel.mix.reconstructed : pixel.targetColor,
          ),
          mismatch:
            showMismatchHighlight &&
            rgbDistance(pixel.targetColor, pixel.mix.reconstructed) > 18,
        });
      }
    }
    return list;
  }, [height, pixels, showMismatchHighlight, showMixedColors, width]);

  if (useCanvas) {
    return (
      <>
        <PixelGridCanvas
          data-component="PixelGridCanvas"
          pixels={pixels}
          selected={selected}
          showGrid={showGrid}
          showMismatchHighlight={showMismatchHighlight}
          showMixedColors={showMixedColors}
          suppressClickRef={suppressClickRef}
          onSelect={onSelect}
          onClear={onClear}
          onHover={onHover}
          onLeave={onLeave}
        />
        {hovered ? <HoverTooltip hovered={hovered} /> : null}
      </>
    );
  }

  return (
    <>
      <div
        data-component="PixelGrid"
        role="grid"
        aria-label={`Pixel grid ${width} by ${height}`}
        aria-rowcount={height}
        aria-colcount={width}
        tabIndex={0}
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
            showMismatch={cell.mismatch}
            suppressClickRef={suppressClickRef}
            onSelect={onSelect}
            onHover={onHover}
            onLeave={onLeave}
            onClear={onClear}
            selectedCoord={selected}
            gridWidth={width}
            gridHeight={height}
          />
        ))}
      </div>
      {hovered ? <HoverTooltip hovered={hovered} /> : null}
    </>
  );
}
