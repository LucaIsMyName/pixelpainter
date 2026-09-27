import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Crop } from "@/types";
import { useElementSize } from "@/hooks/use-element-size";
import {
  applyCropDrag,
  clientToImagePoint,
  containedImageRect,
  type CropHandle,
} from "@/lib/image-processing/crop";

type CropFrameProps = {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  crop: Crop;
  aspect: number;
  gridWidth: number;
  gridHeight: number;
  onChange: (crop: Crop) => void;
};

const HANDLES: CropHandle[] = ["nw", "ne", "sw", "se"];

export function CropFrame({
  imageUrl,
  imageWidth,
  imageHeight,
  crop,
  aspect,
  gridWidth,
  gridHeight,
  onChange,
}: CropFrameProps) {
  const [containerRef, containerSize] = useElementSize<HTMLDivElement>();
  const dragRef = useRef<{
    handle: CropHandle;
    pointer: { x: number; y: number };
    crop: Crop;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const display = containedImageRect(
    containerSize.width,
    containerSize.height,
    imageWidth,
    imageHeight,
  );

  function imagePoint(
    event: ReactPointerEvent<HTMLElement>,
  ): { x: number; y: number } | null {
    const element = containerRef.current;
    if (!element || display.width === 0) {
      return null;
    }
    return clientToImagePoint(
      event.clientX,
      event.clientY,
      element.getBoundingClientRect(),
      display,
      imageWidth,
      imageHeight,
    );
  }

  function startDrag(handle: CropHandle, event: ReactPointerEvent<HTMLElement>): void {
    const point = imagePoint(event);
    if (!point) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { handle, pointer: point, crop };
    setDragging(true);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>): void {
    const drag = dragRef.current;
    const point = imagePoint(event);
    if (!drag || !point) {
      return;
    }
    onChange(
      applyCropDrag(
        drag.handle,
        point,
        { pointer: drag.pointer, crop: drag.crop },
        imageWidth,
        imageHeight,
        aspect,
      ),
    );
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>): void {
    if (dragRef.current) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      dragRef.current = null;
      setDragging(false);
    }
  }

  const scaleX = display.width / imageWidth;
  const scaleY = display.height / imageHeight;
  const frame = {
    left: display.x + crop.x * scaleX,
    top: display.y + crop.y * scaleY,
    width: crop.width * scaleX,
    height: crop.height * scaleY,
  };

  return (
    <div
      data-component="CropFrame"
      ref={containerRef}
      className="relative h-full min-h-0 w-full touch-none overflow-hidden bg-[radial-gradient(circle_at_center,var(--muted)_0.8px,transparent_0.8px)] bg-size-[14px_14px] bg-neutral-950"
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {display.width > 0 ? (
        <img
          src={imageUrl}
          alt="Source image to crop"
          draggable={false}
          className="pointer-events-none absolute max-w-none select-none"
          style={{
            left: display.x,
            top: display.y,
            width: display.width,
            height: display.height,
          }}
        />
      ) : null}

      <div className="absolute inset-0 bg-black/50" />

      <div
        role="presentation"
        className={`absolute box-border border-2 border-white ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          left: frame.left,
          top: frame.top,
          width: frame.width,
          height: frame.height,
          boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.45)",
        }}
        onPointerDown={(event) => startDrag("move", event)}
      >
        <div className="pointer-events-none absolute inset-0 outline outline-1 outline-black/40" />
        <CropPixelGrid gridWidth={gridWidth} gridHeight={gridHeight} />
        <CropGuides />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2"
        >
          <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 rotate-45 bg-white shadow-[0_0_0_1px_rgb(0_0_0_/_0.5)]" />
          <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 -rotate-45 bg-white shadow-[0_0_0_1px_rgb(0_0_0_/_0.5)]" />
          <span className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-1 ring-black/50" />
        </div>
        {HANDLES.map((handle) => (
          <button
            key={handle}
            type="button"
            aria-label={`Resize crop ${handle}`}
            className="absolute size-6 rounded-sm border border-neutral-900 bg-white"
            style={handleStyle(handle)}
            onPointerDown={(event) => {
              event.stopPropagation();
              startDrag(handle, event);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function CropPixelGrid({
  gridWidth,
  gridHeight,
}: {
  gridWidth: number;
  gridHeight: number;
}) {
  if (gridWidth < 2 && gridHeight < 2) {
    return null;
  }

  const verticalLines = Array.from(
    { length: Math.max(0, gridWidth - 1) },
    (_, index) => {
      const fraction = ((index + 1) / gridWidth) * 100;
      return `${fraction}%`;
    },
  );
  const horizontalLines = Array.from(
    { length: Math.max(0, gridHeight - 1) },
    (_, index) => {
      const fraction = ((index + 1) / gridHeight) * 100;
      return `${fraction}%`;
    },
  );

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
    >
      {verticalLines.map((x) => (
        <line
          key={`v-${x}`}
          x1={x}
          y1="0"
          x2={x}
          y2="100%"
          stroke="white"
          strokeOpacity={0.22}
          strokeWidth={0.75}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {horizontalLines.map((y) => (
        <line
          key={`h-${y}`}
          x1="0"
          y1={y}
          x2="100%"
          y2={y}
          stroke="white"
          strokeOpacity={0.22}
          strokeWidth={0.75}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

function CropGuides() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
    >
      <ThirdLine x1="33.333%" y1="0" x2="33.333%" y2="100%" />
      <ThirdLine x1="66.667%" y1="0" x2="66.667%" y2="100%" />
      <ThirdLine x1="0" y1="33.333%" x2="100%" y2="33.333%" />
      <ThirdLine x1="0" y1="66.667%" x2="100%" y2="66.667%" />
    </svg>
  );
}

function ThirdLine({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: string;
  y1: string;
  x2: string;
  y2: string;
}) {
  return (
    <>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="black"
        strokeOpacity="0.4"
        strokeWidth="3"
      />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="white"
        strokeWidth="1.25"
        strokeDasharray="5 4"
      />
    </>
  );
}

function handleStyle(handle: CropHandle): {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  cursor: string;
} {
  if (handle === "nw") {
    return { left: "-12px", top: "-12px", cursor: "nwse-resize" };
  }
  if (handle === "ne") {
    return { right: "-12px", top: "-12px", cursor: "nesw-resize" };
  }
  if (handle === "sw") {
    return { left: "-12px", bottom: "-12px", cursor: "nesw-resize" };
  }
  return { right: "-12px", bottom: "-12px", cursor: "nwse-resize" };
}
