import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";

export interface ThemeColors {
  bg: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSub: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  tableHead: string;
  tableRowBorder: string;
  tableHeaderText: string;
  tableRowHoverBg: string;
  filterBar: string;
  filterActiveBg: string;
  filterActiveText: string;
  filterInactiveText: string;
  divider: string;
  statPortfolio: string;
  statPnl: string;
  statActivity: string;
  rightPanel: string;
  rightPanelBorder: string;
  btnBg: string;
  btnBorder: string;
  btnText: string;
  settingsSectionActiveBg: string;
  bellColor: string;
}

export const LIGHT_COLORS: ThemeColors = {
  bg: "#f0f2f5",
  card: "#ffffff",
  cardBorder: "#f0f0f0",
  textPrimary: "#111111",
  textSub: "#555555",
  textMuted: "#aaaaaa",
  inputBg: "#ffffff",
  inputBorder: "#e8e8e8",
  inputText: "#333333",
  tableHead: "#f9fafc",
  tableRowBorder: "#f9f9f9",
  tableHeaderText: "#aaaaaa",
  tableRowHoverBg: "#fafbfc",
  filterBar: "#f0f2f5",
  filterActiveBg: "#ffffff",
  filterActiveText: "#1c2e3e",
  filterInactiveText: "#888888",
  divider: "#f5f5f5",
  statPortfolio: "#e8f5f5",
  statPnl: "#fff0f0",
  statActivity: "#fffbeb",
  rightPanel: "#ffffff",
  rightPanelBorder: "#f0f0f0",
  btnBg: "#ffffff",
  btnBorder: "#dddddd",
  btnText: "#555555",
  settingsSectionActiveBg: "#f0f5ff",
  bellColor: "#555555",
};

export const DARK_COLORS: ThemeColors = {
  bg: "#0e1623",
  card: "#1a2537",
  cardBorder: "#263347",
  textPrimary: "#e8f0f8",
  textSub: "#8aa0b8",
  textMuted: "#5a7080",
  inputBg: "#111d2a",
  inputBorder: "#263347",
  inputText: "#c8daf0",
  tableHead: "#14202e",
  tableRowBorder: "#1a2d3e",
  tableHeaderText: "#5a7080",
  tableRowHoverBg: "#1e2d40",
  filterBar: "#0a1320",
  filterActiveBg: "#1a2537",
  filterActiveText: "#e8f0f8",
  filterInactiveText: "#5a7080",
  divider: "#1a2d3e",
  statPortfolio: "#0d2135",
  statPnl: "#250f1a",
  statActivity: "#221d0a",
  rightPanel: "#111d2a",
  rightPanelBorder: "#1e2f40",
  btnBg: "#1a2537",
  btnBorder: "#263347",
  btnText: "#8aa0b8",
  settingsSectionActiveBg: "#18253a",
  bellColor: "#8aa0b8",
};

interface ThemeContextValue {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  colors: LIGHT_COLORS,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem("guardianTheme") as Theme) || "light";
    } catch {
      return "light";
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
