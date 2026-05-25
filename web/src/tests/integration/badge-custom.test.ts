import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderBadgeSvg } from "@/lib/badge/svg";
import { parseBadgeParams } from "@/lib/badge/badge-config";
import type { BadgeConfig } from "@/lib/badge/badge-config";

describe("badge config parsing", () => {
  it("parses style param", () => {
    const c = parseBadgeParams(new URL("http://localhost/api/badge/foo/bar?style=plastic"));
    expect(c.style).toBe("plastic");
  });

  it("falls back to flat for invalid style", () => {
    const c = parseBadgeParams(new URL("http://localhost/api/badge/foo/bar?style=invalid"));
    expect(c.style).toBe("flat");
  });

  it("parses theme param", () => {
    const c = parseBadgeParams(new URL("http://localhost/api/badge/foo/bar?theme=dark"));
    expect(c.theme).toBe("dark");
  });

  it("parses layout param", () => {
    const c = parseBadgeParams(new URL("http://localhost/api/badge/foo/bar?layout=compact"));
    expect(c.layout).toBe("compact");
  });

  it("parses show param", () => {
    const c = parseBadgeParams(new URL("http://localhost/api/badge/foo/bar?show=score"));
    expect(c.show).toBe("score");
  });

  it("parses subscore param", () => {
    const c = parseBadgeParams(new URL("http://localhost/api/badge/foo/bar?subscore=security"));
    expect(c.subscore).toBe("security");
  });

  it("ignores invalid subscore", () => {
    const c = parseBadgeParams(new URL("http://localhost/api/badge/foo/bar?subscore=nope"));
    expect(c.subscore).toBeNull();
  });

  it("parses label param truncated to 12 chars", () => {
    const c = parseBadgeParams(new URL("http://localhost/api/badge/foo/bar?label=MyCustomLabelHere"));
    expect(c.label).toBe("MyCustomLabe");
    expect(c.label.length).toBeLessThanOrEqual(12);
  });

  it("escapes HTML in label in rendered SVG", () => {
    const c = parseBadgeParams(new URL("http://localhost/api/badge/foo/bar?label=<script>"));
    expect(c.label).toBe("<script>");
    const svg = renderBadgeSvg({ ...c, scoreValue: 85 });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });

  it("parses valid color hex", () => {
    const c = parseBadgeParams(new URL("http://localhost/api/badge/foo/bar?color=6366f1"));
    expect(c.color).toBe("6366f1");
  });

  it("ignores invalid color hex", () => {
    const c = parseBadgeParams(new URL("http://localhost/api/badge/foo/bar?color=xyz"));
    expect(c.color).toBeNull();
  });

  it("parses animated param", () => {
    const c = parseBadgeParams(new URL("http://localhost/api/badge/foo/bar?animated=true"));
    expect(c.animated).toBe(true);
  });

  it("defaults animated to false", () => {
    const c = parseBadgeParams(new URL("http://localhost/api/badge/foo/bar"));
    expect(c.animated).toBe(false);
  });

  it("defaults all params when none provided", () => {
    const c = parseBadgeParams(new URL("http://localhost/api/badge/foo/bar"));
    expect(c.style).toBe("flat");
    expect(c.theme).toBe("light");
    expect(c.layout).toBe("standard");
    expect(c.show).toBe("both");
    expect(c.subscore).toBeNull();
    expect(c.label).toBe("REPORANK");
    expect(c.color).toBeNull();
    expect(c.animated).toBe(false);
  });
});

