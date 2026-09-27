import { AppShell } from "@/components/app/app-shell";
import { CropScreen } from "@/components/editor/crop-screen";
import { EditorScreen } from "@/components/editor/editor-screen";
import { StartScreen } from "@/components/image-upload/start-screen";
import { useProject } from "@/state/project-context";

export function HomeRoute() {
  const { state } = useProject();

  return (
    <AppShell>
      {state.phase === "start" ? <StartScreen /> : null}
      {state.phase === "crop" ? <CropScreen /> : null}
      {state.phase === "editor" ? <EditorScreen /> : null}
    </AppShell>
  );
}
