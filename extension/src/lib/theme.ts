import { useState, useEffect } from "react"

export function useSystemTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light"
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  })

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light")
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return theme
}

export function useResolvedTheme(preference: "system" | "light" | "dark"): "light" | "dark" {
  const systemTheme = useSystemTheme()
  return preference === "system" ? systemTheme : preference
}

export function getPageTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  const html = document.documentElement
  if (html.classList.contains("dark") || html.hasAttribute("data-color-mode")) {
    const mode = html.getAttribute("data-color-mode")
    if (mode === "dark" || mode === "light") return mode
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}
