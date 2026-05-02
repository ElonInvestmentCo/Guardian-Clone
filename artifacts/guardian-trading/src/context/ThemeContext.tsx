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
  sidebar: "#0d0d0d",
  sidebarBorder: "#1a1a1a",
  sidebarItemHover: "rgba(255,255,255,0.04)",
  sidebarItemActive: "#3b82f6",
  sidebarItemActiveBg: "rgba(59,130,246,0.12)",
  sidebarText: "rgba(255,255,255,0.7)",
  sidebarTextMuted: "rgba(255,255,255,0.35)",
  topBar: "#0d0d0d",
  topBarBorder: "#1a1a1a",
  card: "#111111",
  cardBorder: "#1f1f1f",
  cardHover: "#1a1a1a",
  textPrimary: "#e2e8f0",
  textSub: "#94a3b8",
  textMuted: "#4a5568",
  inputBg: "#0d0d0d",
  inputBorder: "#222222",
  inputText: "#cbd5e1",
  inputFocusBorder: "#3b82f6",
  tableHead: "#0d0d0d",
  tableRowBorder: "#1a1a1a",
  tableHeaderText: "#4a5568",
  tableRowHoverBg: "#141414",
  filterBar: "#0d0d0d",
  filterActiveBg: "#1f1f1f",
  filterActiveText: "#e2e8f0",
  filterInactiveText: "#4a5568",
  divider: "#1a1a1a",
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
  rightPanel: "#0d0d0d",
  rightPanelBorder: "#1a1a1a",
  btnBg: "#111111",
  btnBorder: "#222222",
  btnText: "#94a3b8",
  settingsSectionActiveBg: "#1a1a1a",
  bellColor: "#94a3b8",
  scrollbar: "#222222",
  scrollbarHover: "#333333",
};

export const LIGHT_COLORS: ThemeColors = {
  bg: "#ffffff",
  sidebar: "#ffffff",
  sidebarBorder: "#e5e5e5",
  sidebarItemHover: "#f5f5f5",
  sidebarItemActive: "#3b82f6",
  sidebarItemActiveBg: "#eff6ff",
  sidebarText: "#334155",
  sidebarTextMuted: "#94a3b8",
  topBar: "#ffffff",
  topBarBorder: "#e5e5e5",
  card: "#ffffff",
  cardBorder: "#e5e5e5",
  cardHover: "#f5f5f5",
  textPrimary: "#000000",
  textSub: "#475569",
  textMuted: "#94a3b8",
  inputBg: "#ffffff",
  inputBorder: "#e5e5e5",
  inputText: "#000000",
  inputFocusBorder: "#3b82f6",
  tableHead: "#f5f5f5",
  tableRowBorder: "#f0f0f0",
  tableHeaderText: "#94a3b8",
  tableRowHoverBg: "#f5f5f5",
  filterBar: "#f5f5f5",
  filterActiveBg: "#ffffff",
  filterActiveText: "#000000",
  filterInactiveText: "#94a3b8",
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
  btnBorder: "#e5e5e5",
  btnText: "#475569",
  settingsSectionActiveBg: "#eff6ff",
  bellColor: "#475569",
  scrollbar: "#e5e5e5",
  scrollbarHover: "#cccccc",
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
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.style.background = theme === "light" ? "#ffffff" : "#000000";
      document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    const el = document.documentElement;
    el.classList.add("theme-transitioning");
    setTheme((t) => (t === "light" ? "dark" : "light"));
    window.setTimeout(() => el.classList.remove("theme-transitioning"), 500);
  };
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
