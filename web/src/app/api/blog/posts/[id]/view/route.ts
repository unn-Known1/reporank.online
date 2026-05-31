import { NextRequest, NextResponse } from "next/server";
import { incrementViewCount } from "@/lib/db/blog-posts";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const referer = request.headers.get("referer") || "";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "reporank.online";
  if (referer && !referer.includes(baseUrl)) {
    return new NextResponse(null, { status: 204 });
  }

  await incrementViewCount(id);
  return new NextResponse(null, { status: 204 });
}
