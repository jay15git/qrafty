"use client";

import { createContext, useContext } from "react";

export const MobileSettingsDensityContext = createContext(false);

export function useMobileSettingsDensity() {
  return useContext(MobileSettingsDensityContext);
}
