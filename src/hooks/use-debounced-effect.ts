import { useEffect, useRef } from "react";

export function useDebouncedEffect(
  effect: () => void,
  deps: unknown[],
  delayMs: number,
): void {
  const effectRef = useRef(effect);
  effectRef.current = effect;

  useEffect(() => {
    const handle = window.setTimeout(() => {
      effectRef.current();
    }, delayMs);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounced snapshot of deps
  }, [...deps, delayMs]);
}
