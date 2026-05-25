import type { BadgeConfig } from "./badge-config";
import { STYLES, LAYOUTS } from "./styles";
import { THEMES } from "./themes";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getGrade(s: number | null): string {
  if (s == null) return "\u2014";
  if (s >= 85) return "A";
  if (s >= 70) return "B";
  if (s >= 50) return "C";
  if (s >= 30) return "D";
  return "F";
}

function getScoreColor(s: number | null): { bg: string; text: string; glow?: string } {
  if (s == null) return { bg: "#64748b", text: "#ffffff" };
  if (s >= 85) return { bg: "#059669", text: "#ffffff", glow: "#10b981" };
  if (s >= 70) return { bg: "#0891b2", text: "#ffffff", glow: "#06b6d4" };
  if (s >= 50) return { bg: "#d97706", text: "#ffffff", glow: "#f59e0b" };
  if (s >= 30) return { bg: "#ea580c", text: "#ffffff", glow: "#f97316" };
  return { bg: "#dc2626", text: "#ffffff", glow: "#ef4444" };
}

function animationStyles(uid: string): string {
  return `<style>
@keyframes rr-pulse-${uid} { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
@keyframes rr-glow-${uid} { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.3); } }
.rr-pulse-${uid} { animation: rr-pulse-${uid} 2s ease-in-out infinite; }
.rr-glow-${uid} { animation: rr-glow-${uid} 2s ease-in-out infinite; }
</style>`;
}

function resolveLayout(config: BadgeConfig) {
  const style = STYLES[config.style] ?? STYLES.flat;
  if (config.layout === "standard") {
    return { width: style.width, height: style.height, brandWidth: style.brandWidth, fontSize: style.fontSize };
  }
  const layout = LAYOUTS[config.layout] ?? LAYOUTS.standard;
  return { width: layout.width, height: layout.height, brandWidth: layout.brandWidth, fontSize: layout.fontSize };
}

function renderDefs(config: BadgeConfig, style: typeof STYLES.flat, theme: typeof THEMES.light, uid: string): string {
  const shadowFilter = style.shadow ? `<filter id="shadow-${uid}"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3"/></filter>` : "";
  return `
  <defs>
    <linearGradient id="brand-${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.brandBg}"/>
      <stop offset="100%" stop-color="${theme.brandBgEnd}"/>
    </linearGradient>
    <linearGradient id="score-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${config.color ?? getScoreColor(config.scoreValue).bg}"/>
      <stop offset="100%" stop-color="${config.color ?? (getScoreColor(config.scoreValue).glow ?? getScoreColor(config.scoreValue).bg)}"/>
    </linearGradient>
    ${shadowFilter}
    ${config.animated ? animationStyles(uid) : ""}
  </defs>`;
}

function renderBrandSection(config: BadgeConfig, layout: ReturnType<typeof resolveLayout>, style: typeof STYLES.flat, theme: typeof THEMES.light, uid: string): string {
  const h = layout.height;
  const r = style.borderRadius;
  const iconY = Math.round((h - 12) / 2);
  const brandFill = style.gradientBrand ? `url(#brand-${uid})` : theme.brandBg;
  const shadowAttr = style.shadow ? ` filter="url(#shadow-${uid})"` : "";

  return `
  <!-- Brand section -->
  <rect x="0" y="0" width="${layout.brandWidth}" height="${h}" rx="${r}" ry="${r}" fill="${brandFill}"${shadowAttr}/>
  <rect x="0" y="0" width="${layout.brandWidth}" height="${h}" rx="${r}" ry="${r}" fill="none" stroke="${theme.brandStroke}" stroke-width="0.5"/>

  <!-- Logo icon -->
  <g transform="translate(10, ${iconY})" class="${config.animated ? `rr-pulse-${uid}` : ""}">
    <rect width="12" height="12" rx="2" fill="none" stroke="${theme.brandAccent}" stroke-width="1.2"/>
    <path d="M3 9l3-3 3 3M3 6l3 3 3-3" stroke="${theme.brandAccent}" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Label text -->
  <text x="28" y="${Math.round(h * 0.62)}" fill="${theme.brandText}" font-family="'Segoe UI',system-ui,-apple-system,sans-serif" font-size="${layout.fontSize.label}" font-weight="700" letter-spacing="1">${escapeHtml(config.label)}</text>`;
}

