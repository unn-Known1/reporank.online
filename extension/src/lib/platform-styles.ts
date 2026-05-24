export type Platform = "github" | "gitlab" | "npm"

export type PlatformStyles = {
  accentColor: string
  fontFamily: string
  borderRadius: string
  sidebarSelector: string
}

const STYLES: Record<Platform, PlatformStyles> = {
  github: {
    accentColor: "#0969da",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    borderRadius: "6px",
    sidebarSelector: '[data-turbo-frame="repo-content-turbo-frame"] .Layout-sidebar',
  },
  gitlab: {
    accentColor: "#FC6D26",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    borderRadius: "4px",
    sidebarSelector: ".project-page-sidebar",
  },
  npm: {
    accentColor: "#CB3837",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    borderRadius: "4px",
    sidebarSelector: "[data-sidebar]",
  },
}

export function getPlatformStyles(platform: Platform): PlatformStyles {
  return STYLES[platform]
}

export function detectPlatformFromUrl(url: string): Platform | null {
  if (url.includes("github.com")) return "github"
  if (url.includes("gitlab.com")) return "gitlab"
  if (url.includes("npmjs.com")) return "npm"
  return null
}