describe("custom badge SVG rendering — style presets", () => {
  const baseConfig = (overrides: Partial<BadgeConfig> = {}): BadgeConfig => ({
    label: "REPORANK",
    style: "flat",
    theme: "light",
    layout: "standard",
    show: "both",
    subscore: null,
    color: null,
    animated: false,
    scoreValue: 85,
    ...overrides,
  });

  it("renders flat style with score", () => {
    const svg = renderBadgeSvg(baseConfig({ style: "flat" }));
    expect(svg).toContain("REPORANK");
    expect(svg).toContain("85");
    expect(svg).toContain("A");
  });

  it("renders plastic style with shadow filter", () => {
    const svg = renderBadgeSvg(baseConfig({ style: "plastic" }));
    expect(svg).toContain("feDropShadow");
  });

  it("renders flat-square style without border radius", () => {
    const svg = renderBadgeSvg(baseConfig({ style: "flat-square" }));
    expect(svg).toContain('rx="0"');
  });

  it("renders for-the-badge style with larger dimensions", () => {
    const svg = renderBadgeSvg(baseConfig({ style: "for-the-badge" }));
    expect(svg).toContain('width="240"');
  });

  it("renders dark theme", () => {
    const svg = renderBadgeSvg(baseConfig({ theme: "dark" }));
    expect(svg).toContain("#e2e8f0");
  });

  it("renders compact layout", () => {
    const svg = renderBadgeSvg(baseConfig({ layout: "compact" }));
    expect(svg).toContain('width="160"');
  });

  it("renders expanded layout", () => {
    const svg = renderBadgeSvg(baseConfig({ layout: "expanded" }));
    expect(svg).toContain('width="260"');
  });

  it("renders score-only mode", () => {
    const svg = renderBadgeSvg(baseConfig({ show: "score" }));
    expect(svg).toContain("85");
    expect(svg).not.toContain("/100");
  });

  it("renders grade-only mode", () => {
    const svg = renderBadgeSvg(baseConfig({ show: "grade" }));
    expect(svg).toContain("A");
    expect(svg).not.toContain(">85<");
    expect(svg).not.toContain("/100");
  });

  it("renders custom label", () => {
    const svg = renderBadgeSvg(baseConfig({ label: "MYREPO" }));
    expect(svg).toContain("MYREPO");
  });

  it("renders with custom color override", () => {
    const svg = renderBadgeSvg(baseConfig({ color: "6366f1" }));
    expect(svg).toContain("6366f1");
  });

  it("renders animated badge with keyframes", () => {
    const svg = renderBadgeSvg(baseConfig({ animated: true }));
    expect(svg).toContain("@keyframes");
    expect(svg).toContain("rr-pulse");
    expect(svg).toContain("rr-glow");
  });

  it("renders em-dash for null score", () => {
    const svg = renderBadgeSvg(baseConfig({ scoreValue: null }));
    expect(svg).toContain("\u2014");
  });
});

describe("custom badge backward compatibility", () => {
  it("renders identical SVG for legacy renderBadgeSvg(score) call", () => {
    const legacy = renderBadgeSvg(85);
    const config: BadgeConfig = {
      label: "REPORANK",
      style: "flat",
      theme: "light",
      layout: "standard",
      show: "both",
      subscore: null,
      color: null,
      animated: false,
      scoreValue: 85,
    };
    const newStyle = renderBadgeSvg(config);
    expect(newStyle).toContain("85");
    expect(newStyle).toContain("A");
    expect(newStyle).toContain("REPORANK");
    expect(newStyle).toContain('width="200"');
  });

  it("renders identical SVG for legacy renderBadgeSvg(null) call", () => {
    const legacy = renderBadgeSvg(null);
    expect(legacy).toContain("\u2014");
    expect(legacy).toContain("#64748b"); // gray for null
  });
});

describe("custom badge SVG injection safety", () => {
  it("escapes special chars in label", () => {
    const config: BadgeConfig = {
      label: "<script>alert(1)",
      style: "flat",
      theme: "light",
      layout: "standard",
      show: "both",
      subscore: null,
      color: null,
      animated: false,
      scoreValue: 85,
    };
    const svg = renderBadgeSvg(config);
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });

  it("prevents SVG injection via parseBadgeParams", () => {
    const c = parseBadgeParams(new URL("http://localhost/api/badge/foo/bar?label=<script>alert(1)"));
    const svg = renderBadgeSvg({ ...c, scoreValue: 85 });
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });
});

describe("batch badge generation", () => {
  it("generates markdown for a single valid repo", () => {
    const repos = [{ owner: "facebook", name: "react" }];
    const qs = "";
    const snippets = repos.map(
      (r) =>
        `[![RepoRank](https://reporank.online/api/badge/${r.owner}/${r.name}.svg${qs})](https://reporank.online/github/${r.owner}/${r.name})`,
    );
    expect(snippets[0]).toContain("facebook/react");
    expect(snippets[0]).toContain("reporank.online/api/badge");
  });

  it("generates markdown with style param", () => {
    const repos = [{ owner: "vercel", name: "next.js" }];
    const qs = "?style=for-the-badge";
    const snippets = repos.map(
      (r) =>
        `[![RepoRank](https://reporank.online/api/badge/${r.owner}/${r.name}.svg${qs})](https://reporank.online/github/${r.owner}/${r.name})`,
    );
    expect(snippets[0]).toContain("?style=for-the-badge");
  });

  it("generates markdown for multiple repos", () => {
    const repos = [
      { owner: "facebook", name: "react" },
      { owner: "vercel", name: "next.js" },
    ];
    const qs = "?style=flat-square&theme=dark";
    const snippets = repos.map(
      (r) =>
        `[![RepoRank](https://reporank.online/api/badge/${r.owner}/${r.name}.svg${qs})](https://reporank.online/github/${r.owner}/${r.name})`,
    );
    expect(snippets).toHaveLength(2);
    expect(snippets[0]).toContain("facebook/react");
    expect(snippets[1]).toContain("vercel/next.js");
  });
});
