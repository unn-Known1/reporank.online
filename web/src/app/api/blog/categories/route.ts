import { NextResponse } from "next/server";
import { listBlogCategories } from "@/lib/blog/service";

export async function GET() {
  try {
    const categories = await listBlogCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[blog/categories]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
