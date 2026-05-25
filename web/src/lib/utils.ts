/**
 * Shared utility: parse a GitHub repo input string.
 * Accepts:
 *   - "owner/repo"
 *   - "https://github.com/owner/repo"
 *   - "github.com/owner/repo"
 * Returns null for invalid input.
 */
export function parseRepoInput(input: string): { owner: string; name: string } | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 200) return null;
  const githubUrlMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+?)(?:\.git)?(?:\/.*)?$/
  );
  if (githubUrlMatch) {
    const [, owner, name] = githubUrlMatch;
    return { owner, name };
  }
  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  const [owner, name] = parts;
  if (!/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(name)) return null;
  return { owner, name };
}
