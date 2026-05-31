import { NextRequest, NextResponse } from "next/server";
import { listBlogPosts, getBlogPostBySlug, createBlogPost } from "@/lib/blog/service";
import { getUser } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/blog/admin";
import { checkRateLimit } from "@/lib/ratelimit";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const includeDrafts = searchParams.get("include_drafts") === "true";

  if (includeDrafts) {
    const user = await getUser();
    if (!user || !isAdminEmail(user)) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
  }

  if (slug) {
    const post = await getBlogPostBySlug(slug);
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (post.status !== "published" && !includeDrafts) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(post);
  }

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10) || 20));
  const category = searchParams.get("category") || undefined;
  const type = searchParams.get("type") as "admin" | "user" | undefined;
  const author = searchParams.get("author") || undefined;
  const tag = searchParams.get("tag") || undefined;
  const sort = searchParams.get("sort") as "latest" | "popular" | undefined;

  const result = await listBlogPosts({ page, limit, category, includeDrafts, type, author, tag, sort });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 });
  }

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { allowed, retryAfterMs } = await checkRateLimit(user.id, "blog:");
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const body = await request.json();
  const result = await createBlogPost(body, user.id);

  if (!result.success) {
    const isServerError = result.errors.some((e: { field: string }) => e.field === "_");
    const isSpam = result.errors.some((e: { field: string }) => e.field === "spam");
    const status = isSpam ? 403 : isServerError ? 500 : 400;
    return NextResponse.json({ error: "Validation failed", errors: result.errors }, { status });
  }

  return NextResponse.json(result.post, { status: 201 });
}
