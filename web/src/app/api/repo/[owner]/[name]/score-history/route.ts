import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRepoByOwnerName } from "@/lib/db/repos";

export async function GET(request: Request, { params }: { params: Promise<{ owner: string; name: string }> }) {
  const { owner, name } = await params;
  const repo = await getRepoByOwnerName(owner, name);
  if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(parseInt(searchParams.get("days") ?? "90", 10) || 90, 1), 365);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("score_runs")
    .select("computed_at, total_score, subscores_json")
    .eq("repo_id", repo.id)
    .gte("computed_at", cutoff.toISOString())
    .order("computed_at", { ascending: true });

  if (error) {
    console.warn("[score-history] query error:", error);
    return NextResponse.json({ error: "Failed to fetch score history" }, { status: 500 });
  }

  const history = (data ?? []).map((row: any) => ({
    date: new Date(row.computed_at).toISOString().slice(0, 10),
    total_score: row.total_score,
    subscores: row.subscores_json as {
      maintenance: number;
      community: number;
      security: number;
      documentation: number;
      adoption: number;
    },
  }));

  return NextResponse.json(history, {
    status: 200,
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
