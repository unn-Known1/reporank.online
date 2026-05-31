import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { getProfileByUserId, upsertProfile } from "@/lib/db/user-blog-profiles";

function sanitizeText(value: string, maxLen: number): string {
  return value.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim().slice(0, maxLen);
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const profile = await getProfileByUserId(user.id);
  return NextResponse.json({ profile });
}

export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const errors: string[] = [];

  const displayName = typeof body.display_name === "string" ? sanitizeText(body.display_name, 60) : undefined;
  if (displayName !== undefined && displayName.length < 1) {
    errors.push("display_name must be at least 1 character");
  }

  const bio = typeof body.bio === "string" ? sanitizeText(body.bio, 500) : undefined;

  const githubUrl = typeof body.github_url === "string" ? body.github_url.trim() : undefined;
  if (githubUrl && !isValidUrl(githubUrl)) {
    errors.push("github_url must be a valid URL");
  }

  const websiteUrl = typeof body.website_url === "string" ? body.website_url.trim() : undefined;
  if (websiteUrl && !isValidUrl(websiteUrl)) {
    errors.push("website_url must be a valid URL");
  }

  const avatarUrl = typeof body.avatar_url === "string" ? body.avatar_url.trim() : undefined;
  if (avatarUrl && !isValidUrl(avatarUrl)) {
    errors.push("avatar_url must be a valid URL");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
  }

  const profile = await upsertProfile(user.id, {
    display_name: displayName,
    bio,
    github_url: githubUrl,
    website_url: websiteUrl,
    avatar_url: avatarUrl,
  });

  if (!profile) {
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }

  return NextResponse.json({ profile });
}
