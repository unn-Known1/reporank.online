const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

export function isAdminEmail(user: { email?: string | null }): boolean {
  return ADMIN_EMAILS.length > 0 && !!user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
}
