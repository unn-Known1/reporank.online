import { extensionMeta } from "@/lib/extension/constants";
import BrowserCard from "@/components/extension/BrowserCard";
import BrowserIcons from "@/components/extension/BrowserIcons";
import InstallInstructions from "@/components/extension/InstallInstructions";

export default function ExtensionPage() {
  const { version, description, browsers } = extensionMeta;

  return (
    <section className="relative mx-auto max-w-5xl px-4 py-16">
      <div className="mb-14 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]">
          <span className="flex h-2 w-2 rounded-full bg-[var(--color-primary)]" />
          Browser Extension v{version}
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--color-text)] sm:text-5xl">
          RepoRank for Your Browser
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--color-text-secondary)]">
          {description}
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {browsers.map((browser) => (
          <BrowserCard
            key={browser.id}
            browser={browser}
            icon={BrowserIcons[browser.id]}
          />
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-2xl">
        <InstallInstructions browsers={browsers} />
      </div>
    </section>
  );
}
