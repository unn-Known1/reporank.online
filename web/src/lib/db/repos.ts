import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { fetchRepoFactors } from "@/lib/github/graphql";
import { requireEnv } from "@/lib/env";

export async function getRepoByOwnerName(owner: string, name: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("repos")
    .select("*")
    .eq("platform", "github")
    .eq("owner", owner)
    .eq("name", name)
    .maybeSingle();
  if (error) {
    console.warn("[db] getRepoByOwnerName:", error);
    return null;
  }
  return data ?? null;
}

export async function upsertRepoFromGitHub(owner: string, name: string, token?: string): Promise<{ dbRepo: any; rawRepo: any }> {
  const effectiveToken = token ?? requireEnv("GITHUB_APP_TOKEN");
  const rawRepo = await fetchRepoFactors(owner, name, effectiveToken);

  const supabase = supabaseAdmin();
  const payload = {
    platform: "github",
    owner,
    name,
    full_name: rawRepo.nameWithOwner,
    description: rawRepo.description,
    stars: rawRepo.stargazerCount,
    forks: rawRepo.forkCount,
    watchers: rawRepo.watchers?.totalCount ?? 0,
    archived: rawRepo.isArchived,
    disabled: rawRepo.isDisabled,
    default_branch: rawRepo.defaultBranchRef?.name ?? null,
    last_fetched_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("repos")
    .upsert(payload, { onConflict: "platform,owner,name" })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to upsert repo:", { code: error.code, message: error.message, details: error.details });
    return { dbRepo: null, rawRepo };
  }
  return { dbRepo: data, rawRepo };
}

export async function getRecentRepos(limit = 100, offset = 0) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("repos")
    .select("owner, name, last_fetched_at")
    .not("last_fetched_at", "is", null)
    .order("last_fetched_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) {
    console.warn("[db] getRecentRepos:", error);
    return [];
  }
  return data ?? [];
}

export async function getRelatedRepos(language: string | null, excludeOwner: string, excludeName: string, limit = 5) {
  const supabase = supabaseAdmin();
  let query = supabase
    .from("repos")
    .select("id, owner, name, full_name, description, language, stars, forks")
    .not("last_fetched_at", "is", null)
    .neq("owner", excludeOwner)
    .neq("name", excludeName)
    .order("stars", { ascending: false })
    .limit(limit);
  if (language) {
    query = query.eq("language", language);
  }
  const { data, error } = await query;
  if (error) {
    console.warn("[db] getRelatedRepos:", error);
    return [];
  }
  return data ?? [];
}

export async function getRecentReposCount(): Promise<number> {
  const supabase = supabaseAdmin();
  const { count, error } = await supabase
    .from("repos")
    .select("*", { count: "exact", head: true })
    .not("last_fetched_at", "is", null);
  if (error) {
    console.warn("[db] getRecentReposCount:", error);
    return 0;
  }
  return count ?? 0;
}
