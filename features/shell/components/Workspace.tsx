"use client";

import { CanvasSurface } from "@/features/canvas/components/CanvasSurface";
import BlurFadeThemeTransition from "@/components/ui/BlurFadeThemeTransition";
import {
  WorkspaceChrome,
  type ThemeMode,
  type SettingsToolId,
} from "@/features/shell/components/WorkspaceChrome";
import { THEME_COOKIE } from "@/features/shell/model/theme";
import { SettingsThemeContext } from "@/features/shell/settings/theme-context";
import "@/features/canvas/workspace-tokens.css";
import "./workspace.css";
import { WorkspaceEntrance } from "@/features/shell/components/WorkspaceEntrance";
import { CuelumeProvider } from "@/features/shell/hooks/use-cuelume";
import { WORKSPACE_MOBILE_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

type WorkspaceProps = {
  fontClassName?: string;
  initialTheme?: ThemeMode;
  initialActiveTool?: SettingsToolId;
};

const DEPLOYMENT_COMMIT_SHA =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? undefined;

function applyThemeToDom(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.cookie = `${THEME_COOKIE}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function Workspace({
  fontClassName,
  initialTheme = "dark",
  initialActiveTool,
}: WorkspaceProps) {
  // SSR renders the cookie theme; the inline head script has already applied
  // it to <html>, so this state never fights hydration. LocalStorage is gone —
  // the cookie is the single persistence channel.
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);
  const isMobileWorkspace = useMediaQuery(WORKSPACE_MOBILE_QUERY);

  const onThemeChange = useCallback((next: ThemeMode) => {
    setTheme(next);
    applyThemeToDom(next);
  }, []);

  // Sync once on mount in case the cookie/theme drifted between SSR and
  // hydration (e.g. bfcache restore after a toggle on another tab).
  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

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
          <BlurFadeThemeTransition theme={theme} onThemeChange={onThemeChange}>
            <WorkspaceEntrance theme={theme}>
              <CanvasSurface
                theme={theme}
                initialActiveTool={initialActiveTool}
                onThemeChange={onThemeChange}
                renderOverlay={(controller) => (
                  <WorkspaceChrome
                    controller={controller}
                    theme={theme}
                    onThemeChange={onThemeChange}
                  />
                )}
              />
            </WorkspaceEntrance>
          </BlurFadeThemeTransition>
        </CuelumeProvider>
      </SettingsThemeContext.Provider>
    </section>
  );
}
