import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/queue/redis", () => ({
  getRedis: () => { throw new Error("No Redis in test"); },
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    rpc: () => Promise.resolve({ data: null, error: new Error("No DB in test") }),
  }),
}));

const { checkRateLimit } = await import("@/lib/ratelimit");

describe("benchmark: rate limiter timing (in-memory fallback)", () => {
  const ITERATIONS = 1_000;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("completes checkRateLimit in <5ms for 1k sequential calls", async () => {
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      const result = await checkRateLimit(`127.0.0.${i % 256}`);
      expect(result.allowed).toBe(true);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5_000);
  });

  it("completes checkRateLimit in <5ms when rate-limited", async () => {
    const ip = "10.0.0.1";
    // Fill the rate limit window
    for (let i = 0; i < 10; i++) {
      await checkRateLimit(ip);
    }
    const start = performance.now();
    const result = await checkRateLimit(ip);
    const elapsed = performance.now() - start;
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(5);
  });

  it("handles concurrent rate limit checks", async () => {
    const ip = "10.0.0.2";
    const start = performance.now();
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) => checkRateLimit(`10.0.0.${i % 10}`))
    );
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
    const allowed = results.filter((r) => r.allowed).length;
    expect(allowed).toBeGreaterThan(0);
  });
});
