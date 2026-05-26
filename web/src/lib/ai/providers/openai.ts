import { requireEnv } from "@/lib/env";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";

export async function generateWithOpenAI(
  prompt: string,
  systemPrompt: string,
  maxTokens = 1024,
  modelOverride?: string,
  externalSignal?: AbortSignal,
): Promise<{ text: string; model: string } | null> {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const baseUrl = (process.env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = modelOverride ?? process.env.OPENAI_MODEL_ID ?? DEFAULT_MODEL;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const signal = externalSignal
        ? AbortSignal.any([controller.signal, externalSignal])
        : controller.signal;

      try {
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            temperature: 0,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!res.ok) {
          const txt = await res.text();
          if (res.status === 429 && attempt < 3) {
            const retryAfter = parseInt(res.headers.get("retry-after") ?? "5", 10);
            await new Promise(r => setTimeout(r, retryAfter * 1000));
            continue;
          }
          console.warn(`[ai/openai] API ${res.status}: ${txt}`);
          return null;
        }

        const json = await res.json();
        const text = json.choices?.[0]?.message?.content ?? "";
        if (!text) {
          console.warn("[ai/openai] Empty response");
          return null;
        }

        return { text, model };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.warn(`[ai/openai] Request timed out (attempt ${attempt}/3)`);
        if (attempt < 3) continue;
        return null;
      }
      console.error(`[ai/openai] Request failed (attempt ${attempt}/3):`, err);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
        continue;
      }
      return null;
    }
  }

  return null;
}
