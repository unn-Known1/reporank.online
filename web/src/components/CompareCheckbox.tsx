"use client";

import { useComparison } from "@/lib/comparison-context";

type Props = {
  owner: string;
  name: string;
};

export default function CompareCheckbox({ owner, name }: Props) {
  const ctx = useComparison();
  if (!ctx) return null;
  const { addRepo, removeRepo, isSelected, count, maxSlots } = ctx;
  const fullName = `${owner}/${name}`;
  const selected = isSelected(fullName);

  const handleToggle = () => {
    if (selected) {
      removeRepo(fullName);
    } else {
      if (count >= maxSlots) {
        alert(`Maximum ${maxSlots} repos can be compared at once.`);
        return;
      }
      addRepo(owner, name);
    }
  };

  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-200">
      <input
        type="checkbox"
        checked={selected}
        onChange={handleToggle}
        className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] transition-colors duration-200 focus:ring-[var(--color-primary)]/20 focus:ring-1"
      />
      Compare
    </label>
  );
}
