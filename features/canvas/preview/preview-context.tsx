"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

type PreviewRuntimeValue = {
  artboardScale: number;
  preferLowPowerShaders: boolean;
};

const PreviewRuntimeContext = createContext<PreviewRuntimeValue>({
  artboardScale: 1,
  preferLowPowerShaders: false,
});

export function PreviewRuntimeProvider({
  artboardScale,
  children,
  preferLowPowerShaders,
}: {
  artboardScale: number;
  children: ReactNode;
  preferLowPowerShaders: boolean;
}) {
  const value = useMemo(
    () => ({
      artboardScale,
      preferLowPowerShaders,
    }),
    [artboardScale, preferLowPowerShaders],
  );

  return <PreviewRuntimeContext.Provider value={value}>{children}</PreviewRuntimeContext.Provider>;
}

export function usePreviewRuntime() {
  return useContext(PreviewRuntimeContext);
}
