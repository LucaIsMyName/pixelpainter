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
  onChange: (crop: Crop) => void;
};

const HANDLES: CropHandle[] = ["nw", "ne", "sw", "se"];

export function CropFrame({
  imageUrl,
  imageWidth,
  imageHeight,
  crop,
  aspect,
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
      ref={containerRef}
      className="relative h-full min-h-0 w-full touch-none overflow-hidden bg-neutral-950"
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
        {HANDLES.map((handle) => (
          <button
            key={handle}
            type="button"
            aria-label={`Resize crop ${handle}`}
            className="absolute size-3 rounded-sm border border-neutral-900 bg-white"
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

function handleStyle(handle: CropHandle): { left?: string; right?: string; top?: string; bottom?: string; cursor: string } {
  if (handle === "nw") {
    return { left: "-6px", top: "-6px", cursor: "nwse-resize" };
  }
  if (handle === "ne") {
    return { right: "-6px", top: "-6px", cursor: "nesw-resize" };
  }
  if (handle === "sw") {
    return { left: "-6px", bottom: "-6px", cursor: "nesw-resize" };
  }
  return { right: "-6px", bottom: "-6px", cursor: "nwse-resize" };
}
