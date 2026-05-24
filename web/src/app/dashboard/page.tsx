import { supabaseServer, getUser } from "@/lib/supabase/server";
import DashboardView from "@/components/DashboardView";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/");

  const supabase = await supabaseServer();
  const { data: watchlist } = await supabase
    .from("watchlist_items")
    .select("*, repos(*)")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  const items = (watchlist ?? []).map((item) => {
    const repo = item.repos as any;
    return {
      id: item.id,
      repo_id: item.repo_id,
      owner: repo?.owner ?? "",
      name: repo?.name ?? "",
      full_name: repo?.full_name ?? "",
      language: repo?.language ?? null,
      stars: repo?.stars ?? 0,
      total_score: null as number | null,
      score_delta: null as number | null,
      delta_direction: null as "up" | "down" | "flat" | null,
      added_at: item.added_at,
      last_viewed_at: item.last_viewed_at,
    };
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Track your watched repositories
        </p>
      </div>
      <DashboardView initialItems={items} userId={user.id} />
    </main>
  );
}
