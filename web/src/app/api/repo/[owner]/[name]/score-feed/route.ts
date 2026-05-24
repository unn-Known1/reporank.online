import { Feed } from "feed";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRepoByOwnerName } from "@/lib/db/repos";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://reporank.online";

export async function GET(_: Request, { params }: { params: { owner: string; name: string } }) {
  const repo = await getRepoByOwnerName(params.owner, params.name);
  if (!repo) {
    return new Response("Not found", { status: 404 });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("score_runs")
    .select("computed_at, total_score, subscores_json")
    .eq("repo_id", repo.id)
    .order("computed_at", { ascending: false })
    .limit(50);

  if (error) {
    console.warn("[score-feed] query error:", error);
    return new Response("Failed to fetch score history", { status: 500 });
  }

  const entries = data ?? [];
  const repoUrl = `${BASE_URL}/github/${params.owner}/${params.name}`;
  const updated = entries.length > 0 ? new Date(entries[0].computed_at) : new Date();

  const feed = new Feed({
    title: `${params.owner}/${params.name} — RepoRank Score History`,
    description: `Score history for ${params.owner}/${params.name} on RepoRank`,
    id: repoUrl,
    link: repoUrl,
    language: "en",
    updated,
    generator: "RepoRank",
  });

  for (const entry of entries) {
    feed.addItem({
      title: `Score: ${entry.total_score}/100`,
      id: `${repoUrl}/score-feed#${entry.computed_at}`,
      link: repoUrl,
      description: `RepoRank score for ${params.owner}/${params.name}: ${entry.total_score}/100`,
      content: `Maintenance: ${entry.subscores_json?.maintenance ?? "—"} · Community: ${entry.subscores_json?.community ?? "—"} · Security: ${entry.subscores_json?.security ?? "—"} · Documentation: ${entry.subscores_json?.documentation ?? "—"} · Adoption: ${entry.subscores_json?.adoption ?? "—"}`,
      date: new Date(entry.computed_at),
    });
  }

  return new Response(feed.atom1(), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
