import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type FileDropZoneProps = {
  accept: string;
  title: string;
  description: string;
  buttonLabel: string;
  icon: ReactNode;
  onFile: (file: File) => void;
};

export function FileDropZone({
  accept,
  title,
  description,
  buttonLabel,
  icon,
  onFile,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  function handleFiles(files: FileList | null): void {
    const file = files?.[0];
    if (file) {
      onFile(file);
    }
  }

  function onDrop(event: DragEvent<HTMLElement>): void {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  }

  function onDragOver(event: DragEvent<HTMLElement>): void {
    event.preventDefault();
    setDragActive(true);
  }

  function onDragLeave(event: DragEvent<HTMLElement>): void {
    event.preventDefault();
    setDragActive(false);
  }

  return (
    <section data-component="FileDropZone" className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        aria-busy={dragActive}
        className={cn(
          "flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-6 text-center transition-colors",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/40 hover:border-foreground/30 hover:bg-muted/70",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        )}
      >
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm text-muted-foreground">
          {dragActive ? "Drop to upload" : "Drop a file here, or"}
        </span>
        <span className="text-sm font-medium">{buttonLabel}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </section>
  );
}
