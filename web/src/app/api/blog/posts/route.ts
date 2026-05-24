import { NextRequest, NextResponse } from "next/server";
import { listBlogPosts, getBlogPostBySlug, createBlogPost } from "@/lib/blog/service";
import { getUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const includeDrafts = searchParams.get("include_drafts") === "true";

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

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const category = searchParams.get("category") || undefined;

  const result = await listBlogPosts({ page, limit, category, includeDrafts });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const result = await createBlogPost(body, user.id);

  if (!result.success) {
    const status = result.errors.some((e: { field: string }) => e.field === "_") ? 500 : 400;
    return NextResponse.json({ error: "Validation failed", errors: result.errors }, { status });
  }

  return NextResponse.json(result.post, { status: 201 });
}
