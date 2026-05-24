const W = 200;
const H = 22;
const DIVIDER = 118;

function getGrade(s: number | null): string {
  if (s == null) return "—";
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

export function renderBadgeSvg(score: number | null, uid = "a"): string {
  const grade = getGrade(score);
  const { bg: scoreBg, text: scoreText, glow } = getScoreColor(score);
  const value = score == null ? "—" : `${score}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" role="img" aria-label="RepoRank: ${score ?? "—" } (${grade})">
  <defs>
    <linearGradient id="brand-${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="score-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${scoreBg}"/>
      <stop offset="100%" stop-color="${glow ?? scoreBg}"/>
    </linearGradient>
    <filter id="glow-${uid}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Brand section (left) -->
  <rect x="0" y="0" width="${DIVIDER}" height="${H}" rx="4" ry="4" fill="url(#brand-${uid})"/>
  <rect x="0" y="0" width="${DIVIDER}" height="${H}" rx="4" ry="4" fill="none" stroke="#334155" stroke-width="0.5"/>

  <!-- Logo icon -->
  <g transform="translate(10, 5)">
    <rect width="12" height="12" rx="2" fill="none" stroke="#06b6d4" stroke-width="1.2"/>
    <path d="M3 9l3-3 3 3M3 6l3 3 3-3" stroke="#06b6d4" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Brand text -->
  <text x="28" y="14" fill="#f1f5f9" font-family="'Segoe UI',system-ui,-apple-system,sans-serif" font-size="10" font-weight="700" letter-spacing="1">REPORANK</text>

  <!-- Score section (right) -->
  <rect x="${DIVIDER - 4}" y="0" width="${W - DIVIDER + 4}" height="${H}" rx="0" ry="0" fill="url(#score-${uid})"/>
  <rect x="${DIVIDER - 4}" y="0" width="${W - DIVIDER + 4}" height="${H}" fill="none" stroke="${glow ?? scoreBg}" stroke-width="0.5" stroke-opacity="0.5"/>

  <!-- Divider line with shadow effect -->
  <line x1="${DIVIDER}" y1="1" x2="${DIVIDER}" y2="${H - 1}" stroke="#ffffff" stroke-width="1" stroke-opacity="0.2"/>
  <line x1="${DIVIDER + 1}" y1="1" x2="${DIVIDER + 1}" y2="${H - 1}" stroke="#000000" stroke-width="1" stroke-opacity="0.1"/>

  <!-- Score value -->
  <text x="${DIVIDER + 20}" y="15" fill="${scoreText}" font-family="'Segoe UI',system-ui,-apple-system,sans-serif" font-size="11" font-weight="800">${value}</text>

  <!-- Score label -->
  <text x="${DIVIDER + 42}" y="15" fill="${scoreText}" font-family="'Segoe UI',system-ui,-apple-system,sans-serif" font-size="8" font-weight="500" fill-opacity="0.8">/100</text>

  <!-- Grade badge -->
  <rect x="${W - 24}" y="4" width="18" height="14" rx="3" fill="#000000" fill-opacity="0.15"/>
  <text x="${W - 15}" y="14" fill="${scoreText}" font-family="'Segoe UI',system-ui,-apple-system,sans-serif" font-size="9" font-weight="800" text-anchor="middle">${grade}</text>
</svg>`;
}
