import { Copy, Download, FileJson, ImageDown } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadMatrixFile, downloadPixelJpeg } from "@/lib/export";
import { serializeMatrix } from "@/lib/matrix";
import { useProject } from "@/state/project-context";

export function ExportMenu() {
  const { state } = useProject();
  const disabled = state.pixels.length === 0;

  async function exportJpg(): Promise<void> {
    try {
      await downloadPixelJpeg(state.pixels, state.width, state.height);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not export JPG.";
      toast.error(message);
    }
  }

  function exportMatrix(): void {
    downloadMatrixFile(
      serializeMatrix(state.width, state.height, state.palette, state.pixels),
      state.width,
      state.height,
    );
  }

  async function copyMatrixJson(): Promise<void> {
    const json = serializeMatrix(
      state.width,
      state.height,
      state.palette,
      state.pixels,
    );
    try {
      await navigator.clipboard.writeText(json);
      toast.success("Matrix JSON copied to clipboard.");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }

  return (
    <DropdownMenu data-component="ExportMenu">
      <DropdownMenuTrigger
        disabled={disabled}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <Download data-icon="inline-start" />
        Export
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => void exportJpg()}>
          <ImageDown />
          Download JPG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportMatrix}>
          <FileJson />
          Download matrix
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void copyMatrixJson()}>
          <Copy />
          Copy matrix JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ExportMenuMobileTrigger() {
  const { state } = useProject();
  if (state.pixels.length === 0) {
    return null;
  }
  return (
    <div className="md:hidden">
      <ExportMenu />
    </div>
  );
}
