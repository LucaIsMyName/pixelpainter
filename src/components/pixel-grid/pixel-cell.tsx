import { memo, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

type PixelCellProps = {
  x: number;
  y: number;
  hex: string;
  selected: boolean;
  showGrid: boolean;
  showMismatch: boolean;
  suppressClickRef: { current: boolean };
  onSelect: (x: number, y: number) => void;
  onHover: (x: number, y: number, clientX: number, clientY: number) => void;
  onLeave: () => void;
  onClear: () => void;
  selectedCoord: { x: number; y: number } | null;
  gridWidth: number;
  gridHeight: number;
};

export const PixelCell = memo(function PixelCell({
  x,
  y,
  hex,
  selected,
  showGrid,
  showMismatch,
  suppressClickRef,
  onSelect,
  onHover,
  onLeave,
  onClear,
  selectedCoord,
  gridWidth,
  gridHeight,
}: PixelCellProps) {
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (!selectedCoord && event.key.startsWith("Arrow")) {
      onSelect(0, 0);
      event.preventDefault();
      return;
    }
    if (!selectedCoord) {
      return;
    }
    let nextX = selectedCoord.x;
    let nextY = selectedCoord.y;
    if (event.key === "ArrowRight") {
      nextX = Math.min(gridWidth - 1, nextX + 1);
    } else if (event.key === "ArrowLeft") {
      nextX = Math.max(0, nextX - 1);
    } else if (event.key === "ArrowDown") {
      nextY = Math.min(gridHeight - 1, nextY + 1);
    } else if (event.key === "ArrowUp") {
      nextY = Math.max(0, nextY - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClear();
      return;
    } else {
      return;
    }
    event.preventDefault();
    onSelect(nextX, nextY);
  }

  return (
    <button
      data-component="PixelCell"
      type="button"
      role="gridcell"
      aria-label={`Pixel column ${x} row ${y}, color ${hex}`}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      className={cn(
        "relative block size-full cursor-crosshair rounded-none border-0 p-0",
        "hover:z-10 hover:outline-2 hover:outline-offset-[-2px] hover:outline-black/80",
        selected && "z-20 outline-2 outline-offset-[-2px] outline-white ring-2 ring-black",
        showGrid && "shadow-[inset_0_0_0_1px_rgb(0_0_0_/_0.22)]",
        showMismatch && "ring-2 ring-inset ring-red-500/80",
      )}
      style={{ backgroundColor: hex }}
      onKeyDown={onKeyDown}
      onMouseEnter={(event) => onHover(x, y, event.clientX, event.clientY)}
      onMouseMove={(event) => onHover(x, y, event.clientX, event.clientY)}
      onMouseLeave={onLeave}
      onClick={() => {
        if (suppressClickRef.current) {
          return;
        }
        onSelect(x, y);
      }}
    />
  );
});
