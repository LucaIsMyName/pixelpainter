import { useRef, type ChangeEvent } from "react";
import { FileJson, FolderOpen, ImagePlus, Save } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { serializeMatrix } from "@/lib/matrix";
import { downloadMatrixFile } from "@/lib/export";
import { useProject } from "@/state/project-context";

export function AppHeader() {
  const { state, loadImage, loadMatrix, newProject } = useProject();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const matrixInputRef = useRef<HTMLInputElement>(null);

  function onImageChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      void loadImage(file);
    }
  }

  function onMatrixChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      void loadMatrix(file);
    }
  }

  function saveMatrix(): void {
    if (state.pixels.length === 0) {
      toast.error("Generate a pixel grid before saving a matrix.");
      return;
    }
    const contents = serializeMatrix(
      state.width,
      state.height,
      state.palette,
      state.pixels,
    );
    downloadMatrixFile(contents, state.width, state.height);
  }

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-3">
      <div className="flex items-center gap-2.5">
        <div
          aria-hidden="true"
          className="grid size-6 grid-cols-2 overflow-hidden rounded-sm border border-foreground/20"
        >
          <span className="bg-[#c47b4a]" />
          <span className="bg-[#6d8a6a]" />
          <span className="bg-[#d9c27a]" />
          <span className="bg-[#4f6d8a]" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">PixelPainter</p>
          <p className="hidden text-[11px] leading-none text-muted-foreground sm:block">
            Painting reference
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
          className="sr-only"
          onChange={onImageChange}
        />
        <input
          ref={matrixInputRef}
          type="file"
          accept="application/json,text/plain,.json,.txt"
          className="sr-only"
          onChange={onMatrixChange}
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <FolderOpen data-icon="inline-start" />
            Open
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
              <ImagePlus />
              Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => matrixInputRef.current?.click()}>
              <FileJson />
              Matrix
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={saveMatrix}
          disabled={state.pixels.length === 0}
        >
          <Save data-icon="inline-start" />
          Save
        </Button>
        {state.phase !== "start" ? (
          <Button type="button" variant="ghost" size="sm" onClick={newProject}>
            New
          </Button>
        ) : null}
        <ThemeToggle />
      </div>
    </header>
  );
}
