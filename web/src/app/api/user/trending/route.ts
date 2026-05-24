import { NextRequest, NextResponse } from "next/server";
import { getTrendingSnapshot } from "@/lib/db/trending";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const language = searchParams.get("language");
  const sort = (searchParams.get("sort") as "trending" | "top_rated") ?? "trending";

  const repos = await getTrendingSnapshot(language, sort);
  const generatedAt = repos.length > 0 ? repos[0].generated_at : new Date().toISOString();

  return NextResponse.json({
    repos,
    total: repos.length,
    generated_at: generatedAt,
  });
}
