import { NextResponse } from "next/server";
import { listBlogCategories } from "@/lib/blog/service";

export async function GET() {
  const categories = await listBlogCategories();
  return NextResponse.json({ categories });
}
