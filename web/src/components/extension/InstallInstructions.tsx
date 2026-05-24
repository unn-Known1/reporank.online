"use client";

import { useState } from "react";
import type { BrowserTarget } from "@/lib/extension/constants";

export default function InstallInstructions({
  browsers,
}: {
  browsers: BrowserTarget[];
}) {
  const [activeBrowser, setActiveBrowser] = useState<string | null>(null);

  return (
    <div>
      <h2 className="mb-6 text-center font-display text-2xl font-bold tracking-tight text-[var(--color-text)]">
        Installation Instructions
      </h2>

      <div className="mb-6 flex justify-center gap-2">
        {browsers.map((browser) => (
          <button
            key={browser.id}
            onClick={() =>
              setActiveBrowser(
                activeBrowser === browser.id ? null : browser.id,
              )
            }
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeBrowser === browser.id
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
            }`}
          >
            {browser.name}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {browsers.map((browser) => (
          <div
            key={browser.id}
            className={`overflow-hidden rounded-2xl border transition-all duration-500 ease-smooth ${
              activeBrowser === browser.id
                ? "max-h-96 border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] opacity-100"
                : "max-h-0 border-transparent opacity-0"
            }`}
          >
            <div className="p-6">
              <ol className="list-inside list-decimal space-y-3 text-sm text-[var(--color-text-secondary)]">
                {browser.installSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
        These instructions are for sideloading the extension while it awaits
        publication on the official extension stores. Once published, store
        links will be the preferred installation method.
      </p>
    </div>
  );
}
