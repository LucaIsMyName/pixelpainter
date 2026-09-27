import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DimensionFields } from "@/components/controls/dimension-fields";
import { CropFrame } from "@/components/editor/crop-frame";
import { PaletteEditor } from "@/components/controls/palette-editor";
import { useIsMdUp } from "@/hooks/use-responsive-panel";
import { useProject } from "@/state/project-context";

function CropSidebar() {
  const { state, setDimensions, confirmCrop } = useProject();

  return (
    <>
      <div data-component="CropSidebar">
        <h2 className="text-sm font-semibold">Crop</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Choose the part of the photo that maps onto a {state.width} ×{" "}
          {state.height} canvas. The frame stays locked to that aspect ratio.
        </p>
      </div>
      <DimensionFields
        key={`${state.width}x${state.height}`}
        width={state.width}
        height={state.height}
        onCommit={setDimensions}
      />
      <p className="text-[11px] text-muted-foreground" id="grid-size-hint">
        {state.source?.width} × {state.source?.height} source
      </p>
      <Separator />
      <div className="min-h-0 flex-1 overflow-auto md:flex-none">
        <PaletteEditor compact />
      </div>
      <Button type="button" className="w-full shrink-0" onClick={confirmCrop}>
        Use Crop
      </Button>
    </>
  );
}

export function CropScreen() {
  const { state, setCrop } = useProject();
  const isMdUp = useIsMdUp();

  if (!state.source || !state.crop) {
    return null;
  }

  const frame = (
    <CropFrame
      data-component="CropFrame"
      imageUrl={state.source.objectUrl}
      imageWidth={state.source.width}
      imageHeight={state.source.height}
      crop={state.crop}
      aspect={state.width / state.height}
      onChange={setCrop}
    />
  );

  if (!isMdUp) {
    return (
      <div data-component="CropScreen" className="flex h-full min-h-0 flex-col overflow-auto">
        <aside className="flex shrink-0 flex-col gap-4 border-b border-border p-3">
          <CropSidebar />
        </aside>
        <div className="min-h-[min(50vh,420px)] flex-1 p-3">{frame}</div>
      </div>
    );
  }

  return (
    <div data-component="CropScreen" className="flex h-full min-h-0">
      <aside className="flex w-64 shrink-0 flex-col gap-4 overflow-hidden border-r border-border bg-background p-3">
        <CropSidebar />
      </aside>
      <div className="min-w-0 flex-1 p-3">{frame}</div>
    </div>
  );
}
