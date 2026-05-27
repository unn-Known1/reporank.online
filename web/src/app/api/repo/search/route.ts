import { NextRequest, NextResponse } from "next/server";
import { searchRepos } from "@/lib/github/search";
import { getGitHubToken } from "@/lib/github/token";
import { checkRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed, retryAfterMs } = await checkRateLimit(ip, "search:", 30);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many searches. Please wait a moment." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }

    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ items: [] });
    }
    if (q.length > 200) {
      return NextResponse.json({ error: "Query too long" }, { status: 400 });
    }

    const { token } = await getGitHubToken();
    if (!token) {
      return NextResponse.json({ error: "No GitHub token configured" }, { status: 500 });
    }

    const items = await searchRepos(q, token, 8);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[search]", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
