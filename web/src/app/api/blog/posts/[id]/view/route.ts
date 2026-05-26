import { NextRequest, NextResponse } from "next/server";
import { incrementViewCount } from "@/lib/db/blog-posts";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await incrementViewCount(id);
  return new NextResponse(null, { status: 204 });
}
