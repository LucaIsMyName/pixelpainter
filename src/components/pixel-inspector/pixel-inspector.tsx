import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  formatHsl,
  formatRgb,
  mixPercents,
  rgbDistance,
  rgbToHex,
} from "@/lib/color";
import { useProject } from "@/state/project-context";

async function copyText(label: string, value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied.`);
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}.`);
  }
}

export function PixelInspector() {
  const { state } = useProject();
  const selected = state.selectedPixel;
  const pixel =
    selected && state.pixels[selected.y]
      ? (state.pixels[selected.y]?.[selected.x] ?? null)
      : null;

  if (!selected || !pixel) {
    return (
      <div className="text-sm text-muted-foreground">
        Hover a square for coordinates and color. Click a square to inspect its
        paint mix.
      </div>
    );
  }

  const hex = rgbToHex(pixel.targetColor);
  const rgb = formatRgb(pixel.targetColor);
  const hsl = formatHsl(pixel.targetColor);
  const mixHex = rgbToHex(pixel.mix.reconstructed);
  const percents = mixPercents(pixel.mix, state.palette).sort(
    (a, b) => b.percent - a.percent,
  );
  const mismatch = rgbDistance(pixel.targetColor, pixel.mix.reconstructed);

  return (
    <div data-component="PixelInspector" className="flex flex-col gap-4 text-sm">
      <div>
        <h2 className="text-sm font-semibold">
          Pixel {selected.x}, {selected.y}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Column {selected.x}, row {selected.y}
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Target color
        </h3>
        <div className="flex items-start gap-3">
          <span
            className="size-12 shrink-0 rounded-md border border-border"
            style={{ backgroundColor: hex }}
            aria-hidden="true"
          />
          <dl className="grid min-w-0 flex-1 gap-1 font-mono text-xs">
            <ColorRow
              label="HEX"
              value={hex}
              onCopy={() => void copyText("HEX", hex)}
            />
            <ColorRow
              label="RGB"
              value={rgb}
              onCopy={() => void copyText("RGB", rgb)}
            />
            <ColorRow
              label="HSL"
              value={hsl}
              onCopy={() => void copyText("HSL", hsl)}
            />
          </dl>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Mix preview
        </h3>
        <div className="flex items-center gap-2">
          <Swatch label="Target" hex={hex} />
          <Swatch label="Mixed" hex={mixHex} />
        </div>
        {mismatch > 18 ? (
          <p className="text-xs text-muted-foreground">
            This palette cannot match the target closely. The mix is the nearest
            combination of the paints you have.
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Paint mixture
        </h3>
        <ul className="flex flex-col gap-1.5">
          {percents.map(({ paint, percent }) => (
            <li key={paint.id} className="flex items-center gap-2">
              <span
                className="size-3.5 shrink-0 rounded-sm border border-border"
                style={{ backgroundColor: paint.hex }}
                aria-hidden="true"
              />
              <div className="border h-2 min-w-0 flex-1 overflow-hidden rounded-sm bg-muted">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.max(percent, 0)}%`,
                    backgroundColor: paint.hex,
                  }}
                />
              </div>
              <span className="w-24 truncate text-xs">{paint.name}</span>
              <span className="w-12 text-right font-mono text-xs tabular-nums">
                {percent.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        This mixture is an RGB absorption estimate, not a physical pigment
        recipe. Real acrylic or oil paint does not mix the same way as light on
        a screen.
      </p>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div data-component="ColorRow" className="flex items-center gap-1">
      <dt className="w-8 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 truncate">{value}</dd>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`Copy ${label}`}
        onClick={onCopy}
      >
        <Copy />
      </Button>
    </div>
  );
}

function Swatch({ label, hex }: { label: string; hex: string }) {
  return (
    <div data-component="Swatch" className="flex items-center gap-2">
      <span
        className="size-8 rounded-md border border-border"
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      />
      <div className="text-xs">
        <div className="text-muted-foreground">{label}</div>
        <div className="font-mono">{hex}</div>
      </div>
    </div>
  );
}
