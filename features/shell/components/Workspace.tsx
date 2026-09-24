"use client";

import { CanvasSurface } from "@/features/canvas/components/CanvasSurface";
import BlurFadeThemeTransition from "@/components/ui/BlurFadeThemeTransition";
import {
  WorkspaceChrome,
  type ThemeMode,
  type ToolbarToolId,
} from "@/features/shell/components/WorkspaceChrome";
import { useWorkspaceThemeSync } from "@/features/shell/hooks/use-workspace-theme-sync";
import { SettingsThemeContext } from "@/features/shell/settings/theme-context";
import "@/features/canvas/workspace-tokens.css";
import { WorkspaceStyles } from "@/features/shell/components/workspace-styles";
import { WorkspaceEntrance } from "@/features/shell/components/WorkspaceEntrance";
import { CuelumeProvider } from "@/features/shell/hooks/use-cuelume";
import { WORKSPACE_MOBILE_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useState } from "react";

type WorkspaceProps = {
  fontClassName?: string;
  initialTheme?: ThemeMode;
  initialActiveTool?: ToolbarToolId;
};

const DEPLOYMENT_COMMIT_SHA =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? undefined;

export function Workspace({
  fontClassName,
  initialTheme = "dark",
  initialActiveTool,
}: WorkspaceProps) {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);
  const isMobileWorkspace = useMediaQuery(WORKSPACE_MOBILE_QUERY);
  useWorkspaceThemeSync(theme, setTheme);
  return (
    <section
      aria-label="Workspace"
      data-shell-theme={theme}
      data-mobile-workspace={isMobileWorkspace ? "true" : "false"}
      data-slot="workspace"
      data-vercel-git-commit-sha={DEPLOYMENT_COMMIT_SHA}
      className={cn(
        fontClassName,
        theme === "dark" && "dark",
        "relative h-dvh min-h-0 overflow-hidden bg-(--canvas-bg) text-(--canvas-ink) transition-colors duration-[var(--motion-ui)]",
      )}
    >
      <SettingsThemeContext.Provider value={theme}>
        <CuelumeProvider>
          <BlurFadeThemeTransition theme={theme} onThemeChange={setTheme}>
            <WorkspaceEntrance theme={theme}>
              <CanvasSurface
                theme={theme}
                fontClassName={fontClassName}
                initialActiveTool={initialActiveTool}
                onThemeChange={setTheme}
                boardToolbarVariant="zoom"
                renderOverlay={(controller) => (
                  <WorkspaceChrome controller={controller} theme={theme} onThemeChange={setTheme} />
                )}
              />
            </WorkspaceEntrance>
          </BlurFadeThemeTransition>
        </CuelumeProvider>
      </SettingsThemeContext.Provider>
      <WorkspaceStyles />
    </section>
  );
}
