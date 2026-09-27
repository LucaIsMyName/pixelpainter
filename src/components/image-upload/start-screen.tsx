import { FileJson, ImageUp } from "lucide-react";
import { FileDropZone } from "@/components/image-upload/file-drop-zone";
import { useProject } from "@/state/project-context";

export function StartScreen() {
  const { loadImage, loadMatrix } = useProject();

  return (
    <div data-component="StartScreen" className="flex h-full items-center justify-center overflow-auto p-6">
      <div className="grid w-full max-w-3xl gap-6">
        <div className="">
          <h1 className="text-lg font-semibold tracking-tight">
            Turn a photo into a paint-by-square reference
          </h1>
          <ol className="mt-2 flex flex-wrap justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <li>1. Upload or open a matrix</li>
            <li>2. Crop to your canvas ratio</li>
            <li>3. Inspect each square&apos;s paint mix</li>
          </ol>
        </div>
        <div className="grid gap-6 md:grid-cols-1">
          <FileDropZone
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            title="Create from Image"
            description="Upload a photo, crop it to your canvas ratio, then inspect each paint square."
            buttonLabel="Choose Image"
            icon={<ImageUp className="size-7" />}
            onFile={(file) => void loadImage(file)}
          />
          <FileDropZone
            accept="application/json,text/plain,.json,.txt"
            title="Open PixelPainter Matrix"
            description="Reload a saved project without the original image."
            buttonLabel="Choose Matrix"
            icon={<FileJson className="size-7" />}
            onFile={(file) => void loadMatrix(file)}
          />
        </div>
      </div>
    </div>
  );
}
