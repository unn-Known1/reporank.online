import { supabaseAdmin } from "@/lib/supabase/admin";

const MIN_WORD_COUNT = 100;
const MIN_WORD_COUNT_WARN = 200;
const NEW_ACCOUNT_HOURS = 24;
const DAILY_POST_LIMIT = 5;
const COOLDOWN_MINUTES = 15;

export interface SpamCheckResult {
  allowed: boolean;
  reason?: string;
}

export async function checkNewAccountCooldown(userId: string): Promise<SpamCheckResult> {
  const supabase = supabaseAdmin();
  const { data: user } = await supabase.auth.admin.getUserById(userId);
  if (!user?.user?.created_at) {
    return { allowed: false, reason: "Could not verify account age" };
  }

  const createdAt = new Date(user.user.created_at).getTime();
  const now = Date.now();
  const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

  if (hoursSinceCreation < NEW_ACCOUNT_HOURS) {
    const hoursLeft = Math.ceil(NEW_ACCOUNT_HOURS - hoursSinceCreation);
    return {
      allowed: false,
      reason: `Account too new. Please wait ${hoursLeft} more hour${hoursLeft === 1 ? "" : "s"} before posting.`,
    };
  }

  return { allowed: true };
}

export async function checkDailyPostLimit(userId: string): Promise<SpamCheckResult> {
  const supabase = supabaseAdmin();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", userId)
    .gte("created_at", since);

  if (error) {
    console.warn("[spam] checkDailyPostLimit:", error);
    return { allowed: true };
  }

  if (count && count >= DAILY_POST_LIMIT) {
    return { allowed: false, reason: "Daily post limit reached (max 5 per day)." };
  }

  return { allowed: true };
}

export async function checkPostCooldown(userId: string): Promise<SpamCheckResult> {
  const supabase = supabaseAdmin();
  const since = new Date(Date.now() - COOLDOWN_MINUTES * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("created_at")
    .eq("author_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.warn("[spam] checkPostCooldown:", error);
    return { allowed: true };
  }

  if (data && data.length > 0) {
    const lastPost = new Date(data[0].created_at).getTime();
    const remaining = COOLDOWN_MINUTES * 60 * 1000 - (Date.now() - lastPost);
    if (remaining > 0) {
      const minutesLeft = Math.ceil(remaining / 60000);
      return {
        allowed: false,
        reason: `Please wait ${minutesLeft} more minute${minutesLeft === 1 ? "" : "s"} before posting again.`,
      };
    }
  }

  return { allowed: true };
}

export function checkWordCount(body: string): SpamCheckResult {
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  if (wordCount < MIN_WORD_COUNT) {
    return { allowed: false, reason: `Post too short (${wordCount} words). Minimum is ${MIN_WORD_COUNT} words.` };
  }
  return { allowed: true };
}

export function checkWordCountWarning(body: string): boolean {
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  return wordCount < MIN_WORD_COUNT_WARN;
}

export async function checkAllSpamRules(userId: string, body: string): Promise<SpamCheckResult | null> {
  const wordCheck = checkWordCount(body);
  if (!wordCheck.allowed) return wordCheck;

  const cooldownCheck = await checkPostCooldown(userId);
  if (!cooldownCheck.allowed) return cooldownCheck;

  const dailyCheck = await checkDailyPostLimit(userId);
  if (!dailyCheck.allowed) return dailyCheck;

  const newAccountCheck = await checkNewAccountCooldown(userId);
  if (!newAccountCheck.allowed) return newAccountCheck;

  return null;
}
