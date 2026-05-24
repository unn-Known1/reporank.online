import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .rpc("increment_visitor_count");

  if (error) {
    return NextResponse.json({ error: "Failed to record visit" }, { status: 500 });
  }

  return NextResponse.json({ count: data });
}
