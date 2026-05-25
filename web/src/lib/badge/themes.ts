export interface BadgeThemeColors {
  brandBg: string;
  brandBgEnd: string;
  brandText: string;
  brandAccent: string;
  brandStroke: string;
  dividerLight: string;
  dividerDark: string;
  gradeBg: string;
}

export const THEMES: Record<string, BadgeThemeColors> = {
  "light": {
    brandBg: "#1e293b",
    brandBgEnd: "#0f172a",
    brandText: "#f1f5f9",
    brandAccent: "#06b6d4",
    brandStroke: "#334155",
    dividerLight: "rgba(255,255,255,0.2)",
    dividerDark: "rgba(0,0,0,0.1)",
    gradeBg: "rgba(0,0,0,0.15)",
  },
  "dark": {
    brandBg: "#e2e8f0",
    brandBgEnd: "#f1f5f9",
    brandText: "#0f172a",
    brandAccent: "#0891b2",
    brandStroke: "#94a3b8",
    dividerLight: "rgba(0,0,0,0.15)",
    dividerDark: "rgba(255,255,255,0.1)",
    gradeBg: "rgba(0,0,0,0.08)",
  },
};
