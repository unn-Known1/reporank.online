import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const admin = supabaseAdmin();
    const { data, error } = await admin
      .rpc("increment_visitor_count");

    if (error) {
      return NextResponse.json({ error: "Failed to record visit" }, { status: 500 });
    }

    return NextResponse.json({ count: data });
  } catch (error) {
    console.error("[visit]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
