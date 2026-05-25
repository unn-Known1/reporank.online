"use client";

import { createContext, useContext, useState, useCallback, useEffect, Suspense, type ReactNode } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

type RepoSelection = {
  owner: string;
  name: string;
  fullName: string;
};

type ComparisonContextType = {
  selectedRepos: RepoSelection[];
  addRepo: (owner: string, name: string) => void;
  removeRepo: (fullName: string) => void;
  clearAll: () => void;
  isSelected: (fullName: string) => boolean;
  count: number;
  maxSlots: number;
};

const MAX_SLOTS = 5;

const ComparisonContext = createContext<ComparisonContextType | null>(null);

function ComparisonProviderInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const parseFromUrl = (): RepoSelection[] => {
    const compare = searchParams.get("compare");
    if (!compare) return [];
    return compare.split(",").map((full) => {
      const [owner, name] = full.split("/");
      return { owner, name, fullName: full };
    }).filter((r) => r.owner && r.name);
  };

  const [selectedRepos, setSelectedRepos] = useState<RepoSelection[]>(parseFromUrl);

  useEffect(() => {
    const compare = searchParams.get("compare");
    if (!compare) {
      setSelectedRepos([]);
      return;
    }
    const repos = compare.split(",").map((full) => {
      const [owner, name] = full.split("/");
      return { owner, name, fullName: full };
    }).filter((r) => r.owner && r.name);
    setSelectedRepos(repos);
  }, [searchParams]);

  const updateUrl = useCallback((repos: RepoSelection[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (repos.length > 0) {
      params.set("compare", repos.map((r) => r.fullName).join(","));
    } else {
      params.delete("compare");
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  const addRepo = useCallback((owner: string, name: string) => {
    setSelectedRepos((prev) => {
      const fullName = `${owner}/${name}`;
      if (prev.some((r) => r.fullName === fullName)) return prev;
      if (prev.length >= MAX_SLOTS) {
        alert(`Maximum ${MAX_SLOTS} repos can be compared at once.`);
        return prev;
      }
      const next = [...prev, { owner, name, fullName }];
      updateUrl(next);
      return next;
    });
  }, [updateUrl]);

  const removeRepo = useCallback((fullName: string) => {
    setSelectedRepos((prev) => {
      const next = prev.filter((r) => r.fullName !== fullName);
      updateUrl(next);
      return next;
    });
  }, [updateUrl]);

  const clearAll = useCallback(() => {
    setSelectedRepos([]);
    updateUrl([]);
  }, [updateUrl]);

  const isSelected = useCallback((fullName: string) => {
    return selectedRepos.some((r) => r.fullName === fullName);
  }, [selectedRepos]);

  return (
    <ComparisonContext.Provider value={{
      selectedRepos,
      addRepo,
      removeRepo,
      clearAll,
      isSelected,
      count: selectedRepos.length,
      maxSlots: MAX_SLOTS,
    }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function ComparisonProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <ComparisonProviderInner>{children}</ComparisonProviderInner>
    </Suspense>
  );
}

export function useComparison() {
  const ctx = useContext(ComparisonContext);
  return ctx;
}
