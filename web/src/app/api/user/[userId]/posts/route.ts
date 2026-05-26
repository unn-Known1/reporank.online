import { NextRequest, NextResponse } from "next/server";
import { listBlogPosts } from "@/lib/blog/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const result = await listBlogPosts({
    page,
    limit,
    author: userId,
    includeDrafts: false,
  });

  return NextResponse.json(result);
}
