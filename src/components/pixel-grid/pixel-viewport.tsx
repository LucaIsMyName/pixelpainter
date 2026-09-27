import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PixelGrid } from "@/components/pixel-grid/pixel-grid";
import { useElementSize } from "@/hooks/use-element-size";
import { PIXEL_CELL_SIZE } from "@/lib/image-processing/dimensions";
import { referenceOverlayStyle } from "@/lib/image-processing/reference-overlay";
import { useProject } from "@/state/project-context";

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 24;
const PAN_THRESHOLD = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function PixelViewport() {
  const { state, selectPixel } = useProject();
  const [viewportRef, viewportSize] = useElementSize<HTMLDivElement>();
  const suppressClickRef = useRef(false);
  const viewRef = useRef({ zoom: 1, panX: 0, panY: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
    moved: boolean;
  } | null>(null);
  const pinchRef = useRef<{
    distance: number;
    zoom: number;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const gridWidth = state.width * PIXEL_CELL_SIZE;
  const gridHeight = state.height * PIXEL_CELL_SIZE;
  const fitKey = `${state.width}x${state.height}:${state.pixels.length}`;

  function applyView(nextZoom: number, nextPanX: number, nextPanY: number): void {
    const z = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    viewRef.current = { zoom: z, panX: nextPanX, panY: nextPanY };
    setZoom(z);
    setPan({ x: nextPanX, y: nextPanY });
  }

  function fitToViewport(): void {
    if (viewportSize.width <= 0 || viewportSize.height <= 0) {
      return;
    }
    const padding = 32;
    const scale = Math.min(
      (viewportSize.width - padding) / gridWidth,
      (viewportSize.height - padding) / gridHeight,
      8,
    );
    const nextZoom = clamp(scale, MIN_ZOOM, MAX_ZOOM);
    applyView(
      nextZoom,
      (viewportSize.width - gridWidth * nextZoom) / 2,
      (viewportSize.height - gridHeight * nextZoom) / 2,
    );
  }

  function resetZoom(): void {
    if (viewportSize.width <= 0) {
      applyView(1, 0, 0);
      return;
    }
    applyView(
      1,
      (viewportSize.width - gridWidth) / 2,
      (viewportSize.height - gridHeight) / 2,
    );
  }

  function zoomBy(factor: number, originX?: number, originY?: number): void {
    const current = viewRef.current;
    const nextZoom = clamp(current.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    const cx = originX ?? viewportSize.width / 2;
    const cy = originY ?? viewportSize.height / 2;
    const worldX = (cx - current.panX) / current.zoom;
    const worldY = (cy - current.panY) / current.zoom;
    applyView(nextZoom, cx - worldX * nextZoom, cy - worldY * nextZoom);
  }

  const didFitKey = useRef("");

  useLayoutEffect(() => {
    if (viewportSize.width < 120 || viewportSize.height < 120) {
      return;
    }
    if (didFitKey.current === fitKey) {
      return;
    }
    didFitKey.current = fitKey;
    const padding = 32;
    const scale = Math.min(
      (viewportSize.width - padding) / gridWidth,
      (viewportSize.height - padding) / gridHeight,
      8,
    );
    const nextZoom = clamp(scale, MIN_ZOOM, MAX_ZOOM);
    const nextPanX = (viewportSize.width - gridWidth * nextZoom) / 2;
    const nextPanY = (viewportSize.height - gridHeight * nextZoom) / 2;
    viewRef.current = { zoom: nextZoom, panX: nextPanX, panY: nextPanY };
    setZoom(nextZoom);
    setPan({ x: nextPanX, y: nextPanY });
  }, [fitKey, gridHeight, gridWidth, viewportSize.height, viewportSize.width]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const current = viewRef.current;
      const factor = event.deltaY > 0 ? 0.9 : 1.1;
      const nextZoom = clamp(current.zoom * factor, MIN_ZOOM, MAX_ZOOM);
      const cx = event.clientX - rect.left;
      const cy = event.clientY - rect.top;
      const worldX = (cx - current.panX) / current.zoom;
      const worldY = (cy - current.panY) / current.zoom;
      const nextPanX = cx - worldX * nextZoom;
      const nextPanY = cy - worldY * nextZoom;
      viewRef.current = { zoom: nextZoom, panX: nextPanX, panY: nextPanY };
      setZoom(nextZoom);
      setPan({ x: nextPanX, y: nextPanY });
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [viewportRef]);

  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>): void {
    activePointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (activePointersRef.current.size === 2) {
      const points = [...activePointersRef.current.values()];
      const a = points[0];
      const b = points[1];
      if (a && b) {
        pinchRef.current = {
          distance: Math.hypot(b.x - a.x, b.y - a.y),
          zoom: viewRef.current.zoom,
        };
        dragRef.current = null;
      }
      return;
    }

    if (event.button !== 0) {
      return;
    }
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: viewRef.current.panX,
      panY: viewRef.current.panY,
      moved: false,
    };
    suppressClickRef.current = false;
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>): void {
    if (activePointersRef.current.has(event.pointerId)) {
      activePointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
    }

    const pinch = pinchRef.current;
    if (pinch && activePointersRef.current.size >= 2) {
      const points = [...activePointersRef.current.values()];
      const a = points[0];
      const b = points[1];
      if (a && b) {
        const distance = Math.hypot(b.x - a.x, b.y - a.y);
        if (pinch.distance > 0) {
          const factor = distance / pinch.distance;
          const nextZoom = clamp(pinch.zoom * factor, MIN_ZOOM, MAX_ZOOM);
          const cx = (a.x + b.x) / 2 - event.currentTarget.getBoundingClientRect().left;
          const cy = (a.y + b.y) / 2 - event.currentTarget.getBoundingClientRect().top;
          const current = viewRef.current;
          const worldX = (cx - current.panX) / current.zoom;
          const worldY = (cy - current.panY) / current.zoom;
          applyView(nextZoom, cx - worldX * nextZoom, cy - worldY * nextZoom);
          suppressClickRef.current = true;
        }
      }
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) >= PAN_THRESHOLD) {
      drag.moved = true;
      suppressClickRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (drag.moved) {
      applyView(viewRef.current.zoom, drag.panX + dx, drag.panY + dy);
    }
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>): void {
    activePointersRef.current.delete(event.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchRef.current = null;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }

  const showReference =
    state.referenceSplitEnabled &&
    state.source &&
    state.crop &&
    state.pixels.length > 0;

  return (
    <div data-component="PixelViewport" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref={viewportRef}
        className="relative min-h-0 flex-1 cursor-grab overflow-hidden bg-[radial-gradient(circle_at_center,var(--muted)_0.8px,transparent_0.8px)] bg-size-[14px_14px] touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="relative origin-top-left will-change-transform"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {showReference ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0"
              style={{
                ...referenceOverlayStyle(
                  state.source!,
                  state.crop!,
                  gridWidth,
                  gridHeight,
                ),
                opacity: state.referenceSplitOpacity,
              }}
            />
          ) : null}
          <PixelGrid
            pixels={state.pixels}
            selected={state.selectedPixel}
            showGrid={zoom >= 2}
            showMismatchHighlight={state.showMismatchHighlight}
            showMixedColors={state.showMixedColors}
            suppressClickRef={suppressClickRef}
            onSelect={(x, y) => selectPixel({ x, y })}
            onClear={() => selectPixel(null)}
          />
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-t border-border px-3 py-2">
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          aria-label="Zoom out"
          onClick={() => zoomBy(0.85)}
        >
          <Minus />
        </Button>
        <span className="min-w-14 text-center text-xs tabular-nums text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          aria-label="Zoom in"
          onClick={() => zoomBy(1.15)}
        >
          <Plus />
        </Button>
        <Button type="button" variant="ghost" size="xs" onClick={fitToViewport}>
          Fit
        </Button>
        <Button type="button" variant="ghost" size="xs" onClick={resetZoom}>
          Reset
        </Button>
        {zoom >= 2 ? (
          <span className="text-[11px] text-muted-foreground">
            Grid lines · 1 cell = {PIXEL_CELL_SIZE}px
          </span>
        ) : null}
      </div>
    </div>
  );
}
