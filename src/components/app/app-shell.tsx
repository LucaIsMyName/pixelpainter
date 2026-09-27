import { AppHeader } from "@/components/app/app-header";
import { useProject } from "@/state/project-context";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { state } = useProject();

  const overlayMessage =
    state.processingKind === "restoring"
      ? "Restoring session…"
      : state.processingKind === "generating"
        ? `Generating pixel grid (${state.width}×${state.height})…`
        : null;

  return (
    <div data-component="AppShell" className="relative flex h-svh flex-col bg-background text-foreground">
      <AppHeader />
      <div className="relative min-h-0 flex-1">{children}</div>
      {state.isProcessing && overlayMessage ? (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
        >
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-sm">
            {overlayMessage}
          </div>
        </div>
      ) : null}
    </div>
  );
}
