"use client";

import { useState, useCallback, useMemo } from "react";
import BadgePreview from "./BadgePreview";

function buildParams(opts: {
  style: string; theme: string; layout: string; show: string;
  subscore: string; label: string; color: string; animated: boolean;
}): string {
  const p = new URLSearchParams();
  if (opts.style !== "flat") p.set("style", opts.style);
  if (opts.theme !== "light") p.set("theme", opts.theme);
  if (opts.layout !== "standard") p.set("layout", opts.layout);
  if (opts.show !== "both") p.set("show", opts.show);
  if (opts.subscore) p.set("subscore", opts.subscore);
  if (opts.label) p.set("label", opts.label);
  if (opts.color) p.set("color", opts.color);
  if (opts.animated) p.set("animated", "true");
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export default function BadgeBuilder() {
  const [input, setInput] = useState("");
  const [style, setStyle] = useState("flat");
  const [theme, setTheme] = useState("light");
  const [layout, setLayout] = useState("standard");
  const [show, setShow] = useState("both");
  const [subscore, setSubscore] = useState("");
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("");
  const [animated, setAnimated] = useState(false);
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => {
    const match = input.trim().match(/^(?:https?:\/\/[^/]+\/)?([^/]+)\/([^/\s]+)/);
    return match ? { owner: match[1], name: match[2].replace(/\.git$/, "") } : null;
  }, [input]);

  const params = useMemo(() => buildParams({ style, theme, layout, show, subscore, label, color, animated }), [style, theme, layout, show, subscore, label, color, animated]);

  const embedMarkdown = parsed
    ? `[![RepoRank](https://reporank.online/api/badge/${parsed.owner}/${parsed.name}.svg${params})](https://reporank.online/github/${parsed.owner}/${parsed.name})`
    : "";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [embedMarkdown]);

  return (
    <div className="badge-builder">
      <div className="badge-builder-form">
        <div className="badge-builder-field">
          <label htmlFor="repo-input" className="badge-builder-label">Repository</label>
          <input
            id="repo-input"
            type="text"
            placeholder="owner/repo or https://github.com/owner/repo"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="badge-builder-input"
          />
        </div>

        <div className="badge-builder-field">
          <label htmlFor="style-select" className="badge-builder-label">Style</label>
          <select id="style-select" value={style} onChange={(e) => setStyle(e.target.value)} className="badge-builder-select">
            <option value="flat">Flat</option>
            <option value="plastic">Plastic</option>
            <option value="flat-square">Flat-Square</option>
            <option value="for-the-badge">For the Badge</option>
          </select>
        </div>

        <div className="badge-builder-field">
          <label htmlFor="theme-select" className="badge-builder-label">Theme</label>
          <select id="theme-select" value={theme} onChange={(e) => setTheme(e.target.value)} className="badge-builder-select">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="badge-builder-field">
          <label htmlFor="layout-select" className="badge-builder-label">Layout</label>
          <select id="layout-select" value={layout} onChange={(e) => setLayout(e.target.value)} className="badge-builder-select">
            <option value="standard">Standard</option>
            <option value="compact">Compact</option>
            <option value="expanded">Expanded</option>
          </select>
        </div>

        <div className="badge-builder-field">
          <label htmlFor="show-select" className="badge-builder-label">Show</label>
          <select id="show-select" value={show} onChange={(e) => setShow(e.target.value)} className="badge-builder-select">
            <option value="both">Score + Grade</option>
            <option value="score">Score Only</option>
            <option value="grade">Grade Only</option>
          </select>
        </div>

        <div className="badge-builder-field">
          <label htmlFor="subscore-select" className="badge-builder-label">Sub-score</label>
          <select id="subscore-select" value={subscore} onChange={(e) => setSubscore(e.target.value)} className="badge-builder-select">
            <option value="">Total Score</option>
            <option value="maintenance">Maintenance</option>
            <option value="community">Community</option>
            <option value="security">Security</option>
            <option value="documentation">Documentation</option>
            <option value="adoption">Adoption</option>
          </select>
        </div>

        <div className="badge-builder-field">
          <label htmlFor="label-input" className="badge-builder-label">Custom Label</label>
          <input
            id="label-input"
            type="text"
            placeholder="REPORANK"
            maxLength={12}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="badge-builder-input"
          />
        </div>

        <div className="badge-builder-field">
          <label htmlFor="color-input" className="badge-builder-label">Color (hex)</label>
          <input
            id="color-input"
            type="text"
            placeholder="e.g. 6366f1"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="badge-builder-input"
          />
        </div>

        <div className="badge-builder-field badge-builder-field--checkbox">
          <input
            id="animated-check"
            type="checkbox"
            checked={animated}
            onChange={(e) => setAnimated(e.target.checked)}
          />
          <label htmlFor="animated-check" className="badge-builder-label">Animated</label>
        </div>
      </div>

      {parsed && (
        <div className="badge-builder-preview">
          <p className="badge-builder-section-title">Preview</p>
          <div className="badge-builder-badge-display">
            <BadgePreview owner={parsed.owner} name={parsed.name} params={params} />
          </div>

          <p className="badge-builder-section-title">Embed Markdown</p>
          <div className="badge-builder-code-block">
            <pre><code>{embedMarkdown}</code></pre>
            <button onClick={handleCopy} className="badge-builder-copy-btn">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
