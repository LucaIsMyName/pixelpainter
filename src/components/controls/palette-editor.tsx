import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPaintColor, normalizeHex } from "@/lib/color";
import { useProject } from "@/state/project-context";

type PaletteEditorProps = {
  compact?: boolean;
};

export function PaletteEditor({ compact = false }: PaletteEditorProps) {
  const { state, updatePalette } = useProject();

  function updateColor(
    id: string,
    patch: { name?: string; hex?: string },
  ): void {
    updatePalette(
      state.palette.map((paint) =>
        paint.id === id ? { ...paint, ...patch } : paint,
      ),
    );
  }

  function removeColor(id: string): void {
    updatePalette(state.palette.filter((paint) => paint.id !== id));
  }

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label>Paint palette</Label>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() =>
            updatePalette([
              ...state.palette,
              createPaintColor("New paint", "#808080"),
            ])
          }
        >
          <Plus />
          Add
        </Button>
      </div>
      <ul className={`flex flex-col gap-2 ${compact ? "" : "min-h-0 overflow-auto pr-1"}`}>
        {state.palette.map((paint) => (
          <li
            key={paint.id}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5"
          >
            <label className="relative size-7 shrink-0 overflow-hidden rounded-sm border border-border">
              <span className="sr-only">Change {paint.name} color</span>
              <input
                type="color"
                value={paint.hex}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
                onChange={(event) => {
                  const hex = normalizeHex(event.target.value);
                  if (hex) {
                    updateColor(paint.id, { hex });
                  }
                }}
              />
              <span
                aria-hidden="true"
                className="block size-full"
                style={{ backgroundColor: paint.hex }}
              />
            </label>
            <div className="grid min-w-0 flex-1 gap-1">
              <Input
                value={paint.name}
                aria-label="Paint name"
                className="h-7"
                onChange={(event) =>
                  updatePalette(
                    state.palette.map((item) =>
                      item.id === paint.id
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                    { remix: false },
                  )
                }
              />
              {!compact ? (
                <Input
                  defaultValue={paint.hex}
                  key={`${paint.id}-${paint.hex}`}
                  aria-label={`${paint.name} hex`}
                  className="h-7 font-mono text-xs"
                  onBlur={(event) => {
                    const hex = normalizeHex(event.target.value);
                    if (hex) {
                      updateColor(paint.id, { hex });
                    } else {
                      event.target.value = paint.hex;
                    }
                  }}
                />
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Remove ${paint.name}`}
              disabled={state.palette.length <= 1}
              onClick={() => removeColor(paint.id)}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
