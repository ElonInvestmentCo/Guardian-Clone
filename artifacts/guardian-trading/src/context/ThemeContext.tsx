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
  bg: "#060b14",
  sidebar: "#0a1122",
  sidebarBorder: "#141f35",
  sidebarItemHover: "rgba(255,255,255,0.04)",
  sidebarItemActive: "#3b82f6",
  sidebarItemActiveBg: "rgba(59,130,246,0.12)",
  sidebarText: "rgba(255,255,255,0.7)",
  sidebarTextMuted: "rgba(255,255,255,0.35)",
  topBar: "#0a1122",
  topBarBorder: "#141f35",
  card: "#0d1526",
  cardBorder: "#161f35",
  cardHover: "#111c30",
  textPrimary: "#e2e8f0",
  textSub: "#94a3b8",
  textMuted: "#4a5568",
  inputBg: "#0a1020",
  inputBorder: "#1e293b",
  inputText: "#cbd5e1",
  inputFocusBorder: "#3b82f6",
  tableHead: "#0a1020",
  tableRowBorder: "#131c30",
  tableHeaderText: "#4a5568",
  tableRowHoverBg: "#111a2e",
  filterBar: "#0a1020",
  filterActiveBg: "#1e293b",
  filterActiveText: "#e2e8f0",
  filterInactiveText: "#4a5568",
  divider: "#141f35",
  accent: "#3b82f6",
  accentHover: "#2563eb",
  green: "#0ecb81",
  greenBg: "rgba(14,203,129,0.1)",
  red: "#f6465d",
  redBg: "rgba(246,70,93,0.1)",
  yellow: "#f0b90b",
  yellowBg: "rgba(240,185,11,0.1)",
  purple: "#a78bfa",
  purpleBg: "rgba(167,139,250,0.1)",
  rightPanel: "#0a1122",
  rightPanelBorder: "#141f35",
  btnBg: "#0d1526",
  btnBorder: "#1e293b",
  btnText: "#94a3b8",
  settingsSectionActiveBg: "#111c30",
  bellColor: "#94a3b8",
  scrollbar: "#1e293b",
  scrollbarHover: "#334155",
};

export const LIGHT_COLORS: ThemeColors = {
  bg: "#f1f5f9",
  sidebar: "#ffffff",
  sidebarBorder: "#e2e8f0",
  sidebarItemHover: "#f8fafc",
  sidebarItemActive: "#3b82f6",
  sidebarItemActiveBg: "#eff6ff",
  sidebarText: "#334155",
  sidebarTextMuted: "#94a3b8",
  topBar: "#ffffff",
  topBarBorder: "#e2e8f0",
  card: "#ffffff",
  cardBorder: "#e2e8f0",
  cardHover: "#f8fafc",
  textPrimary: "#0f172a",
  textSub: "#475569",
  textMuted: "#94a3b8",
  inputBg: "#ffffff",
  inputBorder: "#e2e8f0",
  inputText: "#334155",
  inputFocusBorder: "#3b82f6",
  tableHead: "#f8fafc",
  tableRowBorder: "#f1f5f9",
  tableHeaderText: "#94a3b8",
  tableRowHoverBg: "#f8fafc",
  filterBar: "#f1f5f9",
  filterActiveBg: "#ffffff",
  filterActiveText: "#0f172a",
  filterInactiveText: "#94a3b8",
  divider: "#e2e8f0",
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
  rightPanelBorder: "#e2e8f0",
  btnBg: "#ffffff",
  btnBorder: "#e2e8f0",
  btnText: "#475569",
  settingsSectionActiveBg: "#eff6ff",
  bellColor: "#475569",
  scrollbar: "#e2e8f0",
  scrollbarHover: "#cbd5e1",
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
