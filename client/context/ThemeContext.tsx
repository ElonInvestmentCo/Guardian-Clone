import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";

export interface ThemeColors {
  bg: string;
  sidebar: string;
  sidebarBorder: string;
  sidebarItemHover: string;
  sidebarItemActive: string;
  sidebarItemActiveBg: string;
  sidebarText: string;
  sidebarTextMuted: string;
  topBar: string;
  topBarBorder: string;
  card: string;
  cardBorder: string;
  cardHover: string;
  textPrimary: string;
  textSub: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputFocusBorder: string;
  tableHead: string;
  tableRowBorder: string;
  tableHeaderText: string;
  tableRowHoverBg: string;
  filterBar: string;
  filterActiveBg: string;
  filterActiveText: string;
  filterInactiveText: string;
  divider: string;
  accent: string;
  accentHover: string;
  green: string;
  greenBg: string;
  red: string;
  redBg: string;
  yellow: string;
  yellowBg: string;
  purple: string;
  purpleBg: string;
  rightPanel: string;
  rightPanelBorder: string;
  btnBg: string;
  btnBorder: string;
  btnText: string;
  settingsSectionActiveBg: string;
  bellColor: string;
  scrollbar: string;
  scrollbarHover: string;
}

export const DARK_COLORS: ThemeColors = {
  bg: "#000000",
  sidebar: "#000000",
  sidebarBorder: "#1a1a1a",
  sidebarItemHover: "rgba(255,255,255,0.05)",
  sidebarItemActive: "#3b82f6",
  sidebarItemActiveBg: "rgba(59,130,246,0.12)",
  sidebarText: "rgba(255,255,255,0.85)",
  sidebarTextMuted: "rgba(255,255,255,0.4)",
  topBar: "#000000",
  topBarBorder: "#1a1a1a",
  card: "#0a0a0a",
  cardBorder: "#1a1a1a",
  cardHover: "#111111",
  textPrimary: "#ffffff",
  textSub: "rgba(255,255,255,0.6)",
  textMuted: "rgba(255,255,255,0.35)",
  inputBg: "#000000",
  inputBorder: "#262626",
  inputText: "rgba(255,255,255,0.85)",
  inputFocusBorder: "#3b82f6",
  tableHead: "#000000",
  tableRowBorder: "#1a1a1a",
  tableHeaderText: "rgba(255,255,255,0.35)",
  tableRowHoverBg: "#0d0d0d",
  filterBar: "#000000",
  filterActiveBg: "#1a1a1a",
  filterActiveText: "#ffffff",
  filterInactiveText: "rgba(255,255,255,0.35)",
  divider: "#1a1a1a",
  accent: "#3b82f6",
  accentHover: "#2563eb",
  green: "#22c55e",
  greenBg: "rgba(34,197,94,0.1)",
  red: "#ef4444",
  redBg: "rgba(239,68,68,0.1)",
  yellow: "#eab308",
  yellowBg: "rgba(234,179,8,0.1)",
  purple: "#a78bfa",
  purpleBg: "rgba(167,139,250,0.1)",
  rightPanel: "#000000",
  rightPanelBorder: "#1a1a1a",
  btnBg: "#0a0a0a",
  btnBorder: "#262626",
  btnText: "rgba(255,255,255,0.7)",
  settingsSectionActiveBg: "#111111",
  bellColor: "rgba(255,255,255,0.5)",
  scrollbar: "#262626",
  scrollbarHover: "#404040",
};

export const LIGHT_COLORS: ThemeColors = {
  bg: "#ffffff",
  sidebar: "#ffffff",
  sidebarBorder: "#e5e5e5",
  sidebarItemHover: "#f5f5f5",
  sidebarItemActive: "#3b82f6",
  sidebarItemActiveBg: "rgba(59,130,246,0.08)",
  sidebarText: "#000000",
  sidebarTextMuted: "rgba(0,0,0,0.45)",
  topBar: "#ffffff",
  topBarBorder: "#e5e5e5",
  card: "#ffffff",
  cardBorder: "#e5e5e5",
  cardHover: "#fafafa",
  textPrimary: "#000000",
  textSub: "rgba(0,0,0,0.6)",
  textMuted: "rgba(0,0,0,0.38)",
  inputBg: "#ffffff",
  inputBorder: "#d4d4d4",
  inputText: "#000000",
  inputFocusBorder: "#3b82f6",
  tableHead: "#fafafa",
  tableRowBorder: "#ebebeb",
  tableHeaderText: "rgba(0,0,0,0.4)",
  tableRowHoverBg: "#fafafa",
  filterBar: "#f5f5f5",
  filterActiveBg: "#ffffff",
  filterActiveText: "#000000",
  filterInactiveText: "rgba(0,0,0,0.4)",
  divider: "#e5e5e5",
  accent: "#3b82f6",
  accentHover: "#2563eb",
  green: "#16a34a",
  greenBg: "#f0fdf4",
  red: "#dc2626",
  redBg: "#fef2f2",
  yellow: "#d97706",
  yellowBg: "#fffbeb",
  purple: "#7c3aed",
  purpleBg: "#f5f3ff",
  rightPanel: "#ffffff",
  rightPanelBorder: "#e5e5e5",
  btnBg: "#ffffff",
  btnBorder: "#d4d4d4",
  btnText: "#000000",
  settingsSectionActiveBg: "rgba(59,130,246,0.06)",
  bellColor: "rgba(0,0,0,0.5)",
  scrollbar: "#d4d4d4",
  scrollbarHover: "#a3a3a3",
};

interface ThemeContextValue {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  colors: DARK_COLORS,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem("guardianTheme") as Theme) || "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("guardianTheme", theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const colors = theme === "light" ? LIGHT_COLORS : DARK_COLORS;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
