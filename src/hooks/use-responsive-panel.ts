import { useEffect, useState } from "react";

const MD_BREAKPOINT = 768;

export type EditorPanel = "settings" | "grid" | "inspector";

export function useIsMdUp(): boolean {
  const [isMdUp, setIsMdUp] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`).matches
      : true,
  );

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`);
    const onChange = (): void => setIsMdUp(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return isMdUp;
}
