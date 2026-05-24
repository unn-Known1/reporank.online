import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { addToWatchlist, getWatchlist } from "@/lib/db/watchlist";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const items = await getWatchlist(user.id);
  return NextResponse.json({ watchlist: items, total: items.length });
}

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
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
    return NextResponse.json({ error: "Repo not found. Search for it first." }, { status: 404 });
  }

  const result = await addToWatchlist(user.id, repo.id);
  if ("error" in result) {
    const status = result.error === "Already watching this repo" ? 409 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.data, { status: 201 });
}
