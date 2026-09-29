"use client";

import { CanvasSurface } from "@/features/canvas/components/CanvasSurface";
import BlurFadeThemeTransition from "@/components/ui/BlurFadeThemeTransition";
import {
  WorkspaceChrome,
  type ThemeMode,
  type SettingsToolId,
} from "@/features/shell/components/WorkspaceChrome";
import { THEME_COOKIE, THEME_STORAGE_KEY } from "@/features/shell/model/theme";
import { SettingsThemeContext } from "@/features/shell/settings/theme-context";
import "@/features/canvas/workspace-tokens.css";
import "./workspace.css";
import { WorkspaceEntrance } from "@/features/shell/components/WorkspaceEntrance";
import { CuelumeProvider } from "@/features/shell/hooks/use-cuelume";
import { WORKSPACE_MOBILE_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";

type WorkspaceProps = {
  fontClassName?: string;
  initialTheme?: ThemeMode;
  initialActiveTool?: SettingsToolId;
};

const DEPLOYMENT_COMMIT_SHA =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? undefined;

function hasStoredTheme(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function Workspace({
  fontClassName,
  initialTheme = "dark",
  initialActiveTool,
}: WorkspaceProps) {
  const { theme: storedTheme, setTheme } = useTheme();
  // Without a stored preference next-themes reports its "light" default, which
  // would flip a first-visit dark workspace on mount — trust storedTheme only
  // when a preference actually exists; explicit toggles take the override path.
  const [override, setOverride] = useState<ThemeMode | null>(null);
  const theme: ThemeMode =
    override ??
    (hasStoredTheme() && (storedTheme === "light" || storedTheme === "dark")
      ? storedTheme
      : initialTheme);
  const isMobileWorkspace = useMediaQuery(WORKSPACE_MOBILE_QUERY);

  const onThemeChange = useCallback(
    (next: ThemeMode) => {
      setOverride(next);
      setTheme(next);
    },
    [setTheme],
  );

  useEffect(() => {
    if (!hasStoredTheme() && storedTheme !== initialTheme) {
      // First visit — seed next-themes (localStorage + html class) with the
      // cookie/SSR theme so the choice persists.
      setTheme(initialTheme);
      return;
    }
    document.cookie = `${THEME_COOKIE}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, [theme, storedTheme, initialTheme, setTheme]);

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
                fontClassName={fontClassName}
                initialActiveTool={initialActiveTool}
                onThemeChange={onThemeChange}
                boardToolbarVariant="zoom"
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
