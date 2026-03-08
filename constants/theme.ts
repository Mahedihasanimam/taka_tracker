export const theme = {
  colors: {
    primary: "#0D9488",
    primaryDark: "#0F766E",

    secondary: "#3b82f6",

    success: "#16a34a",
    successDark: "#15803d",

    warning: "#f59e0b",
    danger: "#ef4444",

    accent: "#FFD166",

    text: "#1f2937",
    mutedText: "#6b7280",

    background: "#f0fdfa",
    card: "#ffffff",
    border: "#e5e7eb",
  },

  gradients: {
    primary: ["#0D9488", "#0F766E"] as [string, string],
    success: ["#16a34a", "#15803d"] as [string, string],
  },
};

export type AppTheme = typeof theme;
