"use client";

import { useState, type ReactNode } from "react";
import type { BrowserTarget } from "@/lib/extension/constants";
import { extensionMeta } from "@/lib/extension/constants";

export default function BrowserCard({
  browser,
  icon,
}: {
  browser: BrowserTarget;
  icon: ReactNode;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    setError(false);
    try {
      const response = await fetch(browser.downloadUrl);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = browser.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch {
      setError(true);
      setTimeout(() => setError(false), 4000);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="group relative flex flex-col items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center transition-all duration-300 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-elevated)] hover:shadow-lg">
      <div className="mb-5 flex h-16 w-16 items-center justify-center">
        {icon}
      </div>

      <h3 className="mb-1 text-lg font-semibold text-[var(--color-text)]">
        {browser.name}
      </h3>

      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        Version {extensionMeta.version}
      </p>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90"
      >
        {downloading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Downloading...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download
          </>
        )}
      </button>

      {downloaded && (
        <p className="mt-3 text-xs font-medium text-green-600 dark:text-green-500">
          Download complete! See instructions below.
        </p>
      )}

      {error && (
        <p className="mt-3 text-xs font-medium text-red-500">
          Download failed. The package may not be published yet. Try again later.
        </p>
      )}
    </div>
  );
}


