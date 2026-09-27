import { memo } from "react";
import { cn } from "@/lib/utils";

type PixelCellProps = {
  x: number;
  y: number;
  hex: string;
  selected: boolean;
  showGrid: boolean;
  suppressClickRef: { current: boolean };
  onSelect: (x: number, y: number) => void;
  onHover: (x: number, y: number, clientX: number, clientY: number) => void;
  onLeave: () => void;
};

export const PixelCell = memo(function PixelCell({
  x,
  y,
  hex,
  selected,
  showGrid,
  suppressClickRef,
  onSelect,
  onHover,
  onLeave,
}: PixelCellProps) {
  return (
    <button
      type="button"
      role="gridcell"
      aria-label={`Pixel column ${x} row ${y}, color ${hex}`}
      aria-selected={selected}
      className={cn(
        "relative block size-full cursor-crosshair rounded-none border-0 p-0",
        "hover:z-10 hover:outline-2 hover:outline-offset-[-2px] hover:outline-black/80",
        selected && "z-20 outline-2 outline-offset-[-2px] outline-white ring-2 ring-black",
        showGrid && "shadow-[inset_0_0_0_1px_rgb(0_0_0_/_0.22)]",
      )}
      style={{ backgroundColor: hex }}
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
