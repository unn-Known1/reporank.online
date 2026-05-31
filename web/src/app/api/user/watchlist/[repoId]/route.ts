import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { getWatchlistItem, removeFromWatchlist } from "@/lib/db/watchlist";

export async function GET(_req: Request, { params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const item = await getWatchlistItem(user.id, repoId);
  if (!item) {
    return NextResponse.json({ watching: false });
  }

  return NextResponse.json({
    watching: true,
    watchlist_item_id: item.id,
    added_at: item.added_at,
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const result = await removeFromWatchlist(user.id, repoId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ removed: true });
}
