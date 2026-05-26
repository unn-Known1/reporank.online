const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;
const TAG_PATTERN = /^[a-z0-9]+(?:[- ][a-z0-9]+)*$/;

export interface TagValidationResult {
  valid: boolean;
  tags: string[];
  errors: string[];
}

export function normalizeTags(raw: string[]): string[] {
  return raw
    .map((t) =>
      t
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
    )
    .filter((t) => t.length > 0);
}

export function validateTags(raw: string[]): TagValidationResult {
  const errors: string[] = [];
  const tags = normalizeTags(raw);

  if (tags.length > MAX_TAGS) {
    errors.push(`Maximum ${MAX_TAGS} tags allowed`);
    return { valid: false, tags: tags.slice(0, MAX_TAGS), errors };
  }

  for (const tag of tags) {
    if (tag.length > MAX_TAG_LENGTH) {
      errors.push(`Tag "${tag}" is too long (max ${MAX_TAG_LENGTH} characters)`);
    }
    if (!TAG_PATTERN.test(tag)) {
      errors.push(`Tag "${tag}" contains invalid characters`);
    }
  }

  const unique = [...new Set(tags)];
  if (unique.length !== tags.length) {
    errors.push("Duplicate tags removed");
  }

  return { valid: errors.length === 0, tags: unique, errors };
}
