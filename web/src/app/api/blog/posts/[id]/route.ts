import { NextRequest, NextResponse } from "next/server";
import { getBlogPostById, updateBlogPost, deleteBlogPost, checkPostOwnership } from "@/lib/blog/service";
import { getUser } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

function isAdminEmail(user: { email?: string | null }): boolean {
  return ADMIN_EMAILS.length > 0 && !!user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const includeDrafts = searchParams.get("include_drafts") === "true";

  if (includeDrafts) {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
  }

  const post = await getBlogPostById(id);

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (post.status !== "published" && !includeDrafts) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;

  const isOwner = await checkPostOwnership(id, user.id);
  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const result = await updateBlogPost(id, body);

  if (!result.success) {
    const isServerError = result.errors.some((e: { field: string }) => e.field === "_");
    const status = isServerError ? 500 : 400;
    return NextResponse.json({ error: "Validation failed", errors: result.errors }, { status });
  }

  return NextResponse.json(result.post);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;

  const isOwner = await checkPostOwnership(id, user.id);
  if (!isOwner && !isAdminEmail(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deleted = await deleteBlogPost(id);

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