function renderScoreSection(config: BadgeConfig, layout: ReturnType<typeof resolveLayout>, style: typeof STYLES.flat, theme: typeof THEMES.light, uid: string): string {
  const bw = layout.brandWidth;
  const h = layout.height;
  const scoreColor = getScoreColor(config.scoreValue);
  const scoreFill = style.gradientScore ? `url(#score-${uid})` : (config.color ?? scoreColor.bg);
  const animClass = config.animated ? ` rr-glow-${uid}` : "";

  return `
  <!-- Score section -->
  <rect x="${bw - 4}" y="0" width="${layout.width - bw + 4}" height="${h}" rx="0" ry="0" fill="${scoreFill}" class="${animClass}"/>
  <rect x="${bw - 4}" y="0" width="${layout.width - bw + 4}" height="${h}" fill="none" stroke="${config.color ?? scoreColor.bg}" stroke-width="0.5" stroke-opacity="0.5"/>

  <!-- Divider -->
  <line x1="${bw}" y1="1" x2="${bw}" y2="${h - 1}" stroke="${theme.dividerLight}" stroke-width="1"/>
  <line x1="${bw + 1}" y1="1" x2="${bw + 1}" y2="${h - 1}" stroke="${theme.dividerDark}" stroke-width="1"/>`;
}

function renderScoreContent(config: BadgeConfig, layout: ReturnType<typeof resolveLayout>, uid: string): string {
  const h = layout.height;
  const bw = layout.brandWidth;
  const grade = getGrade(config.scoreValue);
  const value = config.scoreValue == null ? "\u2014" : `${config.scoreValue}`;
  const scoreColor = getScoreColor(config.scoreValue);

  if (config.show === "grade") {
    return `
  <text x="${bw + Math.round((layout.width - bw) / 2)}" y="${Math.round(h * 0.7)}" fill="${scoreColor.text}" font-family="'Segoe UI',system-ui,-apple-system,sans-serif" font-size="${layout.fontSize.grade + 4}" font-weight="800" text-anchor="middle">${grade}</text>`;
  }

  if (config.show === "score") {
    return `
  <text x="${bw + Math.round((layout.width - bw) / 2)}" y="${Math.round(h * 0.7)}" fill="${scoreColor.text}" font-family="'Segoe UI',system-ui,-apple-system,sans-serif" font-size="${layout.fontSize.value}" font-weight="800" text-anchor="middle">${value}</text>`;
  }

  const scoreX = bw + (config.subscore ? 12 : 20);
  const gradeX = layout.width - (config.subscore ? 20 : 24);
  const slashOffset = value === "\u2014" ? 10 : (config.scoreValue != null && config.scoreValue >= 100 ? 28 : 22);

  return `
  <!-- Score value -->
  <text x="${scoreX}" y="${Math.round(h * 0.68)}" fill="${scoreColor.text}" font-family="'Segoe UI',system-ui,-apple-system,sans-serif" font-size="${layout.fontSize.value}" font-weight="800">${value}</text>

  <!-- /100 label -->
  <text x="${scoreX + slashOffset}" y="${Math.round(h * 0.68)}" fill="${scoreColor.text}" font-family="'Segoe UI',system-ui,-apple-system,sans-serif" font-size="${Math.round(layout.fontSize.value * 0.73)}" font-weight="500" fill-opacity="0.8">/100</text>

  <!-- Grade badge -->
  <rect x="${gradeX}" y="${Math.round((h - 14) / 2)}" width="18" height="14" rx="3" fill="rgba(0,0,0,0.15)"/>
  <text x="${gradeX + 9}" y="${Math.round(h * 0.67)}" fill="${scoreColor.text}" font-family="'Segoe UI',system-ui,-apple-system,sans-serif" font-size="${layout.fontSize.grade}" font-weight="800" text-anchor="middle">${grade}</text>`;
}

export function renderBadgeSvg(config: BadgeConfig, uid?: string): string;
export function renderBadgeSvg(score: number | null, uid?: string): string;
export function renderBadgeSvg(scoreOrConfig: number | null | BadgeConfig, uid = "a"): string {
  let config: BadgeConfig;
  if (typeof scoreOrConfig === "number" || scoreOrConfig === null) {
    config = {
      label: "REPORANK", style: "flat", theme: "light", layout: "standard",
      show: "both", subscore: null, color: null, animated: false,
      scoreValue: scoreOrConfig,
    };
  } else {
    config = scoreOrConfig;
  }

  const style = STYLES[config.style] ?? STYLES.flat;
  const theme = THEMES[config.theme] ?? THEMES.light;
  const layout = resolveLayout(config);
  const grade = getGrade(config.scoreValue);
  const value = config.scoreValue == null ? "\u2014" : `${config.scoreValue}`;
  const subLabel = config.subscore ? config.subscore.toUpperCase() : "";
  const ariaLabel = subLabel
    ? `RepoRank ${subLabel}: ${value} (${grade})`
    : `RepoRank: ${value} (${grade})`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" role="img" aria-label="${ariaLabel}">
${renderDefs(config, style, theme, uid)}
${renderBrandSection(config, layout, style, theme, uid)}
${renderScoreSection(config, layout, style, theme, uid)}
${renderScoreContent(config, layout, uid)}
</svg>`;
}
