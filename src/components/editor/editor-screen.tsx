import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { DimensionFields } from "@/components/controls/dimension-fields";
import { PaletteEditor } from "@/components/controls/palette-editor";
import { PaintUsageSummary } from "@/components/controls/paint-usage-summary";
import { PixelInspector } from "@/components/pixel-inspector/pixel-inspector";
import { PixelViewport } from "@/components/pixel-grid/pixel-viewport";
import { ExportMenuMobileTrigger } from "@/components/app/export-menu";
import { useIsMdUp, type EditorPanel } from "@/hooks/use-responsive-panel";
import { cn } from "@/lib/utils";
import { useProject } from "@/state/project-context";

function SidebarPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col gap-4 overflow-auto border-border bg-background p-3",
        className,
      )}
    >
      {children}
    </aside>
  );
}

function SettingsPanel() {
  const {
    state,
    setDimensions,
    goToCrop,
    loadImage,
    setMismatchHighlight,
    setReferenceSplit,
  } = useProject();
  const hasSource = Boolean(state.source);

  return (
    <>
      <div data-component="SettingsPanel">
        <h2 className="text-sm font-semibold">Source Image or Matrix</h2>
        <p className="mt-1 text-xs text-muted-foreground truncate">
          {hasSource
            ? state.source?.fileName
            : "Opened from a matrix file. Upload an image to recrop or resize."}
        </p>
        {!hasSource ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Upload a source image to change grid size or recrop.
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";
            input.onchange = () => {
              const file = input.files?.[0];
              if (file) {
                void loadImage(file);
              }
            };
            input.click();
          }}
        >
          Replace image
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={goToCrop}
          disabled={!hasSource}
        >
          Adjust crop
        </Button>
      </div>
      <DimensionFields
        key={`${state.width}x${state.height}-${hasSource ? "source" : "matrix"}`}
        width={state.width}
        height={state.height}
        disabled={!hasSource}
        onCommit={setDimensions}
      />
      <p className="text-[11px] text-muted-foreground" id="grid-size-hint">
        {hasSource
          ? "Changing size resamples the cropped image."
          : "Changing size needs a source image so the grid can be resampled."}
      </p>
      <Separator />
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="mismatch-highlight" className="text-xs">
            Highlight hard squares
          </Label>
          <Switch
            id="mismatch-highlight"
            checked={state.showMismatchHighlight}
            onCheckedChange={setMismatchHighlight}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="reference-split" className="text-xs">
              Reference overlay
            </Label>
            <Switch
              id="reference-split"
              checked={state.referenceSplitEnabled}
              disabled={!hasSource || !state.crop}
              onCheckedChange={(checked) => setReferenceSplit(checked)}
            />
          </div>
          {state.referenceSplitEnabled ? (
            <Slider
              min={0.1}
              max={0.9}
              step={0.05}
              value={[state.referenceSplitOpacity]}
              onValueChange={(values) =>
                setReferenceSplit(true, values[0] ?? 0.45)
              }
              aria-label="Reference overlay opacity"
            />
          ) : null}
        </div>
      </div>
      <Separator />
      <PaletteEditor />
      <PaintUsageSummary />
    </>
  );
}

export function EditorScreen() {
  const isMdUp = useIsMdUp();
  const [mobilePanel, setMobilePanel] = useState<EditorPanel>("grid");

  if (isMdUp) {
    return (
      <div className="flex h-full min-h-0">
        <SidebarPanel className="w-64 shrink-0 border-r">
          <SettingsPanel />
        </SidebarPanel>
        <PixelViewport />
        <SidebarPanel className="w-72 shrink-0 border-l">
          <PixelInspector />
          <p className="text-[11px] text-muted-foreground">
            Use Export in the header for JPG or matrix files. Refresh keeps
            your session on this device until you click New.
          </p>
        </SidebarPanel>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-1.5">
        {(
          [
            ["settings", "Settings"],
            ["grid", "Grid"],
            ["inspector", "Inspect"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            type="button"
            size="xs"
            variant={mobilePanel === id ? "secondary" : "ghost"}
            onClick={() => setMobilePanel(id)}
          >
            {label}
          </Button>
        ))}
        <div className="ml-auto">
          <ExportMenuMobileTrigger />
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        {mobilePanel === "settings" ? (
          <SidebarPanel className="h-full border-0">
            <SettingsPanel />
          </SidebarPanel>
        ) : null}
        {mobilePanel === "grid" ? (
          <div className="flex h-full min-h-0 flex-col">
            <PixelViewport />
          </div>
        ) : null}
        {mobilePanel === "inspector" ? (
          <SidebarPanel className="h-full border-0">
            <PixelInspector />
          </SidebarPanel>
        ) : null}
      </div>
    </div>
  );
}
