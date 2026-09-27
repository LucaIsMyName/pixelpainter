import { RouterProvider } from "react-router";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { router } from "@/routes/router";
import { ProjectProvider } from "@/state/project-context";

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="pixelpainter-theme"
    >
      <TooltipProvider>
        <ProjectProvider>
          <RouterProvider router={router} />
          <Toaster position="bottom-right" />
        </ProjectProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
