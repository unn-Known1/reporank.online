"use client";

type Props = {
  ownerName: string | null;
  repoOwner: string;
};

export default function MaintainerBanner({ ownerName, repoOwner }: Props) {
  if (!ownerName || ownerName !== repoOwner) return null;

  function handleWriteReview() {
    document.getElementById("review-section")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="mb-6 relative overflow-hidden rounded-xl border border-[var(--color-primary)]/20 bg-gradient-to-r from-[var(--color-primary)]/5 to-[var(--color-surface)] p-5">
      <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-primary)]/20 shadow-sm">
            <svg className="h-5 w-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--color-primary)]">
            You maintain this repo. Share your perspective with the community.
          </p>
        </div>
        <button
          onClick={handleWriteReview}
          className="rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 shadow-sm"
        >
          Write a review
        </button>
      </div>
    </div>
  );
}
