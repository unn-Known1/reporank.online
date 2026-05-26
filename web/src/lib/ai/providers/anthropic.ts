import { requireEnv } from "@/lib/env";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const API_URL = "https://api.anthropic.com/v1/messages";

export async function generateWithAnthropic(
  prompt: string,
  systemPrompt: string,
  maxTokens = 1024,
  modelOverride?: string,
  externalSignal?: AbortSignal,
): Promise<{ text: string; model: string } | null> {
  const apiKey = requireEnv("ANTHROPIC_API_KEY");
  const model = modelOverride ?? process.env.CLAUDE_MODEL ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

  const lastError: unknown[] = [];

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const signal = externalSignal
        ? AbortSignal.any([controller.signal, externalSignal])
        : controller.signal;

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          signal,
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!res.ok) {
          const txt = await res.text();
          if (res.status === 429 && attempt < 3) {
            const retryAfter = parseInt(res.headers.get("retry-after") ?? "5", 10);
            lastError.push(new Error(`Rate limited, retry after ${retryAfter}s`));
            await new Promise(r => setTimeout(r, retryAfter * 1000));
            continue;
          }
          console.warn(`[ai/anthropic] API ${res.status}: ${txt}`);
          return null;
        }

        const json = await res.json();
        const text = json.content?.[0]?.text ?? "";
        if (!text) {
          console.warn("[ai/anthropic] Empty response");
          return null;
        }

        return { text, model };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.warn(`[ai/anthropic] Request timed out (attempt ${attempt}/3)`);
        lastError.push(err);
        if (attempt < 3) continue;
        return null;
      }
      console.error(`[ai/anthropic] Request failed (attempt ${attempt}/3):`, err);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
        continue;
      }
      return null;
    }
  }

  return null;
}
