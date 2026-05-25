export type BadgeStyle = "flat" | "plastic" | "flat-square" | "for-the-badge";
export type BadgeTheme = "light" | "dark";
export type BadgeLayout = "standard" | "compact" | "expanded";
export type BadgeShow = "score" | "grade" | "both";
export type BadgeSubscore = "maintenance" | "community" | "security" | "documentation" | "adoption";

export interface BadgeConfig {
  label: string;
  style: BadgeStyle;
  theme: BadgeTheme;
  layout: BadgeLayout;
  show: BadgeShow;
  subscore: BadgeSubscore | null;
  color: string | null;
  animated: boolean;
  scoreValue: number | null;
}

const VALID_STYLES: BadgeStyle[] = ["flat", "plastic", "flat-square", "for-the-badge"];
const VALID_THEMES: BadgeTheme[] = ["light", "dark"];
const VALID_LAYOUTS: BadgeLayout[] = ["standard", "compact", "expanded"];
const VALID_SHOWS: BadgeShow[] = ["score", "grade", "both"];
const VALID_SUBSCORES: BadgeSubscore[] = [
  "maintenance", "community", "security", "documentation", "adoption",
];

function isValidHex(c: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c);
}

export function parseBadgeParams(url: URL): BadgeConfig {
  const rawStyle = url.searchParams.get("style") ?? "";
  const rawTheme = url.searchParams.get("theme") ?? "";
  const rawLayout = url.searchParams.get("layout") ?? "";
  const rawShow = url.searchParams.get("show") ?? "";
  const rawSubscore = url.searchParams.get("subscore") ?? "";
  const rawLabel = url.searchParams.get("label") ?? "";
  const rawColor = url.searchParams.get("color") ?? "";
  const rawAnimated = url.searchParams.get("animated") ?? "";

  const style: BadgeStyle = VALID_STYLES.includes(rawStyle as BadgeStyle)
    ? (rawStyle as BadgeStyle) : "flat";
  const theme: BadgeTheme = VALID_THEMES.includes(rawTheme as BadgeTheme)
    ? (rawTheme as BadgeTheme) : "light";
  const layout: BadgeLayout = VALID_LAYOUTS.includes(rawLayout as BadgeLayout)
    ? (rawLayout as BadgeLayout) : "standard";
  const show: BadgeShow = VALID_SHOWS.includes(rawShow as BadgeShow)
    ? (rawShow as BadgeShow) : "both";
  const subscore: BadgeSubscore | null = VALID_SUBSCORES.includes(rawSubscore as BadgeSubscore)
    ? (rawSubscore as BadgeSubscore) : null;
  const label = rawLabel.slice(0, 12) || "REPORANK";
  const color = rawColor && isValidHex(rawColor) ? rawColor : null;
  const animated = rawAnimated === "true";

  return { label, style, theme, layout, show, subscore, color, animated, scoreValue: null };
}
