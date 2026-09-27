import { FileJson, ImageUp } from "lucide-react";
import { FileDropZone } from "@/components/image-upload/file-drop-zone";
import { useProject } from "@/state/project-context";

export function StartScreen() {
  const { loadImage, loadMatrix } = useProject();

  return (
    <div className="flex h-full items-start justify-center overflow-auto p-6">
      <div className="grid w-full max-w-3xl gap-6 md:grid-cols-2">
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
  );
}
