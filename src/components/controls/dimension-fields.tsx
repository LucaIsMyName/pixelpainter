import { useRef } from "react";
import { toast } from "sonner";
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

  function commit(): void {
    const widthText = widthRef.current?.value ?? String(width);
    const heightText = heightRef.current?.value ?? String(height);
    const nextWidth = parseDimensionInput(widthText);
    const nextHeight = parseDimensionInput(heightText);
    if (nextWidth === null || nextHeight === null) {
      toast.error("Width and height must be whole numbers.");
      if (widthRef.current) {
        widthRef.current.value = String(width);
      }
      if (heightRef.current) {
        heightRef.current.value = String(height);
      }
      return;
    }
    const error = validateDimensions(nextWidth, nextHeight);
    if (error) {
      toast.error(error);
      if (widthRef.current) {
        widthRef.current.value = String(width);
      }
      if (heightRef.current) {
        heightRef.current.value = String(height);
      }
      return;
    }
    onCommit(nextWidth, nextHeight);
  }

  return (
    <div className="grid grid-cols-2 gap-2">
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
    </div>
  );
}
