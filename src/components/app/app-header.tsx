import { useRef, useState, type ChangeEvent } from "react";
import { FileJson, FolderOpen, ImagePlus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { WorkflowStepper } from "@/components/app/workflow-stepper";
import { ExportMenu } from "@/components/app/export-menu";
import { ConfirmDiscardDialog } from "@/components/app/confirm-discard-dialog";
import { useProject } from "@/state/project-context";

type PendingOpen = { kind: "image" | "matrix"; file: File } | { kind: "new" };

export function AppHeader() {
  const { state, loadImage, loadMatrix, newProject, hasRestorableWork } =
    useProject();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const matrixInputRef = useRef<HTMLInputElement>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const pendingRef = useRef<PendingOpen | null>(null);

  function requestDiscard(pending: PendingOpen): void {
    if (!hasRestorableWork()) {
      applyPending(pending);
      return;
    }
    pendingRef.current = pending;
    setDiscardOpen(true);
  }

  function applyPending(pending: PendingOpen): void {
    if (pending.kind === "new") {
      newProject();
      return;
    }
    if (pending.kind === "image") {
      void loadImage(pending.file, { skipReplaceCheck: true });
      return;
    }
    void loadMatrix(pending.file, { skipReplaceCheck: true });
  }

  function onImageChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      requestDiscard({ kind: "image", file });
    }
  }

  function onMatrixChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      requestDiscard({ kind: "matrix", file });
    }
  }

  return (
    <>
      <header data-component="AppHeader" className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            aria-hidden="true"
            className="grid size-6 shrink-0 grid-cols-2 overflow-hidden rounded-sm border border-foreground/20"
          >
            <span className="bg-[#c47b4a]" />
            <span className="bg-[#6d8a6a]" />
            <span className="bg-[#d9c27a]" />
            <span className="bg-[#4f6d8a]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              PixelPainter
            </p>
            <p className="hidden text-[11px] leading-none text-muted-foreground sm:block">
              Painting reference
            </p>
          </div>
          <WorkflowStepper />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
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
          <ExportMenu />
          {state.phase !== "start" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => requestDiscard({ kind: "new" })}
            >
              New
            </Button>
          ) : null}
          <ThemeToggle />
        </div>
      </header>
      <ConfirmDiscardDialog
        open={discardOpen}
        title="Replace current work?"
        description="This clears the open project on this device (including the saved session) and cannot be undone unless you exported a matrix file."
        confirmLabel="Replace"
        onOpenChange={setDiscardOpen}
        onConfirm={() => {
          const pending = pendingRef.current;
          pendingRef.current = null;
          if (pending) {
            applyPending(pending);
          }
        }}
      />
    </>
  );
}
