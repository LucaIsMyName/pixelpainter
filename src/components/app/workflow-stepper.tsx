import { cn } from "@/lib/utils";
import { useProject } from "@/state/project-context";

const STEPS = [
  { id: "start", label: "Upload" },
  { id: "crop", label: "Crop" },
  { id: "editor", label: "Paint grid" },
] as const;

export function WorkflowStepper() {
  const { state, goToCrop } = useProject();
  const activeIndex = STEPS.findIndex((step) => step.id === state.phase);

  return (
    <nav
      data-component="WorkflowStepper"
      aria-label="Workflow"
      className="hidden items-center gap-1 md:flex"
    >
      {STEPS.map((step, index) => {
        const isActive = step.id === state.phase;
        const isComplete = index < activeIndex;
        const clickable =
          step.id === "crop" &&
          state.phase === "editor" &&
          Boolean(state.source);

        return (
          <div key={step.id} className="flex items-center gap-1">
            {index > 0 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "h-px w-4",
                  isComplete || isActive ? "bg-foreground/40" : "bg-border",
                )}
              />
            ) : null}
            {clickable ? (
              <button
                type="button"
                onClick={goToCrop}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                  "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {step.label}
              </button>
            ) : (
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-medium",
                  isActive && "bg-primary text-primary-foreground",
                  !isActive && isComplete && "text-foreground",
                  !isActive && !isComplete && "text-muted-foreground",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {step.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
