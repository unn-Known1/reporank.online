import { generateWithAnthropic } from "./providers/anthropic";
import { generateWithOpenAI } from "./providers/openai";

type ProviderFn = (prompt: string, system: string, max: number, model?: string) => Promise<{ text: string; model: string } | null>;
type ProviderResult = { text: string; model: string; provider: string };

const PROVIDERS: Record<string, ProviderFn> = {
  anthropic: generateWithAnthropic,
  openai: generateWithOpenAI,
};

function resolveProvider(name: string): string | null {
  if (name && name in PROVIDERS) return name;
  return null;
}

function getAvailableProviders(): string[] {
  const providers: string[] = [];
  if (process.env.ANTHROPIC_API_KEY) providers.push("anthropic");
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  return providers;
}

export async function generateAiReviewText(
  prompt: string,
  systemPrompt: string,
  maxTokens = 1024,
  signal?: AbortSignal,
): Promise<ProviderResult | null> {
  const primary = process.env.AI_PRIMARY_PROVIDER ?? "anthropic";
  const fallbackModel = process.env.AI_FALLBACK_MODEL ?? "";

  const tryProvider = async (name: string, system?: string, model?: string): Promise<ProviderResult | null> => {
    const resolved = resolveProvider(name);
    if (!resolved) return null;
    const fn = PROVIDERS[resolved];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // Propagate external signal to internal controller
    const onExternalAbort = () => { controller.abort(); };
    signal?.addEventListener("abort", onExternalAbort, { once: true });

    try {
      const result = await fn(prompt, system ?? systemPrompt, maxTokens, model);
      return result ? { ...result, provider: resolved } : null;
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onExternalAbort);
    }
  };

  // Try primary provider
  const primaryResult = await tryProvider(primary);
  if (primaryResult) return primaryResult;

  console.warn(`[ai/dispatcher] Primary provider "${primary}" failed, trying simpler prompt`);

  // Retry primary with simpler system prompt
  const simpleSystem = "Output ONLY valid JSON matching the schema. No markdown.";
  const simpleResult = await tryProvider(primary, simpleSystem);
  if (simpleResult) return { ...simpleResult, provider: primary };

  // Try all other available providers automatically
  const available = getAvailableProviders().filter(p => p !== primary);
  for (const provider of available) {
    const model = fallbackModel || undefined;
    console.warn(`[ai/dispatcher] Primary retry failed, trying fallback "${provider}"${model ? ` with model ${model}` : ""}`);
    const result = await tryProvider(provider, undefined, model);
    if (result) return result;

    const simpleFallbackResult = await tryProvider(provider, simpleSystem, model);
    if (simpleFallbackResult) return { ...simpleFallbackResult, provider };
  }

  console.error("[ai/dispatcher] All providers failed");
  return null;
}
