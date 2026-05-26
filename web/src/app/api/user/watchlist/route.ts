import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { addToWatchlist, getWatchlist } from "@/lib/db/watchlist";
import { upsertRepoFromGitHub } from "@/lib/db/repos";
import { getGitHubToken } from "@/lib/github/token";

export async function GET() {
  const supabase = await supabaseServer();
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const items = await getWatchlist(user.id);
  return NextResponse.json({ watchlist: items, total: items.length });
}

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { owner, name } = await req.json();
  if (!owner || !name) {
    return NextResponse.json({ error: "owner and name are required" }, { status: 400 });
  }

  const { data: repo } = await supabase
    .from("repos")
    .select("id")
    .eq("owner", owner)
    .eq("name", name)
    .maybeSingle();

  let repoId: string;
  // Auto-upsert: if repo is not in DB yet, fetch from GitHub API and insert
  if (repo) {
    repoId = repo.id;
  } else {
    const { token } = await getGitHubToken();
    const { dbRepo } = await upsertRepoFromGitHub(owner, name, token ?? undefined);
    if (!dbRepo) {
      return NextResponse.json({
        error: "Repo not found. Check the owner/repo name and try again.",
      }, { status: 404 });
    }
    repoId = dbRepo.id;
  }

  const result = await addToWatchlist(user.id, repoId);
  if ("error" in result) {
    const status = result.error === "Already watching this repo" ? 409 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = await supabaseServer();
  if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { owner, name } = await req.json();
  if (!owner || !name) {
    return NextResponse.json({ error: "owner and name are required" }, { status: 400 });
  }

  const { data: repo } = await supabase
    .from("repos")
    .select("id")
    .eq("owner", owner)
    .eq("name", name)
    .maybeSingle();

  if (!repo) {
    return NextResponse.json({ removed: true });
  }

  const { error } = await supabaseAdmin()
    .from("watchlist_items")
    .delete()
    .eq("user_id", user.id)
    .eq("repo_id", repo.id);

  if (error) {
    console.error("[watchlist] Failed to remove:", error);
    return NextResponse.json({ error: "Failed to remove from watchlist" }, { status: 500 });
  }

  return NextResponse.json({ removed: true });
}
