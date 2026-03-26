type ColorPalette = {
  primary: string;
  primaryDark: string;
  primaryTeal: string;
  primaryDeep: string;
  secondary: string;
  success: string;
  successDark: string;
  warning: string;
  danger: string;
  accent: string;
  text: string;
  mutedText: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  background: string;
  card: string;
  border: string;
  white: string;
  black: string;
  lightMint: string;
  lightSuccess: string;
  lightDanger: string;
  panelOverlay: string;
  overlay: string;
  overlayStrong: string;
  expense: string;
  income: string;
  categoryBlue: string;
  categoryPurple: string;
  categoryFood: string;
  categoryTransport: string;
  categoryShopping: string;
  categoryRent: string;
  categoryBills: string;
  categoryOther: string;
  purple: string;
  indigo: string;
  darkSlate: string;
  headingBlue: string;
  bgBlueLight: string;
  tealOverlay: string;
  indicatorGray: string;
  gray100: string;
  gray200: string;
  gray700: string;
  whiteSoft: string;
  redSoft: string;
  greenSoft: string;
  blueSoft: string;
  purpleSoft: string;
  teal50: string;
  emerald200: string;
  borderLight: string;
  lightSlate: string;
};

const baseColors: ColorPalette = {
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
};

type GradientPalette = {
  primary: [string, string];
  success: [string, string];
};

const baseGradients: GradientPalette = {
  primary: ["#0D9488", "#0F766E"],
  success: ["#16a34a", "#15803d"],
};

export const theme: { colors: ColorPalette; gradients: GradientPalette } = {
  colors: { ...baseColors },
  gradients: { ...baseGradients },
};

export type AppTheme = typeof theme;

export type ThemeTier = "free" | "premium";

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  tier: ThemeTier;
  previewGradient: [string, string];
  colors?: Partial<ColorPalette>;
  gradients?: Partial<GradientPalette>;
};

export const themePresets: ThemePreset[] = [
  {
    id: "emerald-dawn",
    name: "Emerald Dawn",
    description: "Balanced teal accents for focus",
    tier: "free",
    previewGradient: ["#0D9488", "#0F766E"],
  },
  {
    id: "midnight-indigo",
    name: "Midnight Indigo",
    description: "Moody dashboard with neon glow",
    tier: "free",
    previewGradient: ["#312E81", "#1E1B4B"],
    colors: {
      primary: "#4338CA",
      primaryDark: "#1E1B4B",
      accent: "#38BDF8",
      background: "#0F172A",
      card: "#1E293B",
      text: "#F8FAFC",
      mutedText: "#94A3B8",
      border: "#1E293B",
      lightMint: "#38BDF8",
      white: "#F8FAFC",
      whiteSoft: "#E2E8F0",
    },
    gradients: {
      primary: ["#312E81", "#1E1B4B"],
    },
  },
  {
    id: "sunset-neon",
    name: "Sunset Neon",
    description: "Vibrant orange with citrus glow",
    tier: "premium",
    previewGradient: ["#F97316", "#EA580C"],
    colors: {
      primary: "#EA580C",
      primaryDark: "#9A3412",
      accent: "#FCD34D",
      background: "#FFF7ED",
      card: "#FFFBEB",
      text: "#2B1A0B",
      mutedText: "#9A6C4A",
      border: "#FED7AA",
      lightMint: "#FDBA74",
      white: "#FFF7ED",
      whiteSoft: "#FFEAD1",
    },
    gradients: {
      primary: ["#FDBA74", "#EA580C"],
    },
  },
  {
    id: "violet-luxe",
    name: "Violet Luxe",
    description: "Editorial purples for premium feel",
    tier: "premium",
    previewGradient: ["#8B5CF6", "#6D28D9"],
    colors: {
      primary: "#7C3AED",
      primaryDark: "#581C87",
      accent: "#F472B6",
      background: "#F5F3FF",
      card: "#FFFFFF",
      text: "#2E1065",
      mutedText: "#7C3AED",
      border: "#DDD6FE",
      lightMint: "#C4B5FD",
      white: "#FFFFFF",
      whiteSoft: "#F3E8FF",
    },
    gradients: {
      primary: ["#8B5CF6", "#6D28D9"],
    },
  },
  {
    id: "aurora-bloom",
    name: "Aurora Bloom",
    description: "Iridescent blues with orchid glow",
    tier: "premium",
    previewGradient: ["#7C3AED", "#14B8A6"],
    colors: {
      primary: "#14B8A6",
      primaryDark: "#0F766E",
      accent: "#F472B6",
      background: "#F0FDFA",
      card: "#FFFFFF",
      text: "#0F172A",
      mutedText: "#64748B",
      border: "#D1FAE5",
      lightMint: "#99F6E4",
      white: "#FFFFFF",
      whiteSoft: "#ECFEFF",
    },
    gradients: {
      primary: ["#7C3AED", "#14B8A6"],
    },
  },
  {
    id: "noir-mint",
    name: "Noir Mint",
    description: "Jet black panels with neon mint lines",
    tier: "premium",
    previewGradient: ["#020617", "#065F46"],
    colors: {
      primary: "#10B981",
      primaryDark: "#064E3B",
      accent: "#FBBF24",
      background: "#020617",
      card: "#0F172A",
      text: "#F8FAFC",
      mutedText: "#94A3B8",
      border: "#1E293B",
      lightMint: "#34D399",
      white: "#F8FAFC",
      whiteSoft: "#1E293B",
    },
    gradients: {
      primary: ["#020617", "#065F46"],
    },
  },
];

export const DEFAULT_THEME_ID = themePresets[0].id;

export const getThemePreset = (id: string): ThemePreset => {
  return themePresets.find((preset) => preset.id === id) ?? themePresets[0];
};

export const applyThemePreset = (preset: ThemePreset): AppTheme => {
  const mergedColors: ColorPalette = {
    ...baseColors,
    ...(preset.colors || {}),
  };
  const mergedGradients: GradientPalette = {
    ...baseGradients,
    ...(preset.gradients || {}),
  };

  Object.entries(mergedColors).forEach(([key, value]) => {
    (theme.colors as Record<string, string>)[key] = value as string;
  });
  Object.entries(mergedGradients).forEach(([key, value]) => {
    (theme.gradients as Record<string, [string, string]>)[key] = value as [
      string,
      string,
    ];
  });

  return theme;
};
