import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { computeTrendingSnapshot } from "@/lib/db/trending";

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const result = await computeTrendingSnapshot();
  return NextResponse.json(
    {
      status: "completed",
      entries_count: result.entries.length,
      generated_at: result.generated_at,
    },
    { status: 200 }
  );
}
