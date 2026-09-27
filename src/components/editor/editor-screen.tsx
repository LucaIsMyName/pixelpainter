import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DimensionFields } from "@/components/controls/dimension-fields";
import { PaletteEditor } from "@/components/controls/palette-editor";
import { PixelInspector } from "@/components/pixel-inspector/pixel-inspector";
import { PixelViewport } from "@/components/pixel-grid/pixel-viewport";
import { downloadMatrixFile, downloadPixelJpeg } from "@/lib/export";
import { serializeMatrix } from "@/lib/matrix";
import { useProject } from "@/state/project-context";

export function EditorScreen() {
  const { state, setDimensions, goToCrop, loadImage } = useProject();
  const hasSource = Boolean(state.source);

  async function exportJpg(): Promise<void> {
    if (state.pixels.length === 0) {
      toast.error("Generate a pixel grid before exporting.");
      return;
    }
    try {
      await downloadPixelJpeg(state.pixels, state.width, state.height);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not export JPG.";
      toast.error(message);
    }
  }

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-64 shrink-0 flex-col gap-4 overflow-auto border-r border-border bg-background p-3">
        <div>
          <h2 className="text-sm font-semibold">Source / settings</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasSource
              ? state.source?.fileName
              : "Opened from a matrix file. Upload an image to recrop or resize."}
          </p>
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
        <PaletteEditor />
      </aside>

      <PixelViewport />

      <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-auto border-l border-border bg-background p-3">
        <PixelInspector />
        <div className="mt-auto flex flex-col gap-2 pt-4">
          <Button type="button" onClick={() => void exportJpg()}>
            Download JPG
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (state.pixels.length === 0) {
                toast.error("Generate a pixel grid before exporting.");
                return;
              }
              downloadMatrixFile(
                serializeMatrix(
                  state.width,
                  state.height,
                  state.palette,
                  state.pixels,
                ),
                state.width,
                state.height,
              );
            }}
          >
            Download Matrix
          </Button>
          <p className="text-[11px] text-muted-foreground">
            JPG is the pixel grid, not the original photo. The matrix file can
            reopen this artwork without the source image.
          </p>
        </div>
      </aside>
    </div>
  );
}
