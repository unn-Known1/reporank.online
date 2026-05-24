export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Check apps/web/.env.local for the full list of required vars.`
    );
  }
  return value;
}

export function validateEnvUrl(name: string): string {
  const value = requireEnv(name);
  if (!value.startsWith("https://")) {
    throw new Error(
      `Invalid URL for environment variable: ${name}. Must start with https://, got: ${value}`
    );
  }
  return value;
}

export function validateEnvKey(name: string, minLength = 10): string {
  const value = requireEnv(name);
  if (value.length < minLength) {
    throw new Error(
      `Invalid key for environment variable: ${name}. Must be at least ${minLength} characters, got ${value.length}`
    );
  }
  return value;
}
