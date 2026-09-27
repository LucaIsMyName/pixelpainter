import { summarizePaintUsage } from "@/lib/analytics/paint-usage";
import { useProject } from "@/state/project-context";

export function PaintUsageSummary() {
  const { state } = useProject();
  if (state.pixels.length === 0) {
    return null;
  }

  const rows = summarizePaintUsage(state.pixels, state.palette);

  return (
    <section data-component="PaintUsageSummary" className="flex flex-col gap-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Paint usage (estimate)
      </h3>
      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <li key={row.paint.id} className="flex items-center gap-2 text-xs">
            <span
              className="size-3 shrink-0 rounded-sm border border-border"
              style={{ backgroundColor: row.paint.hex }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate">{row.paint.name}</span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {row.averagePercent.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Average mix weight per cell — useful for planning, not exact pigment
        amounts.
      </p>
    </section>
  );
}
