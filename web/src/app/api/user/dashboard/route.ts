import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/db/dashboard";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const result = await getDashboardData(user.id);
  return NextResponse.json({
    items: result.items,
    total: result.total,
    last_updated: new Date().toISOString(),
  });
}
