export const theme = {
  colors: {
    primary: "#0F766E",
    primaryDark: "#0F766E",
    primaryTeal: "#4E9F98",
    primaryDeep: "#3F3A8A",

    secondary: "#3b82f6",

    success: "#16a34a",
    successDark: "#15803d",

    warning: "#f59e0b",
    danger: "#ef4444",

    accent: "#FFD166",

    text: "#1f2937",
    mutedText: "#6b7280",
    gray300: "#d1d5db",
    gray400: "#9ca3af",
    gray500: "#6b7280",
    gray600: "#4b5563",

    background: "#f0fdfa",
    card: "#ffffff",
    border: "#e5e7eb",
    white: "#ffffff",
    black: "#000000",
    lightMint: "#99f6e4",
    lightSuccess: "#86efac",
    lightDanger: "#fca5a5",
    panelOverlay: "rgba(0,0,0,0.2)",
    overlay: "rgba(0,0,0,0.35)",
    overlayStrong: "rgba(0,0,0,0.5)",

    expense: "#ef4444",
    income: "#16a34a",
    categoryBlue: "#0ea5e9",
    categoryPurple: "#a855f7",

    categoryFood: "#f97316",
    categoryTransport: "#3b82f6",
    categoryShopping: "#a855f7",
    categoryRent: "#06b6d4",
    categoryBills: "#eab308",
    categoryOther: "#6b7280",
    purple: "#8b5cf6",
    indigo: "#6366f1",
    darkSlate: "#1f2937",
    headingBlue: "#1C3A5E",
    bgBlueLight: "#E4F3F6",
    tealOverlay: "#0D948818",
    indicatorGray: "#D1D5DB",
    gray100: "#f3f4f6",
    gray200: "#e5e7eb",
    gray700: "#374151",
    whiteSoft: "#f4f3f4",
    redSoft: "#fef2f2",
    greenSoft: "#f0fdf4",
    blueSoft: "#f0f9ff",
    purpleSoft: "#faf5ff",
    teal50: "#ecfeff",
    emerald200: "#bbf7d0",
    borderLight: "#eee",
    lightSlate: "#f8fafc",
  },

  gradients: {
    primary: ["#0D9488", "#0F766E"] as [string, string],
    success: ["#16a34a", "#15803d"] as [string, string],
  },
};

export type AppTheme = typeof theme;
