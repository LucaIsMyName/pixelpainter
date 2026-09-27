import { useRef } from "react";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  parseDimensionInput,
  validateDimensions,
} from "@/lib/image-processing/dimensions";

type DimensionFieldsProps = {
  width: number;
  height: number;
  disabled?: boolean;
  onCommit: (width: number, height: number) => string | null;
};

export function DimensionFields({
  width,
  height,
  disabled = false,
  onCommit,
}: DimensionFieldsProps) {
  const widthRef = useRef<HTMLInputElement>(null);
  const heightRef = useRef<HTMLInputElement>(null);

  function readParsedDimensions(): {
    width: number;
    height: number;
  } | null {
    const widthText = widthRef.current?.value ?? String(width);
    const heightText = heightRef.current?.value ?? String(height);
    const nextWidth = parseDimensionInput(widthText);
    const nextHeight = parseDimensionInput(heightText);
    if (nextWidth === null || nextHeight === null) {
      return null;
    }
    return { width: nextWidth, height: nextHeight };
  }

  function resetInputs(nextWidth: number, nextHeight: number): void {
    if (widthRef.current) {
      widthRef.current.value = String(nextWidth);
    }
    if (heightRef.current) {
      heightRef.current.value = String(nextHeight);
    }
  }

  function commit(): void {
    const parsed = readParsedDimensions();
    if (!parsed) {
      toast.error("Width and height must be whole numbers.");
      resetInputs(width, height);
      return;
    }
    const error = validateDimensions(parsed.width, parsed.height);
    if (error) {
      toast.error(error);
      resetInputs(width, height);
      return;
    }
    onCommit(parsed.width, parsed.height);
  }

  function swapDimensions(): void {
    const parsed = readParsedDimensions();
    if (!parsed) {
      toast.error("Width and height must be whole numbers.");
      resetInputs(width, height);
      return;
    }
    const error = validateDimensions(parsed.height, parsed.width);
    if (error) {
      toast.error(error);
      return;
    }
    onCommit(parsed.height, parsed.width);
  }

  return (
    <div data-component="DimensionFields" className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="grid-width">Width</Label>
        <Input
          id="grid-width"
          ref={widthRef}
          inputMode="numeric"
          defaultValue={String(width)}
          disabled={disabled}
          aria-describedby="grid-size-hint"
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="grid-height">Height</Label>
        <Input
          id="grid-height"
          ref={heightRef}
          inputMode="numeric"
          defaultValue={String(height)}
          disabled={disabled}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        disabled={disabled}
        aria-label="Swap width and height"
        title="Swap width and height"
        onClick={swapDimensions}
      >
        <ArrowLeftRight />
      </Button>
    </div>
  );
}
