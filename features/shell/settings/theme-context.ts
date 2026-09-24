import { createContext } from "react";

export const SettingsThemeContext = createContext<"light" | "dark">("dark");
